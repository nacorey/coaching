"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { GrowProgressBar } from "@/components/grow/GrowProgressBar";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { useSession } from "@/lib/hooks/useSession";
import { useChat } from "@/lib/hooks/useChat";
import { TOPICS } from "@/lib/ai/topics";
import type { Message, SessionSummary } from "@/lib/storage/types";

const EMOTION_OPTIONS = [
  { value: 1, emoji: "😔", label: "힘들어요" },
  { value: 2, emoji: "😕", label: "약간 힘들어요" },
  { value: 3, emoji: "😐", label: "보통이에요" },
  { value: 4, emoji: "🙂", label: "좋아요" },
  { value: 5, emoji: "😊", label: "매우 좋아요" },
];

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;

  const { session, loadSession, addMessage, completeSession } = useSession(sessionId);

  const [initialized, setInitialized] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [emotionAfter, setEmotionAfter] = useState<number | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleMessage = useCallback(
    (message: Message) => {
      addMessage(message);
    },
    [addMessage]
  );

  const {
    messages,
    streamingContent,
    isStreaming,
    currentStage,
    turnCount,
    sendMessage,
    initMessages,
  } = useChat({
    topic: session?.topic ?? "other",
    onMessage: handleMessage,
  });

  // Session recovery: save state before browser close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session) {
        localStorage.setItem(
          `askus_autosave_${sessionId}`,
          JSON.stringify({ messages, currentStage, timestamp: Date.now() })
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [session, sessionId, messages, currentStage]);

  // Session initialization
  useEffect(() => {
    if (!sessionId) return;

    async function init() {
      const s = await loadSession(sessionId as string);

      if (!s) {
        router.replace("/session/new");
        return;
      }

      if (s.messages.length > 0) {
        // Restore existing messages
        initMessages(s.messages);
      }
      // Opening message will be sent after initialized flag is set

      setInitialized(true);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Send opening message for new sessions (after session is loaded)
  useEffect(() => {
    if (!initialized || !session) return;
    if (session.messages.length > 0) return; // already has messages, restored

    const openingText = TOPICS[session.topic].opening;
    const openingMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: openingText,
      stage: "goal",
      timestamp: Date.now(),
    };

    initMessages([openingMessage]);
    addMessage(openingMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, session?.id]);

  const handleSend = useCallback(
    (content: string) => {
      if (!session) return;
      sendMessage(content);
    },
    [session, sendMessage]
  );

  const handleRequestQuestion = useCallback(() => {
    if (!session) return;
    sendMessage(
      "[시스템] 사용자가 추가 질문을 요청합니다. 현재 GROW 단계에 맞는 탐색 질문을 던져주세요."
    );
  }, [session, sendMessage]);

  const handleEndSession = () => {
    setShowModal(true);
  };

  const handleFinish = async () => {
    if (!session || emotionAfter === null) return;

    setIsSummarizing(true);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error("Summarize API failed");

      const summary: SessionSummary = await res.json();
      await completeSession(emotionAfter, summary);

      router.push(`/session/${session.id}/summary`);
    } catch (err) {
      console.error("Session finish error:", err);
      setIsSummarizing(false);
    }
  };

  const handleContinue = () => {
    setShowModal(false);
    setEmotionAfter(null);
  };

  const topicConfig = session ? TOPICS[session.topic] : null;
  const stage = currentStage ?? "goal";

  return (
    <div className="h-screen flex flex-col bg-brand-bg">
      {/* Header */}
      <header className="bg-white border-b border-brand-soft px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Coach avatar */}
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-purple to-brand-deep flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">ASKUS 코치</div>
            {topicConfig && (
              <div className="text-xs text-brand-gray flex items-center gap-1">
                <span>{topicConfig.icon}</span>
                <span>{topicConfig.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* End session button */}
        <button
          type="button"
          onClick={handleEndSession}
          disabled={isStreaming}
          className="text-xs font-medium text-brand-gray border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-800 hover:border-gray-300 disabled:opacity-40 transition-colors"
        >
          세션 종료
        </button>
      </header>

      {/* GROW Progress Bar */}
      <div className="bg-white border-b border-brand-soft px-4 py-3 shrink-0">
        <GrowProgressBar currentStage={stage} />
      </div>

      {/* 25-turn notice banner */}
      {turnCount === 25 && (
        <div className="bg-brand-soft border-b border-brand-soft px-4 py-2.5 shrink-0">
          <p className="text-xs text-brand-purple text-center font-medium">
            대화를 정리해볼까요? 세션 종료 후 인사이트를 요약해드릴게요.
          </p>
        </div>
      )}

      {/* Session end guidance banner */}
      {messages.some(
        (m) =>
          m.role === "assistant" &&
          m.content.includes("오늘 대화를 정리해 드릴게요")
      ) && (
        <div className="bg-brand-soft border-b border-brand-soft px-4 py-3 shrink-0">
          <p className="text-xs text-brand-purple text-center font-medium">
            우측 상단의 <strong>세션 종료</strong>를 클릭하시면 코칭 결과를 확인하실 수 있어요.
          </p>
        </div>
      )}

      {/* Chat Container */}
      <ChatContainer
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
      />

      {/* Chat Input */}
      <div className="px-4 pb-4 shrink-0">
        <ChatInput
          onSend={handleSend}
          onRequestQuestion={handleRequestQuestion}
          disabled={isStreaming || !initialized}
          turnCount={turnCount}
          maxTurns={30}
        />
      </div>

      {/* Session End Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            {isSummarizing ? (
              /* Loading state */
              <div className="px-6 py-10 flex flex-col items-center gap-4">
                <div className="h-10 w-10 rounded-full border-4 border-brand-soft border-t-brand-purple animate-spin" />
                <p className="text-sm text-brand-gray text-center">
                  오늘의 대화를 정리하고 있어요...
                </p>
              </div>
            ) : (
              /* Confirmation + emotion check-in */
              <>
                <div className="px-6 pt-6 pb-4">
                  <h2 className="text-base font-semibold text-gray-900 mb-1">
                    세션을 마무리할까요?
                  </h2>
                  <p className="text-sm text-brand-gray">
                    지금 기분은 어떠세요? 코칭 후 감정을 확인해봐요.
                  </p>
                </div>

                {/* Emotion check-in */}
                <div className="px-6 pb-5">
                  <div className="flex justify-between">
                    {EMOTION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEmotionAfter(opt.value)}
                        className={[
                          "flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all",
                          emotionAfter === opt.value
                            ? "bg-brand-soft ring-2 ring-brand-purple"
                            : "hover:bg-gray-50",
                        ].join(" ")}
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="text-[10px] text-brand-gray">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="border-t border-gray-100 flex">
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="flex-1 py-3.5 text-sm font-medium text-brand-gray hover:text-gray-800 transition-colors"
                  >
                    계속하기
                  </button>
                  <div className="w-px bg-gray-100" />
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={emotionAfter === null}
                    className="flex-1 py-3.5 text-sm font-semibold text-brand-purple disabled:opacity-40 hover:text-brand-deep transition-colors"
                  >
                    마무리하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
