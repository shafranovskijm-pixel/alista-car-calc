
CREATE TABLE public.email_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  notify_emails TEXT[] NOT NULL DEFAULT ARRAY['info@alistaru.ru']::text[],
  from_name TEXT NOT NULL DEFAULT 'Alista',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT email_settings_singleton CHECK (id = true)
);

GRANT SELECT, INSERT, UPDATE ON public.email_settings TO authenticated;
GRANT ALL ON public.email_settings TO service_role;

ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read email settings" ON public.email_settings
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage email settings" ON public.email_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_email_settings_updated_at
BEFORE UPDATE ON public.email_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.email_settings (id) VALUES (true) ON CONFLICT DO NOTHING;


CREATE TABLE public.email_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  kind TEXT NOT NULL DEFAULT 'other',
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX email_log_created_at_idx ON public.email_log (created_at DESC);
CREATE INDEX email_log_status_idx ON public.email_log (status);

GRANT SELECT ON public.email_log TO authenticated;
GRANT ALL ON public.email_log TO service_role;

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read email log" ON public.email_log
FOR SELECT TO authenticated USING (true);
