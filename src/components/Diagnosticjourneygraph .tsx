import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Topic = { id: string; name_ar: string; parent_id?: string | null };
type Skill = { id: string; code: string; name_ar: string; topic_id?: string | null; prerequisites?: string[] | null };
type Misc = { id: string; skill_id: string; code: string; description_ar: string };

export type TrailStep = {
  id: string;
  label: string;
  topic: string; // skill name_ar this step belongs to
  correct: boolean;
  probe?: boolean;
  probeTag?: string | null;
};

export type Evidence = {
  fromQuestion: string;
  topic: string; // skill name_ar
  precise: boolean;
  skillLabel: string;
  note: string;
};

type Props = {
  topics: Topic[];
  skills: Skill[];
  misconceptions: Misc[];
  trail: TrailStep[];
  evidence: Evidence[];
  activeSkillId?: string | null;
  probeActive?: boolean;
};

const COL_TOPIC = 720;
const COL_SKILL = 400;
const COL_MISC = 90;
const ROW_H = 42;
const PAD_Y = 24;
const ORBIT_R = 26; // distance a repeated visit to the same skill is pushed out from center

export function DiagnosticJourneyGraph({
  topics,
  skills,
  misconceptions,
  trail,
  evidence,
  activeSkillId,
  probeActive = false,
}: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const layout = useMemo(() => {
    const byTopic = new Map<string, Skill[]>();
    for (const s of skills) {
      const k = s.topic_id ?? "__none__";
      if (!byTopic.has(k)) byTopic.set(k, []);
      byTopic.get(k)!.push(s);
    }
    const byMisc = new Map<string, Misc[]>();
    for (const m of misconceptions) {
      if (!byMisc.has(m.skill_id)) byMisc.set(m.skill_id, []);
      byMisc.get(m.skill_id)!.push(m);
    }

    let y = PAD_Y;
    const topicPos: { t: Topic; y: number }[] = [];
    const skillPos = new Map<string, { s: Skill; y: number; topicId: string }>();
    const miscPos = new Map<string, { m: Misc; y: number; skillId: string }>();
    const topicsToShow = topics.filter((t) => byTopic.has(t.id));

    for (const t of topicsToShow) {
      const ss = byTopic.get(t.id) ?? [];
      const topStart = y;
      for (const s of ss) {
        const ms = byMisc.get(s.id) ?? [];
        if (ms.length === 0) {
          skillPos.set(s.id, { s, y, topicId: t.id });
          y += ROW_H;
        } else {
          const miscBlockH = ms.length * (ROW_H - 6);
          const skillY = y + miscBlockH / 2 - ROW_H / 2;
          skillPos.set(s.id, { s, y: skillY, topicId: t.id });
          let my = y;
          for (const m of ms) {
            miscPos.set(m.id, { m, y: my, skillId: s.id });
            my += ROW_H - 6;
          }
          y = my;
        }
        y += 4;
      }
      topicPos.push({ t, y: (topStart + y) / 2 - ROW_H / 2 });
      y += 16;
    }
    return { topicPos, skillPos, miscPos, height: Math.max(y + PAD_Y, 260) };
  }, [topics, skills, misconceptions]);

  // Map skill name_ar -> id (trail/evidence only carry the name)
  const nameToSkillId = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of skills) m.set(s.name_ar, s.id);
    return m;
  }, [skills]);

  // Resolve each trail step to a screen point, orbiting repeats around the same skill node
  const journey = useMemo(() => {
    const visitCount = new Map<string, number>();
    const points: {
      x: number;
      y: number;
      correct: boolean;
      probe: boolean;
      step: TrailStep;
      idx: number;
    }[] = [];
    trail.forEach((t, idx) => {
      const sid = t.topic ? nameToSkillId.get(t.topic) : undefined;
      const sp = sid ? layout.skillPos.get(sid) : undefined;
      if (!sp) return;
      const n = visitCount.get(sp.s.id) ?? 0;
      visitCount.set(sp.s.id, n + 1);
      const angle = (n * 65 * Math.PI) / 180 + Math.PI / 2;
      const cx = COL_SKILL + 70 + (n === 0 ? 0 : Math.cos(angle) * ORBIT_R);
      const cy = sp.y + 14 + (n === 0 ? 0 : Math.sin(angle) * ORBIT_R);
      points.push({ x: cx, y: cy, correct: t.correct, probe: !!t.probe, step: t, idx });
    });
    return points;
  }, [trail, nameToSkillId, layout]);

  // If the last evidence entry pinpointed a misconception, extend the path to it
  const finalMiscPoint = useMemo(() => {
    const last = [...evidence].reverse().find((e) => e.precise);
    if (!last) return null;
    const sid = nameToSkillId.get(last.topic);
    if (!sid) return null;
    const ms = misconceptions.find((m) => m.skill_id === sid);
    if (!ms) return null;
    const mp = layout.miscPos.get(ms.id);
    if (!mp) return null;
    return { x: COL_MISC + 80, y: mp.y + 12, id: ms.id };
  }, [evidence, nameToSkillId, misconceptions, layout]);

  const pathD = useMemo(() => {
    if (journey.length === 0) return "";
    let d = `M${journey[0].x},${journey[0].y}`;
    for (let i = 1; i < journey.length; i++) {
      const a = journey[i - 1];
      const b = journey[i];
      const mx = (a.x + b.x) / 2;
      d += ` C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
    }
    if (finalMiscPoint) {
      const last = journey[journey.length - 1];
      const mx = (last.x + finalMiscPoint.x) / 2;
      d += ` C${mx},${last.y} ${mx},${finalMiscPoint.y} ${finalMiscPoint.x},${finalMiscPoint.y}`;
    }
    return d;
  }, [journey, finalMiscPoint]);

  const visitedSkillIds = new Set(
    trail.map((t) => (t.topic ? nameToSkillId.get(t.topic) : undefined)).filter(Boolean) as string[]
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-3 overflow-hidden">
      <div className="mb-2 flex items-center gap-4 px-2 text-[10px] text-muted-foreground">
        <span className="font-display font-bold text-ink text-xs">مسار التشخيص على الخريطة</span>
        <Legend color="bg-red-500" label="خطأ" />
        <Legend color="bg-amber-400" label="probe" />
        <Legend color="bg-emerald-500" label="نجاح" />
      </div>
      <div className="relative w-full overflow-x-auto" style={{ direction: "ltr" }}>
        <svg
          viewBox={`0 0 800 ${layout.height}`}
          width="100%"
          height={Math.min(layout.height, 520)}
          preserveAspectRatio="xMidYMin meet"
        >
          {/* static topic/skill/misconception structure, dimmed unless on the path */}
          {[...layout.skillPos.values()].map(({ s, y, topicId }) => {
            const t = layout.topicPos.find((x) => x.t.id === topicId);
            if (!t) return null;
            return (
              <path
                key={`ts-${s.id}`}
                d={`M${COL_TOPIC},${t.y + 14} C${(COL_TOPIC + COL_SKILL + 140) / 2},${t.y + 14} ${(COL_TOPIC + COL_SKILL + 140) / 2},${y + 14} ${COL_SKILL + 140},${y + 14}`}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth={1}
                opacity={visitedSkillIds.has(s.id) ? 0.6 : 0.25}
              />
            );
          })}

          {layout.topicPos.map(({ t, y }) => (
            <g key={t.id} transform={`translate(${COL_TOPIC}, ${y})`}>
              <rect width="72" height="28" rx="14" className="fill-ink" />
              <text x="36" y="18" textAnchor="middle" className="fill-parchment" style={{ fontSize: 10 }}>
                {truncate(t.name_ar, 10)}
              </text>
              <title>{t.name_ar}</title>
            </g>
          ))}

          {[...layout.skillPos.values()].map(({ s, y }) => {
            const isActive = s.id === activeSkillId;
            const isVisited = visitedSkillIds.has(s.id);
            const fill = isActive ? (probeActive ? "#f59e0b" : "hsl(var(--brand, 30 90% 55%))") : isVisited ? "#94a3b8" : "#e5e7eb";
            return (
              <g key={s.id} transform={`translate(${COL_SKILL}, ${y})`}>
                <rect width="140" height="28" rx="6" fill={fill} stroke={isActive ? "#0f172a" : "transparent"} strokeWidth={1.5} />
                <text x="70" y="18" textAnchor="middle" style={{ fontSize: 10 }} className={isActive || isVisited ? "fill-white" : "fill-ink"}>
                  {truncate(s.name_ar, 20)}
                </text>
                <title>{`${s.code} — ${s.name_ar}`}</title>
              </g>
            );
          })}

          {[...layout.miscPos.values()].map(({ m, y }) => {
            const isFinal = finalMiscPoint?.id === m.id;
            return (
              <g key={m.id} transform={`translate(${COL_MISC}, ${y})`} opacity={isFinal ? 1 : 0.4}>
                <circle cx="8" cy="12" r="5" fill={isFinal ? "#ef4444" : "#fecaca"} />
                <text x="20" y="16" style={{ fontSize: 9 }} className="fill-ink">
                  {truncate(m.description_ar || m.code, 26)}
                </text>
                <title>{m.description_ar}</title>
              </g>
            );
          })}

          {/* the merged trail path itself */}
          {pathD && (
            <motion.path
              d={pathD}
              fill="none"
              stroke="#0f172a"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.8}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6 }}
            />
          )}

          <AnimatePresence>
            {journey.map((p) => {
              const color = p.probe ? "#f59e0b" : p.correct ? "#10b981" : "#ef4444";
              const isHover = hoverIdx === p.idx;
              return (
                <motion.g
                  key={p.step.id + p.idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: p.idx * 0.05 }}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoverIdx(p.idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                >
                  {isHover && (
                    <circle cx={p.x} cy={p.y} r={16} fill={color} opacity={0.25} />
                  )}
                  <circle cx={p.x} cy={p.y} r={11} fill={color} stroke="#0f172a" strokeWidth={1} />
                  <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 10, fontWeight: 500 }} className="fill-white">
                    {p.idx + 1}
                  </text>
                  <title>
                    {`${p.idx + 1}. ${p.step.probe ? `probe${p.step.probeTag ? ` · ${p.step.probeTag}` : ""}` : "سؤال رئيسي"} — ${p.step.correct ? "صحيح" : "غير صحيح"}\n${p.step.label}`}
                  </title>
                </motion.g>
              );
            })}
            {finalMiscPoint && (
              <motion.circle
                cx={finalMiscPoint.x}
                cy={finalMiscPoint.y}
                r={11}
                fill="#ef4444"
                stroke="#0f172a"
                strokeWidth={1}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: journey.length * 0.05 }}
              />
            )}
          </AnimatePresence>
        </svg>
      </div>

      {/* inline detail for whichever step is hovered, replacing the old separate list */}
      <div className="mt-2 min-h-[32px] px-2 text-[11px] text-muted-foreground">
        {hoverIdx !== null && journey[hoverIdx] ? (
          <span>
            <span className="font-mono text-[9px] mr-1">#{hoverIdx + 1}</span>
            {journey[hoverIdx].step.probeTag && (
              <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] text-amber-900 mr-1">
                {journey[hoverIdx].step.probeTag}
              </span>
            )}
            {journey[hoverIdx].step.label}
          </span>
        ) : (
          <span>مرّر المؤشر فوق أي خطوة رقمية في المسار لعرض تفاصيلها.</span>
        )}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function truncate(s: string, n: number) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
