
-- Клиенты
CREATE TYPE public.client_type AS ENUM ('individual','company');

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  email text,
  client_type public.client_type NOT NULL DEFAULT 'individual',
  company_name text,
  inn text,
  passport text,
  address text,
  source text,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX clients_name_idx ON public.clients(full_name);
CREATE INDEX clients_phone_idx ON public.clients(phone);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all clients" ON public.clients
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Staff view clients" ON public.clients
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Staff insert clients" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Staff update clients" ON public.clients
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER clients_set_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Сделки
CREATE TYPE public.deal_type AS ENUM ('import_car','import_special','customs_only','other');
CREATE TYPE public.deal_stage AS ENUM ('new','qualification','calculation','payment','delivery','customs','completed','cancelled');

CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  deal_type public.deal_type NOT NULL DEFAULT 'import_car',
  stage public.deal_stage NOT NULL DEFAULT 'new',
  budget numeric(14,2),
  margin numeric(14,2),
  currency text NOT NULL DEFAULT 'RUB',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX deals_stage_idx ON public.deals(stage);
CREATE INDEX deals_client_idx ON public.deals(client_id);
CREATE INDEX deals_assigned_idx ON public.deals(assigned_to);
CREATE INDEX deals_created_idx ON public.deals(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all deals" ON public.deals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Staff view deals" ON public.deals
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Staff insert deals" ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Staff update own or free deals" ON public.deals
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'manager') AND (assigned_to IS NULL OR assigned_to = auth.uid()))
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'manager') AND (assigned_to IS NULL OR assigned_to = auth.uid()))
  );

CREATE TRIGGER deals_set_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- История этапов сделки
CREATE TABLE public.deal_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  from_stage public.deal_stage,
  to_stage public.deal_stage NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX deal_stage_history_deal_idx ON public.deal_stage_history(deal_id);

GRANT SELECT, INSERT ON public.deal_stage_history TO authenticated;
GRANT ALL ON public.deal_stage_history TO service_role;

ALTER TABLE public.deal_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view deal stage history" ON public.deal_stage_history
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "Staff insert deal stage history" ON public.deal_stage_history
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE OR REPLACE FUNCTION public.log_deal_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.deal_stage_history (deal_id, from_stage, to_stage, changed_by)
    VALUES (NEW.id, NULL, NEW.stage, auth.uid());
  ELSIF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.deal_stage_history (deal_id, from_stage, to_stage, changed_by)
    VALUES (NEW.id, OLD.stage, NEW.stage, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER deals_log_stage_change
  AFTER INSERT OR UPDATE OF stage ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.log_deal_stage_change();
