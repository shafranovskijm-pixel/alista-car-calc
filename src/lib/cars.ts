import { supabase } from "@/integrations/supabase/proxy-client";
import { slugify } from "@/lib/works";

export const CAR_BUCKET = "cars";
const SIGNED_TTL = 60 * 60 * 24 * 365;

export type CarCountry = "japan" | "korea" | "china";
export type CarStatus = "in_stock" | "in_transit" | "on_order" | "sold" | "draft";
export type CarTransmission = "at" | "mt" | "cvt" | "amt" | "dct" | "other";
export type CarFuel = "petrol" | "diesel" | "hybrid" | "electric" | "gas";

export const CAR_COUNTRY_LABELS: Record<CarCountry, string> = {
  japan: "Япония",
  korea: "Корея",
  china: "Китай",
};

export const CAR_STATUS_LABELS: Record<CarStatus, string> = {
  in_stock: "В наличии",
  in_transit: "В пути",
  on_order: "Под заказ",
  sold: "Продан",
  draft: "Черновик",
};

export const CAR_TRANSMISSION_LABELS: Record<CarTransmission, string> = {
  at: "АКПП",
  mt: "МКПП",
  cvt: "Вариатор",
  amt: "Робот (AMT)",
  dct: "Робот (DCT)",
  other: "Другое",
};

export const CAR_FUEL_LABELS: Record<CarFuel, string> = {
  petrol: "Бензин",
  diesel: "Дизель",
  hybrid: "Гибрид",
  electric: "Электро",
  gas: "Газ",
};

export type Car = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  model: string;
  year: number | null;
  engine_volume: number | null;
  power_hp: number | null;
  transmission: CarTransmission | null;
  fuel: CarFuel | null;
  mileage_km: number | null;
  price: number | null;
  currency: string;
  country: CarCountry;
  status: CarStatus;
  description: string | null;
  auction_sheet_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CarPhoto = {
  id: string;
  car_id: string;
  url: string;
  sort_order: number;
  is_cover: boolean;
};

export type CarWithPhotos = Car & { photos: CarPhoto[] };

export const resolveCarPhotoUrl = async (raw: string): Promise<string> => {
  if (!raw) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  const { data, error } = await supabase.storage.from(CAR_BUCKET).createSignedUrl(raw, SIGNED_TTL);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error("Не удалось подготовить изображение");
  return data.signedUrl;
};

const sortPhotos = (photos: CarPhoto[]): CarPhoto[] =>
  [...photos].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.sort_order - b.sort_order;
  });

export const fetchPublicCars = async (country?: CarCountry): Promise<CarWithPhotos[]> => {
  let q = supabase
    .from("cars")
    .select("*, car_photos(*)")
    .neq("status", "draft")
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });
  if (country) q = q.eq("country", country);
  const { data, error } = await q;
  if (error) throw error;
  const list: CarWithPhotos[] = (data ?? []).map((c: any) => ({
    ...c,
    photos: sortPhotos(c.car_photos ?? []),
  }));
  await Promise.all(
    list.map(async (c) => {
      c.photos = await Promise.all(
        c.photos.map(async (p) => ({ ...p, url: await resolveCarPhotoUrl(p.url) }))
      );
    })
  );
  return list;
};

export const fetchAllCars = async (): Promise<CarWithPhotos[]> => {
  const { data, error } = await supabase
    .from("cars")
    .select("*, car_photos(*)")
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((c: any) => ({ ...c, photos: sortPhotos(c.car_photos ?? []) }));
};

export const fetchCar = async (idOrSlug: string): Promise<CarWithPhotos | null> => {
  const isUuid = /^[0-9a-f]{8}-/.test(idOrSlug);
  const { data, error } = await supabase
    .from("cars")
    .select("*, car_photos(*)")
    .eq(isUuid ? "id" : "slug", idOrSlug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...(data as any), photos: sortPhotos((data as any).car_photos ?? []) };
};

export const fetchCarPublic = async (slug: string): Promise<CarWithPhotos | null> => {
  const car = await fetchCar(slug);
  if (!car || car.status === "draft") return null;
  car.photos = await Promise.all(
    car.photos.map(async (p) => ({ ...p, url: await resolveCarPhotoUrl(p.url) }))
  );
  return car;
};

export const ensureUniqueCarSlug = async (base: string, ignoreId?: string): Promise<string> => {
  let slug = base;
  let n = 1;
  while (true) {
    const { data } = await supabase.from("cars").select("id").eq("slug", slug).limit(1);
    const conflict = data?.find((r) => r.id !== ignoreId);
    if (!conflict) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
};

export const uploadCarPhoto = async (carId: string, file: File): Promise<string> => {
  const ext = file.name.split(".").pop() || "jpg";
  const key = `${carId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(CAR_BUCKET).upload(key, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return key;
};

export const deleteCarPhotoFromStorage = async (url: string) => {
  if (/^https?:\/\//i.test(url) || url.startsWith("/")) return;
  await supabase.storage.from(CAR_BUCKET).remove([url]);
};

export const makeCarSlug = (brand: string, model: string, year?: number | null) =>
  slugify([brand, model, year].filter(Boolean).join(" "));

export const formatPrice = (price: number | null, currency: string) => {
  if (price == null) return "Цена по запросу";
  const symbol = currency === "RUB" ? "₽" : currency;
  return `${new Intl.NumberFormat("ru-RU").format(price)} ${symbol}`;
};
