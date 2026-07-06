import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// ============ Topics / Skills ============

export const listTopicsAndSkills = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [topics, skills, outcomes, misc] = await Promise.all([
      context.supabase.from("curriculum_topics").select("*").order("sort_order"),
      context.supabase.from("skills").select("*").order("code"),
      context.supabase.from("learning_outcomes").select("*"),
      context.supabase.from("misconceptions").select("*"),
    ]);
    if (topics.error) throw new Error(topics.error.message);
    if (skills.error) throw new Error(skills.error.message);
    return {
      topics: topics.data ?? [],
      skills: skills.data ?? [],
      outcomes: outcomes.data ?? [],
      misconceptions: misc.data ?? [],
    };
  });

// ============ Curriculum CRUD (stages 1-4: knowledge graph / skill graph) ============

const TopicInput = z.object({
  id: z.string().uuid().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  code: z.string().min(1).max(80),
  name_ar: z.string().min(1).max(200),
  grade: z.string().max(20).default("1AM"),
  kind: z.string().max(30).default("topic"),
  source_ref: z.string().max(300).optional().nullable(),
  sort_order: z.number().int().default(0),
});

export const upsertTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TopicInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    if (id) {
      const { error } = await context.supabase.from("curriculum_topics").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await context.supabase
      .from("curriculum_topics")
      .insert(rest)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id as string };
  });

export const deleteTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("curriculum_topics").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SkillInput = z.object({
  id: z.string().uuid().optional().nullable(),
  topic_id: z.string().uuid().optional().nullable(),
  code: z.string().min(1).max(80),
  name_ar: z.string().min(1).max(200),
  description_ar: z.string().max(1000).optional().nullable(),
  bloom: z.string().max(30).default("Apply"),
  prerequisites: z.array(z.string().uuid()).default([]),
});

export const upsertSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SkillInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    if (id) {
      const { error } = await context.supabase.from("skills").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await context.supabase
      .from("skills")
      .insert(rest)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id as string };
  });

export const deleteSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("skills").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// stage 5: learning outcomes
const OutcomeInput = z.object({
  id: z.string().uuid().optional().nullable(),
  skill_id: z.string().uuid(),
  statement_ar: z.string().min(3).max(500),
  level: z.string().max(30).default("core"),
  sort_order: z.number().int().default(0),
});

export const upsertOutcome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => OutcomeInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    if (id) {
      const { error } = await context.supabase.from("learning_outcomes").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await context.supabase
      .from("learning_outcomes")
      .insert(rest)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id as string };
  });

export const deleteOutcome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("learning_outcomes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// stage 6+7: misconceptions carry both the common-error description (6)
// and the diagnostic hypothesis behind it (7, hypothesis_ar)
const MisconceptionInput = z.object({
  id: z.string().uuid().optional().nullable(),
  skill_id: z.string().uuid(),
  code: z.string().min(1).max(80),
  description_ar: z.string().min(3).max(500),
  hypothesis_ar: z.string().max(1000).optional().nullable(),
});

export const upsertMisconception = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MisconceptionInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    if (id) {
      const { error } = await context.supabase.from("misconceptions").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await context.supabase
      .from("misconceptions")
      .insert(rest)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id as string };
  });

export const deleteMisconception = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("misconceptions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ Questions ============

export const listQuestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("questions")
      .select("*, skills(code, name_ar)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const QuestionInput = z.object({
  id: z.string().uuid().optional().nullable(),
  skill_id: z.string().uuid(),
  kind: z.enum(["gold", "ai", "probe"]).default("gold"),
  status: z
    .enum(["draft", "ai_generated", "ai_reviewed", "expert_reviewed", "approved", "retired"])
    .default("draft"),
  bloom: z.string().default("Apply"),
  prompt_ar: z.string().min(3).max(2000),
  options: z.array(z.string().min(1).max(500)).min(2).max(6),
  correct_index: z.number().int().min(0),
  probe_key: z.string().max(50).optional().nullable(),
});

export const upsertQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => QuestionInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const row: any = { ...rest, options: rest.options };
    if (id) {
      const { error } = await context.supabase.from("questions").update(row).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await context.supabase
      .from("questions")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id as string };
  });

export const reviewQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        question_id: z.string().uuid(),
        verdict: z.enum(["approve", "reject", "revise"]),
        notes: z.string().max(2000).optional().default(""),
        // gold_review = stage 9 (review & approve gold questions)
        // expert_sample = stage 12 (expert sampling of AI-generated batches)
        review_type: z.enum(["gold_review", "expert_sample"]).default("gold_review"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("question_reviews").insert({
      question_id: data.question_id,
      reviewer_id: context.userId,
      verdict: data.verdict,
      notes: data.notes,
      review_type: data.review_type,
    });
    const nextStatus =
      data.verdict === "approve"
        ? data.review_type === "expert_sample"
          ? "expert_reviewed"
          : "approved"
        : data.verdict === "reject"
          ? "retired"
          : "draft";
    const { error } = await context.supabase
      .from("questions")
      .update({ status: nextStatus })
      .eq("id", data.question_id);
    if (error) throw new Error(error.message);
    return { status: nextStatus };
  });

// stage 12: pull a random sample of AI-generated, ai_reviewed questions that
// have not yet been through expert sampling, so a human only has to look at
// a subset of the machine-generated pool rather than every single item.
export const sampleForExpertReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ count: z.number().int().min(1).max(50).default(10) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: pool, error } = await context.supabase
      .from("questions")
      .select("*, skills(code, name_ar)")
      .eq("kind", "ai")
      .eq("status", "ai_reviewed")
      .eq("sampled_for_expert_review", false)
      .limit(500);
    if (error) throw new Error(error.message);
    const all = pool ?? [];
    // simple reservoir-style shuffle then take N
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, data.count);
    if (chosen.length > 0) {
      await context.supabase
        .from("questions")
        .update({ sampled_for_expert_review: true })
        .in(
          "id",
          chosen.map((q: any) => q.id),
        );
    }
    return { sample: chosen, pool_size: all.length };
  });

export const retireQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("questions").update({ status: "retired" }).eq("id", data.id);
    return { ok: true };
  });

// ============ AI: generate equivalent questions ============

export const generateEquivalentQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ gold_id: z.string().uuid(), count: z.number().int().min(1).max(5).default(3) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: gold, error } = await context.supabase
      .from("questions")
      .select("*, skills(code, name_ar, description_ar)")
      .eq("id", data.gold_id)
      .single();
    if (error) throw new Error(error.message);

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const schema = z.object({
      questions: z.array(
        z.object({
          prompt_ar: z.string(),
          options: z.array(z.string()).length(4),
          correct_index: z.number().int().min(0).max(3),
          rationale_ar: z.string(),
        }),
      ),
    });

    const prompt = `أنت خبير تصميم أسئلة تشخيصية لمنهاج السنة الأولى متوسط في الجزائر.
المهارة المستهدفة: ${gold.skills?.name_ar} — ${gold.skills?.description_ar ?? ""}
السؤال المرجعي (Gold):
"${gold.prompt_ar}"
خياراته: ${JSON.stringify(gold.options)} — الإجابة الصحيحة: ${(gold.options as any[])?.[gold.correct_index]}

المطلوب: ولّد ${data.count} أسئلة **مكافئة** بنفس مستوى الصعوبة ونفس المهارة، لكن بأرقام أو سياق مختلف.
لكل سؤال: صياغة عربية واضحة، أربعة خيارات (واحد صحيح وثلاثة مقنعين يعكسون أخطاء شائعة)، مؤشر الإجابة الصحيحة، وسطر تعليل قصير.
أعِد النتيجة بصيغة JSON صارمة مطابقة للمخطط.`;

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-2.5-flash"),
        output: Output.object({ schema }),
        prompt,
      });
      const inserts = output.questions.map((q) => ({
        skill_id: gold.skill_id,
        kind: "ai" as const,
        status: "ai_generated" as const,
        bloom: gold.bloom,
        prompt_ar: q.prompt_ar,
        options: q.options,
        correct_index: q.correct_index,
        parent_gold_id: gold.id,
        ai_meta: { rationale: q.rationale_ar, model: "google/gemini-2.5-flash" },
      }));
      const { data: created, error: insErr } = await context.supabase
        .from("questions")
        .insert(inserts)
        .select("id");
      if (insErr) throw new Error(insErr.message);
      return { generated: created?.length ?? 0 };
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) {
        throw new Error("فشل التوليد الآلي — أعد المحاولة");
      }
      throw e;
    }
  });

// ============ Auto quality check ============

export const autoQualityCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ question_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: q, error } = await context.supabase
      .from("questions")
      .select("*")
      .eq("id", data.question_id)
      .single();
    if (error) throw new Error(error.message);

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const schema = z.object({
      language_ok: z.boolean(),
      answer_valid: z.boolean(),
      distractors_reasonable: z.boolean(),
      overall_score: z.number().min(0).max(10),
      issues_ar: z.string(),
    });

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-2.5-flash"),
        output: Output.object({ schema }),
        prompt: `افحص جودة هذا السؤال التشخيصي (رياضيات، سنة أولى متوسط):
السؤال: "${q.prompt_ar}"
الخيارات: ${JSON.stringify(q.options)}
الإجابة الصحيحة المُعلَنة: ${(q.options as any[])?.[q.correct_index]}
أعِد تقييمًا JSON: هل الصياغة العربية سليمة؟ هل الإجابة المُعلَنة صحيحة رياضيًا؟ هل البدائل مقنعة (تعكس أخطاء شائعة)؟ ثم درجة من 0 إلى 10 وملاحظات.`,
      });
      const status = output.overall_score >= 7 && output.answer_valid ? "ai_reviewed" : "draft";
      await context.supabase
        .from("questions")
        .update({ status, ai_meta: { ...((q.ai_meta as any) ?? {}), quality: output } })
        .eq("id", q.id);

      return output;
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) throw new Error("فشل الفحص الآلي");
      throw e;
    }
  });

// ============ Sessions ============

export const startSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        skill_id: z.string().uuid().optional().nullable(),
        student_label: z.string().max(120).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // pick approved questions: filter by skill if given, else broad
    const query = context.supabase
      .from("questions")
      .select("*")
      .in("status", ["approved", "expert_reviewed"])
      .eq("kind", "gold");
    if (data.skill_id) query.eq("skill_id", data.skill_id);
    const { data: qs, error } = await query.limit(20);
    if (error) throw new Error(error.message);

    const { data: session, error: sErr } = await context.supabase
      .from("diagnostic_sessions")
      .insert({
        started_by: context.userId,
        target_skill_id: data.skill_id ?? null,
        student_label: data.student_label ?? null,
        trail: [],
        evidence: [],
      })
      .select("id")
      .single();
    if (sErr) throw new Error(sErr.message);

    return { session_id: session.id as string, questions: qs ?? [] };
  });

export const recordAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        session_id: z.string().uuid(),
        question_id: z.string().uuid().optional().nullable(),
        is_probe: z.boolean().default(false),
        probe_node_id: z.string().max(60).optional().nullable(),
        chosen_index: z.number().int().min(0).max(10),
        is_correct: z.boolean(),
        ms_elapsed: z
          .number()
          .int()
          .min(0)
          .max(60 * 60 * 1000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("session_answers").insert(data);
    if (data.question_id && !data.is_probe) {
      await context.supabase.rpc; // no-op placeholder
      const { data: q } = await context.supabase
        .from("questions")
        .select("times_used, times_correct")
        .eq("id", data.question_id)
        .single();
      if (q) {
        await context.supabase
          .from("questions")
          .update({
            times_used: (q.times_used ?? 0) + 1,
            times_correct: (q.times_correct ?? 0) + (data.is_correct ? 1 : 0),
          })
          .eq("id", data.question_id);
      }
    }
    return { ok: true };
  });

export const finishSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        session_id: z.string().uuid(),
        trail: z.array(z.any()),
        evidence: z.array(z.any()),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("diagnostic_sessions")
      .update({
        status: "completed",
        trail: data.trail,
        evidence: data.evidence,
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.session_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("diagnostic_sessions")
      .select("*, skills(name_ar, code)")
      .order("started_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: session, error } = await context.supabase
      .from("diagnostic_sessions")
      .select("*, skills(name_ar, code)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const { data: answers } = await context.supabase
      .from("session_answers")
      .select("*")
      .eq("session_id", data.id)
      .order("created_at");
    return { session, answers: answers ?? [] };
  });

// ============ Analytics ============

// stage 16: p-value + discrimination index for a single question.
// Discrimination = (fraction correct among the top-scoring third of sessions
// that attempted this question) - (fraction correct among the bottom third),
// using each session's overall score on non-probe gold answers as the ranking
// criterion. This is the classic item-discrimination index used to decide
// whether a question actually separates strong from weak students (stage 17).
async function computeStatsForQuestion(supabase: any, questionId: string) {
  const { data: answers, error } = await supabase
    .from("session_answers")
    .select("session_id, is_correct, is_probe")
    .eq("question_id", questionId)
    .eq("is_probe", false);
  if (error) throw new Error(error.message);
  const rows = answers ?? [];
  const nAnswers = rows.length;

  if (nAnswers === 0) {
    await supabase.from("question_stats").upsert({
      question_id: questionId,
      n_answers: 0,
      p_value: null,
      discrimination: null,
      top_group_n: 0,
      bottom_group_n: 0,
      computed_at: new Date().toISOString(),
    });
    return { n_answers: 0, p_value: null, discrimination: null };
  }

  const sessionIds = [...new Set(rows.map((r: any) => r.session_id))] as string[];
  const { data: allAnswers, error: allErr } = await supabase
    .from("session_answers")
    .select("session_id, is_correct")
    .eq("is_probe", false)
    .in("session_id", sessionIds);
  if (allErr) throw new Error(allErr.message);

  const scoreBySession = new Map<string, { correct: number; total: number }>();
  for (const a of allAnswers ?? []) {
    const s = scoreBySession.get(a.session_id) ?? { correct: 0, total: 0 };
    s.total += 1;
    if (a.is_correct) s.correct += 1;
    scoreBySession.set(a.session_id, s);
  }

  const ranked = sessionIds
    .map((sid) => ({
      sid,
      rate: (scoreBySession.get(sid)?.correct ?? 0) / (scoreBySession.get(sid)?.total || 1),
    }))
    .sort((a, b) => b.rate - a.rate);

  const groupSize = Math.max(1, Math.floor(ranked.length * 0.27));
  const topIds = new Set(ranked.slice(0, groupSize).map((r) => r.sid));
  const bottomIds = new Set(ranked.slice(-groupSize).map((r) => r.sid));

  const correctInGroup = (ids: Set<string>) => {
    const inGroup = rows.filter((r: any) => ids.has(r.session_id));
    if (inGroup.length === 0) return null;
    return inGroup.filter((r: any) => r.is_correct).length / inGroup.length;
  };

  const topRate = correctInGroup(topIds);
  const bottomRate = correctInGroup(bottomIds);
  const discrimination = topRate != null && bottomRate != null ? topRate - bottomRate : null;
  const pValue = rows.filter((r: any) => r.is_correct).length / nAnswers;

  await supabase.from("question_stats").upsert({
    question_id: questionId,
    n_answers: nAnswers,
    p_value: pValue,
    discrimination,
    top_group_n: topIds.size,
    bottom_group_n: bottomIds.size,
    computed_at: new Date().toISOString(),
  });

  return { n_answers: nAnswers, p_value: pValue, discrimination };
}

export const computeQuestionStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ question_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    return computeStatsForQuestion(context.supabase, data.question_id);
  });

// convenience: recompute stats for every question that has at least one answer
export const computeAllQuestionStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: qs, error } = await context.supabase
      .from("questions")
      .select("id")
      .gt("times_used", 0);
    if (error) throw new Error(error.message);
    let n = 0;
    for (const q of qs ?? []) {
      await computeStatsForQuestion(context.supabase, q.id);
      n += 1;
    }
    return { recomputed: n };
  });

export const questionAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("questions")
      .select(
        "id, prompt_ar, kind, status, times_used, times_correct, skill_id, skills(code, name_ar)",
      )
      .order("times_used", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    const ids = (data ?? []).map((q: any) => q.id);
    const { data: stats } = ids.length
      ? await context.supabase.from("question_stats").select("*").in("question_id", ids)
      : { data: [] as any[] };
    const statsById = new Map((stats ?? []).map((s: any) => [s.question_id, s]));
    return (data ?? []).map((q: any) => {
      const st = statsById.get(q.id);
      return {
        ...q,
        p_value: st?.p_value ?? (q.times_used > 0 ? q.times_correct / q.times_used : null),
        discrimination: st?.discrimination ?? null,
        stats_computed_at: st?.computed_at ?? null,
      };
    });
  });
