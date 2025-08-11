import test from 'node:test';
import assert from 'node:assert/strict';
import { featuresFacade } from '../src/oracle/facade.js';

test('featuresFacade returns validated features', async () => {
  const out = await featuresFacade({ sku: 'ROSE-12', date: '2024-08-10' });
  assert.equal(typeof out.features.anchor_price, 'number');
  assert.ok(Array.isArray(out.provenance));
});