export type GrowStage = "goal" | "reality" | "options" | "will";
export type CoachingTopic = "career" | "relationship" | "goal" | "self" | "other";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  stage: GrowStage | null;
  timestamp: number;
}

export interface SessionSummary {
  insights: string[];
  decisions: string[];
  actionPlan: string[];
  growJourney: GrowStage[];
}

export interface Session {
  id: string;
  topic: CoachingTopic;
  topicDetail?: string;
  emotionBefore: number;
  emotionAfter?: number;
  messages: Message[];
  summary?: SessionSummary;
  createdAt: number;
  completedAt?: number;
}

export interface SessionListItem {
  id: string;
  topic: CoachingTopic;
  createdAt: number;
  completedAt?: number;
  turnCount: number;
  hasSummary: boolean;
}

export interface StorageProvider {
  saveSession(session: Session): Promise<void>;
  getSession(id: string): Promise<Session | null>;
  getSessionList(): Promise<SessionListItem[]>;
  deleteSession(id: string): Promise<void>;
  exportSession(id: string, format: "json" | "text"): Promise<string>;
}
