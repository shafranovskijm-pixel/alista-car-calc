export const DEAL_STAGES = [
  "new",
  "qualification",
  "calculation",
  "payment",
  "delivery",
  "customs",
  "completed",
  "cancelled",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  new: "Новая",
  qualification: "Квалификация",
  calculation: "Расчёт",
  payment: "Оплата",
  delivery: "Доставка",
  customs: "Оформление",
  completed: "Завершена",
  cancelled: "Отменена",
};

export const DEAL_STAGE_COLOR: Record<DealStage, string> = {
  new: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  qualification: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  calculation: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  payment: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  delivery: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  customs: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export const DEAL_TYPES = [
  "import_car",
  "import_special",
  "customs_only",
  "other",
] as const;

export type DealType = (typeof DEAL_TYPES)[number];

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  import_car: "Импорт авто",
  import_special: "Спецтехника",
  customs_only: "Только растаможка",
  other: "Прочее",
};

export const CLIENT_TYPE_LABELS: Record<"individual" | "company", string> = {
  individual: "Физлицо",
  company: "Юрлицо",
};