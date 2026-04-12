"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "./types";

export default function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "안녕하세요. 의심되는 연락/대화 내용을 붙여넣거나 상황을 설명해 주세요. 피싱 가능성을 근거와 함께 정리해 드릴게요."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    setMessages((m) => [...m, { role: "user", content: text }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ history: [...messages, { role: "user", content: text }] })
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "채팅 요청 실패");
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            e instanceof Error
              ? `오류: ${e.message}`
              : "오류: 채팅 처리 중 문제가 발생했습니다."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-white/90">종합 판단 챗봇</div>

      <div className="mt-3 h-[420px] overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-3">
        <div className="space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-[92%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-indigo-500/20 text-white/90"
                  : "mr-auto bg-white/10 text-white/85"
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading ? (
            <div className="mr-auto max-w-[92%] rounded-lg bg-white/10 px-3 py-2 text-sm text-white/70">
              답변 생성 중…
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="예) '검찰입니다. 계좌가 범죄에…' 라는 연락을 받았어요"
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
        />
        <button
          onClick={() => void send()}
          disabled={loading}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          전송
        </button>
      </div>
    </div>
  );
}

