-- Adds what was missing from the 17-stage diagnostic pipeline:
--   * question_stats (stage 16: item analysis incl. discrimination index)
--   * review_type on question_reviews, to distinguish stage 9 (gold review)
--     from stage 12 (expert sample review of AI-generated items)

-- 9b. question_stats
CREATE TABLE IF NOT EXISTS public.question_stats (
  question_id uuid PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  n_answers int NOT NULL DEFAULT 0,
  p_value numeric,
  discrimination numeric,
  top_group_n int NOT NULL DEFAULT 0,
  bottom_group_n int NOT NULL DEFAULT 0,
  computed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_stats TO authenticated;
GRANT ALL ON public.question_stats TO service_role;
ALTER TABLE public.question_stats ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "admins manage question_stats" ON public.question_stats FOR ALL TO authenticated
    USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- review_type distinguishes stage 9 review/approval of gold questions
-- from stage 12 expert sampling review of AI-generated ones.
ALTER TABLE public.question_reviews
  ADD COLUMN IF NOT EXISTS review_type text NOT NULL DEFAULT 'gold_review';
-- allowed values enforced at app layer: 'gold_review' | 'expert_sample'

-- track whether a question has been pulled into an expert-sample batch,
-- so sampling doesn't repeatedly re-pick the same items (stage 12/13).
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS sampled_for_expert_review boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_session_answers_question ON public.session_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_session_answers_session ON public.session_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_status_kind ON public.questions(status, kind);
