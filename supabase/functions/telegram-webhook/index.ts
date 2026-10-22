// Public Telegram webhook (verify_jwt = false). Protected by the Telegram
// secret_token header and a strict check of the configured channel id.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { authorize, handleUpdate, type ImportDeps, type TgUpdate } from '../_shared/telegram-import.ts';
import { redactToken } from '../_shared/telegram-parse.ts';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const MIME_BY_EXT: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

const must = <T>(r: { data: T; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};

const makeDeps = (token: string): ImportDeps => ({
  async isProcessed(id) {
    const d = must(await sb.from('telegram_updates').select('update_id').eq('update_id', id).maybeSingle());
    return !!d;
  },
  async markProcessed(id) {
    must(await sb.from('telegram_updates').upsert({ update_id: id }, { onConflict: 'update_id', ignoreDuplicates: true }));
  },
  async saveMessage(row) {
    // Keep an already stored photo path when Telegram re-sends the message.
    const existing = must(await sb.from('telegram_post_messages').select('storage_path,file_id')
      .eq('chat_id', row.chat_id).eq('message_id', row.message_id).maybeSingle());
    if (existing) {
      if (!existing.file_id && row.file_id) {
        must(await sb.from('telegram_post_messages').update({ file_id: row.file_id, file_unique_id: row.file_unique_id, mime_type: row.mime_type })
          .eq('chat_id', row.chat_id).eq('message_id', row.message_id));
      }
      return;
    }
    const r = await sb.from('telegram_post_messages').insert(row);
    if (r.error && r.error.code !== '23505') throw new Error(r.error.message);
  },
  async upsertCar(groupKey, chatId, messageId, version, car) {
    const rows = must(await sb.rpc('telegram_upsert_car', {
      p_group_key: groupKey, p_chat_id: chatId, p_message_id: messageId, p_version: version, p_car: car,
    })) as { car_id: string | null; outcome: string }[];
    return rows[0];
  },
  async postCarId(groupKey) {
    const d = must(await sb.from('telegram_posts').select('car_id').eq('group_key', groupKey).maybeSingle());
    return d?.car_id ?? null;
  },
  async pendingPhotos(groupKey) {
    return must(await sb.from('telegram_post_messages').select('message_id,file_id,file_unique_id,mime_type')
      .eq('group_key', groupKey).is('storage_path', null).not('file_id', 'is', null).order('message_id')) as never;
  },
  async downloadPhoto(fileId) {
    const info = await fetch(`https://api.telegram.org/bot${token}/getFile`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_id: fileId }),
    }).then((r) => r.json());
    if (!info.ok) throw new Error(`getFile: ${info.description ?? 'ошибка'}`);
    const filePath: string = info.result.file_path;
    if ((info.result.file_size ?? 0) > 10 * 1024 * 1024) throw new Error('фото больше 10 МБ');
    const res = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    if (!res.ok) throw new Error(`скачивание фото: HTTP ${res.status}`);
    const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
    const header = res.headers.get('content-type') ?? '';
    const mime = MIME_BY_EXT[ext] ?? (header.startsWith('image/') ? header : 'application/octet-stream');
    return { bytes: new Uint8Array(await res.arrayBuffer()), mime };
  },
  async storePhoto(path, bytes, mime) {
    const { error } = await sb.storage.from('cars').upload(path, bytes, { contentType: mime, upsert: true });
    if (error) throw new Error(error.message);
  },
  async setStoragePath(chatId, messageId, path) {
    must(await sb.from('telegram_post_messages').update({ storage_path: path }).eq('chat_id', chatId).eq('message_id', messageId));
  },
  async syncPhotos(groupKey) {
    return must(await sb.rpc('telegram_sync_photos', { p_group_key: groupKey })) as number;
  },
  async log(entry) {
    await sb.from('telegram_imports').insert({ ...entry, message: entry.message ? redactToken(entry.message).slice(0, 1000) : null });
  },
  async touchImported() {
    await sb.from('telegram_settings').update({ last_imported_at: new Date().toISOString() }).eq('id', true);
  },
});

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const [{ data: secrets }, { data: settings }] = await Promise.all([
      sb.from('telegram_secrets').select('bot_token, webhook_secret').eq('id', true).maybeSingle(),
      sb.from('telegram_settings').select('enabled, channel_id').eq('id', true).maybeSingle(),
    ]);
    const update = (await req.json().catch(() => null)) as TgUpdate | null;
    const msg = update?.channel_post ?? update?.edited_channel_post;
    const verdict = authorize(
      req.headers.get('X-Telegram-Bot-Api-Secret-Token'),
      secrets?.webhook_secret ?? null,
      settings ? { enabled: settings.enabled, channel_id: settings.channel_id == null ? null : Number(settings.channel_id) } : null,
      msg,
    );
    if (verdict === 'unauthorized') return new Response('Unauthorized', { status: 401 });
    // Disabled import, private chats and foreign channels never change the site.
    if (verdict !== 'ok' || !update || !secrets) return new Response('ignored', { status: 200 });

    const out = await handleUpdate(update, makeDeps(secrets.bot_token));
    return new Response(out.body, { status: out.status });
  } catch (e) {
    const message = redactToken(e instanceof Error ? e.message : String(e));
    console.error('telegram-webhook failed:', message);
    await sb.from('telegram_settings').update({ last_error: message.slice(0, 500), last_error_at: new Date().toISOString() }).eq('id', true);
    // Non-2xx makes Telegram retry; processing is idempotent.
    return new Response('error', { status: 500 });
  }
});
