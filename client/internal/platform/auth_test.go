package platform

import (
	"context"
	"encoding/json"
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
	_, err := client.Capture(context.Background(), CaptureInput{URL: "https://example.com/a", Archive: []byte("<html>a</html>"), Filename: "archive.html", SubmissionID: "sub-1"})
	if err != nil {
		t.Fatal(err)
	}
	if auth != "Bearer upload-token-abc" {
		t.Fatalf("Authorization = %q", auth)
	}
}

func TestWhoAmIUsesVerifiedIdentity(t *testing.T) {
	var path, auth string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path = r.URL.Path
		auth = r.Header.Get("Authorization")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(Identity{Subject: "alice", Role: "researcher"})
	}))
	defer srv.Close()

	client := NewWithOptions(srv.URL, 8, httpx.ClientOptions{}, "upload-token-abc")
	identity, err := client.WhoAmI(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if path != "/api/v1/capture/whoami" {
		t.Fatalf("path = %q", path)
	}
	if auth != "Bearer upload-token-abc" {
		t.Fatalf("Authorization = %q", auth)
	}
	if identity.Subject != "alice" || identity.Role != "researcher" {
		t.Fatalf("identity = %+v", identity)
	}
}

func TestWhoAmIRejectsRevokedToken(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, `{"detail":"capture upload token 无效或已撤销"}`, http.StatusUnauthorized)
	}))
	defer srv.Close()

	client := NewWithOptions(srv.URL, 8, httpx.ClientOptions{}, "revoked")
	_, err := client.WhoAmI(context.Background())
	status, ok := err.(*StatusError)
	if !ok || status.Code != http.StatusUnauthorized {
		t.Fatalf("err = %v", err)
	}
}
