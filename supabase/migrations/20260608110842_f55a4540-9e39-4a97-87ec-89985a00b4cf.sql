DROP POLICY IF EXISTS "Public can view published product files" ON storage.objects;
CREATE POLICY "Public can view published product files"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'products'
  AND EXISTS (
    SELECT 1
    FROM public.product_photos pp
    JOIN public.products p ON p.id = pp.product_id
    WHERE pp.storage_path = storage.objects.name
      AND (p.status = 'published' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  )
);

DROP POLICY IF EXISTS "Staff can upload product files" ON storage.objects;
CREATE POLICY "Staff can upload product files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
);

DROP POLICY IF EXISTS "Staff can update product files" ON storage.objects;
CREATE POLICY "Staff can update product files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
)
WITH CHECK (
  bucket_id = 'products'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
);

DROP POLICY IF EXISTS "Staff can delete product files" ON storage.objects;
CREATE POLICY "Staff can delete product files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
);