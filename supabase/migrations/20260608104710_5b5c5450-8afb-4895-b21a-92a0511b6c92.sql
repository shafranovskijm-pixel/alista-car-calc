-- 1) audit_log: remove client-side INSERT policy. SECURITY DEFINER triggers bypass RLS.
DROP POLICY IF EXISTS "Staff write audit" ON public.audit_log;

-- 2) Storage: replace permissive read policies on 'cars' bucket with draft-aware checks.
DROP POLICY IF EXISTS "Authenticated read car photos" ON storage.objects;
DROP POLICY IF EXISTS "Anon read car photos for public catalog" ON storage.objects;

CREATE POLICY "Public read non-draft car photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cars'
  AND EXISTS (
    SELECT 1 FROM public.cars c
    WHERE c.id::text = split_part(storage.objects.name, '/', 1)
      AND c.status <> 'draft'
  )
);

CREATE POLICY "Admins read all car photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cars' AND public.has_role(auth.uid(), 'admin'));

-- 3) Restrict EXECUTE on has_role to roles that actually need it for RLS.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;