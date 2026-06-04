import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEAL_STAGES, DEAL_STAGE_COLOR, DEAL_STAGE_LABELS, DealStage } from "@/lib/deals";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LeadStatus } from "@/lib/leads";

type Stats = {
  leadsTotal: number;
  leadsNew: number;
  leadsWeek: number;
  dealsTotal: number;
  dealsActive: number;
  dealsWon: number;
  clients: number;
  revenue: number;
};

type Activity = {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  summary: string | null;
  created_at: string;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [leadsByStatus, setLeadsByStatus] = useState<Record<LeadStatus, number>>({} as Record<LeadStatus, number>);
  const [dealsByStage, setDealsByStage] = useState<Record<DealStage, number>>({} as Record<DealStage, number>);
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    (async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const [
        leadsAll,
        leadsNew,
        leadsWeek,
        dealsAll,
        dealsActive,
        dealsWon,
        dealsWonRows,
        clients,
        leadsRows,
        dealsRows,
        act,
      ] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("deals").select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id", { count: "exact", head: true }).not("stage", "in", "(completed,cancelled)"),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("stage", "completed"),
        supabase.from("deals").select("budget, margin, currency").eq("stage", "completed"),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("status").limit(1000),
        supabase.from("deals").select("stage").limit(1000),
        supabase
          .from("audit_log")
          .select("id, table_name, record_id, action, summary, created_at")
          .order("created_at", { ascending: false })
          .limit(15),
      ]);

      const revenue = (dealsWonRows.data ?? [])
        .filter((d) => d.currency === "RUB")
        .reduce((sum, d) => sum + Number(d.margin ?? d.budget ?? 0), 0);

      setStats({
        leadsTotal: leadsAll.count ?? 0,
        leadsNew: leadsNew.count ?? 0,
        leadsWeek: leadsWeek.count ?? 0,
        dealsTotal: dealsAll.count ?? 0,
        dealsActive: dealsActive.count ?? 0,
        dealsWon: dealsWon.count ?? 0,
        clients: clients.count ?? 0,
        revenue,
      });

      const lbs = {} as Record<LeadStatus, number>;
      LEAD_STATUSES.forEach((s) => (lbs[s] = 0));
      (leadsRows.data ?? []).forEach((r) => {
        lbs[r.status as LeadStatus] = (lbs[r.status as LeadStatus] ?? 0) + 1;
      });
      setLeadsByStatus(lbs);

      const dbs = {} as Record<DealStage, number>;
      DEAL_STAGES.forEach((s) => (dbs[s] = 0));
      (dealsRows.data ?? []).forEach((r) => {
        dbs[r.stage as DealStage] = (dbs[r.stage as DealStage] ?? 0) + 1;
      });
      setDealsByStage(dbs);

      setActivity((act.data ?? []) as Activity[]);
    })();
  }, []);

  if (!stats) return <div className="text-muted-foreground">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Дашборд</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat title="Заявок всего" value={stats.leadsTotal} sub={`+${stats.leadsWeek} за неделю`} />
        <Stat title="Новых заявок" value={stats.leadsNew} accent />
        <Stat title="Активных сделок" value={stats.dealsActive} sub={`из ${stats.dealsTotal}`} />
        <Stat title="Выручка (RUB)" value={stats.revenue.toLocaleString("ru-RU")} sub={`${stats.dealsWon} закрыто`} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Заявки по статусам</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {LEAD_STATUSES.map((s) => {
              const v = leadsByStatus[s] ?? 0;
              const pct = stats.leadsTotal ? (v / stats.leadsTotal) * 100 : 0;
              return (
                <div key={s} className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span>{LEAD_STATUS_LABELS[s]}</span>
                    <span className="text-muted-foreground">{v}</span>
                  </div>
                  <div className="h-1.5 rounded bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Сделки по этапам</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {DEAL_STAGES.map((s) => {
              const v = dealsByStage[s] ?? 0;
              const pct = stats.dealsTotal ? (v / stats.dealsTotal) * 100 : 0;
              return (
                <div key={s} className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className={`px-1.5 py-0.5 rounded border text-xs ${DEAL_STAGE_COLOR[s]}`}>
                      {DEAL_STAGE_LABELS[s]}
                    </span>
                    <span className="text-muted-foreground">{v}</span>
                  </div>
                  <div className="h-1.5 rounded bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Последние действия</CardTitle></CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <div className="text-sm text-muted-foreground">Пусто</div>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {activity.map((a) => {
                const path =
                  a.table_name === "leads" ? `/admin/leads/${a.record_id}` :
                  a.table_name === "deals" ? `/admin/deals/${a.record_id}` :
                  a.table_name === "clients" ? `/admin/clients/${a.record_id}` : "#";
                const label =
                  a.table_name === "leads" ? "Заявка" :
                  a.table_name === "deals" ? "Сделка" :
                  a.table_name === "clients" ? "Клиент" : a.table_name;
                return (
                  <li key={a.id} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-32 shrink-0">
                      {new Date(a.created_at).toLocaleString("ru-RU")}
                    </span>
                    <span className="text-xs text-muted-foreground w-20">
                      {a.action === "create" ? "создан" : "изменён"}
                    </span>
                    <Link to={path} className="hover:underline truncate">
                      <span className="text-muted-foreground">{label}:</span> {a.summary ?? "—"}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Stat = ({
  title,
  value,
  sub,
  accent,
}: {
  title: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className={`text-2xl font-semibold mt-1 ${accent ? "text-primary" : ""}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </CardContent>
  </Card>
);

export default AdminDashboard;