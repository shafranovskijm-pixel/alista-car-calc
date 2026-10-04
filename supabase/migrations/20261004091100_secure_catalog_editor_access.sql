-- New auth users get a profile only. Roles must be assigned explicitly by an
-- administrator through the team invitation/role-management flow.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  RETURN NEW;
END;
$$;

-- The catalogue editor can manage only cars and their photos. Public read
-- policies for non-draft cars remain unchanged.
DROP POLICY IF EXISTS "Staff manage cars" ON public.cars;
CREATE POLICY "Staff manage cars" ON public.cars
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'catalog_editor')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'catalog_editor')
  );

DROP POLICY IF EXISTS "Staff manage car photos" ON public.car_photos;
CREATE POLICY "Staff manage car photos" ON public.car_photos
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'catalog_editor')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'catalog_editor')
  );

DROP POLICY IF EXISTS "Staff manage car photos storage" ON storage.objects;
DROP POLICY IF EXISTS "Staff read all car photos" ON storage.objects;
CREATE POLICY "Staff manage car photos storage" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'cars'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'catalog_editor')
    )
  )
  WITH CHECK (
    bucket_id = 'cars'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'catalog_editor')
    )
  );

-- A few legacy policies treated every authenticated account as CRM staff.
-- Tighten them so a catalogue-only account cannot read or mutate CRM data by
-- calling Supabase directly.
DROP POLICY IF EXISTS "Authenticated staff can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated staff can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated staff can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated staff can delete tasks" ON public.tasks;

CREATE POLICY "Staff can view tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Staff can create tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Staff can update tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Staff can delete tasks" ON public.tasks
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Authenticated read message templates" ON public.message_templates;
CREATE POLICY "Staff read message templates" ON public.message_templates
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Authenticated read email settings" ON public.email_settings;
CREATE POLICY "Staff read email settings" ON public.email_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Authenticated read email log" ON public.email_log;
CREATE POLICY "Staff read email log" ON public.email_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Preserve owner-scoped CRM actions for managers, but do not let a former
-- manager retain them after being changed to catalogue_editor.
DROP POLICY IF EXISTS "Admins delete documents" ON public.documents;
CREATE POLICY "Staff delete own documents" ON public.documents
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'manager') AND uploaded_by = auth.uid())
  );

DROP POLICY IF EXISTS "Author or admin update activities" ON public.lead_activities;
CREATE POLICY "Author or admin update activities" ON public.lead_activities
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'manager') AND created_by = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'manager') AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Author or admin delete activities" ON public.lead_activities;
CREATE POLICY "Author or admin delete activities" ON public.lead_activities
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'manager') AND created_by = auth.uid())
  );
