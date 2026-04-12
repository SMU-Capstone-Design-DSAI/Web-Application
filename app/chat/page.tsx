"use client";

import ChatBot from "@/components/ChatBot";

export default function ChatPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-2xl font-bold tracking-tight text-white/95">종합 판단 챗봇</div>
          <a className="text-sm text-indigo-300 underline" href="/">
            메인으로
          </a>
        </div>
        <div className="mt-6">
          <ChatBot />
        </div>
      </div>
    </main>
  );
}

