"use client"

import { createClient } from "@connectrpc/connect"
import { createConnectTransport } from "@connectrpc/connect-web"
import { TodoService } from "@workspace/proto"

const baseUrl = process.env.NEXT_PUBLIC_GO_API_BASE_URL ?? "http://localhost:8080"

const transport = createConnectTransport({
  baseUrl,
})

export const todoClient = createClient(TodoService, transport)
