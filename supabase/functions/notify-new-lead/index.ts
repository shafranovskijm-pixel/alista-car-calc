import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const esc = (s: string | null | undefined) =>
  (s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { leadId } = await req.json();
    if (!leadId) {
      return new Response(JSON.stringify({ error: 'leadId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: settings } = await sb
      .from('email_settings')
      .select('notify_emails, notifications_enabled')
      .maybeSingle();

    if (!settings?.notifications_enabled) {
      return new Response(JSON.stringify({ ok: true, skipped: 'notifications_disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const recipients = (settings.notify_emails ?? []).filter(Boolean);
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no_recipients' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: lead } = await sb.from('leads').select('*').eq('id', leadId).maybeSingle();
    if (!lead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const crmUrl = `https://xn--80aagyfetipo1a0c.xn--p1ai/admin/leads/${lead.id}`;
    const subject = `Новая заявка: ${lead.full_name ?? '—'}`;

    const rows: [string, string | null | undefined][] = [
      ['ФИО', lead.full_name],
      ['Телефон', lead.phone],
      ['Email', lead.email],
      ['Источник', lead.source],
      ['Сообщение', lead.message],
      ['Страница', lead.page_url],
      ['utm_source', lead.utm_source],
      ['utm_medium', lead.utm_medium],
      ['utm_campaign', lead.utm_campaign],
    ];

    const tableRows = rows
      .filter(([, v]) => v)
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 12px 6px 0;color:#888;vertical-align:top;">${esc(k)}</td><td style="padding:6px 0;">${esc(String(v))}</td></tr>`,
      )
      .join('');

    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
  <div style="padding:18px 24px;border-bottom:1px solid #eef0f4;">
    <div style="font-size:11px;letter-spacing:1px;color:#6b7280;">CRM ALISTA</div>
    <h1 style="margin:6px 0 0;font-size:20px;color:#0f172a;">Новая заявка</h1>
  </div>
  <div style="padding:18px 24px;">
    <table style="width:100%;font-size:14px;color:#0f172a;border-collapse:collapse;">${tableRows}</table>
  </div>
  <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #eef0f4;font-size:13px;">
    <a href="${crmUrl}" style="color:#2563eb;text-decoration:none;font-weight:600;">Открыть в CRM →</a>
  </div>
</div>
</body></html>`;

    const text = rows
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n') + `\n\nОткрыть: ${crmUrl}`;

    const sendRes = await fetch(`${SUPABASE_URL}/functions/v1/send-smtp-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': SERVICE_ROLE,
      },
      body: JSON.stringify({
        to: recipients,
        subject,
        text,
        html,
        kind: 'notification',
        leadId: lead.id,
      }),
    });
    const sendJson = await sendRes.json().catch(() => ({}));
    return new Response(JSON.stringify({ ok: sendRes.ok, send: sendJson }), {
      status: sendRes.ok ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});