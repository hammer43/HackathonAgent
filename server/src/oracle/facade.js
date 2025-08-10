import { requireFresh } from "../guards/freshness.js";
import Ajv from "ajv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// demo adapters (mock)
async function getInventory(sku){ return { on_hand: 45, reserved: 3, asof: new Date().toISOString() }; }
async function getCompetitorIndex(sku){ return { comp_idx: 0.97, asof: new Date().toISOString() }; }
async function getEventScore(date, sku){ return { event_score: sku==="ROSE-12"?1.12:1.05, asof: new Date().toISOString() }; }
async function getAnchorPrice(sku){ return { anchor_price: sku==="ROSE-12"?49:120 }; }

export async function featuresFacade({ sku, date }) {
  const inv = await getInventory(sku);
  const cmp = await getCompetitorIndex(sku);
  const evt = await getEventScore(date, sku);
  const anc = await getAnchorPrice(sku);

  requireFresh(inv.asof, 30);
  requireFresh(cmp.asof, 60);

  const features = {
    anchor_price: anc.anchor_price,
    inv_pressure: Math.max(0.6, Math.min(1.6, (20 / Math.max(inv.on_hand - inv.reserved, 1)))),
    comp_idx: cmp.comp_idx,
    event_score: evt.event_score,
    lead_time: 6
  };

  // Load JSON schema via fs (no assert)
  const schemaPath = path.join(__dirname, "./schema/features.schema.json");
  const schemaJson = JSON.parse(await fs.readFile(schemaPath, "utf-8"));
  const ajv = new Ajv();
  const validate = ajv.compile(schemaJson);
  if (!validate(features)) throw new Error("FEATURES_SCHEMA_FAIL");

  return {
    features,
    provenance: [
      {source:"inventory://",asof:inv.asof},
      {source:"competitor://",asof:cmp.asof},
      {source:"events://",asof:evt.asof}
    ],
    cache:{ ttl_sec:30 }
  };
}
