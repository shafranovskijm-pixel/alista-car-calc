# Agent rules

- Telegram channel import lives in `supabase/functions/telegram-webhook` + `telegram-admin`, with pure logic in `supabase/functions/_shared/telegram-*.ts` so vitest can test it — keep Deno APIs out of `_shared`.
- Telegram bot token and webhook secret live only in service-role tables (`telegram_secrets`), never in browser code or env vars — the token grants full bot control.
- Car create/update from Telegram goes through `telegram_upsert_car` / `telegram_sync_photos` (advisory lock per post) — webhook deliveries are concurrent and retried.
- Public catalogue pages refresh via `useCatalogLiveRefresh` (realtime + slow polling) — realtime may be blocked by the api.alistaru.ru proxy.
