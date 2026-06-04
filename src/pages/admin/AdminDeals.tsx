import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Plus } from "lucide-react";
import {
  DEAL_STAGES,
  DEAL_STAGE_COLOR,
  DEAL_STAGE_LABELS,
  DEAL_TYPES,
  DEAL_TYPE_LABELS,
  DealStage,
  DealType,
} from "@/lib/deals";

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

const AdminDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientOpt[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const byStage = useMemo(() => {
    const map: Record<DealStage, Deal[]> = {} as Record<DealStage, Deal[]>;
    DEAL_STAGES.forEach((s) => (map[s] = []));
    deals.forEach((d) => map[d.stage]?.push(d));
    return map;
  }, [deals]);

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
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Сделки</h1>
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

      {loading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : (
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3 min-w-max">
            {DEAL_STAGES.map((stage) => (
              <Column
                key={stage}
                stage={stage}
                deals={byStage[stage]}
                onDropDeal={(deal) => moveStage(deal, stage)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Column = ({
  stage,
  deals,
  onDropDeal,
}: {
  stage: DealStage;
  deals: Deal[];
  onDropDeal: (deal: Deal) => void;
}) => {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        try {
          const deal = JSON.parse(raw) as Deal;
          onDropDeal(deal);
        } catch {
          /* ignore */
        }
      }}
      className={`w-72 shrink-0 rounded-lg border p-3 transition-colors ${
        over ? "border-primary bg-primary/5" : "border-border/60 bg-muted/20"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`px-2 py-0.5 rounded border text-xs ${DEAL_STAGE_COLOR[stage]}`}>
          {DEAL_STAGE_LABELS[stage]}
        </div>
        <span className="text-xs text-muted-foreground">{deals.length}</span>
      </div>
      <div className="space-y-2 min-h-12">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} />
        ))}
      </div>
    </div>
  );
};

const DealCard = ({ deal }: { deal: Deal }) => (
  <Card
    draggable
    onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify(deal))}
    className="p-3 cursor-grab active:cursor-grabbing hover:border-primary/60 transition-colors"
  >
    <Link to={`/admin/deals/${deal.id}`} className="block">
      <div className="font-medium text-sm">{deal.title}</div>
      <div className="text-xs text-muted-foreground mt-1 truncate">
        {deal.clients?.full_name ?? "—"}
      </div>
      <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
        <span>{DEAL_TYPE_LABELS[deal.deal_type]}</span>
        {deal.budget != null && (
          <span>{Number(deal.budget).toLocaleString("ru-RU")} {deal.currency}</span>
        )}
      </div>
    </Link>
  </Card>
);

export default AdminDeals;