import express from "express";
import { featuresFacade } from "../../oracle/facade.js";
import { choosePrice } from "../../pricing/orchestrator.js";
import { createInvoice } from "@smart/core-domain/invoicing";
import { recordRun, recordExposure } from "../../memory/runsRepo.js";
import { evaluator } from "../../reflection/evaluator.js";
import { executePlan } from "../../tools/executor.js";
import { reportKpis, reportConvByPrice, reportAlgoMix } from "../../tools/reportUtils.js";
import { askLLM, llmHealthCheck } from "../../llm/client.js";
import { PricingChooseRequestSchema, InvoiceCreateRequestSchema } from "@smart/shared/schemas";
import { appRouter } from "./trpc.js";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import swaggerUi from 'swagger-ui-express';

const openapi = {
  openapi: '3.0.0',
  info: { title: 'Smart APIs', version: '1.0.0' },
  paths: {
    '/api/health': { get: { summary: 'Health check' } },
    '/api/pricing/choose': { post: { summary: 'Choose price' } },
    '/api/invoice/create': { post: { summary: 'Create invoice' } },
    '/api/report/kpis': { get: { summary: 'KPIs' } },
    '/api/report/conversion-by-price': { get: { summary: 'Conversion by price' } },
    '/api/report/algorithm-mix': { get: { summary: 'Algorithm mix' } },
    '/api/execute-plan': { post: { summary: 'Execute plan (legacy)' } },
  }
};

export const apiRouter = express.Router();

// docs
apiRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

// mount tRPC as sub-app
const trpcHandler = createHTTPHandler({ router: appRouter });
apiRouter.use("/trpc", (req, res) => trpcHandler(req, res));

apiRouter.get("/health", async (_req, res) => {
  const llm = await llmHealthCheck();
  res.json({ ok: true, llm });
});

apiRouter.post("/ask", async (req, res) => {
  try {
    const { prompt } = req.body || {};
    const { text, usage } = await askLLM({ prompt });
    res.json({ answer: text, usage });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "LLM request failed" });
  }
});

apiRouter.get("/features", async (req, res, next) => {
  try {
    res.json(await featuresFacade({ sku: req.query.sku, date: req.query.date }));
  } catch (e) {
    next(e);
  }
});

apiRouter.post("/pricing/choose", async (req, res, next) => {
  try {
    const { sku, date, epsilon = 0.05, strategy = "epsilon" } = PricingChooseRequestSchema.parse(req.body || {});
    const out = await choosePrice({ sku, date, epsilon, strategy });
    recordRun({ type: "pricing", sku, date, out });
    recordExposure({
      sku,
      model: out.selection?.model,
      strategy,
      price: out.price,
      p_buy: out.selection?.p_buy,
      rev_pred: out.selection?.rev,
      clamps: out.clamps || []
    });
    res.json(out);
  } catch (e) {
    next(e);
  }
});

apiRouter.post("/invoice/create", (req, res, next) => {
  try {
    const input = InvoiceCreateRequestSchema.parse(req.body || {});
    const inv = createInvoice(input);
    recordRun({ type: "invoice", inv });
    res.json(inv);
  } catch (e) {
    next(e);
  }
});

apiRouter.post("/bandit/feedback", (req, res) => {
  res.json(evaluator(req.body));
});

apiRouter.get("/report/kpis", async (req, res) => {
  const days = Number(req.query.days || 7);
  res.json(await reportKpis(days));
});

apiRouter.get("/report/conversion-by-price", async (req, res) => {
  const sku = req.query.sku || "";
  const buckets = Number(req.query.buckets || 6);
  res.json(await reportConvByPrice(sku, buckets));
});

apiRouter.get("/report/algorithm-mix", async (req, res) => {
  const sku = req.query.sku || "";
  res.json(await reportAlgoMix(sku));
});

apiRouter.post("/execute-plan", async (req, res, next) => {
  try {
    res.json(await executePlan(req.body.plan));
  } catch (e) {
    next(e);
  }
});