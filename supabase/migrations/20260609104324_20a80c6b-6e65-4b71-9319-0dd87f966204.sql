
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON public.deals(assigned_to);
