"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopicSelector } from "@/components/session/TopicSelector";
import { EmotionSlider } from "@/components/session/EmotionSlider";
import { useSession } from "@/lib/hooks/useSession";
import type { CoachingTopic } from "@/lib/storage/types";
import { TOPICS } from "@/lib/ai/topics";

export default function SessionNewPage() {
  const router = useRouter();
  const { createSession } = useSession(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [topic, setTopic] = useState<CoachingTopic | null>(null);
  const [topicDetail, setTopicDetail] = useState("");
  const [emotion, setEmotion] = useState(3);

  async function handleStart(emotionValue: number) {
    if (!topic) return;
    const detail = topic === "other" ? topicDetail : undefined;
    const id = await createSession(topic, emotionValue, detail);
    router.push(`/session/${id}`);
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-lg mx-auto px-4 py-12">
        {step === 1 ? (
          <>
            {/* Step 1 Header */}
            <div className="mb-8">
              <span className="text-xs font-semibold tracking-widest text-brand-purple uppercase">
                SESSION START
              </span>
              <h1 className="mt-2 text-2xl font-bold text-gray-900 leading-snug">
                오늘은 어떤 이야기를<br />나눠볼까요?
              </h1>
              <p className="mt-1 text-sm text-brand-gray">
                편하게 골라주세요. 정답은 없습니다.
              </p>
            </div>

            {/* Topic Selector */}
            <TopicSelector selected={topic} onSelect={setTopic} />

            {/* "Other" detail input */}
            {topic === "other" && (
              <div className="mt-4">
                <input
                  type="text"
                  value={topicDetail}
                  onChange={(e) => setTopicDetail(e.target.value)}
                  placeholder="어떤 주제인지 간단히 적어주세요 (선택)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-soft"
                />
              </div>
            )}

            {/* Next button */}
            <button
              type="button"
              disabled={topic === null}
              onClick={() => setStep(2)}
              className="mt-6 w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-brand-purple text-white hover:bg-brand-deep active:scale-[0.98]"
            >
              다음
            </button>
          </>
        ) : (
          <>
            {/* Step 2 Header */}
            <div className="mb-8">
              <span className="text-xs font-semibold tracking-widest text-brand-teal uppercase">
                EMOTION CHECK-IN
              </span>
              <h1 className="mt-2 text-2xl font-bold text-gray-900 leading-snug">
                지금 기분은 어떠세요?
              </h1>
              <p className="mt-1 text-sm text-brand-gray">
                판단 없이, 있는 그대로 느껴보세요.
              </p>
            </div>

            {/* Emotion Slider */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <EmotionSlider value={emotion} onChange={setEmotion} />
            </div>

            {/* Session Preview Card */}
            {topic && (
              <div className="bg-brand-soft rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
                <span className="text-2xl">{TOPICS[topic].icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-brand-purple font-semibold uppercase tracking-wide">
                    선택한 주제
                  </div>
                  <div className="text-sm font-medium text-gray-800 mt-0.5">
                    {TOPICS[topic].label}
                    {topic === "other" && topicDetail && (
                      <span className="text-brand-gray font-normal"> — {topicDetail}</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-brand-gray">기분</div>
                  <div className="text-lg font-bold text-brand-purple">{emotion}/5</div>
                </div>
              </div>
            )}

            {/* Start button */}
            <button
              type="button"
              onClick={() => handleStart(emotion)}
              className="w-full py-3.5 rounded-xl text-sm font-semibold bg-brand-purple text-white hover:bg-brand-deep active:scale-[0.98] transition-all duration-200"
            >
              코칭 시작
            </button>

            {/* Skip link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => handleStart(3)}
                className="text-sm text-brand-gray hover:text-brand-purple underline underline-offset-2 transition-colors"
              >
                건너뛰기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
