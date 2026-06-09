
DO $$ BEGIN
  CREATE TYPE public.activity_type AS ENUM ('note','call','meeting','email','task');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  type public.activity_type NOT NULL DEFAULT 'note',
  title text,
  body text,
  due_at timestamptz,
  done_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_activities_lead_idx ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS lead_activities_deal_idx ON public.lead_activities(deal_id);
CREATE INDEX IF NOT EXISTS lead_activities_client_idx ON public.lead_activities(client_id);
CREATE INDEX IF NOT EXISTS lead_activities_due_idx ON public.lead_activities(due_at) WHERE done_at IS NULL;
CREATE INDEX IF NOT EXISTS lead_activities_created_idx ON public.lead_activities(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_activities TO authenticated;
GRANT ALL ON public.lead_activities TO service_role;

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read activities" ON public.lead_activities
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "Staff insert activities" ON public.lead_activities
  FOR INSERT TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
    AND (created_by IS NULL OR created_by = auth.uid())
  );

CREATE POLICY "Author or admin update activities" ON public.lead_activities
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR created_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'admin') OR created_by = auth.uid());

CREATE POLICY "Author or admin delete activities" ON public.lead_activities
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR created_by = auth.uid());

CREATE TRIGGER lead_activities_updated_at
  BEFORE UPDATE ON public.lead_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
