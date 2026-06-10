import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/proxy-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Check,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Trash2,
  Users,
} from "lucide-react";

type ActivityType = "note" | "call" | "meeting" | "email" | "task";

type Activity = {
  id: string;
  type: ActivityType;
  title: string | null;
  body: string | null;
  due_at: string | null;
  done_at: string | null;
  created_by: string | null;
  created_at: string;
};

const TYPE_META: Record<ActivityType, { label: string; icon: typeof Phone; color: string }> = {
  note: { label: "Заметка", icon: MessageSquare, color: "text-sky-400" },
  call: { label: "Звонок", icon: Phone, color: "text-emerald-400" },
  meeting: { label: "Встреча", icon: Users, color: "text-violet-400" },
  email: { label: "Email", icon: Mail, color: "text-amber-400" },
  task: { label: "Задача", icon: Check, color: "text-primary" },
};

type Props = {
  leadId?: string;
  dealId?: string;
  clientId?: string;
};

const ActivityTimeline = ({ leadId, dealId, clientId }: Props) => {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<ActivityType>("note");
  const [body, setBody] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const filterCol = leadId ? "lead_id" : dealId ? "deal_id" : "client_id";
  const filterVal = leadId ?? dealId ?? clientId ?? "";

  const load = async () => {
    if (!filterVal) return;
    setLoading(true);
    const { data } = await supabase
      .from("lead_activities")
      .select("id, type, title, body, due_at, done_at, created_by, created_at")
      .eq(filterCol, filterVal)
      .order("created_at", { ascending: false })
      .limit(200);
    setItems((data ?? []) as Activity[]);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterVal]);

  const submit = async () => {
    if (!body.trim() && type !== "task") {
      bodyRef.current?.focus();
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("lead_activities").insert({
      lead_id: leadId ?? null,
      deal_id: dealId ?? null,
      client_id: clientId ?? null,
      type,
      body: body.trim() || null,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      created_by: me,
    });
    setSaving(false);
    if (error) {
      toast.error("Не удалось сохранить");
      return;
    }
    setBody("");
    setDueAt("");
    load();
  };

  const toggleDone = async (a: Activity) => {
    const done_at = a.done_at ? null : new Date().toISOString();
    setItems((xs) => xs.map((x) => (x.id === a.id ? { ...x, done_at } : x)));
    const { error } = await supabase.from("lead_activities").update({ done_at }).eq("id", a.id);
    if (error) {
      toast.error("Ошибка");
      load();
    }
  };

  const remove = async (a: Activity) => {
    if (!confirm("Удалить запись?")) return;
    const { error } = await supabase.from("lead_activities").delete().eq("id", a.id);
    if (error) toast.error("Ошибка удаления");
    else load();
  };

  const grouped = useMemo(() => {
    const byDay = new Map<string, Activity[]>();
    items.forEach((a) => {
      const key = new Date(a.created_at).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(a);
    });
    return Array.from(byDay.entries());
  }, [items]);

  return (
    <div className="space-y-4">
      {/* Composer */}
      <div className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
        <Tabs value={type} onValueChange={(v) => setType(v as ActivityType)}>
          <TabsList className="h-8">
            {(Object.keys(TYPE_META) as ActivityType[]).map((t) => {
              const M = TYPE_META[t];
              const I = M.icon;
              return (
                <TabsTrigger key={t} value={t} className="h-6 px-2 text-xs gap-1">
                  <I className="h-3 w-3" /> {M.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        <Textarea
          ref={bodyRef}
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            type === "call" ? "Что обсудили?" :
            type === "meeting" ? "Что обсудили на встрече?" :
            type === "task" ? "Что нужно сделать?" :
            type === "email" ? "Тема и суть письма" :
            "Заметка..."
          }
          className="resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="flex items-center gap-2 flex-wrap">
          {type === "task" && (
            <Input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="h-8 text-xs w-52"
            />
          )}
          <span className="text-[11px] text-muted-foreground ml-auto">
            <kbd className="px-1 py-0.5 rounded bg-muted">⌘↵</kbd>
          </span>
          <Button size="sm" onClick={submit} disabled={saving} className="h-8">
            Добавить
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Загрузка...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
          Пока нет активностей
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([day, list]) => (
            <div key={day}>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                {day}
              </div>
              <ol className="relative border-l border-border/60 ml-3 space-y-3">
                {list.map((a) => {
                  const M = TYPE_META[a.type];
                  const Icon = M.icon;
                  const done = !!a.done_at;
                  const overdue = a.type === "task" && a.due_at && !done && new Date(a.due_at) < new Date();
                  const canEdit = a.created_by === me;
                  return (
                    <li key={a.id} className="ml-4 group">
                      <span
                        className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background ${
                          done ? "bg-emerald-500/20" : "bg-card border border-border"
                        }`}
                      >
                        <Icon className={`h-2.5 w-2.5 ${done ? "text-emerald-400" : M.color}`} />
                      </span>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`font-medium ${M.color}`}>{M.label}</span>
                            <span className="text-muted-foreground">
                              {new Date(a.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {a.due_at && (
                              <span className={`inline-flex items-center gap-1 ${overdue ? "text-rose-400" : "text-muted-foreground"}`}>
                                <Clock className="h-3 w-3" />
                                {new Date(a.due_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </div>
                          {a.body && (
                            <div className={`text-sm mt-1 whitespace-pre-wrap ${done ? "line-through text-muted-foreground" : ""}`}>
                              {a.body}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {a.type === "task" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => toggleDone(a)}
                              title={done ? "Снять отметку" : "Выполнено"}
                            >
                              <Check className={`h-3.5 w-3.5 ${done ? "text-emerald-400" : ""}`} />
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-rose-400/70 hover:text-rose-400"
                              onClick={() => remove(a)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;