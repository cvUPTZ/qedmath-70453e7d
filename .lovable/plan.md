
# نظام التشخيص الذكي — للإدارة فقط

بناء وحدة تشخيص كاملة داخل لوحة الإدارة (`/admin/diagnostic/*`) مستوحاة من `diagnostic_2.html` ومبنية على منهاج السنة الأولى متوسط (من الـ markdown). لا يظهر شيء منها للزوار العاديين.

## 1. الهيكلية العامة (17 مرحلة، مقسّمة إلى 4 لوحات)

```
لوحة (١) المنهج والمعرفة
  01 تحليل المنهاج → 02 Knowledge Graph → 03 Skill Graph → 04 اختيار مهارة

لوحة (٢) بناء السؤال
  05 نواتج التعلم → 06 الأخطاء الشائعة → 07 فرضيات التشخيص
  → 08 أسئلة مرجعية (Gold) → 09 مراجعة واعتماد

لوحة (٣) التوسيع الآلي
  10 توليد أسئلة مكافئة (AI) → 11 مراجعة جودة آلية
  → 12 مراجعة خبير → 13 Question Pool

لوحة (٤) التشغيل والتحسين
  14 جلسات التشخيص → 15 بيانات الأداء
  → 16 تحليل جودة كل سؤال → 17 تحسين/استبعاد
```

كل مرحلة = بطاقة قابلة للطي بحالة (مسودّة / مُراجَعة / معتمَدة).

## 2. الصفحات الجديدة

```
/admin/diagnostic                لوحة تحكم بخط الأنابيب الـ17
/admin/diagnostic/skills         Knowledge + Skill graph (شجرة)
/admin/diagnostic/skills/$id     تفاصيل مهارة: نواتج + أخطاء + فرضيات
/admin/diagnostic/questions      Question Pool (فلترة + حالة)
/admin/diagnostic/questions/new  محرر سؤال (Gold أو AI)
/admin/diagnostic/sessions       جلسات التشخيص + تشغيل تجريبي
/admin/diagnostic/sessions/$id   تقرير جلسة (Trail + Evidence)
/admin/diagnostic/analytics      جودة الأسئلة (نسبة النجاح، التمييز)
```

المشغّل التفاعلي (الشجرة + الـ probe) يعمل بنفس منطق `diagnostic_2.html`
لكن بمكوّنات React + Tailwind بألوان المشروع، RTL، وحفظ الجلسة في القاعدة.

## 3. قاعدة البيانات (كل الوصول للإدارة فقط)

جداول جديدة، كلها RLS: SELECT/INSERT/UPDATE محصور بـ `has_role(auth.uid(),'admin')`:

- `curriculum_topics` — عقد الـ Knowledge Graph (unit, chapter, topic, parent_id, grade, source_ref)
- `skills` — عقد الـ Skill Graph (code, name_ar, bloom, topic_id, prerequisites uuid[])
- `learning_outcomes` — نواتج تعلم لكل مهارة (skill_id, statement_ar, level)
- `misconceptions` — أخطاء شائعة (skill_id, code, description_ar, hypothesis_ar)
- `questions` — بنك الأسئلة (skill_id, type: gold|ai|probe, prompt_ar, options jsonb, correct_index, bloom, status: draft|ai_reviewed|expert_reviewed|approved|retired, parent_gold_id, probe_tree jsonb, ai_meta jsonb)
- `question_reviews` — قرارات المراجعة (question_id, reviewer_id, verdict, notes)
- `diagnostic_sessions` — جلسة تشغيل (started_by, target_skill_id, status, evidence jsonb, trail jsonb, completed_at)
- `session_answers` — إجابة لكل سؤال في الجلسة (session_id, question_id, is_probe, chosen_index, correct, ms_elapsed)
- `question_stats` — عرض/تجميع مادّي: p_value، discrimination، عدد الظهور

سياسات: `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated` مع `USING (public.has_role(auth.uid(),'admin'))` على كل جدول + `GRANT ALL ... TO service_role`.

بذر (seed) أولي في نفس الـ migration: 6–8 مواضيع + 10–12 مهارة مأخوذة من الـ markdown (الأعداد النسبية، المعادلات من الدرجة الأولى، النشر والتحليل، فيثاغورس، الكسور، المساحات، التحويلات الوحدوية…) + 3 شجرات probe مطابقة لما في `diagnostic_2.html` (sign / transposition / pythagoras).

## 4. دوال الخادم (createServerFn، محمية بـ requireSupabaseAuth + فحص admin)

- `listSkills`, `getSkill`, `upsertSkill`
- `listQuestions(filters)`, `upsertQuestion`, `reviewQuestion`
- `generateEquivalentQuestions(goldId, count)` — يستدعي Lovable AI Gateway (google/gemini-2.5-flash) وينشئ أسئلة `ai_reviewed`
- `autoQualityCheck(questionId)` — فحص: صياغة عربية، صحة الإجابة، بدائل معقولة، مطابقة الناتج
- `startSession(skillId)`, `submitAnswer(sessionId, questionId, chosenIndex, ms)`, `finishSession`
- `computeQuestionStats(questionId)` — p-value + discrimination

## 5. الواجهة (بأسلوب `diagnostic_2.html` مطبَّق على design tokens الحالية)

- شريط جانبي (trail) يعرض تسلسل الأسئلة والـ probes مع نقاط ملوّنة
- بطاقة سؤال بخط Tajawal، مع لوحة أخضر/أحمر عند الكشف
- بانر عنبري (amber) للـ probe بنفس الأسلوب
- شاشة نتيجة الجلسة: جدول Evidence + المفاهيم الخاطئة المكتشفة
- مخطط بسيط لـ Skill Graph (شبكة أفقية داخل CSS grid، بدون مكتبات إضافية)
- كل الحقول والأزرار عربية RTL، متسقة مع الألوان الموجودة

## 6. التحكم بالوصول

- الوحدة كاملة تحت `_authenticated/admin.diagnostic.*`
- كل صفحة تتحقق من `isCurrentUserAdmin` (نفس النمط في `admin.visits.tsx`)
- لا رابط ولا إشارة إليها من الواجهة العامة أو نموذج التقديم

## 7. رابط في لوحة الإدارة الرئيسية

إضافة بطاقة/زر "التشخيص التربوي" في `admin.index.tsx` بجانب "الزيارات".

## 8. الترتيب التنفيذي

1. Migration واحدة تنشئ كل الجداول + GRANT + RLS + بذر أولي
2. دوال الخادم (`*.functions.ts`)
3. الصفحات (لوحة تحكم → skills → questions → session runner → analytics)
4. مكوّن مُشغّل التشخيص (Session runner) بنمط `diagnostic_2.html`
5. زر في `admin.index.tsx`
6. اختبار سريع بـ Playwright على `/admin/diagnostic`

## تفاصيل تقنية

- كل الدوال الحساسة تستخدم `requireSupabaseAuth` + فحص دور admin داخل الـ handler
- استدعاء الذكاء الاصطناعي عبر `src/lib/ai-gateway.server.ts` الموجود
- الأسئلة تحفظ `probe_tree` كـ JSONB بنفس بنية `diagnostic_2.html` لضمان توافق المُشغّل
- لا تغييرات على منطق التقديم أو تتبع الزيارات

## سؤال قبل التنفيذ

هل الحجم مقبول للتنفيذ في جلسة واحدة (~15 ملفًا جديدًا + migration ضخمة)، أم تفضّل تقسيمه على مراحل (مثلاً: أولاً القاعدة + الـ Pool، ثم المُشغّل، ثم التحليلات)؟
