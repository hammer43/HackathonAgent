# Smart Invoicing & Pricing — Agentic + Oracle + Reporting (Monorepo)

- Hexagonal architecture with domain in `packages/core-domain`, data oracles in `packages/data-oracles`, agents in `packages/agents`, and shared schemas in `packages/shared`.
- Apps live in `apps/server` (Express + tRPC) and `apps/web` (Vite + React).

## Prereqs
- pnpm 9+ (root `package.json` declares `packageManager`)

## Install
```bash
pnpm install
```

## Develop
```bash
# Server
pnpm dev:server   # http://localhost:8787

# Web
pnpm dev:web      # http://localhost:5173
```

## Test
```bash
pnpm test
```

## Lint & Format
```bash
pnpm lint
pnpm format
```

## Notes
- LLM calls are stubbed if `OPENAI_API_KEY` is missing; add it in `apps/server/.env` to enable.
- tRPC endpoints available under `/api/trpc` alongside existing REST.
