import { supabase } from "@/integrations/supabase/proxy-client";

export type OfferStatus = "draft" | "sent" | "viewed" | "accepted" | "declined";
export type OfferTemplate = "premium_dark" | "clean_light" | "executive";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  base_price: number;
  category: string;
  active: boolean;
  sort_order: number;
};

export type OfferItem = {
  id: string;
  offer_id: string;
  name: string;
  description: string | null;
  unit: string;
  qty: number;
  price: number;
  amount: number;
  sort_order: number;
};

export type Offer = {
  id: string;
  number: number;
  client_id: string | null;
  deal_id: string | null;
  title: string;
  intro: string | null;
  template: OfferTemplate;
  currency: string;
  vat_included: boolean;
  vat_rate: number;
  valid_days: number;
  status: OfferStatus;
  subtotal: number;
  vat_amount: number;
  total: number;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const CATEGORY_LABEL: Record<string, string> = {
  customs: "Таможенное оформление",
  lab: "Лаборатории и сертификация",
  logistics: "Логистика и доставка",
  extra: "Дополнительные услуги",
  other: "Прочее",
};

export const TEMPLATE_META: Record<OfferTemplate, { label: string; desc: string; accent: string }> = {
  premium_dark: {
    label: "Premium Dark",
    desc: "Тёмный фон, неоновый акцент — эффектно и премиально",
    accent: "from-primary/40 to-primary/10",
  },
  clean_light: {
    label: "Clean Light",
    desc: "Светлый минимализм, отлично читается на печати",
    accent: "from-sky-200 to-white",
  },
  executive: {
    label: "Executive",
    desc: "Титульный лист + смета, для крупных сделок",
    accent: "from-slate-800 to-primary/30",
  },
};

export const STATUS_LABEL: Record<OfferStatus, string> = {
  draft: "Черновик",
  sent: "Отправлено",
  viewed: "Просмотрено",
  accepted: "Принято",
  declined: "Отклонено",
};

export const money = (v: number, ccy = "RUB") =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: ccy,
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

export const recalcOffer = (
  items: Pick<OfferItem, "qty" | "price">[],
  vatRate: number,
  vatIncluded: boolean,
) => {
  const gross = items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0), 0);
  if (vatIncluded) {
    const vat = (gross * vatRate) / (100 + vatRate);
    return { subtotal: gross - vat, vat_amount: vat, total: gross };
  }
  const vat = (gross * vatRate) / 100;
  return { subtotal: gross, vat_amount: vat, total: gross + vat };
};

export const fetchServices = async () => {
  const { data, error } = await supabase
    .from("services_catalog")
    .select("*")
    .eq("active", true)
    .order("category")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Service[];
};

export const fetchOffers = async () => {
  const { data, error } = await supabase
    .from("offers")
    .select("*, clients(full_name, company_name, email)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as (Offer & {
    clients: { full_name: string; company_name: string | null; email: string | null } | null;
  })[];
};

export const fetchOffer = async (id: string) => {
  const [{ data: offer, error: e1 }, { data: items, error: e2 }] = await Promise.all([
    supabase.from("offers").select("*, clients(*)").eq("id", id).maybeSingle(),
    supabase.from("offer_items").select("*").eq("offer_id", id).order("sort_order"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return { offer: offer as unknown as Offer & { clients: Record<string, unknown> | null }, items: (items ?? []) as OfferItem[] };
};

export const createOffer = async (patch: Partial<Offer>) => {
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("offers")
    .insert({ ...patch, created_by: user.user?.id ?? null } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as Offer;
};

export const updateOffer = async (id: string, patch: Partial<Offer>) => {
  const { error } = await supabase.from("offers").update(patch as never).eq("id", id);
  if (error) throw error;
};

export const deleteOffer = async (id: string) => {
  const { error } = await supabase.from("offers").delete().eq("id", id);
  if (error) throw error;
};

export const replaceOfferItems = async (offerId: string, items: Partial<OfferItem>[]) => {
  await supabase.from("offer_items").delete().eq("offer_id", offerId);
  if (!items.length) return;
  const payload = items.map((it, i) => ({
    offer_id: offerId,
    name: it.name ?? "",
    description: it.description ?? null,
    unit: it.unit ?? "шт",
    qty: Number(it.qty || 0),
    price: Number(it.price || 0),
    amount: Number(it.qty || 0) * Number(it.price || 0),
    sort_order: i,
  }));
  const { error } = await supabase.from("offer_items").insert(payload as never);
  if (error) throw error;
};