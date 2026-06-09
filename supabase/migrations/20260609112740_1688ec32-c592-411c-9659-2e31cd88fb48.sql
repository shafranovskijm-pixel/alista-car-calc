
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS sale_price numeric,
  ADD COLUMN IF NOT EXISTS purchase_cost numeric,
  ADD COLUMN IF NOT EXISTS customs_cost numeric,
  ADD COLUMN IF NOT EXISTS logistics_cost numeric,
  ADD COLUMN IF NOT EXISTS other_cost numeric;
