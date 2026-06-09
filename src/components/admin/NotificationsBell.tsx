import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, AlertOctagon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LEAD_STATUS_LABELS, LeadStatus } from "@/lib/leads";
import EmptyState from "./EmptyState";
import type { Task } from "@/lib/tasks";

type Notice = {
  id: string;
  full_name: string;
  status: LeadStatus;
  created_at: string;
};

export const NotificationsBell = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notice[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: leads }, { data: tasks }] = await Promise.all([
        supabase
        .from("leads")
        .select("id, full_name, status, created_at")
        .eq("status", "new")
        .order("created_at", { ascending: false })
        .limit(8),
        user
          ? supabase
              .from("tasks")
              .select("*")
              .eq("assigned_to", user.id)
              .is("completed_at", null)
              .lt("due_at", new Date().toISOString())
              .order("due_at", { ascending: true })
              .limit(8)
          : Promise.resolve({ data: [] as Task[] }),
      ]);
      setItems((leads ?? []) as Notice[]);
      setOverdueTasks((tasks ?? []) as Task[]);
    };
    load();
    const ch = supabase
      .channel("notifications-new-leads")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const unread = items.length + overdueTasks.length;

  return (
    <Popover>
      <PopoverTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-secondary/60 transition-colors">
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unread > 0 && (
          <span className={`absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-primary-foreground ${overdueTasks.length > 0 ? "bg-red-500" : "bg-primary"}`}>
            {unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        {overdueTasks.length > 0 && (
          <>
            <div className="px-3 py-2 border-b border-border text-sm font-medium flex items-center gap-2 text-red-400">
              <AlertOctagon className="h-3.5 w-3.5" /> Просроченные задачи
            </div>
            <ul className="divide-y divide-border">
              {overdueTasks.map((t) => (
                <li key={t.id}>
                  <Link to="/admin/tasks" className="flex items-start gap-2 px-3 py-2 hover:bg-secondary/60">
                    <div className="mt-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.due_at && new Date(t.due_at).toLocaleString("ru-RU")}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="px-3 py-2 border-b border-border text-sm font-medium">Новые заявки</div>
        {items.length === 0 ? (
          <EmptyState icon={Bell} title="Уведомлений нет" description="Новые заявки появятся здесь" />
        ) : (
          <ul className="max-h-80 overflow-auto divide-y divide-border">
            {items.map((it) => (
              <li key={it.id}>
                <Link to={`/admin/leads/${it.id}`} className="flex items-start gap-2 px-3 py-2 hover:bg-secondary/60">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{it.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {LEAD_STATUS_LABELS[it.status]} · {new Date(it.created_at).toLocaleString("ru-RU")}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;