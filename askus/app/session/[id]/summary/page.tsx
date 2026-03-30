"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/hooks/useSession";
import { TOPICS } from "@/lib/ai/topics";
import type { Session } from "@/lib/storage/types";

const EMOTION_EMOJIS = ["😔", "😕", "😐", "🙂", "😊"];
const EMOTION_LABELS = ["많이 힘든", "좀 무거운", "보통", "괜찮은", "아주 좋은"];

const GROW_LABELS: { key: "goal" | "reality" | "options" | "will"; letter: string; label: string }[] = [
  { key: "goal", letter: "G", label: "Goal" },
  { key: "reality", letter: "R", label: "Reality" },
  { key: "options", letter: "O", label: "Options" },
  { key: "will", letter: "W", label: "Will" },
];

function computeStageCount(session: Session) {
  const counts: Record<string, number> = { goal: 0, reality: 0, options: 0, will: 0 };
  for (const msg of session.messages) {
    if (msg.stage && msg.stage in counts) {
      counts[msg.stage]++;
    }
  }
  return counts;
}

function buildTextContent(session: Session): string {
  const topicLabel = TOPICS[session.topic]?.label ?? session.topic;
  const lines: string[] = [];
  lines.push("=== ASKUS 코칭 세션 요약 ===");
  lines.push(`주제: ${topicLabel}`);
  if (session.summary?.insights && session.summary.insights.length > 0) {
    lines.push("");
    lines.push("--- 핵심 인사이트 ---");
    for (const insight of session.summary.insights) {
      lines.push(`• ${insight}`);
    }
  }
  if (session.summary?.actionPlan && session.summary.actionPlan.length > 0) {
    lines.push("");
    lines.push("--- 실행 계획 ---");
    for (const action of session.summary.actionPlan) {
      lines.push(`☐ ${action}`);
    }
  }
  return lines.join("\n");
}

export default function SessionSummaryPage() {
  const params = useParams();
  const sessionId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;

  const { session, loading, loadSession, exportSession } = useSession(sessionId);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-brand-gray text-sm">불러오는 중...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-4">
        <p className="text-brand-gray text-sm">세션을 찾을 수 없습니다.</p>
        <Link href="/session/new" className="text-sm font-semibold text-brand-purple hover:underline">
          새 세션 시작
        </Link>
      </div>
    );
  }

  const topicLabel = TOPICS[session.topic]?.label ?? session.topic;
  const duration = session.completedAt
    ? Math.round((session.completedAt - session.createdAt) / 60000)
    : 0;
  const turnCount = session.messages.filter((m) => m.role === "user").length;
  const stageCount = computeStageCount(session);

  const emotionBefore = session.emotionBefore;
  const emotionAfter = session.emotionAfter;
  const emotionDiff = emotionAfter !== undefined ? emotionAfter - emotionBefore : null;

  async function handleCopyText() {
    try {
      const text = buildTextContent(session!);
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  async function handleExportJson() {
    try {
      const json = await exportSession("json");
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `askus-session-${session!.id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // download failed
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg pb-12">
      <div className="max-w-lg mx-auto px-4 pt-0">

        {/* 1. Complete Banner */}
        <div className="bg-gradient-to-br from-[#534AB7] to-[#7C74D6] rounded-b-[24px] px-6 pt-10 pb-8 text-white text-center mb-5">
          <div className="flex items-center justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white">
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-bold mb-1.5">오늘의 코칭이 끝났습니다</h1>
          <p className="text-sm text-white/70">
            {topicLabel} 코칭 · {duration}분 · {turnCount}턴
          </p>
        </div>

        <div className="space-y-3">
          {/* 2. Emotion Change Card */}
          {emotionAfter !== undefined && (
            <div className="rounded-[14px] border border-brand-soft bg-white p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-brand-gray mb-4">
                감정 변화
              </p>
              <div className="flex items-center justify-between">
                {/* Before */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl">{EMOTION_EMOJIS[emotionBefore - 1]}</span>
                  <span className="text-xs text-brand-gray">{EMOTION_LABELS[emotionBefore - 1]}</span>
                  <span className="text-sm font-semibold text-gray-700">{emotionBefore}/5</span>
                </div>

                {/* Arrow + diff */}
                <div className="flex flex-col items-center gap-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-brand-gray">
                    <path d="M5 12H19M13 6L19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {emotionDiff !== null && (
                    <span
                      className={`text-sm font-bold ${
                        emotionDiff > 0 ? "text-brand-teal" : emotionDiff < 0 ? "text-red-400" : "text-brand-gray"
                      }`}
                    >
                      {emotionDiff > 0 ? `+${emotionDiff} ↑` : emotionDiff < 0 ? `${emotionDiff} ↓` : "0"}
                    </span>
                  )}
                </div>

                {/* After */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl">{EMOTION_EMOJIS[emotionAfter - 1]}</span>
                  <span className="text-xs text-brand-gray">{EMOTION_LABELS[emotionAfter - 1]}</span>
                  <span className="text-sm font-semibold text-gray-700">{emotionAfter}/5</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. GROW Journey Card */}
          <div className="rounded-[14px] border border-brand-soft bg-white p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-brand-gray mb-4">
              GROW 여정
            </p>
            <div className="flex items-start justify-between gap-2">
              {GROW_LABELS.map(({ key, letter, label }) => (
                <div key={key} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-10 h-10 rounded-full bg-brand-purple flex items-center justify-center text-white font-bold text-base">
                    {letter}
                  </div>
                  <span className="text-[11px] text-brand-gray">{label}</span>
                  <span className="text-xs font-semibold text-gray-700">{stageCount[key]}턴</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Key Insights Card */}
          {session.summary?.insights && session.summary.insights.length > 0 && (
            <div className="rounded-[14px] border border-brand-soft bg-white p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-brand-gray mb-3">
                핵심 인사이트
              </p>
              <ul className="space-y-2">
                {session.summary.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-purple flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 5. Action Plan Card */}
          {session.summary?.actionPlan && session.summary.actionPlan.length > 0 && (
            <div className="rounded-[14px] border border-brand-soft bg-white p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-brand-gray mb-3">
                실행 계획
              </p>
              <ul className="space-y-2.5">
                {session.summary.actionPlan.map((action, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-4 h-4 rounded border-2 border-brand-purple flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 6. Buttons */}
          <div className="pt-2 space-y-2.5">
            <Link
              href="/session/new"
              className="block w-full py-3.5 rounded-xl text-sm font-semibold text-center bg-brand-purple text-white hover:bg-brand-deep active:scale-[0.98] transition-all duration-200"
            >
              새 코칭 세션 시작
            </Link>

            <button
              type="button"
              onClick={handleCopyText}
              className="w-full py-3.5 rounded-xl text-sm font-semibold border border-brand-soft bg-white text-brand-purple hover:bg-brand-soft active:scale-[0.98] transition-all duration-200"
            >
              {copySuccess ? "복사됨!" : "텍스트로 복사"}
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="w-full py-3.5 rounded-xl text-sm font-semibold border border-brand-soft bg-white text-brand-gray hover:bg-brand-soft active:scale-[0.98] transition-all duration-200"
            >
              JSON 내보내기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
