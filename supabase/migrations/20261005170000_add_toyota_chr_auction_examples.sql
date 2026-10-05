-- Five Toyota C-HR auction examples supplied by the client on 2026-10-05.
-- The RUB prices already include the requested +50,000 RUB adjustment.
-- Stable IDs make an exact rerun safe. A matching slug owned by any other row
-- aborts explicitly so this content migration can never overwrite a hidden
-- draft or an editor-created card.
DO $$
DECLARE
  conflicting_slug text;
BEGIN
  SELECT car.slug
  INTO conflicting_slug
  FROM public.cars AS car
  JOIN (
    VALUES
      ('6acd887d-255c-4d53-ac11-c246ab895ffb'::uuid, 'toyota-c-hr-st-led-package-4wd-2019-1616000-jpy'),
      ('b15a9a05-5232-4838-9bd9-fb00d0ce2281'::uuid, 'toyota-c-hr-g-t-4wd-2019-1883000-jpy'),
      ('82aa7891-7907-4bd8-b368-09c02915d236'::uuid, 'toyota-c-hr-g-t-2020-1945000-jpy'),
      ('c8e3cf45-e83c-4880-9db8-6578ed451c22'::uuid, 'toyota-c-hr-s-t-4wd-2021-1649000-jpy'),
      ('75aa51b2-b210-4655-ab03-4ccd3b149a88'::uuid, 'toyota-c-hr-s-t-led-package-2019-1706000-jpy')
  ) AS expected(id, slug) ON expected.slug = car.slug
  WHERE car.id <> expected.id
  LIMIT 1;

  IF conflicting_slug IS NOT NULL THEN
    RAISE EXCEPTION 'Refusing to overwrite an existing car with slug %', conflicting_slug
      USING ERRCODE = '23505';
  END IF;
END;
$$;

WITH catalogue_rows (
  id,
  slug,
  title,
  brand,
  model,
  year,
  engine_volume,
  transmission,
  mileage_km,
  price,
  currency,
  country,
  status,
  description,
  auction_sheet_url,
  sort_order
) AS (
  VALUES
    (
      '6acd887d-255c-4d53-ac11-c246ab895ffb'::uuid,
      'toyota-c-hr-st-led-package-4wd-2019-1616000-jpy',
      'Toyota C-HR S-T LED Package 4WD',
      'Toyota',
      'C-HR S-T LED Package 4WD',
      2019,
      1.2,
      NULL::public.car_transmission,
      98000,
      1450000,
      'RUB',
      'japan'::public.car_country,
      'sold'::public.car_status,
      'Продан 17 сентября 2026 года на аукционе TAA Kantou, лот 20184, за 1 616 000 йен. Стоимость под ключ — 1 450 000 рублей. По предоставленной информации — предмаксимальная комплектация и полный привод. Кузов NGX50, оценка 4, цвет Pearl two-tone, коробка FAT по аукционной карточке.',
      '/catalog/toyota-c-hr/toyota-c-hr-st-led-4wd-2019-1616000jpy.jpeg',
      105
    ),
    (
      'b15a9a05-5232-4838-9bd9-fb00d0ce2281'::uuid,
      'toyota-c-hr-g-t-4wd-2019-1883000-jpy',
      'Toyota C-HR G-T 4WD',
      'Toyota',
      'C-HR G-T 4WD',
      2019,
      1.2,
      NULL::public.car_transmission,
      42000,
      1600000,
      'RUB',
      'japan'::public.car_country,
      'sold'::public.car_status,
      'Продан 5 сентября 2026 года на аукционе TAA Yokohama, лот 52032, за 1 883 000 йен. Стоимость под ключ — 1 600 000 рублей. По предоставленной информации — максимальная комплектация и полный привод. Кузов NGX50, оценка 4, цвет Pearl, коробка FAT по аукционной карточке.',
      '/catalog/toyota-c-hr/toyota-c-hr-gt-4wd-2019-1883000jpy.jpeg',
      104
    ),
    (
      '82aa7891-7907-4bd8-b368-09c02915d236'::uuid,
      'toyota-c-hr-g-t-2020-1945000-jpy',
      'Toyota C-HR G-T',
      'Toyota',
      'C-HR G-T',
      2020,
      1.2,
      NULL::public.car_transmission,
      79000,
      1634000,
      'RUB',
      'japan'::public.car_country,
      'sold'::public.car_status,
      'Продан 8 сентября 2026 года на аукционе TAA Hiroshima, лот 2146, за 1 945 000 йен. Стоимость под ключ — 1 634 000 рублей. По предоставленной информации — максимальная комплектация. Кузов NGX10, оценка 4, цвет Pearl, коробка FAT по аукционной карточке; привод в исходных данных не указан.',
      '/catalog/toyota-c-hr/toyota-c-hr-gt-2020-1945000jpy.jpeg',
      103
    ),
    (
      'c8e3cf45-e83c-4880-9db8-6578ed451c22'::uuid,
      'toyota-c-hr-s-t-4wd-2021-1649000-jpy',
      'Toyota C-HR S-T 4WD',
      'Toyota',
      'C-HR S-T 4WD',
      2021,
      1.2,
      NULL::public.car_transmission,
      67000,
      1468000,
      'RUB',
      'japan'::public.car_country,
      'sold'::public.car_status,
      'Продан 15 сентября 2026 года на аукционе TAA Hiroshima, лот 2033, за 1 649 000 йен. Стоимость под ключ — 1 468 000 рублей. По предоставленной информации — базовая комплектация и полный привод. Кузов NGX50, оценка 4, цвет Pearl, коробка FAT по аукционной карточке.',
      '/catalog/toyota-c-hr/toyota-c-hr-st-4wd-2021-1649000jpy.jpeg',
      102
    ),
    (
      '75aa51b2-b210-4655-ab03-4ccd3b149a88'::uuid,
      'toyota-c-hr-s-t-led-package-2019-1706000-jpy',
      'Toyota C-HR S-T LED Package',
      'Toyota',
      'C-HR S-T LED Package',
      2019,
      1.2,
      NULL::public.car_transmission,
      80000,
      1500000,
      'RUB',
      'japan'::public.car_country,
      'sold'::public.car_status,
      'Продан 15 сентября 2026 года на аукционе CAA Tokyo, лот 30280, за 1 706 000 йен. Стоимость под ключ — 1 500 000 рублей. В предоставленной информации вариант назван базовой комплектацией; в аукционной карточке указано S-T LED Package. Кузов NGX10, оценка 4,5, цвет Pearl, коробка FAT по аукционной карточке; привод в исходных данных не указан.',
      '/catalog/toyota-c-hr/toyota-c-hr-st-led-2019-1706000jpy.jpeg',
      101
    )
)
INSERT INTO public.cars (
  id,
  slug,
  title,
  brand,
  model,
  year,
  engine_volume,
  transmission,
  mileage_km,
  price,
  currency,
  country,
  status,
  description,
  auction_sheet_url,
  sort_order
)
SELECT * FROM catalogue_rows
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  brand = EXCLUDED.brand,
  model = EXCLUDED.model,
  year = EXCLUDED.year,
  engine_volume = EXCLUDED.engine_volume,
  transmission = EXCLUDED.transmission,
  mileage_km = EXCLUDED.mileage_km,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  country = EXCLUDED.country,
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  auction_sheet_url = EXCLUDED.auction_sheet_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

WITH photo_rows (car_id, url) AS (
  VALUES
    ('6acd887d-255c-4d53-ac11-c246ab895ffb'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-st-led-4wd-2019-1616000jpy.jpeg'),
    ('b15a9a05-5232-4838-9bd9-fb00d0ce2281'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-gt-4wd-2019-1883000jpy.jpeg'),
    ('82aa7891-7907-4bd8-b368-09c02915d236'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-gt-2020-1945000jpy.jpeg'),
    ('c8e3cf45-e83c-4880-9db8-6578ed451c22'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-st-4wd-2021-1649000jpy.jpeg'),
    ('75aa51b2-b210-4655-ab03-4ccd3b149a88'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-st-led-2019-1706000jpy.jpeg')
)
UPDATE public.car_photos AS photo
SET is_cover = false
FROM photo_rows AS wanted
WHERE photo.car_id = wanted.car_id
  AND photo.url <> wanted.url;

WITH photo_rows (car_id, url) AS (
  VALUES
    ('6acd887d-255c-4d53-ac11-c246ab895ffb'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-st-led-4wd-2019-1616000jpy.jpeg'),
    ('b15a9a05-5232-4838-9bd9-fb00d0ce2281'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-gt-4wd-2019-1883000jpy.jpeg'),
    ('82aa7891-7907-4bd8-b368-09c02915d236'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-gt-2020-1945000jpy.jpeg'),
    ('c8e3cf45-e83c-4880-9db8-6578ed451c22'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-st-4wd-2021-1649000jpy.jpeg'),
    ('75aa51b2-b210-4655-ab03-4ccd3b149a88'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-st-led-2019-1706000jpy.jpeg')
)
UPDATE public.car_photos AS photo
SET sort_order = 0,
    is_cover = true
FROM photo_rows AS wanted
WHERE photo.car_id = wanted.car_id
  AND photo.url = wanted.url;

WITH photo_rows (car_id, url) AS (
  VALUES
    ('6acd887d-255c-4d53-ac11-c246ab895ffb'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-st-led-4wd-2019-1616000jpy.jpeg'),
    ('b15a9a05-5232-4838-9bd9-fb00d0ce2281'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-gt-4wd-2019-1883000jpy.jpeg'),
    ('82aa7891-7907-4bd8-b368-09c02915d236'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-gt-2020-1945000jpy.jpeg'),
    ('c8e3cf45-e83c-4880-9db8-6578ed451c22'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-st-4wd-2021-1649000jpy.jpeg'),
    ('75aa51b2-b210-4655-ab03-4ccd3b149a88'::uuid, '/catalog/toyota-c-hr/toyota-c-hr-st-led-2019-1706000jpy.jpeg')
)
INSERT INTO public.car_photos (car_id, url, sort_order, is_cover)
SELECT wanted.car_id, wanted.url, 0, true
FROM photo_rows AS wanted
WHERE NOT EXISTS (
  SELECT 1
  FROM public.car_photos AS existing
  WHERE existing.car_id = wanted.car_id
    AND existing.url = wanted.url
);
