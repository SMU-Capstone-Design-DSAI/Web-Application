import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type SummarizeRequest = {
  mediaScore?: number;
  audioScore?: number;
  mediaReasons?: string[];
  audioReasons?: string[];
  contentSummary?: string;
};

type SummarizeResponse = {
  riskLevel: "낮음" | "중간" | "높음" | "매우높음";
  riskScore: number;
  feedback: string;
  warnings: string[];
};

const SYSTEM_PROMPT = `당신은 금융 피싱 탐지 전문가입니다. 
제공된 AI 분석 결과(영상/이미지 조작 가능성, 음성 조작 가능성)와
콘텐츠 내용을 바탕으로 금융 피싱 위험도를 판단하세요.
응답은 JSON으로: { riskLevel: "낮음"|"중간"|"높음"|"매우높음", riskScore: 0-100, feedback: string, warnings: string[] }`;

function clampScore(n: unknown) {
  const v = typeof n === "number" ? n : Number.NaN;
  if (!Number.isFinite(v)) return undefined;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function safeStringArray(v: unknown) {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string") as string[];
}

function fallback(body: SummarizeRequest): SummarizeResponse {
  const mediaScore = clampScore(body.mediaScore) ?? 0;
  const audioScore = clampScore(body.audioScore) ?? 0;
  const score = Math.max(mediaScore, audioScore);
  const riskLevel: SummarizeResponse["riskLevel"] =
    score >= 85 ? "매우높음" : score >= 70 ? "높음" : score >= 40 ? "중간" : "낮음";
  return {
    riskLevel,
    riskScore: score,
    feedback:
      "현재는 GPT 요약을 사용할 수 없어(OPENAI_API_KEY 미설정) 점수를 기반으로 임시 요약을 제공합니다.\n\n" +
      "- 기관 사칭 + 이체/앱설치/인증 유도는 즉시 중단\n" +
      "- 대표번호로 직접 재확인\n" +
      "- 원격제어/OTP/인증번호 요구는 고위험 신호",
    warnings: [
      "상대가 긴급성을 강조하며 이체를 요구하면 즉시 중단하세요.",
      "앱 설치(원격제어), 인증번호/OTP 입력 요구는 매우 위험합니다."
    ]
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as SummarizeRequest | null;
  if (!body) {
    return NextResponse.json({ error: "요청 body가 필요합니다." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(fallback(body));
  }

  const client = new OpenAI({ apiKey });

  const userPayload = {
    mediaScore: clampScore(body.mediaScore),
    audioScore: clampScore(body.audioScore),
    mediaReasons: safeStringArray(body.mediaReasons),
    audioReasons: safeStringArray(body.audioReasons),
    contentSummary: typeof body.contentSummary === "string" ? body.contentSummary : ""
  };

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            "다음 입력을 바탕으로 요구된 JSON 스키마 그대로만 출력하세요.\n\n" +
            JSON.stringify(userPayload)
        }
      ]
    });

    const text = completion.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(text) as Partial<SummarizeResponse>;

    const riskLevel = parsed.riskLevel;
    const riskScore = clampScore(parsed.riskScore) ?? clampScore(userPayload.mediaScore) ?? 0;
    const feedback = typeof parsed.feedback === "string" ? parsed.feedback : "";
    const warnings = safeStringArray(parsed.warnings);

    if (
      riskLevel !== "낮음" &&
      riskLevel !== "중간" &&
      riskLevel !== "높음" &&
      riskLevel !== "매우높음"
    ) {
      return NextResponse.json(fallback(body));
    }

    return NextResponse.json({ riskLevel, riskScore, feedback, warnings } satisfies SummarizeResponse);
  } catch {
    return NextResponse.json(fallback(body));
  }
}

