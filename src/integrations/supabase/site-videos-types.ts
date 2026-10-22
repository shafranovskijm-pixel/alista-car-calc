// Hand-declared schema for public.site_videos (migration 20261012103000).
// Kept outside the auto-generated types.ts, which is regenerated from the live
// database and drops this table while that migration is not applied there.
import type { SupabaseClient } from "@supabase/supabase-js";

export type SiteVideoRow = {
  id: string;
  title: string;
  video_url: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type SiteVideosDatabase = {
  public: {
    Tables: {
      site_videos: {
        Row: SiteVideoRow;
        Insert: Partial<Pick<SiteVideoRow, "id" | "sort_order" | "is_published" | "created_at" | "updated_at">> & Pick<SiteVideoRow, "title" | "video_url">;
        Update: Partial<SiteVideoRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export const asSiteVideosClient = (client: unknown) => client as SupabaseClient<SiteVideosDatabase>;
