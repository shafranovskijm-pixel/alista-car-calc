
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cars_deal_id ON public.cars(deal_id);
