import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { choosePrice } from '../../pricing/orchestrator.js';
import { createInvoice } from '@smart/core-domain/invoicing';
import { PricingAgent } from '@smart/agents/pricing';
import { InvoiceAgent } from '@smart/agents/invoicing';
import { PlanSchema } from '@smart/shared/schemas';
import { executePlan } from '../../tools/executor.js';
import { buildDefaultPlan } from '../../tools/defaultPlan.js';
import { planAndRun as planningAgent } from '@smart/agents/planningAgent';
import { TOOLS } from '../../tools/index.js';
import { askLLM } from '../../llm/client.js';

const t = initTRPC.create();

export const appRouter = t.router({
  pricing: t.router({
    quote: t.procedure
      .input(z.object({ sku: z.string(), date: z.string(), epsilon: z.number().optional(), strategy: z.enum(['epsilon','thompson']).optional() }))
      .query(async ({ input }) => {
        const { sku, date, epsilon = 0.05, strategy = 'epsilon' } = input;
        const out = await choosePrice({ sku, date, epsilon, strategy });
        return out;
      }),
    agentQuote: t.procedure
      .input(z.object({ sku: z.string(), date: z.string(), epsilon: z.number().optional(), strategy: z.enum(['epsilon','thompson']).optional() }))
      .query(async ({ input }) => {
        const agent = await PricingAgent({ choosePricePort: choosePrice }, input);
        return agent.decision;
      })
  }),
  invoicing: t.router({
    issue: t.procedure
      .input(z.object({ po: z.string().optional(), lines: z.array(z.object({ sku: z.string(), qty: z.number().int().positive(), unit_price: z.number().nonnegative() })) }))
      .mutation(async ({ input }) => {
        return createInvoice(input);
      }),
    agentIssue: t.procedure
      .input(z.object({ po: z.string().optional(), lines: z.array(z.object({ sku: z.string(), qty: z.number().int().positive(), unit_price: z.number().nonnegative() })) }))
      .mutation(async ({ input }) => {
        const agent = await InvoiceAgent({ createInvoicePort: createInvoice }, input);
        return agent.invoice;
      })
  }),
  orchestration: t.router({
    runPlan: t.procedure
      .input(PlanSchema)
      .mutation(async ({ input }) => {
        return executePlan(input);
      }),
    runDefaultPlan: t.procedure
      .input(z.object({ sku: z.string(), date: z.string(), qty: z.number().int().positive().default(1), po_ref: z.string().nullable().optional(), epsilon: z.number().optional(), strategy: z.enum(['epsilon','thompson']).optional() }))
      .mutation(async ({ input }) => {
        const plan = buildDefaultPlan(input);
        return executePlan(plan);
      }),
    planAndRun: t.procedure
      .input(z.object({ goal: z.string(), context: z.record(z.any()).default({}) }))
      .mutation(async ({ input }) => {
        const toolFns = Object.fromEntries(Object.entries(TOOLS).map(([name, fn]) => [name, (args) => fn({ context: {}, steps: {} }, args, () => {})]));
        const res = await planningAgent({ goal: input.goal, context: input.context, llm: async (prompt)=> (await askLLM({ prompt })).text }, { toolFns });
        return res;
      })
  })
});