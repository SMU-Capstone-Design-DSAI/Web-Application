import { NextResponse } from "next/server";

export const runtime = "nodejs";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function normalizeHf(raw: unknown) {
  const arr = Array.isArray(raw) ? raw : null;
  const first = arr?.[0] as { label?: unknown; score?: unknown } | undefined;
  const label = typeof first?.label === "string" ? first.label : "unknown";
  const score01 = typeof first?.score === "number" ? clamp01(first.score) : 0;

  const reasons: string[] = [];
  if (arr && arr.length) {
    const top = (arr as Array<{ label?: unknown; score?: unknown }>)
      .filter((x) => typeof x?.label === "string" && typeof x?.score === "number")
      .slice(0, 5)
      .map((x) => `${String(x.label)}: ${Math.round(clamp01(Number(x.score)) * 100)}%`);
    if (top.length) reasons.push(`모델 상위 결과: ${top.join(", ")}`);
  } else {
    reasons.push(`모델 라벨: ${label}`);
  }

  return { score01, reasons };
}

function mapDetectorToAudioJson(j: Record<string, unknown>) {
  const p = typeof j.ai_probability === "number" ? j.ai_probability : 0;
  const manipulationScore = Math.round(clamp01(p) * 100);
  const reasons: string[] = [];
  if (Array.isArray(j.evidence)) {
    for (const e of j.evidence) {
      if (typeof e === "string") reasons.push(e);
    }
  }
  if (Array.isArray(j.warnings)) {
    for (const w of j.warnings) {
      if (typeof w === "string") reasons.push(`주의: ${w}`);
    }
  }
  return { manipulationScore, reasons };
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file이 필요합니다." }, { status: 400 });
  }

  const detectorBase = process.env.AI_DETECTOR_BASE_URL?.replace(/\/$/, "");
  if (detectorBase) {
    const fd = new FormData();
    fd.append("file", file, file.name);
    const detRes = await fetch(`${detectorBase}/analyze`, { method: "POST", body: fd });
    const rawText = await detRes.text();
    if (!detRes.ok) {
      return NextResponse.json(
        {
          error: `로컬 탐지 API가 이 파일을 처리하지 못했습니다(오디오 전용·미지원 확장자일 수 있음). ${rawText || detRes.statusText}`
        },
        { status: detRes.status === 400 ? 400 : 502 }
      );
    }
    let raw: unknown;
    try {
      raw = JSON.parse(rawText) as unknown;
    } catch {
      return NextResponse.json({ error: "탐지 API 응답 파싱 실패" }, { status: 502 });
    }
    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ error: "탐지 API 응답 형식 오류" }, { status: 502 });
    }
    return NextResponse.json(mapDetectorToAudioJson(raw as Record<string, unknown>));
  }

  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HUGGINGFACE_AUDIO_MODEL;
  if (!apiKey || !model) {
    return NextResponse.json(
      {
        error:
          "음성 분석: AI_DETECTOR_BASE_URL(이미지/영상·탐지기가 지원하는 형식) 또는 HUGGINGFACE_API_KEY/HUGGINGFACE_AUDIO_MODEL이 필요합니다."
      },
      { status: 500 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const hfRes = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": file.type || "application/octet-stream"
    },
    body: buf
  });

  const rawText = await hfRes.text();
  if (!hfRes.ok) {
    return NextResponse.json({ error: `HuggingFace 오류: ${rawText}` }, { status: 502 });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(rawText);
  } catch {
    raw = rawText;
  }

  const norm = normalizeHf(raw);
  const manipulationScore = Math.round(norm.score01 * 100);
  const reasons = [...norm.reasons];

  return NextResponse.json({ manipulationScore, reasons });
}
