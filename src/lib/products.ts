import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/works";

export const PRODUCT_BUCKET = "products";
const SIGNED_TTL = 60 * 60 * 24 * 365;

export type ProductStatus = "draft" | "published" | "archived";

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Черновик",
  published: "Опубликован",
  archived: "Архив",
};

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price_cny: number | null;
  weight_kg: number | null;
  dimensions: string | null;
  min_order: number | null;
  hero_photo_path: string | null;
  status: ProductStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductPhoto = {
  id: string;
  product_id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
};

export type ProductWithPhotos = Product & { photos: ProductPhoto[] };

export const resolveProductPhotoUrl = async (raw: string | null | undefined): Promise<string> => {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  const { data } = await supabase.storage.from(PRODUCT_BUCKET).createSignedUrl(raw, SIGNED_TTL);
  return data?.signedUrl ?? "";
};

export const fetchCategories = async (onlyActive = false): Promise<ProductCategory[]> => {
  let q = supabase.from("product_categories").select("*").order("sort_order").order("name");
  if (onlyActive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
};

export const fetchPublicProducts = async (categoryId?: string): Promise<ProductWithPhotos[]> => {
  let q = supabase
    .from("products")
    .select("*, product_photos(*)")
    .eq("status", "published")
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data, error } = await q;
  if (error) throw error;
  const list = (data ?? []).map((p: any) => ({
    ...p,
    photos: (p.product_photos ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  })) as ProductWithPhotos[];
  // resolve hero urls
  return list;
};

export const fetchAllProducts = async (): Promise<ProductWithPhotos[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_photos(*)")
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    ...p,
    photos: (p.product_photos ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  })) as ProductWithPhotos[];
};

export const fetchProduct = async (idOrSlug: string): Promise<ProductWithPhotos | null> => {
  const isUuid = /^[0-9a-f]{8}-/.test(idOrSlug);
  const { data, error } = await supabase
    .from("products")
    .select("*, product_photos(*)")
    .eq(isUuid ? "id" : "slug", idOrSlug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...(data as any),
    photos: ((data as any).product_photos ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  };
};

export const ensureUniqueProductSlug = async (base: string, ignoreId?: string): Promise<string> => {
  let slug = base;
  let n = 1;
  while (true) {
    const { data } = await supabase.from("products").select("id").eq("slug", slug).limit(1);
    const conflict = data?.find((r) => r.id !== ignoreId);
    if (!conflict) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
};

export const ensureUniqueCategorySlug = async (base: string, ignoreId?: string): Promise<string> => {
  let slug = base;
  let n = 1;
  while (true) {
    const { data } = await supabase.from("product_categories").select("id").eq("slug", slug).limit(1);
    const conflict = data?.find((r) => r.id !== ignoreId);
    if (!conflict) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
};

export const uploadProductPhoto = async (productId: string, file: File): Promise<string> => {
  const ext = file.name.split(".").pop() || "jpg";
  const key = `${productId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(key, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return key;
};

export const deleteProductPhotoFromStorage = async (path: string) => {
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return;
  await supabase.storage.from(PRODUCT_BUCKET).remove([path]);
};

export const makeProductSlug = (name: string) => slugify(name);

export const formatCny = (price: number | null) => {
  if (price == null) return "Цена по запросу";
  return `${new Intl.NumberFormat("ru-RU").format(price)} ¥`;
};