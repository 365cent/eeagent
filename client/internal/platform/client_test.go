package platform

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCaptureMultipart(t *testing.T) {
	var gotField, gotChannel, gotFilename, gotBody string
	var gotType string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
