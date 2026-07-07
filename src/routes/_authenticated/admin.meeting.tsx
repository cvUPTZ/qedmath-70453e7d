import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, MessageCircle, Presentation, ThumbsDown, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/meeting")({
  head: () => ({
    meta: [
      { title: "تخطيط اجتماع الأساتذة — QED" },
      { name: "description", content: "خطة اجتماع تقديم QED للأساتذة: تقديم قصير، إنصات، عرض، ونقد." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MeetingPlanPage,
});

type Section = {
  icon: React.ComponentType<{ className?: string }>;
  duration: string;
  title: string;
  intro?: string;
  bullets?: string[];
  quote?: string;
  note?: string;
};

const sections: Section[] = [
  {
    icon: Presentation,
    duration: "10 دقائق",
    title: "1. تقديم قصير",
    bullets: ["من أنت؟", "ما هو QED؟", "ما المشكلة التي تحاول حلها؟"],
    note: "ثم توقف. لا تدخل في تفاصيل IRT أو Knowledge Graph أو الذكاء الاصطناعي.",
  },
  {
    icon: MessageCircle,
    duration: "30 دقيقة",
    title: "2. اجعل الأساتذة يتكلمون",
    intro: "اسألهم:",
    bullets: [
      "ما أكثر الأخطاء التي تتكرر عند التلاميذ؟",
      "هل العلامة تكفي لفهم مستوى التلميذ؟",
      "كيف تعرفون السبب الحقيقي للخطأ؟",
      "كم من الوقت يحتاج الأستاذ لتشخيص تلميذ واحد؟",
      "لو كان لديكم مساعد ذكي، ماذا تتوقعون منه؟",
    ],
    note: "هذه الأسئلة أهم من عرض 100 شريحة.",
  },
  {
    icon: Presentation,
    duration: "20 دقيقة",
    title: "3. اعرض QED",
    intro: "بعد أن يذكروا مشاكلهم، قل:",
    quote: "«هذه بالضبط المشكلة التي نحاول حلها.»",
    bullets: ["التشخيص", "Skill Graph", "التقرير", "المسار العلاجي"],
    note: "سيشعرون أن المنصة جاءت استجابة لمشكلاتهم، وليس العكس.",
  },
  {
    icon: ThumbsDown,
    duration: "20 دقيقة",
    title: "4. اطلب نقدهم",
    intro: "قل لهم صراحة: لا أبحث اليوم عن المجاملة، بل عن النقد. واسأل:",
    bullets: [
      "ما الذي لا يعجبكم؟",
      "ماذا ينقص؟",
      "ما الذي لا تثقون به؟",
      "ما الذي لو أضفناه سيجعلكم تستخدمونه؟",
    ],
    note: "هذه الملاحظات ستكون ثمينة.",
  },
];

function MeetingPlanPage() {
  const total = 10 + 30 + 20 + 20;
  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-border bg-card">
        <div className="container-page flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold">تخطيط اجتماع الأساتذة</h1>
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> المدة الإجمالية ≈ {total} دقيقة
            </p>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <ArrowRight className="h-4 w-4" /> العودة للوحة
          </Link>
        </div>
      </header>

      <main className="container-page py-8 space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map((s) => (
            <section key={s.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <h2 className="font-display text-lg font-bold">{s.title}</h2>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                  {s.duration}
                </span>
              </div>

              {s.intro && <p className="mt-4 text-sm text-muted-foreground">{s.intro}</p>}
              {s.quote && (
                <blockquote className="mt-4 border-r-4 border-brand bg-brand/5 p-3 text-sm font-semibold">
                  {s.quote}
                </blockquote>
              )}
              {s.bullets && (
                <ul className="mt-3 space-y-2 text-sm">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {s.note && (
                <p className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">{s.note}</p>
              )}
            </section>
          ))}
        </div>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <Target className="h-5 w-5" />
            </span>
            <h2 className="font-display text-lg font-bold">لا تذهب بهدف واحد</h2>
          </div>
          <p className="mt-4 text-sm">
            لا تجعل هدفك <span className="font-semibold">توقيع شراكة</span>. بل اجعل أهدافك:
          </p>
          <ul className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            {[
              "فهم احتياجات الأساتذة",
              "اختبار فرضيات QED",
              "بناء علاقة",
              "الاتفاق على Pilot إذا اقتنعوا",
            ].map((g) => (
              <li key={g} className="flex gap-2 rounded-lg border border-border p-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
          <blockquote className="mt-5 border-r-4 border-emerald-500 bg-emerald-50 p-4 text-sm">
            إذا انتهى الاجتماع ولم توقع شيئًا، لكنه انتهى والأساتذة يقولون:
            <span className="mt-1 block font-display text-base font-bold text-emerald-900">
              «نريد تجربة المنصة مع قسم.»
            </span>
            فهذا نجاح.
          </blockquote>
        </section>
      </main>
    </div>
  );
}
