import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/admin/EmptyState";
import { History } from "lucide-react";

type Row = {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  actor: string | null;
  summary: string | null;
  created_at: string;
};

const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  insert: "default",
  update: "secondary",
  delete: "destructive",
};

const AdminAudit = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [table, setTable] = useState<string>("all");
  const [action, setAction] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("audit_log")
      .select("id,table_name,record_id,action,actor,summary,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    const list = (data ?? []) as Row[];
    setRows(list);
    const actorIds = Array.from(new Set(list.map((r) => r.actor).filter(Boolean))) as string[];
    if (actorIds.length) {
      const { data: pData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", actorIds);
      const map: Record<string, string> = {};
      (pData ?? []).forEach((p: { id: string; full_name: string | null }) => {
        map[p.id] = p.full_name ?? "—";
      });
      setProfiles(map);
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const tables = useMemo(() => Array.from(new Set(rows.map((r) => r.table_name))).sort(), [rows]);
  const actions = useMemo(() => Array.from(new Set(rows.map((r) => r.action))).sort(), [rows]);

  const filtered = rows.filter((r) => {
    if (table !== "all" && r.table_name !== table) return false;
    if (action !== "all" && r.action !== action) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      if (
        !(r.summary ?? "").toLowerCase().includes(s) &&
        !(r.record_id ?? "").toLowerCase().includes(s) &&
        !(profiles[r.actor ?? ""] ?? "").toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Журнал действий</h1>
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Поиск" value={search} onChange={(e) => setSearch(e.target.value)} className="w-60" />
          <Select value={table} onValueChange={setTable}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Таблица" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все таблицы</SelectItem>
              {tables.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Действие" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все действия</SelectItem>
              {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Время</TableHead>
              <TableHead>Действие</TableHead>
              <TableHead>Таблица</TableHead>
              <TableHead>Запись</TableHead>
              <TableHead>Пользователь</TableHead>
              <TableHead>Описание</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="p-0"><TableSkeleton rows={6} cols={6} className="border-0 shadow-none rounded-none" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState icon={History} title="Записей нет" description="Здесь появятся действия пользователей в системе." />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("ru-RU")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ACTION_VARIANT[r.action] ?? "outline"}>{r.action}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{r.table_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-[180px]">{r.record_id ?? "—"}</TableCell>
                  <TableCell className="text-xs">{r.actor ? profiles[r.actor] ?? r.actor.slice(0, 8) : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-md truncate">{r.summary ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminAudit;