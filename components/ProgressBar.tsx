"use client";

type Props = {
  value: number; // 0-100
  label?: string;
  tone?: "good" | "warn" | "danger";
};

function toneClass(tone: NonNullable<Props["tone"]>) {
  if (tone === "good") return "bg-emerald-500";
  if (tone === "warn") return "bg-amber-500";
  return "bg-rose-500";
}

export default function ProgressBar({ value, label, tone = "warn" }: Props) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white/90">{label ?? "AI 조작 가능성"}</div>
        <div className="text-xs text-white/70">{v}%</div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-white/10">
        <div className={`h-2 rounded-full ${toneClass(tone)}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

