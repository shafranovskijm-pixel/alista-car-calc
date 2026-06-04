export const LEAD_STATUSES = [
  "new",
  "in_progress",
  "callback",
  "meeting",
  "contract",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  callback: "Перезвон",
  meeting: "Встреча",
  contract: "Договор",
  won: "Успех",
  lost: "Отказ",
};

export const LEAD_STATUS_VARIANT: Record<
  LeadStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  new: "default",
  in_progress: "secondary",
  callback: "outline",
  meeting: "outline",
  contract: "secondary",
  won: "default",
  lost: "destructive",
};