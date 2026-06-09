import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ListTodo, AlertOctagon, ArrowRight } from "lucide-react";
import EmptyState from "./EmptyState";
import { Task, TASK_PRIORITY_DOT, isOverdue, relatedHref, relatedLabel } from "@/lib/tasks";
import { toast } from "sonner";

const TasksWidget = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("assigned_to", user.id)
      .is("completed_at", null)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(20);
    setTasks((data ?? []) as Task[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("tasks-widget")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const toggleDone = async (t: Task) => {
    setTasks((cur) => cur.filter((x) => x.id !== t.id));
    const { error } = await supabase.from("tasks").update({ completed_at: new Date().toISOString() }).eq("id", t.id);
    if (error) {
      toast.error(error.message);
      load();
    } else toast.success("Готово");
  };

  const now = Date.now();
  const overdue = tasks.filter((t) => t.due_at && new Date(t.due_at).getTime() < now);
  const today = tasks.filter((t) => t.due_at && new Date(t.due_at).toDateString() === new Date().toDateString() && new Date(t.due_at).getTime() >= now);
  const upcoming = tasks.filter((t) => !overdue.includes(t) && !today.includes(t)).slice(0, 4);

  const visible = [...overdue, ...today, ...upcoming].slice(0, 8);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-primary" />
          Мои задачи
        </CardTitle>
        <div className="flex items-center gap-1.5">
          {overdue.length > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              <AlertOctagon className="h-3 w-3 mr-0.5" /> {overdue.length}
            </Badge>
          )}
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {visible.length === 0 ? (
          <EmptyState icon={ListTodo} title="Задач нет" description="Создайте задачу в разделе «Задачи»" />
        ) : (
          <ul className="space-y-1">
            {visible.map((t) => {
              const od = isOverdue(t);
              const href = relatedHref(t.related_type, t.related_id);
              return (
                <li key={t.id} className="group flex items-center gap-2 px-2 py-1.5 -mx-2 rounded-md hover:bg-muted/40 transition-colors">
                  <Checkbox checked={false} onCheckedChange={() => toggleDone(t)} className="shrink-0" />
                  <span className={`h-2 w-2 rounded-full shrink-0 ${TASK_PRIORITY_DOT[t.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{t.title}</div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {t.due_at && (
                        <span className={od ? "text-red-400" : ""}>
                          {new Date(t.due_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      {href && (
                        <Link to={href} className="hover:underline">
                          {relatedLabel(t.related_type)}
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Button asChild variant="ghost" size="sm" className="w-full mt-2 justify-between">
          <Link to="/admin/tasks">
            Все задачи <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default TasksWidget;