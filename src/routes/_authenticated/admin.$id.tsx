import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  getApplication,
  updateApplicationStatus,
  addNote,
} from "@/lib/applications.functions";
import { ArrowRight, FileText, MessageSquarePlus } from "lucide-react";
import { statusLabel, statusTone } from "./admin";

export const Route = createFileRoute("/_authenticated/admin/$id")({
  component: AdminDetail,
});

const STATUSES = ["new", "reviewing", "interview", "trial", "accepted", "rejected"] as const;

function AdminDetail() {
  const { id } = useParams({ from: "/_authenticated/admin/$id" });
  const qc = useQueryClient();
  const getFn = useServerFn(getApplication);
  const updateFn = useServerFn(updateApplicationStatus);
  const noteFn = useServerFn(addNote);

  const q = useQuery({
    queryKey: ["application", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const updateStatus = useMutation({
    mutationFn: (status: (typeof STATUSES)[number]) => updateFn({ data: { id, status } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["application", id] }); qc.invalidateQueries({ queryKey: ["applications"] }); toast.success("تم تحديث الحالة"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const [noteText, setNoteText] = useState("");
  const addNoteM = useMutation({
    mutationFn: () => noteFn({ data: { application_id: id, note: noteText.trim() } }),
    onSuccess: () => { setNoteText(""); qc.invalidateQueries({ queryKey: ["application", id] }); toast.success("تمت إضافة الملاحظة"); },
    onError: (e) => toast.error((e as Error).message),
  });

  if (q.isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>;
  if (q.error) return <div className="p-8 text-center text-sm text-destructive">{(q.error as Error).message}</div>;
  if (!q.data) return null;

  const { app, notes, cv_url, work_certificate_url, extra_urls } = q.data;
  const ai = app.ai_breakdown as null | {
    pedagogical_analysis: number; error_interpretation: number; systematic_thinking: number;
    field_experience: number; communication: number; collaboration: number; innovation: number;
    total: number; summary: string;
  };

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-border bg-card">
        <div className="container-page py-4">
          <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink">
            <ArrowRight className="h-4 w-4" />
            العودة إلى القائمة
          </Link>
        </div>
      </header>

      <main className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {/* Header card */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-bold">{app.full_name}</h1>
                <p className="mt-1 text-sm text-muted-foreground" dir="ltr">{app.email} · {app.phone}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {app.wilaya} · {app.workplace} · {app.institution_type === "public" ? "عمومية" : app.institution_type === "private" ? "خاصة" : "حرة"} · {app.years_experience} سنة خبرة
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(app.levels_taught ?? []).map((l: string) => (
                    <span key={l} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{l}</span>
                  ))}
                </div>
              </div>
              <span className={"rounded-full px-3 py-1 text-sm font-medium " + statusTone(app.status)}>
                {statusLabel(app.status)}
              </span>
            </div>
          </div>

          <Section title="الخبرة المهنية">
            <KV label="المواد">{app.subjects}</KV>
            <KV label="اختبارات رسمية">{app.designed_official_exams || "—"}</KV>
            <KV label="مناهج ومراجع">{app.contributed_curricula || "—"}</KV>
            <KV label="تدريب أساتذة">{app.trained_teachers || "—"}</KV>
            <KV label="أبحاث">{app.research_work || "—"}</KV>
          </Section>

          <Section title="التفكير التربوي">
            {Object.entries(app.pedagogy_answers as Record<string, string>).map(([k, v], i) => (
              <KV key={k} label={`السؤال ${i + 1}`}>{v}</KV>
            ))}
          </Section>

          <Section title="دراسة الحالة: -7 + 6 × (-4)">
            <p className="text-sm font-medium">الأسباب المقترحة</p>
            <ol className="mt-2 list-decimal space-y-2 ps-6 text-sm leading-relaxed">
              {((app.case_study as { reasons: string[] }).reasons ?? []).map((r, i) => <li key={i}>{r}</li>)}
            </ol>
            <p className="mt-5 text-sm font-medium">الأسئلة التشخيصية</p>
            <ol className="mt-2 list-decimal space-y-2 ps-6 text-sm leading-relaxed">
              {((app.case_study as { diagnostic_questions: string[] }).diagnostic_questions ?? []).map((r, i) => <li key={i}>{r}</li>)}
            </ol>
          </Section>

          <Section title="الرؤية">
            <KV label="لماذا الانضمام">{(app.vision_answers as any).why_join}</KV>
            <KV label="مستقبل التعليم">{(app.vision_answers as any).future_view}</KV>
            <KV label="التغيير الواحد">{(app.vision_answers as any).one_change}</KV>
            <KV label="الإضافة للمشروع">{(app.vision_answers as any).contribution}</KV>
          </Section>

          <Section title="التعاون">
            <KV label="ساعات أسبوعية">{app.weekly_hours}</KV>
            <KV label="أنواع المساهمة">
              <div className="flex flex-wrap gap-1.5">
                {(app.contribution_types ?? []).map((c: string) => (
                  <span key={c} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{c}</span>
                ))}
              </div>
            </KV>
          </Section>

          <Section title="الاختبار العملي">
            {[1, 2, 3].map((n) => {
              const pt = app.practical_test as Record<string, string>;
              return (
                <div key={n} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
                  <p className="font-medium">السؤال {n}</p>
                  <KV label="التحليل">{pt[`q${n}_analysis`]}</KV>
                  <KV label="اقتراح تحسين">{pt[`q${n}_improvement`]}</KV>
                </div>
              );
            })}
          </Section>

          <Section title="الملفات">
            <FileLink label="السيرة الذاتية" url={cv_url} />
            <FileLink label="شهادة العمل" url={work_certificate_url} />
            {extra_urls.map((u: string | null, i: number) => (
              <FileLink key={i} label={`ملف إضافي ${i + 1}`} url={u} />
            ))}
          </Section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* AI Evaluation */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-bold">التقييم الآلي</h3>
            {ai ? (
              <>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold text-brand">{ai.total}</span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <Bar label="تحليل تربوي" value={ai.pedagogical_analysis} />
                  <Bar label="تفسير الأخطاء" value={ai.error_interpretation} />
                  <Bar label="تفكير منهجي" value={ai.systematic_thinking} />
                  <Bar label="خبرة ميدانية" value={ai.field_experience} />
                  <Bar label="جودة التواصل" value={ai.communication} />
                  <Bar label="التعاون" value={ai.collaboration} />
                  <Bar label="الابتكار" value={ai.innovation} />
                </div>
                <p className="mt-4 rounded-lg bg-secondary p-3 text-sm leading-relaxed">{ai.summary}</p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">جارٍ التقييم الآلي...</p>
            )}
          </div>

          {/* Status */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-bold">الحالة</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus.mutate(s)}
                  disabled={updateStatus.isPending || app.status === s}
                  className={
                    "rounded-lg border px-3 py-2 text-xs font-medium transition " +
                    (app.status === s
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border bg-background hover:bg-secondary")
                  }
                >
                  {statusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="flex items-center gap-2 font-display font-bold">
              <MessageSquarePlus className="h-4 w-4" />
              ملاحظات داخلية
            </h3>
            <textarea
              className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="أضف ملاحظة..."
            />
            <button
              onClick={() => addNoteM.mutate()}
              disabled={!noteText.trim() || addNoteM.isPending}
              className="mt-2 w-full rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-parchment disabled:opacity-50"
            >
              حفظ الملاحظة
            </button>
            <ul className="mt-4 space-y-3">
              {notes.map((n: any) => (
                <li key={n.id} className="rounded-lg bg-secondary p-3 text-sm">
                  <p className="whitespace-pre-wrap leading-relaxed">{n.note}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("ar-DZ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}
function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{children}</div>
    </div>
  );
}
function FileLink({ label, url }: { label: string; url: string | null }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-secondary">
      <FileText className="h-4 w-4 text-brand" />
      {label}
    </a>
  );
}
function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-brand" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}
