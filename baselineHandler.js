// server/pricing/baselineHandler.js
// Baseline "no-oracle" handler: pulls raw sources and computes a band inline.

// TODO: replace with real connectors (ERP/feeds/DB)
async function getCompetitorPrice(sku, region){
  if (sku === "ULTRA-PLAN-12M") return region === "us-east" ? 92 : 95;
  return region === "us-east" ? 8 : 9;
}
async function getInventory(sku, region){
  if (sku === "ULTRA-PLAN-12M") return { available: 240, reserved: 40 };
  return { available: 5000, reserved: 100 };
}
async function getUnitCost(sku){
  if (sku === "ULTRA-PLAN-12M") return 55.0;
  return 2.0;
}

function computeBand({ unitCost, compPrice, invAvail }){
  const marginTarget = 0.35;
  let target = Math.max(unitCost/(1 - marginTarget), compPrice ? compPrice*1.07 : unitCost*1.5);
  const invPressure = Math.max(0, Math.min(1, (200 - (invAvail||0))/200));
  target *= (1 + 0.05*invPressure);
  return {
    min: +(unitCost*1.2).toFixed(2),
    target: +target.toFixed(2),
    max: +(+target*1.2).toFixed(2)
  };
}

export async function baselineQuote({ tenant_id, sku, segment = "default", region = "us-east", need_explanation = false }){
  const t0 = Date.now();
  const [comp, inv, cost] = await Promise.all([
    getCompetitorPrice(sku, region),
    getInventory(sku, region),
    getUnitCost(sku)
  ]);
  const band = computeBand({ unitCost: cost, compPrice: comp, invAvail: inv.available });
  const out = {
    sku, segment, region,
    price_band: band,
    confidence: 0.65,
    latency_ms: Date.now() - t0,
    sources: { competitor_price: comp, inventory: inv, unit_cost: cost }
  };
  if (need_explanation) out.explanation = "Computed from raw sources; no snapshot/TTL.";
  return out;
}
