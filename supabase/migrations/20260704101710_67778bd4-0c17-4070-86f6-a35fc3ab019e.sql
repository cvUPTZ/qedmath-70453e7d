
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Application status
CREATE TYPE public.application_status AS ENUM ('new','reviewing','interview','trial','accepted','rejected');

-- Applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stage 1
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  workplace TEXT NOT NULL,
  institution_type TEXT NOT NULL, -- public|private|freelance
  years_experience INT NOT NULL,
  levels_taught TEXT[] NOT NULL,
  -- Stage 2
  subjects TEXT NOT NULL,
  designed_official_exams TEXT,
  contributed_curricula TEXT,
  trained_teachers TEXT,
  research_work TEXT,
  -- Stage 3 (5 open answers)
  pedagogy_answers JSONB NOT NULL,
  -- Stage 4 (case study)
  case_study JSONB NOT NULL,
  -- Stage 5 (vision, 4 answers)
  vision_answers JSONB NOT NULL,
  -- Stage 6 (collaboration)
  weekly_hours INT NOT NULL,
  contribution_types TEXT[] NOT NULL,
  -- Stage 7 (practical test)
  practical_test JSONB NOT NULL,
  -- Files
  cv_path TEXT,
  work_certificate_path TEXT,
  extra_files JSONB,
  -- Admin fields
  status public.application_status NOT NULL DEFAULT 'new',
  ai_score INT,
  ai_breakdown JSONB,
  ai_evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_email CHECK (char_length(email) <= 320),
  CONSTRAINT chk_name CHECK (char_length(full_name) BETWEEN 2 AND 200)
);
GRANT INSERT ON public.applications TO anon, authenticated;
GRANT SELECT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can submit" ON public.applications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admins read all" ON public.applications FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update" ON public.applications FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Notes
CREATE TABLE public.application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.application_notes TO authenticated;
GRANT ALL ON public.application_notes TO service_role;
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage notes" ON public.application_notes FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_id = auth.uid());

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_created ON public.applications(created_at DESC);
