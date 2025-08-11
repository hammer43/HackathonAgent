import { getStores } from "../memory/runsRepo.js";

export async function reportKpis(days=7){
  const cut = Date.now() - days*24*3600*1000;
  const { exposures, outcomes } = getStores();
  const ex = exposures.filter(e=>e.ts>=cut);
  const oc = outcomes.filter(o=>o.ts>=cut);
  const attempts = ex.length, orders = oc.filter(o=>o.success).length;
  const conversion = attempts? orders/attempts : 0;
  const avg_price = attempts? ex.reduce((a,b)=>a+b.price,0)/attempts : 0;
  const revenue = sumRevenue(ex, oc);
  return { days, attempts, orders, conversion: round2(conversion), avg_price: round2(avg_price), revenue: round2(revenue) };
}

export async function reportConvByPrice(sku, buckets=6){
  const { exposures, outcomes } = getStores();
  const ex = exposures.filter(e=>!sku || e.sku===sku);
  if (!ex.length) return { sku, range:null, points:[] };
  const minP = Math.min(...ex.map(e=>e.price));
  const maxP = Math.max(...ex.map(e=>e.price));
  const step = (maxP - minP) / Math.max(buckets,1);
  const bins = Array.from({length:buckets}, (_,i)=>({i, from:minP+i*step, to:minP+(i+1)*step, shows:0, wins:0}));
  for (const e of ex) {
    const b = Math.min(buckets-1, Math.floor((e.price - minP)/Math.max(step,1e-9)));
    bins[b].shows += 1;
    const ok = outcomes.find(o => (!sku || o.sku===sku) && o.model===e.model && Math.abs(o.ts - e.ts) < 24*3600*1000 && o.success);
    if (ok) bins[b].wins += 1;
  }
  const points = bins.map(b => ({
    from: round2(b.from), to: round2(b.to),
    shows: b.shows, wins: b.wins,
    conversion: b.shows ? round2(b.wins / b.shows) : 0
  }));
  return { sku, range:{ min: round2(minP), max: round2(maxP) }, points };
}

export async function reportAlgoMix(sku){
  const { exposures, outcomes } = getStores();
  const ex = exposures.filter(e=>!sku || e.sku===sku);
  const byModel = {};
  for (const e of ex) {
    byModel[e.model] ??= { shows:0, wins:0, sum_price:0 };
    byModel[e.model].shows += 1;
    byModel[e.model].sum_price += e.price;
  }
  for (const o of outcomes) {
    if (sku && o.sku !== sku) continue;
    if (o.success && byModel[o.model]) byModel[o.model].wins += 1;
  }
  const rows = Object.entries(byModel).map(([model,s])=> ({
    model, shows:s.shows, wins:s.wins, win_rate: s.shows? round2(s.wins/s.shows):0, avg_price: s.shows? round2(s.sum_price/s.shows):0
  }));
  return { sku, rows };
}

function round2(n){ return Math.round(n*100)/100; }
function sumRevenue(exposures, outcomes){
  let rev=0;
  for (const e of exposures){
    const ok = outcomes.find(o => o.sku===e.sku && o.model===e.model && Math.abs(o.ts - e.ts) < 24*3600*1000 && o.success);
    if (ok) rev += e.price;
  }
  return rev;
}
