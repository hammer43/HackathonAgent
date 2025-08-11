export function epsilonGreedy(candidates, epsilon = 0.05) {
  if (Math.random() < epsilon) return candidates[Math.floor(Math.random() * candidates.length)];
  return candidates.slice().sort((a, b) => b.rev - a.rev)[0];
}

/**
 * thompsonSelect - pure selector using injected posterior provider
 * @param {Array<{model:string, price:number, rev:number}>} candidates
 * @param {string} sku
 * @param {(sku:string, model:string)=>{a:number,b:number}} getBeta
 */
export function thompsonSelect(candidates, sku, getBeta) {
  let best = null, score = -Infinity;
  for (const c of candidates) {
    const { a, b } = getBeta(sku, c.model);
    const p = sampleBeta(a, b);
    const s = c.price * p;
    if (s > score) { score = s; best = { ...c, pSample: p }; }
  }
  return best;
}

function sampleBeta(a, b) { const x = gamma(a), y = gamma(b); return x / (x + y); }
function gamma(k) {
  if (k < 1) { const u = Math.random(); return gamma(1 + k) * Math.pow(u, 1 / k); }
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v, u;
    do { x = normal(); v = 1 + c * x; } while (v <= 0);
    v = v * v * v; u = Math.random();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
function normal() { const u = 1 - Math.random(), v = 1 - Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }