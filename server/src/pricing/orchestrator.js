import { featuresFacade } from "../oracle/facade.js";
import { priceElasticity, clamp } from "./models/elasticity.js";
import { priceAnchor } from "./models/anchor.js";
import { pricePromo } from "./models/promo.js";
import { epsilonGreedy } from "./strategies/epsilonGreedy.js";
import { thompson } from "./strategies/thompson.js";

function pBuy(price, anchor){ const x=(anchor-price)/Math.max(anchor*0.2,1); return 1/(1+Math.exp(-3*x)); }
function round2(n){ return Math.round(n*100)/100; }

export async function choosePrice({ sku, date, epsilon=0.05, strategy="epsilon" }){
  const { features:f, provenance } = await featuresFacade({ sku, date });
  const base = f.anchor_price;

  const candidates = [
    { model:"Elasticity", price: round2(priceElasticity(base, f)) },
    { model:"Anchor",     price: round2(priceAnchor(base)) },
    { model:"Promo",      price: round2(pricePromo(base)) },
  ].map(c => ({ ...c, p_buy: pBuy(c.price, base), rev: c.price * pBuy(c.price, base) }));

  const picked = strategy==="thompson" ? thompson(candidates, sku) : epsilonGreedy(candidates, epsilon);
  const raw = picked.price;
  const final = round2(clamp(raw, base));
  const clamps = final!==raw ? ["Cap ±20% vs anchor"] : [];

  return {
    sku, date, strategy, epsilon,
    candidates, selection: picked,
    raw, price: final, clamps,
    features: f, provenance,
    notes: strategy==="thompson" ? `Thompson Sampling picked ${picked.model}` : `ε-greedy picked ${picked.model} (ε=${epsilon.toFixed(2)})`
  };
}
