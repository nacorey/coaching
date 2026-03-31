"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  useEffect(() => {
    // Check if already verified by looking for cookie presence
    if (document.cookie.includes("askus_access=")) {
      setAlreadyVerified(true);
    }
  }, []);

  function handleCTAClick() {
    if (alreadyVerified) {
      router.push("/session/new");
      return;
    }
    setShowModal(true);
    setCode("");
    setError("");
  }

  async function handleSubmit() {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (res.ok) {
        setAlreadyVerified(true);
        setShowModal(false);
        router.push("/session/new");
      } else {
        setError("코드가 올바르지 않습니다.");
      }
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

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
          <button
            onClick={handleCTAClick}
            className="mt-2 inline-block rounded-full bg-white px-8 py-3 text-base font-semibold text-brand-purple shadow-lg transition-opacity hover:opacity-90"
          >
            코칭 시작하기
          </button>

          {/* Subtext */}
          <p className="text-sm text-white/60">초대 코드가 필요합니다</p>
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

      {/* Access Code Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-1">초대 코드 입력</h2>
            <p className="text-sm text-brand-gray mb-5">
              코칭을 시작하려면 초대 코드를 입력해주세요.
            </p>

            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="코드를 입력하세요"
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-soft"
            />

            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !code.trim()}
              className="mt-4 w-full py-3 rounded-xl text-sm font-semibold bg-brand-purple text-white hover:bg-brand-deep active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "확인 중..." : "확인"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
