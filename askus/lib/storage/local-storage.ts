import type {
  Session,
  SessionListItem,
  StorageProvider,
} from "@/lib/storage/types";

const STORAGE_KEY = "askus_sessions";

type SessionStore = Record<string, Session>;

function readStore(): SessionStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SessionStore;
  } catch {
    return {};
  }
}

function writeStore(store: SessionStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export class LocalStorageProvider implements StorageProvider {
  async saveSession(session: Session): Promise<void> {
    const store = readStore();
    store[session.id] = session;
    writeStore(store);
  }

  async getSession(id: string): Promise<Session | null> {
    const store = readStore();
    return store[id] ?? null;
  }

  async getSessionList(): Promise<SessionListItem[]> {
    const store = readStore();
    return Object.values(store).map((session) => ({
      id: session.id,
      topic: session.topic,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
      turnCount: session.messages.filter((m) => m.role === "user").length,
      hasSummary: session.summary !== undefined,
    }));
  }

  async deleteSession(id: string): Promise<void> {
    const store = readStore();
    delete store[id];
    writeStore(store);
  }

  async exportSession(id: string, format: "json" | "text"): Promise<string> {
    const { exportSession } = await import("@/lib/storage/export");
    return exportSession(this, id, format);
  }
}
