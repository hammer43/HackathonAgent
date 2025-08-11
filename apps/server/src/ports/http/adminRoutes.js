import express from 'express';
import { getRecentRuns, getRecentExposures, getRecentOutcomes } from '../db/queryRepo.js';
import { getAllFlags, setFlag as setFlagDb } from '../db/flagsRepo.js';

export const adminRouter = express.Router();

let memFlags = { pricing_thompson_enabled: true };

adminRouter.get('/flags', async (_req, res) => {
  try {
    const flags = await getAllFlags();
    res.json({ ...memFlags, ...flags });
  } catch {
    res.json(memFlags);
  }
});

adminRouter.post('/flags/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body || {};
  memFlags[key] = !!value;
  try { await setFlagDb(key, String(!!value)); } catch {}
  res.json({ ok: true, key, value: !!value });
});

adminRouter.get('/runs', async (req, res) => {
  const limit = Number(req.query.limit || 50);
  res.json(await getRecentRuns(limit));
});

adminRouter.get('/exposures', async (req, res) => {
  const limit = Number(req.query.limit || 100);
  res.json(await getRecentExposures(limit));
});

adminRouter.get('/outcomes', async (req, res) => {
  const limit = Number(req.query.limit || 100);
  res.json(await getRecentOutcomes(limit));
});