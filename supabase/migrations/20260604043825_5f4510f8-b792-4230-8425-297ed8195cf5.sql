
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  actor uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_table_idx ON public.audit_log(table_name);
CREATE INDEX audit_log_created_idx ON public.audit_log(created_at DESC);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view audit" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "Staff write audit" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_summary text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
  ELSE
    v_action := 'update';
  END IF;

  IF TG_TABLE_NAME = 'leads' THEN
    v_summary := COALESCE(NEW.full_name, '') || ' · ' || COALESCE(NEW.status::text, '');
  ELSIF TG_TABLE_NAME = 'deals' THEN
    v_summary := COALESCE(NEW.title, '') || ' · ' || COALESCE(NEW.stage::text, '');
  ELSIF TG_TABLE_NAME = 'clients' THEN
    v_summary := COALESCE(NEW.full_name, '');
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, actor, summary)
  VALUES (TG_TABLE_NAME, NEW.id, v_action, auth.uid(), v_summary);

  RETURN NEW;
END;
$$;

CREATE TRIGGER leads_audit
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER deals_audit
  AFTER INSERT OR UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER clients_audit
  AFTER INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
