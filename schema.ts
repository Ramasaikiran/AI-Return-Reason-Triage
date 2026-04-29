import { z } from "zod";

export const GiftCategory = z.enum([
  "feeding",
  "clothing",
  "toys",
  "safety",
  "nursery",
  "health",
  "travel",
  "skincare",
  "books",
  "other",
]);

export const GiftItemSchema = z.object({
  name: z.string().min(1),
  name_ar: z.string().min(1),
  price_aed_min: z.number().nonnegative(),
  price_aed_max: z.number().nonnegative(),
  age_range: z.string().nullable(), // e.g. "0-6 months", "all ages"
  category: GiftCategory,
  reasoning: z.string().min(10),   // EN
  reasoning_ar: z.string().min(10), // AR
  confidence: z.number().min(0).max(1),
  purchase_tip: z.string().nullable(),
  purchase_tip_ar: z.string().nullable(),
});

export const GiftResponseSchema = z.object({
  gifts: z.array(GiftItemSchema).min(0).max(5),
  summary: z.string(),       // EN overview
  summary_ar: z.string(),    // AR overview
  query_understood: z.boolean(),
  out_of_scope: z.boolean(),
  uncertainty_note: z.string().nullable(), // shown when uncertain
  detected_language: z.enum(["en", "ar", "mixed"]),
});

export type GiftItem = z.infer<typeof GiftItemSchema>;
export type GiftResponse = z.infer<typeof GiftResponseSchema>;
export type GiftCategory = z.infer<typeof GiftCategory>;
