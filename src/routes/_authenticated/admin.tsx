import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listApplications, isCurrentUserAdmin } from "@/lib/applications.functions";
import { supabase } from "@/integrations/supabase/client";
import { Search, LogOut, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminList,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-muted-foreground">{error.message}</div>
  ),
});

const STATUSES = [
  { value: "new", label: "جديد", tone: "bg-blue-100 text-blue-900" },
  { value: "reviewing", label: "قيد المراجعة", tone: "bg-amber-100 text-amber-900" },
  { value: "interview", label: "مقابلة", tone: "bg-purple-100 text-purple-900" },
  { value: "trial", label: "تجربة عملية", tone: "bg-indigo-100 text-indigo-900" },
  { value: "accepted", label: "مقبول", tone: "bg-emerald-100 text-emerald-900" },
  { value: "rejected", label: "مرفوض", tone: "bg-red-100 text-red-900" },
] as const;

export function statusLabel(s: string) {
  return STATUSES.find((x) => x.value === s)?.label ?? s;
}
export function statusTone(s: string) {
  return STATUSES.find((x) => x.value === s)?.tone ?? "bg-secondary";
}

function AdminList() {
  const navigate = useNavigate();
  const listFn = useServerFn(listApplications);
  const isAdminFn = useServerFn(isCurrentUserAdmin);

  const roleQ = useQuery({ queryKey: ["me:isAdmin"], queryFn: () => isAdminFn() });
  const q = useQuery({
    queryKey: ["applications"],
    queryFn: () => listFn(),
    enabled: roleQ.data?.isAdmin === true,
  });

  const [search, setSearch] = useState("");
  const [minExp, setMinExp] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const rows = q.data ?? [];
    return rows.filter((r) => {
      if (search) {
        const s = search.toLowerCase();
        if (!r.full_name.toLowerCase().includes(s) && !r.wilaya.toLowerCase().includes(s)) return false;
      }
      if (minExp && r.years_experience < Number(minExp)) return false;
      if (level && !(r.levels_taught ?? []).includes(level)) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }, [q.data, search, minExp, level, status]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (roleQ.isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">جارٍ التحقق...</div>;
  if (!roleQ.data?.isAdmin) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 font-display text-xl font-bold">غير مصرح لك</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            هذا الحساب ليس لديه صلاحية مشرف. اطلب من مسؤول قاعدة البيانات إضافة دورك.
          </p>
          <button onClick={signOut} className="mt-6 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-parchment">
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-border bg-card">
        <div className="container-page grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold">لوحة إدارة الطلبات</h1>
            <p className="text-xs text-muted-foreground">{filtered.length} طلب</p>
          </div>
          <button onClick={signOut} className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <LogOut className="h-4 w-4" /> خروج
          </button>
        </div>
      </header>

      <main className="container-page py-8">
        {/* Filters */}
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الولاية"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pe-9 text-sm"
            />
          </div>
          <input
            type="number"
            min={0}
            value={minExp}
            onChange={(e) => setMinExp(e.target.value)}
            placeholder="سنوات الخبرة (الحد الأدنى)"
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <option value="">كل الحالات</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={level} onChange={(e) => setLevel(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm md:col-span-4">
            <option value="">كل المستويات</option>
            {["متوسط", "ثانوي", "جامعي", "تعليم خاص"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* List */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          {q.isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>
          ) : q.error ? (
            <div className="p-8 text-center text-sm text-destructive">
              حدث خطأ أثناء تحميل الطلبات: {(q.error as Error).message}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">لا توجد طلبات</div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((r) => (
                <li key={r.id}>
                  <Link
                    to="/admin/$id"
                    params={{ id: r.id }}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5 hover:bg-secondary/50"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-display text-lg font-bold">{r.full_name}</p>
                        <span className={"rounded-full px-2 py-0.5 text-xs " + statusTone(r.status)}>
                          {statusLabel(r.status)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {r.wilaya} · {r.years_experience} سنة · {(r.levels_taught ?? []).join("، ")}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">{r.email}</p>
                    </div>
                    <div className="shrink-0 text-center">
                      {r.ai_score != null ? (
                        <>
                          <p className="font-display text-2xl font-bold text-brand">{r.ai_score}</p>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">AI Score</p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">جارٍ التقييم</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
