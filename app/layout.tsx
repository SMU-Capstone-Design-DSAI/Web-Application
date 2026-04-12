import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "금융 피싱 탐지",
  description: "이미지/영상/음성/대화 기반 금융 피싱 위험도 탐지"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

