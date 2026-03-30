import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-brand-bg font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-deep via-brand-purple to-[#7F77DD] px-6 py-24 text-white text-center">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 h-40 w-40 -translate-y-1/2 rounded-full bg-white/[0.06]" />

        <div className="relative z-10 mx-auto max-w-2xl flex flex-col items-center gap-6">
          {/* Eyebrow */}
          <span className="text-sm font-medium tracking-widest uppercase text-white/70">
            Homo Askers
          </span>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-5xl font-extrabold tracking-tight">ASKUS</span>
            <span className="mt-1 h-3 w-3 rounded-full bg-brand-teal" />
          </div>

          {/* Slogan */}
          <h1 className="text-3xl font-bold leading-snug">
            삶의 질문에 대한 답을
            <br />
            찾아가는 여정.
          </h1>

          {/* CTA */}
          <Link
            href="/session/new"
            className="mt-2 inline-block rounded-full bg-white px-8 py-3 text-base font-semibold text-brand-purple shadow-lg transition-opacity hover:opacity-90"
          >
            코칭 시작하기
          </Link>

          {/* Subtext */}
          <p className="text-sm text-white/60">무료 체험 | 회원가입 불필요</p>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-2xl bg-brand-soft p-6 flex flex-col gap-3">
            <span className="text-3xl">🤔</span>
            <h2 className="text-base font-bold text-brand-purple">질문으로 이끄는</h2>
            <p className="text-sm leading-relaxed text-brand-gray whitespace-pre-line">
              {"답을 주지 않습니다.\n당신 안의 답을 꺼냅니다."}
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl bg-brand-soft p-6 flex flex-col gap-3">
            <span className="text-3xl">🌱</span>
            <h2 className="text-base font-bold text-brand-purple">GROW 프레임워크</h2>
            <p className="text-sm leading-relaxed text-brand-gray whitespace-pre-line">
              {"검증된 코칭 모델로\n체계적인 대화를 합니다."}
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl bg-brand-soft p-6 flex flex-col gap-3">
            <span className="text-3xl">🔒</span>
            <h2 className="text-base font-bold text-brand-purple">완전한 프라이버시</h2>
            <p className="text-sm leading-relaxed text-brand-gray whitespace-pre-line">
              {"대화는 서버에 저장되지\n않습니다. 당신만의 공간."}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-sm text-brand-gray">
        질문이 당신을 바꿉니다.
      </footer>
    </div>
  );
}
