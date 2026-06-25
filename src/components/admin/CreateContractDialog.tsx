import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, FileText, Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/proxy-client";
import {
  downloadBlob,
  nextContractNo,
  renderContractBlob,
  type ContractClient,
  type ContractData,
} from "@/lib/contract";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Опционально привязать договор к сделке (например, из карточки сделки) */
  dealId?: string;
  clientId?: string;
};

type Form = {
  full_name: string;
  contract_sum: string;
  car_model: string;
  company_name: string;
  inn: string;
  kpp: string;
  ogrn: string;
  address: string;
  director_name: string;
  director_position: string;
};

const empty: Form = {
  full_name: "",
  contract_sum: "",
  car_model: "",
  company_name: "",
  inn: "",
  kpp: "",
  ogrn: "",
  address: "",
  director_name: "",
  director_position: "Генерального директора",
};

const CreateContractDialog = ({ open, onOpenChange, dealId, clientId }: Props) => {
  const [type, setType] = useState<"individual" | "company">("individual");
  const [tpl, setTpl] = useState<"v4" | "v3">("v4");
  const [form, setForm] = useState<Form>(empty);
  const [loadingDadata, setLoadingDadata] = useState(false);
  const [generating, setGenerating] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const reset = () => {
    setForm(empty);
    setType("individual");
    setTpl("v4");
  };

  const fetchDadata = async () => {
    if (!/^\d{10}$|^\d{12}$/.test(form.inn.trim())) {
      toast.error("ИНН должен быть 10 или 12 цифр");
      return;
    }
    setLoadingDadata(true);
    try {
      const { data, error } = await supabase.functions.invoke("dadata-party", {
        body: { inn: form.inn.trim() },
      });
      if (error) throw error;
      setForm((f) => ({
        ...f,
        company_name: data.short_name || data.full_name || f.company_name,
        inn: data.inn || f.inn,
        kpp: data.kpp || f.kpp,
        ogrn: data.ogrn || f.ogrn,
        address: data.address || f.address,
        director_name: data.director_name || f.director_name,
        director_position: data.director_position
          ? data.director_position.charAt(0).toUpperCase() + data.director_position.slice(1).toLowerCase()
          : f.director_position,
      }));
      toast.success("Реквизиты подтянуты");
    } catch (e) {
      toast.error((e as Error).message || "Не удалось получить данные");
    } finally {
      setLoadingDadata(false);
    }
  };

  const generate = async () => {
    if (type === "individual" && !form.full_name.trim()) {
      toast.error("Введите ФИО клиента");
      return;
    }
    if (type === "company" && !form.company_name.trim()) {
      toast.error("Введите название компании");
      return;
    }
    if (!form.car_model.trim()) {
      toast.error("Введите модель автомобиля");
      return;
    }
    const sumNum = Number(form.contract_sum.replace(/\s+/g, "").replace(",", "."));
    if (!sumNum || sumNum <= 0) {
      toast.error("Введите сумму договора");
      return;
    }

    const client: ContractClient = {
      client_type: type,
      full_name: type === "individual" ? form.full_name : form.director_name || form.full_name,
      company_name: form.company_name,
      inn: form.inn,
      kpp: form.kpp,
      ogrn: form.ogrn,
      address: form.address,
      director_name: form.director_name,
      director_position: form.director_position,
    };

    const contract_no = nextContractNo();
    const data: ContractData = {
      contract_no,
      contract_date: new Date().toLocaleDateString("ru-RU"),
      client,
      principalType: type,
      templateVersion: tpl,
      contract_sum: sumNum,
      car_model: form.car_model,
    };

    setGenerating(true);
    try {
      const blob = await renderContractBlob(data);
      const title = type === "individual" ? form.full_name : form.company_name;
      const fileName = `Договор Алиста №${contract_no} — ${title}.docx`;
      downloadBlob(blob, fileName);

      // Сохраняем копию в Документы
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const storagePath = `contracts/${Date.now()}_${fileName.replace(/[^\w.\-]+/g, "_")}`;
        const file = new File([blob], fileName, {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const { error: upErr } = await supabase.storage
          .from("documents")
          .upload(storagePath, file, { upsert: false, contentType: file.type });
        if (!upErr) {
          await supabase.from("documents").insert({
            kind: "contract",
            title: `Договор Алиста №${contract_no} — ${title}`,
            storage_path: storagePath,
            mime_type: file.type,
            size_bytes: file.size,
            deal_id: dealId ?? null,
            client_id: clientId ?? null,
            uploaded_by: userRes.user?.id ?? null,
          });
          window.dispatchEvent(
            new CustomEvent("alista-contracts-updated", { detail: { dealId } }),
          );
        }
      } catch (e) {
        console.warn("contract auto-save failed", e);
      }

      toast.success("Договор готов и сохранён в Документах");
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Ошибка генерации");
    } finally {
      setGenerating(false);
    }
  };

  const ChoiceBtn = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 rounded-md border text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-muted/40 border-border hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 sm:rounded-lg overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[92vh]">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Создать договор
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Тип клиента
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceBtn active={type === "individual"} onClick={() => setType("individual")}>
                Физлицо
              </ChoiceBtn>
              <ChoiceBtn active={type === "company"} onClick={() => setType("company")}>
                Юрлицо
              </ChoiceBtn>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Форма договора
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceBtn active={tpl === "v4"} onClick={() => setTpl("v4")}>
                Шаблон 1
              </ChoiceBtn>
              <ChoiceBtn active={tpl === "v3"} onClick={() => setTpl("v3")}>
                Шаблон 2
              </ChoiceBtn>
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {type === "individual" ? (
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block">ФИО клиента</Label>
                <Input
                  className="h-12"
                  placeholder="Иванов Иван Иванович"
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Сумма договора, ₽</Label>
                <Input
                  className="h-12"
                  inputMode="numeric"
                  placeholder="100000"
                  value={form.contract_sum}
                  onChange={(e) => set("contract_sum", e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Модель автомобиля</Label>
                <Input
                  className="h-12"
                  placeholder="Toyota Camry 2023"
                  value={form.car_model}
                  onChange={(e) => set("car_model", e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block">ИНН организации</Label>
                <div className="flex gap-2">
                  <Input
                    className="h-12"
                    inputMode="numeric"
                    placeholder="10 или 12 цифр"
                    value={form.inn}
                    onChange={(e) => set("inn", e.target.value.replace(/\D+/g, ""))}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 shrink-0"
                    onClick={fetchDadata}
                    disabled={loadingDadata}
                  >
                    {loadingDadata ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    <span className="ml-1 hidden sm:inline">Подтянуть</span>
                  </Button>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Название</Label>
                <Input className="h-12" value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1.5 block">КПП</Label>
                  <Input className="h-12" value={form.kpp} onChange={(e) => set("kpp", e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5 block">ОГРН</Label>
                  <Input className="h-12" value={form.ogrn} onChange={(e) => set("ogrn", e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Юридический адрес</Label>
                <Input className="h-12" value={form.address} onChange={(e) => set("address", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1.5 block">ФИО директора</Label>
                  <Input className="h-12" value={form.director_name} onChange={(e) => set("director_name", e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Должность (в род. падеже)</Label>
                  <Input
                    className="h-12"
                    placeholder="Генерального директора"
                    value={form.director_position}
                    onChange={(e) => set("director_position", e.target.value)}
                  />
                </div>
              </div>
              <div className="h-px bg-border/60 my-1" />
              <div>
                <Label className="mb-1.5 block">Сумма договора, ₽</Label>
                <Input
                  className="h-12"
                  inputMode="numeric"
                  placeholder="100000"
                  value={form.contract_sum}
                  onChange={(e) => set("contract_sum", e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Модель автомобиля</Label>
                <Input
                  className="h-12"
                  placeholder="Toyota Camry 2023"
                  value={form.car_model}
                  onChange={(e) => set("car_model", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border/60 bg-background/80 backdrop-blur sm:flex-row">
          <Button
            variant="outline"
            className="h-12 sm:h-10"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button onClick={generate} disabled={generating} className="h-12 sm:h-10 gap-1.5">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Скачать .docx
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContractDialog;