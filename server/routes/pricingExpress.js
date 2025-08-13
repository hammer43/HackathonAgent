import express from "express";
import { oracleQuote } from "../pricing/oracleHandler.js";
import { baselineQuote } from "../pricing/baselineHandler.js";

export const router = express.Router();

router.post("/oracle/quote", async (req, res) => {
  try { res.json(await oracleQuote(req.body || {}, { ORB_URL: process.env.ORB_URL })); }
  catch (e) { res.status(502).json({ error: String(e?.message || e) }); }
});

router.post("/baseline/quote", async (req, res) => {
  try { res.json(await baselineQuote(req.body || {})); }
  catch (e) { res.status(500).json({ error: String(e?.message || e) }); }
});
