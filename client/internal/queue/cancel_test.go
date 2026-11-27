package queue

import (
	"context"
	"testing"
	"time"

	"eea/capture/internal/capture"
)

// slowEngine reports a phase and then blocks until its context is cancelled,
// imitating a page stuck behind a WeChat verification challenge.
type slowEngine struct {
	started chan struct{}
}

func (e *slowEngine) Capture(ctx context.Context, url string) (*capture.Archive, error) {
	return e.CaptureWithProgress(ctx, url, nil)
}

func (e *slowEngine) CaptureWithProgress(ctx context.Context, url string, progress func(string)) (*capture.Archive, error) {
	_ = url
	if progress != nil {
		progress("等待页面就绪…")
	}
	close(e.started)
	<-ctx.Done()
	return nil, ctx.Err()
}

func awaitJobStatus(t *testing.T, q *Queue, id int, want Status) Job {
	t.Helper()
	deadline := time.Now().Add(4 * time.Second)
	for time.Now().Before(deadline) {
		for _, job := range q.Snapshot() {
			if job.ID == id && job.Status == want {
				return job
			}
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatalf("job %d never reached %s: %+v", id, want, q.Snapshot())
	return Job{}
}

func TestRunningCaptureReportsItsPhase(t *testing.T) {
	engine := &slowEngine{started: make(chan struct{})}
	q := New(engine, nil, Options{Workers: 1, Timeout: 30 * time.Second})
	defer q.Close()
	q.Start()

	id := q.SubmitURL("https://mp.weixin.qq.com/s/example", "web")
	select {
	case <-engine.started:
	case <-time.After(3 * time.Second):
		t.Fatal("capture never started")
	}

	var detail string
	for _, job := range q.Snapshot() {
		if job.ID == id {
			detail = job.Detail
			if job.Progress != 22 {
				t.Fatalf("progress = %d, want 22 while capturing", job.Progress)
			}
			if job.StageStartedAt.IsZero() {
				t.Fatal("stage start time must be recorded for the elapsed display")
			}
		}
	}
	if detail != "等待页面就绪…" {
		t.Fatalf("detail = %q, want the engine phase", detail)
	}

	// Release the worker so Close does not wait for the capped timeout.
	if !q.CancelRunning(id) {
		t.Fatal("cancel after the phase assertion failed")
	}
	awaitJobStatus(t, q, id, StatusCanceled)
}

func TestCancelRunningStopsTheCapture(t *testing.T) {
	engine := &slowEngine{started: make(chan struct{})}
	q := New(engine, nil, Options{Workers: 1, Timeout: 30 * time.Second})
	defer q.Close()
	q.Start()

	id := q.SubmitURL("https://mp.weixin.qq.com/s/example", "web")
	select {
	case <-engine.started:
	case <-time.After(3 * time.Second):
		t.Fatal("capture never started")
	}

	if !q.CancelRunning(id) {
		t.Fatal("CancelRunning refused a live capture")
	}

	job := awaitJobStatus(t, q, id, StatusCanceled)
	if job.Err != "" {
		t.Fatalf("cancelled job kept an error: %q", job.Err)
	}
	if job.RetrySafe {
		t.Fatal("a cancelled job must not advertise an automatic retry")
	}
	if q.CancelRunning(id) {
		t.Fatal("cancel must not report success twice")
	}
}
