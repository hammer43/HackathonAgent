import { z } from "zod";

export const PricingChooseRequestSchema = z.object({
  sku: z.string().min(1),
  date: z.string().min(1),
  epsilon: z.number().min(0).max(1).optional(),
  strategy: z.enum(["epsilon", "thompson"]).optional()
});

export const PricingChooseResponseSchema = z.object({
  sku: z.string(),
  date: z.string(),
  strategy: z.string(),
  price: z.number(),
  raw: z.number(),
  clamps: z.array(z.string()).optional()
}).passthrough();