import { z } from "zod";

export const PlanStepSchema = z.object({
  step: z.string(),
  id: z.string().optional(),
  args: z.record(z.any()).optional(),
  out: z.record(z.string()).optional(),
  retries: z.number().int().nonnegative().optional()
});

export const PlanSchema = z.object({
  context: z.record(z.any()).default({}),
  workflow: z.array(PlanStepSchema).min(1)
});