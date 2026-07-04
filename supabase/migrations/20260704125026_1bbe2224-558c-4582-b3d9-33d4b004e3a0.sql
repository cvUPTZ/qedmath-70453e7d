DROP POLICY IF EXISTS "anyone can submit" ON public.applications;
CREATE POLICY "anyone can submit" ON public.applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);