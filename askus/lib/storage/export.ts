import type { StorageProvider } from "@/lib/storage/types";

export async function exportSession(
  provider: StorageProvider,
  id: string,
  format: "json" | "text"
): Promise<string> {
  const session = await provider.getSession(id);
  if (!session) {
    throw new Error(`Session not found: ${id}`);
  }

  if (format === "json") {
    return JSON.stringify(session, null, 2);
  }

  // text format
  const date = new Date(session.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const topicLabel: Record<string, string> = {
    career: "커리어",
    relationship: "관계",
    goal: "목표",
    self: "자기계발",
    other: "기타",
  };

  const lines: string[] = [];

  lines.push("=== ASKUS 코칭 세션 ===");
  lines.push(`주제: ${topicLabel[session.topic] ?? session.topic}`);
  lines.push(`날짜: ${date}`);

  if (session.summary) {
    if (session.summary.insights.length > 0) {
      lines.push("");
      lines.push("--- 핵심 인사이트 ---");
      for (const insight of session.summary.insights) {
        lines.push(`• ${insight}`);
      }
    }

    if (session.summary.actionPlan.length > 0) {
      lines.push("");
      lines.push("--- 실행 계획 ---");
      for (const action of session.summary.actionPlan) {
        lines.push(`☐ ${action}`);
      }
    }
  }

  lines.push("");
  lines.push("--- 대화 기록 ---");
  for (const message of session.messages) {
    const prefix = message.role === "assistant" ? "[코치]" : "[나]";
    lines.push(`${prefix} ${message.content}`);
  }

  return lines.join("\n");
}
