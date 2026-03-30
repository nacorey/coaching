"use client";
import { useState, useCallback, useRef } from "react";
import { parseGrowPrefix, findGrowPrefixEnd } from "@/lib/ai/grow-parser";
import type { Message, GrowStage, CoachingTopic } from "@/lib/storage/types";

export interface UseChatOptions {
  topic: CoachingTopic;
  onMessage?: (message: Message) => void;
  onStageChange?: (stage: GrowStage) => void;
}

export function useChat({ topic, onMessage, onStageChange }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStage, setCurrentStage] = useState<GrowStage | null>(null);
  const [turnCount, setTurnCount] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (userContent: string) => {
      // Build and store the user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: userContent,
        stage: currentStage,
        timestamp: Date.now(),
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setTurnCount((c) => c + 1);
      onMessage?.(userMessage);

      // Start streaming
      setIsStreaming(true);
      setStreamingContent("");

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let buffer = "";
      let prefixParsed = false;
      let prefixEnd = -1;
      let accumulatedText = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
            topic,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`API error: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          if (!prefixParsed) {
            // Try to detect the end of the GROW prefix
            prefixEnd = findGrowPrefixEnd(buffer);

            if (!buffer.startsWith("<<GROW:")) {
              // No GROW prefix — treat entire buffer as content
              prefixParsed = true;
              accumulatedText = buffer;
              setStreamingContent(accumulatedText);
            } else if (prefixEnd !== -1) {
              // Prefix fully arrived
              prefixParsed = true;
              accumulatedText = buffer.slice(prefixEnd);
              setStreamingContent(accumulatedText);
            }
            // else: still waiting for ">>" — keep buffering
          } else {
            // Prefix already handled; stream remaining tokens directly
            accumulatedText += chunk;
            setStreamingContent(accumulatedText);
          }
        }

        // Parse the full response for metadata
        const { meta, text } = parseGrowPrefix(buffer);

        // Update GROW stage if confidence is high enough
        let resolvedStage: GrowStage | null = currentStage;
        if (meta && meta.confidence >= 0.7) {
          resolvedStage = meta.stage;
          setCurrentStage(meta.stage);
          if (meta.stage !== currentStage) {
            onStageChange?.(meta.stage);
          }
        }

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: text,
          stage: resolvedStage,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        onMessage?.(assistantMessage);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // Streaming was intentionally stopped — keep partial content as a message if any
          if (accumulatedText.trim()) {
            const partial: Message = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: accumulatedText,
              stage: currentStage,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, partial]);
            onMessage?.(partial);
          }
        } else {
          console.error("useChat sendMessage error:", err);
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        abortControllerRef.current = null;
      }
    },
    [messages, currentStage, topic, onMessage, onStageChange]
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const initMessages = useCallback(
    (restored: Message[]) => {
      setMessages(restored);
      setTurnCount(restored.filter((m) => m.role === "user").length);

      // Recover the last known stage from assistant messages
      const lastAssistant = [...restored].reverse().find((m) => m.role === "assistant" && m.stage);
      if (lastAssistant?.stage) {
        setCurrentStage(lastAssistant.stage);
      }
    },
    []
  );

  return {
    messages,
    streamingContent,
    isStreaming,
    currentStage,
    turnCount,
    sendMessage,
    stopStreaming,
    initMessages,
  };
}
