
-- 1) CAT sessions
CREATE TABLE public.cat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_email text NOT NULL,
  candidate_name text NOT NULL,
  ability_by_dim jsonb NOT NULL DEFAULT '{"error_diagnosis":1,"question_design":1,"skill_network":1,"remedial_pathway":1,"data_reasoning":1}'::jsonb,
  scores_by_dim jsonb NOT NULL DEFAULT '{}'::jsonb,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  questions_asked integer NOT NULL DEFAULT 0,
  max_questions integer NOT NULL DEFAULT 15,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  final_score integer,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(candidate_email) BETWEEN 5 AND 320),
  CHECK (char_length(candidate_name) BETWEEN 2 AND 200)
);

GRANT SELECT, INSERT, UPDATE ON public.cat_sessions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.cat_sessions TO authenticated;
GRANT ALL ON public.cat_sessions TO service_role;

ALTER TABLE public.cat_sessions ENABLE ROW LEVEL SECURITY;

-- Public creation & continuation via server functions (which use service_role); still expose via RLS for anon in case of direct call
CREATE POLICY "anyone can create session" ON public.cat_sessions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anyone can update own active session" ON public.cat_sessions
  FOR UPDATE TO anon, authenticated USING (status = 'active') WITH CHECK (true);
CREATE POLICY "admins read all sessions" ON public.cat_sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER cat_sessions_updated_at BEFORE UPDATE ON public.cat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Applications: relax old NOT NULLs so CAT-only submissions work
ALTER TABLE public.applications
  ALTER COLUMN workplace DROP NOT NULL,
  ALTER COLUMN institution_type DROP NOT NULL,
  ALTER COLUMN levels_taught DROP NOT NULL,
  ALTER COLUMN subjects DROP NOT NULL,
  ALTER COLUMN pedagogy_answers DROP NOT NULL,
  ALTER COLUMN case_study DROP NOT NULL,
  ALTER COLUMN vision_answers DROP NOT NULL,
  ALTER COLUMN weekly_hours DROP NOT NULL,
  ALTER COLUMN contribution_types DROP NOT NULL,
  ALTER COLUMN practical_test DROP NOT NULL;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS cat_session_id uuid REFERENCES public.cat_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS applications_cat_session_id_idx ON public.applications(cat_session_id);
CREATE INDEX IF NOT EXISTS cat_sessions_email_idx ON public.cat_sessions(candidate_email);
