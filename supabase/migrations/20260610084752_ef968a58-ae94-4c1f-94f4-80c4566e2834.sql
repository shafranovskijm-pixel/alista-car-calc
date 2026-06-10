DROP POLICY IF EXISTS "Admins manage cars" ON public.cars;
DROP POLICY IF EXISTS "Admins manage car photos" ON public.car_photos;

CREATE POLICY "Staff manage cars" ON public.cars
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff manage car photos" ON public.car_photos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Admins manage car photos storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins read all car photos" ON storage.objects;

CREATE POLICY "Staff manage car photos storage" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'cars' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')))
  WITH CHECK (bucket_id = 'cars' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')));

CREATE POLICY "Staff read all car photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cars' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')));