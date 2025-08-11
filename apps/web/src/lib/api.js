// ui/src/lib/api.js
import { createClient } from './trpc';
const trpc = createClient();

const _report = {
  kpis: (days = 7) => fetch(`/api/report/kpis?days=${days}`).then((r) => r.json()),
  conv: (sku, buckets = 6) =>
    fetch(`/api/report/conversion-by-price?sku=${encodeURIComponent(sku || "")}&buckets=${buckets}`).then((r) => r.json()),
  mix: (sku) => fetch(`/api/report/algorithm-mix?sku=${encodeURIComponent(sku || "")}`).then((r) => r.json()),
};

export const api = {
  // Pricing via tRPC
  choose: (body) => trpc.pricing.quote.query(body),

  // Invoice via tRPC
  invoice: (body) => trpc.invoicing.issue.mutate(body),

  // Bandit feedback (keep REST for now)
  feedback: (body) =>
    fetch(`/api/bandit/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Reports (legacy flat)
  getKPIs: (days = 7) => fetch(`/api/report/kpis?days=${days}`).then((r) => r.json()),
  getConversion: (sku, buckets = 6) =>
    fetch(`/api/report/conversion-by-price?sku=${encodeURIComponent(sku || "")}&buckets=${buckets}`).then((r) => r.json()),
  getAlgoMix: (sku) => fetch(`/api/report/algorithm-mix?sku=${encodeURIComponent(sku || "")}`).then((r) => r.json()),

  // Namespaced reports for new code
  report: _report,

  // Plan + LLM (REST)
  execPlan: (plan) =>
    fetch(`/api/execute-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    }).then((r) => r.json()),
  ask: (prompt) =>
    fetch(`/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }).then((r) => r.json()),
};
