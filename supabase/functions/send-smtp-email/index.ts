import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

type Attachment = {
  name: string;
  contentBase64: string;
  contentType?: string;
};

type Payload = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  kind?: 'notification' | 'document' | 'test' | 'other';
  documentId?: string;
  leadId?: string;
  attachments?: Attachment[];
};

const SMTP_USER = Deno.env.get('SMTP_USER');
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD');
const SMTP_FROM = Deno.env.get('SMTP_FROM') ?? SMTP_USER ?? '';
const SMTP_HOST = Deno.env.get('SMTP_HOST') ?? 'mail.timeweb.com';
const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') ?? '465');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const logEmail = async (row: {
  recipient: string;
  subject: string;
  status: string;
  error?: string | null;
  kind?: string;
  document_id?: string | null;
  lead_id?: string | null;
  sent_by?: string | null;
}) => {
  await sb.from('email_log').insert({
    recipient: row.recipient,
    subject: row.subject,
    status: row.status,
    error: row.error ?? null,
    kind: row.kind ?? 'other',
    document_id: row.document_id ?? null,
    lead_id: row.lead_id ?? null,
    sent_by: row.sent_by ?? null,
  });
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!SMTP_USER || !SMTP_PASSWORD) {
    return json({ error: 'SMTP credentials are not configured' }, 500);
  }

  // Identify caller (admin auth required, or internal service token).
  const authHeader = req.headers.get('Authorization') ?? '';
  const internalToken = req.headers.get('x-internal-token');
  const isInternal = internalToken && internalToken === SERVICE_ROLE;
  let sentBy: string | null = null;

  if (!isInternal) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Unauthorized' }, 401);
    const { data: u, error: uErr } = await sb.auth.getUser(token);
    if (uErr || !u?.user) return json({ error: 'Unauthorized' }, 401);
    sentBy = u.user.id;
    // role check
    const { data: roles } = await sb
      .from('user_roles')
      .select('role')
      .eq('user_id', u.user.id);
    const allowed = (roles ?? []).some((r: { role: string }) =>
      ['admin', 'manager'].includes(r.role),
    );
    if (!allowed) return json({ error: 'Forbidden' }, 403);
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const recipients = (Array.isArray(body.to) ? body.to : [body.to])
    .map((s) => (s ?? '').toString().trim())
    .filter(Boolean);

  if (recipients.length === 0) return json({ error: 'Recipient is required' }, 400);
  if (recipients.some((r) => !isValidEmail(r)))
    return json({ error: 'Invalid recipient email' }, 400);
  if (!body.subject || body.subject.length > 300)
    return json({ error: 'Subject is required (max 300 chars)' }, 400);
  if (!body.text && !body.html) return json({ error: 'Body is required' }, 400);

  // Resolve document attachment if requested by id.
  const attachments: { name: string; data: Uint8Array; type?: string }[] = [];
  let documentId: string | null = body.documentId ?? null;

  if (body.documentId) {
    const { data: doc, error: docErr } = await sb
      .from('documents')
      .select('id, storage_path, mime_type, title')
      .eq('id', body.documentId)
      .maybeSingle();
    if (docErr || !doc) return json({ error: 'Document not found' }, 404);
    const path: string = doc.storage_path;
    const { data: file, error: dlErr } = await sb.storage.from('documents').download(path);
    if (dlErr || !file) return json({ error: 'Cannot download document' }, 500);
    const buf = new Uint8Array(await file.arrayBuffer());
    if (buf.byteLength > MAX_ATTACHMENT_BYTES) {
      // Replace attachment with signed link.
      const { data: signed } = await sb.storage
        .from('documents')
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      const link = signed?.signedUrl ?? '';
      const note = `\n\nФайл слишком большой для вложения. Скачайте по ссылке (действует 7 дней):\n${link}`;
      body.text = (body.text ?? '') + note;
      if (body.html) body.html = `${body.html}<p>Файл во вложении заменён ссылкой: <a href="${link}">${link}</a></p>`;
    } else {
      const baseName = path.split('/').pop() || `${doc.title ?? 'document'}.pdf`;
      attachments.push({
        name: baseName,
        data: buf,
        type: doc.mime_type || file.type || 'application/octet-stream',
      });
    }
  }

  // Provided base64 attachments.
  for (const a of body.attachments ?? []) {
    try {
      const bin = Uint8Array.from(atob(a.contentBase64), (c) => c.charCodeAt(0));
      if (bin.byteLength > MAX_ATTACHMENT_BYTES) continue;
      attachments.push({ name: a.name, data: bin, type: a.contentType });
    } catch {
      return json({ error: 'Invalid attachment encoding' }, 400);
    }
  }

  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: true,
      auth: {
        username: SMTP_USER,
        password: SMTP_PASSWORD,
      },
    },
  });

  // Get from-name from settings (fallback to env).
  let fromName = 'Alista';
  const { data: settings } = await sb.from('email_settings').select('from_name').maybeSingle();
  if (settings?.from_name) fromName = settings.from_name;

  const fromHeader = `${fromName} <${SMTP_FROM}>`;

  const recipient = recipients.join(', ');
  let status = 'sent';
  let err: string | null = null;

  try {
    await client.send({
      from: fromHeader,
      to: recipients,
      subject: body.subject,
      content: body.text ?? body.html?.replace(/<[^>]+>/g, ' ') ?? '',
      html: body.html,
      attachments: attachments.map((a) => ({
        filename: a.name,
        content: a.data,
        contentType: a.type ?? 'application/octet-stream',
        encoding: 'binary' as const,
      })),
    });
    await client.close();
  } catch (e) {
    status = 'failed';
    err = (e as Error).message ?? String(e);
    try { await client.close(); } catch { /* ignore */ }
  }

  await logEmail({
    recipient,
    subject: body.subject,
    status,
    error: err,
    kind: body.kind ?? 'other',
    document_id: documentId,
    lead_id: body.leadId ?? null,
    sent_by: sentBy,
  });

  if (status === 'failed') return json({ error: err ?? 'SMTP failed' }, 502);
  return json({ ok: true });
});