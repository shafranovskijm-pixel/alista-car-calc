ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS kpp text,
  ADD COLUMN IF NOT EXISTS ogrn text,
  ADD COLUMN IF NOT EXISTS director_name text,
  ADD COLUMN IF NOT EXISTS director_position text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS passport_issued_by text,
  ADD COLUMN IF NOT EXISTS passport_issued_date date;