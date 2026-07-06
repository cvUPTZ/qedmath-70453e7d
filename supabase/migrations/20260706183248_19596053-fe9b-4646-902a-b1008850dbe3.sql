
-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.question_status AS ENUM ('draft','ai_generated','ai_reviewed','expert_reviewed','approved','retired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.question_kind AS ENUM ('gold','ai','probe');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.session_status AS ENUM ('running','completed','abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. curriculum_topics
CREATE TABLE public.curriculum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  grade text NOT NULL DEFAULT '1AM',
  kind text NOT NULL DEFAULT 'topic',
  source_ref text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.curriculum_topics TO authenticated;
GRANT ALL ON public.curriculum_topics TO service_role;
ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage topics" ON public.curriculum_topics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 2. skills
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES public.curriculum_topics(id) ON DELETE SET NULL,
  code text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  description_ar text,
  bloom text NOT NULL DEFAULT 'Apply',
  prerequisites uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage skills" ON public.skills FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3. learning_outcomes
CREATE TABLE public.learning_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  statement_ar text NOT NULL,
  level text NOT NULL DEFAULT 'core',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_outcomes TO authenticated;
GRANT ALL ON public.learning_outcomes TO service_role;
ALTER TABLE public.learning_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage outcomes" ON public.learning_outcomes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4. misconceptions
CREATE TABLE public.misconceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  code text NOT NULL,
  description_ar text NOT NULL,
  hypothesis_ar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(skill_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.misconceptions TO authenticated;
GRANT ALL ON public.misconceptions TO service_role;
ALTER TABLE public.misconceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage misconceptions" ON public.misconceptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 5. questions
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  kind public.question_kind NOT NULL DEFAULT 'gold',
  status public.question_status NOT NULL DEFAULT 'draft',
  bloom text NOT NULL DEFAULT 'Apply',
  prompt_ar text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index int NOT NULL DEFAULT 0,
  probe_key text,
  probe_tree jsonb,
  parent_gold_id uuid REFERENCES public.questions(id) ON DELETE SET NULL,
  ai_meta jsonb,
  times_used int NOT NULL DEFAULT 0,
  times_correct int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage questions" ON public.questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 6. question_reviews
CREATE TABLE public.question_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  reviewer_id uuid,
  verdict text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_reviews TO authenticated;
GRANT ALL ON public.question_reviews TO service_role;
ALTER TABLE public.question_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage reviews" ON public.question_reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 7. diagnostic_sessions
CREATE TABLE public.diagnostic_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_by uuid,
  target_skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  status public.session_status NOT NULL DEFAULT 'running',
  trail jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  student_label text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_sessions TO authenticated;
GRANT ALL ON public.diagnostic_sessions TO service_role;
ALTER TABLE public.diagnostic_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage sessions" ON public.diagnostic_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 8. session_answers
CREATE TABLE public.session_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE SET NULL,
  is_probe boolean NOT NULL DEFAULT false,
  probe_node_id text,
  chosen_index int,
  is_correct boolean,
  ms_elapsed int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_answers TO authenticated;
GRANT ALL ON public.session_answers TO service_role;
ALTER TABLE public.session_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage answers" ON public.session_answers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- triggers
CREATE TRIGGER tr_topics_updated BEFORE UPDATE ON public.curriculum_topics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tr_skills_updated BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tr_questions_updated BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================= SEED =================
INSERT INTO public.curriculum_topics (code, name_ar, kind, sort_order) VALUES
  ('numbers',    'الأعداد والحساب',        'unit', 1),
  ('algebra',    'الحساب الحرفي والمعادلات','unit', 2),
  ('fractions',  'الكسور والأعداد الناطقة', 'unit', 3),
  ('geometry',   'الهندسة',                'unit', 4),
  ('measure',    'القياس والوحدات',        'unit', 5),
  ('data',       'تنظيم المعطيات',         'unit', 6);

INSERT INTO public.skills (code, name_ar, description_ar, bloom, topic_id) VALUES
  ('SK.REL',   'جمع وطرح الأعداد النسبية', 'إتقان قواعد الإشارة في جمع وطرح الأعداد الموجبة والسالبة', 'Apply',
    (SELECT id FROM public.curriculum_topics WHERE code='numbers')),
  ('SK.EQ1',   'حل معادلة من الدرجة الأولى بمجهول واحد', 'نقل الحدود مع قلب الإشارة وحل ax+b=c', 'Apply',
    (SELECT id FROM public.curriculum_topics WHERE code='algebra')),
  ('SK.EXPAND','النشر والتوزيع', 'نشر عبارات من الشكل a(b+c) و (x+a)(x+b)', 'Apply',
    (SELECT id FROM public.curriculum_topics WHERE code='algebra')),
  ('SK.FACT',  'التحليل بالعامل المشترك', 'تحليل عبارة إلى جداء بعامل مشترك', 'Analyze',
    (SELECT id FROM public.curriculum_topics WHERE code='algebra')),
  ('SK.FRAC',  'جمع وطرح الكسور', 'توحيد المقامات وحساب المجموع أو الفرق', 'Apply',
    (SELECT id FROM public.curriculum_topics WHERE code='fractions')),
  ('SK.PYTH',  'مبرهنة فيثاغورس', 'تطبيق c² = a² + b² في مثلث قائم', 'Apply',
    (SELECT id FROM public.curriculum_topics WHERE code='geometry')),
  ('SK.AREA',  'حساب المساحات', 'مساحات المستطيل والمربع والمثلث', 'Apply',
    (SELECT id FROM public.curriculum_topics WHERE code='geometry')),
  ('SK.UNIT',  'التحويل بين الوحدات', 'التحويل بين وحدات الطول والكتلة والسعة', 'Apply',
    (SELECT id FROM public.curriculum_topics WHERE code='measure'));

-- learning outcomes (a few examples)
INSERT INTO public.learning_outcomes (skill_id, statement_ar) VALUES
  ((SELECT id FROM public.skills WHERE code='SK.REL'), 'يجمع عددين نسبيين مختلفي الإشارة بحساب الفرق وأخذ إشارة الأكبر قيمة مطلقة'),
  ((SELECT id FROM public.skills WHERE code='SK.REL'), 'يطرح عددًا نسبيًا بإضافة نظيره الجمعي'),
  ((SELECT id FROM public.skills WHERE code='SK.EQ1'), 'ينقل حدًا من طرف إلى طرف مع قلب إشارته'),
  ((SELECT id FROM public.skills WHERE code='SK.EQ1'), 'يعزل المجهول ويقسم على معامله'),
  ((SELECT id FROM public.skills WHERE code='SK.PYTH'), 'يميّز الوتر بأنه الضلع المقابل للزاوية القائمة'),
  ((SELECT id FROM public.skills WHERE code='SK.PYTH'), 'يطبق العلاقة c² = a² + b² لإيجاد ضلع مجهول');

-- misconceptions
INSERT INTO public.misconceptions (skill_id, code, description_ar, hypothesis_ar) VALUES
  ((SELECT id FROM public.skills WHERE code='SK.REL'), 'sign-flip-addition',
    'يقلب الإشارة عند جمع أو طرح الأعداد النسبية',
    'التلميذ لا يفرّق بين قاعدتي "نفس الإشارة" و"مختلفتا الإشارة"'),
  ((SELECT id FROM public.skills WHERE code='SK.EQ1'), 'transposition-sign-drop',
    'ينقل الحد دون قلب إشارته',
    'يعتبر النقل مجرد تحريك مكاني دون عملية جبرية'),
  ((SELECT id FROM public.skills WHERE code='SK.PYTH'), 'pythagoras-formula-unknown',
    'لا يحفظ العلاقة c² = a² + b² أو لا يعرف متى تُطبَّق',
    'يخلط بين الوتر والضلعين القائمين');

-- gold questions with probe trees (mirroring diagnostic_2.html)
INSERT INTO public.questions (skill_id, kind, status, bloom, prompt_ar, options, correct_index, probe_key, probe_tree) VALUES
  (
    (SELECT id FROM public.skills WHERE code='SK.REL'),
    'gold','approved','Apply',
    'احسب: (−5) + 8',
    '["3","-3","13","-13"]'::jsonb, 0, 'sign',
    '{
      "id":"PROBE-SIGN-1",
      "prompt":"ما ناتج (−5) + 2؟",
      "options":["-3","3","-7","7"],
      "correct":0,
      "onCorrect":{"ruledOut":"قاعدة جمع عددين مختلفي الإشارة مكتسبة جزئيًا."},
      "onIncorrect":{"node":{
        "id":"PROBE-SIGN-2",
        "prompt":"ما ناتج 5 − 8؟",
        "options":["-3","3","13","-13"],
        "correct":0,
        "onCorrect":{"ruledOut":"يفهم الطرح لكن يخطئ في الجمع بين عددين مختلفي الإشارة."},
        "onIncorrect":{
          "misconception":"sign-flip-addition",
          "skillLabel":"خلط في إشارات جمع/طرح الأعداد النسبية",
          "note":"يقلب الإشارة عند جمع أو طرح الأعداد النسبية."
        }
      }}
    }'::jsonb
  ),
  (
    (SELECT id FROM public.skills WHERE code='SK.EQ1'),
    'gold','approved','Apply',
    'حل المعادلة: 2x + 3 = 11',
    '["4","7","5.5","3"]'::jsonb, 0, 'transposition',
    '{
      "id":"PROBE-TRANS-1",
      "prompt":"إذا كان x + 3 = 11 فما قيمة x؟",
      "options":["8","14","3","11"],
      "correct":0,
      "onCorrect":{"ruledOut":"ينقل الحد بشكل صحيح عندما يكون المجهول بدون معامل."},
      "onIncorrect":{"node":{
        "id":"PROBE-TRANS-2",
        "prompt":"عند نقل +3 من طرف إلى طرف آخر، ماذا تصبح إشارته؟",
        "options":["تصبح -3","تبقى +3","تصبح صفرًا","تتضاعف"],
        "correct":0,
        "onCorrect":{"ruledOut":"يعرف القاعدة نظريًا لكن يخطئ في التطبيق."},
        "onIncorrect":{
          "misconception":"transposition-sign-drop",
          "skillLabel":"لا يقلب الإشارة عند نقل حد بين طرفي المعادلة",
          "note":"ينقل الحد دون قلب إشارته فيبقى الطرفان غير متوازنين."
        }
      }}
    }'::jsonb
  ),
  (
    (SELECT id FROM public.skills WHERE code='SK.PYTH'),
    'gold','approved','Apply',
    'في مثلث قائم، الضلعان القائمان طولهما 6 سم و 8 سم. أوجد طول الوتر.',
    '["10 سم","14 سم","48 سم","7 سم"]'::jsonb, 0, 'pythagoras',
    '{
      "id":"PROBE-PYTH-1",
      "prompt":"في مثلث قائم الزاوية، أي ضلع هو الوتر؟",
      "options":["الضلع المقابل للزاوية القائمة","أطول ضلع في المثلث","أي ضلع يختاره الطالب","الضلع الأقصر"],
      "correct":0,
      "onCorrect":{"ruledOut":"يعرف تعريف الوتر لكن يخطئ في الحساب."},
      "onIncorrect":{"node":{
        "id":"PROBE-PYTH-2",
        "prompt":"إذا كان الضلعان 3 و 4، فما مربع الوتر؟",
        "options":["25","7","12","14"],
        "correct":0,
        "onCorrect":{"ruledOut":"يطبق القانون بمجرد تذكيره به، الثغرة في الاسترجاع."},
        "onIncorrect":{
          "misconception":"pythagoras-formula-unknown",
          "skillLabel":"لا يعرف أو يسيء تطبيق علاقة فيثاغورس",
          "note":"لا يحفظ العلاقة c² = a² + b² أو لا يعرف متى تُطبَّق."
        }
      }}
    }'::jsonb
  ),
  (
    (SELECT id FROM public.skills WHERE code='SK.EXPAND'),
    'gold','approved','Apply',
    'انشر: (x + 2)(x + 3)',
    '["x² + 5x + 6","x² + 6","x² + 5x + 5","2x + 5"]'::jsonb, 0, null, null
  ),
  (
    (SELECT id FROM public.skills WHERE code='SK.FACT'),
    'gold','approved','Analyze',
    'حلل إلى جداء: 3x + 3y',
    '["3(x + y)","3xy","x + y","3(x − y)"]'::jsonb, 0, null, null
  ),
  (
    (SELECT id FROM public.skills WHERE code='SK.AREA'),
    'gold','approved','Apply',
    'مستطيل طوله 8 سم وعرضه 5 سم. ما مساحته؟',
    '["40 سم²","26 سم²","13 سم²","80 سم²"]'::jsonb, 0, null, null
  ),
  (
    (SELECT id FROM public.skills WHERE code='SK.UNIT'),
    'gold','approved','Apply',
    'حوّل 3.5 م إلى سم.',
    '["350 سم","35 سم","3500 سم","0.35 سم"]'::jsonb, 0, null, null
  ),
  (
    (SELECT id FROM public.skills WHERE code='SK.FRAC'),
    'gold','approved','Apply',
    'احسب: 3/4 + 1/8',
    '["7/8","4/12","1/2","1"]'::jsonb, 0, null, null
  );
