"use client";

import type { AnalyzeAudioResponse, AnalyzeMediaResponse, SummarizeResponse } from "./types";

type Props = {
  mediaResult?: AnalyzeMediaResponse | null;
  audioResult?: AnalyzeAudioResponse | null;
  summary?: SummarizeResponse | null;
};

export default function ResultPanel({ mediaResult, audioResult, summary }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-white/90">분석 결과</div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="text-xs font-semibold text-white/70">이미지/영상</div>
          {mediaResult ? (
            <div className="mt-2 text-sm text-white/90">
              <div>조작 가능성: {mediaResult.manipulationScore}%</div>
              {mediaResult.reasons?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-white/80">
                  {mediaResult.reasons.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <div className="mt-2 text-sm text-white/50">아직 분석되지 않았습니다.</div>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="text-xs font-semibold text-white/70">음성</div>
          {audioResult ? (
            <div className="mt-2 text-sm text-white/90">
              <div>조작 가능성: {audioResult.manipulationScore}%</div>
              {audioResult.reasons?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-white/80">
                  {audioResult.reasons.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <div className="mt-2 text-sm text-white/50">아직 분석되지 않았습니다.</div>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
        <div className="text-xs font-semibold text-white/70">요약</div>
        {summary ? (
          <div className="mt-2 text-sm text-white/90">
            <div>위험도: {summary.riskLevel}</div>
            <div>점수: {summary.riskScore}/100</div>
            {summary.warnings?.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-white/80">
                {summary.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="mt-2 text-sm text-white/50">아직 종합되지 않았습니다.</div>
        )}
      </div>
    </div>
  );
}

