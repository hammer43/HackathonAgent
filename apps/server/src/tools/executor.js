import { PlanSchema } from "@smart/shared/schemas";
import { runPlan } from "@smart/agents/planner";
import { TOOLS } from "./index.js";

export async function executePlan(plan) {
  const parsed = PlanSchema.safeParse(plan);
  if (!parsed.success) throw new Error("PLAN_SCHEMA_FAIL");

  const events = [];
  const ctx = { context: JSON.parse(JSON.stringify(parsed.data.context || {})), steps: {} };
  const emit = (e) => events.push({ ts: Date.now(), ...e });

  const tools = Object.fromEntries(Object.entries(TOOLS).map(([name, fn]) => [name, async (args) => fn(ctx, args, emit)]));

  const { results } = await runPlan(parsed.data.workflow, tools);
  for (const r of results) {
    if (r.ok) {
      const id = r.task.id || r.task.step;
      ctx.steps[id] = r.out;
      ctx.last = r.out;
      if (r.task.out) {
        for (const [k, v] of Object.entries(r.task.out)) ctx.context[v] = r.out[k] ?? r.out;
      }
      emit({ level: "info", step: id, msg: `Succeeded ${r.task.step}` });
    } else {
      emit({ level: "error", step: r.task.id || r.task.step, msg: String(r.error) });
      return { ok: false, run_id: ctx.context.run_id || `run_${new Date().toISOString()}`, error: String(r.error), failed_step: r.task.id || r.task.step, events, context: ctx.context, steps: ctx.steps };
    }
  }
  return { ok: true, run_id: ctx.context.run_id || `run_${new Date().toISOString()}`, context: ctx.context, steps: ctx.steps, events };
}
