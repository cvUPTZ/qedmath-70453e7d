import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/apply/success")({
  component: SuccessPage,
});

function SuccessPage() {
  return (
    <div className="min-h-screen bg-parchment text-ink flex items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent text-brand">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">
          شكرًا لك
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          سيقوم فريق QED بمراجعة الطلب بعناية، وقد يتم التواصل معك لإجراء مقابلة
          علمية أو جلسة عمل تجريبية إذا كان ملفك مناسبًا.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-parchment hover:opacity-90"
        >
          العودة للصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
