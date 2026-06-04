
-- Тип документа
CREATE TYPE public.document_kind AS ENUM ('contract','invoice','passport','title','dkp','act','other');

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.document_kind NOT NULL DEFAULT 'other',
  title text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX documents_deal_idx ON public.documents(deal_id);
CREATE INDEX documents_client_idx ON public.documents(client_id);
CREATE INDEX documents_created_idx ON public.documents(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view documents" ON public.documents
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "Staff insert documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "Staff update documents" ON public.documents
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "Admins delete documents" ON public.documents
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR uploaded_by = auth.uid());

CREATE TRIGGER documents_set_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Шаблоны документов
CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind public.document_kind NOT NULL DEFAULT 'other',
  body text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_templates TO authenticated;
GRANT ALL ON public.document_templates TO service_role;

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view templates" ON public.document_templates
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "Admins manage templates" ON public.document_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER document_templates_set_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS на storage.objects для бакета "documents" (приватный)
CREATE POLICY "Staff read documents bucket"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  );

CREATE POLICY "Staff upload to documents bucket"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  );

CREATE POLICY "Staff update documents bucket"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  );

CREATE POLICY "Staff delete documents bucket"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  );
