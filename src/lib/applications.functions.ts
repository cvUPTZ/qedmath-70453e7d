import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ Public: submit application ============

const ApplicationSchema = z.object({
  full_name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(6).max(40),
  wilaya: z.string().trim().min(2).max(80),
  workplace: z.string().trim().min(2).max(300),
  institution_type: z.enum(["public", "private", "freelance"]),
  years_experience: z.number().int().min(0).max(80),
  levels_taught: z.array(z.string()).min(1),
  subjects: z.string().trim().min(2).max(500),
  designed_official_exams: z.string().max(3000).optional().default(""),
  contributed_curricula: z.string().max(3000).optional().default(""),
  trained_teachers: z.string().max(3000).optional().default(""),
  research_work: z.string().max(3000).optional().default(""),
  pedagogy_answers: z.object({
    q1: z.string().min(20).max(5000),
    q2: z.string().min(20).max(5000),
    q3: z.string().min(20).max(5000),
    q4: z.string().min(20).max(5000),
    q5: z.string().min(20).max(5000),
  }),
  case_study: z.object({
    reasons: z.array(z.string().min(5).max(1500)).length(3),
    diagnostic_questions: z.array(z.string().min(5).max(1500)).length(3),
  }),
  vision_answers: z.object({
    why_join: z.string().min(20).max(5000),
    future_view: z.string().min(20).max(5000),
    one_change: z.string().min(20).max(5000),
    contribution: z.string().min(20).max(5000),
  }),
  weekly_hours: z.number().int().min(1).max(80),
  contribution_types: z.array(z.string()).min(1),
  practical_test: z.object({
    q1_analysis: z.string().min(20).max(5000),
    q1_improvement: z.string().min(10).max(3000),
    q2_analysis: z.string().min(20).max(5000),
    q2_improvement: z.string().min(10).max(3000),
    q3_analysis: z.string().min(20).max(5000),
    q3_improvement: z.string().min(10).max(3000),
  }),
  cv_path: z.string().optional().nullable(),
  work_certificate_path: z.string().optional().nullable(),
  extra_files: z.array(z.string()).optional().default([]),
  started_at: z.string().datetime().optional().nullable(),
  fill_duration_seconds: z.number().int().min(0).max(60 * 60 * 24 * 30).optional().nullable(),
});

export type ApplicationInput = z.infer<typeof ApplicationSchema>;

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ApplicationSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const id = crypto.randomUUID();
    const { error } = await supabaseAdmin
      .from("applications")
      .insert({
        id,
        ...data,
        extra_files: data.extra_files ?? [],
        submitted_at: new Date().toISOString(),
      });

    if (error) throw new Error(error.message);

    // Fire and forget AI scoring
    scoreApplicationAsync(id, data).catch((e) =>
      console.error("AI scoring failed:", e),
    );

    return { id };
  });

async function scoreApplicationAsync(applicationId: string, data: ApplicationInput) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return;

  const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
  const { generateText, Output, NoObjectGeneratedError } = await import("ai");

  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("google/gemini-2.5-flash");

  const schema = z.object({
    pedagogical_analysis: z.number().min(0).max(100),
    error_interpretation: z.number().min(0).max(100),
    systematic_thinking: z.number().min(0).max(100),
    field_experience: z.number().min(0).max(100),
    communication: z.number().min(0).max(100),
    collaboration: z.number().min(0).max(100),
    innovation: z.number().min(0).max(100),
    total: z.number().min(0).max(100),
    summary: z.string().min(10).max(600),
  });

  const prompt = `أنت مقيّم تربوي خبير في مشروع QED لتشخيص تعلم الرياضيات في الجزائر.
قيّم المترشح التالي وفق سبعة معايير من 0 إلى 100، ثم احسب مجموعًا مرجّحًا نهائيًا من 100.
أعطِ ملخصًا قصيرًا (٣ إلى ٥ أسطر) باللغة العربية.

- سنوات الخبرة: ${data.years_experience}
- المستويات: ${data.levels_taught.join("، ")}
- المواد: ${data.subjects}
- إعداد اختبارات رسمية: ${data.designed_official_exams || "لا يوجد"}
- إعداد مناهج: ${data.contributed_curricula || "لا يوجد"}
- تدريب أساتذة: ${data.trained_teachers || "لا يوجد"}
- أبحاث: ${data.research_work || "لا يوجد"}

الأسئلة التربوية:
1) لماذا يواجه التلاميذ صعوبة في الرياضيات؟
${data.pedagogy_answers.q1}

2) كيف تحدد السبب الحقيقي للخطأ؟
${data.pedagogy_answers.q2}

3) هل يمكن أن يصل تلميذان لنفس الإجابة الخاطئة لأسباب مختلفة؟
${data.pedagogy_answers.q3}

4) تصميم اختبار تشخيصي في 20 دقيقة:
${data.pedagogy_answers.q4}

5) أكثر ثلاث أخطاء متكررة:
${data.pedagogy_answers.q5}

دراسة الحالة (-7 + 6 × (-4)):
أسباب الخطأ المقترحة: ${data.case_study.reasons.join(" | ")}
الأسئلة التشخيصية: ${data.case_study.diagnostic_questions.join(" | ")}

الرؤية:
- سبب الانضمام: ${data.vision_answers.why_join}
- مستقبل التعليم: ${data.vision_answers.future_view}
- التغيير المقترح: ${data.vision_answers.one_change}
- الإضافة: ${data.vision_answers.contribution}

التعاون:
- ساعات أسبوعية: ${data.weekly_hours}
- أنواع المساهمة: ${data.contribution_types.join("، ")}

الاختبار العملي:
${data.practical_test.q1_analysis} — تحسين: ${data.practical_test.q1_improvement}
${data.practical_test.q2_analysis} — تحسين: ${data.practical_test.q2_improvement}
${data.practical_test.q3_analysis} — تحسين: ${data.practical_test.q3_improvement}

المعايير:
- pedagogical_analysis: عمق التحليل التربوي
- error_interpretation: القدرة على تفسير أخطاء التلاميذ
- systematic_thinking: التفكير المنهجي المنظم
- field_experience: الخبرة الميدانية
- communication: جودة التواصل والصياغة
- collaboration: الرغبة في التعاون
- innovation: الابتكار والرؤية

قدّم فقط الأرقام (أعداد صحيحة) والملخص. لا تضف تعليقات خارج البنية.`;

  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema }),
      prompt,
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("applications")
      .update({
        ai_score: Math.round(output.total),
        ai_breakdown: output,
        ai_evaluated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e)) {
      console.error("AI returned non-object:", e.text);
    } else {
      console.error(e);
    }
  }
}

// ============ Admin: list, get, update, notes ============

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data, error } = await context.supabase
      .from("applications")
      .select(
        "id, full_name, email, wilaya, years_experience, levels_taught, status, ai_score, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const [app, notes] = await Promise.all([
      context.supabase.from("applications").select("*").eq("id", data.id).single(),
      context.supabase
        .from("application_notes")
        .select("*")
        .eq("application_id", data.id)
        .order("created_at", { ascending: false }),
    ]);
    if (app.error) throw new Error(app.error.message);

    // Signed URLs for files
    const signedUrl = async (path: string | null) => {
      if (!path) return null;
      const { data: s } = await context.supabase.storage
        .from("applications")
        .createSignedUrl(path, 3600);
      return s?.signedUrl ?? null;
    };
    const cv_url = await signedUrl(app.data.cv_path);
    const work_certificate_url = await signedUrl(app.data.work_certificate_path);
    const extra_urls = await Promise.all(
      (app.data.extra_files as string[] | null | undefined ?? []).map(signedUrl),
    );

    return { app: app.data, notes: notes.data ?? [], cv_url, work_certificate_url, extra_urls };
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "reviewing", "interview", "trial", "accepted", "rejected"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("applications")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        application_id: z.string().uuid(),
        note: z.string().trim().min(1).max(3000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error, data: row } = await context.supabase
      .from("application_notes")
      .insert({
        application_id: data.application_id,
        admin_id: context.userId,
        note: data.note,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const isCurrentUserAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });
