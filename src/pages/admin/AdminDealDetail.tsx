import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DealCarLink from "@/components/admin/DealCarLink";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import DocumentsList from "@/components/admin/DocumentsList";
import ActivityTimeline from "@/components/admin/ActivityTimeline";
import {
  DEAL_STAGES,
  DEAL_STAGE_COLOR,
  DEAL_STAGE_LABELS,
  DEAL_TYPES,
  DEAL_TYPE_LABELS,
  DealStage,
  DealType,
} from "@/lib/deals";

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

const STAGE_CHECKLIST: Partial<Record<DealStage, string[]>> = {
  new: ["Связаться с клиентом", "Уточнить интерес"],
  qualification: ["Бюджет", "Сроки", "Источник денег"],
  calculation: ["Сделать расчёт", "Согласовать с клиентом"],
  payment: ["Договор подписан", "Предоплата получена"],
  delivery: ["Авто куплено", "Передано перевозчику"],
  customs: ["Декларация", "Уплата пошлин", "СБКТС/ЭПТС"],
  completed: ["Авто передано клиенту", "Финальный платёж"],
};
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
  lost_reason: string | null;
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
    lost_reason: string | null;
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/deals"><ArrowLeft className="h-4 w-4 mr-1" /> К доске</Link>
        </Button>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs ${DEAL_STAGE_COLOR[deal.stage]}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${STAGE_DOT[deal.stage]}`} />
          {DEAL_STAGE_LABELS[deal.stage]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg leading-tight">{deal.title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                от {new Date(deal.created_at).toLocaleDateString("ru-RU")}
              </p>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <KV k="Клиент" v={
                deal.clients ? (
                  <Link to={`/admin/clients/${deal.clients.id}`} className="text-primary hover:underline">
                    {deal.clients.full_name}
                  </Link>
                ) : "—"
              } />
              <KV k="Тип" v={DEAL_TYPE_LABELS[deal.deal_type]} />
              <KV k="Валюта" v={deal.currency} />
              {deal.lead_id && (
                <KV k="Заявка" v={
                  <Link to={`/admin/leads/${deal.lead_id}`} className="text-primary hover:underline">Открыть →</Link>
                } />
              )}
              <div className="grid grid-cols-2 gap-2 pt-2 mt-2 border-t border-border/60">
                <div>
                  <label className="text-[11px] text-muted-foreground">Бюджет</label>
                  <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} onBlur={() => update({ budget: budget ? Number(budget) : null })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Маржа</label>
                  <Input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} onBlur={() => update({ margin: margin ? Number(margin) : null })} className="h-8 text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Документы</CardTitle></CardHeader>
            <CardContent>
              <DocumentsList dealId={deal.id} />
            </CardContent>
          </Card>

          <DealCarLink dealId={deal.id} />
        </div>

        {/* CENTER */}
        <div className="lg:col-span-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Активности</CardTitle></CardHeader>
            <CardContent>
              <ActivityTimeline dealId={deal.id} />
              {history.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border/60">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    История этапов
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {history.map((h) => (
                      <li key={h.id} className="flex items-center gap-2 text-muted-foreground">
                        <span>{new Date(h.changed_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                        {h.from_stage && (<><span>{DEAL_STAGE_LABELS[h.from_stage]}</span><span>→</span></>)}
                        <span className="text-foreground">{DEAL_STAGE_LABELS[h.to_stage]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Этап</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={deal.stage} onValueChange={(v) => update({ stage: v as DealStage })} disabled={saving}>
                <SelectTrigger>
                  <span className="inline-flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${STAGE_DOT[deal.stage]}`} />
                    {DEAL_STAGE_LABELS[deal.stage]}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="inline-flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${STAGE_DOT[s]}`} />
                        {DEAL_STAGE_LABELS[s]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={deal.deal_type} onValueChange={(v) => update({ deal_type: v as DealType })} disabled={saving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEAL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{DEAL_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                Менеджер: {deal.assigned_to ? (deal.assigned_to === user?.id ? "Вы" : "Другой") : "Никто"}
              </div>
              {deal.assigned_to !== user?.id && (
                <Button size="sm" variant="outline" className="w-full" onClick={() => update({ assigned_to: user?.id ?? null })}>
                  Взять в работу
                </Button>
              )}
              {deal.stage === "cancelled" && (
                <div className="pt-2 border-t border-border">
                  <label className="text-xs text-muted-foreground mb-1 block">Причина отказа</label>
                  <Textarea
                    rows={2}
                    value={deal.lost_reason ?? ""}
                    onChange={(e) => setDeal({ ...deal, lost_reason: e.target.value })}
                    onBlur={() => update({ lost_reason: deal.lost_reason ?? null })}
                    placeholder="Не сошлись по цене..."
                    className="text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {STAGE_CHECKLIST[deal.stage] && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Чек-лист этапа</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {STAGE_CHECKLIST[deal.stage]!.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Закреп. заметка</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} className="text-sm" />
              <Button size="sm" className="w-full" onClick={() => update({ note })} disabled={saving}>Сохранить</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const KV = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex justify-between gap-2">
    <span className="text-muted-foreground">{k}</span>
    <span className="truncate text-right">{v}</span>
  </div>
);

export default AdminDealDetail;