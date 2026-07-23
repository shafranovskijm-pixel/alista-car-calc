import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/proxy-client";
import { Send } from "lucide-react";
import { updateOffer } from "@/lib/offers";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultEmail?: string;
  offerId: string;
  offerNumber: number;
  pdfBase64: string | null;
  onSent?: () => void;
};

const SendOfferDialog = ({ open, onOpenChange, defaultEmail, offerId, offerNumber, pdfBase64, onSent }: Props) => {
  const [to, setTo] = useState(defaultEmail ?? "");
  const [subject, setSubject] = useState(`Коммерческое предложение №${offerNumber} · Alista`);
  const [message, setMessage] = useState(
    `Здравствуйте!\n\nВо вложении — коммерческое предложение №${offerNumber} от Alista.\nЕсли будут вопросы — на связи.\n\nС уважением,\nкоманда Alista`,
  );
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!to.trim()) {
      toast({ title: "Укажите email получателя", variant: "destructive" });
      return;
    }
    if (!pdfBase64) {
      toast({ title: "PDF ещё не сформирован", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.functions.invoke("send-smtp-email", {
      body: {
        to,
        subject,
        text: message,
        html: message.replace(/\n/g, "<br/>"),
        kind: "document",
        attachments: [
          { name: `КП-${offerNumber}.pdf`, contentBase64: pdfBase64, contentType: "application/pdf" },
        ],
      },
    });
    setBusy(false);
    if (error) {
      toast({ title: "Не удалось отправить", description: error.message, variant: "destructive" });
      return;
    }
    await updateOffer(offerId, { status: "sent", sent_at: new Date().toISOString() });
    toast({ title: "Отправлено", description: `Письмо ушло на ${to}` });
    onOpenChange(false);
    onSent?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Отправить КП по email</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Кому</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="client@example.com" />
          </div>
          <div>
            <Label>Тема</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label>Сопроводительное письмо</Label>
            <Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="text-xs text-muted-foreground">
            К письму будет прикреплён PDF-файл коммерческого предложения.
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={submit} disabled={busy}>
            <Send className="h-4 w-4 mr-2" />
            {busy ? "Отправка..." : "Отправить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendOfferDialog;