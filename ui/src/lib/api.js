// ui/src/lib/api.js
export const api = {
  // Pricing
  choose: (body) =>
    fetch(`/api/pricing/choose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Invoice
  invoice: (body) =>
    fetch(`/api/invoice/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Bandit feedback
  feedback: (body) =>
    fetch(`/api/bandit/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Reports
  getKPIs: (days = 7) =>
    fetch(`/api/report/kpis?days=${days}`).then((r) => r.json()),
  getConversion: (sku, buckets = 6) =>
    fetch(
      `/api/report/conversion-by-price?sku=${encodeURIComponent(
        sku || ""
      )}&buckets=${buckets}`
    ).then((r) => r.json()),
  getAlgoMix: (sku) =>
    fetch(
      `/api/report/algorithm-mix?sku=${encodeURIComponent(sku || "")}`
    ).then((r) => r.json()),

  // Plan + LLM
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
