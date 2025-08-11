// ui/src/lib/api.js
import { createClient } from './trpc';
const trpc = createClient();
const BASE = import.meta.env.VITE_API_BASE || '';

const _report = {
  kpis: (days = 7) => fetch(`${BASE}/api/report/kpis?days=${days}`).then((r) => r.json()),
  conv: (sku, buckets = 6) =>
    fetch(`${BASE}/api/report/conversion-by-price?sku=${encodeURIComponent(sku || "")}&buckets=${buckets}`).then((r) => r.json()),
  mix: (sku) => fetch(`${BASE}/api/report/algorithm-mix?sku=${encodeURIComponent(sku || "")}`).then((r) => r.json()),
};

export const api = {
  // Pricing via tRPC
  choose: (body) => trpc.pricing.quote.query(body),

  // Invoice via tRPC
  invoice: (body) => trpc.invoicing.issue.mutate(body),

  // Bandit feedback (keep REST for now)
  feedback: (body) =>
    fetch(`${BASE}/api/bandit/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Reports (legacy flat)
  getKPIs: (days = 7) => fetch(`${BASE}/api/report/kpis?days=${days}`).then((r) => r.json()),
  getConversion: (sku, buckets = 6) =>
    fetch(`${BASE}/api/report/conversion-by-price?sku=${encodeURIComponent(sku || "")}&buckets=${buckets}`).then((r) => r.json()),
  getAlgoMix: (sku) => fetch(`${BASE}/api/report/algorithm-mix?sku=${encodeURIComponent(sku || "")}`).then((r) => r.json()),

  // Namespaced reports for new code
  report: _report,

  // Plan + LLM (REST)
  execPlan: (plan) =>
    fetch(`${BASE}/api/execute-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    }).then((r) => r.json()),
  ask: (prompt) =>
    fetch(`${BASE}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }).then((r) => r.json()),

  // Default plan via tRPC
  runDefaultPlan: (ctx) => trpc.orchestration.runDefaultPlan.mutate(ctx),

  // LLM planner via tRPC
  planAndRun: (goal, context) => trpc.orchestration.planAndRun.mutate({ goal, context }),
};
