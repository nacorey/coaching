"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (content: string) => void;
  onRequestQuestion: () => void;
  disabled?: boolean;
  turnCount: number;
  maxTurns?: number;
}

export function ChatInput({
  onSend,
  onRequestQuestion,
  disabled = false,
  turnCount,
  maxTurns = 30,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }, [value]);

  const canSend = value.trim().length >= 2 && !disabled;

  function handleSend() {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isNearLimit = turnCount >= 25;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-4 pt-3 pb-2 flex flex-col gap-2 shadow-sm">
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="메시지를 입력하세요..."
        rows={1}
        className="w-full resize-none outline-none text-sm text-gray-800 placeholder:text-gray-400 bg-transparent overflow-y-auto"
        style={{ maxHeight: "120px" }}
      />

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        {/* Ask question button */}
        <button
          type="button"
          onClick={onRequestQuestion}
          disabled={disabled}
          className="text-xs text-brand-purple hover:text-brand-deep disabled:opacity-40 transition-colors"
        >
          코치에게 질문 받기
        </button>

        <div className="flex items-center gap-3">
          {/* Turn counter */}
          <span
            className={[
              "text-xs",
              isNearLimit ? "text-brand-teal font-medium" : "text-gray-400",
            ].join(" ")}
          >
            {turnCount} / {maxTurns}턴
          </span>

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="h-8 w-8 rounded-full bg-brand-purple flex items-center justify-center disabled:opacity-40 transition-opacity hover:bg-brand-deep"
            aria-label="전송"
          >
            {/* Airplane icon SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4 text-white"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
