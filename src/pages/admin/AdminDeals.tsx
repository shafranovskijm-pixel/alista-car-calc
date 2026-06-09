import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { KanbanIcon, LayoutGrid, Plus, Table as TableIcon } from "lucide-react";
import {
  DEAL_STAGES,
  DEAL_STAGE_COLOR,
  DEAL_STAGE_LABELS,
  DEAL_TYPES,
  DEAL_TYPE_LABELS,
  DealStage,
  DealType,
} from "@/lib/deals";
import { KanbanBoard, KanbanColumn } from "@/components/admin/KanbanBoard";

type Deal = {
  id: string;
  title: string;
  stage: DealStage;
  deal_type: DealType;
  budget: number | null;
  currency: string;
  client_id: string;
  clients: { full_name: string } | null;
};

type ClientOpt = { id: string; full_name: string };

const STAGE_DOT: Record<DealStage, string> = {
  new: "bg-blue-400",
  qualification: "bg-sky-400",
  calculation: "bg-indigo-400",
  payment: "bg-amber-400",
  delivery: "bg-violet-400",
  customs: "bg-purple-400",
  completed: "bg-emerald-400",
  cancelled: "bg-rose-400",
};

const AdminDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientOpt[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"board" | "table">(
    () => (localStorage.getItem("admin.deals.view") as "board" | "table") || "board",
  );
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    client_id: "",
    deal_type: "import_car" as DealType,
    budget: "",
    currency: "RUB",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("deals")
      .select("id, title, stage, deal_type, budget, currency, client_id, clients(full_name)")
      .order("created_at", { ascending: false })
      .limit(500);
    setDeals((data ?? []) as unknown as Deal[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    (async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, full_name")
        .order("created_at", { ascending: false })
        .limit(200);
      setClients((data ?? []) as ClientOpt[]);
    })();

    const channel = supabase
      .channel("deals-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "deals" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("admin.deals.view", view);
  }, [view]);

  const kanbanColumns: KanbanColumn<DealStage>[] = useMemo(
    () =>
      DEAL_STAGES.map((s) => ({
        key: s,
        label: DEAL_STAGE_LABELS[s],
        accent: STAGE_DOT[s],
      })),
    [],
  );

  const create = async () => {
    if (!form.title.trim() || !form.client_id) {
      toast.error("Укажите название и клиента");
      return;
    }
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from("deals").insert({
      title: form.title,
      client_id: form.client_id,
      deal_type: form.deal_type,
      currency: form.currency,
      budget: form.budget ? Number(form.budget) : null,
      created_by: userRes.user?.id ?? null,
      assigned_to: userRes.user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error("Не удалось создать сделку");
      return;
    }
    toast.success("Сделка создана");
    setForm({ title: "", client_id: "", deal_type: "import_car", budget: "", currency: "RUB" });
    setOpen(false);
    load();
  };

  const moveStage = async (deal: Deal, stage: DealStage) => {
    if (stage === deal.stage) return;
    const prev = deals;
    setDeals((ds) => ds.map((d) => (d.id === deal.id ? { ...d, stage } : d)));
    const { error } = await supabase.from("deals").update({ stage }).eq("id", deal.id);
    if (error) {
      setDeals(prev);
      toast.error("Не удалось переместить");
    } else {
      toast.success(`${deal.title} → ${DEAL_STAGE_LABELS[stage]}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Сделки</h1>
          <p className="text-xs text-muted-foreground">Всего: {deals.length}</p>
        </div>
        <div className="flex items-center gap-2">
        <Tabs value={view} onValueChange={(v) => setView(v as "board" | "table")}>
          <TabsList>
            <TabsTrigger value="board" className="gap-1.5"><LayoutGrid className="h-3.5 w-3.5" /> Доска</TabsTrigger>
            <TabsTrigger value="table" className="gap-1.5"><TableIcon className="h-3.5 w-3.5" /> Таблица</TabsTrigger>
          </TabsList>
        </Tabs>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Новая сделка</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая сделка</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Название</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Toyota Land Cruiser 300" />
              </div>
              <div>
                <Label>Клиент</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Выберите клиента" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Тип</Label>
                <Select value={form.deal_type} onValueChange={(v) => setForm({ ...form, deal_type: v as DealType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEAL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{DEAL_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Бюджет</Label>
                  <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
                </div>
                <div>
                  <Label>Валюта</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RUB">RUB</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
                      <SelectItem value="KRW">KRW</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

      {loading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : view === "board" ? (
        <KanbanBoard
          columns={kanbanColumns}
          items={deals}
          groupKey={(d) => d.stage}
          onMove={(d, to) => moveStage(d, to)}
          renderCard={(d) => (
            <Card
              onClick={() => navigate(`/admin/deals/${d.id}`)}
              className="p-3 hover:border-primary/60 transition-colors"
            >
              <div className="font-medium text-sm leading-snug line-clamp-2">{d.title}</div>
              <div className="text-xs text-muted-foreground mt-1.5 truncate">
                {d.clients?.full_name ?? "—"}
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px]">
                <span className="text-muted-foreground">{DEAL_TYPE_LABELS[d.deal_type]}</span>
                {d.budget != null && (
                  <span className="font-medium tabular-nums">
                    {Number(d.budget).toLocaleString("ru-RU")} {d.currency}
                  </span>
                )}
              </div>
            </Card>
          )}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Этап</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead className="text-right">Бюджет</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((d) => (
                <TableRow key={d.id} className="cursor-pointer" onClick={() => navigate(`/admin/deals/${d.id}`)}>
                  <TableCell className="font-medium">
                    <Link to={`/admin/deals/${d.id}`} className="hover:text-primary" onClick={(e) => e.stopPropagation()}>
                      {d.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.clients?.full_name ?? "—"}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select value={d.stage} onValueChange={(v) => moveStage(d, v as DealStage)}>
                      <SelectTrigger className="h-7 w-auto min-w-[140px] border-0 bg-transparent px-2 hover:bg-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${STAGE_DOT[d.stage]}`} />
                          <span className="text-xs">{DEAL_STAGE_LABELS[d.stage]}</span>
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {DEAL_STAGES.map((s) => (
                          <SelectItem key={s} value={s}>
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${STAGE_DOT[s]}`} />
                              {DEAL_STAGE_LABELS[s]}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{DEAL_TYPE_LABELS[d.deal_type]}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {d.budget != null ? `${Number(d.budget).toLocaleString("ru-RU")} ${d.currency}` : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {deals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">Сделок пока нет</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default AdminDeals;