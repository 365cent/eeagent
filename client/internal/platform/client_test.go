package platform

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCaptureMultipart(t *testing.T) {
	var gotField, gotChannel, gotFilename, gotBody string
	var gotType string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet && r.URL.Path == "/openapi.json" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"paths":{"/api/v1/signals/capture":{}}}`))
			return
		}
		if r.URL.Path != "/api/v1/signals/capture" {
			t.Errorf("path = %s", r.URL.Path)
		}
		if err := r.ParseMultipartForm(4 << 20); err != nil {
			t.Errorf("parse: %v", err)
		}
		gotField = r.FormValue("url")
		gotChannel = r.FormValue("channel_code")
		file, header, err := r.FormFile("archive_html")
		if err != nil {
			t.Errorf("archive_html: %v", err)
		} else {
			defer file.Close()
			gotFilename = header.Filename
			gotType = header.Header.Get("Content-Type")
			buf := make([]byte, header.Size)
			file.Read(buf)
			gotBody = string(buf)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"sig-1","title":"T","channel_code":"wechat_mp"}`))
	}))
	defer srv.Close()

	client := New(srv.URL, 8)
	sig, err := client.Capture(context.Background(), CaptureInput{
		URL:     "https://mp.weixin.qq.com/s/abc",
		Channel: InferChannel("https://mp.weixin.qq.com/s/abc"),
		Archive: []byte("<html>archived</html>"),
	})
	if err != nil {
		t.Fatalf("capture: %v", err)
	}
	if sig.ID != "sig-1" {
		t.Errorf("id = %q", sig.ID)
	}
	if gotField != "https://mp.weixin.qq.com/s/abc" {
		t.Errorf("url field = %q", gotField)
	}
	if gotChannel != "wechat_mp" {
		t.Errorf("channel_code = %q", gotChannel)
	}
	if gotFilename != "archive.html" {
		t.Errorf("filename = %q", gotFilename)
	}
	if !strings.Contains(gotType, "text/html") {
		t.Errorf("part content type = %q", gotType)
	}
	if gotBody != "<html>archived</html>" {
		t.Errorf("body = %q", gotBody)
	}
}

func TestCreateManualFallbackKeepsReviewStateAndSource(t *testing.T) {
	var payload map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/api/v1/signals" {
			t.Errorf("request = %s %s", r.Method, r.URL.Path)
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			t.Errorf("decode body: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"sig-manual","title":"人工补录标题","url":"https://mp.weixin.qq.com/s/a","channel_code":"wechat_mp","evidence_status_code":"pending_review"}`))
	}))
	defer srv.Close()

	sig, err := New(srv.URL, 8).CreateManualFallback(context.Background(), ManualFallbackInput{
		URL: "https://mp.weixin.qq.com/s/a", Title: "人工补录标题", Body: "研究者粘贴的微信正文",
	})
	if err != nil {
		t.Fatalf("CreateManualFallback: %v", err)
	}
	if sig.ID != "sig-manual" || sig.EvidenceState != "pending_review" {
		t.Fatalf("signal = %+v", sig)
	}
	if payload["url"] != "https://mp.weixin.qq.com/s/a" || payload["body_text"] != "研究者粘贴的微信正文" {
		t.Fatalf("manual payload = %#v", payload)
	}
	if payload["evidence_status_code"] != "pending_review" {
		t.Fatalf("evidence_status_code = %#v", payload["evidence_status_code"])
	}
}

func TestCreateManualFallbackRequiresTitleURLAndBody(t *testing.T) {
	_, err := New("http://127.0.0.1:1", 8).CreateManualFallback(context.Background(), ManualFallbackInput{
		URL: "https://example.com/a", Title: "T",
	})
	if err == nil || !strings.Contains(err.Error(), "requires url, title, and body") {
		t.Fatalf("err = %v", err)
	}
}

func TestCaptureRejectsOversize(t *testing.T) {
	client := New("http://127.0.0.1:1", 1)
	_, err := client.Capture(context.Background(), CaptureInput{
		URL:     "https://example.com",
		Archive: make([]byte, 2<<20),
	})
	if err == nil || !strings.Contains(err.Error(), "max_upload_mb") {
		t.Fatalf("err = %v", err)
	}
}

func TestStatusErrorRetryable(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"detail":"boom"}`))
	}))
	defer srv.Close()

	_, err := New(srv.URL, 8).Capture(context.Background(), CaptureInput{
		URL:     "https://example.com",
		Archive: []byte("<html>x</html>"),
	})
	se, ok := err.(*StatusError)
	if !ok {
		t.Fatalf("err type = %T (%v)", err, err)
	}
	if !se.Retryable() {
		t.Error("500 should be retryable")
	}
}

func TestInferChannel(t *testing.T) {
	cases := map[string]string{
		"https://mp.weixin.qq.com/s/xyz":         "wechat_mp",
		"https://weixin.qq.com/s/1":              "wechat_mp",
		"https://example.com/a":                  "",
		"not a url":                              "",
		"https://mp.weixin.qq.com.evil.io/s/abc": "",
	}
	for in, want := range cases {
		if got := InferChannel(in); got != want {
			t.Errorf("InferChannel(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestSupportsCapture(t *testing.T) {
	withCapture := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"paths":{"/api/v1/signals/capture":{},"/api/v1/documents/raw":{},"/api/v1/signals/{signal_id}/archive":{}}}`))
	}))
	defer withCapture.Close()
	ok, err := New(withCapture.URL, 8).SupportsCapture(context.Background())
	if err != nil || !ok {
		t.Fatalf("ok=%v err=%v", ok, err)
	}

	missing := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"paths":{"/api/v1/signals":{}}}`))
	}))
	defer missing.Close()
	ok, err = New(missing.URL, 8).SupportsCapture(context.Background())
	if err != nil || ok {
		t.Fatalf("ok=%v err=%v", ok, err)
	}
}

func TestMimeForDocumentTypes(t *testing.T) {
	cases := map[string]string{
		"a.pdf":  "application/pdf",
		"a.docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"a.pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		"a.md":   "text/markdown; charset=utf-8",
	}
	for name, want := range cases {
		if got := mimeFor(name, nil); got != want {
			t.Errorf("mimeFor(%q) = %q, want %q", name, got, want)
		}
	}
}
