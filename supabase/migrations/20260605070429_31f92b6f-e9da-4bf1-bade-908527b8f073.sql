
CREATE POLICY "Public can read works photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'works');

CREATE POLICY "Admins and managers can upload works photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'works'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Admins and managers can update works photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'works'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Admins and managers can delete works photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'works'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );
