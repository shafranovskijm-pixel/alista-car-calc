import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/proxy-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { downloadCSV, toCSV } from "@/lib/csv";
import { LEAD_STATUS_LABELS, LeadStatus } from "@/lib/leads";
import { DEAL_STAGE_LABELS, DealStage } from "@/lib/deals";
import { Filter as FilterIcon } from "lucide-react";
import HintCard from "@/components/admin/HintCard";

type LeadRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  status: LeadStatus;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  assigned_to: string | null;
  created_at: string;
  lost_reason: string | null;
};

type DealRow = {
  id: string;
  title: string;
  stage: DealStage;
  budget: number | null;
  margin: number | null;
  currency: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  lost_reason: string | null;
};

type Profile = { id: string; full_name: string | null; email: string | null };

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthAgoIso = () =>
  new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

const AdminReports = () => {
  const [from, setFrom] = useState(monthAgoIso());
  const [to, setTo] = useState(todayIso());
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  const load = async () => {
    const fromIso = new Date(from).toISOString();
    const toIso = new Date(to + "T23:59:59").toISOString();
    const [{ data: l }, { data: d }, { data: ps }] = await Promise.all([
      supabase
        .from("leads")
        .select("id, full_name, phone, email, status, source, utm_source, utm_medium, utm_campaign, assigned_to, created_at, lost_reason")
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .limit(5000),
      supabase
        .from("deals")
        .select("id, title, stage, budget, margin, currency, assigned_to, created_at, updated_at, lost_reason")
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .limit(5000),
      supabase.from("profiles").select("id, full_name, email"),
    ]);
    setLeads((l ?? []) as LeadRow[]);
    setDeals((d ?? []) as DealRow[]);
    const map: Record<string, Profile> = {};
    (ps ?? []).forEach((p) => (map[p.id] = p as Profile));
    setProfiles(map);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const utmStats = useMemo(() => {
    const map = new Map<string, { count: number; won: number }>();
    leads.forEach((l) => {
      const key = l.utm_source ?? l.source ?? "direct";
      const cur = map.get(key) ?? { count: 0, won: 0 };
      cur.count += 1;
      if (l.status === "won") cur.won += 1;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .map(([source, v]) => ({ source, ...v, conv: v.count ? (v.won / v.count) * 100 : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  const managerStats = useMemo(() => {
    const map = new Map<string, { leads: number; deals: number; won: number; revenue: number }>();
    leads.forEach((l) => {
      const k = l.assigned_to ?? "unassigned";
      const cur = map.get(k) ?? { leads: 0, deals: 0, won: 0, revenue: 0 };
      cur.leads += 1;
      map.set(k, cur);
    });
    deals.forEach((d) => {
      const k = d.assigned_to ?? "unassigned";
      const cur = map.get(k) ?? { leads: 0, deals: 0, won: 0, revenue: 0 };
      cur.deals += 1;
      if (d.stage === "completed") {
        cur.won += 1;
        if (d.currency === "RUB") cur.revenue += Number(d.margin ?? d.budget ?? 0);
      }
      map.set(k, cur);
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({
        id,
        name: id === "unassigned" ? "Не назначен" : (profiles[id]?.full_name ?? profiles[id]?.email ?? id.slice(0, 8)),
        ...v,
      }))
      .sort((a, b) => b.deals - a.deals);
  }, [leads, deals, profiles]);

  // Воронка лидов: Все → В работе → Квалифицированы → Won
  const leadFunnel = useMemo(() => {
    const total = leads.length;
    const workedStatuses: LeadStatus[] = ["in_progress", "callback", "meeting", "contract", "awaiting_payment", "in_transit", "delivered", "won", "lost"];
    const worked = leads.filter((l) => workedStatuses.includes(l.status)).length;
    const qualifiedStatuses: LeadStatus[] = ["meeting", "contract", "awaiting_payment", "in_transit", "delivered", "won"];
    const qualified = leads.filter((l) => qualifiedStatuses.includes(l.status)).length;
    const won = leads.filter((l) => l.status === "won").length;
    return [
      { label: "Всего заявок", value: total, color: "bg-sky-500/30 border-sky-500/40" },
      { label: "В работе", value: worked, color: "bg-blue-500/30 border-blue-500/40" },
      { label: "Квалифицировано", value: qualified, color: "bg-violet-500/30 border-violet-500/40" },
      { label: "Конвертировано", value: won, color: "bg-emerald-500/30 border-emerald-500/40" },
    ].map((s, i, arr) => ({ ...s, pct: arr[0].value ? (s.value / arr[0].value) * 100 : 0 }));
  }, [leads]);

  // Средний цикл сделки (created → completed)
  const dealAvgCycle = useMemo(() => {
    const completed = deals.filter((d) => d.stage === "completed");
    if (completed.length === 0) return null;
    const days =
      completed.reduce((s, d) => {
        const diff = new Date(d.updated_at).getTime() - new Date(d.created_at).getTime();
        return s + diff / (1000 * 60 * 60 * 24);
      }, 0) / completed.length;
    return Math.round(days * 10) / 10;
  }, [deals]);

  // Причины отказа
  const lostReasons = useMemo(() => {
    const map = new Map<string, { leads: number; deals: number }>();
    leads
      .filter((l) => l.status === "lost" && l.lost_reason)
      .forEach((l) => {
        const k = l.lost_reason!.trim() || "Без причины";
        const cur = map.get(k) ?? { leads: 0, deals: 0 };
        cur.leads += 1;
        map.set(k, cur);
      });
    deals
      .filter((d) => d.stage === "cancelled" && d.lost_reason)
      .forEach((d) => {
        const k = d.lost_reason!.trim() || "Без причины";
        const cur = map.get(k) ?? { leads: 0, deals: 0 };
        cur.deals += 1;
        map.set(k, cur);
      });
    return Array.from(map.entries())
      .map(([reason, v]) => ({ reason, ...v, total: v.leads + v.deals }))
      .sort((a, b) => b.total - a.total);
  }, [leads, deals]);

  const exportLeads = () =>
    downloadCSV(
      `leads_${from}_${to}.csv`,
      toCSV(
        leads.map((l) => ({
          Создана: new Date(l.created_at).toLocaleString("ru-RU"),
          ФИО: l.full_name,
          Телефон: l.phone,
          Email: l.email ?? "",
          Статус: LEAD_STATUS_LABELS[l.status],
          Источник: l.source ?? "",
          utm_source: l.utm_source ?? "",
          utm_medium: l.utm_medium ?? "",
          utm_campaign: l.utm_campaign ?? "",
        })),
      ),
    );

  const exportDeals = () =>
    downloadCSV(
      `deals_${from}_${to}.csv`,
      toCSV(
        deals.map((d) => ({
          Создана: new Date(d.created_at).toLocaleString("ru-RU"),
          Название: d.title,
          Этап: DEAL_STAGE_LABELS[d.stage],
          Бюджет: d.budget ?? "",
          Маржа: d.margin ?? "",
          Валюта: d.currency,
        })),
      ),
    );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Отчёты</h1>
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs">С</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full sm:w-44" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs">По</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full sm:w-44" />
          </div>
        </div>
      </div>

      <HintCard storageKey="reports" title="Что показывают отчёты">
        Аналитика за выбранный период:
        <span className="block mt-1">• <b>Воронка</b> — сколько заявок дошло до каждого этапа и где теряются клиенты.</span>
        <span className="block">• <b>Средний цикл сделки</b> — сколько дней проходит от заявки до закрытия.</span>
        <span className="block">• <b>Причины отказа</b> — почему клиенты уходят (нужно отмечать в карточке при потере).</span>
        <span className="block">• <b>Источники заявок и Менеджеры</b> — таблицы с конверсией и выручкой, можно выгрузить в CSV.</span>
      </HintCard>

      {/* Воронка + средний цикл */}
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-primary" /> Воронка конверсии
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leadFunnel.map((s, i) => {
              const prev = i > 0 ? leadFunnel[i - 1].value : null;
              const stepConv = prev && prev > 0 ? (s.value / prev) * 100 : null;
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-40 shrink-0 text-xs text-muted-foreground">{s.label}</div>
                  <div className="flex-1 h-7 rounded-md bg-muted/40 overflow-hidden relative">
                    <div className={`h-full rounded-md border ${s.color}`} style={{ width: `${Math.max(s.pct, 2)}%` }} />
                    <span className="absolute inset-y-0 right-2 flex items-center text-xs font-medium">
                      {s.value} <span className="text-muted-foreground ml-2">{s.pct.toFixed(0)}%</span>
                    </span>
                  </div>
                  <div className="w-20 shrink-0 text-right text-[11px] text-muted-foreground">
                    {stepConv !== null ? `→ ${stepConv.toFixed(0)}%` : ""}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Средний цикл сделки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">
              {dealAvgCycle !== null ? `${dealAvgCycle}` : "—"}
              {dealAvgCycle !== null && <span className="text-sm text-muted-foreground ml-2">дн</span>}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              От создания сделки до её закрытия
            </div>
            <div className="mt-4 pt-3 border-t border-border space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Сделок всего</span><span>{deals.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Закрыто</span><span>{deals.filter(d => d.stage === "completed").length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Отменено</span><span>{deals.filter(d => d.stage === "cancelled").length}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Причины отказа */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Причины отказа</CardTitle>
        </CardHeader>
        <CardContent>
          {lostReasons.length === 0 ? (
            <div className="text-sm text-muted-foreground">Нет данных — указывайте причину при отметке заявки/сделки как «Отказ».</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Причина</TableHead>
                  <TableHead className="text-right">Заявок</TableHead>
                  <TableHead className="text-right">Сделок</TableHead>
                  <TableHead className="text-right">Всего</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lostReasons.map((r) => (
                  <TableRow key={r.reason}>
                    <TableCell>{r.reason}</TableCell>
                    <TableCell className="text-right">{r.leads}</TableCell>
                    <TableCell className="text-right">{r.deals}</TableCell>
                    <TableCell className="text-right font-semibold">{r.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Источники заявок</CardTitle>
            <Button size="sm" variant="outline" onClick={exportLeads}>
              <Download className="h-4 w-4 mr-1" /> CSV заявок
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Источник</TableHead>
                  <TableHead className="text-right">Заявок</TableHead>
                  <TableHead className="text-right">Закрыто</TableHead>
                  <TableHead className="text-right">Конверсия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {utmStats.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Нет данных</TableCell></TableRow>
                ) : utmStats.map((u) => (
                  <TableRow key={u.source}>
                    <TableCell>{u.source}</TableCell>
                    <TableCell className="text-right">{u.count}</TableCell>
                    <TableCell className="text-right">{u.won}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{u.conv.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Менеджеры</CardTitle>
            <Button size="sm" variant="outline" onClick={exportDeals}>
              <Download className="h-4 w-4 mr-1" /> CSV сделок
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Менеджер</TableHead>
                  <TableHead className="text-right">Заявок</TableHead>
                  <TableHead className="text-right">Сделок</TableHead>
                  <TableHead className="text-right">Закрыто</TableHead>
                  <TableHead className="text-right">Выручка ₽</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managerStats.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Нет данных</TableCell></TableRow>
                ) : managerStats.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell className="text-right">{m.leads}</TableCell>
                    <TableCell className="text-right">{m.deals}</TableCell>
                    <TableCell className="text-right">{m.won}</TableCell>
                    <TableCell className="text-right">{m.revenue.toLocaleString("ru-RU")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;