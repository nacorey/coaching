# ASKUS AI 코칭 챗봇 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GROW 코칭 프레임워크 기반 AI 챗봇 MVP (F-01~F-04, F-06, F-07) 구현

**Architecture:** Next.js App Router로 4개 페이지(랜딩, 세션시작, 코칭대화, 세션요약)와 2개 API Route(chat streaming, summarize)를 구성한다. AI 응답에 `<<GROW:stage:confidence>>` 프리픽스를 삽입하여 스트리밍 중 GROW 단계를 감지하고, localStorage 기반 스토리지 추상화 레이어로 세션 데이터를 관리한다.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, OpenAI gpt-5.4-mini, Vitest + React Testing Library

**Design Spec:** `docs/superpowers/specs/2026-03-30-askus-coaching-chatbot-design.md`

---

## File Map

```
askus/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃: Noto Sans KR, 메타데이터
│   ├── page.tsx                      # 랜딩 페이지
│   ├── globals.css                   # Tailwind + 브랜드 CSS 변수
│   ├── session/
│   │   ├── new/
│   │   │   └── page.tsx              # 주제 선택 + 감정 체크인
│   │   └── [id]/
│   │       ├── page.tsx              # 코칭 대화
│   │       └── summary/
│   │           └── page.tsx          # 세션 요약
│   └── api/
│       ├── chat/
│       │   └── route.ts              # OpenAI 스트리밍 프록시
│       └── summarize/
│           └── route.ts              # 세션 요약 생성
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx         # 대화 영역 전체 조립
│   │   ├── MessageBubble.tsx         # 코치/사용자 메시지 버블
│   │   ├── ChatInput.tsx             # 입력창 + 전송 + 질문받기 버튼
│   │   └── TypingIndicator.tsx       # 3-dot 펄스 애니메이션
│   ├── grow/
│   │   └── GrowProgressBar.tsx       # G-R-O-W 단계 시각화
│   ├── session/
│   │   ├── TopicSelector.tsx         # 5개 주제 카테고리 카드
│   │   └── EmotionSlider.tsx         # 이모지 감정 슬라이더
│   └── ui/                           # shadcn/ui 컴포넌트
├── lib/
│   ├── ai/
│   │   ├── system-prompt.ts          # 코칭 시스템 프롬프트 문자열
│   │   ├── grow-parser.ts            # <<GROW:...>> 파싱 로직
│   │   └── topics.ts                 # 주제별 오프닝 질문
│   ├── storage/
│   │   ├── types.ts                  # Session, Message 등 타입 + StorageProvider 인터페이스
│   │   ├── local-storage.ts          # localStorage 구현체
│   │   └── export.ts                 # JSON/텍스트 내보내기
│   └── hooks/
│       ├── useSession.ts             # 세션 CRUD + 생명주기
│       └── useChat.ts                # 스트리밍 대화 + GROW 추적
├── __tests__/
│   ├── lib/
│   │   ├── grow-parser.test.ts
│   │   ├── local-storage.test.ts
│   │   └── export.test.ts
│   ├── api/
│   │   └── chat.test.ts
│   └── components/
│       ├── GrowProgressBar.test.tsx
│       ├── MessageBubble.test.tsx
│       └── TopicSelector.test.tsx
├── vitest.config.ts
├── .env.local                        # OPENAI_API_KEY
└── .env.example                      # OPENAI_API_KEY=sk-your-key-here
```

---

## Task 1: 프로젝트 셋업 + 브랜드 디자인 시스템

**Files:**
- Create: `askus/` (Next.js 프로젝트)
- Create: `askus/app/globals.css`
- Create: `askus/tailwind.config.ts`
- Create: `askus/vitest.config.ts`
- Create: `askus/.env.example`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
cd "/c/Users/ubumi/Desktop/2. 코딩연습/0. 2026/cursor/0330_02"
npx create-next-app@latest askus --typescript --tailwind --eslint --app --src=no --import-alias="@/*" --use-npm
```

선택 옵션: TypeScript=Yes, ESLint=Yes, Tailwind=Yes, `src/`=No, App Router=Yes, import alias=`@/*`

- [ ] **Step 2: 핵심 의존성 설치**

```bash
cd askus
npm install openai
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: shadcn/ui 초기화 + 필요 컴포넌트 설치**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button slider progress dialog card
```

- [ ] **Step 4: Vitest 설정**

`askus/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./__tests__/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

`askus/__tests__/setup.ts`:
```typescript
import "@testing-library/jest-dom/vitest";
```

`askus/package.json`에 스크립트 추가:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 5: Tailwind 브랜드 디자인 토큰 설정**

`askus/tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#534AB7",
          deep: "#3C3489",
          soft: "#EEEDFE",
          teal: "#1D9E75",
          gray: "#888780",
          bg: "#FAFAF8",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

- [ ] **Step 6: globals.css 브랜드 변수 설정**

`askus/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap");

@layer base {
  :root {
    --background: 60 11% 98%;
    --foreground: 0 0% 10%;
    --primary: 245 43% 50%;
    --primary-foreground: 0 0% 100%;
    --muted: 245 60% 97%;
    --muted-foreground: 48 3% 53%;
    --border: 245 60% 97%;
    --radius: 0.75rem;
  }
}

@layer base {
  body {
    @apply bg-brand-bg text-foreground font-sans antialiased;
  }
}
```

- [ ] **Step 7: 루트 레이아웃 설정**

`askus/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASKUS — 질문으로 변화를 이끄는 AI 코칭",
  description: "삶의 질문에 대한 답을 찾아가는 여정. ASKUS는 답을 주지 않습니다. 당신 안의 답을 꺼냅니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: .env 파일 설정**

`askus/.env.example`:
```
OPENAI_API_KEY=sk-your-key-here
```

`askus/.env.local`:
```
OPENAI_API_KEY=sk-your-actual-key
```

- [ ] **Step 9: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공

- [ ] **Step 10: 커밋**

```bash
git add -A
git commit -m "feat: project setup with Next.js, Tailwind, shadcn/ui, brand design tokens"
```

---

## Task 2: 핵심 타입 + 스토리지 레이어

**Files:**
- Create: `askus/lib/storage/types.ts`
- Create: `askus/lib/storage/local-storage.ts`
- Create: `askus/lib/storage/export.ts`
- Create: `askus/__tests__/lib/local-storage.test.ts`
- Create: `askus/__tests__/lib/export.test.ts`

- [ ] **Step 1: 핵심 타입 정의**

`askus/lib/storage/types.ts`:
```typescript
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
```

- [ ] **Step 2: localStorage 테스트 작성**

`askus/__tests__/lib/local-storage.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageProvider } from "@/lib/storage/local-storage";
import type { Session } from "@/lib/storage/types";

const mockSession: Session = {
  id: "test-123",
  topic: "career",
  emotionBefore: 3,
  messages: [
    { id: "m1", role: "assistant", content: "안녕하세요", stage: "goal", timestamp: 1000 },
    { id: "m2", role: "user", content: "이직 고민이요", stage: null, timestamp: 2000 },
  ],
  createdAt: Date.now(),
};

describe("LocalStorageProvider", () => {
  let provider: LocalStorageProvider;

  beforeEach(() => {
    localStorage.clear();
    provider = new LocalStorageProvider();
  });

  it("saves and retrieves a session", async () => {
    await provider.saveSession(mockSession);
    const result = await provider.getSession("test-123");
    expect(result).toEqual(mockSession);
  });

  it("returns null for non-existent session", async () => {
    const result = await provider.getSession("nonexistent");
    expect(result).toBeNull();
  });

  it("returns session list with correct turnCount", async () => {
    await provider.saveSession(mockSession);
    const list = await provider.getSessionList();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("test-123");
    expect(list[0].turnCount).toBe(2);
    expect(list[0].hasSummary).toBe(false);
  });

  it("deletes a session", async () => {
    await provider.saveSession(mockSession);
    await provider.deleteSession("test-123");
    const result = await provider.getSession("test-123");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

```bash
npm run test:run -- __tests__/lib/local-storage.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/storage/local-storage'`

- [ ] **Step 4: localStorage 구현체 작성**

`askus/lib/storage/local-storage.ts`:
```typescript
import type { Session, SessionListItem, StorageProvider } from "./types";

const STORAGE_KEY = "askus_sessions";

export class LocalStorageProvider implements StorageProvider {
  private getAll(): Record<string, Session> {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  private setAll(sessions: Record<string, Session>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }

  async saveSession(session: Session): Promise<void> {
    const all = this.getAll();
    all[session.id] = session;
    this.setAll(all);
  }

  async getSession(id: string): Promise<Session | null> {
    const all = this.getAll();
    return all[id] ?? null;
  }

  async getSessionList(): Promise<SessionListItem[]> {
    const all = this.getAll();
    return Object.values(all)
      .map((s) => ({
        id: s.id,
        topic: s.topic,
        createdAt: s.createdAt,
        completedAt: s.completedAt,
        turnCount: s.messages.length,
        hasSummary: !!s.summary,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async deleteSession(id: string): Promise<void> {
    const all = this.getAll();
    delete all[id];
    this.setAll(all);
  }

  async exportSession(id: string, format: "json" | "text"): Promise<string> {
    const session = await this.getSession(id);
    if (!session) throw new Error("Session not found");
    if (format === "json") return JSON.stringify(session, null, 2);
    return formatSessionAsText(session);
  }
}

function formatSessionAsText(session: Session): string {
  const lines: string[] = [];
  lines.push(`=== ASKUS 코칭 세션 ===`);
  lines.push(`주제: ${session.topic}`);
  lines.push(`날짜: ${new Date(session.createdAt).toLocaleDateString("ko-KR")}`);
  lines.push("");

  if (session.summary) {
    lines.push("--- 핵심 인사이트 ---");
    session.summary.insights.forEach((i) => lines.push(`• ${i}`));
    lines.push("");
    lines.push("--- 실행 계획 ---");
    session.summary.actionPlan.forEach((a) => lines.push(`☐ ${a}`));
    lines.push("");
  }

  lines.push("--- 대화 기록 ---");
  session.messages.forEach((m) => {
    const role = m.role === "assistant" ? "코치" : "나";
    lines.push(`[${role}] ${m.content}`);
  });

  return lines.join("\n");
}
```

- [ ] **Step 5: localStorage 테스트 통과 확인**

```bash
npm run test:run -- __tests__/lib/local-storage.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 6: export 테스트 작성**

`askus/__tests__/lib/export.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageProvider } from "@/lib/storage/local-storage";
import type { Session } from "@/lib/storage/types";

const sessionWithSummary: Session = {
  id: "export-test",
  topic: "career",
  emotionBefore: 2,
  emotionAfter: 4,
  messages: [
    { id: "m1", role: "assistant", content: "어떤 이야기를 해볼까요?", stage: "goal", timestamp: 1000 },
    { id: "m2", role: "user", content: "이직 고민이요", stage: null, timestamp: 2000 },
  ],
  summary: {
    insights: ["성장 정체를 느끼고 있음"],
    decisions: ["이직 준비 시작"],
    actionPlan: ["이력서 업데이트"],
    growJourney: ["goal", "reality"],
  },
  createdAt: Date.now(),
  completedAt: Date.now(),
};

describe("exportSession", () => {
  let provider: LocalStorageProvider;

  beforeEach(() => {
    localStorage.clear();
    provider = new LocalStorageProvider();
  });

  it("exports as JSON", async () => {
    await provider.saveSession(sessionWithSummary);
    const json = await provider.exportSession("export-test", "json");
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe("export-test");
    expect(parsed.messages).toHaveLength(2);
  });

  it("exports as text with summary", async () => {
    await provider.saveSession(sessionWithSummary);
    const text = await provider.exportSession("export-test", "text");
    expect(text).toContain("ASKUS 코칭 세션");
    expect(text).toContain("핵심 인사이트");
    expect(text).toContain("성장 정체를 느끼고 있음");
    expect(text).toContain("[코치] 어떤 이야기를 해볼까요?");
  });

  it("throws for non-existent session", async () => {
    await expect(provider.exportSession("nope", "json")).rejects.toThrow("Session not found");
  });
});
```

- [ ] **Step 7: export 테스트 통과 확인**

```bash
npm run test:run -- __tests__/lib/export.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 8: 커밋**

```bash
git add lib/storage/ __tests__/lib/local-storage.test.ts __tests__/lib/export.test.ts
git commit -m "feat: core types and localStorage storage layer with export"
```

---

## Task 3: AI 레이어 — 시스템 프롬프트, GROW 파서, 주제

**Files:**
- Create: `askus/lib/ai/system-prompt.ts`
- Create: `askus/lib/ai/grow-parser.ts`
- Create: `askus/lib/ai/topics.ts`
- Create: `askus/__tests__/lib/grow-parser.test.ts`

- [ ] **Step 1: GROW 파서 테스트 작성**

`askus/__tests__/lib/grow-parser.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { parseGrowPrefix, type GrowMeta } from "@/lib/ai/grow-parser";

describe("parseGrowPrefix", () => {
  it("parses valid prefix", () => {
    const input = "<<GROW:reality:0.85>>\n그 상황이 힘드셨겠어요.";
    const result = parseGrowPrefix(input);
    expect(result.meta).toEqual({ stage: "reality", confidence: 0.85 });
    expect(result.text).toBe("그 상황이 힘드셨겠어요.");
  });

  it("parses prefix without newline", () => {
    const input = "<<GROW:goal:0.9>>오늘 어떤 이야기를 해볼까요?";
    const result = parseGrowPrefix(input);
    expect(result.meta).toEqual({ stage: "goal", confidence: 0.9 });
    expect(result.text).toBe("오늘 어떤 이야기를 해볼까요?");
  });

  it("returns null meta when prefix is missing", () => {
    const input = "프리픽스 없는 응답입니다.";
    const result = parseGrowPrefix(input);
    expect(result.meta).toBeNull();
    expect(result.text).toBe("프리픽스 없는 응답입니다.");
  });

  it("returns null meta for malformed prefix", () => {
    const input = "<<GROW:invalid>>\n응답";
    const result = parseGrowPrefix(input);
    expect(result.meta).toBeNull();
    expect(result.text).toBe("<<GROW:invalid>>\n응답");
  });

  it("handles all four GROW stages", () => {
    const stages = ["goal", "reality", "options", "will"] as const;
    stages.forEach((stage) => {
      const result = parseGrowPrefix(`<<GROW:${stage}:0.8>>\n텍스트`);
      expect(result.meta?.stage).toBe(stage);
    });
  });
});

describe("findGrowPrefixEnd", () => {
  // Streaming에서 버퍼를 점진적으로 파싱하는 함수 테스트
  it("returns -1 when buffer has no complete prefix", () => {
    const { findGrowPrefixEnd } = require("@/lib/ai/grow-parser");
    expect(findGrowPrefixEnd("<<GROW:re")).toBe(-1);
  });

  it("returns end index when prefix is complete", () => {
    const { findGrowPrefixEnd } = require("@/lib/ai/grow-parser");
    const buffer = "<<GROW:reality:0.85>>\n나머지 텍스트";
    const end = findGrowPrefixEnd(buffer);
    expect(end).toBe(21); // ">>" 다음의 "\n" 위치
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- __tests__/lib/grow-parser.test.ts
```

Expected: FAIL

- [ ] **Step 3: GROW 파서 구현**

`askus/lib/ai/grow-parser.ts`:
```typescript
import type { GrowStage } from "@/lib/storage/types";

export interface GrowMeta {
  stage: GrowStage;
  confidence: number;
}

export interface ParseResult {
  meta: GrowMeta | null;
  text: string;
}

const GROW_REGEX = /^<<GROW:(goal|reality|options|will):([\d.]+)>>\n?/;
const VALID_STAGES = new Set(["goal", "reality", "options", "will"]);

export function parseGrowPrefix(input: string): ParseResult {
  const match = input.match(GROW_REGEX);
  if (!match) {
    return { meta: null, text: input };
  }

  const stage = match[1] as GrowStage;
  const confidence = parseFloat(match[2]);

  if (!VALID_STAGES.has(stage) || isNaN(confidence)) {
    return { meta: null, text: input };
  }

  return {
    meta: { stage, confidence },
    text: input.slice(match[0].length),
  };
}

/**
 * 스트리밍 버퍼에서 GROW 프리픽스 끝 위치를 찾는다.
 * 프리픽스가 완성되지 않았으면 -1을 반환한다.
 * 프리픽스가 완성되면 프리픽스 뒤 첫 콘텐츠 문자의 인덱스를 반환한다.
 */
export function findGrowPrefixEnd(buffer: string): number {
  if (!buffer.startsWith("<<GROW:")) return -1;

  const closingIndex = buffer.indexOf(">>");
  if (closingIndex === -1) return -1;

  const afterClosing = closingIndex + 2;
  // 줄바꿈이 있으면 그것도 건너뜀
  if (buffer[afterClosing] === "\n") return afterClosing + 1;
  return afterClosing;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- __tests__/lib/grow-parser.test.ts
```

Expected: PASS (7 tests)

- [ ] **Step 5: 시스템 프롬프트 작성**

`askus/lib/ai/system-prompt.ts`:
```typescript
export const COACHING_SYSTEM_PROMPT = `# 역할
당신은 ASKUS의 코치입니다.
코칭의 본질: 답을 주지 않는다. 올바른 질문으로 상대방이 스스로 답을 찾게 한다.

# 응답 형식 (반드시 준수)
매 응답의 첫 줄에 아래 형식을 포함하세요:
<<GROW:단계:확신도>>
- 단계: goal, reality, options, will 중 하나
- 확신도: 0.0~1.0 (이 단계가 맞다는 확신)
- 예: <<GROW:reality:0.85>>
이 줄 이후에 실제 코칭 응답을 작성합니다.

# GROW 모델 (대화 구조)
대화는 자연스럽게 GROW 흐름을 따릅니다. 강요하지 마세요.

## Goal (목표 설정)
- 구체적이고 측정 가능한 목표를 명확히 한다
- 예시: "오늘 이 대화를 통해 어떤 것을 얻어가고 싶으신가요?"

## Reality (현실 점검)
- 현재 상황, 장애물, 자원을 탐색한다
- 예시: "지금 이 상황에서 가장 어렵게 느껴지는 것은 무엇인가요?"

## Options (대안 탐색)
- 판단 없이 가능성을 넓힌다
- 예시: "지금 할 수 있는 방법을 3가지만 말해본다면요?"

## Will (실행 의지)
- 구체적 행동 계획을 수립한다
- 예시: "이번 주에 가장 먼저 실행할 한 가지는 무엇인가요?"

# SBI 피드백 모델 (피드백/갈등 상황 시)
사용자가 타인과의 갈등이나 피드백을 이야기할 때:
- 직접 피드백을 주지 마세요
- 질문으로 사용자가 SBI 구조를 스스로 정리하도록 유도하세요
  S(Situation): "그 일이 구체적으로 언제, 어디서 있었나요?"
  B(Behavior): "그때 상대방은 어떤 행동을 했나요?"
  I(Impact): "그 행동이 당신에게 어떤 영향을 주었나요?"

# 변화 단계 감지
사용자의 변화 준비 상태를 파악하고 맞춤 접근하세요:
- 인식 전: 판단 없이 경청, 현재 상황 탐색
- 인식: 양가감정 탐색, 장단점 질문
- 준비: 강점 발견, 자원 탐색
- 행동: 작은 성공 인식, 장애물 대비
- 유지: 정체성 연결, 재발 방지

# 대화 원칙
1. 질문 중심: 절대 먼저 해답을 제시하지 않는다
2. 판단 금지: 사용자의 선택과 감정을 평가하지 않는다
3. 하나의 질문: 한 번에 한 개의 질문만 던진다
4. 공감 선행: 질문 전 반드시 공감 또는 반영(Reflection) 한 문장을 넣는다
5. GROW 흐름: 대화 맥락을 기억하며 자연스럽게 다음 단계로 이동한다

# 응답 패턴
[공감] "그 상황이 꽤 무겁게 느껴지셨겠어요."
[반영] "말씀하신 것처럼, 지금 가장 걸리는 부분은 ○○인 것 같네요."
[질문] "그렇다면, 이상적으로는 어떤 상태가 되기를 바라시나요?"

# 금지 행동
- "~하면 됩니다" (지시형 조언) 금지
- "좋은 생각이에요!" (과도한 칭찬) 금지
- "그건 잘못된 것 같아요" (평가) 금지
- 3개 이상 질문 연속 금지
- 의학적/심리치료적 진단 및 처방 금지

# 위기 감지
자해, 자살, 극심한 우울 등 위기 신호 감지 시:
1. 공감과 지지를 표현한다
2. 전문가 연결을 안내한다:
   "지금 많이 힘드신 것 같아요. 전문 상담사와 이야기하시면 큰 도움이 될 수 있습니다.
   자살예방상담전화: 1393 | 정신건강위기상담전화: 1577-0199"
3. 코칭을 계속하지 않는다

# 톤
- 한국어 자연스러운 존댓말
- 따뜻하지만 지적인 톤
- 간결하게. 긴 설명보다 하나의 좋은 질문.`;

export const SUMMARIZE_SYSTEM_PROMPT = `당신은 코칭 세션 요약 전문가입니다.
아래 코칭 대화를 분석하여 다음 정보를 JSON으로 추출하세요.

## 출력 형식 (반드시 이 JSON 형식만 출력하세요)
{
  "insights": ["핵심 인사이트 1", "인사이트 2", ...],
  "decisions": ["결정 사항 1", ...],
  "actionPlan": ["구체적 실행 계획 1", ...],
  "growJourney": ["goal", "reality", ...]
}

## 지침
- insights: 사용자가 대화에서 발견한 핵심 깨달음 (2~4개)
- decisions: 사용자가 내린 결정이나 선택 (0~3개, 없으면 빈 배열)
- actionPlan: 구체적이고 실행 가능한 행동 계획 (1~3개)
- growJourney: 대화가 거쳐간 GROW 단계를 순서대로
- 한국어로 작성
- JSON만 출력, 다른 텍스트 없이`;
```

- [ ] **Step 6: 주제별 오프닝 질문 작성**

`askus/lib/ai/topics.ts`:
```typescript
import type { CoachingTopic } from "@/lib/storage/types";

interface TopicConfig {
  label: string;
  icon: string;
  keywords: string;
  opening: string;
}

export const TOPICS: Record<CoachingTopic, TopicConfig> = {
  career: {
    label: "커리어",
    icon: "💼",
    keywords: "이직, 성장, 역할, 방향성",
    opening: "커리어에 대해 이야기하고 싶으시군요. 요즘 일과 관련해서 가장 마음에 걸리는 것은 무엇인가요?",
  },
  relationship: {
    label: "관계",
    icon: "🤝",
    keywords: "동료, 상사, 가족, 파트너",
    opening: "관계에 대해 탐색해보고 싶으시군요. 지금 가장 신경 쓰이는 관계가 있으신가요?",
  },
  goal: {
    label: "목표",
    icon: "🎯",
    keywords: "달성, 습관, 계획, 실행",
    opening: "목표에 대해 이야기해볼까요. 요즘 이루고 싶은 것이 있다면 무엇인가요?",
  },
  self: {
    label: "자기이해",
    icon: "🪞",
    keywords: "강점, 가치관, 정체성",
    opening: "자기 자신에 대해 탐색하고 싶으시군요. 요즘 스스로에 대해 궁금하거나 고민되는 부분이 있으신가요?",
  },
  other: {
    label: "기타",
    icon: "💬",
    keywords: "자유 주제로 대화하기",
    opening: "어떤 이야기든 좋습니다. 오늘 마음속에 있는 것을 편하게 꺼내주세요.",
  },
};
```

- [ ] **Step 7: 커밋**

```bash
git add lib/ai/ __tests__/lib/grow-parser.test.ts
git commit -m "feat: AI layer - system prompt, GROW parser, coaching topics"
```

---

## Task 4: API Route — /api/chat (스트리밍)

**Files:**
- Create: `askus/app/api/chat/route.ts`

- [ ] **Step 1: 스트리밍 chat API 구현**

`askus/app/api/chat/route.ts`:
```typescript
import OpenAI from "openai";
import { COACHING_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ChatRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  topic: string;
}

export async function POST(req: Request) {
  try {
    const { messages, topic }: ChatRequest = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("messages is required", { status: 400 });
    }

    const systemMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: COACHING_SYSTEM_PROMPT },
    ];

    // Goal 핀 전략: 첫 4개 메시지는 항상 포함 (Goal 설정 대화)
    const pinnedCount = Math.min(4, messages.length);
    const pinned = messages.slice(0, pinnedCount);
    const recent = messages.slice(pinnedCount);

    // 슬라이딩 윈도우: 최근 메시지 중 토큰 예산 내에서 최대한 포함
    // 간단한 근사: 메시지당 ~200토큰 추정, 최대 40개
    const maxRecent = 40;
    const windowedRecent = recent.slice(-maxRecent);

    const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      ...systemMessages,
      ...pinned.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ...windowedRecent.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      messages: apiMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
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
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add app/api/chat/
git commit -m "feat: streaming chat API route with goal pinning strategy"
```

---

## Task 5: API Route — /api/summarize

**Files:**
- Create: `askus/app/api/summarize/route.ts`

- [ ] **Step 1: 요약 API 구현**

`askus/app/api/summarize/route.ts`:
```typescript
import OpenAI from "openai";
import { SUMMARIZE_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import type { SessionSummary } from "@/lib/storage/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface SummarizeRequest {
  messages: { role: string; content: string }[];
}

export async function POST(req: Request) {
  try {
    const { messages }: SummarizeRequest = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("messages is required", { status: 400 });
    }

    const conversationText = messages
      .map((m) => `[${m.role === "assistant" ? "코치" : "사용자"}] ${m.content}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      messages: [
        { role: "system", content: SUMMARIZE_SYSTEM_PROMPT },
        { role: "user", content: conversationText },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const raw = response.choices[0]?.message?.content ?? "";

    // JSON 파싱 시도 — 코드 블록으로 감싸져 있을 수 있음
    const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const summary: SessionSummary = JSON.parse(jsonStr);

    return Response.json(summary);
  } catch (error) {
    console.error("Summarize API error:", error);
    return new Response("Failed to generate summary", { status: 500 });
  }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add app/api/summarize/
git commit -m "feat: session summarize API route"
```

---

## Task 6: 커스텀 훅 — useSession + useChat

**Files:**
- Create: `askus/lib/hooks/useSession.ts`
- Create: `askus/lib/hooks/useChat.ts`

- [ ] **Step 1: useSession 훅 구현**

`askus/lib/hooks/useSession.ts`:
```typescript
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
      const updated = {
        ...session,
        emotionAfter,
        summary,
        completedAt: Date.now(),
      };
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

  return {
    session,
    loading,
    createSession,
    loadSession,
    addMessage,
    completeSession,
    exportSession,
  };
}
```

- [ ] **Step 2: useChat 훅 구현 (스트리밍 + GROW 추적)**

`askus/lib/hooks/useChat.ts`:
```typescript
"use client";

import { useState, useCallback, useRef } from "react";
import { parseGrowPrefix, findGrowPrefixEnd } from "@/lib/ai/grow-parser";
import type { GrowStage, Message } from "@/lib/storage/types";

interface UseChatOptions {
  onMessage?: (message: Message) => void;
  onStageChange?: (stage: GrowStage) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStage, setCurrentStage] = useState<GrowStage>("goal");
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, topic: string) => {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        stage: null,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      options.onMessage?.(userMessage);
      setIsStreaming(true);
      setStreamingContent("");

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const allMessages = [...messages, userMessage];
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
            topic,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) throw new Error("Chat request failed");
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let prefixParsed = false;
        let parsedStage: GrowStage | null = null;
        let visibleText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          if (!prefixParsed) {
            const prefixEnd = findGrowPrefixEnd(buffer);
            if (prefixEnd === -1) {
              // 프리픽스가 아직 완성되지 않음 — 계속 버퍼링
              // 단, <<GROW: 로 시작하지 않으면 프리픽스 없는 것으로 처리
              if (buffer.length > 5 && !buffer.startsWith("<<GROW:")) {
                prefixParsed = true;
                visibleText = buffer;
                setStreamingContent(visibleText);
              }
              continue;
            }

            // 프리픽스 파싱
            const prefixStr = buffer.slice(0, prefixEnd);
            const { meta } = parseGrowPrefix(prefixStr);
            if (meta && meta.confidence >= 0.7) {
              parsedStage = meta.stage;
              setCurrentStage(meta.stage);
              options.onStageChange?.(meta.stage);
            }

            prefixParsed = true;
            visibleText = buffer.slice(prefixEnd);
            setStreamingContent(visibleText);
          } else {
            visibleText = prefixParsed
              ? buffer.slice(findGrowPrefixEnd(buffer) === -1 ? 0 : findGrowPrefixEnd(buffer))
              : buffer;
            setStreamingContent(visibleText);
          }
        }

        // 스트리밍 완료 — 최종 메시지 저장
        const finalParse = parseGrowPrefix(buffer);
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: finalParse.text.trim(),
          stage: parsedStage ?? currentStage,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent("");
        options.onMessage?.(assistantMessage);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Chat error:", error);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, currentStage, options]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const initMessages = useCallback((initial: Message[]) => {
    setMessages(initial);
    // 마지막 assistant 메시지의 stage로 현재 단계 복원
    const lastAssistant = [...initial].reverse().find((m) => m.role === "assistant" && m.stage);
    if (lastAssistant?.stage) {
      setCurrentStage(lastAssistant.stage);
    }
  }, []);

  const turnCount = messages.length;

  return {
    messages,
    isStreaming,
    currentStage,
    streamingContent,
    turnCount,
    sendMessage,
    stopStreaming,
    initMessages,
  };
}
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add lib/hooks/
git commit -m "feat: useSession and useChat hooks with streaming GROW tracking"
```

---

## Task 7: 컴포넌트 — GrowProgressBar

**Files:**
- Create: `askus/components/grow/GrowProgressBar.tsx`
- Create: `askus/__tests__/components/GrowProgressBar.test.tsx`

- [ ] **Step 1: GrowProgressBar 테스트 작성**

`askus/__tests__/components/GrowProgressBar.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GrowProgressBar } from "@/components/grow/GrowProgressBar";

describe("GrowProgressBar", () => {
  it("renders all four stages", () => {
    render(<GrowProgressBar currentStage="goal" />);
    expect(screen.getByText("G")).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
    expect(screen.getByText("O")).toBeInTheDocument();
    expect(screen.getByText("W")).toBeInTheDocument();
  });

  it("highlights the current stage", () => {
    render(<GrowProgressBar currentStage="reality" />);
    const realityLabel = screen.getByText("Reality");
    expect(realityLabel).toHaveClass("font-bold");
  });

  it("marks completed stages", () => {
    render(<GrowProgressBar currentStage="options" />);
    // Goal and Reality should be completed (before Options)
    const goalLabel = screen.getByText("Goal");
    expect(goalLabel).toHaveClass("text-brand-purple");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- __tests__/components/GrowProgressBar.test.tsx
```

Expected: FAIL

- [ ] **Step 3: GrowProgressBar 구현**

`askus/components/grow/GrowProgressBar.tsx`:
```tsx
import type { GrowStage } from "@/lib/storage/types";

const STAGES: { key: GrowStage; letter: string; label: string }[] = [
  { key: "goal", letter: "G", label: "Goal" },
  { key: "reality", letter: "R", label: "Reality" },
  { key: "options", letter: "O", label: "Options" },
  { key: "will", letter: "W", label: "Will" },
];

const STAGE_ORDER: Record<GrowStage, number> = {
  goal: 0,
  reality: 1,
  options: 2,
  will: 3,
};

interface GrowProgressBarProps {
  currentStage: GrowStage;
}

export function GrowProgressBar({ currentStage }: GrowProgressBarProps) {
  const currentIndex = STAGE_ORDER[currentStage];

  return (
    <div className="bg-white border-b border-brand-soft px-5 py-3">
      <div className="relative flex items-center">
        {/* 배경 연결선 */}
        <div className="absolute top-[14px] left-[12%] right-[12%] h-[2px] bg-gray-200" />
        {/* 활성 연결선 */}
        <div
          className="absolute top-[14px] left-[12%] h-[2px] bg-brand-purple transition-all duration-300 ease-out"
          style={{ width: `${(currentIndex / 3) * 76}%` }}
        />

        {STAGES.map((stage, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isUpcoming = i > currentIndex;

          return (
            <div key={stage.key} className="relative z-10 flex-1 text-center">
              <div
                className={`mx-auto mb-1 flex items-center justify-center rounded-full transition-all duration-300
                  ${isCurrent ? "h-8 w-8 bg-brand-purple shadow-[0_0_0_4px_#EEEDFE]" : ""}
                  ${isCompleted ? "h-7 w-7 bg-brand-purple" : ""}
                  ${isUpcoming ? "h-7 w-7 bg-gray-200" : ""}
                `}
              >
                <span
                  className={`text-xs font-bold ${isUpcoming ? "text-brand-gray" : "text-white"}`}
                >
                  {stage.letter}
                </span>
              </div>
              <span
                className={`text-[10px] transition-colors duration-300
                  ${isCurrent ? "font-bold text-brand-purple" : ""}
                  ${isCompleted ? "font-semibold text-brand-purple" : ""}
                  ${isUpcoming ? "text-brand-gray" : ""}
                `}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- __tests__/components/GrowProgressBar.test.tsx
```

Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add components/grow/ __tests__/components/GrowProgressBar.test.tsx
git commit -m "feat: GrowProgressBar component with stage transitions"
```

---

## Task 8: 컴포넌트 — Chat (MessageBubble, ChatInput, TypingIndicator)

**Files:**
- Create: `askus/components/chat/MessageBubble.tsx`
- Create: `askus/components/chat/ChatInput.tsx`
- Create: `askus/components/chat/TypingIndicator.tsx`
- Create: `askus/components/chat/ChatContainer.tsx`
- Create: `askus/__tests__/components/MessageBubble.test.tsx`

- [ ] **Step 1: MessageBubble 테스트 작성**

`askus/__tests__/components/MessageBubble.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBubble } from "@/components/chat/MessageBubble";

describe("MessageBubble", () => {
  it("renders assistant message with avatar", () => {
    render(<MessageBubble role="assistant" content="안녕하세요." />);
    expect(screen.getByText("안녕하세요.")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument(); // 아바타
  });

  it("renders user message without avatar", () => {
    render(<MessageBubble role="user" content="이직 고민이요." />);
    expect(screen.getByText("이직 고민이요.")).toBeInTheDocument();
    expect(screen.queryByText("A")).not.toBeInTheDocument();
  });

  it("applies different styles for roles", () => {
    const { container: assistant } = render(<MessageBubble role="assistant" content="코치" />);
    const { container: user } = render(<MessageBubble role="user" content="사용자" />);
    // assistant은 좌측(justify-start), user는 우측(justify-end)
    expect(assistant.firstChild).toHaveClass("justify-start");
    expect(user.firstChild).toHaveClass("justify-end");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- __tests__/components/MessageBubble.test.tsx
```

Expected: FAIL

- [ ] **Step 3: MessageBubble 구현**

`askus/components/chat/MessageBubble.tsx`:
```tsx
interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isAssistant = role === "assistant";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"} animate-in fade-in duration-200`}>
      {isAssistant && (
        <div className="mr-2.5 flex-shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-deep to-brand-purple">
            <span className="text-[10px] font-semibold text-white">A</span>
          </div>
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3.5 text-[13px] leading-[1.8] ${
          isAssistant
            ? "rounded-[4px_16px_16px_16px] bg-white text-gray-900 shadow-sm"
            : "rounded-[16px_4px_16px_16px] bg-brand-purple text-white"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- __tests__/components/MessageBubble.test.tsx
```

Expected: PASS (3 tests)

- [ ] **Step 5: TypingIndicator 구현**

`askus/components/chat/TypingIndicator.tsx`:
```tsx
export function TypingIndicator() {
  return (
    <div className="flex items-start justify-start">
      <div className="mr-2.5 flex-shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-deep to-brand-purple">
          <span className="text-[10px] font-semibold text-white">A</span>
        </div>
      </div>
      <div className="flex gap-1 rounded-[4px_16px_16px_16px] bg-white px-4 py-3 shadow-sm">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-purple opacity-40 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-purple opacity-60 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-purple opacity-80 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: ChatInput 구현**

`askus/components/chat/ChatInput.tsx`:
```tsx
"use client";

import { useState, useRef, useCallback } from "react";

interface ChatInputProps {
  onSend: (content: string) => void;
  onRequestQuestion: () => void;
  disabled?: boolean;
  turnCount: number;
  maxTurns?: number;
}

export function ChatInput({
  onSend,
  onRequestQuestion,
  disabled = false,
  turnCount,
  maxTurns = 30,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed.length < 2 || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // 자동 높이 조절
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const isNearLimit = turnCount >= 25;

  return (
    <div className="border-t border-brand-soft bg-white px-5 py-3.5">
      <div className="flex items-end gap-2.5">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="이야기를 들려주세요..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl bg-gray-50 px-4 py-3 text-[13px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-soft"
        />
        <button
          onClick={handleSend}
          disabled={disabled || value.trim().length < 2}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-purple text-white transition-opacity disabled:opacity-40"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={onRequestQuestion}
          disabled={disabled}
          className="rounded-md border border-brand-soft px-2.5 py-1 text-[11px] text-brand-purple transition-colors hover:bg-brand-soft disabled:opacity-40"
        >
          코치에게 질문 받기
        </button>
        <span
          className={`text-[11px] ${isNearLimit ? "font-medium text-brand-teal" : "text-gray-400"}`}
        >
          {turnCount} / {maxTurns}턴
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: ChatContainer 조립**

`askus/components/chat/ChatContainer.tsx`:
```tsx
"use client";

import { useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { Message } from "@/lib/storage/types";

interface ChatContainerProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
}

export function ChatContainer({ messages, isStreaming, streamingContent }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 메시지 시 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
      <div className="flex flex-col gap-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}

        {/* 스트리밍 중인 메시지 */}
        {isStreaming && streamingContent && (
          <MessageBubble role="assistant" content={streamingContent} />
        )}

        {/* 스트리밍 대기 중 (콘텐츠 아직 없을 때) */}
        {isStreaming && !streamingContent && <TypingIndicator />}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: 커밋**

```bash
git add components/chat/ __tests__/components/MessageBubble.test.tsx
git commit -m "feat: chat components - MessageBubble, ChatInput, TypingIndicator, ChatContainer"
```

---

## Task 9: 컴포넌트 — TopicSelector + EmotionSlider

**Files:**
- Create: `askus/components/session/TopicSelector.tsx`
- Create: `askus/components/session/EmotionSlider.tsx`
- Create: `askus/__tests__/components/TopicSelector.test.tsx`

- [ ] **Step 1: TopicSelector 테스트 작성**

`askus/__tests__/components/TopicSelector.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TopicSelector } from "@/components/session/TopicSelector";

describe("TopicSelector", () => {
  it("renders all 5 topic options", () => {
    render(<TopicSelector selected={null} onSelect={vi.fn()} />);
    expect(screen.getByText("커리어")).toBeInTheDocument();
    expect(screen.getByText("관계")).toBeInTheDocument();
    expect(screen.getByText("목표")).toBeInTheDocument();
    expect(screen.getByText("자기이해")).toBeInTheDocument();
    expect(screen.getByText("기타")).toBeInTheDocument();
  });

  it("calls onSelect when a topic is clicked", () => {
    const onSelect = vi.fn();
    render(<TopicSelector selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("커리어"));
    expect(onSelect).toHaveBeenCalledWith("career");
  });

  it("highlights the selected topic", () => {
    render(<TopicSelector selected="career" onSelect={vi.fn()} />);
    const careerCard = screen.getByText("커리어").closest("[data-topic]");
    expect(careerCard).toHaveAttribute("data-selected", "true");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- __tests__/components/TopicSelector.test.tsx
```

Expected: FAIL

- [ ] **Step 3: TopicSelector 구현**

`askus/components/session/TopicSelector.tsx`:
```tsx
import { TOPICS } from "@/lib/ai/topics";
import type { CoachingTopic } from "@/lib/storage/types";

interface TopicSelectorProps {
  selected: CoachingTopic | null;
  onSelect: (topic: CoachingTopic) => void;
}

const TOPIC_KEYS: CoachingTopic[] = ["career", "relationship", "goal", "self", "other"];

export function TopicSelector({ selected, onSelect }: TopicSelectorProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {TOPIC_KEYS.map((key) => {
        const topic = TOPICS[key];
        const isSelected = selected === key;

        return (
          <button
            key={key}
            data-topic={key}
            data-selected={isSelected ? "true" : "false"}
            onClick={() => onSelect(key)}
            className={`flex items-center gap-3.5 rounded-xl border-[1.5px] bg-white px-4 py-4 text-left transition-all
              ${isSelected ? "border-brand-purple shadow-[0_0_0_3px_#EEEDFE]" : "border-brand-soft hover:border-brand-purple/30"}
            `}
          >
            <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-xl">
              {topic.icon}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-semibold ${isSelected ? "text-brand-purple" : "text-gray-900"}`}>
                {topic.label}
              </div>
              <div className="mt-0.5 text-[11px] text-brand-gray">{topic.keywords}</div>
            </div>
            {isSelected && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-purple">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- __tests__/components/TopicSelector.test.tsx
```

Expected: PASS (3 tests)

- [ ] **Step 5: EmotionSlider 구현**

`askus/components/session/EmotionSlider.tsx`:
```tsx
"use client";

import { useState } from "react";

const EMOTIONS = [
  { value: 1, emoji: "😔", label: "많이 힘든" },
  { value: 2, emoji: "😕", label: "좀 무거운" },
  { value: 3, emoji: "😐", label: "보통" },
  { value: 4, emoji: "🙂", label: "괜찮은" },
  { value: 5, emoji: "😊", label: "아주 좋은" },
];

interface EmotionSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function EmotionSlider({ value, onChange }: EmotionSliderProps) {
  return (
    <div className="px-4">
      <div className="mb-6 flex justify-between">
        {EMOTIONS.map((e) => {
          const isSelected = e.value === value;
          return (
            <button
              key={e.value}
              onClick={() => onChange(e.value)}
              className={`flex flex-col items-center transition-all ${isSelected ? "scale-110 opacity-100" : "opacity-40 hover:opacity-60"}`}
            >
              <span className={`${isSelected ? "text-4xl" : "text-[32px]"} mb-1`}>{e.emoji}</span>
              <span
                className={`text-[10px] ${isSelected ? "font-semibold text-brand-purple" : "text-brand-gray"}`}
              >
                {e.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 슬라이더 트랙 */}
      <div className="relative h-1.5 rounded-full bg-gray-200">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-brand-deep to-brand-purple transition-all duration-200"
          style={{ width: `${((value - 1) / 4) * 100}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-[3px] border-white bg-brand-purple shadow-md transition-all duration-200"
          style={{ left: `calc(${((value - 1) / 4) * 100}% - 10px)` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-gray-400">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 커밋**

```bash
git add components/session/ __tests__/components/TopicSelector.test.tsx
git commit -m "feat: TopicSelector and EmotionSlider components"
```

---

## Task 10: 페이지 — 랜딩 (`/`)

**Files:**
- Modify: `askus/app/page.tsx`

- [ ] **Step 1: 랜딩 페이지 구현**

`askus/app/page.tsx`:
```tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-deep via-brand-purple to-[#7F77DD] px-8 pb-12 pt-16 text-center">
        {/* 장식 원 */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/[0.06]" />
        <div className="absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-white/[0.04]" />

        <p className="mb-5 text-[11px] uppercase tracking-[0.16em] text-white/60">
          Homo Askers
        </p>

        <div className="mb-6 flex items-end justify-center gap-1">
          <span className="text-5xl font-medium tracking-[-2px] text-white">ASKUS</span>
          <div className="mb-2 h-2 w-2 rounded-full bg-brand-teal" />
        </div>

        <p className="mb-1 text-lg leading-relaxed text-white/90">
          삶의 <span className="font-semibold text-white">질문</span>에 대한{" "}
          <span className="font-semibold text-white">답</span>을
        </p>
        <p className="mb-8 text-lg leading-relaxed text-white/90">
          찾아가는 <span className="font-semibold text-white">여정</span>.
        </p>

        <Link
          href="/session/new"
          className="inline-block rounded-xl bg-white px-9 py-3.5 text-[15px] font-semibold text-brand-purple shadow-lg transition-transform hover:scale-105"
        >
          코칭 시작하기
        </Link>

        <p className="mt-4 text-xs text-white/50">무료 체험 | 회원가입 불필요</p>
      </section>

      {/* 가치 제안 */}
      <section className="px-6 py-10">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.1em] text-brand-gray">
          Why ASKUS
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              icon: "🤔",
              title: "질문으로 이끄는",
              desc: "답을 주지 않습니다.\n당신 안의 답을 꺼냅니다.",
            },
            {
              icon: "🌱",
              title: "GROW 프레임워크",
              desc: "검증된 코칭 모델로\n체계적인 대화를 합니다.",
            },
            {
              icon: "🔒",
              title: "완전한 프라이버시",
              desc: "대화는 서버에 저장되지\n않습니다. 당신만의 공간.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-brand-soft bg-white px-4 py-5 text-center"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-soft text-lg">
                {item.icon}
              </div>
              <p className="mb-1.5 text-[13px] font-semibold text-gray-900">{item.title}</p>
              <p className="whitespace-pre-line text-[11px] leading-relaxed text-brand-gray">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 하단 */}
      <footer className="py-6 text-center text-[11px] text-gray-400">
        질문이 당신을 바꿉니다.
      </footer>
    </main>
  );
}
```

- [ ] **Step 2: 개발 서버에서 확인**

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속하여 랜딩 페이지 렌더링 확인.

- [ ] **Step 3: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: landing page with brand hero and value propositions"
```

---

## Task 11: 페이지 — 세션 시작 (`/session/new`)

**Files:**
- Create: `askus/app/session/new/page.tsx`

- [ ] **Step 1: 세션 시작 페이지 구현**

`askus/app/session/new/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopicSelector } from "@/components/session/TopicSelector";
import { EmotionSlider } from "@/components/session/EmotionSlider";
import { useSession } from "@/lib/hooks/useSession";
import type { CoachingTopic } from "@/lib/storage/types";
import { TOPICS } from "@/lib/ai/topics";

export default function NewSessionPage() {
  const router = useRouter();
  const { createSession } = useSession(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [topic, setTopic] = useState<CoachingTopic | null>(null);
  const [topicDetail, setTopicDetail] = useState("");
  const [emotion, setEmotion] = useState(3);

  const handleNext = () => {
    if (!topic) return;
    setStep(2);
  };

  const handleStart = async () => {
    if (!topic) return;
    const id = await createSession(topic, emotion, topic === "other" ? topicDetail : undefined);
    router.push(`/session/${id}`);
  };

  const handleSkipEmotion = async () => {
    if (!topic) return;
    const id = await createSession(topic, 3, topic === "other" ? topicDetail : undefined);
    router.push(`/session/${id}`);
  };

  return (
    <main className="min-h-screen bg-brand-bg">
      {step === 1 && (
        <div className="mx-auto max-w-lg">
          <div className="px-7 pb-5 pt-10 text-center">
            <p className="mb-3 text-[11px] uppercase tracking-[0.1em] text-brand-gray">
              Session Start
            </p>
            <h1 className="mb-1.5 text-[22px] font-semibold text-gray-900">
              오늘은 어떤 이야기를
              <br />
              나눠볼까요?
            </h1>
            <p className="mb-7 text-[13px] text-brand-gray">
              편하게 골라주세요. 정답은 없습니다.
            </p>
          </div>

          <div className="px-5 pb-5">
            <TopicSelector selected={topic} onSelect={setTopic} />

            {topic === "other" && (
              <input
                value={topicDetail}
                onChange={(e) => setTopicDetail(e.target.value)}
                placeholder="어떤 이야기를 하고 싶으신가요?"
                className="mt-3 w-full rounded-xl border border-brand-soft bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-soft"
              />
            )}
          </div>

          <div className="px-5 pb-6">
            <button
              onClick={handleNext}
              disabled={!topic}
              className="w-full rounded-xl bg-brand-purple py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mx-auto max-w-lg">
          <div className="px-7 pb-5 pt-10 text-center">
            <p className="mb-3 text-[11px] uppercase tracking-[0.1em] text-brand-gray">
              Emotion Check-in
            </p>
            <h1 className="mb-1.5 text-[22px] font-semibold text-gray-900">
              지금 기분은 어떠세요?
            </h1>
            <p className="mb-10 text-[13px] text-brand-gray">
              판단 없이, 있는 그대로 느껴보세요.
            </p>
          </div>

          <div className="px-5 pb-5">
            <EmotionSlider value={emotion} onChange={setEmotion} />
          </div>

          {/* 세션 요약 미리보기 */}
          <div className="mx-6 mb-6 rounded-xl border border-brand-soft bg-white p-4">
            <p className="mb-2.5 text-[11px] text-brand-gray">오늘의 세션</p>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-gray-900">주제</span>
              <span className="font-medium text-brand-purple">
                {topic ? TOPICS[topic].label : ""}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[13px]">
              <span className="text-gray-900">감정 상태</span>
              <span className="font-medium text-brand-purple">{emotion} / 5</span>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={handleStart}
              className="w-full rounded-xl bg-brand-purple py-3.5 text-sm font-semibold text-white"
            >
              코칭 시작
            </button>
            <div className="mt-2.5 text-center">
              <button
                onClick={handleSkipEmotion}
                className="text-xs text-brand-gray hover:text-brand-purple"
              >
                건너뛰기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: 개발 서버에서 확인**

```bash
npm run dev
```

http://localhost:3000/session/new 에서 주제 선택 → 감정 체크인 흐름 확인.

- [ ] **Step 3: 커밋**

```bash
git add app/session/new/
git commit -m "feat: session start page with topic selection and emotion check-in"
```

---

## Task 12: 페이지 — 코칭 대화 (`/session/[id]`)

**Files:**
- Create: `askus/app/session/[id]/page.tsx`

- [ ] **Step 1: 코칭 대화 페이지 구현**

`askus/app/session/[id]/page.tsx`:
```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { GrowProgressBar } from "@/components/grow/GrowProgressBar";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { useSession } from "@/lib/hooks/useSession";
import { useChat } from "@/lib/hooks/useChat";
import { TOPICS } from "@/lib/ai/topics";
import type { Message, SessionSummary, GrowStage } from "@/lib/storage/types";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { session, loading, loadSession, addMessage, completeSession } = useSession(sessionId);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endEmotion, setEndEmotion] = useState(3);
  const [summarizing, setSummarizing] = useState(false);

  const handleMessage = useCallback(
    (msg: Message) => {
      addMessage(msg);
    },
    [addMessage]
  );

  const {
    messages,
    isStreaming,
    currentStage,
    streamingContent,
    turnCount,
    sendMessage,
    initMessages,
  } = useChat({ onMessage: handleMessage });

  // 세션 로드 + 오프닝 메시지
  useEffect(() => {
    async function init() {
      const s = await loadSession(sessionId);
      if (!s) {
        router.push("/session/new");
        return;
      }

      if (s.messages.length > 0) {
        initMessages(s.messages);
      } else {
        // 첫 진입: 오프닝 메시지
        const opening = TOPICS[s.topic].opening;
        const openingMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: opening,
          stage: "goal",
          timestamp: Date.now(),
        };
        initMessages([openingMsg]);
        addMessage(openingMsg);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleSend = (content: string) => {
    if (!session) return;
    sendMessage(content, session.topic);
  };

  const handleRequestQuestion = () => {
    if (!session) return;
    sendMessage(
      "[시스템] 사용자가 추가 질문을 요청합니다. 현재 GROW 단계에 맞는 탐색 질문을 던져주세요.",
      session.topic
    );
  };

  const handleEndSession = async () => {
    if (!session) return;
    setSummarizing(true);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error("Summarize failed");

      const summary: SessionSummary = await res.json();
      await completeSession(endEmotion, summary);
      router.push(`/session/${sessionId}/summary`);
    } catch (error) {
      console.error("Summarize error:", error);
      setSummarizing(false);
      setShowEndModal(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg">
        <p className="text-sm text-brand-gray">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-brand-bg">
      {/* 헤더 */}
      <header className="flex items-center justify-between border-b border-brand-soft bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-deep to-brand-purple">
            <span className="text-sm font-semibold text-white">A</span>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-gray-900">ASKUS 코치</p>
            <p className="text-[11px] text-brand-gray">
              {TOPICS[session.topic].label} 코칭 세션
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowEndModal(true)}
          disabled={isStreaming}
          className="rounded-lg bg-brand-soft px-3.5 py-1.5 text-xs text-brand-purple transition-colors hover:bg-brand-purple hover:text-white"
        >
          세션 종료
        </button>
      </header>

      {/* GROW 진행 바 */}
      <GrowProgressBar currentStage={currentStage} />

      {/* 대화 영역 */}
      <ChatContainer
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
      />

      {/* 입력 영역 */}
      <ChatInput
        onSend={handleSend}
        onRequestQuestion={handleRequestQuestion}
        disabled={isStreaming || turnCount >= 30}
        turnCount={turnCount}
      />

      {/* 25턴 안내 */}
      {turnCount === 25 && (
        <div className="bg-brand-soft px-5 py-2.5 text-center text-xs text-brand-purple">
          대화를 정리해볼까요? 세션 종료 후 인사이트를 요약해드릴게요.
        </div>
      )}

      {/* 세션 종료 모달 */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-6 w-full max-w-sm rounded-2xl bg-white p-6">
            {!summarizing ? (
              <>
                <h3 className="mb-2 text-center text-lg font-semibold text-gray-900">
                  오늘의 코칭을 마무리할까요?
                </h3>
                <p className="mb-5 text-center text-sm text-brand-gray">
                  세션을 종료하고 인사이트를 정리해드릴게요.
                </p>

                <p className="mb-3 text-center text-xs text-brand-gray">지금 기분은 어떠세요?</p>
                <div className="mb-6 flex justify-center gap-3">
                  {["😔", "😕", "😐", "🙂", "😊"].map((emoji, i) => (
                    <button
                      key={i}
                      onClick={() => setEndEmotion(i + 1)}
                      className={`text-2xl transition-all ${endEmotion === i + 1 ? "scale-125 opacity-100" : "opacity-40"}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEndModal(false)}
                    className="flex-1 rounded-xl border border-brand-soft py-3 text-sm text-brand-gray"
                  >
                    계속하기
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="flex-1 rounded-xl bg-brand-purple py-3 text-sm font-semibold text-white"
                  >
                    마무리하기
                  </button>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand-soft border-t-brand-purple" />
                <p className="text-sm text-brand-gray">
                  오늘의 대화를 정리하고 있어요...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 개발 서버에서 확인**

```bash
npm run dev
```

랜딩 → 주제 선택 → 감정 체크인 → 코칭 대화 페이지 전체 흐름 확인. (API 키가 있어야 실제 대화 가능)

- [ ] **Step 3: 커밋**

```bash
git add app/session/\[id\]/page.tsx
git commit -m "feat: coaching chat page with GROW tracking and session end flow"
```

---

## Task 13: 페이지 — 세션 요약 (`/session/[id]/summary`)

**Files:**
- Create: `askus/app/session/[id]/summary/page.tsx`

- [ ] **Step 1: 세션 요약 페이지 구현**

`askus/app/session/[id]/summary/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/hooks/useSession";
import { TOPICS } from "@/lib/ai/topics";
import type { Session } from "@/lib/storage/types";

const EMOTIONS = ["😔", "😕", "😐", "🙂", "😊"];
const EMOTION_LABELS = ["많이 힘든", "좀 무거운", "보통", "괜찮은", "아주 좋은"];
const GROW_LABELS: Record<string, string> = {
  goal: "Goal",
  reality: "Reality",
  options: "Options",
  will: "Will",
};

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { session, loading, loadSession, exportSession } = useSession(sessionId);

  useEffect(() => {
    loadSession(sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleCopyText = async () => {
    const text = await exportSession("text");
    await navigator.clipboard.writeText(text);
    alert("클립보드에 복사되었습니다.");
  };

  const handleExportJSON = async () => {
    const json = await exportSession("json");
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `askus-session-${sessionId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg">
        <p className="text-sm text-brand-gray">로딩 중...</p>
      </div>
    );
  }

  const emotionDiff = (session.emotionAfter ?? session.emotionBefore) - session.emotionBefore;
  const duration = session.completedAt
    ? Math.round((session.completedAt - session.createdAt) / 60000)
    : 0;

  // GROW 단계별 턴 수 계산
  const stageCount: Record<string, number> = { goal: 0, reality: 0, options: 0, will: 0 };
  session.messages.forEach((m) => {
    if (m.stage) stageCount[m.stage]++;
  });

  return (
    <main className="min-h-screen bg-brand-bg">
      {/* 완료 배너 */}
      <div className="bg-gradient-to-br from-brand-purple to-brand-deep px-6 py-8 text-center">
        <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="mb-1 text-lg font-semibold text-white">오늘의 코칭이 끝났습니다</h1>
        <p className="text-xs text-white/60">
          {TOPICS[session.topic].label} 코칭 · {duration}분 · {session.messages.length}턴
        </p>
      </div>

      <div className="mx-auto max-w-lg px-5 py-5">
        {/* 감정 변화 */}
        {session.emotionAfter != null && (
          <div className="mb-5 rounded-[14px] border border-brand-soft bg-white p-5">
            <p className="mb-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-brand-gray">
              Emotion Change
            </p>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="mb-1.5 text-[10px] text-brand-gray">시작 전</p>
                <p className="text-4xl">{EMOTIONS[session.emotionBefore - 1]}</p>
                <p className="mt-1 text-xl font-bold text-brand-deep">{session.emotionBefore}</p>
                <p className="text-[10px] text-brand-gray">{EMOTION_LABELS[session.emotionBefore - 1]}</p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
                  <path
                    d="M2 8h24m0 0l-6-5m6 5l-6 5"
                    stroke={emotionDiff >= 0 ? "#1D9E75" : "#888780"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  className={`text-[11px] font-semibold ${emotionDiff >= 0 ? "text-brand-teal" : "text-brand-gray"}`}
                >
                  {emotionDiff >= 0 ? `+${emotionDiff}` : emotionDiff} {emotionDiff >= 0 ? "↑" : "↓"}
                </span>
              </div>

              <div className="text-center">
                <p className="mb-1.5 text-[10px] text-brand-gray">끝난 후</p>
                <p className="text-4xl">{EMOTIONS[session.emotionAfter - 1]}</p>
                <p className="mt-1 text-xl font-bold text-brand-teal">{session.emotionAfter}</p>
                <p className="text-[10px] text-brand-teal">{EMOTION_LABELS[session.emotionAfter - 1]}</p>
              </div>
            </div>
          </div>
        )}

        {/* GROW 여정 */}
        <div className="mb-5 rounded-[14px] border border-brand-soft bg-white p-5">
          <p className="mb-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-brand-gray">
            Grow Journey
          </p>
          <div className="flex items-center">
            {(["goal", "reality", "options", "will"] as const).map((stage, i) => (
              <div key={stage} className="flex flex-1 items-center">
                <div className="flex-1 text-center">
                  <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-brand-purple">
                    <span className="text-xs font-bold text-white">{stage[0].toUpperCase()}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-brand-purple">
                    {GROW_LABELS[stage]}
                  </p>
                  <p className="text-[9px] text-brand-gray">{stageCount[stage]}턴</p>
                </div>
                {i < 3 && <div className="h-[2px] w-6 bg-brand-purple" />}
              </div>
            ))}
          </div>
        </div>

        {/* 핵심 인사이트 */}
        {session.summary && (
          <>
            <div className="mb-5 rounded-[14px] border border-brand-soft bg-white p-5">
              <p className="mb-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-brand-gray">
                Key Insights
              </p>
              <div className="flex flex-col gap-2.5">
                {session.summary.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-purple" />
                    <p className="text-[13px] leading-[1.7] text-gray-900">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 실행 계획 */}
            <div className="mb-5 rounded-[14px] border border-brand-soft bg-white p-5">
              <p className="mb-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-brand-gray">
                Action Plan
              </p>
              <div className="flex flex-col gap-2.5">
                {session.summary.actionPlan.map((action, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="h-5 w-5 flex-shrink-0 rounded border-[1.5px] border-brand-purple" />
                    <p className="text-[13px] text-gray-900">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 버튼 */}
        <Link
          href="/session/new"
          className="block w-full rounded-xl bg-brand-purple py-3.5 text-center text-sm font-semibold text-white"
        >
          새 코칭 세션 시작
        </Link>

        <div className="mt-2.5 flex gap-2.5">
          <button
            onClick={handleCopyText}
            className="flex-1 rounded-xl border-[1.5px] border-brand-soft bg-white py-3 text-[13px] font-medium text-brand-purple"
          >
            텍스트로 복사
          </button>
          <button
            onClick={handleExportJSON}
            className="flex-1 rounded-xl border-[1.5px] border-brand-soft bg-white py-3 text-[13px] font-medium text-brand-purple"
          >
            JSON 내보내기
          </button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add app/session/\[id\]/summary/
git commit -m "feat: session summary page with emotion change, GROW journey, and export"
```

---

## Task 14: 에러 처리 + 세션 복원 + 반응형 마무리

**Files:**
- Modify: `askus/app/session/[id]/page.tsx`
- Modify: `askus/app/layout.tsx`

- [ ] **Step 1: 세션 복원 로직 추가 (대화 페이지)**

`askus/app/session/[id]/page.tsx`의 `useEffect` init 함수 안에 이미 복원 로직이 포함되어 있다 (`s.messages.length > 0` 분기). 추가로 브라우저 종료 전 저장을 보장한다.

대화 페이지의 `ChatPage` 컴포넌트 안에 다음을 추가:

```tsx
// 브라우저 종료 전 세션 저장 보장
useEffect(() => {
  const handleBeforeUnload = () => {
    if (session) {
      // 동기적으로 저장 (navigator.sendBeacon은 JSON만 가능)
      localStorage.setItem(
        `askus_autosave_${sessionId}`,
        JSON.stringify({ messages, currentStage, timestamp: Date.now() })
      );
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [session, sessionId, messages, currentStage]);
```

- [ ] **Step 2: 반응형 메타 태그 추가**

`askus/app/layout.tsx`에 viewport 추가:

```tsx
export const metadata: Metadata = {
  title: "ASKUS — 질문으로 변화를 이끄는 AI 코칭",
  description: "삶의 질문에 대한 답을 찾아가는 여정. ASKUS는 답을 주지 않습니다. 당신 안의 답을 꺼냅니다.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
```

- [ ] **Step 3: 전체 테스트 실행**

```bash
npm run test:run
```

Expected: 모든 테스트 PASS

- [ ] **Step 4: 전체 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공

- [ ] **Step 5: 최종 커밋**

```bash
git add -A
git commit -m "feat: error handling, session recovery, and responsive polish"
```

---

## 최종 확인 체크리스트

- [ ] `npm run test:run` — 모든 테스트 통과
- [ ] `npm run build` — 빌드 성공
- [ ] 랜딩 → 주제 선택 → 감정 체크인 → 대화 → 세션 종료 → 요약 전체 흐름 동작
- [ ] GROW 진행 바가 AI 응답에 따라 업데이트
- [ ] 텍스트 복사 / JSON 내보내기 동작
- [ ] 모바일 반응형 확인 (Chrome DevTools)
- [ ] .env.local에 실제 OpenAI API 키 설정 확인
