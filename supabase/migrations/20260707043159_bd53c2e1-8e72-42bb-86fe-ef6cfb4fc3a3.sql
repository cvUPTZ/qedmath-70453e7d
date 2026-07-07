ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS sampled_for_expert_review boolean NOT NULL DEFAULT false;

ALTER TABLE public.question_reviews ADD COLUMN IF NOT EXISTS review_type text NOT NULL DEFAULT 'gold_review';

CREATE TABLE IF NOT EXISTS public.question_stats (
  question_id uuid PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  p_value numeric,
  discrimination numeric,
  sample_size integer NOT NULL DEFAULT 0,
  computed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_stats TO authenticated;
GRANT ALL ON public.question_stats TO service_role;

ALTER TABLE public.question_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage question_stats" ON public.question_stats
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));