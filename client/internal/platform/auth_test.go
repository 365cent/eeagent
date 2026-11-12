package platform

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"eea/capture/internal/httpx"
)

func TestBearerAuthorizationHeader(t *testing.T) {
	var auth string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth = r.Header.Get("Authorization")
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"ok","title":"T"}`))
	}))
	defer srv.Close()

	client := NewWithOptions(srv.URL, 8, httpx.ClientOptions{}, "upload-token-abc")
	_, err := client.CreateManualFallback(context.Background(), ManualFallbackInput{
		URL: "https://example.com/a", Title: "t", Channel: "web", Body: "body",
	})
	if err != nil {
		t.Fatal(err)
	}
	if auth != "Bearer upload-token-abc" {
		t.Fatalf("Authorization = %q", auth)
	}
}
