export function buildFeatures({ inv, cmp, evt, anc }) {
  return {
    anchor_price: anc.anchor_price,
    inv_pressure: Math.max(0.6, Math.min(1.6, 20 / Math.max(inv.on_hand - inv.reserved, 1))),
    comp_idx: cmp.comp_idx,
    event_score: evt.event_score,
    lead_time: 6
  };
}