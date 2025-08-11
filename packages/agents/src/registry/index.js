import { z } from 'zod';

export const tools = {
  price: {
    name: 'price',
    description: 'Choose a price for a given sku and date',
    input: z.object({ sku: z.string(), date: z.string(), epsilon: z.number().optional(), strategy: z.enum(['epsilon','thompson']).optional() }),
  },
  llm_ask: {
    name: 'llm_ask',
    description: 'Ask the LLM for guidance or generate text',
    input: z.object({ prompt: z.string().min(1) })
  },
  policy_check: {
    name: 'policy_check',
    description: 'Check price against a cap policy',
    input: z.object({ max_price_pct: z.number().int().min(1).max(80).default(20) })
  },
  generate_invoice: {
    name: 'generate_invoice',
    description: 'Create an invoice using latest price',
    input: z.object({ po: z.string().optional() })
  },
  report_snapshot: {
    name: 'report_snapshot',
    description: 'Fetch KPIs, conversion by price, and algorithm mix',
    input: z.object({ sku: z.string().optional(), days: z.number().int().default(7) })
  }
};

export function getTool(name){ return tools[name]; }