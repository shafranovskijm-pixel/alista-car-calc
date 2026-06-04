import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LEAD_STATUS_LABELS, LEAD_STATUS_VARIANT, LeadStatus } from "@/lib/leads";

type Lead = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  status: LeadStatus;
  source: string | null;
  utm_source: string | null;
  assigned_to: string | null;
  created_at: string;
};

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let q = supabase
        .from("leads")
        .select("id, full_name, phone, email, status, source, utm_source, assigned_to, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (status !== "all") q = q.eq("status", status as LeadStatus);
      const { data, error } = await q;
      if (!error && data) setLeads(data as Lead[]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("leads-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [status]);

  const filtered = leads.filter((l) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      l.full_name.toLowerCase().includes(s) ||
      l.phone.toLowerCase().includes(s) ||
      (l.email ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Заявки</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Поиск: имя, телефон, email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {Object.entries(LEAD_STATUS_LABELS).map(([v, label]) => (
                <SelectItem key={v} value={v}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Клиент</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Источник</TableHead>
              <TableHead>Создана</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Заявок пока нет
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id} className="cursor-pointer">
                  <TableCell>
                    <Link to={`/admin/leads/${l.id}`} className="font-medium hover:underline">
                      {l.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>{l.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{l.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={LEAD_STATUS_VARIANT[l.status]}>{LEAD_STATUS_LABELS[l.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {l.utm_source ?? l.source ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(l.created_at).toLocaleString("ru-RU")}
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

export default AdminLeads;