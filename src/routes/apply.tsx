import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Upload, Loader2 } from "lucide-react";
import { submitApplication, type ApplicationInput } from "@/lib/applications.functions";
import { supabase } from "@/integrations/supabase/client";
import { WILAYAS } from "@/lib/wilayas";

export const Route = createFileRoute("/apply")({
  component: ApplyPage,
});

// -------- shared UI --------
const inputCls =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelCls = "text-sm font-medium text-ink";
const textareaCls = inputCls + " min-h-32 resize-y leading-relaxed";
const hintCls = "mt-1 text-xs text-muted-foreground";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className={hintCls}>{hint}</p>}
    </div>
  );
}

// -------- form data --------
type FormState = {
  full_name: string;
  email: string;
  phone: string;
  wilaya: string;
  workplace: string;
  institution_type: "public" | "private" | "freelance" | "";
  years_experience: string;
  levels_taught: string[];
  subjects: string;
  designed_official_exams: string;
  contributed_curricula: string;
  trained_teachers: string;
  research_work: string;
  pedagogy: { q1: string; q2: string; q3: string; q4: string; q5: string };
  case_study: { reasons: [string, string, string]; diagnostic_questions: [string, string, string] };
  vision: { why_join: string; future_view: string; one_change: string; contribution: string };
  weekly_hours: string;
  contribution_types: string[];
  practical: {
    q1_analysis: string;
    q1_improvement: string;
    q2_analysis: string;
    q2_improvement: string;
    q3_analysis: string;
    q3_improvement: string;
  };
  cv_path: string | null;
  work_certificate_path: string | null;
  extra_files: string[];
};

const EMPTY: FormState = {
  full_name: "",
  email: "",
  phone: "",
  wilaya: "",
  workplace: "",
  institution_type: "",
  years_experience: "",
  levels_taught: [],
  subjects: "",
  designed_official_exams: "",
  contributed_curricula: "",
  trained_teachers: "",
  research_work: "",
  pedagogy: { q1: "", q2: "", q3: "", q4: "", q5: "" },
  case_study: { reasons: ["", "", ""], diagnostic_questions: ["", "", ""] },
  vision: { why_join: "", future_view: "", one_change: "", contribution: "" },
  weekly_hours: "",
  contribution_types: [],
  practical: {
    q1_analysis: "",
    q1_improvement: "",
    q2_analysis: "",
    q2_improvement: "",
    q3_analysis: "",
    q3_improvement: "",
  },
  cv_path: null,
  work_certificate_path: null,
  extra_files: [],
};

const STORAGE_KEY = "qed_application_draft_v1";
const STARTED_AT_KEY = "qed_application_started_at_v1";

// Guards against a corrupted draft: if a previous submission attempt failed,
// some code path may have written the raw error message into a form field
// instead of showing it as a toast. If that ever happens again, this keeps
// the poisoned text out of the form instead of silently resubmitting it.
function looksLikeErrorString(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /row-level security|violates|RLS|Failed to fetch|TypeError|is not a function|undefined is not/i.test(v)
  );
}

function sanitizeDraft(raw: unknown): { data: Partial<FormState>; hadCorruption: boolean } {
  let hadCorruption = false;
  const clean = (val: unknown): unknown => {
    if (looksLikeErrorString(val)) {
      hadCorruption = true;
      return "";
    }
    if (Array.isArray(val)) return val.map(clean);
    if (val && typeof val === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val)) out[k] = clean(v);
      return out;
    }
    return val;
  };
  const data = (raw && typeof raw === "object" ? clean(raw) : {}) as Partial<FormState>;
  return { data, hadCorruption };
}

const LEVELS = ["متوسط", "ثانوي", "جامعي", "تعليم خاص"];
const CONTRIB_TYPES = [
  "مستشار تربوي",
  "مراجعة المحتوى",
  "بناء شجرة المهارات",
  "تصميم الاختبارات التشخيصية",
  "تحليل أخطاء التلاميذ",
  "البحث التربوي",
  "تدريب الأساتذة",
];

const STEPS = ["التعريف", "الخبرة", "التفكير التربوي", "دراسة حالة", "الرؤية", "التعاون", "الاختبار العملي"];

// Practical test questions (QED-style)
const PRACTICAL_QUESTIONS = [
  {
    label: "السؤال الأول",
    text: "أجاب تلميذ أن ½ + ⅓ = ⅖. حلّل الخطأ التصوّري (misconception) الذي وقع فيه، وبيّن كيف تشخّص جذوره.",
  },
  {
    label: "السؤال الثاني",
    text: "طُلب من تلميذ حل المعادلة 2x + 3 = 11 فأجاب: x = 7. حلّل خطوات تفكيره المحتملة، واذكر ما يكشفه ذلك عن فهمه للمساواة والعمليات العكسية.",
  },
  {
    label: "السؤال الثالث",
    text: "قال تلميذ: «(a + b)² = a² + b²». صمّم استراتيجية تشخيصية قصيرة لمعرفة إن كان الخطأ ناتجًا عن نقص في التوزيع، أم عن قياس خاطئ للأنماط، أم عن الاستعمال الآلي للصيغ.",
  },
] as const;

// ============ Page ============
function ApplyPage() {
  const navigate = useNavigate();
  const submit = useServerFn(submitApplication);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Draft persistence
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setForm({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
    try {
      if (!localStorage.getItem(STARTED_AT_KEY)) {
        localStorage.setItem(STARTED_AT_KEY, new Date().toISOString());
      }
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {}
  }, [form, hydrated]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep = (): string | null => {
    switch (step) {
      case 0:
        if (form.full_name.trim().length < 2) return "الاسم الكامل مطلوب";
        if (!/^\S+@\S+\.\S+$/.test(form.email)) return "بريد إلكتروني غير صالح";
        if (form.phone.trim().length < 6) return "رقم الهاتف مطلوب";
        if (!form.wilaya) return "الولاية مطلوبة";
        if (form.workplace.trim().length < 2) return "مكان العمل مطلوب";
        if (!form.institution_type) return "نوع المؤسسة مطلوب";
        if (!form.years_experience || Number(form.years_experience) < 0) return "سنوات الخبرة مطلوبة";
        if (form.levels_taught.length === 0) return "اختر مستوى واحدًا على الأقل";
        return null;
      case 1:
        if (form.subjects.trim().length < 2) return "المواد التي تدرسها مطلوبة";
        return null;
      case 2: {
        const p = form.pedagogy;
        for (const [k, v] of Object.entries(p)) {
          if (v.trim().length < 20) return `السؤال (${k}) يتطلب إجابة مفصّلة (٢٠ حرفًا على الأقل)`;
        }
        return null;
      }
      case 3: {
        for (let i = 0; i < 3; i++) {
          if (form.case_study.reasons[i].trim().length < 5) return `اذكر السبب ${i + 1}`;
          if (form.case_study.diagnostic_questions[i].trim().length < 5) return `اذكر السؤال التشخيصي ${i + 1}`;
        }
        return null;
      }
      case 4: {
        const v = form.vision;
        for (const [k, val] of Object.entries(v)) {
          if (val.trim().length < 20) return `أجب على السؤال (${k})`;
        }
        return null;
      }
      case 5:
        if (!form.weekly_hours || Number(form.weekly_hours) < 1) return "عدد الساعات الأسبوعية مطلوب";
        if (form.contribution_types.length === 0) return "اختر نوع مساهمة واحدة على الأقل";
        return null;
      case 6: {
        const p = form.practical;
        for (const [k, val] of Object.entries(p)) {
          const min = k.endsWith("improvement") ? 10 : 20;
          if (val.trim().length < min) return `أكمل الإجابة (${k})`;
        }
        return null;
      }
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else void handleSubmit();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const prev = () => {
    setStep(Math.max(0, step - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const startedAtRaw = (() => {
        try {
          return localStorage.getItem(STARTED_AT_KEY);
        } catch {
          return null;
        }
      })();
      const startedAt = startedAtRaw ?? new Date().toISOString();
      const fillDurationSeconds = Math.max(
        0,
        Math.round((Date.now() - new Date(startedAt).getTime()) / 1000),
      );

      const payload: ApplicationInput = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        wilaya: form.wilaya,
        workplace: form.workplace.trim(),
        institution_type: form.institution_type as "public" | "private" | "freelance",
        years_experience: Number(form.years_experience),
        levels_taught: form.levels_taught,
        subjects: form.subjects.trim(),
        designed_official_exams: form.designed_official_exams,
        contributed_curricula: form.contributed_curricula,
        trained_teachers: form.trained_teachers,
        research_work: form.research_work,
        pedagogy_answers: form.pedagogy,
        case_study: form.case_study,
        vision_answers: form.vision,
        weekly_hours: Number(form.weekly_hours),
        contribution_types: form.contribution_types,
        practical_test: form.practical,
        cv_path: form.cv_path,
        work_certificate_path: form.work_certificate_path,
        extra_files: form.extra_files,
        started_at: startedAt,
        fill_duration_seconds: fillDurationSeconds,
      };
      await submit({ data: payload });
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STARTED_AT_KEY);
      } catch {}
      toast.success("تم إرسال طلبك بنجاح ✅ سنراجعه ونعود إليك قريبًا.");
      navigate({ to: "/apply/success" });
    } catch (err) {
      toast.error((err as Error).message ?? "فشل الإرسال");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  return (
    <div className="min-h-screen bg-parchment text-ink">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-parchment/80 backdrop-blur">
        <div className="container-page py-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                المرحلة {step + 1} من {STEPS.length}
              </p>
              <h2 className="truncate font-display text-lg font-bold">{STEPS[step]}</h2>
            </div>
            <div className="shrink-0 text-xs text-muted-foreground">يتم الحفظ التلقائي</div>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-brand transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <main className="container-page max-w-3xl py-10">
        {step === 0 && <Stage1 form={form} update={update} />}
        {step === 1 && <Stage2 form={form} update={update} />}
        {step === 2 && <Stage3 form={form} update={update} />}
        {step === 3 && <Stage4 form={form} update={update} />}
        {step === 4 && <Stage5 form={form} update={update} />}
        {step === 5 && <Stage6 form={form} update={update} />}
        {step === 6 && <Stage7 form={form} update={update} />}

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
          <button
            onClick={prev}
            disabled={step === 0 || submitting}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            <ArrowRight className="h-4 w-4" />
            السابق
          </button>
          <button
            onClick={next}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-parchment hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ الإرسال...
              </>
            ) : step === STEPS.length - 1 ? (
              <>
                إرسال الطلب
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                التالي
                <ArrowLeft className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

// ============ Stages ============

function StageIntro({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1>
      {desc && <p className="mt-2 text-muted-foreground leading-relaxed">{desc}</p>}
    </div>
  );
}

type StageProps = {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
};

function Stage1({ form, update }: StageProps) {
  const toggleLevel = (l: string) => {
    update(
      "levels_taught",
      form.levels_taught.includes(l) ? form.levels_taught.filter((x) => x !== l) : [...form.levels_taught, l],
    );
  };
  return (
    <>
      <StageIntro
        title="التعريف بالمترشح"
        desc="لسنا نبحث عن أكثر الأساتذة شهرة، بل عن الأساتذة الذين يستطيعون تفسير أخطاء التلاميذ والمساهمة في بناء نموذج تربوي علمي."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="الاسم الكامل">
          <input className={inputCls} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
        </Field>
        <Field label="البريد الإلكتروني">
          <input
            type="email"
            className={inputCls}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </Field>
        <Field label="رقم الهاتف">
          <input className={inputCls} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </Field>
        <Field label="الولاية">
          <select className={inputCls} value={form.wilaya} onChange={(e) => update("wilaya", e.target.value)}>
            <option value="">اختر الولاية</option>
            {WILAYAS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </Field>
        <Field label="مكان العمل الحالي">
          <input className={inputCls} value={form.workplace} onChange={(e) => update("workplace", e.target.value)} />
        </Field>
        <Field label="نوع المؤسسة">
          <select
            className={inputCls}
            value={form.institution_type}
            onChange={(e) => update("institution_type", e.target.value as FormState["institution_type"])}
          >
            <option value="">اختر</option>
            <option value="public">عمومية</option>
            <option value="private">خاصة</option>
            <option value="freelance">حرة</option>
          </select>
        </Field>
        <Field label="سنوات الخبرة">
          <input
            type="number"
            min={0}
            max={80}
            className={inputCls}
            value={form.years_experience}
            onChange={(e) => update("years_experience", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-6">
        <label className={labelCls}>المستويات التي يدرسها</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {LEVELS.map((l) => {
            const active = form.levels_taught.includes(l);
            return (
              <button
                key={l}
                type="button"
                onClick={() => toggleLevel(l)}
                className={
                  "rounded-full border px-4 py-2 text-sm transition " +
                  (active ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card hover:bg-secondary")
                }
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Stage2({ form, update }: StageProps) {
  return (
    <>
      <StageIntro title="الخبرة المهنية" />
      <div className="space-y-5">
        <Field label="ما المواد التي تدرسها؟">
          <input className={inputCls} value={form.subjects} onChange={(e) => update("subjects", e.target.value)} />
        </Field>
        <Field label="هل سبق أن شاركت في إعداد اختبارات رسمية؟" hint="اترك الحقل فارغًا إن لم يكن ذلك ينطبق عليك.">
          <textarea
            className={textareaCls}
            value={form.designed_official_exams}
            onChange={(e) => update("designed_official_exams", e.target.value)}
          />
        </Field>
        <Field label="هل سبق أن ساهمت في إعداد مناهج أو مراجع؟">
          <textarea
            className={textareaCls}
            value={form.contributed_curricula}
            onChange={(e) => update("contributed_curricula", e.target.value)}
          />
        </Field>
        <Field label="هل سبق أن دربت أساتذة آخرين؟">
          <textarea
            className={textareaCls}
            value={form.trained_teachers}
            onChange={(e) => update("trained_teachers", e.target.value)}
          />
        </Field>
        <Field label="هل لديك أعمال أو أبحاث تربوية؟">
          <textarea
            className={textareaCls}
            value={form.research_work}
            onChange={(e) => update("research_work", e.target.value)}
          />
        </Field>
      </div>
    </>
  );
}

function LongQuestion({
  n,
  question,
  value,
  onChange,
}: {
  n: number;
  question: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-2xl font-bold text-brand">{n}.</span>
        <p className="font-medium leading-relaxed">{question}</p>
      </div>
      <textarea
        className={textareaCls + " mt-4"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="اكتب إجابتك بالتفصيل..."
      />
    </div>
  );
}

function Stage3({ form, update }: StageProps) {
  const p = form.pedagogy;
  const set = (k: keyof typeof p, v: string) => update("pedagogy", { ...p, [k]: v });
  return (
    <>
      <StageIntro
        title="التفكير التربوي"
        desc="خمسة أسئلة مفتوحة تعكس طريقتك في فهم الأخطاء وبناء الاختبارات. أجب بعمق."
      />
      <div className="space-y-4">
        <LongQuestion
          n={1}
          question="برأيك، لماذا يواجه كثير من التلاميذ صعوبة في تعلم الرياضيات؟"
          value={p.q1}
          onChange={(v) => set("q1", v)}
        />
        <LongQuestion
          n={2}
          question="عندما يجيب تلميذ بإجابة خاطئة، كيف تحدد السبب الحقيقي للخطأ قبل تصحيحه؟"
          value={p.q2}
          onChange={(v) => set("q2", v)}
        />
        <LongQuestion
          n={3}
          question="هل يمكن أن يصل تلميذان إلى نفس الإجابة الخاطئة لكن لأسباب مختلفة؟ اشرح مع أمثلة."
          value={p.q3}
          onChange={(v) => set("q3", v)}
        />
        <LongQuestion
          n={4}
          question="لو طلب منك تصميم اختبار تشخيصي لا يتجاوز عشرين دقيقة، كيف ستبنيه؟"
          value={p.q4}
          onChange={(v) => set("q4", v)}
        />
        <LongQuestion
          n={5}
          question="اذكر أكثر ثلاثة أخطاء تراها تتكرر عند التلاميذ، ولماذا تحدث؟"
          value={p.q5}
          onChange={(v) => set("q5", v)}
        />
      </div>
    </>
  );
}

function Stage4({ form, update }: StageProps) {
  const cs = form.case_study;
  const setReason = (i: number, v: string) => {
    const r = [...cs.reasons] as [string, string, string];
    r[i] = v;
    update("case_study", { ...cs, reasons: r });
  };
  const setQ = (i: number, v: string) => {
    const q = [...cs.diagnostic_questions] as [string, string, string];
    q[i] = v;
    update("case_study", { ...cs, diagnostic_questions: q });
  };
  return (
    <>
      <StageIntro
        title="دراسة حالة"
        desc="السؤال التالي يعكس نمط تفكير التلميذ الحقيقي في الجزائر. سنقيّم عمق تحليلك لأخطائه المحتملة."
      />
      <div className="rounded-2xl border-2 border-dashed border-brand/30 bg-accent/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">احسب</p>
        <p className="mt-2 font-display text-3xl font-bold text-ink" dir="ltr">
          -7 + 6 × (-4)
        </p>
      </div>

      <div className="mt-8">
        <h3 className="font-display text-lg font-bold">اذكر ثلاثة أسباب مختلفة قد تجعل التلميذ يجيب إجابة خاطئة:</h3>
        <div className="mt-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <span className="pt-3 font-display text-brand font-bold">{i + 1}</span>
              <textarea
                className={textareaCls + " min-h-20"}
                value={cs.reasons[i]}
                onChange={(e) => setReason(i, e.target.value)}
                placeholder={`السبب ${i + 1}...`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-display text-lg font-bold">
          صمّم ثلاثة أسئلة إضافية تمكّنك من معرفة السبب الحقيقي لكل حالة:
        </h3>
        <div className="mt-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <span className="pt-3 font-display text-brand font-bold">{i + 1}</span>
              <textarea
                className={textareaCls + " min-h-20"}
                value={cs.diagnostic_questions[i]}
                onChange={(e) => setQ(i, e.target.value)}
                placeholder={`السؤال التشخيصي ${i + 1}...`}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Stage5({ form, update }: StageProps) {
  const v = form.vision;
  const set = (k: keyof typeof v, val: string) => update("vision", { ...v, [k]: val });
  return (
    <>
      <StageIntro title="الرؤية" />
      <div className="space-y-4">
        <LongQuestion
          n={1}
          question="لماذا ترغب في الانضمام إلى مشروع QED؟"
          value={v.why_join}
          onChange={(x) => set("why_join", x)}
        />
        <LongQuestion
          n={2}
          question="كيف ترى مستقبل تعليم الرياضيات في الجزائر؟"
          value={v.future_view}
          onChange={(x) => set("future_view", x)}
        />
        <LongQuestion
          n={3}
          question="إذا أتيحت لك فرصة تغيير شيء واحد فقط في طريقة تدريس الرياضيات، فما هو؟"
          value={v.one_change}
          onChange={(x) => set("one_change", x)}
        />
        <LongQuestion
          n={4}
          question="ما الذي تتوقع أن تضيفه للمشروع؟"
          value={v.contribution}
          onChange={(x) => set("contribution", x)}
        />
      </div>
    </>
  );
}

function Stage6({ form, update }: StageProps) {
  const toggle = (c: string) => {
    update(
      "contribution_types",
      form.contribution_types.includes(c)
        ? form.contribution_types.filter((x) => x !== c)
        : [...form.contribution_types, c],
    );
  };
  return (
    <>
      <StageIntro title="التعاون" desc="حدد نمط ومساحة مشاركتك الممكنة." />
      <div className="max-w-sm">
        <Field label="كم ساعة تستطيع تخصيصها أسبوعيًا؟">
          <input
            type="number"
            min={1}
            max={80}
            className={inputCls}
            value={form.weekly_hours}
            onChange={(e) => update("weekly_hours", e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-8">
        <label className={labelCls}>
          ما نوع المساهمة التي تفضلها؟ <span className="text-muted-foreground">(اختر واحدة أو أكثر)</span>
        </label>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {CONTRIB_TYPES.map((c) => {
            const active = form.contribution_types.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                className={
                  "flex items-center justify-between rounded-xl border p-4 text-right text-sm transition " +
                  (active ? "border-brand bg-accent" : "border-border bg-card hover:bg-secondary")
                }
              >
                <span className="font-medium">{c}</span>
                <span
                  className={
                    "grid h-5 w-5 place-items-center rounded border " +
                    (active ? "border-brand bg-brand text-brand-foreground" : "border-border")
                  }
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Stage7({ form, update }: StageProps) {
  const p = form.practical;
  const set = (k: keyof typeof p, v: string) => update("practical", { ...p, [k]: v });
  const keys: Array<[keyof typeof p, keyof typeof p]> = [
    ["q1_analysis", "q1_improvement"],
    ["q2_analysis", "q2_improvement"],
    ["q3_analysis", "q3_improvement"],
  ];
  return (
    <>
      <StageIntro
        title="الاختبار العملي"
        desc="ثلاثة أسئلة تشخيصية حقيقية من QED. لكل سؤال: حلّل تفكير التلميذ، ثم اقترح تحسينًا للسؤال."
      />
      <div className="space-y-6">
        {PRACTICAL_QUESTIONS.map((q, i) => {
          const [ak, ik] = keys[i];
          return (
            <div key={i} className="rounded-2xl border border-border bg-card p-6">
              <p className="text-xs font-medium tracking-wide text-brand">{q.label}</p>
              <p className="mt-2 font-medium leading-relaxed">{q.text}</p>
              <div className="mt-5 space-y-4">
                <Field label="تحليلك للخطأ / طريقة تفكيرك في التشخيص">
                  <textarea className={textareaCls} value={p[ak]} onChange={(e) => set(ak, e.target.value)} />
                </Field>
                <Field label="اقتراح تحسين لهذا السؤال">
                  <textarea
                    className={textareaCls + " min-h-20"}
                    value={p[ik]}
                    onChange={(e) => set(ik, e.target.value)}
                  />
                </Field>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Stage8({ form, update }: StageProps) {
  return (
    <>
      <StageIntro title="رفع الملفات" desc="PDF أو DOCX، الحد الأقصى 10 ميغابايت لكل ملف." />
      <div className="space-y-4">
        <FileUploader
          label="السيرة الذاتية (إلزامي)"
          required
          value={form.cv_path}
          onChange={(p) => update("cv_path", p)}
        />
        <FileUploader
          label="شهادة العمل (اختيارية)"
          value={form.work_certificate_path}
          onChange={(p) => update("work_certificate_path", p)}
        />
        <MultiFileUploader
          label="أعمال، أبحاث، أو نماذج اختبارات (اختيارية)"
          value={form.extra_files}
          onChange={(p) => update("extra_files", p)}
        />
      </div>
    </>
  );
}

// ============ File uploaders ============

function useUpload() {
  return async (file: File): Promise<string> => {
    if (file.size > 10 * 1024 * 1024) throw new Error("حجم الملف يتجاوز 10 ميغابايت");
    const ext = file.name.split(".").pop() || "bin";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("applications").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw new Error(error.message);
    return path;
  };
}

function FileUploader({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  required?: boolean;
}) {
  const upload = useUpload();
  const [busy, setBusy] = useState(false);
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const p = await upload(f);
      onChange(p);
      toast.success("تم رفع الملف");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium">
            {label} {required && <span className="text-destructive">*</span>}
          </p>
          {value && (
            <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">
              {value}
            </p>
          )}
        </div>
        <label className="shrink-0 cursor-pointer">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-secondary">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {value ? "استبدال" : "اختر ملفًا"}
          </span>
        </label>
      </div>
    </div>
  );
}

function MultiFileUploader({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const upload = useUpload();
  const [busy, setBusy] = useState(false);
  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const paths: string[] = [];
      for (const f of Array.from(files)) paths.push(await upload(f));
      onChange([...value, ...paths]);
      toast.success("تم رفع الملفات");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium">{label}</p>
          {value.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{value.length} ملف مرفوع</p>}
        </div>
        <label className="shrink-0 cursor-pointer">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-secondary">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            إضافة ملفات
          </span>
        </label>
      </div>
    </div>
  );
}
