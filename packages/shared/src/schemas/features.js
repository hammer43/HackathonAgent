import { z } from "zod";

export const FeaturesSchema = z.object({
  anchor_price: z.number(),
  inv_pressure: z.number(),
  comp_idx: z.number(),
  event_score: z.number(),
  lead_time: z.number()
});