import OpenAI from "openai";
import { cookies } from "next/headers";
import { SUMMARIZE_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import type { SessionSummary } from "@/lib/storage/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("askus_access")?.value !== "granted") {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response("messages is required", { status: 400 });
    }

    const conversationText = messages
      .map((m: any) => `[${m.role === "assistant" ? "코치" : "사용자"}] ${m.content}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      messages: [
        { role: "system", content: SUMMARIZE_SYSTEM_PROMPT },
        { role: "user", content: conversationText },
      ],
      temperature: 0.3,
      max_completion_tokens: 1000,
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const summary: SessionSummary = JSON.parse(jsonStr);

    return Response.json(summary);
  } catch (error) {
    console.error("Summarize API error:", error);
    return new Response("Failed to generate summary", { status: 500 });
  }
}
