import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Flame,
  PhoneCall,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import EmptyState from "@/components/admin/EmptyState";
import TasksWidget from "@/components/admin/TasksWidget";
import { DEAL_STAGES, DEAL_STAGE_COLOR, DEAL_STAGE_LABELS, DealStage } from "@/lib/deals";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LeadStatus } from "@/lib/leads";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Stats = {
  leadsTotal: number;
  leadsNew: number;
  leadsWeek: number;
  leadsPrevWeek: number;
  dealsTotal: number;
  dealsActive: number;
  dealsWon: number;
  dealsWonPrev: number;
  clients: number;
  clientsWeek: number;
  revenue: number;
  revenuePrev: number;
};

type LeadRow = {
  id: string;
  full_name: string;
  phone: string;
  status: LeadStatus;
  utm_source: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
};

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 36e5;
const fmtRub = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
const delta = (curr: number, prev: number) => {
  if (!prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [leadsByStatus, setLeadsByStatus] = useState<Record<LeadStatus, number>>({} as Record<LeadStatus, number>);
  const [dealsByStage, setDealsByStage] = useState<Record<DealStage, number>>({} as Record<DealStage, number>);
  const [bySource, setBySource] = useState<{ date: string; total: number; bySource: Record<string, number> }[]>([]);
  const [tasksToday, setTasksToday] = useState<LeadRow[]>([]);
  const [stuckLeads, setStuckLeads] = useState<LeadRow[]>([]);

  useEffect(() => {
    (async () => {
      const now = Date.now();
      const day = 24 * 3600 * 1000;
      const weekAgo = new Date(now - 7 * day).toISOString();
      const twoWeeksAgo = new Date(now - 14 * day).toISOString();
      const thirtyDaysAgo = new Date(now - 30 * day).toISOString();

      const [
        leadsAll,
        leadsNew,
        leadsWeek,
        leadsPrevWeek,
        dealsAll,
        dealsActive,
        dealsWon,
        dealsWonRows,
        dealsWonPrev,
        clients,
        clientsWeek,
        leadsRows,
        dealsRows,
        leadsRecent,
        actionable,
      ] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
        supabase.from("deals").select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id", { count: "exact", head: true }).not("stage", "in", "(completed,cancelled)"),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("stage", "completed"),
        supabase.from("deals").select("budget, margin, currency, updated_at").eq("stage", "completed"),
        supabase
          .from("deals")
          .select("id", { count: "exact", head: true })
          .eq("stage", "completed")
          .gte("updated_at", twoWeeksAgo)
          .lt("updated_at", weekAgo),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("clients").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("leads").select("status").limit(2000),
        supabase.from("deals").select("stage").limit(2000),
        supabase
          .from("leads")
          .select("id, created_at, utm_source, source")
          .gte("created_at", thirtyDaysAgo)
          .limit(5000),
        supabase
          .from("leads")
          .select("id, full_name, phone, status, utm_source, source, created_at, updated_at")
          .in("status", ["new", "in_progress", "callback", "meeting"])
          .order("updated_at", { ascending: true })
          .limit(50),
      ]);

      const revenue = (dealsWonRows.data ?? [])
        .filter((d) => d.currency === "RUB")
        .reduce((sum, d) => sum + Number(d.margin ?? d.budget ?? 0), 0);
      const revenuePrev = (dealsWonRows.data ?? [])
        .filter(
          (d) =>
            d.currency === "RUB" &&
            d.updated_at &&
            new Date(d.updated_at).getTime() >= now - 14 * day &&
            new Date(d.updated_at).getTime() < now - 7 * day,
        )
        .reduce((sum, d) => sum + Number(d.margin ?? d.budget ?? 0), 0);

      setStats({
        leadsTotal: leadsAll.count ?? 0,
        leadsNew: leadsNew.count ?? 0,
        leadsWeek: leadsWeek.count ?? 0,
        leadsPrevWeek: leadsPrevWeek.count ?? 0,
        dealsTotal: dealsAll.count ?? 0,
        dealsActive: dealsActive.count ?? 0,
        dealsWon: dealsWon.count ?? 0,
        dealsWonPrev: dealsWonPrev.count ?? 0,
        clients: clients.count ?? 0,
        clientsWeek: clientsWeek.count ?? 0,
        revenue,
        revenuePrev,
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

      // 30 days × source
      const days: { date: string; total: number; bySource: Record<string, number> }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now - i * day);
        days.push({ date: dayKey(d), total: 0, bySource: {} });
      }
      const idx = new Map(days.map((d, i) => [d.date, i]));
      (leadsRecent.data ?? []).forEach((r) => {
        const key = dayKey(new Date(r.created_at));
        const i = idx.get(key);
        if (i === undefined) return;
        const src = (r.utm_source || r.source || "direct").toLowerCase();
        days[i].total += 1;
        days[i].bySource[src] = (days[i].bySource[src] ?? 0) + 1;
      });
      setBySource(days);

      const all = (actionable.data ?? []) as LeadRow[];
      setTasksToday(
        all
          .filter(
            (l) =>
              l.status === "new" ||
              l.status === "callback" ||
              (l.status === "in_progress" && hoursSince(l.updated_at) >= 24) ||
              (l.status === "meeting" && hoursSince(l.updated_at) >= 24),
          )
          .slice(0, 8),
      );
      setStuckLeads(
        all
          .filter((l) => hoursSince(l.updated_at) >= 48)
          .sort((a, b) => +new Date(a.updated_at) - +new Date(b.updated_at))
          .slice(0, 6),
      );
    })();
  }, []);

  const trendData = useMemo(
    () => bySource.map((d) => ({ date: d.date.slice(5), value: d.total })),
    [bySource],
  );
  const sparkLeads = useMemo(() => trendData.map((d) => ({ v: d.value })), [trendData]);

  const funnelData = useMemo(() => {
    const order: DealStage[] = ["new", "qualification", "calculation", "payment", "delivery", "customs", "completed"];
    const max = Math.max(1, ...order.map((s) => dealsByStage[s] ?? 0));
    return order.map((s) => ({
      stage: s,
      label: DEAL_STAGE_LABELS[s],
      value: dealsByStage[s] ?? 0,
      pct: ((dealsByStage[s] ?? 0) / max) * 100,
      color: DEAL_STAGE_COLOR[s],
    }));
  }, [dealsByStage]);

  if (!stats)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
          <p className="text-sm text-muted-foreground">Сводка за последние 30 дней</p>
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Users}
          title="Заявок за неделю"
          value={stats.leadsWeek}
          delta={delta(stats.leadsWeek, stats.leadsPrevWeek)}
          sub={`всего ${stats.leadsTotal}`}
          spark={sparkLeads}
        />
        <KpiCard
          icon={Flame}
          title="Новых сейчас"
          value={stats.leadsNew}
          tone="accent"
          sub="требуют обработки"
        />
        <KpiCard
          icon={TrendingUp}
          title="Активных сделок"
          value={stats.dealsActive}
          sub={`из ${stats.dealsTotal} всего`}
        />
        <KpiCard
          icon={Wallet}
          title="Выручка (RUB)"
          value={fmtRub(stats.revenue)}
          delta={delta(stats.dealsWon, stats.dealsWonPrev)}
          sub={`${stats.dealsWon} закрыто`}
        />
      </div>

      {/* Today + Trend */}
      <div className="grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-1">
          <TasksWidget />
        </div>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Поступление заявок · 30 дней</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#leadsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Funnel + Stuck */}
      <div className="grid lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Воронка сделок</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {funnelData.map((s) => (
              <div key={s.stage} className="flex items-center gap-3">
                <div className="w-28 shrink-0 text-xs text-muted-foreground">{s.label}</div>
                <div className="flex-1 h-7 rounded-md bg-muted/40 overflow-hidden relative">
                  <div
                    className={`h-full rounded-md transition-all ${s.color} border`}
                    style={{ width: `${Math.max(s.pct, 2)}%` }}
                  />
                  <span className="absolute inset-y-0 right-2 flex items-center text-xs font-medium">
                    {s.value}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Залежавшиеся
            </CardTitle>
            <Badge variant="outline">{stuckLeads.length}</Badge>
          </CardHeader>
          <CardContent>
            {stuckLeads.length === 0 ? (
              <EmptyState icon={Clock} title="Нет залежавшихся" description="Все заявки в работе" />
            ) : (
              <ul className="space-y-1.5">
                {stuckLeads.map((l) => {
                  const hrs = Math.round(hoursSince(l.updated_at));
                  return (
                    <li key={l.id}>
                      <Link
                        to={`/admin/leads/${l.id}`}
                        className="flex items-center gap-2 px-2 py-1.5 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm truncate flex-1">{l.full_name}</span>
                        <span className="text-[11px] text-amber-400 shrink-0">
                          {hrs >= 48 ? `${Math.round(hrs / 24)} дн` : `${hrs} ч`}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lead status breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Заявки по статусам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {LEAD_STATUSES.map((s) => {
              const v = leadsByStatus[s] ?? 0;
              const pct = stats.leadsTotal ? (v / stats.leadsTotal) * 100 : 0;
              return (
                <Link
                  to={`/admin/leads?status=${s}`}
                  key={s}
                  className="block rounded-lg border border-border bg-card/50 p-3 hover:border-primary/40 hover:bg-card transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">{LEAD_STATUS_LABELS[s]}</span>
                    <span className="text-sm font-semibold">{v}</span>
                  </div>
                  <div className="h-1 rounded bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function statusDot(s: LeadStatus) {
  if (s === "new") return "bg-primary animate-pulse";
  if (s === "callback") return "bg-amber-400";
  if (s === "meeting") return "bg-violet-400";
  if (s === "in_progress") return "bg-sky-400";
  return "bg-muted-foreground";
}

function KpiCard({
  icon: Icon,
  title,
  value,
  sub,
  delta,
  tone,
  spark,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number | string;
  sub?: string;
  delta?: number;
  tone?: "accent";
  spark?: { v: number }[];
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="relative overflow-hidden group">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{title}</span>
          <Icon className={`h-4 w-4 ${tone === "accent" ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div className={`text-2xl font-semibold tabular-nums ${tone === "accent" ? "text-primary" : ""}`}>
          {value}
        </div>
        <div className="flex items-center justify-between mt-1.5 min-h-[20px]">
          <div className="flex items-center gap-1.5">
            {delta !== undefined && (
              <span className={`inline-flex items-center text-[11px] font-medium ${positive ? "text-emerald-400" : "text-rose-400"}`}>
                {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(delta)}%
              </span>
            )}
            {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
          </div>
          {spark && spark.length > 0 && (
            <div className="w-20 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spark}>
                  <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminDashboard;