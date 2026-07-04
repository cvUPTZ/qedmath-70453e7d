
CREATE POLICY "anyone upload applications" ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'applications');

CREATE POLICY "admins read applications" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'applications' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete applications" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'applications' AND public.has_role(auth.uid(), 'admin'));
