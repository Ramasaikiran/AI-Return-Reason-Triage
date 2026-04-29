"use client";

import { useState } from "react";
import type { GiftResponse, GiftItem } from "@/lib/schema";

const EXAMPLE_QUERIES = [
  "Thoughtful gift for a friend with a 6-month-old, under 200 AED",
  "هدية للأم الجديدة بميزانية 300 درهم",
  "Something useful for a mom who travels with a toddler",
  "Gift for a baby shower, budget 150 AED",
  "What laptop should I buy?", // out-of-scope demo
];

const CATEGORY_ICONS: Record<string, string> = {
  feeding: "🍼",
  clothing: "👕",
  toys: "🧸",
  safety: "🛡️",
  nursery: "🛏️",
  health: "💊",
  travel: "✈️",
  skincare: "🧴",
  books: "📚",
  other: "🎁",
};

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80
      ? "bg-sage-500"
      : pct >= 60
      ? "bg-blush-500"
      : "bg-yellow-500";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-blush-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full confidence-bar ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-blush-500 font-medium w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

function GiftCard({ gift, index }: { gift: GiftItem; index: number }) {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const delay = `fade-up-${Math.min(index + 1, 5)}`;

  return (
    <div
      className={`fade-up ${delay} bg-white border border-blush-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">
              {CATEGORY_ICONS[gift.category] ?? "🎁"}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-blush-500 bg-blush-50 px-2 py-0.5 rounded-full">
              {gift.category}
            </span>
          </div>
          <h3
            className={`font-semibold text-base leading-snug ${
              lang === "ar" ? "font-arabic text-right" : "font-display"
            }`}
          >
            {lang === "en" ? gift.name : gift.name_ar}
          </h3>
          {gift.age_range && (
            <p className="text-xs text-gray-400 mt-0.5">
              {gift.age_range}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <p className="font-display font-semibold text-blush-500 text-sm">
            {gift.price_aed_min === gift.price_aed_max
              ? `${gift.price_aed_min} AED`
              : `${gift.price_aed_min}–${gift.price_aed_max} AED`}
          </p>
        </div>
      </div>

      {/* Lang toggle */}
      <div className="flex gap-1 mb-3">
        {(["en", "ar"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors font-medium ${
              lang === l
                ? "bg-blush-500 text-white"
                : "bg-blush-50 text-blush-500 hover:bg-blush-100"
            }`}
          >
            {l === "en" ? "EN" : "عر"}
          </button>
        ))}
      </div>

      {/* Reasoning */}
      <p
        className={`text-sm text-gray-600 leading-relaxed ${
          lang === "ar" ? "font-arabic text-right" : ""
        }`}
      >
        {lang === "en" ? gift.reasoning : gift.reasoning_ar}
      </p>

      {/* Purchase tip */}
      {(lang === "en" ? gift.purchase_tip : gift.purchase_tip_ar) && (
        <div
          className={`mt-3 text-xs text-sage-500 bg-sage-50 rounded-xl px-3 py-2 ${
            lang === "ar" ? "font-arabic text-right" : ""
          }`}
        >
          💡{" "}
          {lang === "en" ? gift.purchase_tip : gift.purchase_tip_ar}
        </div>
      )}

      {/* Confidence */}
      <div className="mt-3">
        <p className="text-xs text-gray-400 mb-0.5">Match confidence</p>
        <ConfidencePill value={gift.confidence} />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-blush-100 rounded-2xl p-5 space-y-3">
      <div className="shimmer h-4 w-24 rounded-full" />
      <div className="shimmer h-5 w-3/4 rounded-full" />
      <div className="shimmer h-3 w-full rounded-full" />
      <div className="shimmer h-3 w-5/6 rounded-full" />
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GiftResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summaryLang, setSummaryLang] = useState<"en" | "ar">("en");

  async function handleSearch(q?: string) {
    const finalQuery = q ?? query;
    if (!finalQuery.trim()) return;
    if (q) setQuery(q);

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/find-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: finalQuery }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-blush-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🎀</span>
          <div>
            <h1 className="font-display font-semibold text-base text-ink leading-none">
              Mumzworld Gift Finder
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              AI-powered · EN & AR · Validated
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl font-bold text-ink leading-tight">
            Find the perfect gift.
            <br />
            <span className="text-blush-500 italic">In minutes.</span>
          </h2>
          <p className="font-arabic text-lg text-gray-500">
            ابحثي عن الهدية المثالية للأم والطفل
          </p>
        </div>

        {/* Search */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. gift for a friend with a 6-month-old, under 200 AED"
              className="flex-1 bg-white border border-blush-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300 placeholder-gray-300"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="bg-blush-500 hover:bg-blush-600 disabled:opacity-50 text-white font-medium px-5 py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? "…" : "Find"}
            </button>
          </div>

          {/* Examples */}
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => handleSearch(q)}
                className="text-xs bg-blush-50 hover:bg-blush-100 text-blush-500 px-3 py-1.5 rounded-full transition-colors font-arabic leading-relaxed"
              >
                {q.length > 40 ? q.slice(0, 40) + "…" : q}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Out of scope */}
            {result.out_of_scope && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center">
                <p className="text-2xl mb-2">🤷‍♀️</p>
                <p className="font-medium text-yellow-800 text-sm">
                  This doesn&apos;t look like a gift request for moms or babies.
                </p>
                {result.uncertainty_note && (
                  <p className="text-xs text-yellow-600 mt-1">
                    {result.uncertainty_note}
                  </p>
                )}
              </div>
            )}

            {/* Query unclear */}
            {!result.query_understood && !result.out_of_scope && (
              <div className="bg-blush-50 border border-blush-200 rounded-2xl p-5 text-center">
                <p className="text-2xl mb-2">💭</p>
                <p className="font-medium text-blush-700 text-sm">
                  Your request is a bit vague — could you add more details?
                </p>
                {result.uncertainty_note && (
                  <p className="text-xs text-blush-500 mt-1">
                    {result.uncertainty_note}
                  </p>
                )}
              </div>
            )}

            {/* Uncertainty note (when confident enough to show gifts) */}
            {result.uncertainty_note &&
              !result.out_of_scope &&
              result.query_understood &&
              result.gifts.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-700">
                  ⚠️ {result.uncertainty_note}
                </div>
              )}

            {/* Summary */}
            {result.gifts.length > 0 && (
              <div className="bg-blush-50 rounded-2xl p-5">
                <div className="flex gap-2 mb-3">
                  {(["en", "ar"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setSummaryLang(l)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors font-medium ${
                        summaryLang === l
                          ? "bg-blush-500 text-white"
                          : "bg-white text-blush-500"
                      }`}
                    >
                      {l === "en" ? "EN" : "عر"}
                    </button>
                  ))}
                </div>
                <p
                  className={`text-sm text-blush-700 leading-relaxed ${
                    summaryLang === "ar" ? "font-arabic text-right" : "font-display italic"
                  }`}
                >
                  {summaryLang === "en" ? result.summary : result.summary_ar}
                </p>
                <p className="text-xs text-blush-400 mt-2">
                  {result.gifts.length} gift
                  {result.gifts.length !== 1 ? "s" : ""} found · detected:{" "}
                  {result.detected_language}
                </p>
              </div>
            )}

            {/* Gift cards */}
            <div className="space-y-4">
              {result.gifts.map((gift, i) => (
                <GiftCard key={i} gift={gift} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 pb-8 mt-12">
        <p className="text-center text-xs text-gray-300">
          Mumzworld Gift Finder · AI-Powered · Track A — AI Engineering Intern Assessment
        </p>
      </footer>
    </main>
  );
}
