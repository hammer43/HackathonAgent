import { z } from "zod";

export const InvoiceLineSchema = z.object({
  sku: z.string().min(1),
  qty: z.number().int().positive(),
  unit_price: z.number().nonnegative()
});

export const InvoiceCreateRequestSchema = z.object({
  po: z.string().optional(),
  lines: z.array(InvoiceLineSchema).min(1)
});