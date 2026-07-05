import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listVisits } from "@/lib/visits.functions";
import { isCurrentUserAdmin } from "@/lib/applications.functions";
import { ShieldAlert, ArrowRight, Globe } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/visits")({
  component: VisitsPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-destructive">{error.message}</div>
  ),
});

const SOURCE_LABELS: Record<string, string> = {
  facebook: "فيسبوك",
  instagram: "إنستغرام",
  twitter: "تويتر / X",
  linkedin: "لينكدإن",
  whatsapp: "واتساب",
  telegram: "تلغرام",
  tiktok: "تيك توك",
  youtube: "يوتيوب",
  google: "بحث Google",
  bing: "بحث Bing",
  direct: "مباشر",
  internal: "تنقل داخلي",
  unknown: "غير معروف",
};

const SOURCE_TONE: Record<string, string> = {
  facebook: "bg-blue-100 text-blue-900",
  instagram: "bg-pink-100 text-pink-900",
  whatsapp: "bg-emerald-100 text-emerald-900",
  telegram: "bg-sky-100 text-sky-900",
  google: "bg-amber-100 text-amber-900",
  direct: "bg-secondary text-foreground",
  internal: "bg-muted text-muted-foreground",
};

function fmt(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString("ar-DZ", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function VisitsPage() {
  const listFn = useServerFn(listVisits);
  const adminFn = useServerFn(isCurrentUserAdmin);
  const roleQ = useQuery({ queryKey: ["me:isAdmin"], queryFn: () => adminFn() });
  const q = useQuery({
    queryKey: ["visits"],
    queryFn: () => listFn(),
    enabled: roleQ.data?.isAdmin === true,
    refetchInterval: 15000,
  });

  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");

  const rows = q.data ?? [];
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (source && r.referrer_source !== source) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = `${r.path} ${r.city ?? ""} ${r.country ?? ""} ${r.referrer ?? ""} ${r.ip ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [rows, source, search]);

  const bySource = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const key = r.referrer_source ?? "unknown";
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const uniqueSessions = useMemo(
    () => new Set(rows.map((r) => r.session_id).filter(Boolean)).size,
    [rows],
  );

  if (roleQ.isLoading)
    return <div className="p-8 text-center text-sm text-muted-foreground">جارٍ التحقق...</div>;
  if (!roleQ.data?.isAdmin) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 font-display text-xl font-bold">غير مصرح لك</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-border bg-card">
        <div className="container-page py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowRight className="h-3 w-3" /> عودة للطلبات
            </Link>
            <h1 className="mt-1 font-display text-xl font-bold">زيارات الموقع</h1>
            <p className="text-xs text-muted-foreground">
              {rows.length} زيارة · {uniqueSessions} جلسة فريدة
            </p>
          </div>
        </div>
      </header>

      <main className="container-page py-6 space-y-6">
        {/* Source summary */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {bySource.map(([src, count]) => (
            <button
              key={src}
              onClick={() => setSource(source === src ? "" : src)}
              className={`rounded-xl border p-3 text-start transition ${
                source === src ? "border-brand bg-brand/5" : "border-border bg-card hover:bg-secondary/50"
              }`}
            >
              <p className="text-2xl font-bold font-display">{count}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {SOURCE_LABELS[src] ?? src}
              </p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في الصفحة / المدينة / البلد / IP"
            className="md:col-span-2 rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          />
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="">كل المصادر</option>
            {bySource.map(([src]) => (
              <option key={src} value={src}>{SOURCE_LABELS[src] ?? src}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {q.isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">لا توجد زيارات</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs">
                  <tr>
                    <th className="p-3 text-start font-medium">الوقت</th>
                    <th className="p-3 text-start font-medium">المصدر</th>
                    <th className="p-3 text-start font-medium">الصفحة</th>
                    <th className="p-3 text-start font-medium">الموقع</th>
                    <th className="p-3 text-start font-medium">الجهاز</th>
                    <th className="p-3 text-start font-medium">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => {
                    const src = r.referrer_source ?? "unknown";
                    return (
                      <tr key={r.id} className="hover:bg-secondary/30">
                        <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                          {fmt(r.created_at)}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${SOURCE_TONE[src] ?? "bg-secondary"}`}>
                            {SOURCE_LABELS[src] ?? src}
                          </span>
                          {r.utm_campaign && (
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              حملة: {r.utm_campaign}
                            </p>
                          )}
                        </td>
                        <td className="p-3">
                          <p className="max-w-[220px] truncate font-mono text-xs" dir="ltr">
                            {r.path}
                          </p>
                          {r.referrer && (
                            <p className="max-w-[220px] truncate text-[10px] text-muted-foreground" dir="ltr" title={r.referrer}>
                              {r.referrer}
                            </p>
                          )}
                        </td>
                        <td className="p-3">
                          {r.city || r.country ? (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">
                                {[r.city, r.region, r.country ?? r.country_code].filter(Boolean).join("، ")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3 text-xs">{r.device_type ?? "—"}</td>
                        <td className="p-3">
                          <span className="font-mono text-[10px] text-muted-foreground" dir="ltr">
                            {r.ip ?? "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
