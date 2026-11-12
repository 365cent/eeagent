package importdrain

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"path"
	"strings"
	"time"

	"eea/capture/internal/capture"
	"eea/capture/internal/platform"
)

const WorkerID = "capture-client"

// API is the server-job capability needed by the import drainer.
type API interface {
	ListAwaitingCaptureJobs(context.Context, int) ([]platform.CaptureJobAwaiting, error)
	ClaimCaptureJob(context.Context, string, string) (*platform.CaptureJobAwaiting, error)
	ClientReleaseCaptureJob(context.Context, string, string, string) error
	ClientFailCaptureJob(context.Context, string, string, string) error
	ClientSubmitCaptureJob(context.Context, string, string, string, []byte, string) (*platform.CaptureJob, error)
	MaxUploadBytes() int64
}

type reservedJob struct {
	id string
}

// DrainAwaitingJobs claims server jobs in awaiting_client, captures, and uploads.
func DrainAwaitingJobs(
	ctx context.Context,
	out io.Writer,
	api API,
	engine capture.CaptureEngine,
	publicHTTP *http.Client,
	channel string,
) (ok, failed int) {
	jobs, err := api.ListAwaitingCaptureJobs(ctx, 50)
	if err != nil {
		fmt.Fprintf(out, "import queue: %v\n", err)
		return 0, 0
	}
	if len(jobs) == 0 {
		return 0, 0
	}
	fmt.Fprintf(out, "draining %d server capture job(s)\n", len(jobs))
	for _, job := range jobs {
		if err := ctx.Err(); err != nil {
			fmt.Fprintf(out, "drain stopped: %v\n", err)
			break
		}
		if strings.TrimSpace(job.SourceURL) == "" {
			continue
		}
		if err := drainOne(ctx, out, api, engine, publicHTTP, channel, job); err != nil {
			failed++
		} else {
			ok++
		}
	}
	return ok, failed
}

func drainOne(
	ctx context.Context,
	out io.Writer,
	api API,
	engine capture.CaptureEngine,
	publicHTTP *http.Client,
	channel string,
	job platform.CaptureJobAwaiting,
) (err error) {
	claimed, err := api.ClaimCaptureJob(ctx, job.ID, WorkerID)
	if err != nil {
		fmt.Fprintf(out, "FAIL  claim %s: %v\n", job.SourceURL, err)
		return err
	}
	reserved := &reservedJob{id: claimed.ID}
	defer func() {
		if reserved == nil {
			return
		}
		relCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			relErr := api.ClientReleaseCaptureJob(relCtx, reserved.id, WorkerID, err.Error())
			if relErr != nil {
				fmt.Fprintf(out, "WARN  release %s after abort: %v\n", claimed.SourceURL, relErr)
			}
			return
		}
		if err != nil {
			failErr := api.ClientFailCaptureJob(relCtx, reserved.id, WorkerID, err.Error())
			if failErr != nil {
				_ = api.ClientReleaseCaptureJob(relCtx, reserved.id, WorkerID, err.Error())
			}
		}
	}()

	rawURL := claimed.SourceURL
	ch := channel
	if ch == "" {
		ch = claimed.ChannelCode
	}
	var (
		filename    = "archive.html"
		contentType = "text/html; charset=utf-8"
		payload     []byte
	)
	if platform.IsPDFImportJob(rawURL, "") {
		payload, err = downloadURL(ctx, rawURL, api.MaxUploadBytes(), publicHTTP)
		if err != nil {
			fmt.Fprintf(out, "FAIL  pdf %s: %v\n", rawURL, err)
			return err
		}
		filename = path.Base(rawURL)
		if filename == "" || filename == "." {
			filename = "document.pdf"
		}
		contentType = "application/pdf"
	} else {
		var archive *capture.Archive
		archive, err = engine.Capture(ctx, rawURL)
		if err != nil {
			fmt.Fprintf(out, "FAIL  capture %s: %v\n", rawURL, err)
			return err
		}
		payload = archive.HTML
	}
	_ = ch
	submitted, err := api.ClientSubmitCaptureJob(ctx, claimed.ID, filename, contentType, payload, WorkerID)
	if err != nil {
		fmt.Fprintf(out, "FAIL  submit %s: %v\n", rawURL, err)
		if apiErr, ok := err.(*platform.StatusError); ok && apiErr.Code == http.StatusConflict {
			return context.Canceled
		}
		return err
	}
	reserved = nil
	if submitted.Status == "failed" {
		fmt.Fprintf(out, "FAIL  server rejected %s\n", rawURL)
		return fmt.Errorf("server rejected job")
	}
	fmt.Fprintf(out, "queued %-8s %s\n", submitted.ID, rawURL)
	return nil
}

func downloadURL(ctx context.Context, rawURL string, maxBytes int64, client *http.Client) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, err
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("HTTP %s", resp.Status)
	}
	limited := io.LimitReader(resp.Body, maxBytes)
	return io.ReadAll(limited)
}
