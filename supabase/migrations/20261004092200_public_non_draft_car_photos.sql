-- Keep the bucket private while allowing signed URLs for photos that are both
-- referenced by the catalogue and attached to a currently visible car.
DROP POLICY IF EXISTS "Anon read car photos for public catalog" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read car photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read non-draft car photos" ON storage.objects;

CREATE INDEX IF NOT EXISTS car_photos_url_idx ON public.car_photos (url);

CREATE POLICY "Public read non-draft car photos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'cars'
  AND EXISTS (
    SELECT 1
    FROM public.car_photos AS photo
    JOIN public.cars AS car ON car.id = photo.car_id
    WHERE photo.url = storage.objects.name
      AND car.status <> 'draft'
  )
);
