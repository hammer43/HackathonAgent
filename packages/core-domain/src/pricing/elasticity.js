export function clamp(p, base, cap = 0.2) {
  const hi = base * (1 + cap);
  const lo = base * (1 - cap);
  return Math.min(hi, Math.max(lo, p));
}

export function priceElasticity(base, features) {
  const raw = base * features.event_score * (0.9 + 0.2 * features.inv_pressure) * features.comp_idx;
  return clamp(raw, base);
}