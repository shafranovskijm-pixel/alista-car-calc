
-- Enum: countries
DO $$ BEGIN
  CREATE TYPE public.car_country AS ENUM ('japan','korea','china');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.car_status AS ENUM ('in_stock','in_transit','on_order','sold','draft');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.car_transmission AS ENUM ('at','mt','cvt','amt','dct','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.car_fuel AS ENUM ('petrol','diesel','hybrid','electric','gas');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Cars table
CREATE TABLE public.cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year int,
  engine_volume numeric(3,1),
  power_hp int,
  transmission public.car_transmission,
  fuel public.car_fuel,
  mileage_km int,
  price numeric(14,2),
  currency text NOT NULL DEFAULT 'RUB',
  country public.car_country NOT NULL,
  status public.car_status NOT NULL DEFAULT 'in_stock',
  description text,
  auction_sheet_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cars TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cars TO authenticated;
GRANT ALL ON public.cars TO service_role;

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view non-draft cars"
ON public.cars FOR SELECT
TO anon, authenticated
USING (status <> 'draft');

CREATE POLICY "Admins manage cars"
ON public.cars FOR ALL
TO authenticated
USING (has_role(auth.uid(),'admin'))
WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TRIGGER cars_updated_at
BEFORE UPDATE ON public.cars
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX cars_country_status_idx ON public.cars (country, status);
CREATE INDEX cars_brand_idx ON public.cars (brand);

-- Car photos
CREATE TABLE public.car_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_cover boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.car_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.car_photos TO authenticated;
GRANT ALL ON public.car_photos TO service_role;

ALTER TABLE public.car_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view photos of visible cars"
ON public.car_photos FOR SELECT
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.cars c WHERE c.id = car_id AND c.status <> 'draft'));

CREATE POLICY "Admins manage car photos"
ON public.car_photos FOR ALL
TO authenticated
USING (has_role(auth.uid(),'admin'))
WITH CHECK (has_role(auth.uid(),'admin'));

CREATE INDEX car_photos_car_idx ON public.car_photos (car_id, sort_order);
