import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { ArrowLeft } from "lucide-react";
import DocumentsList from "@/components/admin/DocumentsList";
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
  margin: number | null;
  currency: string;
  note: string | null;
  client_id: string;
  lead_id: string | null;
  assigned_to: string | null;
  created_at: string;
  clients: { id: string; full_name: string } | null;
};

type StageHistory = {
  id: string;
  from_stage: DealStage | null;
  to_stage: DealStage;
  changed_at: string;
};

const AdminDealDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [history, setHistory] = useState<StageHistory[]>([]);
  const [note, setNote] = useState("");
  const [budget, setBudget] = useState("");
  const [margin, setMargin] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("deals")
      .select("*, clients(id, full_name)")
      .eq("id", id)
      .maybeSingle();
    if (!data) return;
    const d = data as unknown as Deal;
    setDeal(d);
    setNote(d.note ?? "");
    setBudget(d.budget != null ? String(d.budget) : "");
    setMargin(d.margin != null ? String(d.margin) : "");
    const { data: hist } = await supabase
      .from("deal_stage_history")
      .select("id, from_stage, to_stage, changed_at")
      .eq("deal_id", id)
      .order("changed_at", { ascending: false });
    setHistory((hist ?? []) as StageHistory[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  type DealUpdate = Partial<{
    title: string;
    stage: DealStage;
    deal_type: DealType;
    budget: number | null;
    margin: number | null;
    currency: string;
    note: string | null;
    assigned_to: string | null;
  }>;

  const update = async (patch: DealUpdate) => {
    if (!deal) return;
    setSaving(true);
    const { error } = await supabase.from("deals").update(patch).eq("id", deal.id);
    setSaving(false);
    if (error) toast.error("Ошибка сохранения");
    else {
      toast.success("Сохранено");
      load();
    }
  };

  if (!deal) return <div className="text-muted-foreground">Загрузка...</div>;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/deals"><ArrowLeft className="h-4 w-4 mr-1" /> К доске</Link>
        </Button>
        <span className={`px-2 py-0.5 rounded border text-xs ${DEAL_STAGE_COLOR[deal.stage]}`}>
          {DEAL_STAGE_LABELS[deal.stage]}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{deal.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Клиент" value={
              deal.clients ? (
                <Link to={`/admin/clients/${deal.clients.id}`} className="text-primary hover:underline">
                  {deal.clients.full_name}
                </Link>
              ) : "—"
            } />
            <Row label="Тип" value={DEAL_TYPE_LABELS[deal.deal_type]} />
            <Row label="Валюта" value={deal.currency} />
            <Row label="Создана" value={new Date(deal.created_at).toLocaleString("ru-RU")} />
            {deal.lead_id && (
              <Row label="Заявка-источник" value={
                <Link to={`/admin/leads/${deal.lead_id}`} className="text-primary hover:underline">Открыть</Link>
              } />
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs text-muted-foreground">Бюджет</label>
                <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} onBlur={() => update({ budget: budget ? Number(budget) : null })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Маржа</label>
                <Input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} onBlur={() => update({ margin: margin ? Number(margin) : null })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Этап и тип</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Этап</label>
                <Select value={deal.stage} onValueChange={(v) => update({ stage: v as DealStage })} disabled={saving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEAL_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>{DEAL_STAGE_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Тип</label>
                <Select value={deal.deal_type} onValueChange={(v) => update({ deal_type: v as DealType })} disabled={saving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEAL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{DEAL_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground">
                Менеджер: {deal.assigned_to ? (deal.assigned_to === user?.id ? "Вы" : "Другой") : "Никто"}
              </div>
              {deal.assigned_to !== user?.id && (
                <Button size="sm" variant="outline" className="w-full" onClick={() => update({ assigned_to: user?.id ?? null })}>
                  Взять в работу
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Заметка</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} />
              <Button size="sm" className="w-full" onClick={() => update({ note })} disabled={saving}>Сохранить</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">История этапов</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground">Нет изменений</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex items-center gap-2">
                  <span className="text-muted-foreground">{new Date(h.changed_at).toLocaleString("ru-RU")}</span>
                  {h.from_stage && (
                    <>
                      <span className={`px-2 py-0.5 rounded border text-xs ${DEAL_STAGE_COLOR[h.from_stage]}`}>{DEAL_STAGE_LABELS[h.from_stage]}</span>
                      <span>→</span>
                    </>
                  )}
                  <span className={`px-2 py-0.5 rounded border text-xs ${DEAL_STAGE_COLOR[h.to_stage]}`}>{DEAL_STAGE_LABELS[h.to_stage]}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-3 py-1 border-b border-border/40 last:border-0">
    <div className="text-muted-foreground">{label}</div>
    <div className="col-span-2">{value}</div>
  </div>
);

export default AdminDealDetail;