import test from 'node:test';
import assert from 'node:assert/strict';
import { appRouter } from '../src/ports/http/trpc.js';

const caller = appRouter.createCaller({});

test('pricing.quote returns a decision with price', async () => {
  const out = await caller.pricing.quote({ sku: 'ROSE-12', date: '2024-08-10' });
  assert.equal(typeof out.price, 'number');
});

test('invoicing.issue returns an invoice with totals', async () => {
  const inv = await caller.invoicing.issue({ po: 'PO-1', lines: [{ sku: 'ROSE-12', qty: 2, unit_price: 10 }] });
  assert.equal(inv.total, 22);
});