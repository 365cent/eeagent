package capture

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestCaptureRejectsJSONErrorPayload(t *testing.T) {
	if testing.Short() {
		t.Skip("launches a real browser")
	}
	if _, err := ResolveBrowser("edge", ""); err != nil {
		t.Skipf("edge not available: %v", err)
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(`<!DOCTYPE html><html><head><meta charset="utf-8"><title></title></head><body><pre>{"error":{"message":"blocked","code":40362}}</pre><script>document.title = location.href;</script></body></html>`))
	}))
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	browser, err := Launch(ctx, Options{
		Engine: "edge", UserDataDir: t.TempDir(), Headless: true,
		ReadyWait: 800 * time.Millisecond,
	})
	if err != nil {
		t.Fatalf("launch: %v", err)
	}
	defer browser.Close()

	if _, err := browser.Capture(ctx, srv.URL+"/blocked"); err == nil {
		t.Fatal("a JSON error payload must not be archived as evidence")
	}
}
