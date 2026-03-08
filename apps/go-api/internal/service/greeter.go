package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"connectrpc.com/connect"
	apiv1 "go-next-contract/apps/go-api/gen/api/v1"
	"go-next-contract/apps/go-api/gen/api/v1/apiv1connect"
)

type GreeterService struct{}

var _ apiv1connect.GreeterServiceHandler = (*GreeterService)(nil)

func (g *GreeterService) Greet(
	ctx context.Context,
	req *connect.Request[apiv1.GreetRequest],
) (*connect.Response[apiv1.GreetResponse], error) {
	_ = ctx

	name := strings.TrimSpace(req.Msg.GetName())
	if name == "" {
		name = "Sawana"
	}

	res := connect.NewResponse(&apiv1.GreetResponse{
		Message:  fmt.Sprintf("Hi %s, Go RPC is wired to Next.js.", name),
		ServedAt: time.Now().Format(time.RFC3339),
	})

	return res, nil
}
