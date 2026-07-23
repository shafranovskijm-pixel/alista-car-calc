import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import HintCard from "@/components/admin/HintCard";
import { FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { Offer, STATUS_LABEL, deleteOffer, fetchOffers, money } from "@/lib/offers";
import { toast } from "@/hooks/use-toast";

type Row = Offer & {
  clients: { full_name: string; company_name: string | null; email: string | null } | null;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  sent: "default",
  viewed: "outline",
  accepted: "default",
  declined: "destructive",
};

const AdminOffers = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchOffers();
      setRows(data as Row[]);
    } catch (e) {
      toast({ title: "Ошибка загрузки", description: (e as Error).message, variant: "destructive" });
    }
    setLoading(false);
  };
  useEffect(() => {
    document.title = "Коммерческие предложения | CRM ALISTA";
    load();
  }, []);

  const filtered = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (!q) return true;
    const s = (r.title + " " + (r.clients?.full_name ?? "") + " " + (r.clients?.company_name ?? "") + " " + r.number).toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const remove = async (id: string) => {
    if (!confirm("Удалить КП безвозвратно?")) return;
    try {
      await deleteOffer(id);
      toast({ title: "Удалено" });
      load();
    } catch (e) {
      toast({ title: "Не удалось удалить", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">Коммерческие предложения</h1>
          <p className="text-sm text-muted-foreground">Создавайте, редактируйте и отправляйте КП клиентам</p>
        </div>
        <Button onClick={() => navigate("/admin/offers/new")}>
          <Plus className="h-4 w-4 mr-2" /> Создать КП
        </Button>
      </div>

      <HintCard title="Что здесь делать" storageKey="offers">
        Готовые красивые шаблоны в фирменном стиле Alista. Выбираете клиента, набираете
        услуги из каталога (растаможка, лаборатории, логистика), правите цены — и отправляете PDF на email одной кнопкой.
        Все КП сохраняются и видны в карточке клиента и сделки.
      </HintCard>

      <Card className="p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Поиск: номер, клиент, тема..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="Пока нет предложений"
            description="Создайте первое коммерческое предложение для клиента"
            action={{ label: "Создать КП", onClick: () => navigate("/admin/offers/new") }}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">№</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead className="hidden md:table-cell">Тема</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="hidden sm:table-cell">Дата</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/offers/${r.id}`)}
                  >
                    <TableCell className="font-mono font-semibold text-primary">#{r.number}</TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {r.clients?.company_name || r.clients?.full_name || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[280px] truncate">{r.title}</TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap">{money(r.total, r.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("ru-RU")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); remove(r.id); }}
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminOffers;