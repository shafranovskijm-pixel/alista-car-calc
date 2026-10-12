import { supabase } from "@/integrations/supabase/proxy-client";
import type { Tables } from "@/integrations/supabase/types";
import { normalizeVideoUrl } from "@/lib/video";
import { SOCIAL_LINKS } from "@/lib/social-links";

export const ALISTA_YOUTUBE_CHANNEL_URL = SOCIAL_LINKS.youtube;
export const HOME_VIDEO_LIMIT = 3;
export type SiteVideo = Tables<"site_videos">;

export type SiteVideoForm = {
  title: string;
  video_url: string;
  sort_order: string;
  is_published: boolean;
};

export type SiteVideoValues = Pick<SiteVideo, "title" | "video_url" | "sort_order" | "is_published">;

export const validateSiteVideo = (form: SiteVideoForm): SiteVideoValues => {
  const title = form.title.trim();
  if (!title || title.length > 160) {
    throw new Error("Укажите название видео: от 1 до 160 символов.");
  }
  const video = normalizeVideoUrl(form.video_url);
  if (video?.provider !== "youtube") {
    throw new Error("Вставьте ссылку на отдельное видео или Shorts на YouTube, а не на канал.");
  }
  const sortOrder = Number(form.sort_order);
  if (!form.sort_order.trim() || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    throw new Error("Порядок показа должен быть целым числом от 0 до 9999.");
  }
  return { title, video_url: video.watchUrl, sort_order: sortOrder, is_published: form.is_published };
};

export const fetchPublishedSiteVideos = async (): Promise<SiteVideo[]> => {
  const { data, error } = await supabase
    .from("site_videos")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(HOME_VIDEO_LIMIT);
  if (error) throw error;
  return data ?? [];
};

export const fetchAllSiteVideos = async (): Promise<SiteVideo[]> => {
  const { data, error } = await supabase
    .from("site_videos")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const saveSiteVideo = async (form: SiteVideoForm, id?: string): Promise<void> => {
  const values = validateSiteVideo(form);
  // New forms remain local until this explicit save. A unique canonical video
  // URL also prevents accidentally adding the same Shorts twice.
  const query = id
    ? supabase.from("site_videos").update(values).eq("id", id)
    : supabase.from("site_videos").insert(values);
  const { data, error } = await query.select("id").single();
  if (error) {
    if (error.code === "23505") throw new Error("Это видео уже добавлено. Измените его существующую карточку.");
    throw error;
  }
  if (!data) throw new Error("Изменение не сохранено. Проверьте доступ к разделу видео.");
};
