package importdrain

import (
	"context"
	"errors"
	"io"
	"testing"

	"eea/capture/internal/capture"
	"eea/capture/internal/platform"
)

type submitCall struct {
	jobID       string
	filename    string
	contentType string
	payload     []byte
}

type fakeAPI struct {
	jobs      []platform.CaptureJobAwaiting
	listErr   error
	claimed   []string
	released  []string
	failed    []string
	submitted []submitCall
}

func (f *fakeAPI) ListAwaitingCaptureJobs(context.Context, int) ([]platform.CaptureJobAwaiting, error) {
	return f.jobs, f.listErr
}

func (f *fakeAPI) ClaimCaptureJob(_ context.Context, jobID, _ string) (*platform.CaptureJobAwaiting, error) {
	f.claimed = append(f.claimed, jobID)
	for _, job := range f.jobs {
		if job.ID == jobID {
			job := job
			return &job, nil
		}
	}
	return nil, errors.New("job not found")
}

func (f *fakeAPI) ClientReleaseCaptureJob(_ context.Context, jobID, _, _ string) error {
	f.released = append(f.released, jobID)
	return nil
}

func (f *fakeAPI) ClientFailCaptureJob(_ context.Context, jobID, _, _ string) error {
	f.failed = append(f.failed, jobID)
	return nil
}

func (f *fakeAPI) ClientSubmitCaptureJob(_ context.Context, jobID, filename, contentType string, payload []byte, _ string) (*platform.CaptureJob, error) {
	f.submitted = append(f.submitted, submitCall{jobID: jobID, filename: filename, contentType: contentType, payload: payload})
	return &platform.CaptureJob{ID: jobID, Status: "queued"}, nil
}

func (f *fakeAPI) MaxUploadBytes() int64 { return 1 << 20 }

type fakeEngine struct {
	err error
}

func (e *fakeEngine) Capture(context.Context, string) (*capture.Archive, error) {
	if e.err != nil {
		return nil, e.err
	}
	return &capture.Archive{URL: "https://example.com/a", Title: "A", HTML: []byte("<html>a</html>")}, nil
}

func awaitingJob(id, url string) platform.CaptureJobAwaiting {
	return platform.CaptureJobAwaiting{
		CaptureJob: platform.CaptureJob{ID: id, Status: "awaiting_client"},
		SourceURL:  url,
	}
}

func TestDrainClaimsCapturesAndSubmits(t *testing.T) {
	api := &fakeAPI{jobs: []platform.CaptureJobAwaiting{
		awaitingJob("job-1", "https://example.com/a"),
		awaitingJob("job-2", "https://example.com/b"),
	}}
	ok, failed := DrainAwaitingJobs(context.Background(), io.Discard, api, &fakeEngine{}, nil, "")
	if ok != 2 || failed != 0 {
		t.Fatalf("ok=%d failed=%d", ok, failed)
	}
	if len(api.claimed) != 2 || api.claimed[0] != "job-1" || api.claimed[1] != "job-2" {
		t.Fatalf("claimed = %v", api.claimed)
	}
	if len(api.submitted) != 2 {
		t.Fatalf("submitted = %v", api.submitted)
	}
	for _, call := range api.submitted {
		if call.filename != "archive.html" || call.contentType != "text/html; charset=utf-8" {
			t.Fatalf("submit = %+v", call)
		}
		if string(call.payload) != "<html>a</html>" {
			t.Fatalf("payload = %q", call.payload)
		}
	}
	if len(api.failed) != 0 || len(api.released) != 0 {
		t.Fatalf("failed=%v released=%v", api.failed, api.released)
	}
}

func TestDrainFailsJobWhenCaptureErrors(t *testing.T) {
	api := &fakeAPI{jobs: []platform.CaptureJobAwaiting{awaitingJob("job-1", "https://example.com/a")}}
	ok, failed := DrainAwaitingJobs(context.Background(), io.Discard, api, &fakeEngine{err: errors.New("login wall")}, nil, "")
	if ok != 0 || failed != 1 {
		t.Fatalf("ok=%d failed=%d", ok, failed)
	}
	if len(api.failed) != 1 || api.failed[0] != "job-1" {
		t.Fatalf("failed = %v", api.failed)
	}
	if len(api.submitted) != 0 {
		t.Fatalf("submitted = %v", api.submitted)
	}
}

func TestDrainReleasesJobWhenCaptureIsCanceled(t *testing.T) {
	api := &fakeAPI{jobs: []platform.CaptureJobAwaiting{awaitingJob("job-1", "https://example.com/a")}}
	ok, failed := DrainAwaitingJobs(context.Background(), io.Discard, api, &fakeEngine{err: context.Canceled}, nil, "")
	if ok != 0 || failed != 1 {
		t.Fatalf("ok=%d failed=%d", ok, failed)
	}
	if len(api.released) != 1 || api.released[0] != "job-1" {
		t.Fatalf("released = %v", api.released)
	}
	if len(api.failed) != 0 {
		t.Fatalf("failed = %v", api.failed)
	}
}

func TestDrainSkipsJobsWithoutURL(t *testing.T) {
	api := &fakeAPI{jobs: []platform.CaptureJobAwaiting{awaitingJob("job-1", " ")}, listErr: nil}
	ok, failed := DrainAwaitingJobs(context.Background(), io.Discard, api, &fakeEngine{}, nil, "")
	if ok != 0 || failed != 0 {
		t.Fatalf("ok=%d failed=%d", ok, failed)
	}
	if len(api.claimed) != 0 {
		t.Fatalf("claimed = %v", api.claimed)
	}
}
