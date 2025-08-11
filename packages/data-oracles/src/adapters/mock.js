export async function getInventory(sku) {
  return { on_hand: 45, reserved: 3, asof: new Date().toISOString() };
}

export async function getCompetitorIndex(sku) {
  return { comp_idx: 0.97, asof: new Date().toISOString() };
}

export async function getEventScore(date, sku) {
  return { event_score: sku === "ROSE-12" ? 1.12 : 1.05, asof: new Date().toISOString() };
}

export async function getAnchorPrice(sku) {
  return { anchor_price: sku === "ROSE-12" ? 49 : 120 };
}