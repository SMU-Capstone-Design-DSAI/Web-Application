"use client";

type Props = {
  score: number; // 0-100
  level: "low" | "medium" | "high" | "very_high";
};

function levelText(level: Props["level"]) {
  if (level === "low") return "낮음";
  if (level === "medium") return "중간";
  if (level === "high") return "높음";
  return "매우높음";
}

function levelColor(level: Props["level"]) {
  if (level === "low") return "bg-emerald-500";
  if (level === "medium") return "bg-amber-500";
  if (level === "high") return "bg-rose-500";
  return "bg-fuchsia-500";
}

export default function RiskMeter({ score, level }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white/90">종합 위험도</div>
        <div className="text-xs text-white/70">
          {levelText(level)} · {clamped}/100
        </div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-white/10">
        <div
          className={`h-2 rounded-full ${levelColor(level)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

