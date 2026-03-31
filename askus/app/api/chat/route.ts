import OpenAI from "openai";
import { cookies } from "next/headers";
import { COACHING_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";

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

    const { messages, topic } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response("messages is required", { status: 400 });
    }

    // Goal pin: first 4 messages always included
    const pinnedCount = Math.min(4, messages.length);
    const pinned = messages.slice(0, pinnedCount);
    const recent = messages.slice(pinnedCount);
    const maxRecent = 40;
    const windowedRecent = recent.slice(-maxRecent);

    const apiMessages = [
      { role: "system" as const, content: COACHING_SYSTEM_PROMPT },
      ...pinned.map((m: any) => ({ role: m.role, content: m.content })),
      ...windowedRecent.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      messages: apiMessages,
      stream: true,
      temperature: 0.7,
      max_completion_tokens: 500,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) controller.enqueue(encoder.encode(content));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
