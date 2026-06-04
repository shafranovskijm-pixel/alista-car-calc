import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { downloadCSV, toCSV } from "@/lib/csv";
import { LEAD_STATUS_LABELS, LeadStatus } from "@/lib/leads";
import { DEAL_STAGE_LABELS, DealStage } from "@/lib/deals";

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
        .select("id, full_name, phone, email, status, source, utm_source, utm_medium, utm_campaign, assigned_to, created_at")
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .limit(5000),
      supabase
        .from("deals")
        .select("id, title, stage, budget, margin, currency, assigned_to, created_at")
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
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-xs">С</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
          </div>
          <div>
            <Label className="text-xs">По</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Источники заявок</CardTitle>
            <Button size="sm" variant="outline" onClick={exportLeads}>
              <Download className="h-4 w-4 mr-1" /> CSV заявок
            </Button>
          </CardHeader>
          <CardContent>
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
          <CardContent>
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