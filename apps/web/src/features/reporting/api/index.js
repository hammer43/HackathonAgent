export const getKPIs = (days = 7) => fetch(`/api/report/kpis?days=${days}`).then((r) => r.json());
export const getConversion = (sku, buckets = 6) =>
  fetch(`/api/report/conversion-by-price?sku=${encodeURIComponent(sku || '')}&buckets=${buckets}`).then((r) => r.json());
export const getAlgoMix = (sku) => fetch(`/api/report/algorithm-mix?sku=${encodeURIComponent(sku || '')}`).then((r) => r.json());