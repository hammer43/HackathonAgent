import { updateBeta } from "../memory/banditRepo.js";
import { recordOutcome } from "../memory/runsRepo.js";
export function evaluator({ sku, model, success }){
  recordOutcome({ sku, model, success: !!success });
  const state = updateBeta(sku, model, !!success);
  return { ok:true, state };
}
