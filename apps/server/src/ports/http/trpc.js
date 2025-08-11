import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { featuresFacade } from '../../oracle/facade.js';
import { choosePrice } from '../../pricing/orchestrator.js';
import { createInvoice } from '@smart/core-domain/invoicing';

const t = initTRPC.create();

export const appRouter = t.router({
  pricing: t.router({
    quote: t.procedure
      .input(z.object({ sku: z.string(), date: z.string(), epsilon: z.number().optional(), strategy: z.enum(['epsilon','thompson']).optional() }))
      .query(async ({ input }) => {
        const { sku, date, epsilon = 0.05, strategy = 'epsilon' } = input;
        const out = await choosePrice({ sku, date, epsilon, strategy });
        return out;
      })
  }),
  invoicing: t.router({
    issue: t.procedure
      .input(z.object({ po: z.string().optional(), lines: z.array(z.object({ sku: z.string(), qty: z.number().int().positive(), unit_price: z.number().nonnegative() })) }))
      .mutation(async ({ input }) => {
        return createInvoice(input);
      })
  })
});

export type AppRouter = typeof appRouter;