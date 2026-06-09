import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import MessageTemplates from "./MessageTemplates";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  documentId: string;
  documentTitle: string;
  defaultEmail?: string;
  defaultName?: string;
}

const SendDocumentDialog = ({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  defaultEmail = "",
  defaultName = "",
}: Props) => {
  const [to, setTo] = useState(defaultEmail);
  const [subject, setSubject] = useState(`Документ: ${documentTitle}`);
  const [text, setText] = useState(
    `Здравствуйте${defaultName ? `, ${defaultName}` : ""}!\n\nВо вложении документ «${documentTitle}».\n\nС уважением, Alista`,
  );
  const [attach, setAttach] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setTo(defaultEmail);
    setSubject(`Документ: ${documentTitle}`);
    setText(
      `Здравствуйте${defaultName ? `, ${defaultName}` : ""}!\n\nВо вложении документ «${documentTitle}».\n\nС уважением, Alista`,
    );
  }, [documentId, documentTitle, defaultEmail, defaultName]);

  const send = async () => {
    if (!to.trim()) return toast.error("Введите адрес получателя");
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-smtp-email", {
      body: {
        to: to.trim(),
        subject: subject.trim() || "Документ",
        text,
        kind: "document",
        documentId: attach ? documentId : undefined,
      },
    });
    setSending(false);
    const err = (data as { error?: string })?.error ?? error?.message;
    if (err) {
      toast.error(err);
      return;
    }
    toast.success("Письмо отправлено");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Отправить документ на email</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-2 block">Кому</Label>
            <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="client@example.com" />
          </div>
          <div>
            <Label className="mb-2 block">Тема</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Сопроводительное письмо</Label>
              <MessageTemplates
                vars={{ "client.name": defaultName }}
                onInsert={(t) => setText((prev) => (prev ? prev + "\n\n" + t : t))}
              />
            </div>
            <Textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <div className="text-sm font-medium">Приложить файл</div>
              <div className="text-xs text-muted-foreground">
                Если файл &gt; 20 МБ — отправится защищённая ссылка.
              </div>
            </div>
            <Switch checked={attach} onCheckedChange={setAttach} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={send} disabled={sending}>{sending ? "Отправка…" : "Отправить"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendDocumentDialog;