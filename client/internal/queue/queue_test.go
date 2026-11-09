package queue

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
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
		if r.Method == http.MethodGet && r.URL.Path == "/openapi.json" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"paths":{"/api/v1/signals/capture":{}}}`))
			return
		}
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
		if r.Method == http.MethodGet && r.URL.Path == "/openapi.json" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"paths":{"/api/v1/signals/capture":{}}}`))
			return
		}
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
		if r.Method == http.MethodGet && r.URL.Path == "/openapi.json" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"paths":{"/api/v1/signals/capture":{}}}`))
			return
		}
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

func TestRetryFailedPreservesSubmissionIdentity(t *testing.T) {
	dir := t.TempDir()
	seed := New(nil, nil, Options{StateDir: dir})
	job := &Job{
		ID: 1, Kind: KindURL, URL: "https://mp.weixin.qq.com/s/retry",
		SubmissionID: "stable-submission", Status: StatusFailed, RetrySafe: true,
		Attempts: 3, Err: "temporary error", QueuedAt: time.Now(), FinishedAt: time.Now(),
	}
	seed.mu.Lock()
	seed.jobs = []*Job{job}
	seed.nextID = 1
	if err := seed.persistLocked(); err != nil {
		seed.mu.Unlock()
		t.Fatal(err)
	}
	seed.mu.Unlock()

	q := New(nil, nil, Options{StateDir: dir})
	if err := q.Restore(); err != nil {
		t.Fatal(err)
	}
	if err := q.RetryFailed(1); err != nil {
		t.Fatalf("RetryFailed: %v", err)
	}
	got := q.Snapshot()[0]
	if got.Status != StatusQueued || got.RetrySafe || got.Err != "" {
		t.Fatalf("retry state = %+v", got)
	}
	if got.SubmissionID != "stable-submission" || got.Attempts != 3 {
		t.Fatalf("retry changed identity/history: %+v", got)
	}
	if err := q.RetryFailed(1); err == nil {
		t.Fatal("second retry should be refused after the state changed to queued")
	}
	q.Close()
}

func TestRetryFailedRefusesUnsafeFailure(t *testing.T) {
	dir := t.TempDir()
	seed := New(nil, nil, Options{StateDir: dir})
	seed.mu.Lock()
	seed.jobs = []*Job{{
		ID: 1, Kind: KindManualFallback, URL: "https://mp.weixin.qq.com/s/a",
		Status: StatusFailed, RetrySafe: false, QueuedAt: time.Now(), FinishedAt: time.Now(),
	}}
	seed.nextID = 1
	if err := seed.persistLocked(); err != nil {
		seed.mu.Unlock()
		t.Fatal(err)
	}
	seed.mu.Unlock()

	q := New(nil, nil, Options{StateDir: dir})
	if err := q.Restore(); err != nil {
		t.Fatal(err)
	}
	if err := q.RetryFailed(1); err == nil {
		t.Fatal("unsafe manual fallback must not be retried")
	}
	q.Close()
}

func TestRetryFailedCaptureUsesBackendRetryAction(t *testing.T) {
	var retryCalls atomic.Int32
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/api/v1/capture/jobs/job-1/retry" {
			t.Errorf("request = %s %s", r.Method, r.URL.Path)
		}
		retryCalls.Add(1)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"job-1","submission_id":"stable-submission","status":"succeeded","signal_id":"sig-retried","result":{"signal":{"id":"sig-retried","title":"微信标题","evidence_status_code":"retained"}}}`))
	}))
	defer api.Close()

	dir := t.TempDir()
	seed := New(nil, nil, Options{StateDir: dir})
	seed.mu.Lock()
	seed.jobs = []*Job{{
		ID: 1, Kind: KindURL, URL: "https://mp.weixin.qq.com/s/retry",
		SubmissionID: "stable-submission", CaptureJobID: "job-1", RetryCapture: true,
		Status: StatusFailed, RetrySafe: true, QueuedAt: time.Now(), FinishedAt: time.Now(),
	}}
	seed.nextID = 1
	if err := seed.persistLocked(); err != nil {
		seed.mu.Unlock()
		t.Fatal(err)
	}
	seed.mu.Unlock()

	q := New(nil, platform.New(api.URL, 8), Options{Workers: 1, StateDir: dir})
	if err := q.Restore(); err != nil {
		t.Fatal(err)
	}
	if err := q.RetryFailed(1); err != nil {
		t.Fatal(err)
	}
	q.Start()
	q.Wait()
	q.Close()

	job := q.Snapshot()[0]
	if retryCalls.Load() != 1 {
		t.Fatalf("backend retry calls = %d", retryCalls.Load())
	}
	if job.Status != StatusDone || job.SignalID != "sig-retried" {
		t.Fatalf("retried job = %+v", job)
	}
}

func TestCancelQueuedOnlyCancelsBeforeWorkerClaim(t *testing.T) {
	started := make(chan struct{}, 1)
	release := make(chan struct{})
	var requests atomic.Int32
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestNumber := requests.Add(1)
		if r.URL.Path != "/api/v1/documents/raw" {
			t.Errorf("path = %q", r.URL.Path)
		}
		if requestNumber == 1 {
			started <- struct{}{}
			<-release
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"doc-one","sha256":"x","mime":"text/plain","size":4}`))
	}))
	defer api.Close()

	dir := t.TempDir()
	paths := []string{filepath.Join(dir, "one.txt"), filepath.Join(dir, "two.txt")}
	for _, path := range paths {
		if err := os.WriteFile(path, []byte("body"), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	q := New(nil, platform.New(api.URL, 8), Options{Workers: 1, Timeout: 10 * time.Second})
	q.Start()
	first := q.SubmitFile(paths[0])
	select {
	case <-started:
	case <-time.After(3 * time.Second):
		t.Fatal("first upload did not enter worker")
	}
	second := q.SubmitFile(paths[1])
	if q.CancelQueued(first) {
		t.Fatal("running job must not be cancelled as if the server had stopped")
	}
	if !q.CancelQueued(second) {
		t.Fatal("queued job was not cancelled")
	}
	close(release)
	q.Wait()
	q.Close()

	jobs := q.Snapshot()
	if len(jobs) != 2 || jobs[0].Status != StatusDone || jobs[1].Status != StatusCanceled {
		t.Fatalf("jobs = %+v", jobs)
	}
	if requests.Load() != 1 {
		t.Fatalf("cancelled queued item reached API; requests = %d", requests.Load())
	}
}

func TestCancelQueuedRefusesRecoveredInFlightJob(t *testing.T) {
	dir := t.TempDir()
	seed := New(nil, nil, Options{StateDir: dir})
	seed.mu.Lock()
	seed.jobs = []*Job{{
		ID: 1, Kind: KindURL, URL: "https://mp.weixin.qq.com/s/possibly-submitted",
		SubmissionID: "stable-submission", Status: StatusRunning, Attempts: 1,
		QueuedAt: time.Now(), StartedAt: time.Now(),
	}}
	seed.nextID = 1
	if err := seed.persistLocked(); err != nil {
		seed.mu.Unlock()
		t.Fatal(err)
	}
	seed.mu.Unlock()

	q := New(nil, nil, Options{StateDir: dir})
	if err := q.Restore(); err != nil {
		t.Fatal(err)
	}
	if job := q.Snapshot()[0]; job.Status != StatusQueued {
		t.Fatalf("restored status = %s", job.Status)
	}
	if q.CancelQueued(1) {
		t.Fatal("restored in-flight job may already have been accepted by the server")
	}
	q.Close()
}

func TestCancelQueuedRefusesRecoveredInFlightJob(t *testing.T) {
	dir := t.TempDir()
	seed := New(nil, nil, Options{StateDir: dir})
	seed.mu.Lock()
	seed.jobs = []*Job{{
		ID: 1, Kind: KindURL, URL: "https://mp.weixin.qq.com/s/possibly-submitted",
		SubmissionID: "stable-submission", Status: StatusRunning, Attempts: 1,
		QueuedAt: time.Now(), StartedAt: time.Now(),
	}}
	seed.nextID = 1
	if err := seed.persistLocked(); err != nil {
		seed.mu.Unlock()
		t.Fatal(err)
	}
	seed.mu.Unlock()

	q := New(nil, nil, Options{StateDir: dir})
	if err := q.Restore(); err != nil {
		t.Fatal(err)
	}
	if job := q.Snapshot()[0]; job.Status != StatusQueued {
		t.Fatalf("restored status = %s", job.Status)
	}
	if q.CancelQueued(1) {
		t.Fatal("restored in-flight job may already have been accepted by the server")
	}
	q.Close()
}

func TestManualFallbackPayloadRestoresAndStaysPendingReview(t *testing.T) {
	dir := t.TempDir()
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/api/v1/signals" {
			t.Errorf("request = %s %s", r.Method, r.URL.Path)
		}
		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Errorf("decode body: %v", err)
		}
		if body["url"] != "https://mp.weixin.qq.com/s/manual" || body["body_text"] != "pasted article" {
			t.Errorf("fallback payload = %#v", body)
		}
		if body["evidence_status_code"] != "pending_review" {
			t.Errorf("status = %#v", body["evidence_status_code"])
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"sig-manual","title":"Manual title","url":"https://mp.weixin.qq.com/s/manual","channel_code":"wechat_mp","evidence_status_code":"pending_review"}`))
	}))
	defer api.Close()

	first := New(nil, platform.New(api.URL, 8), Options{StateDir: dir})
	if err := first.Restore(); err != nil {
		t.Fatal(err)
	}
	id := first.SubmitManualFallback("https://mp.weixin.qq.com/s/manual", "Manual title", "pasted article")
	stateBytes, err := os.ReadFile(filepath.Join(dir, "queue-state.json"))
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(stateBytes), "pasted article") {
		t.Fatal("manual body should be stored in the private payload file, not queue metadata")
	}

	recovered := New(nil, platform.New(api.URL, 8), Options{Workers: 1, StateDir: dir})
	if err := recovered.Restore(); err != nil {
		t.Fatal(err)
	}
	recovered.Start()
	recovered.Wait()
	recovered.Close()

	job := findSnapshot(recovered.Snapshot(), id)
	if job.Status != StatusDone || job.Kind != KindManualFallback || job.SignalID != "sig-manual" || job.EvidenceState != "pending_review" {
		t.Fatalf("manual fallback job = %+v", job)
	}
	if job.RetrySafe {
		t.Fatal("manual fallback with a non-idempotent POST must not be marked retry-safe")
	}
	if _, err := os.Stat(filepath.Join(dir, "payloads", "job-1.bin")); !os.IsNotExist(err) {
		t.Fatalf("completed private payload should be removed, stat err = %v", err)
	}
}

func findSnapshot(jobs []Job, id int) Job {
	for _, job := range jobs {
		if job.ID == id {
			return job
		}
	}
	return Job{ID: id}
}

func TestSafeDiagnosticRedactsURLsAndCredentials(t *testing.T) {
	got := safeDiagnostic("request https://user:pass@example.test/a?token=secret failed Authorization: Bearer abc123")
	for _, secret := range []string{"user:pass", "token=secret", "abc123"} {
		if strings.Contains(got, secret) {
			t.Fatalf("diagnostic leaked %q: %s", secret, got)
		}
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
