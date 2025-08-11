import { featuresFacade } from "../oracle/facade.js";
import { choosePrice } from "../pricing/orchestrator.js";
import { createInvoice } from "@smart/core-domain/invoicing";
import { reportKpis, reportConvByPrice, reportAlgoMix } from "./reportUtils.js";
import { askLLM } from "../llm/client.js";

export const TOOLS = {
  async fetch_features(ctx, args, emit){
    const { sku, date } = ctx.context;
    emit({ level:"info", msg:`Fetching features for ${sku} ${date}` });
    const out = await featuresFacade({ sku, date });
    return out;
  },
  async price(ctx, args, emit){
    const { sku, date, strategy="epsilon", epsilon=0.05 } = { ...ctx.context, ...args };
    const out = await choosePrice({ sku, date, strategy, epsilon });
    emit({ level:"info", msg:`Picked ${out.selection.model} @ $${out.price.toFixed(2)}` });
    return out;
  },
  async apply_policy(ctx, args, emit){
    const price = ctx.steps.price1?.price ?? ctx.last?.price ?? ctx.steps.price?.price;
    return { final_price: price, applied_clamps: ctx.steps.price1?.clamps ?? ctx.steps.price?.clamps ?? [] };
  },
  async generate_invoice(ctx, args, emit){
    const { sku, qty=ctx.context.qty||1 } = ctx.context;
    const unit = ctx.steps.price1?.price ?? ctx.last?.price ?? ctx.steps.price?.price;
    const inv = createInvoice({ po: args?.po || ctx.context.po_ref || null, lines:[{ sku, qty, unit_price: unit }] });
    emit({ level:"info", msg:`Invoice ${inv.invoice_id} total $${inv.total}` });
    return inv;
  },
  async report_snapshot(ctx, args, emit){
    const sku = args?.sku || ctx.context.sku;
    const days = args?.days || 7;
    const kpis = await reportKpis(days);
    const conv = await reportConvByPrice(sku, 6);
    const mix  = await reportAlgoMix(sku);
    return { kpis, conv, mix };
  },
  async llm_ask(ctx, args, emit){
    const prompt = args?.prompt || ctx.context.prompt || '';
    const r = await askLLM({ prompt });
    emit({ level: "info", msg: `LLM tokens: ${r.usage?.total_tokens || 0}` });
    return { answer: r.text, usage: r.usage };
  },
  async policy_check(ctx, args, emit){
    const { max_price_pct = 20 } = args || {};
    const anchor = ctx.steps.fetch_features?.features?.anchor_price || ctx.last?.features?.anchor_price;
    const price = ctx.steps.price?.price || ctx.last?.price;
    if (!anchor || !price) return { ok: true, reason: 'no-anchor-or-price' };
    const cap = anchor * (1 + max_price_pct/100);
    const ok = price <= cap;
    emit({ level: ok?"info":"warn", msg: ok?"Policy OK":"Capped by policy" });
    return { ok, cap };
  }
};
