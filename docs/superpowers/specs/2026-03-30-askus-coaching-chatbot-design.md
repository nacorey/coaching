# ASKUS — AI 코칭 챗봇 설계 문서

**버전:** 1.0 | **작성일:** 2026-03-30 | **상태:** 승인됨

---

## 1. 개요

ASKUS는 검증된 코칭 프레임워크(GROW, SBI, 변화 단계 모델)를 AI에 내재화하여, 질문으로 변화를 이끄는 코칭 챗봇 서비스다. 답을 주지 않고 사용자 안의 답을 꺼내는 것이 핵심 철학이다.

### 1.1 구현 범위

Phase 1 MVP + 선별적 Phase 2 기능:

| 기능 | ID | 포함 여부 |
|------|-----|:---------:|
| AI 코칭 대화 | F-01 | O |
| 코칭 주제 선택 | F-02 | O |
| GROW 단계 시각화 | F-03 | O |
| 세션 요약 | F-04 | O |
| 코치 페르소나 설정 (B2B) | F-05 | X (Phase 3) |
| 감정 체크인 | F-06 | O |
| 질문 라이브러리 | F-07 | O |

### 1.2 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js (App Router) |
| 스타일링 | Tailwind CSS + shadcn/ui |
| AI API | OpenAI gpt-5.4-mini (Streaming SSE) |
| 상태 관리 | React hooks + localStorage |
| 배포 | Vercel |
| 폰트 | Noto Sans KR (Google Fonts) |

---

## 2. 아키텍처

### 2.1 라우팅 구조

```
/                       → 랜딩 (브랜드 히어로 + CTA)
/session/new            → 주제 선택 + 감정 체크인 (2-step)
/session/[id]           → 코칭 대화 (GROW 시각화 포함)
/session/[id]/summary   → 세션 요약 + 감정 변화 + 내보내기
/api/chat               → OpenAI 스트리밍 프록시
/api/summarize          → 세션 요약 생성
```

### 2.2 프로젝트 구조

```
askus/
├── app/
│   ├── layout.tsx              # 루트 레이아웃 (Noto Sans KR, 테마)
│   ├── page.tsx                # 랜딩 페이지
│   ├── session/
│   │   ├── new/
│   │   │   └── page.tsx        # 주제 선택 + 감정 체크인
│   │   └── [id]/
│   │       ├── page.tsx        # 코칭 대화 (메인)
│   │       └── summary/
│   │           └── page.tsx    # 세션 요약
│   └── api/
│       ├── chat/
│       │   └── route.ts        # OpenAI 스트리밍 프록시
│       └── summarize/
│           └── route.ts        # 세션 요약 생성
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx   # 대화 영역 전체
│   │   ├── MessageBubble.tsx   # 개별 메시지 (코치/사용자)
│   │   ├── ChatInput.tsx       # 입력창 + 전송 버튼
│   │   └── TypingIndicator.tsx # 코치 타이핑 애니메이션
│   ├── grow/
│   │   ├── GrowProgressBar.tsx # GROW 단계 시각화 바
│   │   └── GrowStageLabel.tsx  # 현재 단계 라벨
│   ├── session/
│   │   ├── TopicSelector.tsx   # 주제 카테고리 선택
│   │   ├── EmotionSlider.tsx   # 감정 체크인 슬라이더
│   │   └── SessionSummary.tsx  # 요약 카드
│   └── ui/                     # shadcn/ui 컴포넌트들
├── lib/
│   ├── ai/
│   │   ├── system-prompt.ts    # 코칭 시스템 프롬프트
│   │   ├── grow-parser.ts      # structured output 파싱
│   │   └── topics.ts           # 주제별 오프닝 질문
│   ├── storage/
│   │   ├── types.ts            # StorageProvider 인터페이스
│   │   ├── local-storage.ts    # localStorage 구현체
│   │   └── export.ts           # JSON/텍스트 내보내기
│   └── hooks/
│       ├── useChat.ts          # 대화 상태 관리 훅
│       ├── useSession.ts       # 세션 생명주기 훅
│       └── useGrowStage.ts     # GROW 단계 추적 훅
├── styles/
│   └── globals.css             # Tailwind + 브랜드 CSS 변수
└── .env.local                  # OPENAI_API_KEY
```

### 2.3 핵심 설계 원칙

- **`lib/ai/`**: AI 로직(프롬프트, 파싱)을 UI에서 완전 분리. 프롬프트 튜닝 시 UI 코드를 건드리지 않음
- **`lib/storage/`**: 스토리지 추상화. localStorage → Supabase 전환 시 구현체만 교체
- **`lib/hooks/`**: 상태 관리를 커스텀 훅으로 캡슐화. 페이지 컴포넌트는 얇게 유지
- **`components/`**: 기능 단위로 폴더 분리. chat, grow, session 각각 독립

---

## 3. 데이터 모델

### 3.1 핵심 타입

```typescript
type GrowStage = "goal" | "reality" | "options" | "will"
type CoachingTopic = "career" | "relationship" | "goal" | "self" | "other"

// AI structured output 형태
interface AIResponse {
  stage: GrowStage
  message: string
  stage_confidence: number  // 0~1
}

// 개별 메시지
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  stage: GrowStage | null   // assistant만 stage 보유
  timestamp: number
}

// 세션 전체
interface Session {
  id: string
  topic: CoachingTopic
  topicDetail?: string       // "기타" 선택 시 사용자 입력
  emotionBefore: number      // 1~5
  emotionAfter?: number      // 1~5
  messages: Message[]
  summary?: SessionSummary
  createdAt: number
  completedAt?: number
}

// 세션 요약
interface SessionSummary {
  insights: string[]
  decisions: string[]
  actionPlan: string[]
  growJourney: GrowStage[]
}

// 세션 목록용 경량 데이터
interface SessionListItem {
  id: string
  topic: CoachingTopic
  createdAt: number
  completedAt?: number
  turnCount: number
  hasummary: boolean
}
```

### 3.2 스토리지 추상화

```typescript
interface StorageProvider {
  saveSession(session: Session): Promise<void>
  getSession(id: string): Promise<Session | null>
  getSessionList(): Promise<SessionListItem[]>
  deleteSession(id: string): Promise<void>
  exportSession(id: string, format: "json" | "text"): Promise<string>
}
```

MVP에서는 `LocalStorageProvider`로 구현한다. 향후 Supabase 전환 시 `SupabaseProvider`를 추가하고 구현체만 교체한다.

### 3.3 상태 흐름

```
[주제 선택] → [감정 체크인] → Session 생성 (id: crypto.randomUUID())
    → /session/[id] 로 이동
    → 매 AI 응답마다:
        1. structured output 파싱 → stage 추출
        2. Message 추가 → Session 업데이트 → localStorage 동기화
        3. GrowProgressBar 업데이트
    → [세션 종료] → 감정 체크인(after) → /api/summarize 호출
    → SessionSummary 저장 → /session/[id]/summary 이동
```

localStorage 동기화는 매 메시지마다 수행한다. 브라우저 종료/새로고침 시에도 대화를 복원할 수 있다.

---

## 4. AI 통합

### 4.1 GROW 단계 감지: 메타데이터 프리픽스 방식

AI가 매 응답의 첫 줄에 메타데이터를 포함한다:

```
<<GROW:reality:0.85>>
그 상황이 꽤 무겁게 느껴지셨겠어요.
지금 가장 걸리는 부분은 무엇인가요?
```

**스트리밍 처리 흐름:**

1. 토큰을 버퍼에 누적
2. `>>` 감지 시점: `<<GROW:stage:confidence>>` 파싱 → stage를 GrowProgressBar에 전달
3. 메타데이터 줄 제거, 이후 토큰은 즉시 UI에 스트리밍
4. `>>` 미감지 시(AI 형식 이탈): 직전 stage 유지, 전체 텍스트를 그대로 스트리밍

**confidence 활용:** `stage_confidence < 0.7`이면 UI에서 단계를 변경하지 않는다. 어색한 깜빡임을 방지한다.

### 4.2 시스템 프롬프트

```
# 역할
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
- "오늘 이 대화를 통해 어떤 것을 얻어가고 싶으신가요?"

## Reality (현실 점검)
- 현재 상황, 장애물, 자원을 탐색한다
- "지금 이 상황에서 가장 어렵게 느껴지는 것은 무엇인가요?"

## Options (대안 탐색)
- 판단 없이 가능성을 넓힌다
- "지금 할 수 있는 방법을 3가지만 말해본다면요?"

## Will (실행 의지)
- 구체적 행동 계획을 수립한다
- "이번 주에 가장 먼저 실행할 한 가지는 무엇인가요?"

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
- 간결하게. 긴 설명보다 하나의 좋은 질문.
```

### 4.3 컨텍스트 관리 전략

```
API에 보내는 메시지 구성:

┌─ system: 시스템 프롬프트 (~800 토큰, 고정)
├─ user/assistant: Goal 설정 대화 (첫 2~4턴, 고정 핀)
├─ ...중간 생략 (토큰 한도 초과 시)...
└─ user/assistant: 최근 N턴 (슬라이딩 윈도우)

총 토큰 예산: ~12,000 토큰 (요청+응답)
- 시스템 프롬프트: ~800
- 핀 메시지: ~500
- 슬라이딩 윈도우: ~8,000
- 응답 여유: ~2,700
```

- **Goal 핀 전략**: 첫 번째 Goal 설정 대화(사용자가 목표를 말한 턴 + AI의 Goal 확인 응답)는 항상 컨텍스트에 포함. 긴 세션에서도 AI가 원래 목표를 잃지 않는다.
- **턴 상한**: 30턴. 25턴 시점에 "대화를 정리해볼까요?" 안내.

### 4.4 주제별 오프닝 질문

```typescript
const OPENING_QUESTIONS: Record<CoachingTopic, string> = {
  career: "커리어에 대해 이야기하고 싶으시군요. 요즘 일과 관련해서 가장 마음에 걸리는 것은 무엇인가요?",
  relationship: "관계에 대해 탐색해보고 싶으시군요. 지금 가장 신경 쓰이는 관계가 있으신가요?",
  goal: "목표에 대해 이야기해볼까요. 요즘 이루고 싶은 것이 있다면 무엇인가요?",
  self: "자기 자신에 대해 탐색하고 싶으시군요. 요즘 스스로에 대해 궁금하거나 고민되는 부분이 있으신가요?",
  other: "어떤 이야기든 좋습니다. 오늘 마음속에 있는 것을 편하게 꺼내주세요."
}
```

### 4.5 API Route 설계

**`/api/chat`** — 스트리밍 프록시
- 클라이언트에서 `messages[]` + `topic` 수신
- 시스템 프롬프트 주입 + Goal 핀 메시지 관리
- OpenAI Streaming API 호출 → SSE로 클라이언트에 전달
- API 키는 서버사이드에만 존재 (`process.env.OPENAI_API_KEY`)

**`/api/summarize`** — 세션 요약 생성
- 전체 대화 히스토리를 수신
- 별도 시스템 프롬프트로 요약 요청: "아래 코칭 대화에서 핵심 인사이트, 결정 사항, 실행 계획을 JSON으로 추출하세요"
- 비스트리밍 호출 (요약은 한번에 받아도 됨)
- 응답 형식: `{ insights: string[], decisions: string[], actionPlan: string[], growJourney: GrowStage[] }`

### 4.6 "코치에게 질문 받기" 동작 (F-07)

사용자가 막힐 때 "코치에게 질문 받기" 버튼을 클릭하면:
1. 클라이언트가 시스템 메시지를 대화 히스토리에 삽입: `{ role: "user", content: "[시스템] 사용자가 추가 질문을 요청합니다. 현재 GROW 단계에 맞는 탐색 질문을 던져주세요." }`
2. 이 메시지는 UI에 표시하지 않음 (사용자에게는 코치가 자연스럽게 질문하는 것처럼 보임)
3. AI가 현재 맥락에 맞는 코칭 질문을 생성하여 응답

### 4.7 세션 종료 흐름

```
사용자가 "세션 종료" 클릭
  → 확인 모달: "오늘의 코칭을 마무리할까요?"
  → [확인] → 감정 체크인(after) 모달 표시 (이모지 슬라이더, 건너뛰기 가능)
  → emotionAfter 저장
  → /api/summarize 호출 (로딩 표시: "오늘의 대화를 정리하고 있어요...")
  → SessionSummary 저장 → completedAt 기록
  → /session/[id]/summary 로 이동
```

---

## 5. UI 설계

### 5.1 브랜드 디자인 시스템

| 토큰 | 값 | 용도 |
|------|----|------|
| Asker Purple | `#534AB7` | Primary. 버튼, 사용자 메시지, 강조 |
| Deep Inquiry | `#3C3489` | 그래디언트 시작, 코치 아바타 |
| Soft Reflect | `#EEEDFE` | 배경 강조, 선택 상태 glow |
| Growth Teal | `#1D9E75` | 긍정 변화, 성공 지표 |
| Journey Gray | `#888780` | 보조 텍스트, 비활성 요소 |
| 배경 | `#FAFAF8` | 오프화이트 메인 배경 |
| 폰트 | Noto Sans KR | 전체 |

### 5.2 페이지별 설계

#### 5.2.1 랜딩 페이지 (`/`)

- 퍼플 그래디언트 히어로 (로고 + 슬로건 + CTA)
- 3가지 가치 제안 카드 (질문 중심 / GROW 프레임워크 / 프라이버시)
- "코칭 시작하기" 버튼 → `/session/new` 이동
- 회원가입 불필요 안내

#### 5.2.2 세션 시작 (`/session/new`)

**Step 1 — 주제 선택**
- 5개 카테고리 카드: 커리어, 관계, 목표, 자기이해, 기타
- 각 카드에 아이콘 + 한국어 라벨 + 서브 키워드
- 선택 시 보라색 테두리 + 체크 아이콘
- "기타" 선택 시 텍스트 입력 필드 표시

**Step 2 — 감정 체크인 (F-06)**
- 이모지 기반 5점 슬라이더 (😔 😕 😐 🙂 😊)
- 선택한 이모지가 커지고 진해짐
- 세션 요약 미리보기 (선택 주제 + 감정 점수)
- "건너뛰기" 옵션 (감정 체크인은 선택 사항)

같은 페이지에서 Step 1 → Step 2로 전환. "코칭 시작" 클릭 시 세션 생성 후 `/session/[id]`로 이동.

#### 5.2.3 코칭 대화 (`/session/[id]`)

**상단 헤더:**
- 코치 아바타 (퍼플 그래디언트 원형) + "ASKUS 코치" + 주제 라벨
- "세션 종료" 버튼

**GROW 진행 바:**
- G → R → O → W 4단계 원형 아이콘 + 연결선
- 현재 단계: 약간 더 큰 원 + glow 효과 (box-shadow: `0 0 0 4px #EEEDFE`)
- 완료 단계: 보라색 채움
- 미도달 단계: 회색
- 전환 애니메이션: 0.3s ease
- confidence < 0.7이면 전환하지 않음

**대화 영역:**
- 코치 메시지: 좌측 정렬, 흰색 배경, 좌상단 각진 모서리
- 사용자 메시지: 우측 정렬, 보라색 배경 + 흰색 텍스트, 우상단 각진 모서리
- 코치 아바타: 메시지 좌측 작은 원형
- 메시지 페이드인: 0.2s
- 타이핑 인디케이터: 3개 점 펄스 애니메이션

**하단 입력 영역:**
- 텍스트 입력창 (placeholder: "이야기를 들려주세요...")
- 전송 버튼 (보라색 원형, 종이비행기 아이콘)
- "코치에게 질문 받기" 버튼 (F-07, 좌측)
- 턴 카운터 (우측, "4 / 30턴")
- 25턴 이후 카운터 색상 변경 (Journey Gray → Growth Teal)

#### 5.2.4 세션 요약 (`/session/[id]/summary`)

**완료 배너:** 퍼플 그래디언트 배경, 체크 아이콘, 주제/시간/턴 수

**감정 변화 카드 (F-06):**
- before/after 이모지 + 숫자 병렬 표시
- 변화량을 Growth Teal로 강조 (예: "+2 ↑")

**GROW 여정 카드:**
- 4단계 모두 보라색 완료 표시
- 각 단계별 소요 턴 수 표시

**핵심 인사이트 카드:**
- AI가 요약한 발견 목록 (bullet points)

**실행 계획 카드:**
- 체크박스 형태의 구체적 행동 목록

**하단 버튼:**
- "새 코칭 세션 시작" (Primary)
- "텍스트로 복사" + "JSON 내보내기" (Secondary, 나란히)

### 5.3 반응형 설계

- 모바일 (< 768px): 단일 컬럼, 패딩 축소, 터치 영역 확대 (최소 44px)
- 데스크탑 (>= 768px): 최대 너비 640px 중앙 정렬 (채팅 앱 관례)
- GROW 진행 바: 모바일에서도 가로 배치 유지 (아이콘 크기만 축소)

---

## 6. 에러 처리 & 엣지 케이스

| 상황 | 처리 방식 |
|------|----------|
| OpenAI API 오류 | "잠시 연결이 불안정해요. 다시 시도해주세요." + 자동 재시도 1회 |
| GROW 메타데이터 파싱 실패 | 직전 stage 유지, 텍스트 전체를 메시지로 표시 |
| 스트리밍 중 연결 끊김 | 수신된 텍스트까지 보존, "연결이 끊겼습니다" 안내 + 재시도 버튼 |
| 30턴 상한 도달 | "오늘 대화를 정리해볼까요?" → 자동 요약 유도 (강제 종료 아님) |
| localStorage 용량 초과 | 오래된 세션부터 삭제 제안 + 내보내기 유도 |
| 위기 감지 | AI 시스템 프롬프트에서 1차 대응 + 전문기관 안내 문구 UI에 고정 표시 |
| 빈 입력 전송 | 전송 버튼 비활성화, 최소 2자 이상 입력 필요 |
| 브라우저 새로고침/종료 | localStorage에서 세션 복원, "이전 대화를 이어갈까요?" 모달 |

---

## 7. 보안 & 프라이버시

- **API 키 보호**: OpenAI API 키는 서버사이드(Next.js API Route)에만 존재. 클라이언트에 노출되지 않음.
- **대화 내용 서버 미저장**: 대화 히스토리는 클라이언트 localStorage에만 저장. API Route는 요청 처리 후 대화 내용을 저장하거나 로깅하지 않음.
- **개인정보 최소화**: 이름, 이메일 등 식별 정보를 수집하지 않음. 세션 ID는 클라이언트에서 `crypto.randomUUID()`로 생성.
- **내보내기 통제**: 사용자가 명시적으로 요청할 때만 JSON/텍스트로 다운로드.

---

## 8. 성능 목표

| 항목 | 목표 |
|------|------|
| 첫 토큰 출력 | ≤ 1.5초 (스트리밍) |
| 페이지 로드 (LCP) | ≤ 2초 |
| 세션당 토큰 비용 | ~$0.04 (20턴 기준) |
| 번들 크기 | ≤ 200KB (gzipped) |
