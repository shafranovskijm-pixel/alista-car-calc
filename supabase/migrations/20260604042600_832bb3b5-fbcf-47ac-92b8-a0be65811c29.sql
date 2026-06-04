
-- Enum статусов заявки
CREATE TYPE public.lead_status AS ENUM ('new','in_progress','callback','meeting','contract','won','lost');

-- Таблица заявок
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  page_url text,
  message text,
  status public.lead_status NOT NULL DEFAULT 'new',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX leads_status_idx ON public.leads(status);
CREATE INDEX leads_assigned_idx ON public.leads(assigned_to);
CREATE INDEX leads_created_idx ON public.leads(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Админ — всё. Менеджер — видит все, обновляет назначенные ему или свободные.
CREATE POLICY "Admins manage all leads" ON public.leads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Managers view leads" ON public.leads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Managers insert leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Managers update own or free leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'manager') AND (assigned_to IS NULL OR assigned_to = auth.uid()))
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'manager') AND (assigned_to IS NULL OR assigned_to = auth.uid()))
  );

-- updated_at триггер
CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- История статусов
CREATE TABLE public.lead_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_status public.lead_status,
  to_status public.lead_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lead_status_history_lead_idx ON public.lead_status_history(lead_id);

GRANT SELECT, INSERT ON public.lead_status_history TO authenticated;
GRANT ALL ON public.lead_status_history TO service_role;

ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view status history" ON public.lead_status_history
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "Staff insert status history" ON public.lead_status_history
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- Триггер: автоматически писать историю при смене статуса
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.lead_status_history (lead_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, auth.uid());
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.lead_status_history (lead_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER leads_log_status_change
  AFTER INSERT OR UPDATE OF status ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_status_change();
