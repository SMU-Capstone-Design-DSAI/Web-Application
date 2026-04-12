export type AnalyzeMediaResponse = {
  manipulationScore: number; // 0-100
  reasons: string[];
  hasAudio: boolean;
};

export type AnalyzeAudioResponse = {
  manipulationScore: number; // 0-100
  reasons: string[];
};

export type SummarizeRequest = {
  mediaScore?: number;
  audioScore?: number;
  mediaReasons?: string[];
  audioReasons?: string[];
  contentSummary?: string;
};

export type SummarizeResponse = {
  riskLevel: "낮음" | "중간" | "높음" | "매우높음";
  riskScore: number; // 0-100
  feedback: string;
  warnings: string[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

