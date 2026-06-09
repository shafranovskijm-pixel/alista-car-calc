import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Plus, Users } from "lucide-react";
import { CLIENT_TYPE_LABELS } from "@/lib/deals";
import DuplicatesBanner from "@/components/admin/DuplicatesBanner";
import { EmptyState } from "@/components/admin/EmptyState";
import TableSkeleton from "@/components/admin/TableSkeleton";
import HintCard from "@/components/admin/HintCard";

type Client = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  client_type: "individual" | "company";
  company_name: string | null;
  created_at: string;
};

const emptyForm = {
  full_name: "",
  phone: "",
  email: "",
  client_type: "individual" as "individual" | "company",
  company_name: "",
  inn: "",
  address: "",
  note: "",
};

const AdminClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("id, full_name, phone, email, client_type, company_name, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    setClients((data ?? []) as Client[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.full_name.trim()) {
      toast.error("Введите ФИО / название");
      return;
    }
    const normPhone = (form.phone ?? "").replace(/\D/g, "");
    const normEmail = (form.email ?? "").trim().toLowerCase();
    const dupCandidate = clients.find(
      (c) =>
        (normPhone.length >= 10 && (c.phone ?? "").replace(/\D/g, "") === normPhone) ||
        (normEmail && (c.email ?? "").trim().toLowerCase() === normEmail),
    );
    if (dupCandidate) {
      if (!confirm(`Похоже, такой клиент уже есть: ${dupCandidate.full_name}. Всё равно создать?`)) {
        return;
      }
    }
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from("clients").insert({
      ...form,
      email: form.email || null,
      phone: form.phone || null,
      company_name: form.company_name || null,
      inn: form.inn || null,
      address: form.address || null,
      note: form.note || null,
      created_by: userRes.user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error("Не удалось создать клиента");
      return;
    }
    toast.success("Клиент создан");
    setForm(emptyForm);
    setOpen(false);
    load();
  };

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(s) ||
      (c.phone ?? "").toLowerCase().includes(s) ||
      (c.email ?? "").toLowerCase().includes(s) ||
      (c.company_name ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Клиенты</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Поиск"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72"
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" /> Новый клиент
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Новый клиент</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Тип</Label>
                  <Select
                    value={form.client_type}
                    onValueChange={(v) => setForm({ ...form, client_type: v as "individual" | "company" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Физлицо</SelectItem>
                      <SelectItem value="company">Юрлицо</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ФИО / Название</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Телефон</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                {form.client_type === "company" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Компания</Label>
                      <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                    </div>
                    <div>
                      <Label>ИНН</Label>
                      <Input value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value })} />
                    </div>
                  </div>
                )}
                <div>
                  <Label>Адрес</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div>
                  <Label>Заметка</Label>
                  <Textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
                <Button onClick={create} disabled={saving}>Создать</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <HintCard storageKey="clients" title="База клиентов">
        Карточка клиента хранит контакты, паспорт или реквизиты компании, историю сделок и документов.
        В карточке есть переключатель <b>Физлицо / Юрлицо</b> и кнопка <b>Синхронизировать с DaData</b> —
        она подтягивает юр. данные по ИНН автоматически. Из карточки сразу можно создать сделку или договор.
      </HintCard>

      <DuplicatesBanner />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Клиент</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Создан</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <TableSkeleton rows={6} cols={5} className="border-0 shadow-none rounded-none" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    icon={Users}
                    title={search.trim() ? "Ничего не найдено" : "Клиентов пока нет"}
                    description={search.trim() ? "Попробуйте изменить запрос." : "Добавьте первого клиента кнопкой выше."}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link to={`/admin/clients/${c.id}`} className="font-medium hover:underline">
                      {c.full_name}
                    </Link>
                    {c.company_name && (
                      <div className="text-xs text-muted-foreground">{c.company_name}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{CLIENT_TYPE_LABELS[c.client_type]}</Badge>
                  </TableCell>
                  <TableCell>{c.phone ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(c.created_at).toLocaleDateString("ru-RU")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminClients;