import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Download, Loader2, Sparkles } from "lucide-react";
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
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const blob = await renderContractBlob(SAMPLE);
      downloadBlob(blob, "Договор Алиста — образец.docx");
    } catch (e) {
      toast.error((e as Error).message || "Ошибка скачивания");
    } finally {
      setLoading(false);
    }
  };

  return (
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
              Фирменный договор с логотипом ООО «Алиста». Скачайте образец, чтобы посмотреть вёрстку и блок реквизитов в Word. В реальной сделке поля заменятся данными клиента автоматически.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={download} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Скачать образец
            </Button>
          </div>
        </CardContent>
      </Card>
  );
};

export default AlistaContractSample;