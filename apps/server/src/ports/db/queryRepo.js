import { getPrisma } from './prismaClient.js';

export async function getRecentRuns(limit = 50) {
  const prisma = getPrisma();
  const rows = await prisma.run.findMany({ orderBy: { ts: 'desc' }, take: limit });
  return rows.map(r => ({ ts: new Date(r.ts).getTime(), type: r.type, json: safeParse(r.json) }));
}

export async function getRecentExposures(limit = 100) {
  const prisma = getPrisma();
  const rows = await prisma.exposure.findMany({ orderBy: { ts: 'desc' }, take: limit });
  return rows.map(e => ({ ts: new Date(e.ts).getTime(), sku: e.sku, model: e.model || undefined, strategy: e.strategy || undefined, price: e.price, p_buy: e.p_buy || undefined, rev_pred: e.rev_pred || undefined }));
}

export async function getRecentOutcomes(limit = 100) {
  const prisma = getPrisma();
  const rows = await prisma.outcome.findMany({ orderBy: { ts: 'desc' }, take: limit });
  return rows.map(o => ({ ts: new Date(o.ts).getTime(), sku: o.sku, model: o.model, success: o.success }));
}

function safeParse(s){ try { return JSON.parse(s); } catch { return null; } }