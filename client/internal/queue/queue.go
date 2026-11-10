// Package queue runs capture and upload jobs with bounded concurrency and retry.
package queue

import (
	"context"
	"errors"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"eea/capture/internal/archive"
	"eea/capture/internal/capture"
	"eea/capture/internal/platform"
)

// Kind distinguishes a page capture from a raw document upload.
type Kind int

const (
	KindURL Kind = iota
	KindFile
	KindArchive
	KindManualFallback
)

// Status is a job lifecycle state.
type Status string

const (
	StatusQueued   Status = "queued"
	StatusRunning  Status = "running"
	StatusDone     Status = "done"
	StatusFailed   Status = "failed"
	StatusCanceled Status = "canceled"
)

// Job is one unit of work; fields are a snapshot for the UI.
type Job struct {
	ID            int
	Kind          Kind
	URL           string
	Path          string
	Channel       string
	SubmissionID  string
	CaptureJobID  string
	RetryCapture  bool
	RetrySafe     bool
	Stage         string
	ServerStage   string
	ServerStatus  string
	Progress      int
	EvidenceState string
	captureURL    string
	archive       []byte
	manualBody    []byte
	hasPayload    bool
	Status        Status
	Attempts      int
	Err           string
	SignalID      string
	Title         string
	Bytes         int
	QueuedAt      time.Time
	StartedAt     time.Time
	FinishedAt    time.Time
}

// CaptureEngine captures a URL into a self-contained archive.
type CaptureEngine interface {
	Capture(ctx context.Context, url string) (*capture.Archive, error)
}

// Options tunes the pool.
type Options struct {
	Workers       int
	Retries       int
	Timeout       time.Duration
	UploadTimeout time.Duration // files/archives may be up to 120 MiB
	StateDir      string        // optional durable queue directory; call Restore before Start
	OnUpdate      func(Job)
}

// Queue is a worker pool shared by the CLI and the GUI.
type Queue struct {
	engine CaptureEngine
	api    *platform.Client
	opts   Options

	mu          sync.Mutex
	sendMu      sync.RWMutex
	cond        *sync.Cond
	jobs        []*Job
	restoreJobs []*Job
	pending     int
	nextID      int
	ch          chan *Job
	stopped     bool
	started     bool
	restored    bool
	persistErr  error
	wg          sync.WaitGroup
}

// New prepares a queue. Workers start on Start.
func New(engine CaptureEngine, api *platform.Client, opts Options) *Queue {
	if opts.Workers <= 0 {
		opts.Workers = 2
	}
	if opts.Timeout <= 0 {
		opts.Timeout = 150 * time.Second
	}
	q := &Queue{
		engine: engine,
		api:    api,
		opts:   opts,
		ch:     make(chan *Job, 64),
	}
	q.cond = sync.NewCond(&q.mu)
	return q
}

// Start launches workers and queues jobs recovered by Restore. With StateDir
// configured, it attempts Restore automatically if the caller has not done so.
func (q *Queue) Start() {
	if q.opts.StateDir != "" {
		q.mu.Lock()
		restored := q.restored
		q.mu.Unlock()
		if !restored {
			if err := q.Restore(); err != nil {
				q.setPersistenceError(err)
				return
			}
		}
	}
	q.sendMu.RLock()
	q.mu.Lock()
	if q.started || q.stopped {
		q.mu.Unlock()
		q.sendMu.RUnlock()
		return
	}
	q.started = true
	requeue := append([]*Job(nil), q.restoreJobs...)
	q.restoreJobs = nil
	q.mu.Unlock()
	for i := 0; i < q.opts.Workers; i++ {
		q.wg.Add(1)
		go q.worker()
	}
	for _, job := range requeue {
		q.ch <- job
	}
	q.sendMu.RUnlock()
}

// SubmitURL enqueues a page capture.
func (q *Queue) SubmitURL(rawURL, channel string) int {
	return q.submit(&Job{Kind: KindURL, URL: rawURL, Channel: channel})
}

// SubmitFile enqueues a raw document upload.
func (q *Queue) SubmitFile(path string) int {
	return q.submit(&Job{Kind: KindFile, Path: path})
}

// SubmitArchive enqueues a previously saved SingleFile HTML. An empty rawURL
// asks the queue to read the canonical/og:url from the file.
func (q *Queue) SubmitArchive(path, rawURL string) int {
	return q.submit(&Job{Kind: KindArchive, Path: path, URL: rawURL})
}

// SubmitManualFallback submits a user-pasted source body. It is stored as a
// private queue payload so a queued fallback can survive an application restart.
// The API request itself is never retried automatically because POST /signals
// does not expose an idempotency key.
func (q *Queue) SubmitManualFallback(rawURL, title, body string) int {
	return q.submit(&Job{
		Kind:       KindManualFallback,
		URL:        strings.TrimSpace(rawURL),
		Title:      strings.TrimSpace(title),
		Channel:    platform.InferChannel(rawURL),
		manualBody: []byte(body),
		Bytes:      len(body),
	})
}

func (q *Queue) submit(job *Job) int {
	q.sendMu.RLock()
	defer q.sendMu.RUnlock()
	if q.opts.StateDir != "" {
		q.mu.Lock()
		restored := q.restored
		q.mu.Unlock()
		if !restored {
			if err := q.Restore(); err != nil {
				return q.rejectSubmit(job, fmt.Errorf("restore queue: %w", err))
			}
		}
	}
	if q.opts.StateDir != "" && job.Path != "" {
		path, err := filepath.Abs(job.Path)
		if err != nil {
			return q.rejectSubmit(job, fmt.Errorf("resolve queue source path: %w", err))
		}
		job.Path = path
	}
	q.mu.Lock()
	if q.stopped {
		q.mu.Unlock()
		return q.rejectSubmit(job, errors.New("queue is closed"))
	}
	q.nextID++
	job.ID = q.nextID
	if job.Kind == KindURL || job.Kind == KindArchive || job.Kind == KindFile {
		job.SubmissionID = platform.NewSubmissionID()
	}
	job.Status = StatusQueued
	job.Stage = "queued"
	job.QueuedAt = time.Now()
	if job.Kind == KindManualFallback {
		if q.opts.StateDir != "" {
			if err := ensurePrivateDir(filepath.Join(q.opts.StateDir, "payloads")); err != nil {
				job.Status = StatusFailed
				job.Err = safeDiagnostic(fmt.Sprintf("persist manual fallback body: %v", err))
				job.FinishedAt = time.Now()
				q.jobs = append(q.jobs, job)
				q.mu.Unlock()
				q.notify(*job)
				return job.ID
			}
			if err := atomicWriteFile(q.payloadPath(job.ID), job.manualBody, 0o600); err != nil {
				job.Status = StatusFailed
				job.Err = safeDiagnostic(fmt.Sprintf("persist manual fallback body: %v", err))
				job.FinishedAt = time.Now()
				q.jobs = append(q.jobs, job)
				q.mu.Unlock()
				q.notify(*job)
				return job.ID
			}
			job.hasPayload = true
		}
	}
	q.jobs = append(q.jobs, job)
	if (job.Kind == KindURL || job.Kind == KindArchive || job.Kind == KindFile) && job.SubmissionID == "" {
		job.Status = StatusFailed
		job.Err = "could not generate a stable capture submission id"
		job.FinishedAt = time.Now()
		if err := q.persistLocked(); err != nil {
			q.setPersistenceErrorLocked(err)
		}
		snapshot := *job
		q.mu.Unlock()
		q.notify(snapshot)
		return job.ID
	}
	if err := q.persistLocked(); err != nil {
		job.Status = StatusFailed
		job.Err = safeDiagnostic(fmt.Sprintf("persist queue state: %v", err))
		job.FinishedAt = time.Now()
		if job.hasPayload {
			q.removePayloadLocked(job.ID)
			job.hasPayload = false
		}
		q.setPersistenceErrorLocked(err)
		snapshot := *job
		q.mu.Unlock()
		q.notify(snapshot)
		return job.ID
	}
	q.pending++
	snapshot := *job
	q.mu.Unlock()
	q.notify(snapshot)
	q.ch <- job
	return job.ID
}

func (q *Queue) rejectSubmit(job *Job, err error) int {
	q.mu.Lock()
	q.nextID++
	job.ID = q.nextID
	job.Status = StatusFailed
	job.Err = safeDiagnostic(err.Error())
	job.QueuedAt = time.Now()
	job.FinishedAt = job.QueuedAt
	q.jobs = append(q.jobs, job)
	q.setPersistenceErrorLocked(err)
	snapshot := *job
	q.mu.Unlock()
	q.notify(snapshot)
	return job.ID
}

// RetryFailed requeues a previously failed job only when its failure is known
// to be safe to replay. Call after Restore and before Start.
func (q *Queue) RetryFailed(id int) error {
	q.mu.Lock()
	defer q.mu.Unlock()
	if !q.restored || q.started || q.stopped {
		return errors.New("retry requires a restored queue before Start")
	}
	var job *Job
	for _, candidate := range q.jobs {
		if candidate.ID == id {
			job = candidate
			break
		}
	}
	if job == nil {
		return fmt.Errorf("queue job %d not found", id)
	}
	if job.Status != StatusFailed || !job.RetrySafe {
		return fmt.Errorf("queue job %d is not safe to retry", id)
	}
	previous := *job
	job.Status = StatusQueued
	job.Stage = "queued"
	job.Err = ""
	job.RetrySafe = false
	job.StartedAt = time.Time{}
	job.FinishedAt = time.Time{}
	if err := q.persistLocked(); err != nil {
		*job = previous
		q.setPersistenceErrorLocked(err)
		return fmt.Errorf("persist retry request: %w", err)
	}
	q.pending++
	q.restoreJobs = append(q.restoreJobs, job)
	return nil
}

// CancelQueued cancels only jobs that have never started locally and have no
// accepted server job id. Restored in-flight jobs remain non-cancellable even
// though Restore presents them as queued, because the request outcome may be
// ambiguous and the server could still create a signal.
func (q *Queue) CancelQueued(id int) bool {
	q.mu.Lock()
	var job *Job
	for _, candidate := range q.jobs {
		if candidate.ID == id {
			job = candidate
			break
		}
	}
	if job == nil || job.Status != StatusQueued || job.Attempts != 0 || job.CaptureJobID != "" {
		q.mu.Unlock()
		return false
	}
	previous := *job
	job.Status = StatusCanceled
	job.Stage = "canceled"
	job.Err = ""
	job.RetrySafe = false
	job.FinishedAt = time.Now()
	if err := q.persistLocked(); err != nil {
		*job = previous
		q.setPersistenceErrorLocked(err)
		q.mu.Unlock()
		return false
	}
	q.pending--
	q.cond.Broadcast()
	snapshot := *job
	q.mu.Unlock()
	q.notify(snapshot)
	return true
}

// Wait blocks until every submitted job finished.
func (q *Queue) Wait() {
	q.mu.Lock()
	defer q.mu.Unlock()
	for q.pending > 0 {
		q.cond.Wait()
	}
}

// Snapshot copies the job list for rendering.
func (q *Queue) Snapshot() []Job {
	q.mu.Lock()
	defer q.mu.Unlock()
	out := make([]Job, 0, len(q.jobs))
	for _, j := range q.jobs {
		snapshot := *j
		snapshot.archive = nil
		snapshot.manualBody = nil
		out = append(out, snapshot)
	}
	return out
}

// Close stops accepting work and waits for workers to drain.
func (q *Queue) Close() {
	q.sendMu.Lock()
	q.mu.Lock()
	if q.stopped {
		q.mu.Unlock()
		q.sendMu.Unlock()
		return
	}
	q.stopped = true
	q.mu.Unlock()
	close(q.ch)
	q.sendMu.Unlock()
	q.wg.Wait()
}

// PersistenceError reports the most recent durable-state or payload write error.
// It is nil when persistence is disabled or the last write succeeded.
func (q *Queue) PersistenceError() error {
	q.mu.Lock()
	defer q.mu.Unlock()
	return q.persistErr
}

func (q *Queue) worker() {
	defer q.wg.Done()
	for job := range q.ch {
		q.runJob(job)
	}
}

func (q *Queue) runJob(job *Job) {
	defer func() {
		if r := recover(); r != nil {
			q.finish(job, fmt.Errorf("panic: %v", r))
		}
	}()
	q.mu.Lock()
	if job.Status != StatusQueued {
		q.mu.Unlock()
		return
	}
	job.Status = StatusRunning
	job.Stage = initialStage(job.Kind)
	job.StartedAt = time.Now()
	if err := q.persistLocked(); err != nil {
		q.setPersistenceErrorLocked(err)
		q.mu.Unlock()
		q.finish(job, fmt.Errorf("persist running state: %w", err))
		return
	}
	q.mu.Unlock()
	q.notify(*job)

	var err error
	for attempt := 1; attempt <= q.opts.Retries+1; attempt++ {
		q.mu.Lock()
		job.Attempts++
		job.Err = ""
		persistErr := q.persistLocked()
		if persistErr != nil {
			q.setPersistenceErrorLocked(persistErr)
		}
		q.mu.Unlock()
		if persistErr != nil {
			err = fmt.Errorf("persist attempt state: %w", persistErr)
			break
		}

		ctx, cancel := context.WithTimeout(context.Background(), q.jobAttemptTimeout(job))
		err = q.attempt(ctx, job)
		cancel()
		if err == nil {
			break
		}
		q.mu.Lock()
		job.Err = safeDiagnostic(err.Error())
		persistErr = q.persistLocked()
		if persistErr != nil {
			q.setPersistenceErrorLocked(persistErr)
		}
		q.mu.Unlock()
		q.notify(*job)
		if persistErr != nil {
			err = fmt.Errorf("%w (also failed to persist queue state: %v)", err, persistErr)
			break
		}
		var jobErr *platform.CaptureJobStatusError
		if errors.As(err, &jobErr) && jobErr.Status == "failed" {
			q.mu.Lock()
			job.RetryCapture = true
			if persistErr := q.persistLocked(); persistErr != nil {
				q.setPersistenceErrorLocked(persistErr)
			}
			q.mu.Unlock()
		}
		if job.Kind == KindManualFallback || !retryable(err) || attempt == q.opts.Retries+1 {
			break
		}
		time.Sleep(retryDelay(err, attempt))
	}
	q.finish(job, err)
}

func (q *Queue) jobAttemptTimeout(job *Job) time.Duration {
	if job.CaptureJobID != "" || job.Kind != KindURL {
		if q.opts.UploadTimeout > 0 {
			return q.opts.UploadTimeout
		}
	}
	if job.Kind == KindURL && job.archive != nil && q.opts.UploadTimeout > 0 {
		return q.opts.UploadTimeout
	}
	if job.Kind == KindURL && q.opts.UploadTimeout > q.opts.Timeout {
		// Live URL capture uses separate capture budget inside attempt; reserve upload/poll time.
		return q.opts.UploadTimeout
	}
	return q.opts.Timeout
}

func (q *Queue) attempt(ctx context.Context, job *Job) error {
	if job.CaptureJobID != "" {
		q.mu.Lock()
		jobID := job.CaptureJobID
		retry := job.RetryCapture
		q.mu.Unlock()

		var sig *platform.Signal
		var err error
		progress := q.captureJobProgressReporter(job)
		if retry {
			sig, err = q.api.RetryCaptureJob(ctx, jobID)
		} else {
			sig, err = q.api.WaitCaptureJobWithProgress(ctx, jobID, progress)
		}
		if err != nil {
			return err
		}
		if retry {
			q.mu.Lock()
			job.RetryCapture = false
			if persistErr := q.persistLocked(); persistErr != nil {
				q.setPersistenceErrorLocked(persistErr)
			}
			q.mu.Unlock()
		}
		q.recordCaptureSignal(job, sig)
		return nil
	}

	switch job.Kind {
	case KindManualFallback:
		if len(job.manualBody) == 0 {
			return errors.New("manual fallback body is empty")
		}
		q.setStage(job, "uploading")
		sig, err := q.api.CreateManualFallback(ctx, platform.ManualFallbackInput{
			URL:     job.URL,
			Title:   job.Title,
			Channel: job.Channel,
			Body:    string(job.manualBody),
		})
		if err != nil {
			return err
		}
		q.recordCaptureSignal(job, sig)
		return nil
	case KindFile:
		q.setStage(job, "uploading")
		info, err := os.Stat(job.Path)
		if err != nil {
			return err
		}
		sig, err := q.api.SubmitFileJob(ctx, platform.FileJobInput{
			Path:                 job.Path,
			SubmissionID:         job.SubmissionID,
			CaptureJobID:         job.CaptureJobID,
			RetryJob:             job.RetryCapture,
			OnJobAccepted:        q.onCaptureJobAccepted(job),
			OnCaptureJobProgress: q.captureJobProgressReporter(job),
		})
		if err != nil {
			return err
		}
		if job.RetryCapture {
			q.mu.Lock()
			job.RetryCapture = false
			if persistErr := q.persistLocked(); persistErr != nil {
				q.setPersistenceErrorLocked(persistErr)
			}
			q.mu.Unlock()
		}
		q.mu.Lock()
		job.Bytes = int(info.Size())
		q.persistChangedLocked()
		q.mu.Unlock()
		q.recordCaptureSignal(job, sig)
		return nil
	case KindArchive:
		q.setStage(job, "uploading")
		data := job.archive
		src := job.captureURL
		if data == nil {
			var err error
			data, err = archive.Read(job.Path)
			if err != nil {
				return err
			}
			src = job.URL
			if src == "" {
				src = archive.Infer(data)
			}
			if src == "" {
				return fmt.Errorf("%s: %w", filepath.Base(job.Path), archive.ErrNoURL)
			}
			if err := q.cachePayload(job, data, src); err != nil {
				return err
			}
		}
		sig, err := q.api.Capture(ctx, platform.CaptureInput{
			URL:                  src,
			Channel:              platform.InferChannel(src),
			Archive:              data,
			Filename:             filepath.Base(job.Path),
			SubmissionID:         job.SubmissionID,
			CaptureJobID:         job.CaptureJobID,
			RetryJob:             job.RetryCapture,
			OnJobAccepted:        q.onCaptureJobAccepted(job),
			OnCaptureJobProgress: q.captureJobProgressReporter(job),
		})
		if err != nil {
			return err
		}
		q.mu.Lock()
		job.captureURL = src
		q.persistChangedLocked()
		q.mu.Unlock()
		q.recordCaptureSignal(job, sig)
		return nil
	default:
		if q.engine == nil {
			return errors.New("no capture engine available")
		}
		data := job.archive
		src := job.captureURL
		title := job.Title
		if data == nil {
			captureBudget := q.opts.Timeout
			if captureBudget <= 0 {
				captureBudget = 150 * time.Second
			}
			capCtx, capCancel := context.WithTimeout(context.Background(), captureBudget)
			q.setStage(job, "capturing")
			page, err := q.engine.Capture(capCtx, job.URL)
			capCancel()
			if err != nil {
				return err
			}
			data = page.HTML
			src = page.URL
			title = page.Title
			if err := q.cachePayload(job, data, src); err != nil {
				return err
			}
			q.mu.Lock()
			job.Title = title
			q.persistChangedLocked()
			q.mu.Unlock()
		}
		uploadCtx := ctx
		if dl, ok := ctx.Deadline(); !ok || time.Until(dl) < 5*time.Second {
			uploadBudget := q.opts.UploadTimeout
			if uploadBudget <= 0 {
				uploadBudget = 15 * time.Minute
			}
			var cancel context.CancelFunc
			uploadCtx, cancel = context.WithTimeout(context.Background(), uploadBudget)
			defer cancel()
		}
		q.setStage(job, "uploading")
		channel := job.Channel
		if channel == "" {
			channel = platform.InferChannel(src)
		}
		sig, err := q.api.Capture(uploadCtx, platform.CaptureInput{
			URL:                  src,
			Channel:              channel,
			Archive:              data,
			SubmissionID:         job.SubmissionID,
			CaptureJobID:         job.CaptureJobID,
			RetryJob:             job.RetryCapture,
			OnJobAccepted:        q.onCaptureJobAccepted(job),
			OnCaptureJobProgress: q.captureJobProgressReporter(job),
		})
		if err != nil {
			return err
		}
		if sig.Title == "" && title != "" {
			sig.Title = title
		}
		q.recordCaptureSignal(job, sig)
		return nil
	}
}

func (q *Queue) recordCaptureSignal(job *Job, sig *platform.Signal) {
	q.mu.Lock()
	job.SignalID = sig.ID
	job.EvidenceState = sig.EvidenceState
	if sig.Title != "" {
		job.Title = sig.Title
	}
	q.persistChangedLocked()
	q.mu.Unlock()
}

func (q *Queue) setStage(job *Job, stage string) {
	q.mu.Lock()
	job.Stage = stage
	job.Progress = platform.LocalJobProgressPercent(stage, job.ServerStatus, job.ServerStage)
	q.persistChangedLocked()
	snapshot := *job
	q.mu.Unlock()
	q.notify(snapshot)
}

func (q *Queue) captureJobProgressReporter(job *Job) platform.CaptureJobProgressFunc {
	return func(cj platform.CaptureJob) {
		q.mu.Lock()
		job.ServerStage = cj.Stage
		job.ServerStatus = cj.Status
		job.Progress = platform.LocalJobProgressPercent(job.Stage, cj.Status, cj.Stage)
		q.persistChangedLocked()
		snapshot := *job
		q.mu.Unlock()
		q.notify(snapshot)
	}
}

func (q *Queue) onCaptureJobAccepted(job *Job) func(string) {
	return func(remoteID string) {
		q.mu.Lock()
		job.CaptureJobID = remoteID
		job.Stage = "processing"
		job.RetryCapture = false
		job.hasPayload = job.archive != nil || job.hasPayload
		if err := q.persistLocked(); err == nil {
			job.archive = nil
			job.hasPayload = false
			if err := q.persistLocked(); err == nil {
				q.removePayloadLocked(job.ID)
			} else {
				job.hasPayload = true
				q.setPersistenceErrorLocked(err)
			}
		} else {
			q.setPersistenceErrorLocked(err)
		}
		snapshot := *job
		q.mu.Unlock()
		q.notify(snapshot)
	}
}

func (q *Queue) finish(job *Job, err error) {
	q.mu.Lock()
	job.archive = nil
	if err != nil {
		job.Status = StatusFailed
		job.Stage = "failed"
		job.Err = safeDiagnostic(err.Error())
		job.RetrySafe = isSafeManualRetry(job, err)
	} else {
		job.Status = StatusDone
		job.Stage = "done"
		job.Err = ""
		job.RetrySafe = false
	}
	job.FinishedAt = time.Now()
	removePayload := job.Status == StatusDone
	if removePayload {
		job.hasPayload = false
	}
	persistErr := q.persistLocked()
	if persistErr != nil {
		if removePayload {
			job.hasPayload = true
		}
		q.setPersistenceErrorLocked(persistErr)
	}
	if removePayload && persistErr == nil {
		q.removePayloadLocked(job.ID)
	}
	snapshot := *job
	q.pending--
	q.cond.Broadcast()
	q.mu.Unlock()
	q.notify(snapshot)
}

func (q *Queue) notify(job Job) {
	job.archive = nil
	job.manualBody = nil
	if q.opts.OnUpdate != nil {
		q.opts.OnUpdate(job)
	}
}

func initialStage(kind Kind) string {
	switch kind {
	case KindURL:
		return "capturing"
	case KindFile, KindArchive, KindManualFallback:
		return "uploading"
	default:
		return "queued"
	}
}

func isSafeManualRetry(job *Job, err error) bool {
	if job.Kind == KindFile || job.Kind == KindManualFallback {
		return false
	}
	var terminal *platform.CaptureJobStatusError
	if errors.As(err, &terminal) && terminal.Status != "failed" {
		return false
	}
	if job.CaptureJobID != "" {
		return true
	}
	return retryable(err)
}

func retryable(err error) bool {
	if err != nil && strings.Contains(err.Error(), "prepare article images") {
		return false
	}
	var captureJob *platform.CaptureJobStatusError
	if errors.As(err, &captureJob) {
		return captureJob.Status == "failed"
	}
	var pollErr *platform.CaptureJobPollError
	if errors.As(err, &pollErr) {
		var status *platform.StatusError
		if errors.As(pollErr, &status) {
			return status.Retryable()
		}
		var netErr net.Error
		return errors.As(pollErr, &netErr) || errors.Is(pollErr, context.DeadlineExceeded)
	}
	var unknown *platform.SubmissionOutcomeUnknownError
	if errors.As(err, &unknown) {
		return unknown.Idempotent
	}
	var se *platform.StatusError
	if errors.As(err, &se) {
		if se.OutcomeUnknown {
			return false
		}
		return se.Retryable()
	}
	var ne net.Error
	if errors.As(err, &ne) {
		return true
	}
	return false
}

func retryDelay(err error, attempt int) time.Duration {
	var status *platform.StatusError
	if errors.As(err, &status) && status.RetryAfter > 0 {
		return status.RetryAfter
	}
	return time.Duration(attempt) * 2 * time.Second
}
