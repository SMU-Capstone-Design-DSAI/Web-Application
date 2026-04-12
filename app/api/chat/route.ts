import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT =
  "당신은 금융 피싱 상담 전문가입니다. 보이스피싱/스미싱/파밍/메신저 피싱/대출 사기/가상자산 사기 등 다양한 유형을 구체적으로 안내하고, 사용자의 상황에 맞는 즉시 대응 체크리스트(차단/신고/계좌 지급정지/원격앱 삭제/통신사 조치)를 단계적으로 제시하세요. 민감정보(계좌/인증번호/주민번호 등)를 요구하지 말고, 법적/의료적 확정 표현은 피하세요.";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "서버 환경변수(OPENAI_API_KEY)가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => null)) as { history?: ChatMessage[] } | null;
  const history = Array.isArray(body?.history) ? body!.history : null;
  if (!history || !history.length) {
    return NextResponse.json({ error: "history 배열이 필요합니다." }, { status: 400 });
  }

  const safeHistory: ChatMessage[] = history
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-30);

  if (!safeHistory.length) {
    return NextResponse.json({ error: "유효한 history가 없습니다." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...safeHistory],
    temperature: 0.2
  });

  const reply = completion.choices?.[0]?.message?.content ?? "";
  return NextResponse.json({ reply });
}

