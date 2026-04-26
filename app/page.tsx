"use client";

import { useMemo, useRef, useState } from "react";
import ChatBot from "@/components/ChatBot";
import DropzoneUploader from "@/components/DropzoneUploader";
import ProgressBar from "@/components/ProgressBar";
import type { AnalyzeAudioResponse, AnalyzeMediaResponse } from "@/components/types";

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

  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const mediaIsVideo = useMemo(() => {
    const t = mediaFile?.type ?? "";
    return t.startsWith("video/");
  }, [mediaFile]);

  async function analyzeMedia() {
    if (!mediaFile || loadingMedia) return;
    setLoadingMedia(true);

    try {
      const fd = new FormData();
      fd.append("file", mediaFile);
      const res = await fetch("/api/analyze-media", { method: "POST", body: fd });
      const data = (await res.json()) as AnalyzeMediaResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "이미지/영상 분석 실패");
      setMediaResult(data);

      if (mediaIsVideo && data.hasAudio) {
        const fd2 = new FormData();
        fd2.append("file", mediaFile);
        const resA = await fetch("/api/analyze-audio", { method: "POST", body: fd2 });
        const a = (await resA.json()) as AnalyzeAudioResponse & { error?: string };
        if (resA.ok) {
          setAudioResult(a);
        }
      } else {
        setAudioResult(null);
      }
    } catch {
      setMediaResult(null);
    } finally {
      setLoadingMedia(false);
    }
  }

  async function analyzeAudio() {
    if (!audioFile || loadingAudio) return;
    setLoadingAudio(true);

    try {
      const fd = new FormData();
      fd.append("file", audioFile);
      const res = await fetch("/api/analyze-audio", { method: "POST", body: fd });
      const data = (await res.json()) as AnalyzeAudioResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "음성 분석 실패");
      setAudioResult(data);
    } catch {
      setAudioResult(null);
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
                  }}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  초기화
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
                {mediaIsVideo ? (
                  <>
                    <div className="font-semibold text-white/80">영상 + 음성</div>
                    <div className="mt-1">
                      영상이면 음성 탭과 동일한 점수 체계로 음성 경로를 추가로 분석해 두었을 수 있습니다(탐지기
                      제약에 따라).
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold text-white/80">이미지 히트맵</div>
                    <div className="mt-1">
                      로컬 AI 탐지 API 사용 시, 모델이 판정에 민감하게 반응한 영역을 겹쳐 보여 드립니다.
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

              {mediaIsVideo && mediaResult ? (
                <div className="rounded-xl border border-white/10 border-dashed border-amber-400/30 bg-amber-500/5 p-3 text-sm text-amber-100/80">
                  영상은 프레임 단위 공간 히트맵이 아직 지원되지 않습니다. 아래 &quot;판단 근거&quot; 텍스트로 요약을
                  확인하세요.
                </div>
              ) : null}

              {!mediaIsVideo && mediaResult ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white/90">공간 히트맵 (어느 영역을 판정에 썼는지)</div>
                  {mediaResult.saliencyPngDataUrl ? (
                    <>
                      <p className="mt-1 text-xs text-white/60">
                        {mediaResult.saliencyCaption ||
                          "빨강·노랑에 가깝을수록 모델이 판정(인공 vs 실제)에 더 민감하게 반응한 곳입니다."}
                      </p>
                      <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mediaResult.saliencyPngDataUrl}
                          alt="모델 민감도 히트맵이 겹쳐진 이미지"
                          className="h-auto w-full object-contain"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="mt-2 space-y-2 text-sm text-white/80">
                      <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-100/90">
                        {mediaResult.saliencyNotice
                          ? mediaResult.saliencyNotice
                          : mediaResult.saliencyCaption
                            ? mediaResult.saliencyCaption
                            : "히트맵 이미지가 오지 않았습니다. 로컬 AI 탐지 API(detector)가 연결돼 있고, 모델 히트맵 생성이 성공한 경우에만 색이 겹친 이미지가 표시됩니다."}
                      </p>
                    </div>
                  )}
                </div>
              ) : null}

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
                  }}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  초기화
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
                외부 API가 필요한 경우 서버(또는 Docker)에 환경 변수를 넣어 주세요.
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
