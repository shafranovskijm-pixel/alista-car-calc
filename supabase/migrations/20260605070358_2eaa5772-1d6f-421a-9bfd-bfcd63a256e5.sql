
-- works table
CREATE TABLE public.works (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  brand text,
  model text,
  year integer,
  price bigint,
  country text,
  description text,
  status text NOT NULL DEFAULT 'published',
  sort_order integer NOT NULL DEFAULT 0,
  source_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.works TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.works TO authenticated;
GRANT ALL ON public.works TO service_role;

ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published works"
  ON public.works FOR SELECT
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can insert works"
  ON public.works FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can update works"
  ON public.works FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can delete works"
  ON public.works FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER update_works_updated_at
  BEFORE UPDATE ON public.works
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_works_status_sort ON public.works(status, sort_order DESC, source_date DESC);
CREATE INDEX idx_works_country ON public.works(country);

-- work_photos table
CREATE TABLE public.work_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id uuid NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_cover boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.work_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_photos TO authenticated;
GRANT ALL ON public.work_photos TO service_role;

ALTER TABLE public.work_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view photos of published works"
  ON public.work_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.works w
      WHERE w.id = work_photos.work_id
        AND (w.status = 'published' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
    )
  );

CREATE POLICY "Admins and managers can insert photos"
  ON public.work_photos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can update photos"
  ON public.work_photos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can delete photos"
  ON public.work_photos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE INDEX idx_work_photos_work ON public.work_photos(work_id, sort_order);
