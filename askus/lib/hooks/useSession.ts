"use client";
import { useState, useCallback } from "react";
import { LocalStorageProvider } from "@/lib/storage/local-storage";
import type { Session, CoachingTopic, Message, SessionSummary } from "@/lib/storage/types";

const storage = new LocalStorageProvider();

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  const createSession = useCallback(
    async (topic: CoachingTopic, emotionBefore: number, topicDetail?: string): Promise<string> => {
      const id = crypto.randomUUID();
      const newSession: Session = {
        id,
        topic,
        topicDetail,
        emotionBefore,
        messages: [],
        createdAt: Date.now(),
      };
      await storage.saveSession(newSession);
      setSession(newSession);
      return id;
    },
    []
  );

  const loadSession = useCallback(async (id: string) => {
    setLoading(true);
    const s = await storage.getSession(id);
    setSession(s);
    setLoading(false);
    return s;
  }, []);

  const addMessage = useCallback(
    async (message: Message) => {
      if (!session) return;
      const updated = { ...session, messages: [...session.messages, message] };
      setSession(updated);
      await storage.saveSession(updated);
    },
    [session]
  );

  const completeSession = useCallback(
    async (emotionAfter: number, summary: SessionSummary) => {
      if (!session) return;
      const updated = { ...session, emotionAfter, summary, completedAt: Date.now() };
      setSession(updated);
      await storage.saveSession(updated);
    },
    [session]
  );

  const exportSession = useCallback(
    async (format: "json" | "text") => {
      if (!session) return "";
      return storage.exportSession(session.id, format);
    },
    [session]
  );

  return { session, loading, createSession, loadSession, addMessage, completeSession, exportSession };
}
