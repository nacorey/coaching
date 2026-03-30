import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageProvider } from "@/lib/storage/local-storage";
import type { Session } from "@/lib/storage/types";

const STORAGE_KEY = "askus_sessions";

function makeSession(overrides?: Partial<Session>): Session {
  return {
    id: "session-1",
    topic: "career",
    emotionBefore: 5,
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "Hello",
        stage: "goal",
        timestamp: 1000,
      },
      {
        id: "msg-2",
        role: "assistant",
        content: "Hi there",
        stage: "goal",
        timestamp: 2000,
      },
    ],
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("LocalStorageProvider", () => {
  let provider: LocalStorageProvider;

  beforeEach(() => {
    localStorage.clear();
    provider = new LocalStorageProvider();
  });

  describe("saveSession + getSession", () => {
    it("saves a session and retrieves it by id", async () => {
      const session = makeSession();
      await provider.saveSession(session);
      const retrieved = await provider.getSession("session-1");
      expect(retrieved).toEqual(session);
    });

    it("overwrites an existing session with the same id", async () => {
      const session = makeSession();
      await provider.saveSession(session);

      const updated = { ...session, emotionAfter: 8 };
      await provider.saveSession(updated);

      const retrieved = await provider.getSession("session-1");
      expect(retrieved?.emotionAfter).toBe(8);
    });
  });

  describe("getSession", () => {
    it("returns null for a nonexistent session id", async () => {
      const result = await provider.getSession("nonexistent-id");
      expect(result).toBeNull();
    });
  });

  describe("getSessionList", () => {
    it("returns empty array when no sessions exist", async () => {
      const list = await provider.getSessionList();
      expect(list).toEqual([]);
    });

    it("returns list items with correct turnCount (user messages only)", async () => {
      const session = makeSession({
        id: "s1",
        messages: [
          { id: "m1", role: "user", content: "Q1", stage: null, timestamp: 1 },
          { id: "m2", role: "assistant", content: "A1", stage: null, timestamp: 2 },
          { id: "m3", role: "user", content: "Q2", stage: null, timestamp: 3 },
        ],
      });
      await provider.saveSession(session);
      const list = await provider.getSessionList();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe("s1");
      expect(list[0].turnCount).toBe(2);
    });

    it("marks hasSummary correctly", async () => {
      const withSummary = makeSession({
        id: "s-summary",
        summary: {
          insights: ["insight"],
          decisions: [],
          actionPlan: [],
          growJourney: ["goal"],
        },
      });
      const withoutSummary = makeSession({ id: "s-no-summary" });

      await provider.saveSession(withSummary);
      await provider.saveSession(withoutSummary);

      const list = await provider.getSessionList();
      const summaryItem = list.find((l) => l.id === "s-summary");
      const noSummaryItem = list.find((l) => l.id === "s-no-summary");

      expect(summaryItem?.hasSummary).toBe(true);
      expect(noSummaryItem?.hasSummary).toBe(false);
    });

    it("returns all saved sessions in the list", async () => {
      await provider.saveSession(makeSession({ id: "s1" }));
      await provider.saveSession(makeSession({ id: "s2" }));
      await provider.saveSession(makeSession({ id: "s3" }));

      const list = await provider.getSessionList();
      expect(list).toHaveLength(3);
    });
  });

  describe("deleteSession", () => {
    it("deletes a session so it can no longer be retrieved", async () => {
      const session = makeSession({ id: "to-delete" });
      await provider.saveSession(session);
      await provider.deleteSession("to-delete");
      const result = await provider.getSession("to-delete");
      expect(result).toBeNull();
    });

    it("removes the session from the list after deletion", async () => {
      await provider.saveSession(makeSession({ id: "keep" }));
      await provider.saveSession(makeSession({ id: "remove" }));

      await provider.deleteSession("remove");

      const list = await provider.getSessionList();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe("keep");
    });

    it("does not throw when deleting a nonexistent session id", async () => {
      await expect(provider.deleteSession("ghost")).resolves.toBeUndefined();
    });
  });

  describe("localStorage persistence", () => {
    it("persists data under the correct storage key", async () => {
      const session = makeSession();
      await provider.saveSession(session);
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed["session-1"]).toBeDefined();
    });
  });
});
