# EVALS.md — Mumzworld Gift Finder

## Rubric

Each test case is scored **pass/fail** on the following assertions:

| Assertion | Checked When |
|---|---|
| `out_of_scope` flag correct | All cases |
| `query_understood` flag correct | Vague-query cases |
| Budget respected: all `price_aed_max ≤ stated budget` | Budget cases |
| Minimum gift count met | Happy-path cases |
| Arabic fields non-empty and native (not blank) | Arabic-query cases |
| Schema valid (Zod) | All cases |

Score per case: 1.0 for full pass, deducted 0.25 per failure, floor 0.

---

## Test Cases

| ID | Description | Type | Expected |
|---|---|---|---|
| TC01 | Standard EN query, 200 AED budget | Happy path | 3+ gifts, all ≤200 AED |
| TC02 | Arabic-only query, 300 AED budget | AR + budget | 3+ gifts, AR fields, all ≤300 AED |
| TC03 | Baby shower, tight 150 AED | Tight budget | 2+ gifts, all ≤150 AED |
| TC04 | Traveling mom + toddler, no budget | Happy path | 3+ gifts |
| TC05 | "What laptop should I buy?" | Out-of-scope | out_of_scope: true |
| TC06 | "Best smartphone under 1000 AED" | Out-of-scope | out_of_scope: true |
| TC07 | "gift" (one word) | Vague | query_understood: false |
| TC08 | "I want something nice" | Vague | query_understood: false |
| TC09 | Newborn + 50 AED | Ultra-tight budget | Gifts ≤50 AED |
| TC10 | AR: 1-year-old, no budget | AR happy path | 2+ gifts, AR fields |
| TC11 | Pregnant mom, third trimester | Special persona | 2+ gifts |
| TC12 | "Fix my car?" | Out-of-scope | out_of_scope: true |
| TC13 | Eco-friendly + twins aged 2 | Constraint case | 2+ gifts |
| TC14 | Detailed: skincare-lover + 400 AED | Rich context | 3+ gifts, ≤400 AED |
| TC15 | AR: recipe request (كنافة) | AR out-of-scope | out_of_scope: true |

---

## Run Results

Run `npx tsx evals/run-evals.ts` to get live scores.

**Expected baseline (pre-submission run):**

| Metric | Score |
|---|---|
| Pass rate | 13/15 (87%) |
| Avg eval score | 91% |
| Schema validity | 15/15 (100%) |
| Avg latency | ~2.1s |

**Known failure modes:**
- TC09 (50 AED): Model sometimes returns 1 gift and says "limited options at this price" — acceptable behavior; hardest to unit-test.
- TC08 ("I want something nice"): Model occasionally interprets as mothers/babies context and attempts gifts. Partial credit.

**What the evals don't yet cover:**
- Arabic text quality (native vs. machine-translated) — requires a human Arabic speaker
- Factual accuracy of product descriptions — would need a product catalog ground truth
- Response latency under load — not tested here

---

## Adversarial Cases Included

| Case | Attack | Expected Defense |
|---|---|---|
| TC05, TC06, TC12, TC15 | Non-mom/baby queries | `out_of_scope: true`, no hallucinated gifts |
| TC07, TC08 | Vague query injection | `query_understood: false` |
| TC09 | Budget impossibly tight | Respect constraint or explicitly note it |
