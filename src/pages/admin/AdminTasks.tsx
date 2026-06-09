import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HintCard from "@/components/admin/HintCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarClock, CheckCircle2, Plus, Trash2, AlertOctagon, User as UserIcon } from "lucide-react";
import EmptyState from "@/components/admin/EmptyState";
import {
  Task,
  TaskPriority,
  TASK_PRIORITY_DOT,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_ORDER,
  isOverdue,
  relatedHref,
  relatedLabel,
} from "@/lib/tasks";
import { toast } from "sonner";

type Scope = "mine" | "all";
type Filter = "open" | "today" | "overdue" | "upcoming" | "done";

const AdminTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<Scope>(() => (localStorage.getItem("tasks_scope") as Scope) || "mine");
  const [filter, setFilter] = useState<Filter>(() => (localStorage.getItem("tasks_filter") as Filter) || "open");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => localStorage.setItem("tasks_scope", scope), [scope]);
  useEffect(() => localStorage.setItem("tasks_filter", filter), [filter]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("completed_at", { ascending: true, nullsFirst: true })
      .order("due_at", { ascending: true, nullsFirst: false });
    if (error) toast.error(error.message);
    setTasks((data ?? []) as Task[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("tasks-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = tasks;
    if (scope === "mine" && user) list = list.filter((t) => t.assigned_to === user.id);
    const now = Date.now();
    list = list.filter((t) => {
      if (filter === "done") return !!t.completed_at;
      if (t.completed_at) return false;
      if (filter === "open") return true;
      if (filter === "overdue") return !!t.due_at && new Date(t.due_at).getTime() < now;
      if (filter === "today") {
        if (!t.due_at) return false;
        return new Date(t.due_at).toDateString() === new Date().toDateString();
      }
      if (filter === "upcoming") return !!t.due_at && new Date(t.due_at).getTime() >= now;
      return true;
    });
    return list.sort((a, b) => {
      const aD = a.due_at ? new Date(a.due_at).getTime() : Infinity;
      const bD = b.due_at ? new Date(b.due_at).getTime() : Infinity;
      return aD - bD;
    });
  }, [tasks, scope, filter, user]);

  const counts = useMemo(() => {
    const mine = user ? tasks.filter((t) => t.assigned_to === user.id) : [];
    const base = scope === "mine" ? mine : tasks;
    const now = Date.now();
    return {
      open: base.filter((t) => !t.completed_at).length,
      today: base.filter((t) => !t.completed_at && t.due_at && new Date(t.due_at).toDateString() === new Date().toDateString()).length,
      overdue: base.filter((t) => !t.completed_at && t.due_at && new Date(t.due_at).getTime() < now).length,
      upcoming: base.filter((t) => !t.completed_at && t.due_at && new Date(t.due_at).getTime() >= now).length,
      done: base.filter((t) => !!t.completed_at).length,
    };
  }, [tasks, scope, user]);

  const toggleDone = async (t: Task) => {
    const next = t.completed_at ? null : new Date().toISOString();
    setTasks((cur) => cur.map((x) => (x.id === t.id ? { ...x, completed_at: next } : x)));
    const { error } = await supabase.from("tasks").update({ completed_at: next }).eq("id", t.id);
    if (error) {
      toast.error(error.message);
      load();
    }
  };

  const remove = async (t: Task) => {
    if (!confirm("Удалить задачу?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", t.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Задача удалена");
      load();
    }
  };

  const assignMe = async (t: Task) => {
    if (!user) return;
    const { error } = await supabase.from("tasks").update({ assigned_to: user.id }).eq("id", t.id);
    if (error) toast.error(error.message);
    else toast.success("Назначено вам");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold">Задачи</h1>
        <div className="flex items-center gap-2">
          <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <TabsList>
              <TabsTrigger value="mine">Мои</TabsTrigger>
              <TabsTrigger value="all">Все</TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" /> Новая задача
              </Button>
            </DialogTrigger>
            <TaskCreateDialog
              onCreated={() => {
                setCreateOpen(false);
                load();
              }}
            />
          </Dialog>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="open">
            Открытые <Badge variant="secondary" className="ml-1.5">{counts.open}</Badge>
          </TabsTrigger>
          <TabsTrigger value="today">
            Сегодня <Badge variant="secondary" className="ml-1.5">{counts.today}</Badge>
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Просроченные{" "}
            <Badge variant={counts.overdue > 0 ? "destructive" : "secondary"} className="ml-1.5">
              {counts.overdue}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Грядущие <Badge variant="secondary" className="ml-1.5">{counts.upcoming}</Badge>
          </TabsTrigger>
          <TabsTrigger value="done">
            Завершённые <Badge variant="secondary" className="ml-1.5">{counts.done}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <ul className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="p-4 flex items-center gap-3">
                  <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-1/2 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
                  </div>
                </li>
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={CheckCircle2}
                title="Задач нет"
                description={filter === "overdue" ? "Никаких просрочек — отлично!" : "Создайте новую задачу"}
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((t) => {
                const overdue = isOverdue(t);
                const href = relatedHref(t.related_type, t.related_id);
                return (
                  <li key={t.id} className="group flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <Checkbox
                      checked={!!t.completed_at}
                      onCheckedChange={() => toggleDone(t)}
                      className="mt-1"
                    />
                    <span className={`mt-2 h-2 w-2 rounded-full shrink-0 ${TASK_PRIORITY_DOT[t.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${t.completed_at ? "line-through text-muted-foreground" : ""}`}>
                        {t.title}
                      </div>
                      {t.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {t.due_at && (
                          <span className={`inline-flex items-center gap-1 text-[11px] ${overdue ? "text-red-400" : "text-muted-foreground"}`}>
                            {overdue ? <AlertOctagon className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
                            {new Date(t.due_at).toLocaleString("ru-RU", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        <Badge variant="outline" className="text-[10px] h-5">{TASK_PRIORITY_LABELS[t.priority]}</Badge>
                        {href && (
                          <Link to={href} className="text-[11px] text-primary hover:underline">
                            {relatedLabel(t.related_type)} →
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {user && t.assigned_to !== user.id && (
                        <Button size="sm" variant="ghost" onClick={() => assignMe(t)} title="Назначить мне">
                          <UserIcon className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => remove(t)} title="Удалить">
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const TaskCreateDialog = ({ onCreated }: { onCreated: () => void }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("tasks").insert({
      title: title.trim(),
      description: description.trim() || null,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      priority,
      assigned_to: user.id,
      created_by: user.id,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Задача создана");
      setTitle("");
      setDescription("");
      setDueAt("");
      setPriority("normal");
      onCreated();
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Новая задача</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label className="mb-1.5 block text-xs">Название</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Позвонить клиенту"
            maxLength={200}
            autoFocus
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Описание</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block text-xs">Срок</Label>
            <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Приоритет</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITY_ORDER.map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${TASK_PRIORITY_DOT[p]}`} />
                      {TASK_PRIORITY_LABELS[p]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={!title.trim() || saving}>
          {saving ? "Сохранение..." : "Создать"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default AdminTasks;