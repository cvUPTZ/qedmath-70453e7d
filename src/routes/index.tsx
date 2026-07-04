import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BrainCircuit, LineChart, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-parchment text-ink">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="container-page pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              مشروع QED — دعوة مفتوحة للأساتذة
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.15] tracking-tight md:text-6xl">
              ساهم في بناء مستقبل
              <br />
              <span className="text-brand">تعليم الرياضيات</span> في الجزائر
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              نبحث عن أساتذة رياضيات يمتلكون خبرة ميدانية ورغبة حقيقية في تطوير
              طرق تشخيص تعلم الرياضيات، والمساهمة في بناء منصة تعليمية تعتمد على
              الذكاء الاصطناعي والتحليل التربوي.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                to="/apply"
                className="group inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-sm font-semibold text-parchment shadow-soft transition-all hover:shadow-elevated"
              >
                ابدأ التقديم
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </Link>
              <a
                href="#about"
                className="inline-flex items-center rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold hover:bg-secondary"
              >
                تعرّف على المشروع
              </a>
            </div>
          </div>
        </section>

        {/* Manifesto */}
        <section id="about" className="border-y border-border bg-card">
          <div className="container-page py-20 md:py-28">
            <div className="mx-auto max-w-3xl">
              <p className="text-sm font-medium tracking-wide text-brand">
                فلسفتنا
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
                لسنا نبحث عن أكثر الأساتذة شهرة
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                بل عن الأساتذة الذين يستطيعون تفسير أخطاء التلاميذ، وفهم طريقة
                تفكيرهم، والمساهمة في بناء نموذج تربوي علمي يعتمد على التشخيص
                الدقيق قبل أي تدخل تعليمي.
              </p>
            </div>
          </div>
        </section>

        {/* What we build */}
        <section className="container-page py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              ما الذي نبنيه معًا
            </h2>
            <p className="mt-4 text-muted-foreground">
              QED منصة لتشخيص تعلم الرياضيات، تجمع بين خبرة الميدان وقوة التحليل.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: BrainCircuit,
                title: "شجرة المهارات",
                text: "بناء خريطة معرفية دقيقة لمهارات الرياضيات، من الأساسيات إلى المفاهيم المعقدة.",
              },
              {
                icon: LineChart,
                title: "اختبارات تشخيصية",
                text: "تصميم اختبارات قصيرة قادرة على كشف السبب الحقيقي وراء أخطاء التلاميذ.",
              },
              {
                icon: Users,
                title: "شبكة أساتذة",
                text: "نخبة من الأساتذة يشاركون في بناء المحتوى وتحليل الأخطاء وتدريب النموذج.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-elevated"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-brand">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container-page pb-24">
          <div className="mx-auto max-w-4xl rounded-3xl bg-ink px-8 py-14 text-center text-parchment md:px-16">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              هل أنت جاهز للمساهمة؟
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-parchment/70">
              رحلة التقديم مصممة لتعكس فلسفة المشروع: أسئلة عميقة، دراسة حالة،
              واختبار تشخيصي عملي. تستغرق حوالي ٤٥ دقيقة.
            </p>
            <Link
              to="/apply"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.02]"
            >
              ابدأ التقديم الآن
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-parchment font-display font-black">
            Q
          </div>
          <span className="font-display text-lg font-bold tracking-tight">QED</span>
        </Link>
        <Link
          to="/apply"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90"
        >
          التقديم
        </Link>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container-page flex flex-col items-center justify-between gap-2 py-8 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} QED — مشروع تعليم الرياضيات في الجزائر</p>
        <p className="font-display font-medium">اصنع فرقًا في التعليم</p>
      </div>
    </footer>
  );
}
