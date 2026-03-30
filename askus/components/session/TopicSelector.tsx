import type { CoachingTopic } from "@/lib/storage/types";
import { TOPICS } from "@/lib/ai/topics";

interface TopicSelectorProps {
  selected: CoachingTopic | null;
  onSelect: (topic: CoachingTopic) => void;
}

export function TopicSelector({ selected, onSelect }: TopicSelectorProps) {
  const topicKeys = Object.keys(TOPICS) as CoachingTopic[];

  return (
    <div className="grid grid-cols-1 gap-3">
      {topicKeys.map((key) => {
        const topic = TOPICS[key];
        const isSelected = selected === key;

        return (
          <button
            key={key}
            type="button"
            data-topic={key}
            data-selected={String(isSelected)}
            onClick={() => onSelect(key)}
            className={[
              "flex items-center gap-3 px-4 py-3 rounded-xl text-left w-full transition-all duration-200",
              isSelected
                ? "border-2 border-brand-purple shadow-[0_0_0_4px_#EEEDFE] bg-brand-soft"
                : "border border-gray-200 bg-white hover:border-brand-purple/50",
            ].join(" ")}
          >
            {/* Icon */}
            <span className="text-2xl flex-shrink-0">{topic.icon}</span>

            <div className="flex-1 min-w-0">
              {/* Label */}
              <div
                className={[
                  "text-sm font-semibold",
                  isSelected ? "text-brand-purple" : "text-gray-800",
                ].join(" ")}
              >
                {topic.label}
              </div>
              {/* Keywords */}
              <div className="text-xs text-brand-gray mt-0.5 truncate">
                {topic.keywords}
              </div>
            </div>

            {/* Check icon (selected only) */}
            {isSelected && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 text-brand-purple flex-shrink-0"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
