import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Clock,
  MessageCircle,
  Presentation,
  ThumbsDown,
  Target,
  Info,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/meeting")({
  head: () => ({
    meta: [
      { title: "سيرورة اجتماع الأساتذة — QED" },
      {
        name: "description",
        content:
          "نص جاهز لسيرورة اجتماع تقديم QED للأساتذة: تقديم قصير، حوار، عرض الفكرة، ثم طلب النقد.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MeetingPlanPage,
});

type Block =
  | { kind: "say"; text: string }
  | { kind: "action"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; items: string[]; label?: string }
  | { kind: "qa"; number: string; question: string; follow?: string[] };

type Section = {
  icon: React.ComponentType<{ className?: string }>;
  duration: string;
  title: string;
  blocks: Block[];
};

const sections: Section[] = [
  {
    icon: Presentation,
    duration: "10 دقائق",
    title: "1. تقديم قصير",
    blocks: [
      {
        kind: "say",
        text: "السلام عليكم، وشكرًا لإدارة المؤسسة وللأساتذة على تخصيص هذا الوقت.",
      },
      {
        kind: "say",
        text: "اسمي زكريا، وأنا أعمل منذ فترة على مشروع اسمه QED، وهو مشروع تربوي جزائري يهتم بتعليم الرياضيات.",
      },
      {
        kind: "say",
        text: "أنا لست هنا اليوم لأعرض عليكم منصة جاهزة أو لأقنعكم بشرائها، بل جئت لأنني أؤمن أن أي نظام موجه للتعليم لا يمكن بناؤه بعيدًا عن الأستاذ.",
      },
      { kind: "say", text: "الفكرة الأساسية للمشروع بسيطة:" },
      {
        kind: "quote",
        text: "عندما يخطئ تلميذ في الرياضيات، نحن نعرف أنه أخطأ، لكن غالبًا لا نعرف لماذا أخطأ.",
      },
      {
        kind: "say",
        text: "قد يصل تلميذان إلى نفس الإجابة الخاطئة، لكن يكون سبب الخطأ مختلفًا تمامًا. وإذا لم نعرف السبب الحقيقي، فمن الصعب أن نعالج المشكلة بطريقة صحيحة.",
      },
      { kind: "say", text: "لهذا نحاول في QED بناء نظام يساعد على الانتقال من:" },
      {
        kind: "list",
        items: ['"الإجابة خاطئة"', 'إلى: "ما السبب الحقيقي وراء هذا الخطأ؟"'],
      },
      {
        kind: "say",
        text: "هذا هو الهدف الأساسي للمشروع. اليوم لست هنا لأقدم حلولًا جاهزة، بل لأختبر هذه الفكرة مع أصحاب الخبرة في الميدان.",
      },
    ],
  },
  {
    icon: MessageCircle,
    duration: "30 دقيقة",
    title: "2. النقاش مع الأساتذة",
    blocks: [
      { kind: "action", text: "اطرح الأسئلة واحدًا واحدًا، ودعهم يتحدثون بدون مقاطعة." },
      {
        kind: "qa",
        number: "س1",
        question:
          "من خلال خبرتكم، ما أكثر الأخطاء التي تتكرر عند التلاميذ في الرياضيات؟",
      },
      {
        kind: "qa",
        number: "س2",
        question:
          "عندما يصحح الأستاذ فرضًا أو اختبارًا، هل العلامة وحدها تكفي لمعرفة مستوى التلميذ؟",
        follow: ["لماذا؟"],
      },
      {
        kind: "qa",
        number: "س3",
        question: "إذا أجاب تلميذان بنفس الإجابة الخاطئة، هل يعني ذلك أن سبب الخطأ واحد؟",
        follow: ["هل يمكن أن تعطونا أمثلة؟"],
      },
      {
        kind: "qa",
        number: "س4",
        question: "كيف تكتشفون أنتم السبب الحقيقي للخطأ؟",
        follow: ["هل هناك منهجية؟", "أم يعتمد الأمر على الخبرة؟"],
      },
      {
        kind: "qa",
        number: "س5",
        question: "تقريبًا، كم يحتاج الأستاذ من الوقت حتى يشخّص مشكلة تلميذ واحد؟",
      },
      {
        kind: "qa",
        number: "س6",
        question: "لو توفر لكم مساعد يساعدكم في التشخيص، ماذا تتوقعون منه؟",
        follow: ["وما الذي لا تريدونه أن يقوم به؟"],
      },
      {
        kind: "qa",
        number: "س7",
        question:
          "لو كان بإمكانكم تغيير شيء واحد فقط في طريقة تقييم التلاميذ، ماذا سيكون؟",
      },
    ],
  },
  {
    icon: Presentation,
    duration: "20 دقيقة",
    title: "3. تقديم QED",
    blocks: [
      { kind: "action", text: "بعد أن ينتهوا من الحديث، قل:" },
      {
        kind: "quote",
        text: "كل المشاكل التي ذكرتموها هي بالضبط السبب الذي جعلني أبدأ هذا المشروع.",
      },
      {
        kind: "say",
        text: "أولًا: في QED لا نبدأ بالأسئلة، بل نبدأ بالمهارات. كل درس نفككه إلى مهارات صغيرة يمكن قياسها.",
      },
      {
        kind: "say",
        text: "ثانيًا: كل سؤال في المنصة مرتبط بمهارة محددة. إذا أخطأ التلميذ، لا نقول فقط \"أخطأت\"، بل نحاول معرفة: أي مهارة لم يتقنها؟",
      },
      {
        kind: "say",
        text: "ثالثًا: إذا كان هناك أكثر من احتمال لسبب الخطأ، لا نعطي تشخيصًا مباشرة، بل نطرح أسئلة قصيرة إضافية حتى نستبعد الاحتمالات ونصل إلى السبب الأقرب.",
      },
      {
        kind: "say",
        text: "رابعًا: بعد معرفة السبب، لا نعطي عشرين تمرينًا عشوائيًا، بل نقترح مسارًا علاجيًا يبدأ بالمهارة المفقودة ثم يتدرج.",
      },
      {
        kind: "say",
        text: "خامسًا: الأستاذ يحصل على تقرير، ليس فقط علامة. تقرير يجيب عن أسئلة مثل:",
      },
      {
        kind: "list",
        items: [
          "ما المهارات التي أتقنها التلميذ؟",
          "أين توجد الفجوات؟",
          "ما أكثر الأخطاء تكرارًا؟",
          "ما المهارات التي ينبغي معالجتها أولًا؟",
        ],
      },
      {
        kind: "quote",
        text: "هذا هو التصور الحالي، ولا أدعي أنه كامل. ولهذا أنا هنا.",
      },
    ],
  },
  {
    icon: ThumbsDown,
    duration: "20 دقيقة",
    title: "4. طلب النقد",
    blocks: [
      { kind: "action", text: "قل لهم بوضوح:" },
      {
        kind: "quote",
        text: "أريد أن أطلب منكم شيئًا. اليوم لا أبحث عن المجاملة. إذا وجدتم شيئًا غير منطقي، أخبروني. إذا وجدتم فرضية خاطئة، أخبروني. إذا وجدتم أن النظام لن يعمل داخل القسم، أخبروني. النقد بالنسبة لي أهم من الإطراء.",
      },
      { kind: "action", text: "ثم اسأل:" },
      {
        kind: "list",
        items: [
          "ما أول شيء لا يعجبكم في الفكرة؟",
          "ما الذي ترونه ناقصًا؟",
          "هل هناك شيء لا تثقون فيه؟",
          "هل يوجد جزء ترونه غير واقعي؟",
          "لو كنتم مكاني، بماذا ستبدؤون؟",
          "ما الذي سيجعلكم تستخدمون مثل هذا النظام فعلًا؟",
        ],
      },
    ],
  },
];

const closingLines = [
  "أشكركم على وقتكم.",
  "هدفي من هذا اللقاء لم يكن تقديم منتج، بل الاستفادة من خبرتكم.",
  "إذا وجدتم أن الفكرة تستحق التطوير، فسيسعدني أن نتعاون لتحسينها.",
  "وإذا رأيتم أنها تحتاج إلى تعديل، فأنا أفضل أن أعرف ذلك الآن قبل أن تكبر المنصة.",
  "وأتمنى، إذا اقتنعتم بأن للمشروع قيمة، أن نخطط معًا لتجربة محدودة مع بداية الموسم الدراسي، حتى نختبره في بيئة حقيقية ونتعلم من نتائجها.",
];

const goals = [
  "فهم احتياجات الأساتذة",
  "اختبار فرضيات QED",
  "بناء علاقة",
  "الاتفاق على تجربة محدودة إذا اقتنعوا",
];

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "say":
      return <p className="text-sm leading-7">{block.text}</p>;
    case "action":
      return (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          {block.text}
        </p>
      );
    case "quote":
      return (
        <blockquote className="border-r-4 border-brand bg-brand/5 p-3 text-sm font-semibold leading-7">
          «{block.text}»
        </blockquote>
      );
    case "list":
      return (
        <ul className="space-y-2 text-sm">
          {block.items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span className="leading-7">{item}</span>
            </li>
          ))}
        </ul>
      );
    case "qa":
      return (
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <div className="flex items-start gap-2">
            <span className="rounded-md bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
              {block.number}
            </span>
            <p className="text-sm font-medium leading-7">{block.question}</p>
          </div>
          {block.follow && (
            <ul className="mr-8 mt-2 space-y-1 text-xs text-muted-foreground">
              {block.follow.map((f) => (
                <li key={f}>↳ {f}</li>
              ))}
            </ul>
          )}
        </div>
      );
  }
}

function MeetingPlanPage() {
  const total = 10 + 30 + 20 + 20;
  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-border bg-card">
        <div className="container-page flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold">
              سيرورة اجتماع الأساتذة
            </h1>
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> المدة الإجمالية ≈ {total} دقيقة · حوار قبل أن يكون عرضًا
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

      <main className="container-page space-y-6 py-8">
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <p className="text-sm leading-7 text-amber-900">
              تجنّب الحديث المطول عن المصطلحات التقنية مثل Knowledge Graph أو IRT أو الذكاء
              الاصطناعي في البداية. ما سيهم الأساتذة غالبًا هو: هل يساعدهم QED على فهم أخطاء
              التلاميذ وتوفير الوقت وتحسين المتابعة؟ إذا اقتنعوا بهذه القيمة، فالتفاصيل التقنية
              يمكن مناقشتها لاحقًا إذا سألوا عنها.
            </p>
          </div>
        </section>

        <div className="space-y-5">
          {sections.map((s) => (
            <section
              key={s.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
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

              <div className="mt-5 space-y-3">
                {s.blocks.map((b, i) => (
                  <BlockView key={i} block={b} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <MessageCircle className="h-5 w-5" />
            </span>
            <h2 className="font-display text-lg font-bold">الخاتمة</h2>
          </div>
          <div className="mt-4 space-y-2">
            {closingLines.map((line) => (
              <p key={line} className="text-sm leading-7">
                {line}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <Target className="h-5 w-5" />
            </span>
            <h2 className="font-display text-lg font-bold">لا تذهب بهدف واحد</h2>
          </div>
          <p className="mt-4 text-sm leading-7">
            لا تجعل هدفك <span className="font-semibold">توقيع شراكة</span>. بل اجعل أهدافك:
          </p>
          <ul className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            {goals.map((g) => (
              <li key={g} className="flex gap-2 rounded-lg border border-border p-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
          <blockquote className="mt-5 border-r-4 border-emerald-500 bg-emerald-50 p-4 text-sm leading-7">
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
