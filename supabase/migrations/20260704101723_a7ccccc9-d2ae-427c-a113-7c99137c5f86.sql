
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;

DROP POLICY "anyone can submit" ON public.applications;
CREATE POLICY "anyone can submit" ON public.applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 200
    AND char_length(email) BETWEEN 5 AND 320
    AND char_length(phone) BETWEEN 6 AND 40
    AND years_experience BETWEEN 0 AND 80
    AND weekly_hours BETWEEN 0 AND 168
  );
