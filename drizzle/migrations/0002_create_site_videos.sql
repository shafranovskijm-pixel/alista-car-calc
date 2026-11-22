CREATE TABLE IF NOT EXISTS public.site_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
  video_url text NOT NULL UNIQUE CHECK (video_url ~ '^https://www[.]youtube[.]com/watch[?]v=[A-Za-z0-9_-]{11}$'),
  sort_order integer NOT NULL DEFAULT 10 CHECK (sort_order BETWEEN 0 AND 9999),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_videos_public_order_idx
  ON public.site_videos (sort_order, created_at DESC) WHERE is_published;

ALTER TABLE public.site_videos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.site_videos FROM anon, authenticated;
GRANT SELECT ON public.site_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_videos TO authenticated;
GRANT ALL ON public.site_videos TO service_role;

DROP POLICY IF EXISTS "Public read published site videos" ON public.site_videos;
CREATE POLICY "Public read published site videos" ON public.site_videos
  FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "Catalog staff manage site videos" ON public.site_videos;
CREATE POLICY "Catalog staff manage site videos" ON public.site_videos
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'catalog_editor')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'catalog_editor')
  );

DROP TRIGGER IF EXISTS site_videos_updated_at ON public.site_videos;
CREATE TRIGGER site_videos_updated_at BEFORE UPDATE ON public.site_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();