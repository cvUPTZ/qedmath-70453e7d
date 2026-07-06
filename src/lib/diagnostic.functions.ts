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
  status: z.enum(["draft", "ai_generated", "ai_reviewed", "expert_reviewed", "approved", "retired"]).default("draft"),
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
    const { data: created, error } = await context.supabase.from("questions").insert(row).select("id").single();
    if (error) throw new Error(error.message);
    return { id: created.id as string };
  });


export const reviewQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      question_id: z.string().uuid(),
      verdict: z.enum(["approve", "reject", "revise"]),
      notes: z.string().max(2000).optional().default(""),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("question_reviews").insert({
      question_id: data.question_id,
      reviewer_id: context.userId,
      verdict: data.verdict,
      notes: data.notes,
    });
    const nextStatus =
      data.verdict === "approve" ? "approved" : data.verdict === "reject" ? "retired" : "draft";
    const { error } = await context.supabase
      .from("questions")
      .update({ status: nextStatus })
      .eq("id", data.question_id);
    if (error) throw new Error(error.message);
    return { status: nextStatus };
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
    z.object({ gold_id: z.string().uuid(), count: z.number().int().min(1).max(5).default(3) }).parse(d),
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
      .from("questions").select("*").eq("id", data.question_id).single();
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
الإجابة الصحيحة المُعلَنة: ${q.options[q.correct_index]}
أعِد تقييمًا JSON: هل الصياغة العربية سليمة؟ هل الإجابة المُعلَنة صحيحة رياضيًا؟ هل البدائل مقنعة (تعكس أخطاء شائعة)؟ ثم درجة من 0 إلى 10 وملاحظات.`,
      });
      const status = output.overall_score >= 7 && output.answer_valid ? "ai_reviewed" : "draft";
      await context.supabase
        .from("questions")
        .update({ status, ai_meta: { ...(q.ai_meta ?? {}), quality: output } })
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
    z.object({
      skill_id: z.string().uuid().optional().nullable(),
      student_label: z.string().max(120).optional().nullable(),
    }).parse(d),
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
    z.object({
      session_id: z.string().uuid(),
      question_id: z.string().uuid().optional().nullable(),
      is_probe: z.boolean().default(false),
      probe_node_id: z.string().max(60).optional().nullable(),
      chosen_index: z.number().int().min(0).max(10),
      is_correct: z.boolean(),
      ms_elapsed: z.number().int().min(0).max(60 * 60 * 1000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("session_answers").insert(data);
    if (data.question_id && !data.is_probe) {
      await context.supabase.rpc; // no-op placeholder
      const { data: q } = await context.supabase
        .from("questions").select("times_used, times_correct").eq("id", data.question_id).single();
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
    z.object({
      session_id: z.string().uuid(),
      trail: z.array(z.any()),
      evidence: z.array(z.any()),
    }).parse(d),
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
      .from("diagnostic_sessions").select("*, skills(name_ar, code)").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const { data: answers } = await context.supabase
      .from("session_answers").select("*").eq("session_id", data.id).order("created_at");
    return { session, answers: answers ?? [] };
  });

// ============ Analytics ============

export const questionAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("questions")
      .select("id, prompt_ar, kind, status, times_used, times_correct, skill_id, skills(code, name_ar)")
      .order("times_used", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []).map((q: any) => ({
      ...q,
      p_value: q.times_used > 0 ? q.times_correct / q.times_used : null,
    }));
  });
