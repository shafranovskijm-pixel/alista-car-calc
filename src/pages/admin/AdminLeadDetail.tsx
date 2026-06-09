import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { toast } from "sonner";
import { ArrowLeft, Briefcase, Copy, Mail, Phone } from "lucide-react";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_VARIANT,
  LeadStatus,
} from "@/lib/leads";
import ActivityTimeline from "@/components/admin/ActivityTimeline";

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

const STATUS_DOT: Record<LeadStatus, string> = {
  new: "bg-primary",
  in_progress: "bg-sky-400",
  callback: "bg-amber-400",
  meeting: "bg-violet-400",
  contract: "bg-indigo-400",
  awaiting_payment: "bg-yellow-400",
  in_transit: "bg-cyan-400",
  delivered: "bg-teal-400",
  won: "bg-emerald-400",
  lost: "bg-rose-400",
};

const AdminLeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const createDealFromLead = async () => {
    if (!lead) return;
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id ?? null;

    const { data: client, error: cErr } = await supabase
      .from("clients")
      .insert({
        full_name: lead.full_name,
        phone: lead.phone,
        email: lead.email,
        source: lead.utm_source ?? lead.source ?? null,
        created_by: uid,
      })
      .select("id")
      .single();
    if (cErr || !client) {
      setSaving(false);
      toast.error("Не удалось создать клиента");
      return;
    }

    const { data: deal, error: dErr } = await supabase
      .from("deals")
      .insert({
        title: `Заявка ${lead.full_name}`,
        client_id: client.id,
        lead_id: lead.id,
        assigned_to: uid,
        created_by: uid,
      })
      .select("id")
      .single();
    setSaving(false);
    if (dErr || !deal) {
      toast.error("Не удалось создать сделку");
      return;
    }

    await supabase.from("leads").update({ status: "in_progress" }).eq("id", lead.id);
    toast.success("Сделка создана");
    navigate(`/admin/deals/${deal.id}`);
  };

  if (!lead) {
    return <div className="text-muted-foreground">Загрузка...</div>;
  }

  const copy = (v: string, label: string) => {
    navigator.clipboard.writeText(v);
    toast.success(`${label} скопирован`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/leads"><ArrowLeft className="h-4 w-4 mr-1" /> К списку</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={createDealFromLead} disabled={saving}>
            <Briefcase className="h-4 w-4 mr-1" /> Создать сделку
          </Button>
          <Badge variant={LEAD_STATUS_VARIANT[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT — client / UTM */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{lead.full_name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                от {new Date(lead.created_at).toLocaleDateString("ru-RU")}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <a href={`tel:${lead.phone}`} className="text-sm hover:text-primary tabular-nums">
                  {lead.phone}
                </a>
                <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto" onClick={() => copy(lead.phone, "Телефон")}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="text-sm hover:text-primary truncate">
                    {lead.email}
                  </a>
                  <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto" onClick={() => copy(lead.email!, "Email")}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {lead.message && (
                <div className="pt-2 mt-2 border-t border-border/60">
                  <div className="text-[11px] text-muted-foreground mb-1">Сообщение</div>
                  <p className="text-sm whitespace-pre-wrap">{lead.message}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Источник</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-1.5">
              <KV k="Источник" v={lead.source ?? "—"} />
              <KV k="utm_source" v={lead.utm_source ?? "—"} />
              <KV k="utm_medium" v={lead.utm_medium ?? "—"} />
              <KV k="utm_campaign" v={lead.utm_campaign ?? "—"} />
              {lead.utm_term && <KV k="utm_term" v={lead.utm_term} />}
              {lead.utm_content && <KV k="utm_content" v={lead.utm_content} />}
              {lead.page_url && (
                <div>
                  <div className="text-muted-foreground">Страница</div>
                  <a href={lead.page_url} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                    {lead.page_url}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CENTER — timeline */}
        <div className="lg:col-span-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Активности</CardTitle></CardHeader>
            <CardContent>
              <ActivityTimeline leadId={lead.id} />
              {history.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border/60">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    Изменения статуса
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {history.map((h) => (
                      <li key={h.id} className="flex items-center gap-2 text-muted-foreground">
                        <span>{new Date(h.changed_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                        {h.from_status && (
                          <>
                            <span>{LEAD_STATUS_LABELS[h.from_status]}</span>
                            <span>→</span>
                          </>
                        )}
                        <span className="text-foreground">{LEAD_STATUS_LABELS[h.to_status]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — status / assign / quick note */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Статус</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={lead.status} onValueChange={(v) => updateStatus(v as LeadStatus)} disabled={saving}>
                <SelectTrigger>
                  <span className="inline-flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[lead.status]}`} />
                    {LEAD_STATUS_LABELS[lead.status]}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="inline-flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s]}`} />
                        {LEAD_STATUS_LABELS[s]}
                      </span>
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
            <CardHeader className="pb-2"><CardTitle className="text-sm">Закреп. заметка</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} className="text-sm" />
              <Button size="sm" onClick={saveNote} disabled={saving} className="w-full">
                Сохранить
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const KV = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-2">
    <span className="text-muted-foreground">{k}</span>
    <span className="truncate text-right">{v}</span>
  </div>
);

export default AdminLeadDetail;