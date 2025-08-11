import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

const BASE = import.meta.env.VITE_API_BASE || '';

export function createClient() {
  return createTRPCProxyClient({
    links: [
      httpBatchLink({ url: `${BASE}/api/trpc` })
    ]
  });
}