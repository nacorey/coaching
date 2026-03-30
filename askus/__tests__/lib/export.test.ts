import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageProvider } from "@/lib/storage/local-storage";
import { exportSession } from "@/lib/storage/export";
import type { Session } from "@/lib/storage/types";

function makeSession(overrides?: Partial<Session>): Session {
  return {
    id: "session-export",
    topic: "career",
    topicDetail: "커리어 전환",
    emotionBefore: 5,
    emotionAfter: 8,
    messages: [
      {
        id: "m1",
        role: "assistant",
        content: "무엇을 달성하고 싶으신가요?",
        stage: "goal",
        timestamp: 1000,
      },
      {
        id: "m2",
        role: "user",
        content: "개발자로 전직하고 싶습니다",
        stage: "goal",
        timestamp: 2000,
      },
      {
        id: "m3",
        role: "assistant",
        content: "현재 상황은 어떤가요?",
        stage: "reality",
        timestamp: 3000,
      },
    ],
    summary: {
      insights: ["현재 역량을 명확히 파악함", "전환 가능성을 확인함"],
      decisions: ["6개월 내 전직 목표"],
      actionPlan: ["부트캠프 등록", "포트폴리오 3개 제작"],
      growJourney: ["goal", "reality"],
    },
    createdAt: new Date("2026-03-30T12:00:00").getTime(),
    completedAt: new Date("2026-03-30T13:00:00").getTime(),
    ...overrides,
  };
}

describe("exportSession", () => {
  let provider: LocalStorageProvider;

  beforeEach(() => {
    localStorage.clear();
    provider = new LocalStorageProvider();
  });

  describe("JSON format", () => {
    it("returns a valid JSON string", async () => {
      const session = makeSession();
      await provider.saveSession(session);
      const result = await exportSession(provider, "session-export", "json");
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("JSON output contains the full session data", async () => {
      const session = makeSession();
      await provider.saveSession(session);
      const result = await exportSession(provider, "session-export", "json");
      const parsed = JSON.parse(result);
      expect(parsed.id).toBe("session-export");
      expect(parsed.topic).toBe("career");
      expect(parsed.messages).toHaveLength(3);
    });
  });

  describe("text format", () => {
    it("includes the session header", async () => {
      const session = makeSession();
      await provider.saveSession(session);
      const result = await exportSession(provider, "session-export", "text");
      expect(result).toContain("=== ASKUS 코칭 세션 ===");
    });

    it("includes the topic in the output", async () => {
      const session = makeSession();
      await provider.saveSession(session);
      const result = await exportSession(provider, "session-export", "text");
      expect(result).toContain("주제:");
    });

    it("includes the date in the output", async () => {
      const session = makeSession();
      await provider.saveSession(session);
      const result = await exportSession(provider, "session-export", "text");
      expect(result).toContain("날짜:");
    });

    it("includes the insights section header when summary exists", async () => {
      const session = makeSession();
      await provider.saveSession(session);
      const result = await exportSession(provider, "session-export", "text");
      expect(result).toContain("--- 핵심 인사이트 ---");
    });

    it("includes insights as bullet points", async () => {
      const session = makeSession();
      await provider.saveSession(session);
      const result = await exportSession(provider, "session-export", "text");
      expect(result).toContain("• 현재 역량을 명확히 파악함");
    });

    it("includes the action plan section header", async () => {
      const session = makeSession();
      await provider.saveSession(session);
      const result = await exportSession(provider, "session-export", "text");
      expect(result).toContain("--- 실행 계획 ---");
    });

    it("includes action items with checkbox symbol", async () => {
      const session = makeSession();
      await provider.saveSession(session);
      const result = await exportSession(provider, "session-export", "text");
      expect(result).toContain("☐ 부트캠프 등록");
    });

    it("includes conversation section header", async () => {
      const session = makeSession();
      await provider.saveSession(session);
      const result = await exportSession(provider, "session-export", "text");
      expect(result).toContain("--- 대화 기록 ---");
    });

    it("formats assistant messages with [코치] prefix", async () => {
      const session = makeSession();
      await provider.saveSession(session);
      const result = await exportSession(provider, "session-export", "text");
      expect(result).toContain("[코치] 무엇을 달성하고 싶으신가요?");
    });

    it("formats user messages with [나] prefix", async () => {
      const session = makeSession();
      await provider.saveSession(session);
      const result = await exportSession(provider, "session-export", "text");
      expect(result).toContain("[나] 개발자로 전직하고 싶습니다");
    });
  });

  describe("error handling", () => {
    it("throws an error when the session does not exist", async () => {
      await expect(
        exportSession(provider, "nonexistent-id", "json")
      ).rejects.toThrow();
    });

    it("throws an error for text format when session does not exist", async () => {
      await expect(
        exportSession(provider, "nonexistent-id", "text")
      ).rejects.toThrow();
    });
  });
});
