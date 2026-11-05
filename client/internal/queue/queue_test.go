package queue

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"eea/capture/internal/capture"
	"eea/capture/internal/platform"
)

func TestQueueCaptureAndUpload(t *testing.T) {
	if testing.Short() {
		t.Skip("launches a real browser")
	}
	if _, err := capture.ResolveBrowser("edge", ""); err != nil {
		t.Skipf("edge not available: %v", err)
	}

	page := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>队列用例</title></head>
<body><h1>归档正文</h1><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="></body></html>`))
	}))
	defer page.Close()

	var gotURL, gotChannel, archive string
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseMultipartForm(32 << 20); err != nil {
			t.Errorf("parse multipart: %v", err)
		}
		gotURL = r.FormValue("url")
		gotChannel = r.FormValue("channel_code")
		if f, _, err := r.FormFile("archive_html"); err == nil {
			defer f.Close()
			var sb strings.Builder
			buf := make([]byte, 32<<10)
			for {
				n, err := f.Read(buf)
				sb.Write(buf[:n])
				if err != nil {
					break
				}
			}
			archive = sb.String()
		} else {
			t.Errorf("archive part: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"sig-queue","title":"队列用例"}`))
	}))
	defer api.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()
	browser, err := capture.Launch(ctx, capture.Options{Engine: "edge", UserDataDir: t.TempDir(), Headless: true})
	if err != nil {
		t.Fatalf("launch: %v", err)
	}
	defer browser.Close()

	q := New(browser, platform.New(api.URL, 8), Options{Workers: 2, Timeout: 60 * time.Second})
	q.Start()
	q.SubmitURL(page.URL+"/note.html", "web")
	q.Wait()
	q.Close()

	jobs := q.Snapshot()
	if len(jobs) != 1 {
		t.Fatalf("jobs = %d", len(jobs))
	}
	job := jobs[0]
	if job.Status != StatusDone {
		t.Fatalf("status = %s, err = %s", job.Status, job.Err)
	}
	if job.SignalID != "sig-queue" {
		t.Errorf("signal id = %q", job.SignalID)
	}
	if gotURL != page.URL+"/note.html" {
		t.Errorf("uploaded url = %q", gotURL)
	}
	if gotChannel != "web" {
		t.Errorf("channel = %q", gotChannel)
	}
	if !strings.Contains(archive, "归档正文") {
		t.Error("archive body missing")
	}
	if !strings.Contains(archive, "data:image/png;base64,") {
		t.Error("archive image not inlined")
	}
}

func TestQueueUploadDocument(t *testing.T) {
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/documents/raw" {
			t.Errorf("path = %s", r.URL.Path)
		}
		file, header, err := r.FormFile("file")
		if err != nil {
			t.Errorf("form file: %v", err)
		} else {
			defer file.Close()
			if !strings.HasSuffix(header.Filename, ".pdf") {
				t.Errorf("filename = %q", header.Filename)
			}
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"doc-1","sha256":"abc","mime":"application/pdf","size":4}`))
	}))
	defer api.Close()

	dir := t.TempDir()
	path := dir + "/spec.pdf"
	if err := os.WriteFile(path, []byte("%PDF-1.4 test"), 0o644); err != nil {
		t.Fatal(err)
	}

	q := New(nil, platform.New(api.URL, 8), Options{Workers: 1, Timeout: 10 * time.Second})
	q.Start()
	q.SubmitFile(path)
	q.Wait()
	q.Close()

	job := q.Snapshot()[0]
	if job.Status != StatusDone || job.SignalID != "doc-1" {
		t.Fatalf("job = %+v", job)
	}
}

func TestQueueRetriesTransient(t *testing.T) {
	attempts := 0
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts < 3 {
			w.WriteHeader(http.StatusBadGateway)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"sig-retry","sha256":"","mime":"","size":0}`))
	}))
	defer api.Close()

	dir := t.TempDir()
	path := dir + "/a.txt"
	if err := os.WriteFile(path, []byte("hello"), 0o644); err != nil {
		t.Fatal(err)
	}

	q := New(nil, platform.New(api.URL, 8), Options{Workers: 1, Retries: 2, Timeout: 10 * time.Second})
	q.Start()
	q.SubmitFile(path)
	q.Wait()
	q.Close()

	job := q.Snapshot()[0]
	if job.Status != StatusDone {
		t.Fatalf("status = %s err = %s", job.Status, job.Err)
	}
	if attempts != 3 {
		t.Errorf("attempts = %d", attempts)
	}
}

func TestQueueArchiveUpload(t *testing.T) {
	var gotURL, gotFilename, gotBody string
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseMultipartForm(8 << 20); err != nil {
			t.Errorf("parse: %v", err)
		}
		gotURL = r.FormValue("url")
		f, hdr, err := r.FormFile("archive_html")
		if err != nil {
			t.Errorf("archive part: %v", err)
		} else {
			defer f.Close()
			gotFilename = hdr.Filename
			buf := make([]byte, hdr.Size)
			f.Read(buf)
			gotBody = string(buf)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"sig-html","title":"离线页"}`))
	}))
	defer api.Close()

	dir := t.TempDir()
	path := filepath.Join(dir, "saved.html")
	saved := `<!DOCTYPE html><html><head><meta charset="utf-8">` +
		`<link rel="canonical" href="https://mp.weixin.qq.com/s/offline"><title>离线页</title></head>` +
		`<body><p>已保存的正文</p></body></html>`
	if err := os.WriteFile(path, []byte(saved), 0o644); err != nil {
		t.Fatal(err)
	}

	q := New(nil, platform.New(api.URL, 8), Options{Workers: 1, Timeout: 10 * time.Second})
	q.Start()
	q.SubmitArchive(path, "")
	q.Wait()
	q.Close()

	job := q.Snapshot()[0]
	if job.Status != StatusDone {
		t.Fatalf("status = %s, err = %s", job.Status, job.Err)
	}
	if job.SignalID != "sig-html" {
		t.Errorf("signal id = %q", job.SignalID)
	}
	if gotURL != "https://mp.weixin.qq.com/s/offline" {
		t.Errorf("url = %q", gotURL)
	}
	if gotFilename != "saved.html" {
		t.Errorf("filename = %q", gotFilename)
	}
	if !strings.Contains(gotBody, "已保存的正文") {
		t.Error("archive body not uploaded verbatim")
	}
}

func TestQueueArchiveExplicitURL(t *testing.T) {
	var gotURL string
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.ParseMultipartForm(4 << 20)
		gotURL = r.FormValue("url")
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"sig-2"}`))
	}))
	defer api.Close()

	dir := t.TempDir()
	path := filepath.Join(dir, "bare.html")
	os.WriteFile(path, []byte(`<html><body>no canonical</body></html>`), 0o644)

	q := New(nil, platform.New(api.URL, 8), Options{Workers: 1, Timeout: 5 * time.Second})
	q.Start()
	q.SubmitArchive(path, "https://example.com/explicit")
	q.Wait()
	q.Close()

	if job := q.Snapshot()[0]; job.Status != StatusDone {
		t.Fatalf("status = %s err = %s", job.Status, job.Err)
	}
	if gotURL != "https://example.com/explicit" {
		t.Errorf("url = %q", gotURL)
	}
}

func TestQueueArchiveNeedsSourceURL(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "bare.html")
	os.WriteFile(path, []byte(`<html><body>no url</body></html>`), 0o644)

	q := New(nil, platform.New("http://127.0.0.1:1", 8), Options{Workers: 1, Timeout: 5 * time.Second})
	q.Start()
	q.SubmitArchive(path, "")
	q.Wait()
	q.Close()

	job := q.Snapshot()[0]
	if job.Status != StatusFailed || !strings.Contains(job.Err, "no source url") {
		t.Fatalf("job = %+v", job)
	}
}
