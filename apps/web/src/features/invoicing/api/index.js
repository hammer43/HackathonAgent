import { createClient } from '../../../lib/trpc.js';
const trpc = createClient();

export const invoice = (body) => trpc.invoicing.issue.mutate(body);