import type { CoachingTopic } from "@/lib/storage/types";

export interface TopicConfig {
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
    opening:
      "커리어에 대해 이야기 나눠봐요. 지금 커리어에서 가장 고민되는 것은 무엇인가요?",
  },
  relationship: {
    label: "관계",
    icon: "🤝",
    keywords: "동료, 상사, 가족, 파트너",
    opening:
      "관계에 대해 이야기 나눠봐요. 지금 어떤 관계에서 어려움을 느끼고 계신가요?",
  },
  goal: {
    label: "목표",
    icon: "🎯",
    keywords: "달성, 습관, 계획, 실행",
    opening:
      "목표에 대해 이야기 나눠봐요. 지금 이루고 싶은 목표가 있으신가요?",
  },
  self: {
    label: "자기이해",
    icon: "🪞",
    keywords: "강점, 가치관, 정체성",
    opening:
      "자기이해에 대해 이야기 나눠봐요. 요즘 자신에 대해 궁금하거나 탐색하고 싶은 부분이 있으신가요?",
  },
  other: {
    label: "자유 주제",
    icon: "💬",
    keywords: "자유 주제로 대화하기",
    opening: "자유롭게 이야기 나눠봐요. 오늘 어떤 것에 대해 이야기하고 싶으신가요?",
  },
};
