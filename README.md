# go-next-contract

A practical monorepo starter for learning **Go + Next.js contract-first development** with Protobuf + Connect RPC.

## Stack

- `apps/web`: Next.js 16 app router
- `apps/go-api`: Go HTTP server with Connect RPC handlers
- `proto/`: `.proto` contracts + Buf config
- `packages/proto`: generated TypeScript protobuf descriptors
- `packages/ui`: shared shadcn/ui components

## Quick start

```bash
pnpm install
pnpm proto:generate
pnpm dev
```

`pnpm dev` runs both `web` and `go-api` via Turborepo.

## RPC flow

1. Define API in `proto/api/v1/*.proto`
2. Run `pnpm proto:generate`
3. Implement handler in `apps/go-api/internal/service`
4. Consume typed client in `apps/web`

## Demo flowchart

- Excalidraw source: `docs/excalidraw/demo-flowchart.excalidraw`
- Exported PNG: `docs/excalidraw/demo-flowchart.png`

![Go + Next contract demo flow](docs/excalidraw/demo-flowchart.png)

## Useful commands

```bash
# generate Go + TS files from proto
pnpm proto:generate

# quality gates
pnpm lint
pnpm typecheck
pnpm build
```

## Runtime env

- `GO_API_ADDR` (default `:8080`) controls Go API listen address
- `GO_API_BASE_URL` (default `http://localhost:8080`) controls Next.js RPC target
- `NEXT_PUBLIC_GO_API_BASE_URL` (default `http://localhost:8080`) controls browser-side Todo RPC target

## Deployment (Vercel + Go API)

This repo works best with split deployment:

- Deploy `apps/web` to Vercel
- Deploy `apps/go-api` to a long-running Go host (Railway, Fly.io, Render, etc.)

Why: `apps/go-api` is currently a standalone HTTP server (`:8080`). Vercel Go runtime is function-based (`/api/*.go`) and would require refactoring.

### 1. Deploy Go API first

- Deploy `apps/go-api` to your Go host
- Verify health check: `https://your-go-api-domain/healthz` returns `ok`

### 2. Deploy Web on Vercel

- Import this repo in Vercel
- Set **Root Directory** to `apps/web`
- Framework Preset should be Next.js (auto-detected)

### 3. Configure Vercel environment variables

Set these in Vercel Project Settings -> Environment Variables:

- `GO_API_BASE_URL=https://your-go-api-domain`
- `NEXT_PUBLIC_GO_API_BASE_URL=https://your-go-api-domain`

Re-deploy after changing variables (new values apply to new deployments).

### 4. Deploy with Vercel CLI (optional)

```bash
cd /Users/openclaw/.openclaw/workspace/projects/go-playground/go-next-contract
vercel link
vercel --prod
```

### 5. Post-deploy checks

- Open your Vercel URL
- Confirm greet RPC renders a message and `servedAt`
- Add/toggle/delete todos in Todo V1
- Refresh page and confirm todo state persists in the same browser session

### References

- Vercel monorepos: <https://vercel.com/docs/monorepos>
- Vercel Go runtime: <https://vercel.com/docs/functions/runtimes/go>
- Vercel env vars: <https://vercel.com/docs/environment-variables>

## Todo V1

- Todo APIs are contract-first in `proto/api/v1/greeter.proto` (`TodoService`).
- Data is scoped by a browser session id and cached in `sessionStorage`.
- UI supports create, toggle complete, and delete.
