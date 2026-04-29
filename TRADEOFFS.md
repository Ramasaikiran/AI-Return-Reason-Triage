# TRADEOFFS.md — Mumzworld Gift Finder

## Why This Problem

I looked at all the Track A examples and asked: which one is highest-leverage for Mumzworld's business?

**Gift finder wins because:**
1. Gift purchases are high-intent, high-AOV (average order value) — someone buying a gift often spends more than they planned
2. Most moms in the GCC buy gifts multiple times a year (baby showers, Eid, birthdays)
3. Current Mumzworld search is keyword-based — a shopper who types "something for my friend's baby" gets no useful results
4. The problem is multilingual *by default* — GCC shoppers naturally write in both English and Arabic
5. It's demonstrably AI: you cannot solve this with a filter UI or merchandising rule

**Rejected alternatives:**
- *Review synthesizer*: High NLP complexity but low urgency — Mumzworld doesn't have 200+ reviews per product in most categories
- *Return classifier*: Useful internally but not customer-facing; lower business impact at demo stage
- *PDP content generator*: Valuable, but more of a content-ops tool than a shopper tool; harder to demo in 3 minutes

---

## Architecture Choices

**Next.js App Router + Vercel**
One-command deploy, zero infra. The API route gives us server-side key management. Chosen over a standalone Express backend to reduce moving parts.

**Claude Sonnet 4 (claude-sonnet-4-20250514)**
- Powerful enough for native bilingual copy — Haiku struggled with Arabic
- Cheaper than Opus, fast enough for interactive use (~2s p50)
- Structured output via prompt engineering + Zod validation (no function calling needed for this shape)

**Zod validation over the wire**
The API route validates every response against `GiftResponseSchema`. If the model returns malformed JSON or a missing field, the endpoint returns a 502 with `issues` array — explicit failure, not silent corruption. This was a deliberate design decision: bad data should surface, not reach the UI.

**Prompt-based JSON output (no function calling)**
Claude Sonnet reliably follows "respond ONLY with JSON" instructions. Function calling would add latency and complexity for the same result here. Tradeoff: occasionally strips markdown fences in post-processing (handled in route.ts).

**Arabic: "write fresh, don't translate"**
The system prompt explicitly says: *"Write the Arabic reasoning fresh — do not translate from English."* This was the single most important prompt engineering decision. Without it, Arabic output reads like Google Translate.

---

## What I Cut

| Feature | Why Cut |
|---|---|
| Product catalog grounding (RAG) | No real Mumzworld product feed available — would require scraping (prohibited) |
| Price verification | Prices are approximate; would need live catalog |
| Saved searches / history | Out of scope for 5-hour window |
| Admin eval dashboard | Moved to CLI eval script instead |
| Streaming responses | Would add complexity; 2s latency is acceptable for this use case |

---

## Uncertainty Handling

Three explicit signals in the response schema:

1. `out_of_scope: true` — model flags requests that have nothing to do with moms/babies
2. `query_understood: false` — model flags queries too vague to interpret
3. `uncertainty_note` — free-text note surfaced in the UI when confidence is mixed or context is incomplete

Confidence scores per gift item (0–1) are also shown as visual bars in the UI.

---

## Failure Modes I Know About

1. **Arabic quality is hard to auto-evaluate** — the eval suite checks non-empty fields, not fluency. A Gulf Arabic speaker would need to review.
2. **Price ranges are estimated** — no real product catalog; model hallucinates plausible AED price bands which may not match actual Mumzworld prices.
3. **Budget edge case at ~50 AED** — very little is available; model sometimes returns 1 gift or expresses uncertainty.
4. **Age safety is prompted, not verified** — the prompt says to match age ranges safely, but there's no downstream safety oracle.

---

## What I Would Build Next (with more time)

1. **RAG over Mumzworld catalog** — ground gift suggestions in real SKUs with real prices
2. **Arabic quality eval** — use a bilingual Claude judge to score fluency/naturalness
3. **Personalisation** — ask 2–3 questions before recommending (budget, relationship, already owns...)
4. **Affiliate link injection** — each gift links directly to Mumzworld search results
5. **A/B eval** — compare Haiku vs Sonnet vs GPT-4o on Arabic quality using LLM-as-judge

---

## Tooling Used

See README for full tooling section.
