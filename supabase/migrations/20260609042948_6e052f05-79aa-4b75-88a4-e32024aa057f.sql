GRANT SELECT ON public.works TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.works TO authenticated;
GRANT ALL ON public.works TO service_role;

GRANT SELECT ON public.work_photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.work_photos TO authenticated;
GRANT ALL ON public.work_photos TO service_role;