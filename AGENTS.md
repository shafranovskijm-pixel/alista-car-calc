# Agent rules

- Telegram channel import lives in `supabase/functions/telegram-webhook` + `telegram-admin`, with pure logic in `supabase/functions/_shared/telegram-*.ts` so vitest can test it — keep Deno APIs out of `_shared`.
- Telegram bot token and webhook secret live only in service-role tables (`telegram_secrets`), never in browser code or env vars — the token grants full bot control.
- Car create/update from Telegram goes through `telegram_upsert_car` / `telegram_sync_photos` (advisory lock per post) — webhook deliveries are concurrent and retried.
- Public catalogue pages refresh via `useCatalogLiveRefresh` (realtime + slow polling) — realtime may be blocked by the api.alistaru.ru proxy.
- Telegram import activation is driven by `my_chat_member` (`decideMembership`) once an admin runs "prepare"; manual disable clears `auto_activate` — never let membership events re-enable a manually disabled import.
- `site_videos` types live in `src/integrations/supabase/site-videos-types.ts` because the generated types.ts drops the table while its migration is unapplied.
- Telegram posts are parsed free-form by default (explicit facts only, collections rejected); `#авто` + field template is the strict fallback — the client publishes as usual.
