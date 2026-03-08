"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { todoClient } from "@/lib/rpc-browser"

type TodoItem = {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

const SESSION_ID_KEY = "todo-session-id"
const TODO_CACHE_KEY = "todo-cache"

function getSessionId(): string {
  const existing = window.sessionStorage.getItem(SESSION_ID_KEY)
  if (existing) {
    return existing
  }

  const next = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `session-${Date.now()}`
  window.sessionStorage.setItem(SESSION_ID_KEY, next)
  return next
}

function readCachedTodos(): TodoItem[] {
  try {
    const raw = window.sessionStorage.getItem(TODO_CACHE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter((item): item is TodoItem => {
        return (
          typeof item === "object" &&
          item !== null &&
          typeof (item as TodoItem).id === "string" &&
          typeof (item as TodoItem).title === "string" &&
          typeof (item as TodoItem).completed === "boolean" &&
          typeof (item as TodoItem).createdAt === "string"
        )
      })
      .map((item) => ({
        id: item.id,
        title: item.title,
        completed: item.completed,
        createdAt: item.createdAt,
      }))
  } catch {
    return []
  }
}

function saveCachedTodos(todos: TodoItem[]) {
  window.sessionStorage.setItem(TODO_CACHE_KEY, JSON.stringify(todos))
}

function sortTodos(todos: TodoItem[]): TodoItem[] {
  return [...todos].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function TodoApp() {
  const [sessionId, setSessionId] = useState("")
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [title, setTitle] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)

  useEffect(() => {
    const sid = getSessionId()
    const cached = sortTodos(readCachedTodos())

    setSessionId(sid)
    setTodos(cached)

    todoClient
      .syncTodos({
        sessionId: sid,
        todos: cached,
      })
      .then((res) => {
        const next = sortTodos(
          res.todos.map((todo) => ({
            id: todo.id,
            title: todo.title,
            completed: todo.completed,
            createdAt: todo.createdAt,
          })),
        )
        setTodos(next)
        saveCachedTodos(next)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to sync todos"
        setError(message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const stats = useMemo(() => {
    const done = todos.filter((todo) => todo.completed).length
    return {
      total: todos.length,
      done,
      active: todos.length - done,
    }
  }, [todos])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sessionId || isMutating) {
      return
    }

    const nextTitle = title.trim()
    if (!nextTitle) {
      setError("Please enter a todo title")
      return
    }

    setIsMutating(true)
    setError("")
    try {
      const res = await todoClient.createTodo({
        sessionId,
        title: nextTitle,
      })
      const next = sortTodos(
        res.todos.map((todo) => ({
          id: todo.id,
          title: todo.title,
          completed: todo.completed,
          createdAt: todo.createdAt,
        })),
      )
      setTodos(next)
      saveCachedTodos(next)
      setTitle("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create todo")
    } finally {
      setIsMutating(false)
    }
  }

  async function handleToggle(id: string) {
    if (!sessionId || isMutating) {
      return
    }

    setIsMutating(true)
    setError("")
    try {
      const res = await todoClient.toggleTodo({ sessionId, id })
      const next = sortTodos(
        res.todos.map((todo) => ({
          id: todo.id,
          title: todo.title,
          completed: todo.completed,
          createdAt: todo.createdAt,
        })),
      )
      setTodos(next)
      saveCachedTodos(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle todo")
    } finally {
      setIsMutating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!sessionId || isMutating) {
      return
    }

    setIsMutating(true)
    setError("")
    try {
      const res = await todoClient.deleteTodo({ sessionId, id })
      const next = sortTodos(
        res.todos.map((todo) => ({
          id: todo.id,
          title: todo.title,
          completed: todo.completed,
          createdAt: todo.createdAt,
        })),
      )
      setTodos(next)
      saveCachedTodos(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete todo")
    } finally {
      setIsMutating(false)
    }
  }

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Todo V1 (sessionStorage)</h2>
        <p className="text-muted-foreground text-sm">
          Session: <span className="font-mono text-xs">{sessionId || "-"}</span>
        </p>
      </div>

      <form className="flex gap-2" onSubmit={handleCreate}>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Add a todo..."
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={isLoading || isMutating}
        />
        <Button type="submit" disabled={isLoading || isMutating}>
          Add
        </Button>
      </form>

      <div className="text-muted-foreground text-xs">
        {stats.total} total / {stats.active} active / {stats.done} done
      </div>

      {error ? <p className="text-xs text-red-600">Todo error: {error}</p> : null}

      <div className="space-y-2">
        {isLoading ? <p className="text-sm">Loading todos...</p> : null}
        {!isLoading && todos.length === 0 ? <p className="text-muted-foreground text-sm">No todos yet.</p> : null}
        {todos.map((todo) => (
          <div key={todo.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo.id)}
                disabled={isMutating}
              />
              <span className={todo.completed ? "text-muted-foreground line-through" : ""}>{todo.title}</span>
            </label>
            <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(todo.id)} disabled={isMutating}>
              Delete
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
