import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HintCard from "@/components/admin/HintCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import { Mail } from "lucide-react";

type Row = {
  id: string;
  recipient: string;
  subject: string;
  status: string;
  error: string | null;
  kind: string;
  created_at: string;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  failed: "destructive",
  pending: "secondary",
};

const KIND_LABEL: Record<string, string> = {
  notification: "Уведомление",
  document: "Документ",
  test: "Тест",
  other: "Другое",
};

const AdminEmails = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_log")
      .select("id, recipient, subject, status, error, kind, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (search.trim() && !r.recipient.toLowerCase().includes(search.toLowerCase()) && !r.subject.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Письма</h1>
        <div className="flex gap-2">
          <Input placeholder="Поиск" value={search} onChange={(e) => setSearch(e.target.value)} className="w-60" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="sent">Отправлено</SelectItem>
              <SelectItem value="failed">Ошибка</SelectItem>
              <SelectItem value="pending">Ожидает</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <HintCard storageKey="emails" title="История исходящих писем">
        Журнал всех email, отправленных из CRM: уведомления клиентам, ответы на заявки, документы. Видны
        статусы доставки (отправлено, ошибка, ожидает) — если письмо «не дошло», ищите причину здесь.
      </HintCard>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Время</TableHead>
              <TableHead>Получатель</TableHead>
              <TableHead>Тема</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Ошибка</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Загрузка…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState icon={Mail} title="Писем нет" description="Здесь появятся все исходящие письма из CRM." />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("ru-RU")}
                  </TableCell>
                  <TableCell className="text-sm">{r.recipient}</TableCell>
                  <TableCell className="text-sm max-w-md truncate">{r.subject}</TableCell>
                  <TableCell><Badge variant="outline">{KIND_LABEL[r.kind] ?? r.kind}</Badge></TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>{r.status}</Badge></TableCell>
                  <TableCell className="text-xs text-destructive max-w-xs truncate">{r.error ?? ""}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminEmails;