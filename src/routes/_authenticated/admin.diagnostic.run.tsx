import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { isCurrentUserAdmin } from "@/lib/applications.functions";
import {
  listTopicsAndSkills,
  startSession,
  recordAnswer,
  finishSession,
} from "@/lib/diagnostic.functions";
import { ArrowRight, Play, ShieldAlert } from "lucide-react";
import { DiagnosticGraph } from "@/components/DiagnosticGraph";

export const Route = createFileRoute("/_authenticated/admin/diagnostic/run")({
  component: RunPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-destructive">{error.message}</div>
  ),
});

type Question = {
  id: string;
  prompt_ar: string;
  options: string[];
  correct_index: number;
  probe_key: string | null;
  probe_tree: any;
  skill_id?: string | null;
  skills?: { name_ar: string };
};

type TrailStep = {
  id: string;
  label: string;
  topic: string;
  correct: boolean;
  probe?: boolean;
  probeTag?: string | null;
};

type Evidence = {
  fromQuestion: string;
  topic: string;
  precise: boolean;
  skillLabel: string;
  note: string;
};

function RunPage() {
  const adminFn = useServerFn(isCurrentUserAdmin);
  const roleQ = useQuery({ queryKey: ["me:isAdmin"], queryFn: () => adminFn() });
  const skillsFn = useServerFn(listTopicsAndSkills);
  const skillsQ = useQuery({ queryKey: ["diag:skills"], queryFn: () => skillsFn() });

  const [phase, setPhase] = useState<"setup" | "running" | "done">("setup");
  const [skillId, setSkillId] = useState<string>("");
  const [label, setLabel] = useState<string>("");
  const [session, setSession] = useState<{ id: string; questions: Question[] } | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const startFn = useServerFn(startSession);

  if (roleQ.isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">جارٍ التحقق...</div>;
  if (!roleQ.data?.isAdmin) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
      </div>
    );
  }

  const skills = skillsQ.data?.skills ?? [];

  const begin = async () => {
    setStartError(null);
    setStarting(true);
    try {
      const res = await startFn({ data: { skill_id: skillId || null, student_label: label || null } });
      if (!res.questions || res.questions.length === 0) {
        setStartError("لا توجد أسئلة معتمدة لهذه المهارة بعد. جرّب إزالة اختيار المهارة.");
        return;
      }
      setSession({ id: res.session_id, questions: res.questions as any });
      setPhase("running");
    } catch (e: any) {
      console.error("startSession failed", e);
      setStartError(e?.message ?? String(e));
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-border bg-card">
        <div className="container-page py-4">
          <Link to="/admin/diagnostic" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-3 w-3" /> عودة للوحة التشخيص
          </Link>
          <h1 className="mt-1 font-display text-xl font-bold">جلسة تشخيص</h1>
        </div>
      </header>

      <main className="container-page py-6">
        {phase === "setup" && (
          <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6">
            <div>
              <label className="mb-1 block text-sm font-medium">المهارة المستهدفة (اختياري)</label>
              <select
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">كل المهارات المعتمدة</option>
                {skills.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name_ar} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">اسم/رمز الطالب (اختياري)</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="مثلاً: تلميذ 3 - قسم أ"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={begin}
              disabled={starting}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm text-parchment disabled:opacity-60"
            >
              <Play className="h-4 w-4" /> {starting ? "جارٍ البدء..." : "ابدأ الجلسة"}
            </button>
            {startError && (
              <p className="mt-2 rounded border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                {startError}
              </p>
            )}
          </div>
        )}

        {phase === "running" && session && (
          <SessionRunner
            session={session}
            onDone={() => setPhase("done")}
            topics={skillsQ.data?.topics ?? []}
            skills={skillsQ.data?.skills ?? []}
            misconceptions={skillsQ.data?.misconceptions ?? []}
          />

        )}

        {phase === "done" && session && (
          <div className="mx-auto max-w-lg rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-center space-y-3">
            <h2 className="font-display text-xl font-bold">اكتملت الجلسة</h2>
            <Link
              to="/admin/diagnostic/session/$id"
              params={{ id: session.id }}
              className="inline-block rounded-lg bg-ink px-4 py-2 text-sm text-parchment"
            >
              عرض التقرير
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function SessionRunner({
  session,
  onDone,
  topics,
  skills,
  misconceptions,
}: {
  session: { id: string; questions: Question[] };
  onDone: () => void;
  topics: any[];
  skills: any[];
  misconceptions: any[];
}) {
  const [mainIdx, setMainIdx] = useState(0);
  const [trail, setTrail] = useState<TrailStep[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [current, setCurrent] = useState<{ kind: "main" | "probe"; probeNode?: any; origin?: Question }>({ kind: "main" });
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [locked, setLocked] = useState(false);
  const startedAt = useRef(Date.now());

  const recordFn = useServerFn(recordAnswer);
  const finishFn = useServerFn(finishSession);
  const navigate = useNavigate();

  const q = session.questions[mainIdx];
  useEffect(() => {
    startedAt.current = Date.now();
    setLocked(false);
    setFeedback(null);
  }, [mainIdx, current.kind, current.probeNode?.id]);

  const shuffled = useMemo(() => {
    const items = (current.kind === "probe" ? current.probeNode : q)?.options?.map((label: string, i: number) => ({
      label,
      isCorrect: i === (current.kind === "probe" ? current.probeNode.correct : q.correct_index),
    })) ?? [];
    // simple fisher-yates
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainIdx, current.kind, current.probeNode?.id]);

  const advanceMain = async (finalEvidence: Evidence[], finalTrail: TrailStep[]) => {
    const next = mainIdx + 1;
    if (next >= session.questions.length) {
      await finishFn({ data: { session_id: session.id, trail: finalTrail, evidence: finalEvidence } });
      onDone();
      return;
    }
    setMainIdx(next);
    setCurrent({ kind: "main" });
  };

  const pickMain = async (isCorrect: boolean, chosenIdx: number) => {
    if (locked) return;
    setLocked(true);
    const ms = Date.now() - startedAt.current;
    const step: TrailStep = { id: q.id, label: q.prompt_ar.slice(0, 40), topic: q.skills?.name_ar ?? "", correct: isCorrect };
    const newTrail = [...trail, step];
    setTrail(newTrail);
    setFeedback({ text: isCorrect ? "إجابة صحيحة" : "غير صحيحة", ok: isCorrect });

    await recordFn({
      data: {
        session_id: session.id,
        question_id: q.id,
        is_probe: false,
        probe_node_id: null,
        chosen_index: chosenIdx,
        is_correct: isCorrect,
        ms_elapsed: ms,
      },
    });

    if (isCorrect) {
      setTimeout(() => advanceMain(evidence, newTrail), 600);
      return;
    }

    // enter probe if defined
    if (q.probe_tree) {
      setTimeout(() => setCurrent({ kind: "probe", probeNode: q.probe_tree, origin: q }), 700);
    } else {
      const ev: Evidence = {
        fromQuestion: q.id,
        topic: q.skills?.name_ar ?? "",
        precise: false,
        skillLabel: q.skills?.name_ar ?? "",
        note: "لا توجد شجرة probe مربوطة — تم تسجيل ثغرة عامة.",
      };
      const newEv = [...evidence, ev];
      setEvidence(newEv);
      setTimeout(() => advanceMain(newEv, newTrail), 700);
    }
  };

  const pickProbe = async (isCorrect: boolean, chosenIdx: number) => {
    if (locked) return;
    setLocked(true);
    const ms = Date.now() - startedAt.current;
    const node = current.probeNode;
    const origin = current.origin!;
    const step: TrailStep = {
      id: node.id,
      label: node.prompt.slice(0, 40),
      topic: origin.skills?.name_ar ?? "",
      correct: isCorrect,
      probe: true,
      probeTag: origin.probe_key,
    };
    const newTrail = [...trail, step];
    setTrail(newTrail);
    setFeedback({ text: isCorrect ? "صحيح — نستبعد هذه الفرضية" : "لا يزال هناك التباس — نتعمّق أكثر", ok: isCorrect });

    await recordFn({
      data: {
        session_id: session.id,
        question_id: origin.id,
        is_probe: true,
        probe_node_id: node.id,
        chosen_index: chosenIdx,
        is_correct: isCorrect,
        ms_elapsed: ms,
      },
    });

    if (isCorrect) {
      const ev: Evidence = {
        fromQuestion: origin.id,
        topic: origin.skills?.name_ar ?? "",
        precise: false,
        skillLabel: `تم استبعاد عند ${node.id}`,
        note: node.onCorrect?.ruledOut ?? "",
      };
      const newEv = [...evidence, ev];
      setEvidence(newEv);
      setTimeout(() => advanceMain(newEv, newTrail), 700);
      return;
    }

    // incorrect: go deeper or finalize
    if (node.onIncorrect?.node) {
      setTimeout(() => setCurrent({ kind: "probe", probeNode: node.onIncorrect.node, origin }), 800);
    } else {
      const ev: Evidence = {
        fromQuestion: origin.id,
        topic: origin.skills?.name_ar ?? "",
        precise: true,
        skillLabel: node.onIncorrect?.skillLabel ?? "مفهوم خاطئ محدد",
        note: node.onIncorrect?.note ?? "",
      };
      const newEv = [...evidence, ev];
      setEvidence(newEv);
      setTimeout(() => advanceMain(newEv, newTrail), 800);
    }
  };

  const isProbe = current.kind === "probe";
  const prompt = isProbe ? current.probeNode.prompt : q.prompt_ar;
  const nodeId = isProbe ? current.probeNode.id : `Q${mainIdx + 1}`;

  // Compute highlight sets for the graph
  const activeSkillId = (isProbe ? current.origin?.skill_id : q.skill_id) ?? null;
  const trailByName = new Map<string, { correct: boolean }[]>();
  for (const t of trail) {
    if (!t.topic) continue;
    const arr = trailByName.get(t.topic) ?? [];
    arr.push({ correct: t.correct });
    trailByName.set(t.topic, arr);
  }
  const nameToSkill = new Map<string, string>();
  for (const s of skills) nameToSkill.set(s.name_ar, s.id);
  const visitedSkillIds: string[] = [];
  const correctSkillIds: string[] = [];
  const wrongSkillIds: string[] = [];
  for (const [name, arr] of trailByName) {
    const sid = nameToSkill.get(name);
    if (!sid) continue;
    visitedSkillIds.push(sid);
    if (arr.every((a) => a.correct)) correctSkillIds.push(sid);
    else if (arr.some((a) => !a.correct)) wrongSkillIds.push(sid);
  }
  const activeMisconceptionIds: string[] = [];
  if (isProbe && activeSkillId) {
    for (const m of misconceptions) {
      if (m.skill_id === activeSkillId) activeMisconceptionIds.push(m.id);
    }
  }
  for (const ev of evidence) {
    if (!ev.precise) continue;
    const sid = nameToSkill.get(ev.topic);
    if (!sid) continue;
    for (const m of misconceptions) {
      if (m.skill_id === sid) activeMisconceptionIds.push(m.id);
    }
  }

  return (
    <div className="space-y-4">
      <DiagnosticGraph
        topics={topics}
        skills={skills}
        misconceptions={misconceptions}
        activeSkillId={activeSkillId}
        visitedSkillIds={visitedSkillIds}
        correctSkillIds={correctSkillIds}
        wrongSkillIds={wrongSkillIds}
        activeMisconceptionIds={activeMisconceptionIds}
        probeActive={isProbe}
      />
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">

      {/* Trail */}
      <aside className="md:sticky md:top-6 self-start">
        <h2 className="font-display text-sm font-bold">مسار التشخيص</h2>
        <p className="text-[10px] text-muted-foreground mb-3">الأصفر = probe جذري</p>
        <div className="space-y-2 border-r-2 border-border pr-3">
          {trail.map((t, i) => (
            <div key={i} className={`text-xs ${t.probe ? "mr-3 border-r-2 border-dashed border-amber-400 pr-3" : ""}`}>
              <div className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${
                  t.probe ? "bg-amber-400" : t.correct ? "bg-emerald-600" : "bg-red-500"
                }`} />
                <span className="font-mono text-[10px]">{t.id.slice(0, 8)}</span>
                {t.probeTag && (
                  <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] text-amber-900">{t.probeTag}</span>
                )}
              </div>
              <p className="mt-0.5 text-muted-foreground truncate">{t.label}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        {isProbe && (
          <div className="mb-4 flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-900">لنستوضح نقطة صغيرة قبل المتابعة</p>
              <p className="text-[10px] text-amber-800" dir="ltr">Root-cause probe · {current.origin?.probe_key}</p>
            </div>
          </div>
        )}

        <div className="mb-4 flex justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
          <span className={isProbe ? "text-amber-700" : "text-brand"}>{nodeId}</span>
          <span>{q.skills?.name_ar ?? ""}</span>
        </div>

        <p className="mb-6 font-display text-xl">{prompt}</p>

        <div className="space-y-2">
          {shuffled.map((it, i) => (
            <button
              key={i}
              disabled={locked}
              onClick={() => (isProbe ? pickProbe(it.isCorrect, i) : pickMain(it.isCorrect, i))}
              className={`flex w-full items-center gap-3 rounded border border-border bg-parchment px-4 py-3 text-right hover:border-ink disabled:opacity-70 disabled:hover:border-border ${
                locked && it.isCorrect ? "border-emerald-500 bg-emerald-50" : ""
              }`}
            >
              <span className="font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + i)}</span>
              <span className="flex-1">{it.label}</span>
            </button>
          ))}
        </div>

        {feedback && (
          <p className={`mt-4 text-sm ${feedback.ok ? "text-emerald-700" : "text-red-700"}`}>
            {feedback.text}
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
