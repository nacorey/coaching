import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASKUS — 질문으로 변화를 이끄는 AI 코칭",
  description:
    "삶의 질문에 대한 답을 찾아가는 여정...",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#FAFAF8]">{children}</body>
    </html>
  );
}
