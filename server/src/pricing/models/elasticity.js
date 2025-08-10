export function clamp(p, base, cap=0.2){ const hi=base*(1+cap), lo=base*(1-cap); return Math.min(hi, Math.max(lo, p)); }
export function priceElasticity(base, f){
  const raw = base * f.event_score * (0.9 + 0.2 * f.inv_pressure) * f.comp_idx;
  return clamp(raw, base);
}
