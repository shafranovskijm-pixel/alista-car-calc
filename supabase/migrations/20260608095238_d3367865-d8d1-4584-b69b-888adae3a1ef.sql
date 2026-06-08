
CREATE POLICY "Anon read car photos for public catalog"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'cars');
