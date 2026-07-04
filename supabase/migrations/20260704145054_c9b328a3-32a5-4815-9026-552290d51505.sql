
-- 1. applications INSERT: replace WITH CHECK(true) with real validation
DROP POLICY IF EXISTS "anyone can submit" ON public.applications;
CREATE POLICY "anyone can submit" ON public.applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(full_name)) BETWEEN 2 AND 200
    AND length(trim(email)) BETWEEN 3 AND 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(trim(phone)) BETWEEN 6 AND 40
    AND length(trim(wilaya)) BETWEEN 2 AND 80
    AND years_experience BETWEEN 0 AND 80
    AND (cv_path IS NULL OR cv_path = '')
    AND (work_certificate_path IS NULL OR work_certificate_path = '')
    AND (extra_files IS NULL OR extra_files = '[]'::jsonb)
  );

-- 2. cat_sessions: remove permissive anon update; restrict create with basic validation
DROP POLICY IF EXISTS "anyone can update own active session" ON public.cat_sessions;
DROP POLICY IF EXISTS "anyone can create session" ON public.cat_sessions;
CREATE POLICY "anyone can create session" ON public.cat_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(candidate_name)) BETWEEN 2 AND 200
    AND length(trim(candidate_email)) BETWEEN 3 AND 320
    AND candidate_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND status = 'active'
  );
-- Updates only via service_role (server functions); admins can update via existing admin policy if any (none exists; add one)
CREATE POLICY "admins update sessions" ON public.cat_sessions
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Storage: applications bucket - remove anon upload, restrict all ops to admins
DROP POLICY IF EXISTS "anyone upload applications" ON storage.objects;
CREATE POLICY "admins upload applications" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'applications' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins update applications" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'applications' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'applications' AND has_role(auth.uid(), 'admin'::app_role));

-- 4. Lock down SECURITY DEFINER functions from public/anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_admin_to_owner() FROM PUBLIC, anon, authenticated;
