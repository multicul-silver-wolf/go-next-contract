import { Button } from "@workspace/ui/components/button"
import { greeterClient } from "@/lib/rpc"

export const dynamic = "force-dynamic"

export default async function Page() {
  let message = ""
  let servedAt = ""
  let error = ""

  try {
    const res = await greeterClient.greet({ name: "Sawana" })
    message = res.message
    servedAt = res.servedAt
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error"
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Go + Next.js Contract Playground</h1>
        <p className="text-muted-foreground">
          This page calls a Go Connect-RPC service with generated TypeScript types.
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <p className="font-mono text-sm">Message: {message || "(pending)"}</p>
        <p className="text-muted-foreground mt-2 text-xs">Served at: {servedAt || "-"}</p>
        {error ? (
          <p className="mt-2 text-xs text-red-600">RPC error: {error}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <Button asChild>
          <a href="https://connectrpc.com/docs/introduction" target="_blank" rel="noreferrer">
            Connect Docs
          </a>
        </Button>
      </div>
    </div>
  )
}
