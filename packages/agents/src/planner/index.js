export async function runPlan(workflow, tools) {
  const context = {};
  const steps = {};
  const results = [];

  const resolveArgs = (args) => {
    const json = JSON.stringify(args || {});
    const out = json.replace(/\$\{([^}]+)\}/g, (_, path) => {
      const val = getPath({ context, steps, last: steps.__last }, path.trim());
      return typeof val === "undefined" ? "" : String(val);
    });
    return JSON.parse(out);
  };

  for (const task of workflow) {
    const tool = tools[task.step];
    if (!tool) {
      results.push({ task, ok: false, error: `STEP_NOT_ALLOWED:${task.step}` });
      break;
    }
    const args = resolveArgs(task.args);
    let attempt = 0, lastErr = null;
    while (attempt <= (task.retries || 0)) {
      try {
        const out = await tool(args);
        const id = task.id || task.step;
        steps[id] = out;
        steps.__last = out;
        if (task.out) {
          for (const [k, v] of Object.entries(task.out)) context[v] = out[k] ?? out;
        }
        results.push({ task, ok: true, out });
        break;
      } catch (e) {
        lastErr = e;
        attempt += 1;
        if (attempt > (task.retries || 0)) {
          results.push({ task, ok: false, error: String(e?.message || e) });
        }
      }
    }
  }

  return { results };
}

function getPath(ctx, path) {
  return path.split(".").reduce((acc, k) => (acc && Object.prototype.hasOwnProperty.call(acc, k)) ? acc[k] : undefined, ctx);
}