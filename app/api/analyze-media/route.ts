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

function mapDetectorToMediaJson(j: Record<string, unknown>, file: File) {
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
  const isVideo = j.file_type === "video" || (file.type || "").startsWith("video/");
  const hasAudio = isVideo;
  if (isVideo) {
    reasons.push("영상으로 처리했으며, 음성 분석을 함께 쓰면 음성 쪽 근거를 추가할 수 있습니다.");
  }
  const saliency = j.saliency;
  let saliencyPngDataUrl: string | undefined;
  let saliencyCaption: string | undefined;
  if (saliency && typeof saliency === "object" && saliency !== null) {
    const s = saliency as { image_base64?: string | null; caption?: string };
    if (typeof s.image_base64 === "string" && s.image_base64.length > 0) {
      saliencyPngDataUrl = `data:image/png;base64,${s.image_base64}`;
    }
    if (typeof s.caption === "string" && s.caption.trim()) {
      saliencyCaption = s.caption.trim();
    }
  }
  return { manipulationScore, reasons, hasAudio, saliencyPngDataUrl, saliencyCaption };
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
        { error: `로컬 탐지 API 오류: ${rawText || detRes.statusText}` },
        { status: 502 }
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
    return NextResponse.json(mapDetectorToMediaJson(raw as Record<string, unknown>, file));
  }

  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HUGGINGFACE_IMAGE_MODEL;
  if (!apiKey || !model) {
    return NextResponse.json(
      {
        error:
          "이미지/영상 분석: AI_DETECTOR_BASE_URL(로컬 탐지기) 또는 HUGGINGFACE_API_KEY/HUGGINGFACE_IMAGE_MODEL이 필요합니다."
      },
      { status: 500 }
    );
  }

  const isVideo = (file.type || "").startsWith("video/");
  const hasAudio = isVideo;

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
  const reasons = [
    ...norm.reasons,
    isVideo
      ? "업로드 파일이 영상으로 감지되어 음성 포함 여부를 추가 확인합니다."
      : "업로드 파일이 이미지로 감지되었습니다."
  ];

  // 원격 HuggingFace만 쓰면 서버 쪽에서 공간 히트맵을 만들 수 없음
  const saliencyNotice = !isVideo
    ? "이미지 위에 색이 겹친 ‘공간 히트맵’은 Visual_Transform AI 탐지 API(로컬 `detector`)를 붙일 때만 제공됩니다. 루트에서 `docker compose up`으로 `web`과 `detector`를 같이 띄우고, Next 서버에 `AI_DETECTOR_BASE_URL`(예: http://detector:8000)이 설정돼 있어야 합니다."
    : undefined;

  return NextResponse.json({ manipulationScore, reasons, hasAudio, saliencyNotice });
}
