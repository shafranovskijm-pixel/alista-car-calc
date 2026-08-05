import type { CSSProperties } from "react";
import type { OfferClient } from "../OfferPreview";

export const PDF_FONT = "'Inter', Arial, Helvetica, sans-serif";
export const HEAD_FONT = "'Space Grotesk', 'Inter', Arial, Helvetica, sans-serif";

export const wrap: CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  whiteSpace: "normal",
  lineHeight: 1.4,
};

export const num: CSSProperties = {
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.4,
};

export const ROW_GRID = "minmax(0, 1fr) 80px 110px 120px";

/** Non-empty label/value pairs only — never renders undefined/null/empty rows. */
export const clientLines = (client?: OfferClient): string[] => {
  if (!client) return [];
  const out: string[] = [];
  if (client.contact) out.push(client.contact);
  if (client.phone) out.push(client.phone);
  if (client.email) out.push(client.email);
  if (client.inn) out.push(`ИНН ${client.inn}${client.kpp ? ` · КПП ${client.kpp}` : ""}`);
  if (client.address) out.push(client.address);
  return out;
};
