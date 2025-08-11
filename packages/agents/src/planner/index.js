export async function runPlan(taskGraph, tools) {
  const results = [];
  for (const task of taskGraph) {
    const { type, input, retries = 0 } = task;
    let attempt = 0, lastErr = null;
    while (attempt <= retries) {
      try {
        // delegate to tools by type
        const tool = tools[type];
        if (!tool) throw new Error(`Unknown tool: ${type}`);
        const out = await tool(input);
        results.push({ task, ok: true, out });
        break;
      } catch (e) {
        lastErr = e;
        attempt += 1;
        if (attempt > retries) {
          results.push({ task, ok: false, error: String(e?.message || e) });
        }
      }
    }
  }
  return { results };
}