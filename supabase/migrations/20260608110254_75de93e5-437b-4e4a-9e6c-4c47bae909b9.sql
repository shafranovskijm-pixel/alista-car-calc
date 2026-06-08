
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'in_transit';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'delivered';

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS messenger text,
  ADD COLUMN IF NOT EXISTS object_interest text,
  ADD COLUMN IF NOT EXISTS gclid text,
  ADD COLUMN IF NOT EXISTS yclid text,
  ADD COLUMN IF NOT EXISTS calc_snapshot jsonb;
