import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Topic = { id: string; name_ar: string; parent_id?: string | null };
type Skill = { id: string; code: string; name_ar: string; topic_id?: string | null; prerequisites?: string[] | null };
type Misc = { id: string; skill_id: string; code: string; description_ar: string };

type Props = {
  topics: Topic[];
  skills: Skill[];
  misconceptions: Misc[];
  activeSkillId?: string | null;
  visitedSkillIds?: string[];
  correctSkillIds?: string[];
  wrongSkillIds?: string[];
  activeMisconceptionIds?: string[];
  probeActive?: boolean;
};

const COL_TOPIC = 720;
const COL_SKILL = 400;
const COL_MISC = 90;
const ROW_H = 42;
const PAD_Y = 24;

export function DiagnosticGraph({
  topics,
  skills,
  misconceptions,
  activeSkillId,
  visitedSkillIds = [],
  correctSkillIds = [],
  wrongSkillIds = [],
  activeMisconceptionIds = [],
  probeActive = false,
}: Props) {
  const layout = useMemo(() => {
    // group skills by topic
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
    const topicPos: { t: Topic; y: number; height: number }[] = [];
    const skillPos = new Map<string, { s: Skill; y: number; topicId: string }>();
    const miscPos = new Map<string, { m: Misc; y: number; skillId: string }>();

    const topicsToShow = topics.filter((t) => byTopic.has(t.id));

    for (const t of topicsToShow) {
      const ss = byTopic.get(t.id) ?? [];
      const topStart = y;
      for (const s of ss) {
        const ms = byMisc.get(s.id) ?? [];
        const skillStart = y;
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
        void skillStart;
      }
      const topEnd = y;
      topicPos.push({ t, y: (topStart + topEnd) / 2 - ROW_H / 2, height: topEnd - topStart });
      y += 16;
    }

    return { topicPos, skillPos, miscPos, height: Math.max(y + PAD_Y, 260) };
  }, [topics, skills, misconceptions]);

  const visited = new Set(visitedSkillIds);
  const correct = new Set(correctSkillIds);
  const wrong = new Set(wrongSkillIds);
  const activeMisc = new Set(activeMisconceptionIds);

  return (
    <div className="rounded-2xl border border-border bg-card p-3 overflow-hidden">
      <div className="mb-2 flex items-center gap-4 px-2 text-[10px] text-muted-foreground">
        <span className="font-display font-bold text-ink text-xs">خريطة التشخيص</span>
        <Legend color="bg-ink" label="موضوع" />
        <Legend color="bg-brand" label="مهارة" />
        <Legend color="bg-red-500" label="مفهوم خاطئ" />
        <Legend color="bg-emerald-500" label="نجاح" />
        <Legend color="bg-amber-400" label="probe نشط" />
      </div>
      <div className="relative w-full overflow-x-auto" style={{ direction: "ltr" }}>
        <svg
          viewBox={`0 0 800 ${layout.height}`}
          width="100%"
          height={Math.min(layout.height, 520)}
          preserveAspectRatio="xMidYMin meet"
        >
          {/* topic → skill edges */}
          {[...layout.skillPos.values()].map(({ s, y, topicId }) => {
            const t = layout.topicPos.find((x) => x.t.id === topicId);
            if (!t) return null;
            const active = s.id === activeSkillId;
            const isVisited = visited.has(s.id);
            return (
              <EdgePath
                key={`ts-${s.id}`}
                x1={COL_TOPIC}
                y1={t.y + 14}
                x2={COL_SKILL + 140}
                y2={y + 14}
                active={active}
                dim={!active && !isVisited}
                probe={active && probeActive}
              />
            );
          })}
          {/* skill → misconception edges */}
          {[...layout.miscPos.values()].map(({ m, y, skillId }) => {
            const sp = layout.skillPos.get(skillId);
            if (!sp) return null;
            const isActiveM = activeMisc.has(m.id);
            return (
              <EdgePath
                key={`sm-${m.id}`}
                x1={COL_SKILL}
                y1={sp.y + 14}
                x2={COL_MISC + 80}
                y2={y + 12}
                active={isActiveM}
                dim={!isActiveM}
                red={isActiveM}
              />
            );
          })}

          {/* topic nodes */}
          {layout.topicPos.map(({ t, y }) => (
            <g key={t.id} transform={`translate(${COL_TOPIC}, ${y})`}>
              <rect width="72" height="28" rx="14" className="fill-ink" />
              <text
                x="36"
                y="18"
                textAnchor="middle"
                className="fill-parchment"
                style={{ fontSize: 10, fontFamily: "inherit" }}
              >
                {truncate(t.name_ar, 10)}
              </text>
              <title>{t.name_ar}</title>
            </g>
          ))}

          {/* skill nodes */}
          {[...layout.skillPos.values()].map(({ s, y }) => {
            const isActive = s.id === activeSkillId;
            const isCorrect = correct.has(s.id);
            const isWrong = wrong.has(s.id);
            const isVisited = visited.has(s.id);
            const fill = isActive
              ? probeActive
                ? "#f59e0b"
                : "hsl(var(--brand, 30 90% 55%))"
              : isWrong
              ? "#ef4444"
              : isCorrect
              ? "#10b981"
              : isVisited
              ? "#94a3b8"
              : "#e5e7eb";
            const stroke = isActive ? "#0f172a" : "transparent";
            return (
              <g key={s.id} transform={`translate(${COL_SKILL}, ${y})`}>
                {isActive && (
                  <motion.circle
                    cx="70"
                    cy="14"
                    r="14"
                    fill="none"
                    stroke={probeActive ? "#f59e0b" : "#0f172a"}
                    strokeWidth={2}
                    initial={{ opacity: 0.6, scale: 1 }}
                    animate={{ opacity: [0.6, 0, 0.6], scale: [1, 2.2, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <motion.rect
                  width="140"
                  height="28"
                  rx="6"
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1.5}
                  initial={false}
                  animate={{ fill }}
                  transition={{ duration: 0.35 }}
                />
                <text
                  x="70"
                  y="18"
                  textAnchor="middle"
                  style={{ fontSize: 10, fontFamily: "inherit" }}
                  className={isActive || isWrong || isCorrect ? "fill-white" : "fill-ink"}
                >
                  {truncate(s.name_ar, 20)}
                </text>
                <title>{`${s.code} — ${s.name_ar}`}</title>
              </g>
            );
          })}

          {/* misconception nodes */}
          <AnimatePresence>
            {[...layout.miscPos.values()].map(({ m, y }) => {
              const isActive = activeMisc.has(m.id);
              return (
                <motion.g
                  key={m.id}
                  transform={`translate(${COL_MISC}, ${y})`}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: isActive ? 1 : 0.55 }}
                >
                  {isActive && (
                    <motion.circle
                      cx="8"
                      cy="12"
                      r="6"
                      fill="#ef4444"
                      opacity={0.4}
                      animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                  )}
                  <circle cx="8" cy="12" r="5" fill={isActive ? "#ef4444" : "#fecaca"} />
                  <text x="20" y="16" style={{ fontSize: 9, fontFamily: "inherit" }} className="fill-ink">
                    {truncate(m.description_ar || m.code, 26)}
                  </text>
                  <title>{m.description_ar}</title>
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>
      </div>
    </div>
  );
}

function EdgePath({
  x1,
  y1,
  x2,
  y2,
  active,
  dim,
  probe,
  red,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active?: boolean;
  dim?: boolean;
  probe?: boolean;
  red?: boolean;
}) {
  const mx = (x1 + x2) / 2;
  const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  const stroke = red ? "#ef4444" : probe ? "#f59e0b" : active ? "#0f172a" : "#cbd5e1";
  return (
    <g>
      <path d={d} fill="none" stroke={stroke} strokeWidth={active ? 2 : 1} opacity={dim ? 0.35 : 0.9} />
      {active && (
        <motion.circle
          r={3.5}
          fill={stroke}
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ offsetPath: `path("${d}")`, offsetRotate: "0deg" } as any}
        />
      )}
    </g>
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
