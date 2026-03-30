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
      "커리어에 대해 이야기 나눠볼게요.\n오늘 이 대화가 끝날 때, 어떤 상태이면 가장 좋겠어요?",
  },
  relationship: {
    label: "관계",
    icon: "🤝",
    keywords: "동료, 상사, 가족, 파트너",
    opening:
      "관계에 대해 이야기 나눠볼게요.\n오늘 이 대화가 끝날 때, 어떤 상태이면 가장 좋겠어요?",
  },
  goal: {
    label: "목표",
    icon: "🎯",
    keywords: "달성, 습관, 계획, 실행",
    opening:
      "목표에 대해 이야기 나눠볼게요.\n오늘 이 대화가 끝날 때, 어떤 상태이면 가장 좋겠어요?",
  },
  self: {
    label: "자기이해",
    icon: "🪞",
    keywords: "강점, 가치관, 정체성",
    opening:
      "자기이해에 대해 이야기 나눠볼게요.\n오늘 이 대화가 끝날 때, 어떤 상태이면 가장 좋겠어요?",
  },
  other: {
    label: "자유 주제",
    icon: "💬",
    keywords: "자유 주제로 대화하기",
    opening:
      "자유롭게 이야기 나눠볼게요.\n오늘 이 대화가 끝날 때, 어떤 상태이면 가장 좋겠어요?",
  },
};
