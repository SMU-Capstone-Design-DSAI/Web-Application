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

export async function POST(req: Request) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HUGGINGFACE_IMAGE_MODEL;
  if (!apiKey || !model) {
    return NextResponse.json(
      { error: "서버 환경변수(HUGGINGFACE_API_KEY/HUGGINGFACE_IMAGE_MODEL)가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file이 필요합니다." }, { status: 400 });
  }

  const isVideo = (file.type || "").startsWith("video/");
  const hasAudio = isVideo; // 서버리스 환경에서는 트랙 분석이 어려워 '영상이면 음성 포함 가능'으로 처리

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
    return NextResponse.json(
      { error: `HuggingFace 오류: ${rawText}` },
      { status: 502 }
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(rawText);
  } catch {
    raw = rawText;
  }

  const norm = normalizeHf(raw);
  const manipulationScore = Math.round(norm.score01 * 100);
  const reasons = [
    ...norm.reasons,
    isVideo
      ? "업로드 파일이 영상으로 감지되어 음성 포함 여부를 추가 확인합니다."
      : "업로드 파일이 이미지로 감지되었습니다."
  ];

  return NextResponse.json({ manipulationScore, reasons, hasAudio });
}

