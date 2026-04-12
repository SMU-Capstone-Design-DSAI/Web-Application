"use client";

import type { SummarizeResponse } from "./types";

type Props = {
  summary: SummarizeResponse | null;
};

function levelPill(level: SummarizeResponse["riskLevel"]) {
  if (level === "낮음") return "bg-emerald-500/15 text-emerald-200 border-emerald-400/20";
  if (level === "중간") return "bg-amber-500/15 text-amber-200 border-amber-400/20";
  if (level === "높음") return "bg-rose-500/15 text-rose-200 border-rose-400/20";
  return "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/20";
}

export default function FeedbackCard({ summary }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-white/90">GPT 종합 피드백</div>
        <div
          className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold ${levelPill(
            summary?.riskLevel ?? "낮음"
          )}`}
        >
          위험도: {summary?.riskLevel ?? "낮음"}
        </div>
      </div>

      {summary ? (
        <>
          <div className="mt-2 text-xs text-white/70">종합 점수: {summary.riskScore}/100</div>
          <div className="mt-3 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/85">
            {summary.feedback?.trim() ? summary.feedback : "피드백이 비어 있습니다."}
          </div>
          {summary.warnings?.length ? (
            <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="text-xs font-semibold text-white/70">주의/경고</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
                {summary.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-3 text-sm text-white/50">아직 종합 피드백이 없습니다.</div>
      )}
    </div>
  );
}

