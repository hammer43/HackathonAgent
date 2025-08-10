import Ajv from "ajv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { TOOLS } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getPlanValidator(){
  const schemaPath = path.join(__dirname, "../guards/plan.schema.json");
  const schemaJson = JSON.parse(await fs.readFile(schemaPath, "utf-8"));
  const ajv = new Ajv({ allErrors:true });
  return ajv.compile(schemaJson);
}

export async function executePlan(plan) {
  const validate = await getPlanValidator();
  if (!validate(plan)) throw new Error("PLAN_SCHEMA_FAIL");

  const events = [];
  const ctx = { context: JSON.parse(JSON.stringify(plan.context||{})), steps:{} };
  const emit = (e) => events.push({ ts: Date.now(), ...e });

  for (const rawStep of plan.workflow) {
    const stepName = rawStep.step;
    const tool = TOOLS[stepName];
    if (!tool) throw new Error(`STEP_NOT_ALLOWED:${stepName}`);

    const args = resolveArgs(rawStep.args||{}, ctx);
    const id = rawStep.id || stepName;
    try {
      emit({ level:"info", step: id, msg:`Starting ${stepName}` });
      const out = await tool(ctx, args, emit);
      ctx.steps[id] = out;
      ctx.last = out;
      if (rawStep.out) {
        for (const [k, v] of Object.entries(rawStep.out)) ctx.context[v] = out[k] ?? out;
      }
      emit({ level:"info", step: id, msg:`Succeeded ${stepName}` });
    } catch (err) {
      emit({ level:"error", step: id, msg:String(err.message||err) });
      return { ok:false, run_id: ctx.context.run_id || `run_${new Date().toISOString()}`, error:String(err.message||err), failed_step: id, events, context: ctx.context, steps: ctx.steps };
    }
  }
  return { ok:true, run_id: ctx.context.run_id || `run_${new Date().toISOString()}`, context: ctx.context, steps: ctx.steps, events };
}

function resolveArgs(args, ctx) {
  const json = JSON.stringify(args);
  const out = json.replace(/\$\{([^}]+)\}/g, (_, path) => {
    const val = getPath(ctx, path.trim());
    return typeof val === "undefined" ? "" : String(val);
  });
  return JSON.parse(out);
}
function getPath(ctx, path) {
  return path.split(".").reduce((acc,k)=> (acc && Object.prototype.hasOwnProperty.call(acc,k)) ? acc[k] : undefined, ctx);
}
