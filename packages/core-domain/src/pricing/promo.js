import { clamp } from "./elasticity.js";

export const pricePromo = (base) => clamp(base * 0.95, base);