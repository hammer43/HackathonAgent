// server/pricing/oracleHandler.js
// Handler that calls an ORB/Oracle to fetch a PricingBundle (snapshot/TTL/guardrails).
// Framework-agnostic: pass request data and { ORB_URL } explicitly.
export async function oracleQuote(
  { tenant_id, sku, segment = "default", region = "us-east", need_explanation = false },
  { ORB_URL }
) {
  const url = ORB_URL || process.env.ORB_URL || "http://localhost:8081/plan/execute";
  const req = {
    plan_id: "pricing_bundle_v1",
    inputs: { tenant_id, sku, segment, region },
    budgets: { latency_ms: 200, token$: 0.01 }
  };
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req)
  });
  if (!r.ok) throw new Error(`ORB error ${r.status}: ${await r.text()}`);
  const { bundle, latency_ms } = await r.json();
  const out = {
    sku, segment, region,
    price_band: bundle.price_band,
    confidence: bundle.confidence,
    snapshot_id: bundle.snapshot_id,
    ttl_sec: bundle.ttl_sec,
    lineage: { orb_latency_ms: latency_ms }
  };
  if (need_explanation) {
    const comp = bundle.context?.competitor_delta;
    const inv = bundle.context?.inventory_pressure;
    out.explanation = `Chosen within ${JSON.stringify(bundle.price_band)} given comp ${comp} and inventory ${inv}.`;
  }
  return out;
}
