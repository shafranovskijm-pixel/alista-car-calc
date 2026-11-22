// Explicit schema for public.site_videos (migration 20261012103000).
// Kept as a narrow client type so this section remains stable when the shared
// generated database types are refreshed independently of the frontend.
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
