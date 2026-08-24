import { supabase } from "@/integrations/supabase/proxy-client";

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
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(raw, SIGNED_TTL);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error("Не удалось подготовить изображение");
  return data.signedUrl;
};

export const resolvePhotos = async (photos: WorkPhoto[]): Promise<WorkPhoto[]> => {
  const out = await Promise.all(
    photos.map(async (p) => ({ ...p, url: await resolvePhotoUrl(p.url) }))
  );
  return out;
};

const SPLIT_POST_WINDOW_MS = 2_500;

const normalizedTitle = (title: string) => title.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");

const sourceTime = (work: WorkWithPhotos): number | null => {
  if (!work.source_date) return null;
  const value = Date.parse(work.source_date);
  return Number.isFinite(value) ? value : null;
};

// These imported rows contain galleries for other makes/models than their
// captions, descriptions and prices. Keep them available in the admin area,
// but do not publish internally contradictory cards until source data is fixed.
const PUBLIC_CATALOG_EXCLUSIONS = new Set([
  "b2335ab5-a471-4c20-bfca-95e39b4d2aa1",
  "8c984f57-2f01-49b3-b04a-60c64b0a7526",
  "aaed8932-6838-4d12-bc36-6f1fda80fd43",
  "89128f35-813e-4806-b9f7-144441587ecf",
  "f76a1e70-367e-469e-b5af-ee61d14ed9b0",
  "1aec1e54-794b-4f4b-ad56-23290c2469e0",
  "7f54b146-a271-48d2-b9c7-384a816369fc",
  "493c964b-f958-428d-a8f0-8d2d59043673",
  "8353ed47-6488-4c1b-9f06-74b1c99865df",
]);

const DETAILS_MARKER =
  /(комплектац(?:ия|ии)|дата выпуска|модельный год|производство|год выпуска|пробег|двигатель|мотор|объ[её]м|привод|трансмиссия)\s*:/i;

const trimDecorations = (value: string) =>
  value
    .replace(/^[^\p{L}\p{N}]+/gu, "")
    .replace(/[^\p{L}\p{N})]+$/gu, "")
    .trim()
    .replace(/\s+/g, " ");

const titleFromDescription = (description: string | null): string | null => {
  if (!description) return null;

  // A delivery post phrases the model inside the first sentence rather than
  // at its beginning (for example, "автомобиля - Toyota Vios.").
  const deliveredModel = description.match(/автомобиля\s*-\s*([^.]+)\./i)?.[1];
  if (deliveredModel) return trimDecorations(deliveredModel);

  const markerIndex = description.search(DETAILS_MARKER);
  const prefix = markerIndex === -1 ? description : description.slice(0, markerIndex);
  const title = trimDecorations(prefix);
  return title.length >= 4 && title.length <= 120 ? title : null;
};

export const getPublicWorkTitle = (work: WorkWithPhotos): string => {
  const title = work.title.trim();
  const looksBroken =
    title.length < 10 ||
    /^авто под заказ$/i.test(title) ||
    DETAILS_MARKER.test(title);

  return looksBroken ? titleFromDescription(work.description) ?? title : title;
};

/**
 * Some source posts arrive as two adjacent work rows: one row contains a few
 * detail shots and the next contains the main exterior gallery. Keep genuinely
 * separate publications, but coalesce rows with the same title/price that were
 * created within a couple of seconds of each other.
 */
export const mergeSplitWorks = (works: WorkWithPhotos[]): WorkWithPhotos[] => {
  const merged: WorkWithPhotos[] = [];

  for (const work of works) {
    const time = sourceTime(work);
    const index = merged.findIndex((candidate) => {
      const candidateTime = sourceTime(candidate);
      return (
        time !== null &&
        candidateTime !== null &&
        Math.abs(time - candidateTime) <= SPLIT_POST_WINDOW_MS &&
        normalizedTitle(candidate.title) === normalizedTitle(work.title) &&
        candidate.price === work.price
      );
    });

    if (index === -1) {
      merged.push({ ...work, photos: [...work.photos] });
      continue;
    }

    const existing = merged[index];
    const primary = work.photos.length > existing.photos.length ? work : existing;
    const secondary = primary === work ? existing : work;
    const seen = new Set<string>();
    const photos = [...primary.photos, ...secondary.photos]
      .filter((photo) => {
        const key = photo.id || photo.url;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((photo, photoIndex) => ({
        ...photo,
        work_id: primary.id,
        is_cover: photoIndex === 0,
        sort_order: photoIndex,
      }));

    const existingTime = sourceTime(existing) ?? 0;
    const workTime = sourceTime(work) ?? 0;
    merged[index] = {
      ...primary,
      sort_order: Math.max(existing.sort_order, work.sort_order),
      source_date: existingTime >= workTime ? existing.source_date : work.source_date,
      photos,
    };
  }

  return merged;
};

export const preparePublishedWorks = (works: WorkWithPhotos[]): WorkWithPhotos[] =>
  mergeSplitWorks(
    works
      .filter((work) => !PUBLIC_CATALOG_EXCLUSIONS.has(work.id))
      .map((work) => ({ ...work, title: getPublicWorkTitle(work), photos: [...work.photos] })),
  );

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

  const mergedList = preparePublishedWorks(list);

  // Resolve bucket keys to signed urls in parallel
  await Promise.all(
    mergedList.map(async (w) => {
      w.photos = await resolvePhotos(w.photos);
    })
  );

  return mergedList;
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

