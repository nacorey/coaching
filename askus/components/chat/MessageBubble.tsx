interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={[
        "flex items-end gap-2 animate-fade-in",
        isAssistant ? "justify-start" : "justify-end",
      ].join(" ")}
    >
      {/* Avatar (assistant only) */}
      {isAssistant && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-deep flex items-center justify-center text-white text-sm font-semibold">
          A
        </div>
      )}

      {/* Bubble */}
      <div
        className={[
          "max-w-[75%] px-4 py-2.5 text-sm leading-relaxed",
          isAssistant
            ? "bg-white text-gray-800 rounded-[4px_16px_16px_16px] shadow-sm"
            : "bg-brand-purple text-white rounded-[16px_4px_16px_16px]",
        ].join(" ")}
      >
        {content}
      </div>
    </div>
  );
}
