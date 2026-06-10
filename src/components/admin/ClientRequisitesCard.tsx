import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw, Save, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/proxy-client";
import { toast } from "sonner";

export type ClientRequisites = {
  id: string;
  client_type: "individual" | "company";
  full_name: string | null;
  company_name: string | null;
  inn: string | null;
  kpp: string | null;
  ogrn: string | null;
  address: string | null;
  director_name: string | null;
  director_position: string | null;
  passport: string | null;
  birth_date: string | null;
  passport_issued_by: string | null;
  passport_issued_date: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
};

type Props = {
  client: ClientRequisites;
  onSaved?: (c: ClientRequisites) => void;
};

const ClientRequisitesCard = ({ client, onSaved }: Props) => {
  const [form, setForm] = useState<ClientRequisites>(client);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const set = <K extends keyof ClientRequisites>(k: K, v: ClientRequisites[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const sync = async () => {
    if (!form.inn) return toast.error("Укажите ИНН");
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("dadata-party", {
        body: { inn: form.inn.trim() },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      const d = data as {
        full_name?: string; short_name?: string; kpp?: string; ogrn?: string;
        address?: string; director_name?: string; director_position?: string;
      };
      setForm((f) => ({
        ...f,
        company_name: d.short_name || d.full_name || f.company_name,
        kpp: d.kpp || f.kpp,
        ogrn: d.ogrn || f.ogrn,
        address: d.address || f.address,
        director_name: d.director_name || f.director_name,
        director_position: d.director_position || f.director_position,
      }));
      toast.success("Реквизиты загружены");
    } catch (e) {
      toast.error((e as Error).message || "Ошибка синхронизации");
    } finally {
      setSyncing(false);
    }
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("clients").update({
      company_name: form.company_name,
      inn: form.inn,
      kpp: form.kpp,
      ogrn: form.ogrn,
      address: form.address,
      director_name: form.director_name,
      director_position: form.director_position,
      passport: form.passport,
      birth_date: form.birth_date,
      passport_issued_by: form.passport_issued_by,
      passport_issued_date: form.passport_issued_date,
      phone: form.phone,
      email: form.email,
      note: form.note,
      client_type: form.client_type,
    }).eq("id", form.id);
    setSaving(false);
    if (error) return toast.error("Не удалось сохранить");
    toast.success("Сохранено");
    onSaved?.(form);
  };

  const isCompany = form.client_type === "company";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Реквизиты клиента</CardTitle>
        <div className="flex items-center gap-2">
          <Tabs value={form.client_type} onValueChange={(v) => set("client_type", v as "individual" | "company")}>
            <TabsList className="h-8">
              <TabsTrigger value="individual" className="text-xs h-6">Физлицо</TabsTrigger>
              <TabsTrigger value="company" className="text-xs h-6">Юрлицо</TabsTrigger>
            </TabsList>
          </Tabs>
          {isCompany && (
            <Button variant="outline" size="sm" onClick={sync} disabled={syncing} className="gap-1.5">
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Синхронизировать
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isCompany ? (
          <>
            <div>
              <Label>Название компании</Label>
              <Input value={form.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>ИНН</Label>
                <div className="flex gap-1.5">
                  <Input value={form.inn ?? ""} onChange={(e) => set("inn", e.target.value)} />
                  <Button variant="outline" size="icon" onClick={sync} disabled={syncing} title="Найти по ИНН">
                    {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label>КПП</Label>
                <Input value={form.kpp ?? ""} onChange={(e) => set("kpp", e.target.value)} />
              </div>
              <div>
                <Label>ОГРН</Label>
                <Input value={form.ogrn ?? ""} onChange={(e) => set("ogrn", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Юридический адрес</Label>
              <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>ФИО руководителя</Label>
                <Input value={form.director_name ?? ""} onChange={(e) => set("director_name", e.target.value)} />
              </div>
              <div>
                <Label>Должность руководителя</Label>
                <Input value={form.director_position ?? ""} onChange={(e) => set("director_position", e.target.value)} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <Label>ФИО</Label>
              <Input value={form.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Дата рождения</Label>
                <Input type="date" value={form.birth_date ?? ""} onChange={(e) => set("birth_date", e.target.value)} />
              </div>
              <div>
                <Label>Паспорт (серия и номер)</Label>
                <Input value={form.passport ?? ""} onChange={(e) => set("passport", e.target.value)} placeholder="0500 123456" />
              </div>
              <div>
                <Label>Дата выдачи</Label>
                <Input type="date" value={form.passport_issued_date ?? ""} onChange={(e) => set("passport_issued_date", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Кем выдан</Label>
              <Input value={form.passport_issued_by ?? ""} onChange={(e) => set("passport_issued_by", e.target.value)} />
            </div>
            <div>
              <Label>Адрес регистрации</Label>
              <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </div>
          </>
        )}

        <Accordion type="single" collapsible>
          <AccordionItem value="contacts">
            <AccordionTrigger className="text-sm">Контакты и описание</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Телефон</Label>
                  <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Заметка</Label>
                <Textarea rows={3} value={form.note ?? ""} onChange={(e) => set("note", e.target.value)} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button onClick={save} disabled={saving} className="w-full gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Сохранить изменения
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClientRequisitesCard;