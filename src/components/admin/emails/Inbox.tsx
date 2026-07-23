import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/proxy-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/admin/EmptyState";
import { Inbox as InboxIcon, RefreshCw, Reply, Paperclip, Mail, MailOpen, Trash2 } from "lucide-react";

type Row = {
  uid: number;
  seq: number;
  subject: string;
  from: string;
  to: string;
  date: string | null;
  unseen: boolean;
  hasAttachments: boolean;
};

type Message = {
  uid: number;
  subject: string;
  from: string;
  to: string;
  date: string | null;
  text: string;
  html: string | null;
  attachments: { filename: string; contentType: string; size: number }[];
};

const extractEmail = (raw: string) => {
  const m = raw.match(/<([^>]+)>/);
  return (m?.[1] ?? raw).trim();
};

const Inbox = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Message | null>(null);
  const [openMsg, setOpenMsg] = useState(false);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [unseen, setUnseen] = useState(0);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("mailbox", {
      body: { action: "list", mailbox: "INBOX", limit: 50 },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Не удалось получить почту", description: error.message, variant: "destructive" });
      return;
    }
    setRows((data?.messages ?? []) as Row[]);
    setTotal(data?.total ?? 0);
    setUnseen(data?.unseen ?? 0);
  };

  useEffect(() => { load(); }, []);

  const open = async (uid: number) => {
    setOpenMsg(true);
    setSelected(null);
    const { data, error } = await supabase.functions.invoke("mailbox", {
      body: { action: "fetch", mailbox: "INBOX", uid, markSeen: true },
    });
    if (error) {
      toast({ title: "Не удалось открыть письмо", description: error.message, variant: "destructive" });
      setOpenMsg(false);
      return;
    }
    setSelected(data?.message as Message);
    setRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, unseen: false } : r)));
  };

  const del = async (uid: number) => {
    if (!confirm("Удалить письмо?")) return;
    const { error } = await supabase.functions.invoke("mailbox", {
      body: { action: "delete", mailbox: "INBOX", uid },
    });
    if (error) {
      toast({ title: "Не удалось удалить", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Удалено" });
    setOpenMsg(false);
    load();
  };

  const startReply = () => {
    if (!selected) return;
    setReplyTo(extractEmail(selected.from));
    setReplySubject(selected.subject.startsWith("Re:") ? selected.subject : `Re: ${selected.subject}`);
    const quoted = (selected.text || selected.html?.replace(/<[^>]+>/g, "") || "")
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n");
    setReplyBody(`\n\n\n--- ${selected.from} писал(а) ${selected.date ? new Date(selected.date).toLocaleString("ru-RU") : ""} ---\n${quoted}`);
    setReplyOpen(true);
  };

  const sendReply = async () => {
    if (!replyTo.trim() || !replySubject.trim() || !replyBody.trim()) {
      toast({ title: "Заполните все поля", variant: "destructive" });
      return;
    }
    setReplySending(true);
    const { error } = await supabase.functions.invoke("send-smtp-email", {
      body: {
        to: replyTo,
        subject: replySubject,
        text: replyBody,
        html: replyBody.replace(/\n/g, "<br/>"),
        kind: "notification",
      },
    });
    setReplySending(false);
    if (error) {
      toast({ title: "Не отправлено", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ответ отправлен" });
    setReplyOpen(false);
  };

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (r.subject + " " + r.from).toLowerCase().includes(s);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">Всего: {total}</Badge>
          {unseen > 0 && <Badge>Новых: {unseen}</Badge>}
        </div>
        <div className="flex-1" />
        <Input
          placeholder="Поиск: тема, отправитель…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Обновить
        </Button>
      </div>

      <Card className="divide-y divide-border overflow-hidden">
        {loading && rows.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">Загрузка почты…</div>
        )}
        {!loading && filtered.length === 0 && (
          <EmptyState icon={InboxIcon} title="Входящих нет" description="Здесь появятся письма, пришедшие на info@alistaru.ru" />
        )}
        {filtered.map((r) => (
          <button
            key={r.uid}
            type="button"
            onClick={() => open(r.uid)}
            className={`w-full text-left px-3 sm:px-4 py-3 hover:bg-secondary/50 transition-colors flex items-start gap-3 ${r.unseen ? "bg-primary/5" : ""}`}
          >
            <div className="mt-0.5">
              {r.unseen ? <Mail className="h-4 w-4 text-primary" /> : <MailOpen className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <div className={`truncate text-sm ${r.unseen ? "font-semibold" : ""}`}>{r.from || "—"}</div>
                <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {r.date ? new Date(r.date).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                </div>
              </div>
              <div className={`truncate text-sm ${r.unseen ? "text-foreground" : "text-muted-foreground"}`}>
                {r.subject}
              </div>
            </div>
            {r.hasAttachments && <Paperclip className="h-4 w-4 text-muted-foreground mt-1" />}
          </button>
        ))}
      </Card>

      <Dialog open={openMsg} onOpenChange={setOpenMsg}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {!selected ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Загрузка письма…</div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg pr-8">{selected.subject}</DialogTitle>
              </DialogHeader>
              <div className="text-xs text-muted-foreground space-y-0.5 pb-3 border-b border-border">
                <div><span className="font-medium text-foreground">От:</span> {selected.from}</div>
                <div><span className="font-medium text-foreground">Кому:</span> {selected.to}</div>
                {selected.date && <div>{new Date(selected.date).toLocaleString("ru-RU")}</div>}
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                {selected.html ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert [&_a]:text-primary [&_img]:max-w-full"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: selected.html }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-sans">{selected.text}</pre>
                )}
                {selected.attachments.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="text-xs uppercase text-muted-foreground tracking-wider mb-2">Вложения</div>
                    <div className="space-y-1">
                      {selected.attachments.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{a.filename}</span>
                          <span className="text-xs text-muted-foreground">({Math.round(a.size / 1024)} КБ)</span>
                        </div>
                      ))}
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Скачивание вложений — в следующей версии.
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="border-t border-border pt-3">
                <Button variant="ghost" onClick={() => del(selected.uid)}>
                  <Trash2 className="h-4 w-4 mr-2 text-destructive" /> Удалить
                </Button>
                <div className="flex-1" />
                <Button onClick={startReply}>
                  <Reply className="h-4 w-4 mr-2" /> Ответить
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ответить</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Кому</Label>
              <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} />
            </div>
            <div>
              <Label>Тема</Label>
              <Input value={replySubject} onChange={(e) => setReplySubject(e.target.value)} />
            </div>
            <div>
              <Label>Сообщение</Label>
              <Textarea rows={12} value={replyBody} onChange={(e) => setReplyBody(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReplyOpen(false)}>Отмена</Button>
            <Button onClick={sendReply} disabled={replySending}>
              {replySending ? "Отправка…" : "Отправить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inbox;