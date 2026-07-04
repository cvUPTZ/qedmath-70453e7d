# منصة QED — تقييم أساتذة الرياضيات

منصة عربية RTL بجودة Apple/Linear لاستقبال طلبات أساتذة الرياضيات وتقييمها، مع لوحة إدارة داخلية وتقييم آلي.

## المكدس التقني
- TanStack Start + Tailwind v4 (موجودان)
- Lovable Cloud (Supabase) للتخزين والمصادقة ورفع الملفات
- التقييم الآلي عبر Lovable AI Gateway (server function)

## الصفحات (المسارات)
```
/                         الصفحة الرئيسية (Hero + CTA)
/apply                    رحلة التقديم متعددة المراحل (7 مراحل)
/apply/success            رسالة الشكر
/admin                    تسجيل دخول المشرف
/_authenticated/admin     لوحة الطلبات (قائمة + فلاتر)
/_authenticated/admin/$id تفاصيل طلب واحد + ملاحظات + حالة
```

## رحلة التقديم (Multi-step, progress bar)
1. التعريف بالمترشح
2. الخبرة المهنية
3. التفكير التربوي (5 أسئلة مفتوحة طويلة)
4. دراسة حالة (`-7 + 6 × (-4)`) — ٣ أسباب + ٣ أسئلة تشخيصية
5. الرؤية (٤ أسئلة)
6. التعاون (ساعات + أنواع مساهمة متعددة)
7. الاختبار العملي (٢٠–٣٠د): ٣ أسئلة تشخيصية QED حقيقية، لكل منها تحليل + تحسين مقترح
8. رفع الملفات (CV إلزامي، شهادة عمل + أعمال اختيارية) — Supabase Storage
- حفظ تلقائي في localStorage بين الخطوات
- تحقق Zod لكل مرحلة

## قاعدة البيانات
جداول:
- `applications` — كل الحقول + JSONB للأقسام الطويلة + `status` enum + `ai_score` + `ai_breakdown` jsonb + `created_at`
- `application_notes` — ملاحظات داخلية (admin_id, note, created_at)
- `user_roles` + enum `app_role` (admin) + `has_role()` security definer (وفق قواعد المشروع)
- Storage bucket خاص `applications` (private) للملفات

RLS:
- INSERT مفتوح لأي زائر على `applications` (تقديم عام)
- SELECT/UPDATE للمشرفين فقط عبر `has_role(auth.uid(),'admin')`
- الملاحظات: مشرفون فقط

## التقييم الآلي (بعد الإرسال)
Server function تستدعي Lovable AI (google/gemini-2.5-flash) مع prompt عربي منظم يُرجع JSON:
```
{ pedagogical_analysis, error_interpretation, systematic_thinking,
  field_experience, communication, collaboration, innovation, total }
```
يُخزن في `ai_score` و `ai_breakdown`. يظهر فقط في لوحة الإدارة.

## لوحة الإدارة
- بحث بالاسم/الولاية
- فلاتر: سنوات الخبرة (شرائح)، المستوى الدراسي، الحالة
- ترتيب حسب التقييم الآلي
- تفاصيل الطلب: كل الإجابات + روابط الملفات + شريط التقييم الآلي المفصّل + ملاحظات داخلية + تغيير الحالة (جديد/قيد المراجعة/مقابلة/تجربة عملية/مقبول/مرفوض)

## التصميم
- RTL كامل (`dir="rtl"` على `<html>`, `lang="ar"`)
- خطوط: **IBM Plex Sans Arabic** للنصوص + **Tajawal** للعناوين (عبر `<link>` في `__root.tsx`)
- لوحة ألوان هادئة أكاديمية: خلفية عاجية، أسود فحمي، أخضر زيتوني مميّز `oklch(0.55 0.12 155)` كلون علامة QED
- بدون تدرجات بنفسجية؛ حواف ناعمة، ظلال دقيقة، مسافات سخية
- رسوم متحركة خفيفة بين المراحل (fade + slide)
- كل الألوان/الخطوط كـ tokens في `src/styles.css`

## الأمن
- تحقق Zod على العميل + قيود طول في الجدول
- rate-limit بسيط في server function للإرسال (حماية من السبام)
- ملفات: تحقق نوع/حجم (PDF/DOCX ≤ 10MB)

## سؤال قبل التنفيذ
لا يوجد — كل شيء محدد في الطلب. سأمضي بتفعيل Lovable Cloud ثم البناء.
