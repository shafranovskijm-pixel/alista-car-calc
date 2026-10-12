-- Curated YouTube reviews, managed independently of car cards.
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

-- Use the same existing predicates as catalogue management, without widening
-- access to deals, clients or any other CRM tables.
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

-- These three Shorts were verified on the public @AlistaAvto channel.
-- Stable IDs and DO NOTHING avoid duplicates, overwrites and re-publishing
-- records a client has intentionally hidden. No advertised prices are copied.
INSERT INTO public.site_videos (id, title, video_url, sort_order, is_published)
VALUES
  ('c4c0a1ea-6402-444c-9619-d19b06a1b1e1', 'Toyota BZ3X — обзор автомобиля', 'https://www.youtube.com/watch?v=Fc-XxnLPPTQ', 10, true),
  ('c4c0a1ea-6402-444c-9619-d19b06a1b1e2', 'Hyundai Kona — обзор автомобиля', 'https://www.youtube.com/watch?v=VZqSnqRDcsg', 20, true),
  ('c4c0a1ea-6402-444c-9619-d19b06a1b1e3', 'Toyota Corolla — привоз во Владивосток', 'https://www.youtube.com/watch?v=f5N6IGsVeHc', 30, true)
ON CONFLICT DO NOTHING;
