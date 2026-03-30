import type { GrowStage } from "@/lib/storage/types";

const STAGES: { key: GrowStage; letter: string; label: string }[] = [
  { key: "goal", letter: "G", label: "Goal" },
  { key: "reality", letter: "R", label: "Reality" },
  { key: "options", letter: "O", label: "Options" },
  { key: "will", letter: "W", label: "Will" },
];

const STAGE_INDEX: Record<GrowStage, number> = {
  goal: 0,
  reality: 1,
  options: 2,
  will: 3,
};

interface GrowProgressBarProps {
  currentStage: GrowStage;
}

export function GrowProgressBar({ currentStage }: GrowProgressBarProps) {
  const currentIndex = STAGE_INDEX[currentStage];

  return (
    <div className="flex items-center justify-center w-full px-4">
      {STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <div key={stage.key} className="flex items-center">
            {/* Stage circle + label */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={[
                  "flex items-center justify-center rounded-full font-semibold text-sm transition-all duration-300 ease-out",
                  isCurrent
                    ? "h-8 w-8 shadow-[0_0_0_4px_#EEEDFE] bg-brand-purple text-white"
                    : isCompleted
                    ? "h-7 w-7 bg-brand-purple text-white"
                    : "h-7 w-7 bg-gray-200 text-gray-400",
                ].join(" ")}
              >
                {stage.letter}
              </div>
              {/* Label */}
              <span
                className={[
                  "mt-1 text-xs transition-all duration-300 ease-out",
                  isCurrent
                    ? "font-bold text-brand-purple"
                    : isCompleted
                    ? "text-brand-purple"
                    : "text-brand-gray",
                ].join(" ")}
              >
                {stage.label}
              </span>
            </div>

            {/* Connector line (not after last stage) */}
            {index < STAGES.length - 1 && (
              <div className="relative h-1 w-12 mx-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-brand-purple rounded-full transition-all duration-300 ease-out"
                  style={{
                    width:
                      isCompleted
                        ? "100%"
                        : isCurrent
                        ? "50%"
                        : "0%",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
