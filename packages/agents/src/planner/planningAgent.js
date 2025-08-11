import { z } from 'zod';
import { tools } from '../registry/index.js';
import { runPlan } from './index.js';

const PlanSchema = z.object({
  context: z.record(z.any()).default({}),
  workflow: z.array(z.object({
    step: z.string(),
    id: z.string().optional(),
    args: z.record(z.any()).optional(),
    out: z.record(z.string()).optional(),
    retries: z.number().int().nonnegative().optional()
  })).min(1)
});

export async function planAndRun({ goal, context = {}, llm }, { toolFns }) {
  const registry = Object.values(tools).map(t => ({ name: t.name, description: t.description, input: String(t.input) }));
  const prompt = `You are a planning agent. Given a goal and available tools, produce a minimal JSON plan to accomplish it.
Only output JSON. Do not include comments or text.

Goal: ${goal}
Context: ${JSON.stringify(context)}
Tools: ${registry.map(t=>`- ${t.name}: ${t.description}`).join('\n')}

Return shape: { "context": { ... }, "workflow": [{ "step": "tool_name", "args": { ... } }] }
`;

  const proposal = await llm(prompt);
  let raw;
  try { raw = JSON.parse(proposal || '{}'); } catch { raw = {}; }

  // validate & repair minimal
  let plan = safePlan(raw, context);
  const parsed = PlanSchema.safeParse(plan);
  if (!parsed.success) {
    plan = { context, workflow: [ { step: 'price', args: { sku: context.sku, date: context.date } } ] };
  }

  const { results } = await runPlan(plan.workflow, toolFns);
  return { plan, results };
}

function safePlan(raw, context){
  if (!raw || typeof raw !== 'object') return { context, workflow: [] };
  if (!Array.isArray(raw.workflow)) raw.workflow = [];
  raw.context = { ...(raw.context||{}), ...context };
  raw.workflow = raw.workflow.filter(s => s && typeof s.step === 'string');
  return raw;
}