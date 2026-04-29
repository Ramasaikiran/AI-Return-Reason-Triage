import Anthropic from "@anthropic-ai/sdk";
import { TriageResult, TriageResultSchema } from "./schemas";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a returns triage specialist for Mumzworld, the largest e-commerce platform for mothers in the Middle East (GCC region). Mumzworld sells baby products, maternity items, and children's goods in English and Arabic.

Your task: analyze a customer's return reason and classify it into exactly one category.

CATEGORIES:
- refund: Customer wants money back. Signals: wrong item, not as described, item not received, defective with strong dissatisfaction, explicit "money back" request, product described as "waste", "damaged", "broken", "useless".
- exchange: Customer wants a different item. Signals: wrong size, wrong color, wrong variant, wants to swap for same/similar product.
- store_credit: Customer is open to store credit or has no strong preference. Signals: vague reason, loyalty language, "whatever works", repeat customer tone.
- escalate: Requires urgent human intervention. Signals: safety/choking/injury hazard, legal threats, suspected fraud, extreme emotional distress, abusive language, regulatory complaint.

RULES:
1. If input is NOT about a product return (e.g., greetings, unrelated questions, gibberish), set is_out_of_scope=true.
2. Confidence < 0.55 means you are genuinely uncertain — do not fake high confidence.
3. Never invent details not present in the input text.
4. Arabic in reasoning_ar and suggested_action_ar MUST be native Gulf Arabic quality — not Google-translated English.
5. Detect input language accurately: "en", "ar", "mixed" (if both scripts), or "unknown".
6. When escalating, suggested_action must instruct the agent to contact supervisor immediately.

RESPONSE FORMAT:
Respond ONLY with a raw JSON object. No markdown fences, no preamble.

{
  "category": "refund" | "exchange" | "store_credit" | "escalate",
  "confidence": <float 0.0–1.0>,
  "reasoning_en": "<1–2 sentences>",
  "reasoning_ar": "<1–2 sentences in native Arabic>",
  "suggested_action_en": "<one clear action line for support agent>",
  "suggested_action_ar": "<one clear action line in Arabic>",
  "detected_language": "en" | "ar" | "mixed" | "unknown",
  "is_out_of_scope": <boolean>,
  "out_of_scope_reason": <null or string>
}`;

export async function classifyReturn(text: string): Promise<TriageResult> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Customer return reason:\n\n${text.trim()}`,
      },
    ],
  });

  const firstBlock = message.content[0];
  if (firstBlock.type !== "text") {
    throw new Error("Unexpected response type from Claude API");
  }

  let raw = firstBlock.text.trim();

  // Strip accidental markdown fences (defensive)
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Claude returned invalid JSON: ${raw.slice(0, 200)}`);
  }

  // Validate with Zod — explicit failure, never silent
  const result = TriageResultSchema.parse(parsed);
  return result;
}
