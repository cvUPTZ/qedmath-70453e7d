import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSession } from "@/lib/diagnostic.functions";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/diagnostic/session/$id")({
  component: SessionReport,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-destructive">{error.message}</div>
  ),
});

function SessionReport() {
  const { id } = Route.useParams();
  const fn = useServerFn(getSession);
  const q = useQuery({ queryKey: ["diag:session", id], queryFn: () => fn({ data: { id } }) });

  if (q.isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>;
  if (q.error) return <div className="p-8 text-center text-sm text-destructive">{(q.error as Error).message}</div>;

  const { session, answers } = q.data!;
  const evidence: any[] = Array.isArray(session.evidence) ? (session.evidence as any[]) : [];
  const trail: any[] = Array.isArray(session.trail) ? (session.trail as any[]) : [];

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-border bg-card">
        <div className="container-page py-4">
          <Link to="/admin/diagnostic" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-3 w-3" /> عودة للوحة التشخيص
          </Link>
          <h1 className="mt-1 font-display text-xl font-bold">
            تقرير الجلسة — {session.student_label ?? "بدون اسم"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {new Date(session.started_at).toLocaleString("ar-DZ")} · {answers.length} إجابة · {evidence.length} دليل
          </p>
        </div>
      </header>

      <main className="container-page py-6 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display font-bold">المفاهيم الخاطئة المكتشفة</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {evidence.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">لا توجد ثغرات — أداء نظيف.</div>
            ) : (
              <ul className="divide-y divide-border">
                {evidence.map((e, i) => (
                  <li key={i} className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                        e.precise ? "bg-red-100 text-red-900" : "bg-emerald-100 text-emerald-900"
                      }`}>
                        {e.precise ? "دقيق (leaf)" : "مُستَبعَد / عام"}
                      </span>
                      <span className="text-xs text-muted-foreground">{e.topic}</span>
                    </div>
                    <p className="mt-2 font-medium">{e.skillLabel}</p>
                    {e.note && <p className="mt-1 text-xs text-muted-foreground">{e.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display font-bold">مسار الجلسة</h2>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            {trail.map((t, i) => (
              <div key={i} className={`text-xs ${t.probe ? "mr-4 border-r-2 border-dashed border-amber-400 pr-3" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${
                    t.probe ? "bg-amber-400" : t.correct ? "bg-emerald-600" : "bg-red-500"
                  }`} />
                  <span className="font-mono text-[10px]">{String(t.id).slice(0, 12)}</span>
                  {t.probeTag && (
                    <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] text-amber-900">{t.probeTag}</span>
                  )}
                </div>
                <p className="text-muted-foreground">{t.label}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
