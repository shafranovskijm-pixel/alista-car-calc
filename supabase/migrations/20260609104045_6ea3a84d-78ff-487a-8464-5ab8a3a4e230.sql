
DROP POLICY IF EXISTS "Authenticated staff can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated staff can delete tasks" ON public.tasks;

CREATE POLICY "Authenticated staff can update tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated staff can delete tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
