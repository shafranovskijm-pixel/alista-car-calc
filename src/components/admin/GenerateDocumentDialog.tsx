import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Printer, FileText } from "lucide-react";

type Template = { id: string; name: string; kind: string; body: string };
type DealOpt = {
  id: string;
  title: string;
  budget: number | null;
  currency: string;
  sale_price: number | null;
  clients: { full_name: string; phone: string | null; email: string | null } | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templates: Template[];
  defaultTemplateId?: string;
};

const substitute = (body: string, deal: DealOpt | null) => {
  if (!deal) return body;
  const map: Record<string, string> = {
    client_name: deal.clients?.full_name ?? "",
    client_phone: deal.clients?.phone ?? "",
    client_email: deal.clients?.email ?? "",
    deal_title: deal.title,
    deal_budget: deal.budget != null ? String(deal.budget) : "",
    sale_price: deal.sale_price != null ? String(deal.sale_price) : "",
    currency: deal.currency,
    date: new Date().toLocaleDateString("ru-RU"),
  };
  return body.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_, k: string) =>
    Object.prototype.hasOwnProperty.call(map, k) ? map[k] : `{{${k}}}`,
  );
};

const GenerateDocumentDialog = ({ open, onOpenChange, templates, defaultTemplateId }: Props) => {
  const [templateId, setTemplateId] = useState<string>(defaultTemplateId ?? templates[0]?.id ?? "");
  const [dealId, setDealId] = useState<string>("");
  const [deals, setDeals] = useState<DealOpt[]>([]);
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("deals")
        .select("id, title, budget, currency, sale_price, clients(full_name, phone, email)")
        .order("created_at", { ascending: false })
        .limit(200);
      setDeals((data ?? []) as unknown as DealOpt[]);
    })();
  }, [open]);

  useEffect(() => {
    if (defaultTemplateId) setTemplateId(defaultTemplateId);
  }, [defaultTemplateId, open]);

  const template = useMemo(() => templates.find((t) => t.id === templateId) ?? null, [templates, templateId]);
  const deal = useMemo(() => deals.find((d) => d.id === dealId) ?? null, [deals, dealId]);

  useEffect(() => {
    if (!template) return;
    setBody(substitute(template.body, deal));
  }, [template, deal]);

  const printPdf = () => {
    if (!body.trim()) {
      toast.error("Текст пустой");
      return;
    }
    const title = template?.name ?? "Документ";
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      toast.error("Браузер заблокировал окно печати");
      return;
    }
    const escaped = body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    w.document.write(`<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; line-height: 1.55; color: #111; }
  h1 { font-size: 16pt; margin: 0 0 16px; text-align: center; }
  pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: inherit; margin: 0; }
</style></head>
<body>
  <h1>${title}</h1>
  <pre>${escaped}</pre>
  <script>window.onload = () => { window.focus(); window.print(); }</script>
</body></html>`);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Сформировать документ
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Шаблон</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Сделка (для подстановки)</Label>
              <Select value={dealId} onValueChange={setDealId}>
                <SelectTrigger><SelectValue placeholder="Без подстановки" /></SelectTrigger>
                <SelectContent>
                  {deals.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title} · {d.clients?.full_name ?? "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Текст документа</Label>
            <Textarea
              rows={14}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Доступные переменные: <code>{"{{client_name}}"}</code>, <code>{"{{client_phone}}"}</code>,{" "}
              <code>{"{{client_email}}"}</code>, <code>{"{{deal_title}}"}</code>,{" "}
              <code>{"{{deal_budget}}"}</code>, <code>{"{{sale_price}}"}</code>,{" "}
              <code>{"{{currency}}"}</code>, <code>{"{{date}}"}</code>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
          <Button onClick={printPdf} className="gap-1.5">
            <Printer className="h-4 w-4" /> Печать / PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateDocumentDialog;