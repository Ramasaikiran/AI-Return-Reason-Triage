# Mumzworld Gift Finder — AI Engineering Intern (Track A)

> AI-powered bilingual gift recommendation engine for mothers and babies. Natural-language input in English or Arabic → curated, validated shortlist with native-quality copy in both languages.

**One-paragraph summary:** Gift Finder is a customer-facing tool for Mumzworld shoppers who want to buy a gift for a new mom or baby but don't know what to search for. It accepts a free-text request in English or Arabic (e.g. "thoughtful gift for a friend with a 6-month-old, under 200 AED"), runs it through Claude Sonnet with a structured bilingual prompt, validates the response against a Zod schema, and returns 3–5 curated gift suggestions — each with reasoning and a purchase tip in both EN and AR, a confidence score, and explicit out-of-scope/uncertainty handling.

---

## Setup (under 5 minutes)

```bash
git clone <repo-url>
cd mumzworld-gift-finder
npm install

# Copy env file and add your Anthropic API key
cp .env.example .env.local
# Edit .env.local: ANTHROPIC_API_KEY=sk-ant-...

npm run dev
# → http://localhost:3000
```

**Requirements:** Node 18+, an Anthropic API key (Claude Sonnet access).

---

## Deploy to Vercel

```bash
npx vercel
# Set ANTHROPIC_API_KEY in Vercel dashboard: Settings → Environment Variables
```

---

## Running Evals

```bash
npm run eval
# Runs 15 test cases and prints pass/fail with scores
```

See [EVALS.md](./EVALS.md) for the full rubric and expected scores.

---

## Architecture

```
User query (EN/AR)
      │
      ▼
[Next.js API Route /api/find-gifts]
      │  → Claude Sonnet 4 (structured JSON prompt)
      │  → Strip markdown fences
      │  → JSON.parse()
      │  → Zod validate (GiftResponseSchema)
      │  → 502 on failure (explicit, not silent)
      ▼
[Validated GiftResponse]
      │
      ▼
[React UI]
  ├── Language toggle per card (EN/AR)
  ├── Confidence bar per gift
  ├── out_of_scope / query_understood banners
  └── uncertainty_note surface
```

**Why this architecture:** See [TRADEOFFS.md](./TRADEOFFS.md).

---

## AI Engineering Dimensions

| Dimension | How it's addressed |
|---|---|
| **Structured output + validation** | Zod schema, explicit 502 on validation failure |
| **Multilingual** | Native Arabic via prompt instruction ("write fresh, don't translate") |
| **Uncertainty handling** | `out_of_scope`, `query_understood`, `uncertainty_note`, per-gift `confidence` |
| **Evals** | 15 cases — happy path, budget, out-of-scope, vague, adversarial AR |
| **Grounded output** | Model says "I don't know" or sets `out_of_scope: true` when not confident |

---

## Evals

See [EVALS.md](./EVALS.md) for full rubric, 15 test cases, and scores.

---

## Tradeoffs

See [TRADEOFFS.md](./TRADEOFFS.md) for problem selection rationale, architecture choices, and known failure modes.

---

## Tooling

**Models:**
- `claude-sonnet-4-20250514` — all inference (gift generation, eval grading)

**Development:**
- **Claude (claude.ai)** — used for prompt iteration, especially refining the Arabic "write fresh" instruction and the system prompt schema description
- **Cursor** — IDE for code completion and refactors
- **tsx** — run TypeScript evals directly without a build step

**How AI was used:**
- Prompt engineering: iterative loop in Claude.ai — ran ~12 prompt variants against the out-of-scope and Arabic cases before settling on the current system prompt
- Zod schema: written by hand, then verified with Claude for edge cases (nullable fields, enum values)
- Eval script: scaffolded with Claude assistance, then manually reviewed and extended with adversarial cases

**What didn't work:**
- Initial prompt without the "write fresh in Arabic" instruction produced near-literal translations — obvious to any Arabic reader
- Tried function calling for structured output — added 300ms with no quality benefit for this output shape
- Haiku (cost optimization): Arabic reasoning quality noticeably degraded; stayed with Sonnet

**Key prompts committed:** See `lib/prompts.ts` — the system prompt and user prompt builder are the full production prompts, unchanged from what's in the README.

---

## Time Log

| Phase | Time |
|---|---|
| Problem selection + scoping | 30 min |
| Schema + prompt design | 45 min |
| API route + validation | 30 min |
| UI build | 75 min |
| Prompt iteration (Arabic quality) | 45 min |
| Eval suite | 45 min |
| README + TRADEOFFS + EVALS | 30 min |
| **Total** | **~5h 20min** |

Went ~20 minutes over due to Arabic prompt iteration taking longer than expected.
