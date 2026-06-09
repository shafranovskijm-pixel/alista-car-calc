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
import { Printer, FileText, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  downloadBlob,
  renderContractBlob,
  nextContractNo,
  type ContractClient,
  type ContractData,
} from "@/lib/contract";

type Template = { id: string; name: string; kind: string; body: string };
type DealOpt = {
  id: string;
  title: string;
  budget: number | null;
  currency: string;
  sale_price: number | null;
  clients:
    | (ContractClient & { id: string })
    | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templates: Template[];
  defaultTemplateId?: string;
  /** "alista" — открыть диалог сразу на договоре Алиста (.docx) */
  defaultPreset?: "alista";
  /** Предзаполнить сделку (например, из карточки сделки) */
  defaultDealId?: string;
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

const GenerateDocumentDialog = ({
  open,
  onOpenChange,
  templates,
  defaultTemplateId,
  defaultPreset,
  defaultDealId,
}: Props) => {
  const [templateId, setTemplateId] = useState<string>(
    defaultPreset === "alista" ? "__alista_docx" : defaultTemplateId ?? templates[0]?.id ?? "",
  );
  const [dealId, setDealId] = useState<string>(defaultDealId ?? "");
  const [deals, setDeals] = useState<DealOpt[]>([]);
  const [body, setBody] = useState("");
  const [contractNo, setContractNo] = useState(() => nextContractNo());
  const [contractDate, setContractDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [principalType, setPrincipalType] = useState<"individual" | "company">("individual");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("deals")
        .select(
          "id, title, budget, currency, sale_price, clients(id, client_type, full_name, phone, email, address, passport, birth_date, passport_issued_by, passport_issued_date, company_name, inn, kpp, ogrn, director_name, director_position)",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      setDeals((data ?? []) as unknown as DealOpt[]);
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (defaultPreset === "alista") setTemplateId("__alista_docx");
    else if (defaultTemplateId) setTemplateId(defaultTemplateId);
    if (defaultDealId) setDealId(defaultDealId);
  }, [defaultTemplateId, defaultPreset, defaultDealId, open]);

  const template = useMemo(() => templates.find((t) => t.id === templateId) ?? null, [templates, templateId]);
  const deal = useMemo(() => deals.find((d) => d.id === dealId) ?? null, [deals, dealId]);

  useEffect(() => {
    if (!template) return;
    setBody(substitute(template.body, deal));
  }, [template, deal]);

  useEffect(() => {
    if (deal?.clients?.client_type) setPrincipalType(deal.clients.client_type);
  }, [deal]);

  const buildContractData = (): ContractData | null => {
    if (!deal?.clients) return null;
    return {
      contract_no: contractNo || new Date().toISOString().slice(0, 10).replace(/-/g, ""),
      contract_date: new Date(contractDate).toLocaleDateString("ru-RU"),
      client: deal.clients,
      deal,
      principalType,
    };
  };

  const downloadDocx = async () => {
    const data = buildContractData();
    if (!data) {
      toast.error("Выберите сделку с клиентом");
      return;
    }
    setGenerating(true);
    try {
      const blob = await renderContractBlob(data);
      const fileName = `Договор Алиста №${data.contract_no} — ${deal?.clients?.full_name ?? ""}`;
      const safeName = `${fileName.trim()}.docx`;
      downloadBlob(blob, safeName);

      // Сохраняем копию в Документы сделки, чтобы появилась в списке «Договоры Алиста»
      if (deal?.id) {
        try {
          const { data: userRes } = await supabase.auth.getUser();
          const storagePath = `deals/${deal.id}/contracts/${Date.now()}_${safeName.replace(/[^\w.\-]+/g, "_")}`;
          const file = new File([blob], safeName, {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          const { error: upErr } = await supabase.storage
            .from("documents")
            .upload(storagePath, file, { upsert: false, contentType: file.type });
          if (!upErr) {
            await supabase.from("documents").insert({
              kind: "contract",
              title: `Договор Алиста №${data.contract_no}`,
              storage_path: storagePath,
              mime_type: file.type,
              size_bytes: file.size,
              deal_id: deal.id,
              client_id: deal.clients?.id ?? null,
              uploaded_by: userRes.user?.id ?? null,
            });
            window.dispatchEvent(new CustomEvent("alista-contracts-updated", { detail: { dealId: deal.id } }));
          }
        } catch (e) {
          console.warn("contract auto-save failed", e);
        }
      }
      toast.success("Договор скачан и сохранён в карточке сделки");
    } catch (e) {
      toast.error((e as Error).message || "Ошибка генерации");
    } finally {
      setGenerating(false);
    }
  };

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
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Сформировать документ
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Шаблон</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__alista_docx">
                    ★ Агентский договор Алиста (.docx) — рекомендуется
                  </SelectItem>
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

          {templateId === "__alista_docx" && (
            <div className="grid grid-cols-3 gap-3 p-3 rounded-md border border-border/60 bg-muted/30">
              <div>
                <Label className="mb-1.5 block">№ договора</Label>
                <Input value={contractNo} onChange={(e) => setContractNo(e.target.value)} placeholder="напр. 042" />
              </div>
              <div>
                <Label className="mb-1.5 block">Дата</Label>
                <Input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">Принципал</Label>
                <Select value={principalType} onValueChange={(v) => setPrincipalType(v as "individual" | "company")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Физлицо</SelectItem>
                    <SelectItem value="company">Юрлицо</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {templateId !== "__alista_docx" && (
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
          )}

          {templateId === "__alista_docx" && (
            <div className="rounded-md border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
              Договор формируется по фирменному шаблону Алисты. Нажмите «Скачать .docx», чтобы получить файл — он автоматически сохранится в карточке сделки во вкладке «Договоры Алиста».
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
          {templateId === "__alista_docx" ? (
            <Button onClick={downloadDocx} disabled={generating} className="gap-1.5">
              <Download className="h-4 w-4" /> Скачать .docx
            </Button>
          ) : (
            <Button onClick={printPdf} className="gap-1.5">
              <Printer className="h-4 w-4" /> Печать / PDF
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateDocumentDialog;