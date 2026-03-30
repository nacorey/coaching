"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/storage/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface ChatContainerProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
}

export function ChatContainer({
  messages,
  isStreaming,
  streamingContent,
}: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or streaming content changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
        />
      ))}

      {/* Streaming state */}
      {isStreaming && streamingContent ? (
        <MessageBubble role="assistant" content={streamingContent} />
      ) : isStreaming ? (
        <TypingIndicator />
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
