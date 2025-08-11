import express from 'express';
import { getRecentRuns, getRecentExposures, getRecentOutcomes } from '../db/queryRepo.js';

export const adminRouter = express.Router();

const flags = { pricing_thompson_enabled: true };

adminRouter.get('/flags', (_req, res) => {
  res.json(flags);
});

adminRouter.post('/flags/:key', (req, res) => {
  const { key } = req.params;
  const { value } = req.body || {};
  flags[key] = !!value;
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