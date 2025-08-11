import { getPrisma } from './prismaClient.js';

export async function recordRun(ev){
  const prisma = getPrisma();
  await prisma.run.create({ data: { type: ev.type || 'unknown', json: JSON.stringify(ev) } });
}

export async function recordExposure(ev){
  const prisma = getPrisma();
  await prisma.exposure.create({ data: {
    sku: ev.sku,
    model: ev.model || null,
    strategy: ev.strategy || null,
    price: ev.price,
    p_buy: ev.p_buy ?? null,
    rev_pred: ev.rev_pred ?? null,
  }});
}

export async function recordOutcome(ev){
  const prisma = getPrisma();
  await prisma.outcome.create({ data: {
    sku: ev.sku,
    model: ev.model,
    success: !!ev.success,
  }});
}

export async function getStores(){
  const prisma = getPrisma();
  const [exposures, outcomes] = await Promise.all([
    prisma.exposure.findMany(),
    prisma.outcome.findMany(),
  ]);
  // map to legacy shape used by analytics
  return {
    runs: [],
    exposures: exposures.map(e => ({ ts: new Date(e.ts).getTime(), sku: e.sku, model: e.model || undefined, strategy: e.strategy || undefined, price: e.price, p_buy: e.p_buy || undefined, rev_pred: e.rev_pred || undefined })),
    outcomes: outcomes.map(o => ({ ts: new Date(o.ts).getTime(), sku: o.sku, model: o.model, success: o.success })),
  };
}