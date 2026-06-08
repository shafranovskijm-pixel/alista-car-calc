
CREATE POLICY "Admins manage car photos storage"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'cars' AND has_role(auth.uid(),'admin'))
WITH CHECK (bucket_id = 'cars' AND has_role(auth.uid(),'admin'));

CREATE POLICY "Authenticated read car photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'cars');
