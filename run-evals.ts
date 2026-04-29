/**
 * Mumzworld Gift Finder — Evaluation Suite
 * Run: npx tsx evals/run-evals.ts
 *
 * Tests 15 cases across: happy path, budget constraints, Arabic queries,
 * out-of-scope, vague queries, adversarial, multilingual.
 */

import Anthropic from "@anthropic-ai/sdk";
import { GiftResponseSchema } from "../lib/schema";
import { SYSTEM_PROMPT, buildUserPrompt } from "../lib/prompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface TestCase {
  id: string;
  query: string;
  expect: {
    out_of_scope?: boolean;
    query_understood?: boolean;
    min_gifts?: number;
    max_price_aed?: number;
    has_arabic?: boolean;
    uncertainty_note_present?: boolean;
  };
  description: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: "TC01",
    query: "Thoughtful gift for a friend with a 6-month-old, under 200 AED",
    expect: { out_of_scope: false, query_understood: true, min_gifts: 3, max_price_aed: 200 },
    description: "Standard English happy-path",
  },
  {
    id: "TC02",
    query: "هدية للأم الجديدة بميزانية 300 درهم",
    expect: { out_of_scope: false, query_understood: true, min_gifts: 3, max_price_aed: 300, has_arabic: true },
    description: "Arabic-only query with budget",
  },
  {
    id: "TC03",
    query: "Gift for a baby shower, budget 150 AED",
    expect: { out_of_scope: false, query_understood: true, min_gifts: 2, max_price_aed: 150 },
    description: "Tight budget — should stay under 150",
  },
  {
    id: "TC04",
    query: "Something useful for a mom who travels with a toddler",
    expect: { out_of_scope: false, query_understood: true, min_gifts: 3 },
    description: "Travel use case, no budget constraint",
  },
  {
    id: "TC05",
    query: "What laptop should I buy?",
    expect: { out_of_scope: true },
    description: "Out-of-scope: electronics",
  },
  {
    id: "TC06",
    query: "Best smartphone under 1000 AED",
    expect: { out_of_scope: true },
    description: "Out-of-scope: phone purchase",
  },
  {
    id: "TC07",
    query: "gift",
    expect: { query_understood: false },
    description: "Vague query — no context",
  },
  {
    id: "TC08",
    query: "I want something nice",
    expect: { query_understood: false },
    description: "Too vague — no recipient or context",
  },
  {
    id: "TC09",
    query: "Gift for a newborn, budget 50 AED",
    expect: { out_of_scope: false, query_understood: true, max_price_aed: 50 },
    description: "Very tight budget — model should respect it",
  },
  {
    id: "TC10",
    query: "هدية مميزة لصديقتي التي لديها طفل عمره سنة واحدة",
    expect: { out_of_scope: false, query_understood: true, min_gifts: 2, has_arabic: true },
    description: "Arabic query: 1-year-old, no budget specified",
  },
  {
    id: "TC11",
    query: "Gift for a pregnant mom in her third trimester",
    expect: { out_of_scope: false, query_understood: true, min_gifts: 2 },
    description: "Pregnant mom use case",
  },
  {
    id: "TC12",
    query: "Can you tell me how to fix my car?",
    expect: { out_of_scope: true },
    description: "Out-of-scope: car repair",
  },
  {
    id: "TC13",
    query: "Eco-friendly gift for a mom with twins aged 2",
    expect: { out_of_scope: false, query_understood: true, min_gifts: 2 },
    description: "Eco constraint + twins",
  },
  {
    id: "TC14",
    query: "Gift for my sister who just had her second baby, budget 400 AED, she loves skincare",
    expect: { out_of_scope: false, query_understood: true, min_gifts: 3, max_price_aed: 400 },
    description: "Detailed request with preferences",
  },
  {
    id: "TC15",
    query: "أعطني وصفة لعمل الكنافة",
    expect: { out_of_scope: true },
    description: "Arabic out-of-scope: recipe request",
  },
];

interface EvalResult {
  id: string;
  description: string;
  passed: boolean;
  score: number;
  failures: string[];
  raw_gifts: number;
  schema_valid: boolean;
  latency_ms: number;
}

async function runCase(tc: TestCase): Promise<EvalResult> {
  const start = Date.now();
  const failures: string[] = [];

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(tc.query) }],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        id: tc.id,
        description: tc.description,
        passed: false,
        score: 0,
        failures: ["JSON parse failed"],
        raw_gifts: 0,
        schema_valid: false,
        latency_ms: Date.now() - start,
      };
    }

    const validated = GiftResponseSchema.safeParse(parsed);
    if (!validated.success) {
      return {
        id: tc.id,
        description: tc.description,
        passed: false,
        score: 0,
        failures: validated.error.issues.map((i) => `Schema: ${i.path.join(".")} — ${i.message}`),
        raw_gifts: 0,
        schema_valid: false,
        latency_ms: Date.now() - start,
      };
    }

    const data = validated.data;

    // Run assertions
    if (tc.expect.out_of_scope !== undefined) {
      if (data.out_of_scope !== tc.expect.out_of_scope) {
        failures.push(
          `out_of_scope: expected ${tc.expect.out_of_scope}, got ${data.out_of_scope}`
        );
      }
    }

    if (tc.expect.query_understood !== undefined) {
      if (data.query_understood !== tc.expect.query_understood) {
        failures.push(
          `query_understood: expected ${tc.expect.query_understood}, got ${data.query_understood}`
        );
      }
    }

    if (tc.expect.min_gifts !== undefined) {
      if (data.gifts.length < tc.expect.min_gifts) {
        failures.push(
          `min_gifts: expected ≥${tc.expect.min_gifts}, got ${data.gifts.length}`
        );
      }
    }

    if (tc.expect.max_price_aed !== undefined) {
      const violations = data.gifts.filter(
        (g) => g.price_aed_max > (tc.expect.max_price_aed ?? Infinity)
      );
      if (violations.length > 0) {
        failures.push(
          `Budget exceeded: ${violations.map((g) => `${g.name} (${g.price_aed_max} AED)`).join(", ")}`
        );
      }
    }

    if (tc.expect.has_arabic) {
      const hasAr = data.gifts.every((g) => g.name_ar.trim().length > 0 && g.reasoning_ar.trim().length > 0);
      if (!hasAr) {
        failures.push("Arabic fields missing or empty on some gifts");
      }
    }

    const score = failures.length === 0 ? 1 : Math.max(0, 1 - failures.length * 0.25);

    return {
      id: tc.id,
      description: tc.description,
      passed: failures.length === 0,
      score,
      failures,
      raw_gifts: data.gifts.length,
      schema_valid: true,
      latency_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      id: tc.id,
      description: tc.description,
      passed: false,
      score: 0,
      failures: [`Exception: ${err}`],
      raw_gifts: 0,
      schema_valid: false,
      latency_ms: Date.now() - start,
    };
  }
}

async function main() {
  console.log("🧪 Mumzworld Gift Finder — Eval Suite");
  console.log("=".repeat(60));

  const results: EvalResult[] = [];

  for (const tc of TEST_CASES) {
    process.stdout.write(`  [${tc.id}] ${tc.description}... `);
    const result = await runCase(tc);
    results.push(result);

    if (result.passed) {
      console.log(`✅ PASS (${result.latency_ms}ms, ${result.raw_gifts} gifts)`);
    } else {
      console.log(`❌ FAIL`);
      result.failures.forEach((f) => console.log(`        → ${f}`));
    }

    // Rate limiting buffer
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n" + "=".repeat(60));
  const passed = results.filter((r) => r.passed).length;
  const avgScore = results.reduce((s, r) => s + r.score, 0) / results.length;
  const avgLatency = Math.round(
    results.reduce((s, r) => s + r.latency_ms, 0) / results.length
  );

  console.log(`RESULTS: ${passed}/${results.length} passed`);
  console.log(`SCORE:   ${(avgScore * 100).toFixed(1)}%`);
  console.log(`LATENCY: avg ${avgLatency}ms`);

  // Schema validity
  const schemaValid = results.filter((r) => r.schema_valid).length;
  console.log(`SCHEMA:  ${schemaValid}/${results.length} valid`);

  const failures = results.filter((r) => !r.passed);
  if (failures.length > 0) {
    console.log("\nFailed cases:");
    failures.forEach((r) => {
      console.log(`  ${r.id}: ${r.description}`);
      r.failures.forEach((f) => console.log(`    → ${f}`));
    });
  }

  console.log("\n✅ Eval complete.");
  process.exit(passed === results.length ? 0 : 1);
}

main();
