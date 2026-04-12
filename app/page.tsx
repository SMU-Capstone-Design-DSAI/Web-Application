"use client";

import { useMemo, useRef, useState } from "react";
import ChatBot from "@/components/ChatBot";
import DropzoneUploader from "@/components/DropzoneUploader";
import FeedbackCard from "@/components/FeedbackCard";
import ProgressBar from "@/components/ProgressBar";
import type {
  AnalyzeAudioResponse,
  AnalyzeMediaResponse,
  SummarizeRequest,
  SummarizeResponse
} from "@/components/types";

type TabKey = "media" | "audio" | "chat";

function toneFromPercent(p: number) {
  if (p >= 85) return "danger" as const;
  if (p >= 60) return "warn" as const;
  return "good" as const;
}

export default function Page() {
  const [tab, setTab] = useState<TabKey>("media");
  const chatAnchorRef = useRef<HTMLDivElement | null>(null);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [mediaResult, setMediaResult] = useState<AnalyzeMediaResponse | null>(null);
  const [audioResult, setAudioResult] = useState<AnalyzeAudioResponse | null>(null);
  const [summary, setSummary] = useState<SummarizeResponse | null>(null);

  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const mediaIsVideo = useMemo(() => {
    const t = mediaFile?.type ?? "";
    return t.startsWith("video/");
  }, [mediaFile]);

  function mergeSummarizeBody(
    next: Partial<SummarizeRequest>
  ): SummarizeRequest {
    return {
      mediaScore: next.mediaScore,
      audioScore: next.audioScore,
      mediaReasons: next.mediaReasons ?? [],
      audioReasons: next.audioReasons ?? [],
      contentSummary: next.contentSummary ?? ""
    };
  }

  async function analyzeMedia() {
    if (!mediaFile || loadingMedia) return;
    setLoadingMedia(true);
    setSummary(null);

    try {
      const fd = new FormData();
      fd.append("file", mediaFile);
      const res = await fetch("/api/analyze-media", { method: "POST", body: fd });
      const data = (await res.json()) as AnalyzeMediaResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "이미지/영상 분석 실패");
      setMediaResult(data);

      // 영상이고 음성이 있다고 판단되면 같은 파일로 음성 분석도 자동 호출
      let nextAudio: AnalyzeAudioResponse | null = null;
      if (mediaIsVideo && data.hasAudio) {
        const fd2 = new FormData();
        fd2.append("file", mediaFile);
        const resA = await fetch("/api/analyze-audio", { method: "POST", body: fd2 });
        const a = (await resA.json()) as AnalyzeAudioResponse & { error?: string };
        if (resA.ok) {
          nextAudio = a;
          setAudioResult(a);
        }
      }

      const res2 = await fetch("/api/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mergeSummarizeBody({
            mediaScore: data.manipulationScore,
            audioScore: nextAudio?.manipulationScore,
            mediaReasons: data.reasons,
            audioReasons: nextAudio?.reasons
          })
        )
      });
      const data2 = (await res2.json()) as SummarizeResponse & { error?: string };
      if (!res2.ok) throw new Error(data2.error || "종합 산출 실패");
      setSummary(data2);
    } catch {
      setSummary(null);
    } finally {
      setLoadingMedia(false);
    }
  }

  async function analyzeAudio() {
    if (!audioFile || loadingAudio) return;
    setLoadingAudio(true);
    setSummary(null);

    try {
      const fd = new FormData();
      fd.append("file", audioFile);
      const res = await fetch("/api/analyze-audio", { method: "POST", body: fd });
      const data = (await res.json()) as AnalyzeAudioResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "음성 분석 실패");
      setAudioResult(data);

      const res2 = await fetch("/api/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mergeSummarizeBody({
            audioScore: data.manipulationScore,
            audioReasons: data.reasons
          })
        )
      });
      const data2 = (await res2.json()) as SummarizeResponse & { error?: string };
      if (!res2.ok) throw new Error(data2.error || "종합 산출 실패");
      setSummary(data2);
    } catch {
      setSummary(null);
    } finally {
      setLoadingAudio(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-2">
          <div className="text-2xl font-bold tracking-tight text-white/95">
            금융 피싱 탐지 분석
          </div>
          <div className="text-sm text-white/65">
            파일 업로드 분석(이미지/영상, 음성)과 챗봇 상담을 한 화면에서 제공합니다.
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setTab("media")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === "media" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
              }`}
            >
              이미지 / 영상 업로드
            </button>
            <button
              type="button"
              onClick={() => setTab("audio")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === "audio" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
              }`}
            >
              음성 업로드
            </button>
            <button
              type="button"
              onClick={() => setTab("chat")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === "chat" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
              }`}
            >
              챗봇 상담
            </button>
          </div>
        </div>

        {tab === "media" ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <DropzoneUploader
                title="이미지/영상 업로드"
                hint="드래그앤드롭 지원 · jpg, png, mp4, mov"
                accept=".jpg,.jpeg,.png,.mp4,.mov,image/jpeg,image/png,video/mp4,video/quicktime"
                allowedExt={["jpg", "jpeg", "png", "mp4", "mov"]}
                onFileSelected={(f) => {
                  setMediaFile(f);
                  setMediaResult(null);
                  setSummary(null);
                }}
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => void analyzeMedia()}
                  disabled={!mediaFile || loadingMedia}
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMedia ? "분석 중…" : "분석 시작"}
                </button>
                <button
                  onClick={() => {
                    setMediaFile(null);
                    setMediaResult(null);
                    setSummary(null);
                  }}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  초기화
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
                {mediaIsVideo ? (
                  <>
                    <div className="font-semibold text-white/80">영상에서 음성 추출</div>
                    <div className="mt-1">
                      영상으로 감지되면 hasAudio=true일 때 음성 분석을 자동으로 추가 호출합니다.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold text-white/80">안내</div>
                    <div className="mt-1">
                      외부 API 호출을 위해 서버에 환경변수 설정이 필요합니다. (Docker 실행 시 compose에서
                      주입)
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <ProgressBar
                value={mediaResult ? mediaResult.manipulationScore : 0}
                label="AI 조작 가능성 %"
                tone={toneFromPercent(mediaResult ? mediaResult.manipulationScore : 0)}
              />

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white/90">판단 근거</div>
                {mediaResult?.reasons?.length ? (
                  <ul className="mt-3 list-disc space-y-1 rounded-lg border border-white/10 bg-black/20 p-3 pl-5 text-sm text-white/80">
                    {mediaResult.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/50">
                    아직 분석되지 않았습니다.
                  </div>
                )}
              </div>

              <FeedbackCard summary={summary} />
            </div>
          </div>
        ) : null}

        {tab === "audio" ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <DropzoneUploader
                title="음성 업로드"
                hint="드래그앤드롭 지원 · mp3, wav, m4a"
                accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a"
                allowedExt={["mp3", "wav", "m4a"]}
                onFileSelected={(f) => {
                  setAudioFile(f);
                  setAudioResult(null);
                  setSummary(null);
                }}
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => void analyzeAudio()}
                  disabled={!audioFile || loadingAudio}
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingAudio ? "분석 중…" : "분석 시작"}
                </button>
                <button
                  onClick={() => {
                    setAudioFile(null);
                    setAudioResult(null);
                    setSummary(null);
                  }}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  초기화
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
                외부 API 호출을 위해 서버에 환경변수 설정이 필요합니다. (Docker 실행 시 compose에서 주입)
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <ProgressBar
                value={audioResult ? audioResult.manipulationScore : 0}
                label="AI 조작 가능성 %"
                tone={toneFromPercent(audioResult ? audioResult.manipulationScore : 0)}
              />

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white/90">판단 근거</div>
                {audioResult?.reasons?.length ? (
                  <ul className="mt-3 list-disc space-y-1 rounded-lg border border-white/10 bg-black/20 p-3 pl-5 text-sm text-white/80">
                    {audioResult.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/50">
                    아직 분석되지 않았습니다.
                  </div>
                )}
              </div>

              <FeedbackCard summary={summary} />
            </div>
          </div>
        ) : null}

        {tab === "chat" ? (
          <div className="mt-6 space-y-4" ref={chatAnchorRef}>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              금융 피싱 전용 상담 챗봇입니다. 의심 상황/대화 내용을 붙여넣으면 위험 신호와 즉시 대응
              체크리스트를 정리해 드립니다.
            </div>
            <ChatBot />
          </div>
        ) : null}

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
          현재 화면은 세션 내에서만 상태를 유지합니다. (새로고침 시 업로드/결과가 초기화됩니다.)
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setTab("chat");
          setTimeout(() => chatAnchorRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
        }}
        className="fixed bottom-5 right-5 rounded-full bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/40 hover:bg-indigo-400"
      >
        챗봇 상담
      </button>
    </main>
  );
}

