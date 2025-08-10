import 'dotenv/config';
import express from "express";
import cors from "cors";
import { featuresFacade } from "./oracle/facade.js";
import { choosePrice } from "./pricing/orchestrator.js";
import { createInvoice } from "./pricing/policy/clampChain.js";
import { recordRun, recordExposure } from "./memory/runsRepo.js";
import { evaluator } from "./reflection/evaluator.js";
import { executePlan } from "./tools/executor.js";
import { reportKpis, reportConvByPrice, reportAlgoMix } from "./tools/reportUtils.js";
import { askLLM, llmHealthCheck } from "./llm/client.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (_,res)=> {
  const llm = await llmHealthCheck();
  res.json({ ok:true, llm });
});

// 👉 NEW: LLM proxy
app.post("/api/ask", async (req, res) => {
  try {
    const { prompt } = req.body || {};
    const { text, usage } = await askLLM({ prompt });
    res.json({ answer: text, usage });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "LLM request failed" });
  }
});

app.get("/api/features", async (req,res,next)=>{
  try { res.json(await featuresFacade({ sku:req.query.sku, date:req.query.date })); }
  catch (e) { next(e); }
});

app.post("/api/pricing/choose", async (req,res,next)=>{
  try {
    const { sku, date, epsilon=0.05, strategy="epsilon" } = req.body||{};
    const out = await choosePrice({ sku, date, epsilon, strategy });
    recordRun({ type:"pricing", sku, date, out });
    recordExposure({
      sku, model: out.selection?.model, strategy,
      price: out.price, p_buy: out.selection?.p_buy, rev_pred: out.selection?.rev, clamps: out.clamps||[]
    });
    res.json(out);
  } catch(e){ next(e); }
});

app.post("/api/invoice/create", (req,res,next)=>{
  try {
    const inv = createInvoice(req.body);
    recordRun({ type:"invoice", inv });
    res.json(inv);
  } catch(e){ next(e); }
});

app.post("/api/bandit/feedback", (req,res)=>{ res.json(evaluator(req.body)); });

app.get("/api/report/kpis", async (req,res)=>{
  const days = Number(req.query.days||7);
  res.json(await reportKpis(days));
});
app.get("/api/report/conversion-by-price", async (req,res)=>{
  const sku = req.query.sku || "";
  const buckets = Number(req.query.buckets || 6);
  res.json(await reportConvByPrice(sku, buckets));
});
app.get("/api/report/algorithm-mix", async (req,res)=>{
  const sku = req.query.sku || "";
  res.json(await reportAlgoMix(sku));
});

app.post("/api/execute-plan", async (req,res,next)=>{
  try { res.json(await executePlan(req.body.plan)); }
  catch (e) { next(e); }
});

app.use((err,req,res,next)=>{
  console.error(err);
  res.status(400).json({ ok:false, error: String(err.message||err) });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, ()=> console.log(`Server http://localhost:${PORT}`));
