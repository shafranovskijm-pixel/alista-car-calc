import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import { ImapFlow } from 'npm:imapflow@1.0.164';
import { simpleParser } from 'npm:mailparser@3.7.1';

// Timeweb Cloud IMAP: imap.timeweb.ru:993 (SSL)
// See https://timeweb.cloud/docs/mail/email-clients-configuration
const IMAP_HOST = 'imap.timeweb.ru';
const IMAP_PORT = 993;
const IMAP_USER = Deno.env.get('SMTP_USER')!;
const IMAP_PASS = Deno.env.get('SMTP_PASSWORD')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const authorize = async (req: Request): Promise<{ ok: boolean; error?: string }> => {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, error: 'Unauthorized' };
  const { data: u, error } = await sb.auth.getUser(token);
  if (error || !u?.user) return { ok: false, error: 'Unauthorized' };
  const { data: roles } = await sb.from('user_roles').select('role').eq('user_id', u.user.id);
  const allowed = (roles ?? []).some((r: { role: string }) => ['admin', 'manager'].includes(r.role));
  return allowed ? { ok: true } : { ok: false, error: 'Forbidden' };
};

const openClient = () =>
  new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: IMAP_USER, pass: IMAP_PASS },
    logger: false,
  });

const listMessages = async (mailbox: string, limit: number) => {
  const client = openClient();
  await client.connect();
  const lock = await client.getMailboxLock(mailbox);
  try {
    const status = await client.status(mailbox, { messages: true, unseen: true });
    const total = Number(status.messages ?? 0);
    if (!total) return { total: 0, unseen: 0, messages: [] };
    const from = Math.max(1, total - limit + 1);
    const seq = `${from}:${total}`;
    const messages: {
      uid: number;
      seq: number;
      subject: string;
      from: string;
      to: string;
      date: string | null;
      preview: string;
      unseen: boolean;
      hasAttachments: boolean;
    }[] = [];
    for await (const msg of client.fetch(seq, {
      uid: true,
      envelope: true,
      flags: true,
      bodyStructure: true,
      internalDate: true,
    })) {
      const flags = msg.flags ?? new Set();
      const from = msg.envelope?.from?.[0];
      const to = msg.envelope?.to?.[0];
      const bs = msg.bodyStructure as { childNodes?: { disposition?: string }[] } | undefined;
      const hasAttachments =
        !!bs?.childNodes?.some((n) => (n.disposition ?? '').toLowerCase() === 'attachment');
      messages.push({
        uid: Number(msg.uid),
        seq: Number(msg.seq),
        subject: msg.envelope?.subject ?? '(без темы)',
        from: from ? `${from.name ?? ''} <${from.address ?? ''}>`.trim() : '',
        to: to ? `${to.name ?? ''} <${to.address ?? ''}>`.trim() : '',
        date: (msg.envelope?.date ?? msg.internalDate ?? null)?.toString() ?? null,
        preview: '',
        unseen: !(flags as Set<string>).has('\\Seen'),
        hasAttachments,
      });
    }
    messages.sort((a, b) => b.uid - a.uid);
    return { total, unseen: Number(status.unseen ?? 0), messages };
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }
};

const fetchMessage = async (mailbox: string, uid: number, markSeen: boolean) => {
  const client = openClient();
  await client.connect();
  const lock = await client.getMailboxLock(mailbox);
  try {
    const msg = await client.fetchOne(String(uid), { source: true, envelope: true }, { uid: true });
    if (!msg?.source) return null;
    const parsed = await simpleParser(msg.source as unknown as Buffer);
    if (markSeen) {
      try { await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true }); } catch { /* noop */ }
    }
    return {
      uid,
      subject: parsed.subject ?? '(без темы)',
      from: parsed.from?.text ?? '',
      to: parsed.to && !Array.isArray(parsed.to) ? parsed.to.text : Array.isArray(parsed.to) ? parsed.to.map((t) => t.text).join(', ') : '',
      date: parsed.date?.toISOString() ?? null,
      text: parsed.text ?? '',
      html: parsed.html || null,
      attachments: (parsed.attachments ?? []).map((a) => ({
        filename: a.filename ?? 'file',
        contentType: a.contentType ?? 'application/octet-stream',
        size: a.size ?? 0,
      })),
    };
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }
};

const deleteMessage = async (mailbox: string, uid: number) => {
  const client = openClient();
  await client.connect();
  const lock = await client.getMailboxLock(mailbox);
  try {
    await client.messageDelete(String(uid), { uid: true });
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (!IMAP_USER || !IMAP_PASS) return json({ error: 'IMAP credentials are not configured' }, 500);

  const auth = await authorize(req);
  if (!auth.ok) return json({ error: auth.error }, auth.error === 'Forbidden' ? 403 : 401);

  let body: {
    action?: 'list' | 'fetch' | 'delete';
    mailbox?: string;
    uid?: number;
    limit?: number;
    markSeen?: boolean;
  };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const mailbox = body.mailbox ?? 'INBOX';

  try {
    if (body.action === 'fetch') {
      if (!body.uid) return json({ error: 'uid is required' }, 400);
      const msg = await fetchMessage(mailbox, body.uid, body.markSeen ?? true);
      if (!msg) return json({ error: 'Not found' }, 404);
      return json({ message: msg });
    }
    if (body.action === 'delete') {
      if (!body.uid) return json({ error: 'uid is required' }, 400);
      await deleteMessage(mailbox, body.uid);
      return json({ ok: true });
    }
    const limit = Math.min(Math.max(body.limit ?? 30, 1), 100);
    const result = await listMessages(mailbox, limit);
    return json(result);
  } catch (e) {
    console.error('mailbox error', e);
    return json({ error: (e as Error).message ?? String(e) }, 502);
  }
});