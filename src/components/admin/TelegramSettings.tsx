import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/proxy-client";

type ImportRow = { id: string; created_at: string; status: string; message: string | null; message_id: number | null };
type Status = {
  has_token: boolean;
  token_hint: string | null;
  settings: {
    enabled: boolean; auto_activate: boolean; state: string; channel_username: string | null; channel_title: string | null; bot_username: string | null;
    webhook_status: string | null; webhook_checked_at: string | null; verified_at: string | null;
    last_imported_at: string | null; last_error: string | null; last_error_at: string | null;
  } | null;
  imports: ImportRow[];
};

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString("ru-RU") : "—");
const WEBHOOK_LABELS: Record<string, string> = { ok: "работает", not_set: "не установлен", mismatch: "указывает на другой адрес", error: "Telegram сообщает об ошибке" };
const STATE_LABELS: Record<string, string> = {
  not_configured: "не настроено", awaiting_bot: "Ожидаем добавления бота в канал", active: "импорт работает",
  disabled: "выключено вручную", bot_removed: "бота убрали из администраторов канала",
};
export const CLIENT_BOT = "@alistaru_catalog_bot";
export const CLIENT_INSTRUCTION = `1. Откройте канал @alistaavto25 → Управление каналом → Администраторы → Добавить администратора.
2. Найдите ${CLIENT_BOT} и добавьте его. Права можно снять все — нажмите «Сохранить».
3. Всё. Дальше публикуйте машины как сейчас — один пост или альбом с одной машиной сам появится на сайте.`;
const STATUS_LABELS: Record<string, string> = { imported: "Импорт", skipped: "Пропуск", error: "Ошибка" };

const TelegramSettings = () => {
  const { toast } = useToast();
  const [st, setSt] = useState<Status | null>(null);
  const [token, setToken] = useState("");
  const [channel, setChannel] = useState("@alistaavto25");
  const [busy, setBusy] = useState<string | null>(null);

  const call = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("telegram-admin", { body: { action, ...extra } });
    if (error) {
      let msg = error.message;
      try {
        const ctx = (error as unknown as { context?: Response }).context;
        if (ctx) msg = (await ctx.json()).error ?? msg;
      } catch { /* ignore */ }
      throw new Error(msg);
    }
    return data as Status;
  }, []);

  const run = async (action: string, extra?: Record<string, unknown>, okText?: string) => {
    setBusy(action);
    try {
      const next = await call(action, extra);
      setSt(next);
      if (action === "prepare") setToken("");
      if (okText) toast({ title: okText });
    } catch (e) {
      toast({ title: "Не получилось", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    call("status").then((s) => {
      setSt(s);
      if (s.settings?.channel_username) setChannel(s.settings.channel_username);
    }).catch((e) => toast({ title: "Не удалось загрузить настройки Telegram", description: String(e.message ?? e), variant: "destructive" }));
  }, [call, toast]);

  const s = st?.settings;

  return (
    <div className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader><CardTitle className="text-base">Для нас (технически)</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <ol className="list-decimal pl-5 space-y-1">
            <li>Вставьте токен нашего бота {CLIENT_BOT} и канал клиента, нажмите «Подготовить подключение».</li>
            <li>Если бот ещё не в канале — статус «Ожидаем добавления бота в канал». Импорт включится сам, как только клиент сделает бота администратором.</li>
            <li>«Отключить импорт» останавливает импорт и автоматическое включение.</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Инструкция для клиента</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <pre className="whitespace-pre-wrap text-sm bg-muted rounded-md p-3 font-sans">{CLIENT_INSTRUCTION}</pre>
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(CLIENT_INSTRUCTION).then(() => toast({ title: "Инструкция скопирована" }))}>Скопировать</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Подключение</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="mb-2 block">Токен бота</Label>
            <Input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)}
              placeholder={st?.has_token ? `Сохранён (${st.token_hint}) — оставьте пустым, чтобы не менять` : "123456789:AA…"} />
          </div>
          <div>
            <Label className="mb-2 block">Канал</Label>
            <Input value={channel} onChange={(e) => setChannel(e.target.value.trim())} placeholder="@alistaavto25" />
            <p className="text-xs text-muted-foreground mt-1">Сменить канал можно только здесь; уже привязанный канал другие сообщения не перепривяжут.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!!busy} onClick={() => run("prepare", { token, channel }, "Подключение подготовлено")}>
              {busy === "prepare" ? "Проверяю…" : "Подготовить подключение"}
            </Button>
            {s?.enabled ? (
              <Button variant="outline" disabled={!!busy} onClick={() => run("disable", {}, "Импорт выключен")}>Отключить импорт</Button>
            ) : (
              <Button variant="outline" disabled={!!busy || !st?.has_token || !s?.bot_username} onClick={() => run("enable")}>Включить импорт</Button>
            )}
            <Button variant="ghost" disabled={!!busy || !st?.has_token} onClick={() => run("check")}>Проверить webhook</Button>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm pt-2">
            <dt className="text-muted-foreground">Импорт</dt>
            <dd className="flex flex-wrap gap-1">{s?.enabled ? <Badge>включён</Badge> : <Badge variant="secondary">выключен</Badge>}<span>{STATE_LABELS[s?.state ?? "not_configured"] ?? s?.state}</span></dd>
            <dt className="text-muted-foreground">Бот</dt><dd>{s?.bot_username ? `@${s.bot_username}` : "не подключён"}</dd>
            <dt className="text-muted-foreground">Канал</dt><dd>{s?.channel_username ? `${s.channel_username}${s.channel_title ? ` (${s.channel_title})` : ""}` : "—"}</dd>
            <dt className="text-muted-foreground">Webhook</dt><dd>{s?.webhook_status ? WEBHOOK_LABELS[s.webhook_status] ?? s.webhook_status : "не установлен"} {s?.webhook_checked_at && <span className="text-muted-foreground">· {fmt(s.webhook_checked_at)}</span>}</dd>
            <dt className="text-muted-foreground">Последний импорт</dt><dd>{fmt(s?.last_imported_at)}</dd>
            {s?.last_error && (<><dt className="text-muted-foreground">Последняя ошибка</dt><dd className="text-destructive">{s.last_error} <span className="text-muted-foreground">· {fmt(s.last_error_at)}</span></dd></>)}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Последние импорты</CardTitle></CardHeader>
        <CardContent>
          {!st?.imports.length ? (
            <p className="text-sm text-muted-foreground">Пока пусто.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {st.imports.map((r) => (
                <li key={r.id} className="py-2 flex flex-col sm:flex-row sm:gap-3">
                  <span className="text-muted-foreground shrink-0 w-40">{fmt(r.created_at)}</span>
                  <Badge variant={r.status === "error" ? "destructive" : r.status === "imported" ? "default" : "secondary"} className="w-fit shrink-0">{STATUS_LABELS[r.status] ?? r.status}</Badge>
                  <span className="break-words">{r.message}{r.message_id ? ` (пост ${r.message_id})` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramSettings;
