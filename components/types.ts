export type AnalyzeMediaResponse = {
  manipulationScore: number; // 0-100
  reasons: string[];
  hasAudio: boolean;
  /** 로컬 탐지 API가 PNG를 줄 때: img src에 그대로 사용 */
  saliencyPngDataUrl?: string;
  /** 히트맵 설명(성공) 또는 히트맵 실패 사유(탐지 API 연결 시) */
  saliencyCaption?: string;
  /**
   * HuggingFace API만 쓰는 경우: 히트맵이 응답에 없다는 안내(설정 방법)
   */
  saliencyNotice?: string;
};

export type AnalyzeAudioResponse = {
  manipulationScore: number; // 0-100
  reasons: string[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

