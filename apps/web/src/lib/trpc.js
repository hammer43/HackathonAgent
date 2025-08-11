import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

export function createClient() {
  return createTRPCProxyClient({
    links: [
      httpBatchLink({ url: '/api/trpc' })
    ]
  });
}