import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { Download, Eye, FileText, Loader2, Sparkles } from "lucide-react";
import { renderAsync } from "docx-preview";
import {
  downloadBlob,
  renderContractBlob,
  type ContractData,
} from "@/lib/contract";

const SAMPLE: ContractData = {
  contract_no: "АЛ-ОБРАЗЕЦ-001",
  contract_date: new Date().toLocaleDateString("ru-RU"),
  principalType: "individual",
  client: {
    client_type: "individual",
    full_name: "Иванов Иван Иванович",
    birth_date: "1990-05-15",
    passport: "4510 123456",
    passport_issued_by: "ОУФМС России по г. Москве",
    passport_issued_date: "2015-06-20",
    address: "г. Москва, ул. Тверская, д. 1, кв. 10",
    phone: "+7 900 000-00-00",
    email: "ivanov@example.com",
  },
  deal: {
    title: "Toyota Camry 2022 — образец",
    budget: 3500000,
    sale_price: 3800000,
    currency: "RUB",
  },
};

const AlistaContractSample = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rendered, setRendered] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const buildAndOpen = async () => {
    setLoading(true);
    try {
      const blob = await renderContractBlob(SAMPLE);
      setOpen(true);
      setRendered(false);
      // wait for dialog content to mount
      requestAnimationFrame(async () => {
        if (!previewRef.current) return;
        previewRef.current.innerHTML = "";
        await renderAsync(blob, previewRef.current, undefined, {
          className: "alista-docx",
          inWrapper: true,
          experimental: true,
          useBase64URL: true,
        });
        setRendered(true);
      });
    } catch (e) {
      toast.error((e as Error).message || "Не удалось открыть образец");
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    try {
      const blob = await renderContractBlob(SAMPLE);
      downloadBlob(blob, "Договор Алиста — образец.docx");
    } catch (e) {
      toast.error((e as Error).message || "Ошибка скачивания");
    }
  };

  return (
    <>
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">Агентский договор Алиста</span>
              <Badge variant="secondary" className="text-[10px]">.docx · 21 стр.</Badge>
              <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                системный шаблон
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Фирменный договор с логотипом и реквизитами ООО «Алиста». В образце подставлены тестовые данные — посмотрите вёрстку, шапку и блок реквизитов на стр. 15. В реальной сделке поля заменятся данными клиента автоматически.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={buildAndOpen} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Просмотреть образец
            </Button>
            <Button variant="outline" onClick={download} className="gap-1.5">
              <Download className="h-4 w-4" /> Скачать
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" /> Образец договора Алиста
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto rounded-md border border-border/60 bg-white relative">
            {!rendered && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Готовим предпросмотр…
              </div>
            )}
            <div ref={previewRef} className="alista-docx-preview" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AlistaContractSample;