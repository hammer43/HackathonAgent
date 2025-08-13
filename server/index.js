import express from "express";
import { router as pricing } from "./routes/pricingExpress.js";

const app = express();
app.use(express.json());
app.use("/api", pricing);
app.listen(process.env.PORT || 8787);
