export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 justify-start animate-fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-deep flex items-center justify-center text-white text-sm font-semibold">
        A
      </div>

      {/* Dots bubble */}
      <div className="bg-white rounded-[4px_16px_16px_16px] shadow-sm px-4 py-3 flex items-center gap-1">
        {[
          { delay: "0ms", opacity: "0.4" },
          { delay: "150ms", opacity: "0.6" },
          { delay: "300ms", opacity: "0.8" },
        ].map((dot, index) => (
          <span
            key={index}
            className="h-2 w-2 rounded-full bg-brand-purple animate-bounce"
            style={{
              animationDelay: dot.delay,
              opacity: dot.opacity,
            }}
          />
        ))}
      </div>
    </div>
  );
}
