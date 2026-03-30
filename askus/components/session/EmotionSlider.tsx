"use client";

import { useRef } from "react";

const EMOJIS = [
  { value: 1, emoji: "😔", label: "매우 힘들어요" },
  { value: 2, emoji: "😕", label: "힘들어요" },
  { value: 3, emoji: "😐", label: "보통이에요" },
  { value: 4, emoji: "🙂", label: "괜찮아요" },
  { value: 5, emoji: "😊", label: "좋아요" },
];

interface EmotionSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function EmotionSlider({ value, onChange }: EmotionSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Progress percentage (1-5 range mapped to 0-100%)
  const progressPercent = ((value - 1) / 4) * 100;

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const newValue = Math.round(ratio * 4) + 1;
    onChange(newValue);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons === 0) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const newValue = Math.round(ratio * 4) + 1;
    onChange(newValue);
  }

  return (
    <div className="flex flex-col gap-5 px-2">
      {/* Emoji buttons — 균등 배치 */}
      <div className="flex">
        {EMOJIS.map((item) => {
          const isSelected = value === item.value;
          return (
            <div key={item.value} className="flex-1 flex justify-center">
              <button
                type="button"
                onClick={() => onChange(item.value)}
                className="flex flex-col items-center gap-1.5 transition-all duration-200"
                aria-label={item.label}
              >
                <span
                  className={[
                    "text-2xl transition-all duration-200 block",
                    isSelected ? "scale-125" : "opacity-40",
                  ].join(" ")}
                >
                  {item.emoji}
                </span>
                <span
                  className={[
                    "text-[11px] text-center leading-tight transition-all duration-200 whitespace-nowrap",
                    isSelected ? "text-brand-purple font-semibold" : "text-gray-400",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Gradient track — 이모지 중심에 맞춰 인셋 (flex-1 기준 좌우 10%) */}
      <div className="mx-[10%]">
        <div
          ref={trackRef}
          className="relative h-1.5 rounded-full cursor-pointer"
          style={{
            background: "linear-gradient(to right, #888780, #534ab7)",
          }}
          onClick={handleTrackClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          role="slider"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={value}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              onChange(Math.min(5, value + 1));
            } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              onChange(Math.max(1, value - 1));
            }
          }}
        >
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-brand-purple shadow-md border-2 border-white transition-all duration-200"
            style={{ left: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
