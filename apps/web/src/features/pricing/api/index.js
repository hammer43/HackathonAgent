import { createClient } from '../../../lib/trpc.js';
const trpc = createClient();

export const choose = (body) => trpc.pricing.quote.query(body);