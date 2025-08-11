import 'dotenv/config';
import express from "express";
import cors from "cors";
import { apiRouter } from "./ports/http/routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", apiRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ ok: false, error: String(err.message || err) });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Server http://localhost:${PORT}`));
