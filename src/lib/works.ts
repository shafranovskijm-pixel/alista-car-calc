import { supabase } from "@/integrations/supabase/client";

export type Work = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  price: number | null;
  country: string | null;
  description: string | null;
  status: string;
  sort_order: number;
  source_date: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkPhoto = {
  id: string;
  work_id: string;
  url: string;
  sort_order: number;
  is_cover: boolean;
};

export type WorkWithPhotos = Work & { photos: WorkPhoto[] };

const BUCKET = "works";
const SIGNED_TTL = 60 * 60 * 24 * 365; // 1 year

// Resolve a stored url to a renderable url.
// Stored urls may be:
//   - external/CDN absolute paths starting with "/__l5e/" → use as-is
//   - http(s)://... → use as-is
//   - bucket key (e.g. "abc/photo.jpg") → sign via Storage
export const resolvePhotoUrl = async (raw: string): Promise<string> => {
  if (!raw) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(raw, SIGNED_TTL);
  return data?.signedUrl ?? "";
};

export const resolvePhotos = async (photos: WorkPhoto[]): Promise<WorkPhoto[]> => {
  const out = await Promise.all(
    photos.map(async (p) => ({ ...p, url: await resolvePhotoUrl(p.url) }))
  );
  return out;
};

export const fetchPublishedWorks = async (): Promise<WorkWithPhotos[]> => {
  const { data: works, error } = await supabase
    .from("works")
    .select("*, work_photos(*)")
    .eq("status", "published")
    .order("sort_order", { ascending: false })
    .order("source_date", { ascending: false, nullsFirst: false });
  if (error) throw error;

  const list: WorkWithPhotos[] = (works ?? []).map((w: any) => ({
    ...w,
    photos: (w.work_photos ?? []).sort((a: WorkPhoto, b: WorkPhoto) => {
      if (a.is_cover && !b.is_cover) return -1;
      if (!a.is_cover && b.is_cover) return 1;
      return a.sort_order - b.sort_order;
    }),
  }));

  // Resolve bucket keys to signed urls in parallel
  await Promise.all(
    list.map(async (w) => {
      w.photos = await resolvePhotos(w.photos);
    })
  );

  return list;
};

export const fetchAllWorks = async (): Promise<WorkWithPhotos[]> => {
  const { data, error } = await supabase
    .from("works")
    .select("*, work_photos(*)")
    .order("sort_order", { ascending: false })
    .order("source_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map((w: any) => ({
    ...w,
    photos: (w.work_photos ?? []).sort((a: WorkPhoto, b: WorkPhoto) => a.sort_order - b.sort_order),
  }));
};

export const fetchWork = async (id: string): Promise<WorkWithPhotos | null> => {
  const { data, error } = await supabase
    .from("works")
    .select("*, work_photos(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const photos = ((data as any).work_photos ?? []).sort(
    (a: WorkPhoto, b: WorkPhoto) => a.sort_order - b.sort_order
  );
  return { ...(data as any), photos };
};

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[а-я]/g, (c) => {
      const map: Record<string, string> = {
        а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
        з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
        п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
        ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
      };
      return map[c] ?? c;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "work-" + Date.now();

export const ensureUniqueSlug = async (base: string, ignoreId?: string): Promise<string> => {
  let slug = base;
  let n = 1;
  while (true) {
    let q = supabase.from("works").select("id").eq("slug", slug).limit(1);
    const { data } = await q;
    const conflict = data?.find((r) => r.id !== ignoreId);
    if (!conflict) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
};

export const uploadWorkPhoto = async (workId: string, file: File): Promise<string> => {
  const ext = file.name.split(".").pop() || "jpg";
  const key = `${workId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return key;
};

export const deleteWorkPhotoFromStorage = async (url: string) => {
  if (/^https?:\/\//i.test(url) || url.startsWith("/")) return; // external, can't delete
  await supabase.storage.from(BUCKET).remove([url]);
};