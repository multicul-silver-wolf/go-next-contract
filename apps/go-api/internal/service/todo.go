package service

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"connectrpc.com/connect"
	apiv1 "go-next-contract/apps/go-api/gen/api/v1"
	"go-next-contract/apps/go-api/gen/api/v1/apiv1connect"
)

type TodoService struct {
	mu        sync.RWMutex
	bySession map[string][]*apiv1.Todo
}

var _ apiv1connect.TodoServiceHandler = (*TodoService)(nil)

func NewTodoService() *TodoService {
	return &TodoService{
		bySession: make(map[string][]*apiv1.Todo),
	}
}

func (s *TodoService) SyncTodos(
	ctx context.Context,
	req *connect.Request[apiv1.SyncTodosRequest],
) (*connect.Response[apiv1.TodoListResponse], error) {
	_ = ctx

	sessionID := normalizeSessionID(req.Msg.GetSessionId())
	input := req.Msg.GetTodos()

	s.mu.Lock()
	s.bySession[sessionID] = cloneTodos(input)
	out := cloneTodos(s.bySession[sessionID])
	s.mu.Unlock()

	return connect.NewResponse(&apiv1.TodoListResponse{Todos: out}), nil
}

func (s *TodoService) CreateTodo(
	ctx context.Context,
	req *connect.Request[apiv1.CreateTodoRequest],
) (*connect.Response[apiv1.TodoListResponse], error) {
	_ = ctx

	sessionID := normalizeSessionID(req.Msg.GetSessionId())
	title := strings.TrimSpace(req.Msg.GetTitle())
	if title == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("title is required"))
	}

	now := time.Now().Format(time.RFC3339)
	todo := &apiv1.Todo{
		Id:        fmt.Sprintf("%d", time.Now().UnixNano()),
		Title:     title,
		Completed: false,
		CreatedAt: now,
	}

	s.mu.Lock()
	s.bySession[sessionID] = append(s.bySession[sessionID], todo)
	out := cloneTodos(s.bySession[sessionID])
	s.mu.Unlock()

	return connect.NewResponse(&apiv1.TodoListResponse{Todos: out}), nil
}

func (s *TodoService) ToggleTodo(
	ctx context.Context,
	req *connect.Request[apiv1.ToggleTodoRequest],
) (*connect.Response[apiv1.TodoListResponse], error) {
	_ = ctx

	sessionID := normalizeSessionID(req.Msg.GetSessionId())
	id := strings.TrimSpace(req.Msg.GetId())
	if id == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("id is required"))
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	items := s.bySession[sessionID]
	found := false
	for _, todo := range items {
		if todo.GetId() == id {
			todo.Completed = !todo.GetCompleted()
			found = true
			break
		}
	}
	if !found {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("todo not found"))
	}

	return connect.NewResponse(&apiv1.TodoListResponse{Todos: cloneTodos(items)}), nil
}

func (s *TodoService) DeleteTodo(
	ctx context.Context,
	req *connect.Request[apiv1.DeleteTodoRequest],
) (*connect.Response[apiv1.TodoListResponse], error) {
	_ = ctx

	sessionID := normalizeSessionID(req.Msg.GetSessionId())
	id := strings.TrimSpace(req.Msg.GetId())
	if id == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("id is required"))
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	items := s.bySession[sessionID]
	next := make([]*apiv1.Todo, 0, len(items))
	found := false
	for _, todo := range items {
		if todo.GetId() == id {
			found = true
			continue
		}
		next = append(next, todo)
	}
	if !found {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("todo not found"))
	}

	s.bySession[sessionID] = next
	return connect.NewResponse(&apiv1.TodoListResponse{Todos: cloneTodos(next)}), nil
}

func normalizeSessionID(in string) string {
	id := strings.TrimSpace(in)
	if id == "" {
		return "default"
	}
	return id
}

func cloneTodos(src []*apiv1.Todo) []*apiv1.Todo {
	if len(src) == 0 {
		return []*apiv1.Todo{}
	}
	dst := make([]*apiv1.Todo, 0, len(src))
	for _, t := range src {
		if t == nil {
			continue
		}
		dst = append(dst, &apiv1.Todo{
			Id:        t.GetId(),
			Title:     t.GetTitle(),
			Completed: t.GetCompleted(),
			CreatedAt: t.GetCreatedAt(),
		})
	}
	return dst
}
