import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QED — برنامج الخبراء التربويين للرياضيات" },
      {
        name: "description",
        content:
          "دعوة مفتوحة لأساتذة الرياضيات للمشاركة في بناء أول محرك تشخيص تربوي ذكي في الجزائر.",
      },
    ],
  }),
  component: LandingPage,
});

const PILLARS = [
  {
    n: "I",
    title: "التشخيص قبل التعليم",
    body: "لا ينبغي أن يبدأ التلميذ بالدراسة قبل معرفة ما يعرفه وما لا يعرفه. الفهم يبدأ من قياس الفجوة، لا من ملء الوقت.",
  },
  {
    n: "II",
    title: "فهم الخطأ قبل تصحيحه",
    body: "قد يصل تلميذان إلى نفس الإجابة الخاطئة، لكن لكل منهما سبب مختلف. مهمتنا اكتشاف السبب، لا تكرار الإجابة الصحيحة.",
  },
  {
    n: "III",
    title: "المهارات شبكة، لا قائمة",
    body: "الرياضيات ليست دروسًا منفصلة، بل شبكة مترابطة. كل سؤال يقيس عقدة، وكل إجابة تُعدّل النموذج المعرفي.",
  },
  {
    n: "IV",
    title: "قرارات مبنية على البيانات",
    body: "كل قرار تعليمي مبني على تشخيص، لا على تخمين. الحدس التربوي يُوجَّه بالأدلة، لا يُستبدَل بها.",
  },
];

const JOURNEY = [
  "التعريف بالمشروع",
  "التعريف بالمترشح",
  "الخبرة المهنية",
  "الفلسفة التربوية",
  "تحليل حالات واقعية",
  "تحدٍّ عملي تشخيصي",
  "رفع الوثائق",
  "مراجعة الطلب",
  "مقابلة علمية",
  "تجربة تعاون قصيرة",
  "اعتماد الخبير",
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-parchment text-ink">
      <SiteHeader />

      {/* HERO — Manuscript split */}
      <section className="border-b border-ink/10 bg-parchment">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12">
          {/* Right (RTL): action / invitation */}
          <div className="order-2 lg:order-1 lg:col-span-7 bg-parchment p-8 md:p-16 lg:p-20 flex flex-col justify-center min-h-[560px]">
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-brand-accent mb-6">
              الإصدار الأول · ٢٠٢٦ · دعوة مفتوحة
            </span>
            <h1 className="font-display text-4xl leading-[1.2] text-ink md:text-5xl lg:text-6xl">
              دعوة إلى بناء أول محرك تشخيص
              <br />
              <em className="italic text-brand-accent">تربوي ذكي</em> للرياضيات في الجزائر.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-loose text-muted-foreground md:text-lg">
              هذا ليس إعلان توظيف. هذه دعوة للأساتذة الذين يفكّرون تحليليًا،
              للمشاركة في تصميم نظام يفهم <span className="text-ink font-medium">كيف</span> يتعلّم التلميذ،
              و<span className="text-ink font-medium">لماذا</span> يخطئ، وما الذي يحتاجه فعلًا.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link
                to="/apply"
                className="group inline-flex items-center gap-4 bg-ink px-8 py-4 text-sm font-medium tracking-wide text-parchment transition-colors hover:bg-brand-accent"
              >
                قدِّم ترشُّحك للمجلس التربوي
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </Link>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  ترشيح بالدعوة · مقاعد محدودة
                </span>
                <span className="text-sm font-semibold text-ink">تُراجَع كل استمارة يدويًا</span>
              </div>
            </div>

          </div>

          {/* Left (RTL): philosophy panel */}
          <aside className="order-1 lg:order-2 lg:col-span-5 relative overflow-hidden bg-ink p-10 md:p-14 text-parchment flex flex-col justify-between min-h-[560px]">
            <svg
              className="pointer-events-none absolute -left-10 -top-10 opacity-[0.08]"
              width="320"
              height="320"
              viewBox="0 0 100 100"
              fill="none"
              aria-hidden
            >
              <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.4" />
              <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="0.4" />
              <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.4" />
              <path d="M50 2L50 98M2 50L98 50" stroke="currentColor" strokeWidth="0.4" />
            </svg>

            <div className="relative">
              <div className="mb-10">
                <div className="font-display text-4xl font-bold tracking-tight">QED</div>
                <div className="mt-3 h-px w-12 bg-brand-accent" />
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.28em] text-parchment/60">
                  Quod Erat Demonstrandum
                </p>
              </div>

              <blockquote className="border-r-2 border-brand-accent pr-6">
                <p className="font-display text-xl italic leading-relaxed text-parchment/95 md:text-2xl">
                  «الخطأ ليس المشكلة، بل عدم معرفة السبب الحقيقي وراء الخطأ.»
                </p>
                <cite className="mt-4 block font-mono text-[10px] uppercase tracking-widest not-italic text-brand-accent">
                  — فلسفة QED
                </cite>
              </blockquote>
            </div>

            <dl className="relative mt-10 space-y-3 font-mono text-[11px] uppercase tracking-widest text-parchment/60">
              <div className="flex justify-between border-t border-parchment/10 pt-3">
                <dt>مرجع الوثيقة</dt>
                <dd>QED/EXP-01</dd>
              </div>
              <div className="flex justify-between">
                <dt>الحقل</dt>
                <dd>الرياضيات · التشخيص التربوي</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="border-b border-ink/10 bg-card">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-brand-accent">
            § ١ · الرؤية
          </span>
          <h2 className="mt-6 font-display text-3xl leading-tight text-ink md:text-5xl">
            نبني نظامًا يفهم التلميذ،
            <br />
            <em className="italic text-brand-accent">لا نظامًا يُغرقه بالتمارين.</em>
          </h2>
          <div className="mt-10 grid gap-10 border-t border-ink/10 pt-10 md:grid-cols-2 md:gap-16">
            <p className="text-base leading-loose text-muted-foreground md:text-lg">
              QED مشروع جزائري يعيد تصميم طريقة تعلّم الرياضيات باستخدام الذكاء
              الاصطناعي وعلوم التربية. لا نسعى إلى إنشاء منصة تحتوي على آلاف
              التمارين، بل إلى بناء نظام يُشخّص المهارات، ويكشف الثغرات
              المفاهيمية، ويحلّل أسباب الأخطاء.
            </p>
            <p className="text-base leading-loose text-muted-foreground md:text-lg">
              الهدف ليس أن يحلّ جميع التلاميذ نفس التمارين، بل أن يتعلّم كل تلميذ
              ما يحتاج إليه بالضبط. ولهذا يبدأ QED دائمًا بالتشخيص قبل التعليم،
              وبفهم الخطأ قبل تصحيحه.
            </p>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="border-b border-ink/10 bg-parchment">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-brand-accent">
            § ٢ · المبادئ
          </span>
          <h2 className="mt-6 font-display text-3xl leading-tight text-ink md:text-5xl">
            أربعة مبادئ تحكم كل قرار.
          </h2>

          <div className="mt-14 grid gap-px border border-ink/10 bg-ink/10 md:grid-cols-2">
            {PILLARS.map((p) => (
              <article key={p.n} className="bg-parchment p-8 md:p-10">
                <div className="flex items-baseline gap-4">
                  <span className="font-display text-3xl italic text-brand-accent">
                    {p.n}
                  </span>
                  <h3 className="font-display text-xl text-ink md:text-2xl">
                    {p.title}
                  </h3>
                </div>
                <p className="mt-4 text-sm leading-loose text-muted-foreground md:text-base">
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE SEEK */}
      <section className="bg-ink text-parchment">
        <div className="mx-auto grid max-w-6xl gap-16 px-6 py-24 md:grid-cols-12 md:py-32">
          <div className="md:col-span-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-brand-accent">
              § ٣ · من نبحث عنه
            </span>
            <h2 className="mt-6 font-display text-3xl leading-tight md:text-4xl">
              ليس <em className="italic text-parchment/60">أشهر</em> الأساتذة.
              <br />
              بل <em className="italic text-brand-accent">أعمقهم</em> تفكيرًا.
            </h2>
          </div>
          <div className="md:col-span-7 space-y-6 text-base leading-loose text-parchment/80 md:text-lg">
            <p>
              لا نبحث عن صاحب أكبر عدد من المتابعين، ولا عن من يكتب أكبر عدد من
              التمارين. نبحث عن الأستاذ الذي يسأل دائمًا:
            </p>
            <ul className="space-y-4 border-r-2 border-brand-accent pr-6 font-display text-lg italic text-parchment md:text-xl">
              <li>«لماذا أخطأ التلميذ؟»</li>
              <li>«هل يوجد أكثر من سبب لهذا الخطأ؟»</li>
              <li>«كيف أبني سؤالًا يكشف هذا الضعف بالضبط؟»</li>
              <li>«ما المهارة التي سبّبت هذا الخطأ؟ وكيف أعالجها؟»</li>
            </ul>
            <p className="text-parchment/70">
              لأن الاختيار لن يعتمد على السيرة الذاتية وحدها، بل على
              <span className="text-parchment"> جودة التفكير</span>.
            </p>
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section className="border-b border-ink/10 bg-card">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-brand-accent">
            § ٤ · الرحلة
          </span>
          <h2 className="mt-6 font-display text-3xl leading-tight text-ink md:text-5xl">
            رحلة علمية من إحدى عشرة مرحلة.
          </h2>
          <p className="mt-6 max-w-2xl text-muted-foreground md:text-lg">
            يجب أن يشعر الأستاذ بأنه يمرّ برحلة علمية، لا بعملية توظيف. كل مرحلة
            مصمَّمة لكشف زاوية مختلفة من التفكير التربوي.
          </p>

          <ol className="mt-14 grid gap-px border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
            {JOURNEY.map((title, i) => (
              <li
                key={title}
                className="flex items-baseline gap-4 bg-card p-6 md:p-7"
              >
                <span className="font-mono text-xs text-brand-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-lg text-ink">{title}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FUTURE */}
      <section className="bg-parchment">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-brand-accent">
            § ٥ · الرؤية المستقبلية
          </span>
          <h2 className="mt-6 font-display text-3xl leading-tight text-ink md:text-5xl">
            نحو مجلس تربوي دائم داخل QED.
          </h2>
          <p className="mt-8 text-base leading-loose text-muted-foreground md:text-lg">
            هذا البرنامج بداية لتأسيس مجلس يضم نخبة من أساتذة الرياضيات والمفتشين
            والباحثين، مسؤول عن تطوير النموذج التربوي، ومراجعة نتائج التشخيص،
            وتحسين شجرة المهارات باستمرار — بالتكامل بين الخبرة البشرية والتحليل
            المعتمد على البيانات.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-ink/10 bg-ink text-parchment">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between md:py-24">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-brand-accent">
              الانضمام
            </span>
            <h2 className="mt-4 font-display text-3xl leading-tight md:text-4xl">
              إن كنت ترى نفسك في هذا،
              <br />
              <em className="italic text-brand-accent">ابدأ الرحلة.</em>
            </h2>
          </div>
          <Link
            to="/apply"
            className="group inline-flex items-center gap-4 border border-parchment/30 bg-parchment px-8 py-4 text-sm font-medium tracking-wide text-ink transition-colors hover:bg-brand-accent hover:text-parchment"
          >
            ابدأ التقديم الآن
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  const links = [
    { href: "#vision", label: "الرؤية" },
    { href: "#principles", label: "المبادئ" },
    { href: "#who", label: "من نبحث عنه" },
    { href: "#journey", label: "الرحلة" },
    { href: "#future", label: "المستقبل" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-parchment/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
        <Link to="/" className="flex items-baseline gap-3 shrink-0">
          <span className="font-display text-2xl font-bold tracking-tight text-ink">
            QED
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:inline">
            برنامج الخبراء التربويين
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <Link
          to="/apply"
          className="border border-ink/20 px-4 py-2 text-xs font-medium tracking-wide text-ink transition-colors hover:bg-ink hover:text-parchment shrink-0"
        >
          التقديم
        </Link>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-parchment">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-6 py-8 font-mono text-[11px] uppercase tracking-widest text-muted-foreground md:flex-row md:items-center">
        <p>© {new Date().getFullYear()} QED · الجزائر</p>
        <p>Pedagogical Diagnostic Engine · v1.0</p>
      </div>
    </footer>
  );
}
