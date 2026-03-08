import { createClient } from "@connectrpc/connect"
import { createConnectTransport } from "@connectrpc/connect-node"
import { GreeterService } from "@workspace/proto"

const baseUrl = process.env.GO_API_BASE_URL ?? "http://localhost:8080"

const transport = createConnectTransport({
  baseUrl,
  httpVersion: "1.1",
})

export const greeterClient = createClient(GreeterService, transport)
