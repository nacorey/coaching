import type { GrowStage } from "@/lib/storage/types";

export interface GrowMeta {
  stage: GrowStage;
  confidence: number;
}

export interface ParseResult {
  meta: GrowMeta | null;
  text: string;
}

const GROW_PREFIX_REGEX = /^<<GROW:(goal|reality|options|will):([\d.]+)>>\n?/;

const STAGE_ORDER: Record<GrowStage, number> = {
  goal: 0,
  reality: 1,
  options: 2,
  will: 3,
};

const BRIDGE_PATTERNS: { pattern: string; stage: GrowStage }[] = [
  // G → R bridges
  { pattern: "목표를 향해 가는 데 있어서", stage: "reality" },
  { pattern: "현실 사이에서", stage: "reality" },
  { pattern: "바람과 현실 사이", stage: "reality" },
  // R → O bridges
  { pattern: "가능성을 한번 열어볼게요", stage: "options" },
  { pattern: "가능성을 한 번 열어볼게요", stage: "options" },
  { pattern: "가능성을 열어", stage: "options" },
  { pattern: "어떤 길들이 있을지", stage: "options" },
  { pattern: "선택지를 말해", stage: "options" },
  { pattern: "방법이나 선택지", stage: "options" },
  { pattern: "다른 방법이나 아이디어", stage: "options" },
  { pattern: "어떤 선택지가", stage: "options" },
  { pattern: "떠오르는 선택지", stage: "options" },
  // O → W bridges (transition phrases)
  { pattern: "한 걸음을 내딛", stage: "will" },
  { pattern: "한걸음을 내딛", stage: "will" },
  { pattern: "하나를 골라 움직여", stage: "will" },
  { pattern: "가장 작은 한 가지 행동", stage: "will" },
  { pattern: "반드시 할 한 가지", stage: "will" },
  // W → end
  { pattern: "첫 발을 내딛으셨네요", stage: "will" },
  { pattern: "첫발을 내딛으셨네요", stage: "will" },
];

/**
 * Will-stage content keywords.
 * These detect Will-stage questions even without a bridge transition phrase.
 * Commitment, accountability, action planning, and confidence indicators.
 */
const WILL_CONTENT_KEYWORDS: string[] = [
  // Commitment & accountability
  "약속을 하고 싶",
  "어떤 약속",
  "약속이 지켜",
  "다짐을 지키",
  "스스로에게 어떤 약속",
  "스스로에게 한마디",
  // Action planning
  "가장 먼저 해볼 행동",
  "첫 번째 행동",
  "첫 번째 걸음",
  "당장 할 수 있는",
  "이번 주 안에 반드시",
  "이번 주 안에 가장 먼저",
  "다음 한 주 안에",
  "언제, 무엇을, 어떻게",
  "언제, 어떻게 할지",
  "언제 가장 현실적",
  // Confidence scaling
  "실행할 확신",
  "확신은 몇 점",
  "확신이 몇 점",
  // Will strengthening
  "실천했을 때",
  "해냈을 때",
  "어떤 변화가 생길",
  "어떤 사람이 되어",
  "방해할 수 있는 것",
  "막을 수 있는 것",
  // Co-created action
  "이 자각을 가지고",
  "삶으로 돌아간다면",
  "당신답고",
  "살아있다고 느껴지나요",
  // Session summary
  "오늘 대화를 정리해",
];

/**
 * Normalize Korean text to NFC form for reliable string matching.
 * Korean streamed via TextDecoder may arrive as NFD (decomposed jamo),
 * while source-code string literals are typically NFC (composed syllables).
 */
function normalize(s: string): string {
  return s.normalize("NFC");
}

/**
 * Detects GROW stage from bridge sentences in response text.
 * Returns the latest (most advanced) stage found, or null.
 */
export function detectStageFromBridge(text: string): GrowStage | null {
  const normalized = normalize(text);
  let best: GrowStage | null = null;
  for (const { pattern, stage } of BRIDGE_PATTERNS) {
    if (normalized.includes(normalize(pattern))) {
      if (!best || STAGE_ORDER[stage] > STAGE_ORDER[best]) {
        best = stage;
      }
    }
  }
  return best;
}

/**
 * Detects Will stage from content keywords (beyond bridge phrases).
 * This catches Will-stage questions like "어떤 약속을 하고 싶으신가요?"
 * that don't contain a standard bridge transition phrase.
 */
export function detectWillFromContent(text: string): boolean {
  const normalized = normalize(text);
  return WILL_CONTENT_KEYWORDS.some((kw) => normalized.includes(normalize(kw)));
}

/**
 * Parses a <<GROW:stage:confidence>> prefix from a complete AI response.
 * Uses three layers of stage detection:
 *   1. The explicit GROW prefix tag from the model
 *   2. Bridge sentence override (transition phrases)
 *   3. Will content keyword override (commitment/action language)
 */
export function parseGrowPrefix(input: string): ParseResult {
  const match = GROW_PREFIX_REGEX.exec(input);
  if (!match) {
    return { meta: null, text: input };
  }

  let stage = match[1] as GrowStage;
  const confidence = parseFloat(match[2]);
  const text = input.slice(match[0].length);

  // Layer 2: Bridge sentence override
  const bridgeStage = detectStageFromBridge(text);
  if (bridgeStage && STAGE_ORDER[bridgeStage] > STAGE_ORDER[stage]) {
    stage = bridgeStage;
  }

  // Layer 3: Will content keyword override
  if (stage !== "will" && detectWillFromContent(text)) {
    stage = "will";
  }

  return { meta: { stage, confidence }, text };
}

/**
 * For streaming: finds the end position of the GROW prefix in a buffer.
 * Returns -1 if the buffer doesn't start with <<GROW: or the >> hasn't arrived yet.
 * Returns the index of the first content character after the prefix (skipping trailing \n).
 */
export function findGrowPrefixEnd(buffer: string): number {
  if (!buffer.startsWith("<<GROW:")) {
    return -1;
  }

  const closeIdx = buffer.indexOf(">>");
  if (closeIdx === -1) {
    return -1;
  }

  // The ">>" occupies 2 characters, so content starts at closeIdx + 2
  let contentStart = closeIdx + 2;

  // Skip a single trailing newline if present
  if (buffer[contentStart] === "\n") {
    contentStart += 1;
  }

  return contentStart;
}
