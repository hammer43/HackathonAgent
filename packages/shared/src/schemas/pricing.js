import { z } from "zod";

export const PricingChooseRequestSchema = z.object({
  sku: z.string().min(1),
  date: z.string().min(1),
  epsilon: z.number().min(0).max(1).optional(),
  strategy: z.enum(["epsilon", "thompson"]).optional()
});

export const CandidateSchema = z.object({
  model: z.string(),
  price: z.number(),
  p_buy: z.number().min(0).max(1).optional(),
  rev: z.number().optional()
});

export const SelectionSchema = CandidateSchema.extend({
  pSample: z.number().optional()
});

export const FeaturesSchemaLite = z.object({
  anchor_price: z.number(),
  inv_pressure: z.number(),
  comp_idx: z.number(),
  event_score: z.number(),
  lead_time: z.number()
});

export const PricingChooseResponseSchema = z.object({
  sku: z.string(),
  date: z.string(),
  strategy: z.string(),
  price: z.number(),
  raw: z.number(),
  clamps: z.array(z.string()).optional(),
  selection: SelectionSchema.optional(),
  candidates: z.array(CandidateSchema).optional(),
  features: FeaturesSchemaLite.optional(),
  notes: z.string().optional()
});