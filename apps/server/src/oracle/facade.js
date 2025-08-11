import { requireFresh } from "@smart/shared/guards";
import { FeaturesSchema } from "@smart/shared/schemas";
import { getInventory, getCompetitorIndex, getEventScore, getAnchorPrice } from "@smart/data-oracles/adapters/mock";
import { buildFeatures } from "@smart/data-oracles/normalizers/features";

export async function featuresFacade({ sku, date }) {
  const inv = await getInventory(sku);
  const cmp = await getCompetitorIndex(sku);
  const evt = await getEventScore(date, sku);
  const anc = await getAnchorPrice(sku);

  requireFresh(inv.asof, 30);
  requireFresh(cmp.asof, 60);

  const features = buildFeatures({ inv, cmp, evt, anc });

  const parsed = FeaturesSchema.safeParse(features);
  if (!parsed.success) throw new Error("FEATURES_SCHEMA_FAIL");

  return {
    features,
    provenance: [
      { source: "inventory://", asof: inv.asof },
      { source: "competitor://", asof: cmp.asof },
      { source: "events://", asof: evt.asof }
    ],
    cache: { ttl_sec: 30 }
  };
}
