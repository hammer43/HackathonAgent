import { getStores } from "../ports/db/index.js";
import { kpisFrom, convByPriceFrom, algoMixFrom } from "@smart/core-domain/analytics";

export async function reportKpis(days=7){
  const { exposures, outcomes } = getStores();
  return kpisFrom(exposures, outcomes, days);
}

export async function reportConvByPrice(sku, buckets=6){
  const { exposures, outcomes } = getStores();
  return convByPriceFrom(exposures, outcomes, sku, buckets);
}

export async function reportAlgoMix(sku){
  const { exposures, outcomes } = getStores();
  return algoMixFrom(exposures, outcomes, sku);
}
