import ReactMarkdown from "react-markdown";

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
      {isAssistant && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-deep flex items-center justify-center text-white text-sm font-semibold">
          A
        </div>
      )}

      <div
        className={[
          "max-w-[75%] px-4 py-2.5 text-sm leading-relaxed",
          isAssistant
            ? "bg-white text-gray-800 rounded-[4px_16px_16px_16px] shadow-sm"
            : "bg-brand-purple text-white rounded-[16px_4px_16px_16px]",
        ].join(" ")}
      >
        {isAssistant ? (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-0.5">{children}</li>,
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
