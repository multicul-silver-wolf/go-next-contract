package main

import (
	"log"
	"net/http"
	"os"

	"go-next-contract/apps/go-api/gen/api/v1/apiv1connect"
	"go-next-contract/apps/go-api/internal/service"
)

func main() {
	mux := http.NewServeMux()
	path, handler := apiv1connect.NewGreeterServiceHandler(&service.GreeterService{})
	mux.Handle(path, handler)
	todoPath, todoHandler := apiv1connect.NewTodoServiceHandler(service.NewTodoService())
	mux.Handle(todoPath, todoHandler)
	mux.Handle("/healthz", http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))

	addr := os.Getenv("GO_API_ADDR")
	if addr == "" {
		addr = ":8080"
	}

	log.Printf("go-api listening on %s", addr)
	if err := http.ListenAndServe(addr, withCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type,Connect-Protocol-Version,Connect-Timeout-Ms")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
