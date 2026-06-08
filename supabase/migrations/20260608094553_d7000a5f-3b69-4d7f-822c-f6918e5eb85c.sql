
-- Allow anonymous public website visitors to submit leads
GRANT INSERT ON public.leads TO anon;

CREATE POLICY "Anyone can submit a lead from website"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND assigned_to IS NULL
  AND char_length(full_name) BETWEEN 2 AND 100
  AND char_length(phone) BETWEEN 5 AND 30
);
