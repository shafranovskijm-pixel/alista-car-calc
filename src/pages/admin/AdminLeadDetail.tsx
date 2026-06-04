import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { ArrowLeft } from "lucide-react";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_VARIANT,
  LeadStatus,
} from "@/lib/leads";

type Lead = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  page_url: string | null;
  message: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type HistoryRow = {
  id: string;
  from_status: LeadStatus | null;
  to_status: LeadStatus;
  changed_at: string;
};

const AdminLeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
    if (error || !data) {
      toast.error("Не удалось загрузить заявку");
      return;
    }
    setLead(data as Lead);
    setNote(data.note ?? "");
    const { data: hist } = await supabase
      .from("lead_status_history")
      .select("id, from_status, to_status, changed_at")
      .eq("lead_id", id)
      .order("changed_at", { ascending: false });
    setHistory((hist ?? []) as HistoryRow[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async (status: LeadStatus) => {
    if (!lead) return;
    setSaving(true);
    const { error } = await supabase.from("leads").update({ status }).eq("id", lead.id);
    setSaving(false);
    if (error) toast.error("Ошибка обновления статуса");
    else {
      toast.success("Статус обновлён");
      load();
    }
  };

  const takeOwnership = async () => {
    if (!lead || !user) return;
    setSaving(true);
    const { error } = await supabase.from("leads").update({ assigned_to: user.id }).eq("id", lead.id);
    setSaving(false);
    if (error) toast.error("Не удалось назначить");
    else {
      toast.success("Заявка назначена на вас");
      load();
    }
  };

  const saveNote = async () => {
    if (!lead) return;
    setSaving(true);
    const { error } = await supabase.from("leads").update({ note }).eq("id", lead.id);
    setSaving(false);
    if (error) toast.error("Ошибка сохранения");
    else toast.success("Заметка сохранена");
  };

  if (!lead) {
    return <div className="text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/leads">
            <ArrowLeft className="h-4 w-4 mr-1" /> К списку
          </Link>
        </Button>
        <Badge variant={LEAD_STATUS_VARIANT[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{lead.full_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Телефон" value={<a className="text-primary hover:underline" href={`tel:${lead.phone}`}>{lead.phone}</a>} />
            <Row label="Email" value={lead.email ? <a className="text-primary hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a> : "—"} />
            <Row label="Сообщение" value={lead.message ?? "—"} />
            <Row label="Страница" value={lead.page_url ?? "—"} />
            <Row label="Источник" value={lead.source ?? "—"} />
            <Row label="UTM source" value={lead.utm_source ?? "—"} />
            <Row label="UTM medium" value={lead.utm_medium ?? "—"} />
            <Row label="UTM campaign" value={lead.utm_campaign ?? "—"} />
            <Row label="UTM term" value={lead.utm_term ?? "—"} />
            <Row label="UTM content" value={lead.utm_content ?? "—"} />
            <Row label="Создана" value={new Date(lead.created_at).toLocaleString("ru-RU")} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Статус</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={lead.status} onValueChange={(v) => updateStatus(v as LeadStatus)} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {LEAD_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                Назначена: {lead.assigned_to ? (lead.assigned_to === user?.id ? "Вам" : "Другому менеджеру") : "Никому"}
              </div>
              {lead.assigned_to !== user?.id && (
                <Button size="sm" variant="outline" className="w-full" onClick={takeOwnership} disabled={saving}>
                  Взять в работу
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Заметка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} />
              <Button size="sm" onClick={saveNote} disabled={saving} className="w-full">
                Сохранить
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">История статусов</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground">Нет изменений</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex items-center gap-2">
                  <span className="text-muted-foreground">{new Date(h.changed_at).toLocaleString("ru-RU")}</span>
                  {h.from_status && (
                    <>
                      <Badge variant="outline">{LEAD_STATUS_LABELS[h.from_status]}</Badge>
                      <span>→</span>
                    </>
                  )}
                  <Badge variant={LEAD_STATUS_VARIANT[h.to_status]}>{LEAD_STATUS_LABELS[h.to_status]}</Badge>
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

export default AdminLeadDetail;