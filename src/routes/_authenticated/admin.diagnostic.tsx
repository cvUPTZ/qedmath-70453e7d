import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
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
  upsertTopic,
  deleteTopic,
  upsertSkill,
  deleteSkill,
  upsertOutcome,
  deleteOutcome,
  upsertMisconception,
  deleteMisconception,
  sampleForExpertReview,
  computeAllQuestionStats,
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
  RefreshCw,
  Users,
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
  const location = useLocation();
  const adminFn = useServerFn(isCurrentUserAdmin);
  const roleQ = useQuery({ queryKey: ["me:isAdmin"], queryFn: () => adminFn() });
  const [tab, setTab] = useState<Tab>("pipeline");

  if (roleQ.isLoading)
    return <div className="p-8 text-center text-sm text-muted-foreground">جارٍ التحقق...</div>;
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

  if (location.pathname !== "/admin/diagnostic") return <Outlet />;

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-border bg-card">
        <div className="container-page py-4">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
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
            {(
              [
                ["pipeline", "خط الأنابيب", Network],
                ["skills", "المهارات والنواتج", BookOpen],
                ["questions", "بنك الأسئلة", ClipboardCheck],
                ["sessions", "الجلسات", Play],
                ["analytics", "تحليل الأسئلة", BarChart3],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                  tab === id
                    ? "bg-ink text-parchment"
                    : "text-muted-foreground hover:bg-secondary/50"
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
                  <p className="text-[11px] text-muted-foreground" dir="ltr">
                    {s.en}
                  </p>
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
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["diag:skills"] });

  const upsertTopicFn = useServerFn(upsertTopic);
  const deleteTopicFn = useServerFn(deleteTopic);
  const upsertSkillFn = useServerFn(upsertSkill);
  const deleteSkillFn = useServerFn(deleteSkill);
  const upsertOutcomeFn = useServerFn(upsertOutcome);
  const deleteOutcomeFn = useServerFn(deleteOutcome);
  const upsertMiscFn = useServerFn(upsertMisconception);
  const deleteMiscFn = useServerFn(deleteMisconception);

  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [skillFormFor, setSkillFormFor] = useState<string | null>(null); // topic_id
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  if (q.isLoading) return <div className="text-sm text-muted-foreground">جارٍ التحميل...</div>;
  if (q.error) return <div className="text-sm text-destructive">{(q.error as Error).message}</div>;

  const { topics = [], skills = [], outcomes = [], misconceptions = [] } = q.data ?? {};

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setNewTopicOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-2 text-sm text-parchment"
        >
          <Plus className="h-4 w-4" /> موضوع جديد (Knowledge Graph)
        </button>
      </div>

      {newTopicOpen && (
        <TopicForm
          onCancel={() => setNewTopicOpen(false)}
          onSaved={async () => {
            setNewTopicOpen(false);
            await invalidate();
          }}
          upsertFn={upsertTopicFn}
          sortOrder={topics.length}
        />
      )}

      {topics.map((t: any) => {
        const topicSkills = skills.filter((s: any) => s.topic_id === t.id);
        return (
          <div key={t.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="font-display text-lg font-bold">{t.name_ar}</h3>
                <span className="font-mono text-xs text-muted-foreground">{t.code}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSkillFormFor(skillFormFor === t.id ? null : t.id)}
                  className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-secondary/50"
                >
                  <Plus className="h-3 w-3" /> مهارة (Skill Graph)
                </button>
                <button
                  onClick={async () => {
                    if (confirm("حذف الموضوع وكل مهاراته؟")) {
                      await deleteTopicFn({ data: { id: t.id } });
                      invalidate();
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded border border-red-300 px-2 py-1 text-xs text-red-900 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>

            {skillFormFor === t.id && (
              <div className="mt-3">
                <SkillForm
                  topicId={t.id}
                  onCancel={() => setSkillFormFor(null)}
                  onSaved={async () => {
                    setSkillFormFor(null);
                    await invalidate();
                  }}
                  upsertFn={upsertSkillFn}
                />
              </div>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {topicSkills.map((s: any) => {
                const skOutcomes = outcomes.filter((o: any) => o.skill_id === s.id);
                const skMisc = misconceptions.filter((m: any) => m.skill_id === s.id);
                const open = expandedSkill === s.id;
                return (
                  <div key={s.id} className="rounded-lg border border-border bg-parchment p-4">
                    <div className="flex items-center justify-between">
                      <button
                        className="text-start"
                        onClick={() => setExpandedSkill(open ? null : s.id)}
                      >
                        <p className="font-medium">{s.name_ar}</p>
                      </button>
                      <div className="flex items-center gap-1">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                          {s.bloom}
                        </span>
                        <button
                          onClick={async () => {
                            if (confirm("حذف المهارة؟")) {
                              await deleteSkillFn({ data: { id: s.id } });
                              invalidate();
                            }
                          }}
                          className="text-red-700 hover:text-red-900"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{s.description_ar}</p>

                    {skOutcomes.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                          نواتج التعلم
                        </p>
                        <ul className="mt-1 space-y-0.5 text-xs">
                          {skOutcomes.map((o: any) => (
                            <li key={o.id} className="flex items-center justify-between gap-2">
                              <span className="list-disc">• {o.statement_ar}</span>
                              <button
                                onClick={async () => {
                                  await deleteOutcomeFn({ data: { id: o.id } });
                                  invalidate();
                                }}
                                className="text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {skMisc.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                          أخطاء شائعة وفرضيات التشخيص
                        </p>
                        <ul className="mt-1 space-y-1 text-xs">
                          {skMisc.map((m: any) => (
                            <li key={m.id} className="rounded bg-amber-100/60 px-2 py-1">
                              <div className="flex items-center justify-between gap-2">
                                <span>
                                  <span className="font-mono text-[10px]">{m.code}</span> —{" "}
                                  {m.description_ar}
                                </span>
                                <button
                                  onClick={async () => {
                                    await deleteMiscFn({ data: { id: m.id } });
                                    invalidate();
                                  }}
                                  className="text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              {m.hypothesis_ar && (
                                <p className="mt-0.5 text-[11px] italic text-amber-900">
                                  فرضية: {m.hypothesis_ar}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {open && (
                      <div className="mt-3 space-y-3 border-t border-border pt-3">
                        <OutcomeForm
                          skillId={s.id}
                          upsertFn={upsertOutcomeFn}
                          onSaved={invalidate}
                        />
                        <MisconceptionForm
                          skillId={s.id}
                          upsertFn={upsertMiscFn}
                          onSaved={invalidate}
                        />
                      </div>
                    )}
                    <button
                      onClick={() => setExpandedSkill(open ? null : s.id)}
                      className="mt-2 text-[11px] text-brand hover:underline"
                    >
                      {open ? "إغلاق" : "+ إضافة ناتج تعلم / خطأ شائع"}
                    </button>
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
      {topics.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          لا توجد مواضيع بعد — أضف أول موضوع من الأعلى.
        </p>
      )}
    </div>
  );
}

function TopicForm({ onCancel, onSaved, upsertFn, sortOrder }: any) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    setErr(null);
    setSaving(true);
    try {
      await upsertFn({
        data: { code, name_ar: name, grade: "1AM", kind: "unit", sort_order: sortOrder },
      });
      onSaved();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="rounded-2xl border-2 border-brand/40 bg-card p-4 space-y-2">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="code (مثال: fractions)"
          className="w-40 rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم الموضوع بالعربية"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border border-border px-3 py-1.5 text-sm">
          إلغاء
        </button>
        <button
          onClick={submit}
          disabled={saving || !code || !name}
          className="rounded-lg bg-ink px-3 py-1.5 text-sm text-parchment disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>
    </div>
  );
}

function SkillForm({ topicId, onCancel, onSaved, upsertFn }: any) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [bloom, setBloom] = useState("Apply");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    setErr(null);
    setSaving(true);
    try {
      await upsertFn({
        data: {
          topic_id: topicId,
          code,
          name_ar: name,
          description_ar: desc,
          bloom,
          prerequisites: [],
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
    <div className="rounded-lg border-2 border-brand/40 bg-parchment p-3 space-y-2">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="SK.CODE"
          className="w-32 rounded-lg border border-input bg-background px-2 py-1.5 text-xs font-mono"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم المهارة"
          className="flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
        />
        <select
          value={bloom}
          onChange={(e) => setBloom(e.target.value)}
          className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
        >
          {["Remember", "Understand", "Apply", "Analyze", "Evaluate"].map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </div>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="وصف مختصر"
        rows={2}
        className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
      />
      {err && <p className="text-xs text-destructive">{err}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border border-border px-2 py-1 text-xs">
          إلغاء
        </button>
        <button
          onClick={submit}
          disabled={saving || !code || !name}
          className="rounded-lg bg-ink px-2 py-1 text-xs text-parchment disabled:opacity-50"
        >
          {saving ? "..." : "حفظ"}
        </button>
      </div>
    </div>
  );
}

function OutcomeForm({ skillId, upsertFn, onSaved }: any) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await upsertFn({
        data: { skill_id: skillId, statement_ar: text, level: "core", sort_order: 0 },
      });
      setText("");
      onSaved();
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="ناتج تعلم جديد (مرحلة 5)"
        className="flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
      />
      <button
        onClick={submit}
        disabled={saving}
        className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-secondary/50"
      >
        إضافة
      </button>
    </div>
  );
}

function MisconceptionForm({ skillId, upsertFn, onSaved }: any) {
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [hyp, setHyp] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!code.trim() || !desc.trim()) return;
    setSaving(true);
    try {
      await upsertFn({
        data: { skill_id: skillId, code, description_ar: desc, hypothesis_ar: hyp || null },
      });
      setCode("");
      setDesc("");
      setHyp("");
      onSaved();
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-1.5 rounded bg-amber-50/60 p-2">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
        خطأ شائع جديد + فرضية التشخيص (مرحلة 6-7)
      </p>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="code"
          className="w-28 rounded-lg border border-input bg-background px-2 py-1.5 text-xs font-mono"
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="وصف الخطأ الشائع"
          className="flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
        />
      </div>
      <input
        value={hyp}
        onChange={(e) => setHyp(e.target.value)}
        placeholder="فرضية التشخيص (لماذا يحدث هذا الخطأ)"
        className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
      />
      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={saving}
          className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-secondary/50"
        >
          إضافة
        </button>
      </div>
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
  const sampleFn = useServerFn(sampleForExpertReview);
  const qc = useQueryClient();

  const qList = useQuery({ queryKey: ["diag:questions"], queryFn: () => listFn() });
  const qSkills = useQuery({ queryKey: ["diag:skills"], queryFn: () => skillsFn() });
  const [filter, setFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showNew, setShowNew] = useState(false);
  const [showSample, setShowSample] = useState(false);

  const rows = useMemo(() => {
    let r: any[] = qList.data ?? [];
    if (statusFilter) r = r.filter((x) => x.status === statusFilter);
    if (filter) {
      const s = filter.toLowerCase();
      r = r.filter(
        (x) => x.prompt_ar?.toLowerCase().includes(s) || x.skills?.name_ar?.includes(filter),
      );
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
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowSample((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm text-indigo-900"
          title="مرحلة 12: مراجعة عينة من الأسئلة المولّدة بالذكاء الاصطناعي"
        >
          <Users className="h-4 w-4" /> عيّنة مراجعة الخبير
        </button>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-2 text-sm text-parchment"
        >
          <Plus className="h-4 w-4" /> سؤال جديد
        </button>
      </div>

      {showSample && (
        <ExpertSampleBox
          sampleFn={sampleFn}
          reviewFn={reviewFn}
          onChanged={async () => qc.invalidateQueries({ queryKey: ["diag:questions"] })}
        />
      )}

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
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_TONE[q.status]}`}
                        >
                          {STATUS_LABEL[q.status]}
                        </span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                          {q.kind}
                        </span>
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
                            استُخدم {q.times_used}× · نسبة النجاح{" "}
                            {Math.round((q.times_correct / q.times_used) * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-medium">{q.prompt_ar}</p>
                      <ol className="mt-1 text-sm text-muted-foreground space-y-0.5">
                        {options.map((o, i) => (
                          <li
                            key={i}
                            className={i === q.correct_index ? "text-emerald-700 font-medium" : ""}
                          >
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

function ExpertSampleBox({ sampleFn, reviewFn, onChanged }: any) {
  const [sample, setSample] = useState<any[] | null>(null);
  const [poolSize, setPoolSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(10);

  const pull = async () => {
    setLoading(true);
    try {
      const res = await sampleFn({ data: { count } });
      setSample(res.sample ?? []);
      setPoolSize(res.pool_size ?? 0);
    } finally {
      setLoading(false);
    }
  };

  const decide = async (id: string, verdict: "approve" | "reject" | "revise") => {
    await reviewFn({ data: { question_id: id, verdict, notes: "", review_type: "expert_sample" } });
    setSample((s) => (s ?? []).filter((q) => q.id !== id));
    onChanged();
  };

  return (
    <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-indigo-900">
          مرحلة 12 — عيّنة مراجعة الخبير من الأسئلة المولّدة آليًا
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 10)}
            className="w-16 rounded border border-input bg-background px-2 py-1 text-xs"
          />
          <button
            onClick={pull}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            <RefreshCw className="h-3 w-3" /> {loading ? "جارٍ السحب..." : "سحب عيّنة جديدة"}
          </button>
        </div>
      </div>
      {sample == null ? (
        <p className="text-xs text-indigo-900/70">
          يسحب عينة عشوائية من الأسئلة بحالة "فحص آلي ✓" لم تُسحب من قبل، ليراجعها خبير بدل مراجعة
          كل سؤال آليًا.
        </p>
      ) : sample.length === 0 ? (
        <p className="text-xs text-indigo-900/70">
          لا يوجد المزيد من العيّنة الحالية (كان الرصيد المتاح {poolSize} سؤال).
        </p>
      ) : (
        <ul className="space-y-2">
          {sample.map((q: any) => (
            <li key={q.id} className="rounded-lg bg-card border border-border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{q.skills?.name_ar}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => decide(q.id, "approve")}
                    className="rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-900"
                  >
                    <Check className="inline h-3 w-3" /> اعتماد خبير
                  </button>
                  <button
                    onClick={() => decide(q.id, "revise")}
                    className="rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-900"
                  >
                    مراجعة
                  </button>
                  <button
                    onClick={() => decide(q.id, "reject")}
                    className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-[11px] text-red-900"
                  >
                    <XIcon className="inline h-3 w-3" /> رفض
                  </button>
                </div>
              </div>
              <p className="mt-1">{q.prompt_ar}</p>
            </li>
          ))}
        </ul>
      )}
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
          <option key={s.id} value={s.id}>
            {s.name_ar} ({s.code})
          </option>
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
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      s.status === "completed"
                        ? "bg-emerald-100 text-emerald-900"
                        : s.status === "running"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-secondary"
                    }`}
                  >
                    {s.status}
                  </span>
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
  const recomputeFn = useServerFn(computeAllQuestionStats);
  const q = useQuery({ queryKey: ["diag:analytics"], queryFn: () => fn() });
  const qc = useQueryClient();
  const [recomputing, setRecomputing] = useState(false);

  if (q.isLoading) return <div className="text-sm text-muted-foreground">جارٍ التحميل...</div>;
  const rows: any[] = q.data ?? [];

  const recompute = async () => {
    setRecomputing(true);
    try {
      await recomputeFn({});
      await qc.invalidateQueries({ queryKey: ["diag:analytics"] });
    } finally {
      setRecomputing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={recompute}
          disabled={recomputing}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary/50 disabled:opacity-50"
        >
          <RefreshCw className="h-3 w-3" />{" "}
          {recomputing ? "جارٍ الاحتساب..." : "إعادة احتساب p-value والتمييز"}
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs">
            <tr>
              <th className="p-3 text-start">السؤال</th>
              <th className="p-3 text-start">المهارة</th>
              <th className="p-3 text-start">الاستخدام</th>
              <th className="p-3 text-start">p-value</th>
              <th className="p-3 text-start">مؤشر التمييز</th>
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
                    <span
                      className={
                        r.p_value < 0.3 || r.p_value > 0.9 ? "text-amber-700" : "text-emerald-700"
                      }
                    >
                      {(r.p_value * 100).toFixed(0)}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 text-xs">
                  {r.discrimination != null ? (
                    <span
                      className={
                        r.discrimination < 0.2 ? "text-red-700 font-medium" : "text-emerald-700"
                      }
                    >
                      {r.discrimination.toFixed(2)}
                    </span>
                  ) : (
                    "—"
                  )}
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
        <div className="border-t border-border bg-parchment p-3 text-[11px] text-muted-foreground space-y-1">
          <p>p-value خارج المجال [30% – 90%] يشير إلى سؤال سهل جدًا أو صعب جدًا.</p>
          <p>
            مؤشر تمييز أقل من 0.20 يعني أن السؤال لا يفرّق جيدًا بين المتمكّنين وغيرهم — كلاهما
            يستحق التحسين أو الاستبعاد (المرحلة ١٧).
          </p>
        </div>
      </div>
    </div>
  );
}
