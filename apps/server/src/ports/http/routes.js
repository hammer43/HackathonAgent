import express from "express";
import { featuresFacade } from "../../oracle/facade.js";
import { choosePrice } from "../../pricing/orchestrator.js";
import { createInvoice } from "@smart/core-domain/invoicing";
import { recordRun, recordExposure } from "../db/index.js";
import { evaluator } from "../../reflection/evaluator.js";
import { executePlan } from "../../tools/executor.js";
import { reportKpis, reportConvByPrice, reportAlgoMix } from "../../tools/reportUtils.js";
import { askLLM, llmHealthCheck } from "../../llm/client.js";
import { PricingChooseRequestSchema, InvoiceCreateRequestSchema, PlanSchema } from "@smart/shared/schemas";
import { appRouter } from "./trpc.js";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import swaggerUi from 'swagger-ui-express';

const components = {
  schemas: {
    PricingChooseRequest: { type: 'object', properties: { sku: { type: 'string' }, date: { type: 'string' }, epsilon: { type: 'number' }, strategy: { type: 'string', enum: ['epsilon','thompson'] } }, required: ['sku','date'] },
    InvoiceCreateRequest: { type: 'object', properties: { po: { type: 'string' }, lines: { type: 'array', items: { type: 'object', properties: { sku: { type: 'string' }, qty: { type: 'integer' }, unit_price: { type: 'number' } }, required: ['sku','qty','unit_price'] } } } },
    Plan: { type: 'object', properties: { context: { type: 'object', additionalProperties: true }, workflow: { type: 'array', items: { type: 'object', properties: { step: { type: 'string' }, id: { type: 'string' }, args: { type: 'object' }, out: { type: 'object' }, retries: { type: 'integer' } }, required: ['step'] } } }, required: ['workflow'] }
  }
};

const openapi = {
  openapi: '3.0.0',
  info: { title: 'Smart APIs', version: '1.0.0' },
  components,
  paths: {
    '/api/health': { get: { summary: 'Health check' } },
    '/api/pricing/choose': {
      post: {
        summary: 'Choose price',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PricingChooseRequest' }, example: { sku: 'ROSE-12', date: '2024-08-10', strategy: 'thompson' } } } },
        responses: { '200': { description: 'Decision', content: { 'application/json': { example: { sku: 'ROSE-12', date: '2024-08-10', strategy: 'thompson', price: 49.5, raw: 49.5, clamps: [], selection: { model: 'Elasticity', price: 49.5, p_buy: 0.42, rev: 20.8 }, candidates: [{ model: 'Elasticity', price: 49.5, p_buy: 0.42, rev: 20.8 }, { model: 'Anchor', price: 49 }], features: { anchor_price: 49, inv_pressure: 1.0, comp_idx: 0.97, event_score: 1.12, lead_time: 6 }, notes: 'Thompson Sampling picked Elasticity' } } } } }
      }
    },
    '/api/invoice/create': {
      post: {
        summary: 'Create invoice',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/InvoiceCreateRequest' }, example: { po: 'PO-123', lines: [{ sku: 'ROSE-12', qty: 2, unit_price: 49.5 }] } } } },
        responses: { '200': { description: 'Invoice JSON' } }
      }
    },
    '/api/report/kpis': { get: { summary: 'KPIs' } },
    '/api/report/conversion-by-price': { get: { summary: 'Conversion by price' } },
    '/api/report/algorithm-mix': { get: { summary: 'Algorithm mix' } },
    '/api/execute-plan': {
      post: {
        summary: 'Execute plan (legacy)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { plan: { $ref: '#/components/schemas/Plan' } }, required: ['plan'] } } } },
        responses: { '200': { description: 'Plan run result' } }
      }
    }
  }
};

export const apiRouter = express.Router();

apiRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

// admin
import { adminRouter } from './adminRoutes.js';
apiRouter.use('/admin', adminRouter);

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