export const DOCUMENT_KINDS = [
  "contract",
  "invoice",
  "passport",
  "title",
  "dkp",
  "act",
  "other",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  contract: "Договор",
  invoice: "Инвойс",
  passport: "Паспорт",
  title: "ПТС / Title",
  dkp: "ДКП",
  act: "Акт",
  other: "Прочее",
};

export const formatBytes = (n: number | null | undefined) => {
  if (!n) return "—";
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`;
  return `${(n / 1024 / 1024).toFixed(2)} МБ`;
};