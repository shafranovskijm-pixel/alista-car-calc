import type { Database } from "@/integrations/supabase/types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];
export type TaskRelatedType = "lead" | "deal" | "client";

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Низкий",
  normal: "Обычный",
  high: "Высокий",
  urgent: "Срочно",
};

export const TASK_PRIORITY_DOT: Record<TaskPriority, string> = {
  low: "bg-zinc-400",
  normal: "bg-sky-400",
  high: "bg-amber-400",
  urgent: "bg-red-500 animate-pulse",
};

export const TASK_PRIORITY_ORDER: TaskPriority[] = ["urgent", "high", "normal", "low"];

export const isOverdue = (t: Pick<Task, "due_at" | "completed_at">) =>
  !t.completed_at && !!t.due_at && new Date(t.due_at).getTime() < Date.now();

export const isToday = (t: Pick<Task, "due_at" | "completed_at">) => {
  if (t.completed_at || !t.due_at) return false;
  const d = new Date(t.due_at);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

export const relatedHref = (type: string | null, id: string | null) => {
  if (!type || !id) return null;
  if (type === "lead") return `/admin/leads/${id}`;
  if (type === "deal") return `/admin/deals/${id}`;
  if (type === "client") return `/admin/clients/${id}`;
  return null;
};

export const relatedLabel = (type: string | null) =>
  type === "lead" ? "Заявка" : type === "deal" ? "Сделка" : type === "client" ? "Клиент" : "—";