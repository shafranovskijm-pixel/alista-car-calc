import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/proxy-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";

type Settings = {
  notify_emails: string[];
  from_name: string;
  notifications_enabled: boolean;
};

const EmailSettings = () => {
  const [s, setS] = useState<Settings>({ notify_emails: [], from_name: "Alista", notifications_enabled: true });
  const [emailsRaw, setEmailsRaw] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase
      .from("email_settings")
      .select("notify_emails, from_name, notifications_enabled")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setS(data as Settings);
          setEmailsRaw((data.notify_emails ?? []).join(", "));
        }
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const emails = emailsRaw
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    const { error } = await supabase
      .from("email_settings")
      .update({
        notify_emails: emails,
        from_name: s.from_name.trim() || "Alista",
        notifications_enabled: s.notifications_enabled,
      })
      .eq("id", true);
    setSaving(false);
    if (error) toast.error("Нужны права администратора");
    else toast.success("Сохранено");
  };

  const sendTest = async () => {
    if (!testTo.trim()) return toast.error("Введите адрес");
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-smtp-email", {
      body: {
        to: testTo.trim(),
        subject: "Тестовое письмо из CRM Alista",
        text: "Это тестовое письмо. Если вы его получили — SMTP подключён правильно.",
        kind: "test",
      },
    });
    setSending(false);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Не удалось");
    } else {
      toast.success("Письмо отправлено — проверьте ящик");
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Загрузка…</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" /> Уведомления о заявках
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Присылать письмо при новой заявке</div>
              <div className="text-xs text-muted-foreground">Письмо приходит на ваш ящик мгновенно после отправки формы</div>
            </div>
            <Switch
              checked={s.notifications_enabled}
              onCheckedChange={(v) => setS({ ...s, notifications_enabled: v })}
            />
          </div>
          <div>
            <Label className="mb-2 block">Получатели (через запятую)</Label>
            <Input
              value={emailsRaw}
              onChange={(e) => setEmailsRaw(e.target.value)}
              placeholder="info@alistaru.ru, manager@alistaru.ru"
            />
          </div>
          <div>
            <Label className="mb-2 block">Имя отправителя</Label>
            <Input
              value={s.from_name}
              onChange={(e) => setS({ ...s, from_name: e.target.value })}
              placeholder="Alista"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Письма уходят с ящика, указанного в Secrets (<code>SMTP_FROM</code>).
            </p>
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? "Сохранение…" : "Сохранить"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" /> Тестовое письмо
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="mb-2 block">Кому отправить</Label>
            <Input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="ваш-адрес@example.com"
            />
          </div>
          <Button onClick={sendTest} disabled={sending}>
            {sending ? "Отправка…" : "Отправить тестовое письмо"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Если письмо не приходит — проверьте лог в разделе «Письма» и спам-папку.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSettings;