// Admin-only management of the Telegram channel import. Validates the caller's
// JWT and the admin role itself; never returns the bot token.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { redactToken } from '../_shared/telegram-parse.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const sb = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/telegram-webhook`;
const TOKEN_RE = /^\d{5,}:[A-Za-z0-9_-]{30,}$/;
const CHANNEL_RE = /^@[A-Za-z][A-Za-z0-9_]{3,31}$/;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const requireAdmin = async (req: Request) => {
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!jwt) return false;
  const { data, error } = await sb.auth.getUser(jwt);
  if (error || !data?.user) return false;
  const { data: roles } = await sb.from('user_roles').select('role').eq('user_id', data.user.id);
  return (roles ?? []).some((r: { role: string }) => r.role === 'admin');
};

class TgError extends Error {}
const tg = async (token: string, method: string, body: Record<string, unknown> = {}) => {
  let res: Response;
  try {
    res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
  } catch {
    throw new TgError(`Telegram недоступен (${method})`);
  }
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new TgError(redactToken(`${method}: ${data.description ?? `HTTP ${res.status}`}`));
  return data.result;
};

const ALLOWED_UPDATES = ['channel_post', 'edited_channel_post', 'my_chat_member'];

const getMe = (token: string) =>
  tg(token, 'getMe').catch(() => { throw new TgError('Токен не принят Telegram (getMe). Проверьте токен из @BotFather.'); });

/** Returns the channel when the bot is already its administrator, otherwise null. */
const findAdminChannel = async (token: string, botId: number, channel: string) => {
  const chat = await tg(token, 'getChat', { chat_id: channel }).catch(() => null);
  if (!chat) return null;
  if (chat.type !== 'channel') throw new TgError(`${channel} — не канал (тип: ${chat.type}).`);
  const member = await tg(token, 'getChatMember', { chat_id: chat.id, user_id: botId }).catch(() => null);
  return member?.status === 'administrator' ? chat : null;
};

const registerWebhook = async (token: string, secret: string) => {
  await tg(token, 'setWebhook', { url: WEBHOOK_URL, secret_token: secret, allowed_updates: ALLOWED_UPDATES, drop_pending_updates: true });
  const info = await tg(token, 'getWebhookInfo');
  return info.url === WEBHOOK_URL ? 'ok' : 'mismatch';
};

const loadToken = async () => {
  const { data } = await sb.from('telegram_secrets').select('bot_token, webhook_secret').eq('id', true).maybeSingle();
  return data;
};

const saveSettings = (patch: Record<string, unknown>) =>
  sb.from('telegram_settings').upsert({ id: true, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'id' });

const status = async () => {
  const [{ data: settings }, secrets, { data: imports }] = await Promise.all([
    sb.from('telegram_settings').select('*').eq('id', true).maybeSingle(),
    loadToken(),
    sb.from('telegram_imports').select('id, created_at, status, message, message_id, car_id').order('created_at', { ascending: false }).limit(30),
  ]);
  return {
    has_token: !!secrets,
    token_hint: secrets ? `••••${secrets.bot_token.slice(-4)}` : null,
    settings: settings ?? null,
    imports: imports ?? [],
    webhook_url_set: settings?.webhook_status === 'ok',
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!(await requireAdmin(req))) return json({ error: 'Доступ только для администратора' }, 403);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? 'status');

    if (action === 'status') return json(await status());

    if (action === 'prepare') {
      const channel = String(body.channel ?? '').trim();
      const newToken = String(body.token ?? '').trim();
      if (!CHANNEL_RE.test(channel)) return json({ error: 'Укажите канал в формате @username' }, 400);
      const existing = await loadToken();
      const token = newToken || existing?.bot_token;
      if (!token) return json({ error: 'Вставьте токен бота' }, 400);
      if (!TOKEN_RE.test(token)) return json({ error: 'Токен выглядит некорректно (формат 123456:ABC…)' }, 400);
      const me = await getMe(token);
      const { data: prev } = await sb.from('telegram_settings').select('*').eq('id', true).maybeSingle();
      const sameChannel = prev?.channel_username?.toLowerCase() === channel.toLowerCase();
      const sameBot = prev?.bot_id != null && Number(prev.bot_id) === Number(me.id);
      // A bound channel id is kept; only an explicit channel/bot change by the admin resets it.
      const boundId = sameChannel && sameBot && prev?.channel_id != null ? Number(prev.channel_id) : null;

      const webhookSecret = existing && existing.bot_token === token ? existing.webhook_secret : crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      const s = await sb.from('telegram_secrets').upsert({ id: true, bot_token: token, webhook_secret: webhookSecret, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (s.error) throw new Error(s.error.message);
      if (existing && existing.bot_token !== token) await tg(existing.bot_token, 'deleteWebhook').catch(() => null);

      const webhook = await registerWebhook(token, webhookSecret);
      const chat = await findAdminChannel(token, me.id, channel);
      const now = new Date().toISOString();
      const base = {
        channel_username: channel, bot_id: me.id, bot_username: me.username, auto_activate: true,
        webhook_status: webhook, webhook_checked_at: now, last_error: null,
      };
      if (chat && (boundId == null || Number(chat.id) === boundId)) {
        await saveSettings({ ...base, channel_id: chat.id, channel_title: chat.title ?? null, enabled: true, state: 'active', verified_at: now });
      } else {
        await saveSettings({ ...base, channel_id: boundId, enabled: false, state: 'awaiting_bot' });
      }
      return json(await status());
    }

    const secrets = await loadToken();
    const { data: settings } = await sb.from('telegram_settings').select('*').eq('id', true).maybeSingle();

    if (action === 'enable') {
      if (!secrets || !settings?.channel_username || !settings.bot_id) return json({ error: 'Сначала подготовьте подключение' }, 400);
      const webhook = await registerWebhook(secrets.bot_token, secrets.webhook_secret);
      const chat = await findAdminChannel(secrets.bot_token, Number(settings.bot_id), settings.channel_username);
      const now = new Date().toISOString();
      if (chat && settings.channel_id != null && Number(chat.id) !== Number(settings.channel_id)) {
        return json({ error: 'ID канала не совпадает с привязанным — подготовьте подключение заново' }, 409);
      }
      if (chat) {
        await saveSettings({ enabled: true, auto_activate: true, state: 'active', channel_id: chat.id, channel_title: chat.title ?? null, verified_at: now, webhook_status: webhook, webhook_checked_at: now, last_error: null });
      } else {
        await saveSettings({ enabled: false, auto_activate: true, state: 'awaiting_bot', webhook_status: webhook, webhook_checked_at: now });
      }
      return json(await status());
    }

    if (action === 'disable') {
      // Also cancels auto-activation so a late my_chat_member cannot re-enable import.
      await saveSettings({ enabled: false, auto_activate: false, state: 'disabled', webhook_status: 'not_set' });
      if (secrets) await tg(secrets.bot_token, 'deleteWebhook').catch(() => null);
      return json(await status());
    }

    if (action === 'check') {
      if (!secrets) return json({ error: 'Токен не сохранён' }, 400);
      const info = await tg(secrets.bot_token, 'getWebhookInfo');
      const st = !info.url ? 'not_set' : info.url === WEBHOOK_URL ? (info.last_error_message ? 'error' : 'ok') : 'mismatch';
      await saveSettings({
        webhook_status: st, webhook_checked_at: new Date().toISOString(),
        ...(info.last_error_message ? { last_error: redactToken(`Telegram: ${info.last_error_message}`), last_error_at: new Date((info.last_error_date ?? 0) * 1000).toISOString() } : {}),
      });
      return json({ ...(await status()), pending_updates: info.pending_update_count ?? 0 });
    }

    if (action === 'forget') {
      if (secrets) await tg(secrets.bot_token, 'deleteWebhook').catch(() => null);
      await sb.from('telegram_secrets').delete().eq('id', true);
      await saveSettings({ enabled: false, auto_activate: false, state: 'not_configured', webhook_status: 'not_set', bot_id: null, bot_username: null, channel_id: null, verified_at: null });
      return json(await status());
    }

    return json({ error: 'Неизвестное действие' }, 400);
  } catch (e) {
    const message = redactToken(e instanceof Error ? e.message : String(e));
    if (!(e instanceof TgError)) console.error('telegram-admin failed:', message);
    return json({ error: message }, e instanceof TgError ? 400 : 500);
  }
});
