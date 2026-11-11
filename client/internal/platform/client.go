// Package platform uploads captures and raw documents to the EEA backend.
package platform

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"eea/capture/internal/httpx"
	"eea/capture/internal/retry"
)

// Client talks to /api/v1 of the EEA backend.
type Client struct {
	base     string
	http     *http.Client
	maxBytes int64

	routeMu           sync.Mutex
	capturePath       string
	captureIdempotent bool
}

// New builds a client for base (e.g. http://10.215.8.74:8000). Outbound
// sockets are bound to the physical LAN address so uploads leave through the
// same adapter the browser uses (not VMnet/Hyper-V).
func New(base string, maxUploadMB int) *Client {
	if maxUploadMB <= 0 {
		maxUploadMB = 120
	}
	return &Client{
		base:     strings.TrimRight(base, "/"),
		http:     httpx.PrimaryClient(""),
		maxBytes: int64(maxUploadMB) << 20,
	}
}

// CloseIdleConnections releases pooled sockets after the owning runtime stops.
func (c *Client) CloseIdleConnections() { c.http.CloseIdleConnections() }

// Base returns the API root.
func (c *Client) Base() string { return c.base }

// CaptureInput is one page capture awaiting upload.
type CaptureInput struct {
	URL                  string
	Channel              string
	Archive              []byte
	Filename             string
	Published            string
	SubmissionID         string
	CaptureJobID         string
	RetryJob             bool
	OnJobAccepted        func(string)
	OnCaptureJobProgress CaptureJobProgressFunc
}

// NewSubmissionID returns an RFC 4122 version-4 id. An empty result means the
// system random source failed, so the caller must leave ambiguous retries off.
func NewSubmissionID() string {
	var id [16]byte
	if _, err := rand.Read(id[:]); err != nil {
		return ""
	}
	id[6] = (id[6] & 0x0f) | 0x40
	id[8] = (id[8] & 0x3f) | 0x80
	hexID := hex.EncodeToString(id[:])
	return hexID[:8] + "-" + hexID[8:12] + "-" + hexID[12:16] + "-" + hexID[16:20] + "-" + hexID[20:]
}

// Signal is the subset of SignalDetail the client displays.
type Signal struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	Publisher     string `json:"publisher"`
	PublishedAt   string `json:"published_at"`
	EvidenceState string `json:"evidence_status_code"`
	Channel       string `json:"channel_code"`
}

// ManualFallbackInput is a researcher-pasted body for a source that could not
// be captured in the browser. It is explicitly submitted as pending review and
// must not be presented as a browser capture.
type ManualFallbackInput struct {
	URL     string
	Title   string
	Channel string
	Body    string
}

// CreateManualFallback creates a signal from a user-pasted source URL and body.
// This endpoint has no idempotency key, so callers must not retry an ambiguous
// POST result automatically.
func (c *Client) CreateManualFallback(ctx context.Context, in ManualFallbackInput) (*Signal, error) {
	if strings.TrimSpace(in.URL) == "" || strings.TrimSpace(in.Title) == "" || strings.TrimSpace(in.Body) == "" {
		return nil, errors.New("manual fallback requires url, title, and body")
	}
	if int64(len(in.Body)) > c.maxBytes {
		return nil, fmt.Errorf("manual fallback body is %d bytes, over max_upload_mb", len(in.Body))
	}
	if in.Channel == "" {
		in.Channel = InferChannel(in.URL)
		if in.Channel == "" {
			in.Channel = "web"
		}
	}
	payload := struct {
		Title              string `json:"title"`
		URL                string `json:"url"`
		ChannelCode        string `json:"channel_code"`
		EvidenceStatusCode string `json:"evidence_status_code"`
		BodyText           string `json:"body_text"`
	}{
		Title:              strings.TrimSpace(in.Title),
		URL:                strings.TrimSpace(in.URL),
		ChannelCode:        in.Channel,
		EvidenceStatusCode: "pending_review",
		BodyText:           in.Body,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("encode manual fallback: %w", err)
	}
	var out Signal
	if err := c.doJSON(ctx, http.MethodPost, "/api/v1/signals", "application/json", body, &out); err != nil {
		return nil, err
	}
	if out.ID == "" {
		return nil, errors.New("manual fallback response did not include a signal id")
	}
	return &out, nil
}

// CaptureResult is the unified POST /capture response. The client only needs
// the nested signal for its existing job display.
type CaptureResult struct {
	Signal Signal `json:"signal"`
}

// CaptureJob is the durable page capture lifecycle returned by the backend.
type CaptureJob struct {
	ID           string         `json:"id"`
	SubmissionID string         `json:"submission_id"`
	Status       string         `json:"status"`
	Stage        string         `json:"stage"`
	AttemptCount int            `json:"attempt_count"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	StartedAt    *time.Time     `json:"started_at"`
	FinishedAt   *time.Time     `json:"finished_at"`
	SignalID     string         `json:"signal_id"`
	Error        string         `json:"error"`
	Result       *CaptureResult `json:"result"`
}

// CaptureJobProgressFunc is called whenever a durable job poll returns new state.
type CaptureJobProgressFunc func(CaptureJob)

const captureJobPollInterval = 2 * time.Second

// Document is the response of POST /documents/raw.
type Document struct {
	ID     string `json:"id"`
	SHA256 string `json:"sha256"`
	Mime   string `json:"mime"`
	Size   int64  `json:"size"`
}

// Capture uploads the captured URL and self-contained HTML. It prefers the
// unified endpoint when OpenAPI advertises it and uses the legacy endpoint
// only when that capability is absent. It never retries through another route
// after a submission error because the first request may already have stored
// the signal.
func (c *Client) Capture(ctx context.Context, in CaptureInput) (*Signal, error) {
	if in.CaptureJobID != "" {
		if in.RetryJob {
			return c.retryCaptureJobAndWait(ctx, in.CaptureJobID, in.OnJobAccepted)
		}
		return c.waitForCaptureJobID(ctx, in.CaptureJobID, in.OnCaptureJobProgress)
	}
	if strings.TrimSpace(in.URL) == "" {
		return nil, errors.New("url is required")
	}
	if len(in.Archive) == 0 {
		return nil, errors.New("archive_html is required")
	}
	if int64(len(in.Archive)) > c.maxBytes {
		return nil, fmt.Errorf("archive is %d bytes, over max_upload_mb", len(in.Archive))
	}
	filename := in.Filename
	if filename == "" {
		filename = "archive.html"
	}
	route, supportsIdempotency, err := c.captureRoute(ctx)
	if err != nil {
		return nil, err
	}
	if route == "/api/v1/capture/jobs" {
		if strings.TrimSpace(in.SubmissionID) == "" {
			return nil, errors.New("submission_id is required for durable capture jobs")
		}
	}

	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	if err := mw.WriteField("url", in.URL); err != nil {
		return nil, err
	}
	legacy := route == "/api/v1/signals/capture"
	if route == "/api/v1/capture/jobs" || (!legacy && supportsIdempotency && in.SubmissionID != "") {
		if err := mw.WriteField("submission_id", in.SubmissionID); err != nil {
			return nil, err
		}
	}
	if in.Channel != "" {
		if err := mw.WriteField("channel_code", in.Channel); err != nil {
			return nil, err
		}
	}
	if legacy && in.Published != "" {
		if err := mw.WriteField("published_at", in.Published); err != nil {
			return nil, err
		}
	}
	fileField := "file"
	if legacy {
		fileField = "archive_html"
	}
	part, err := createFilePart(mw, fileField, filename, "text/html; charset=utf-8")
	if err != nil {
		return nil, err
	}
	if _, err := part.Write(in.Archive); err != nil {
		return nil, err
	}
	if err := mw.Close(); err != nil {
		return nil, err
	}
	if route == "/api/v1/capture/jobs" {
		var job CaptureJob
		if err := c.doJSON(ctx, http.MethodPost, route, mw.FormDataContentType(), body.Bytes(), &job); err != nil {
			return nil, captureSubmissionError(err, true)
		}
		if job.ID == "" {
			return nil, &SubmissionOutcomeUnknownError{
				Err:        errors.New("capture job response did not include an id"),
				Idempotent: true,
			}
		}
		if job.SubmissionID != in.SubmissionID {
			return nil, fmt.Errorf("capture job %s returned submission_id %q; expected %q", job.ID, job.SubmissionID, in.SubmissionID)
		}
		if in.OnJobAccepted != nil {
			in.OnJobAccepted(job.ID)
		}
		return c.waitForCaptureJob(ctx, job, in.OnCaptureJobProgress)
	}

	if legacy {
		var out Signal
		if err := c.doJSON(ctx, http.MethodPost, route, mw.FormDataContentType(), body.Bytes(), &out); err != nil {
			return nil, captureSubmissionError(err, false)
		}
		if out.ID == "" {
			return nil, &SubmissionOutcomeUnknownError{Err: errors.New("capture response did not include a signal id")}
		}
		return &out, nil
	}
	var out CaptureResult
	if err := c.doJSON(ctx, http.MethodPost, route, mw.FormDataContentType(), body.Bytes(), &out); err != nil {
		return nil, captureSubmissionError(err, supportsIdempotency && in.SubmissionID != "")
	}
	if out.Signal.ID == "" {
		return nil, &SubmissionOutcomeUnknownError{
			Err:        errors.New("capture response did not include a signal id"),
			Idempotent: supportsIdempotency && in.SubmissionID != "",
		}
	}
	return &out.Signal, nil
}

// GetCaptureJob fetches the current durable job state.
func (c *Client) GetCaptureJob(ctx context.Context, jobID string) (*CaptureJob, error) {
	if strings.TrimSpace(jobID) == "" {
		return nil, errors.New("capture job id is required")
	}
	var job CaptureJob
	path := "/api/v1/capture/jobs/" + url.PathEscape(jobID)
	if err := c.doJSON(ctx, http.MethodGet, path, "", nil, &job); err != nil {
		return nil, err
	}
	return &job, nil
}

// WaitCaptureJob polls an already accepted job until it succeeds, fails,
// cancels, or the caller's context ends.
func (c *Client) WaitCaptureJob(ctx context.Context, jobID string) (*Signal, error) {
	return c.waitForCaptureJobID(ctx, jobID, nil)
}

// WaitCaptureJobWithProgress polls like WaitCaptureJob and reports backend stage updates.
func (c *Client) WaitCaptureJobWithProgress(
	ctx context.Context,
	jobID string,
	onProgress CaptureJobProgressFunc,
) (*Signal, error) {
	return c.waitForCaptureJobID(ctx, jobID, onProgress)
}

// RetryCaptureJob asks the backend to retry a failed durable capture, then
// waits for its terminal result.
func (c *Client) RetryCaptureJob(ctx context.Context, jobID string) (*Signal, error) {
	return c.retryCaptureJobAndWait(ctx, jobID, nil)
}

func (c *Client) retryCaptureJobAndWait(ctx context.Context, jobID string, onAccepted func(string)) (*Signal, error) {
	job, err := c.captureJobAction(ctx, jobID, "retry")
	if err != nil {
		var status *StatusError
		if errors.As(err, &status) && status.Code != http.StatusConflict && status.Code != http.StatusTooManyRequests && status.Code < 500 {
			return nil, err
		}
		// The retry POST may have reached the server even when its response was
		// lost. Resolve the stable job ID with GET before deciding whether to
		// issue that POST again.
		current, readErr := c.GetCaptureJob(ctx, jobID)
		if readErr != nil {
			if onAccepted != nil {
				onAccepted(jobID)
			}
			return nil, &CaptureJobPollError{JobID: jobID, Err: readErr}
		}
		if current.Status == "failed" {
			return nil, err
		}
		if onAccepted != nil {
			onAccepted(current.ID)
		}
		return c.waitForCaptureJob(ctx, *current, nil)
	}
	if onAccepted != nil {
		onAccepted(job.ID)
	}
	return c.waitForCaptureJob(ctx, *job, nil)
}

// CancelCaptureJob asks the backend to cancel a queued durable capture.
func (c *Client) CancelCaptureJob(ctx context.Context, jobID string) (*CaptureJob, error) {
	return c.captureJobAction(ctx, jobID, "cancel")
}

func (c *Client) captureJobAction(ctx context.Context, jobID, action string) (*CaptureJob, error) {
	if strings.TrimSpace(jobID) == "" {
		return nil, errors.New("capture job id is required")
	}
	var job CaptureJob
	path := "/api/v1/capture/jobs/" + url.PathEscape(jobID) + "/" + action
	if err := c.doJSON(ctx, http.MethodPost, path, "application/json", nil, &job); err != nil {
		return nil, err
	}
	if job.ID == "" {
		return nil, fmt.Errorf("capture job %s response did not include an id", action)
	}
	return &job, nil
}

func (c *Client) waitForCaptureJobID(
	ctx context.Context,
	jobID string,
	onProgress CaptureJobProgressFunc,
) (*Signal, error) {
	for {
		job, err := c.GetCaptureJob(ctx, jobID)
		if err == nil {
			return c.waitForCaptureJob(ctx, *job, onProgress)
		}
		if ctx.Err() != nil {
			return nil, &CaptureJobPollError{JobID: jobID, Err: ctx.Err()}
		}
		if !retryableCaptureJobRead(err) {
			return nil, &CaptureJobPollError{JobID: jobID, Err: err}
		}
		if err := waitCaptureJobIntervalFor(ctx, retryAfterDelay(err)); err != nil {
			return nil, &CaptureJobPollError{JobID: jobID, Err: err}
		}
	}
}

func (c *Client) waitForCaptureJob(
	ctx context.Context,
	job CaptureJob,
	onProgress CaptureJobProgressFunc,
) (*Signal, error) {
	if job.ID == "" {
		return nil, errors.New("capture job response did not include an id")
	}
	if onProgress != nil {
		onProgress(job)
	}
	delay := captureJobPollInterval
	for {
		switch job.Status {
		case "succeeded":
			return c.captureJobSignal(ctx, job)
		case "failed", "cancelled":
			message := strings.TrimSpace(job.Error)
			if message == "" {
				message = "no error detail was provided by the server"
			}
			return nil, &CaptureJobStatusError{JobID: job.ID, Status: job.Status, Message: message}
		case "queued", "running":
		default:
			return nil, fmt.Errorf("capture job %s returned unsupported status %q", job.ID, job.Status)
		}

		if err := waitCaptureJobIntervalFor(ctx, delay); err != nil {
			return nil, &CaptureJobPollError{JobID: job.ID, Err: err}
		}

		updated, err := c.GetCaptureJob(ctx, job.ID)
		if err != nil {
			if ctx.Err() != nil {
				return nil, &CaptureJobPollError{JobID: job.ID, Err: ctx.Err()}
			}
			if !retryableCaptureJobRead(err) {
				return nil, &CaptureJobPollError{JobID: job.ID, Err: err}
			}
			delay = retryAfterDelay(err)
			continue
		}
		job = *updated
		if onProgress != nil {
			onProgress(job)
		}
		delay = captureJobPollInterval
	}
}

func waitCaptureJobInterval(ctx context.Context) error {
	return waitCaptureJobIntervalFor(ctx, captureJobPollInterval)
}

func waitCaptureJobIntervalFor(ctx context.Context, delay time.Duration) error {
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}

func retryAfterDelay(err error) time.Duration {
	var status *StatusError
	if errors.As(err, &status) && status.RetryAfter > 0 {
		return status.RetryAfter
	}
	return captureJobPollInterval
}

func (c *Client) captureJobSignal(ctx context.Context, job CaptureJob) (*Signal, error) {
	if job.Result != nil && job.Result.Signal.ID != "" {
		if job.SignalID != "" && job.Result.Signal.ID != job.SignalID {
			return nil, fmt.Errorf("capture job %s returned mismatched signal ids %q and %q", job.ID, job.SignalID, job.Result.Signal.ID)
		}
		return &job.Result.Signal, nil
	}
	if job.SignalID == "" {
		return nil, fmt.Errorf("capture job %s succeeded without result.signal or signal_id", job.ID)
	}
	var signal Signal
	path := "/api/v1/signals/" + url.PathEscape(job.SignalID)
	if err := c.doJSON(ctx, http.MethodGet, path, "", nil, &signal); err != nil {
		return nil, &CaptureJobPollError{JobID: job.ID, Err: fmt.Errorf("load final signal: %w", err)}
	}
	if signal.ID == "" {
		return nil, fmt.Errorf("capture job %s signal response did not include an id", job.ID)
	}
	return &signal, nil
}

// CaptureJobStatusError is a terminal failed or cancelled backend job.
type CaptureJobStatusError struct {
	JobID   string
	Status  string
	Message string
}

func (e *CaptureJobStatusError) Error() string {
	if e.Status == "cancelled" {
		return fmt.Sprintf("capture job %s was cancelled: %s", e.JobID, e.Message)
	}
	return fmt.Sprintf("capture job %s failed: %s", e.JobID, e.Message)
}

// CaptureJobPollError means a durable job was accepted but polling did not
// reach a terminal result before the client stopped waiting.
type CaptureJobPollError struct {
	JobID string
	Err   error
}

func (e *CaptureJobPollError) Error() string {
	return fmt.Sprintf("capture job %s could not be fully resolved; polling stopped: %v", e.JobID, e.Err)
}

func (e *CaptureJobPollError) Unwrap() error { return e.Err }

func retryableCaptureJobRead(err error) bool {
	var status *StatusError
	if errors.As(err, &status) {
		return status.Retryable()
	}
	var syntax *json.SyntaxError
	var typeErr *json.UnmarshalTypeError
	if errors.As(err, &syntax) || errors.As(err, &typeErr) {
		return false
	}
	return true
}

// SubmissionOutcomeUnknownError marks a capture POST whose result may have
// been committed even though the client did not receive a usable response.
// A request can be retried automatically only when the endpoint schema
// advertises submission_id and the caller supplied the same key.
type SubmissionOutcomeUnknownError struct {
	Err        error
	Idempotent bool
}

func (e *SubmissionOutcomeUnknownError) Error() string {
	if e.Idempotent {
		return fmt.Sprintf("capture outcome is unknown; retry will reuse the same submission id: %v", e.Err)
	}
	return fmt.Sprintf("capture outcome may have been stored; automatic retry stopped to avoid a duplicate: %v", e.Err)
}

func (e *SubmissionOutcomeUnknownError) Unwrap() error { return e.Err }

// FileJobInput submits a raw document through the durable capture job API when
// available. CaptureJobID resumes polling or backend retry without re-uploading.
type FileJobInput struct {
	Path                 string
	SubmissionID         string
	CaptureJobID         string
	RetryJob             bool
	OnJobAccepted        func(string)
	OnCaptureJobProgress CaptureJobProgressFunc
}

func (c *Client) SubmitFileJob(ctx context.Context, in FileJobInput) (*Signal, error) {
	if in.CaptureJobID != "" {
		if in.RetryJob {
			return c.retryCaptureJobAndWait(ctx, in.CaptureJobID, in.OnJobAccepted)
		}
		return c.waitForCaptureJobID(ctx, in.CaptureJobID, in.OnCaptureJobProgress)
	}
	if strings.TrimSpace(in.Path) == "" {
		return nil, errors.New("file path is required")
	}
	route, _, err := c.captureRoute(ctx)
	if err != nil {
		return nil, err
	}
	if route != "/api/v1/capture/jobs" {
		doc, uploadErr := c.UploadDocument(ctx, in.Path)
		if uploadErr != nil {
			return nil, uploadErr
		}
		return nil, fmt.Errorf(
			"server does not expose durable capture jobs; document %s was stored without a derived signal",
			doc.ID,
		)
	}
	if strings.TrimSpace(in.SubmissionID) == "" {
		return nil, errors.New("submission_id is required for durable file jobs")
	}

	f, err := os.Open(in.Path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil {
		return nil, err
	}
	if info.Size() > c.maxBytes {
		return nil, fmt.Errorf("%s is %d bytes, over max_upload_mb", filepath.Base(in.Path), info.Size())
	}
	head := make([]byte, 512)
	n, _ := io.ReadFull(f, head)
	if _, err := f.Seek(0, io.SeekStart); err != nil {
		return nil, err
	}
	ctype := mimeFor(in.Path, head[:n])

	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	if err := mw.WriteField("submission_id", in.SubmissionID); err != nil {
		return nil, err
	}
	part, err := createFilePart(mw, "file", filepath.Base(in.Path), ctype)
	if err != nil {
		return nil, err
	}
	if _, err := io.Copy(part, f); err != nil {
		return nil, err
	}
	if err := mw.Close(); err != nil {
		return nil, err
	}

	var job CaptureJob
	if err := c.doJSON(ctx, http.MethodPost, route, mw.FormDataContentType(), body.Bytes(), &job); err != nil {
		return nil, captureSubmissionError(err, true)
	}
	if job.ID == "" {
		return nil, &SubmissionOutcomeUnknownError{
			Err:        errors.New("capture job response did not include an id"),
			Idempotent: true,
		}
	}
	if job.SubmissionID != in.SubmissionID {
		return nil, fmt.Errorf("capture job %s returned submission_id %q; expected %q", job.ID, job.SubmissionID, in.SubmissionID)
	}
	if in.OnJobAccepted != nil {
		in.OnJobAccepted(job.ID)
	}
	return c.waitForCaptureJob(ctx, job, in.OnCaptureJobProgress)
}

func captureSubmissionError(err error, idempotent bool) error {
	var status *StatusError
	if errors.As(err, &status) {
		if status.Code >= 400 && status.Code < 500 && status.Code != http.StatusTooManyRequests {
			return err // explicit client rejection; no signal was accepted by this route
		}
		// Only replay when the same submission key is known to be enforced.
		status.OutcomeUnknown = !idempotent
		return status
	}
	return &SubmissionOutcomeUnknownError{Err: err, Idempotent: idempotent}
}

// UploadDocument posts a raw file to POST /documents/raw; parsing stays server-side.
func (c *Client) UploadDocument(ctx context.Context, path string) (*Document, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil {
		return nil, err
	}
	if info.Size() > c.maxBytes {
		return nil, fmt.Errorf("%s is %d bytes, over max_upload_mb", filepath.Base(path), info.Size())
	}

	head := make([]byte, 512)
	n, _ := io.ReadFull(f, head)
	if _, err := f.Seek(0, io.SeekStart); err != nil {
		return nil, err
	}
	ctype := mimeFor(path, head[:n])

	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	part, err := createFilePart(mw, "file", filepath.Base(path), ctype)
	if err != nil {
		return nil, err
	}
	if _, err := io.Copy(part, f); err != nil {
		return nil, err
	}
	if err := mw.Close(); err != nil {
		return nil, err
	}

	var out Document
	if err := c.doJSON(ctx, http.MethodPost, "/api/v1/documents/raw", mw.FormDataContentType(), body.Bytes(), &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Reachable reports whether /openapi.json answers, used by doctor.
func (c *Client) Reachable(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.base+"/openapi.json", nil)
	if err != nil {
		return err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, io.LimitReader(resp.Body, 4096))
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%s: %s", c.base, resp.Status)
	}
	return nil
}

func (c *Client) doJSON(ctx context.Context, method, path, contentType string, payload []byte, out any) error {
	req, err := http.NewRequestWithContext(ctx, method, c.base+path, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Accept", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return &StatusError{
			Code:       resp.StatusCode,
			Body:       strings.TrimSpace(string(data)),
			RetryAfter: retry.ParseRetryAfter(resp.Header.Get("Retry-After"), time.Now()),
		}
	}
	if out == nil {
		return nil
	}
	if len(data) == 0 {
		return nil
	}
	return json.Unmarshal(data, out)
}

// StatusError is a non-2xx response; Retryable reports 429/5xx.
type StatusError struct {
	Code           int
	Body           string
	OutcomeUnknown bool
	RetryAfter     time.Duration
}

func (e *StatusError) Error() string {
	if e.OutcomeUnknown {
		return fmt.Sprintf("capture outcome may have been stored; automatic retry stopped to avoid a duplicate: http %d: %s", e.Code, e.Body)
	}
	return fmt.Sprintf("http %d: %s", e.Code, e.Body)
}

// Retryable reports whether the request may succeed when repeated.
func (e *StatusError) Retryable() bool {
	return retry.HTTPStatusRetryable(e.Code)
}

// mimeFor prefers the real document type over zip sniffing (docx/pptx are
// ZIP containers, so http.DetectContentType alone reports application/zip).
func mimeFor(path string, head []byte) string {
	switch strings.ToLower(filepath.Ext(path)) {
	case ".pdf":
		return "application/pdf"
	case ".doc":
		return "application/msword"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case ".ppt":
		return "application/vnd.ms-powerpoint"
	case ".pptx":
		return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
	case ".xls":
		return "application/vnd.ms-excel"
	case ".xlsx":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case ".txt":
		return "text/plain; charset=utf-8"
	case ".md":
		return "text/markdown; charset=utf-8"
	case ".html", ".htm":
		return "text/html; charset=utf-8"
	}
	if len(head) == 0 {
		return "application/octet-stream"
	}
	return http.DetectContentType(head)
}

// InferChannel maps well-known hosts to backend channel codes.
func InferChannel(rawURL string) string {
	u, err := url.Parse(strings.TrimSpace(rawURL))
	if err != nil || u.Host == "" {
		return ""
	}
	host := strings.ToLower(u.Hostname())
	switch {
	case host == "mp.weixin.qq.com", host == "weixin.qq.com":
		return "wechat_mp"
	case strings.HasSuffix(host, "weixin.qq.com"):
		return "wechat_mp"
	default:
		return ""
	}
}

func createFilePart(mw *multipart.Writer, field, filename, contentType string) (io.Writer, error) {
	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition",
		fmt.Sprintf(`form-data; name="%s"; filename="%s"`, escapeQuotes(field), escapeQuotes(filename)))
	h.Set("Content-Type", contentType)
	return mw.CreatePart(h)
}

func escapeQuotes(s string) string {
	return strings.NewReplacer("\\", "\\\\", `"`, "\\\"").Replace(s)
}

// SupportsCapture reports whether the backend exposes either supported page
// capture route, plus the legacy document and archive APIs used by the client.
func (c *Client) SupportsCapture(ctx context.Context) (bool, error) {
	doc, err := c.openapiDocument(ctx)
	if err != nil {
		return false, err
	}
	pageCapture := hasPath(doc.Paths, "/api/v1/capture/jobs") ||
		hasPath(doc.Paths, "/api/v1/capture") ||
		hasPath(doc.Paths, "/api/v1/signals/capture")
	return pageCapture && hasPath(doc.Paths, "/api/v1/documents/raw") && hasPath(doc.Paths, "/api/v1/signals/{signal_id}/archive"), nil
}

func (c *Client) captureRoute(ctx context.Context) (string, bool, error) {
	c.routeMu.Lock()
	defer c.routeMu.Unlock()
	if c.capturePath != "" {
		return c.capturePath, c.captureIdempotent, nil
	}
	doc, err := c.openapiDocument(ctx)
	// Older deployments and reverse proxies may not expose OpenAPI. Preserve
	// the historical endpoint in that case; a failed POST is never replayed
	// through another route.
	if err != nil || len(doc.Paths) == 0 {
		return "/api/v1/signals/capture", false, nil
	}
	if hasPath(doc.Paths, "/api/v1/capture/jobs") {
		c.capturePath = "/api/v1/capture/jobs"
		c.captureIdempotent = true // required submission_id is part of this contract
		return c.capturePath, c.captureIdempotent, nil
	}
	if hasPath(doc.Paths, "/api/v1/capture") {
		c.capturePath = "/api/v1/capture"
		c.captureIdempotent = captureHasSubmissionID(*doc)
		return c.capturePath, c.captureIdempotent, nil
	}
	if hasPath(doc.Paths, "/api/v1/signals/capture") {
		c.capturePath = "/api/v1/signals/capture"
		c.captureIdempotent = false
		return c.capturePath, c.captureIdempotent, nil
	}
	return "", false, fmt.Errorf("%s advertises neither unified nor legacy page capture", c.base)
}

type openAPIDocument struct {
	Paths      map[string]json.RawMessage `json:"paths"`
	Components struct {
		Schemas map[string]struct {
			Properties map[string]json.RawMessage `json:"properties"`
		} `json:"schemas"`
	} `json:"components"`
}

func captureHasSubmissionID(doc openAPIDocument) bool {
	var operation struct {
		Post struct {
			RequestBody struct {
				Content map[string]struct {
					Schema struct {
						Ref string `json:"$ref"`
					} `json:"schema"`
				} `json:"content"`
			} `json:"requestBody"`
		} `json:"post"`
	}
	if err := json.Unmarshal(doc.Paths["/api/v1/capture"], &operation); err != nil {
		return false
	}
	media, ok := operation.Post.RequestBody.Content["multipart/form-data"]
	if !ok {
		return false
	}
	const schemaPrefix = "#/components/schemas/"
	if !strings.HasPrefix(media.Schema.Ref, schemaPrefix) {
		return false
	}
	schema, ok := doc.Components.Schemas[strings.TrimPrefix(media.Schema.Ref, schemaPrefix)]
	if !ok {
		return false
	}
	_, ok = schema.Properties["submission_id"]
	return ok
}

func (c *Client) openapiDocument(ctx context.Context) (*openAPIDocument, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.base+"/openapi.json", nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%s: %s", c.base, resp.Status)
	}
	var doc openAPIDocument
	if err := json.NewDecoder(io.LimitReader(resp.Body, 8<<20)).Decode(&doc); err != nil {
		return nil, err
	}
	return &doc, nil
}

func hasPath(paths map[string]json.RawMessage, path string) bool {
	_, ok := paths[path]
	return ok
}
