import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { isCurrentUserAdmin } from "@/lib/applications.functions";
import {
  listTopicsAndSkills,
  listQuestions,
  upsertQuestion,
  reviewQuestion,
  retireQuestion,
  generateEquivalentQuestions,
  autoQualityCheck,
  listSessions,
  questionAnalytics,
} from "@/lib/diagnostic.functions";
import {
  ArrowRight,
  ShieldAlert,
  Network,
  BookOpen,
  Sparkles,
  ClipboardCheck,
  Play,
  BarChart3,
  Plus,
  Check,
  X as XIcon,
  Wand2,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/diagnostic")({
  component: DiagnosticHub,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-destructive">{error.message}</div>
  ),
});

const PIPELINE = [
  { n: 1, ar: "تحليل المنهاج", en: "Curriculum analysis", group: "المعرفة" },
  { n: 2, ar: "بناء Knowledge Graph", en: "Knowledge graph", group: "المعرفة" },
  { n: 3, ar: "بناء Skill Graph", en: "Skill graph", group: "المعرفة" },
  { n: 4, ar: "اختيار مهارة واحدة", en: "Pick a skill", group: "المعرفة" },
  { n: 5, ar: "تحديد نواتج التعلم", en: "Learning outcomes", group: "بناء السؤال" },
  { n: 6, ar: "تحليل الأخطاء الشائعة", en: "Common misconceptions", group: "بناء السؤال" },
  { n: 7, ar: "بناء فرضيات التشخيص", en: "Diagnostic hypotheses", group: "بناء السؤال" },
  { n: 8, ar: "كتابة أسئلة مرجعية Gold", en: "Gold questions", group: "بناء السؤال" },
  { n: 9, ar: "مراجعة واعتماد الأسئلة", en: "Review & approve", group: "بناء السؤال" },
  { n: 10, ar: "توليد أسئلة مكافئة بالذكاء الاصطناعي", en: "AI generation", group: "التوسيع" },
  { n: 11, ar: "مراجعة الجودة آليًا", en: "Automated QA", group: "التوسيع" },
  { n: 12, ar: "مراجعة عينة بواسطة خبير", en: "Expert sampling", group: "التوسيع" },
  { n: 13, ar: "إدخال Question Pool", en: "Question pool", group: "التوسيع" },
  { n: 14, ar: "استخدام الأسئلة في جلسات التشخيص", en: "Run sessions", group: "التشغيل" },
  { n: 15, ar: "جمع بيانات أداء التلاميذ", en: "Collect performance", group: "التشغيل" },
  { n: 16, ar: "تحليل جودة كل سؤال", en: "Item analytics", group: "التشغيل" },
  { n: 17, ar: "تحسين السؤال أو استبعاده", en: "Improve or retire", group: "التشغيل" },
] as const;

type Tab = "pipeline" | "skills" | "questions" | "sessions" | "analytics";

function DiagnosticHub() {
  const adminFn = useServerFn(isCurrentUserAdmin);
  const roleQ = useQuery({ queryKey: ["me:isAdmin"], queryFn: () => adminFn() });
  const [tab, setTab] = useState<Tab>("pipeline");

  if (roleQ.isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">جارٍ التحقق...</div>;
  if (!roleQ.data?.isAdmin) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 font-display text-xl font-bold">غير مصرح لك</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-border bg-card">
        <div className="container-page py-4">
          <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-3 w-3" /> عودة للطلبات
          </Link>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">التشخيص التربوي</h1>
              <p className="text-xs text-muted-foreground">
                خط أنابيب من 17 مرحلة لبناء أسئلة تشخيصية دقيقة — للإدارة فقط
              </p>
            </div>
            <Link
              to="/admin/diagnostic/run"
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm text-parchment hover:opacity-90"
            >
              <Play className="h-4 w-4" /> تشغيل جلسة تشخيص
            </Link>
          </div>

          <nav className="mt-4 flex flex-wrap gap-1">
            {([
              ["pipeline", "خط الأنابيب", Network],
              ["skills", "المهارات والنواتج", BookOpen],
              ["questions", "بنك الأسئلة", ClipboardCheck],
              ["sessions", "الجلسات", Play],
              ["analytics", "تحليل الأسئلة", BarChart3],
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                  tab === id ? "bg-ink text-parchment" : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container-page py-6">
        {tab === "pipeline" && <PipelineTab />}
        {tab === "skills" && <SkillsTab />}
        {tab === "questions" && <QuestionsTab />}
        {tab === "sessions" && <SessionsTab />}
        {tab === "analytics" && <AnalyticsTab />}
      </main>
    </div>
  );
}

function PipelineTab() {
  const groups = ["المعرفة", "بناء السؤال", "التوسيع", "التشغيل"] as const;
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g}>
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {g}
          </h2>
          <ol className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {PIPELINE.filter((s) => s.group === g).map((s) => (
              <li
                key={s.n}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <span className="font-mono flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                  {s.n.toString().padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{s.ar}</p>
                  <p className="text-[11px] text-muted-foreground" dir="ltr">{s.en}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function SkillsTab() {
  const fn = useServerFn(listTopicsAndSkills);
  const q = useQuery({ queryKey: ["diag:skills"], queryFn: () => fn() });

  if (q.isLoading) return <div className="text-sm text-muted-foreground">جارٍ التحميل...</div>;
  if (q.error) return <div className="text-sm text-destructive">{(q.error as Error).message}</div>;

  const { topics = [], skills = [], outcomes = [], misconceptions = [] } = q.data ?? {};

  return (
    <div className="space-y-6">
      {topics.map((t: any) => {
        const topicSkills = skills.filter((s: any) => s.topic_id === t.id);
        return (
          <div key={t.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-lg font-bold">{t.name_ar}</h3>
              <span className="font-mono text-xs text-muted-foreground">{t.code}</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {topicSkills.map((s: any) => {
                const skOutcomes = outcomes.filter((o: any) => o.skill_id === s.id);
                const skMisc = misconceptions.filter((m: any) => m.skill_id === s.id);
                return (
                  <div key={s.id} className="rounded-lg border border-border bg-parchment p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{s.name_ar}</p>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">{s.bloom}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{s.description_ar}</p>
                    {skOutcomes.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                          نواتج التعلم
                        </p>
                        <ul className="mt-1 list-disc pr-5 text-xs space-y-0.5">
                          {skOutcomes.map((o: any) => <li key={o.id}>{o.statement_ar}</li>)}
                        </ul>
                      </div>
                    )}
                    {skMisc.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                          أخطاء شائعة
                        </p>
                        <ul className="mt-1 space-y-1 text-xs">
                          {skMisc.map((m: any) => (
                            <li key={m.id} className="rounded bg-amber-100/60 px-2 py-1">
                              <span className="font-mono text-[10px]">{m.code}</span> — {m.description_ar}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
              {topicSkills.length === 0 && (
                <p className="text-xs text-muted-foreground">لا توجد مهارات بعد.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  draft: "مسودة",
  ai_generated: "توليد آلي",
  ai_reviewed: "فحص آلي ✓",
  expert_reviewed: "مراجعة خبير",
  approved: "معتمد",
  retired: "متقاعد",
};
const STATUS_TONE: Record<string, string> = {
  draft: "bg-secondary text-foreground",
  ai_generated: "bg-purple-100 text-purple-900",
  ai_reviewed: "bg-sky-100 text-sky-900",
  expert_reviewed: "bg-indigo-100 text-indigo-900",
  approved: "bg-emerald-100 text-emerald-900",
  retired: "bg-red-100 text-red-900",
};

function QuestionsTab() {
  const listFn = useServerFn(listQuestions);
  const skillsFn = useServerFn(listTopicsAndSkills);
  const reviewFn = useServerFn(reviewQuestion);
  const retireFn = useServerFn(retireQuestion);
  const genFn = useServerFn(generateEquivalentQuestions);
  const qaFn = useServerFn(autoQualityCheck);
  const upsertFn = useServerFn(upsertQuestion);
  const qc = useQueryClient();

  const qList = useQuery({ queryKey: ["diag:questions"], queryFn: () => listFn() });
  const qSkills = useQuery({ queryKey: ["diag:skills"], queryFn: () => skillsFn() });
  const [filter, setFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showNew, setShowNew] = useState(false);

  const rows = useMemo(() => {
    let r: any[] = qList.data ?? [];
    if (statusFilter) r = r.filter((x) => x.status === statusFilter);
    if (filter) {
      const s = filter.toLowerCase();
      r = r.filter((x) => x.prompt_ar?.toLowerCase().includes(s) || x.skills?.name_ar?.includes(filter));
    }
    return r;
  }, [qList.data, filter, statusFilter]);

  const mReview = useMutation({
    mutationFn: (v: { question_id: string; verdict: "approve" | "reject" | "revise" }) =>
      reviewFn({ data: { ...v, notes: "" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diag:questions"] }),
  });
  const mRetire = useMutation({
    mutationFn: (id: string) => retireFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diag:questions"] }),
  });
  const mGen = useMutation({
    mutationFn: (id: string) => genFn({ data: { gold_id: id, count: 3 } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diag:questions"] }),
  });
  const mQA = useMutation({
    mutationFn: (id: string) => qaFn({ data: { question_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diag:questions"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="بحث في نص السؤال أو المهارة"
          className="min-w-[240px] flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-2 text-sm text-parchment"
        >
          <Plus className="h-4 w-4" /> سؤال جديد
        </button>
      </div>

      {showNew && (
        <NewQuestionForm
          skills={qSkills.data?.skills ?? []}
          onCancel={() => setShowNew(false)}
          onSaved={async () => {
            setShowNew(false);
            await qc.invalidateQueries({ queryKey: ["diag:questions"] });
          }}
          upsertFn={upsertFn}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {qList.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">لا توجد أسئلة مطابقة</div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((q: any) => {
              const options = (q.options as string[]) ?? [];
              return (
                <li key={q.id} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_TONE[q.status]}`}>
                          {STATUS_LABEL[q.status]}
                        </span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">{q.kind}</span>
                        {q.skills && (
                          <span className="text-[11px] text-muted-foreground">
                            {q.skills.name_ar} <span className="font-mono">({q.skills.code})</span>
                          </span>
                        )}
                        {q.probe_key && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-900">
                            probe: {q.probe_key}
                          </span>
                        )}
                        {q.times_used > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            استُخدم {q.times_used}× · نسبة النجاح {Math.round((q.times_correct / q.times_used) * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-medium">{q.prompt_ar}</p>
                      <ol className="mt-1 text-sm text-muted-foreground space-y-0.5">
                        {options.map((o, i) => (
                          <li key={i} className={i === q.correct_index ? "text-emerald-700 font-medium" : ""}>
                            {i === q.correct_index ? "✓" : "•"} {o}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="flex flex-shrink-0 flex-wrap gap-1">
                      {q.kind === "gold" && (
                        <button
                          onClick={() => mGen.mutate(q.id)}
                          disabled={mGen.isPending}
                          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-secondary/50"
                          title="ولّد ٣ أسئلة مكافئة"
                        >
                          <Sparkles className="h-3 w-3" /> توليد
                        </button>
                      )}
                      <button
                        onClick={() => mQA.mutate(q.id)}
                        disabled={mQA.isPending}
                        className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-secondary/50"
                        title="فحص جودة آلي"
                      >
                        <Wand2 className="h-3 w-3" /> فحص
                      </button>
                      {q.status !== "approved" && (
                        <button
                          onClick={() => mReview.mutate({ question_id: q.id, verdict: "approve" })}
                          className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-900"
                        >
                          <Check className="h-3 w-3" /> اعتماد
                        </button>
                      )}
                      {q.status !== "retired" && (
                        <button
                          onClick={() => mRetire.mutate(q.id)}
                          className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-900"
                        >
                          <Trash2 className="h-3 w-3" /> استبعاد
                        </button>
                      )}
                    </div>
                  </div>
                  {q.ai_meta?.quality && (
                    <div className="rounded bg-sky-50 border border-sky-200 p-2 text-xs text-sky-900">
                      <b>فحص آلي:</b> درجة {q.ai_meta.quality.overall_score}/10 —{" "}
                      {q.ai_meta.quality.answer_valid ? "الإجابة سليمة" : "شكوك حول الإجابة"} —{" "}
                      {q.ai_meta.quality.issues_ar}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function NewQuestionForm({ skills, onCancel, onSaved, upsertFn }: any) {
  const [skillId, setSkillId] = useState(skills[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [probeKey, setProbeKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setSaving(true);
    try {
      await upsertFn({
        data: {
          skill_id: skillId,
          kind: "gold" as const,
          status: "draft" as const,
          bloom: "Apply",
          prompt_ar: prompt,
          options: opts.filter((o) => o.trim().length > 0),
          correct_index: correct,
          probe_key: probeKey || null,
        },
      });
      onSaved();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-brand/40 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold">سؤال ذهبي جديد (Gold)</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <XIcon className="h-4 w-4" />
        </button>
      </div>
      <select
        value={skillId}
        onChange={(e) => setSkillId(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      >
        {skills.map((s: any) => (
          <option key={s.id} value={s.id}>{s.name_ar} ({s.code})</option>
        ))}
      </select>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="نص السؤال بالعربية"
        rows={2}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
      <div className="space-y-2">
        {opts.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              checked={correct === i}
              onChange={() => setCorrect(i)}
              title="اختر كإجابة صحيحة"
            />
            <input
              value={o}
              onChange={(e) => setOpts(opts.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={`الخيار ${i + 1}`}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
            />
          </div>
        ))}
      </div>
      <input
        value={probeKey}
        onChange={(e) => setProbeKey(e.target.value)}
        placeholder="probe_key اختياري (sign, transposition, pythagoras...)"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
      />
      {err && <p className="text-xs text-destructive">{err}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border border-border px-3 py-1.5 text-sm">
          إلغاء
        </button>
        <button
          onClick={submit}
          disabled={saving || !prompt || !skillId}
          className="rounded-lg bg-ink px-3 py-1.5 text-sm text-parchment disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>
    </div>
  );
}

function SessionsTab() {
  const fn = useServerFn(listSessions);
  const q = useQuery({ queryKey: ["diag:sessions"], queryFn: () => fn() });
  if (q.isLoading) return <div className="text-sm text-muted-foreground">جارٍ التحميل...</div>;
  const rows: any[] = q.data ?? [];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {rows.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          لا توجد جلسات — ابدأ جلسة جديدة من الأعلى.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs">
            <tr>
              <th className="p-3 text-start">التاريخ</th>
              <th className="p-3 text-start">الطالب</th>
              <th className="p-3 text-start">المهارة</th>
              <th className="p-3 text-start">الحالة</th>
              <th className="p-3 text-start">الأدلّة</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-secondary/30">
                <td className="p-3 text-xs text-muted-foreground">
                  {new Date(s.started_at).toLocaleString("ar-DZ")}
                </td>
                <td className="p-3">{s.student_label ?? "—"}</td>
                <td className="p-3 text-xs">{s.skills?.name_ar ?? "متعدد"}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                    s.status === "completed" ? "bg-emerald-100 text-emerald-900" :
                    s.status === "running" ? "bg-amber-100 text-amber-900" : "bg-secondary"
                  }`}>{s.status}</span>
                </td>
                <td className="p-3 text-xs">
                  {Array.isArray(s.evidence) ? s.evidence.length : 0} إدخال
                </td>
                <td className="p-3">
                  <Link
                    to="/admin/diagnostic/session/$id"
                    params={{ id: s.id }}
                    className="text-xs text-brand hover:underline"
                  >
                    التقرير ←
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const fn = useServerFn(questionAnalytics);
  const q = useQuery({ queryKey: ["diag:analytics"], queryFn: () => fn() });
  if (q.isLoading) return <div className="text-sm text-muted-foreground">جارٍ التحميل...</div>;
  const rows: any[] = q.data ?? [];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-xs">
          <tr>
            <th className="p-3 text-start">السؤال</th>
            <th className="p-3 text-start">المهارة</th>
            <th className="p-3 text-start">الاستخدام</th>
            <th className="p-3 text-start">p-value</th>
            <th className="p-3 text-start">الحالة</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="p-3 max-w-[400px] truncate">{r.prompt_ar}</td>
              <td className="p-3 text-xs">{r.skills?.name_ar ?? "—"}</td>
              <td className="p-3 text-xs">{r.times_used}</td>
              <td className="p-3 text-xs">
                {r.p_value != null ? (
                  <span className={r.p_value < 0.3 || r.p_value > 0.9 ? "text-amber-700" : "text-emerald-700"}>
                    {(r.p_value * 100).toFixed(0)}%
                  </span>
                ) : "—"}
              </td>
              <td className="p-3">
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_TONE[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-border bg-parchment p-3 text-[11px] text-muted-foreground">
        p-value خارج المجال [30% – 90%] يشير إلى سؤال سهل جدًا أو صعب جدًا — يستحق التحسين أو الاستبعاد (المرحلة ١٧).
      </div>
    </div>
  );
}
