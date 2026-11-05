// Package queue runs capture and upload jobs with bounded concurrency and retry.
package queue

import (
	"context"
	"errors"
	"fmt"
	"net"
	"path/filepath"
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
)

// Status is a job lifecycle state.
type Status string

const (
	StatusQueued  Status = "queued"
	StatusRunning Status = "running"
	StatusDone    Status = "done"
	StatusFailed  Status = "failed"
)

// Job is one unit of work; fields are a snapshot for the UI.
type Job struct {
	ID         int
	Kind       Kind
	URL        string
	Path       string
	Channel    string
	Status     Status
	Attempts   int
	Err        string
	SignalID   string
	Title      string
	Bytes      int
	QueuedAt   time.Time
	StartedAt  time.Time
	FinishedAt time.Time
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
	OnUpdate      func(Job)
}

// Queue is a worker pool shared by the CLI and the GUI.
type Queue struct {
	engine CaptureEngine
	api    *platform.Client
	opts   Options

	mu      sync.Mutex
	cond    *sync.Cond
	jobs    []*Job
	pending int
	nextID  int
	ch      chan *Job
	stopped bool
	wg      sync.WaitGroup
}

// New prepares a queue. Workers start on Start.
func New(engine CaptureEngine, api *platform.Client, opts Options) *Queue {
	if opts.Workers <= 0 {
		opts.Workers = 2
	}
	if opts.Timeout <= 0 {
		opts.Timeout = 90 * time.Second
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

// Start launches the worker goroutines.
func (q *Queue) Start() {
	for i := 0; i < q.opts.Workers; i++ {
		q.wg.Add(1)
		go q.worker()
	}
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

func (q *Queue) submit(job *Job) int {
	q.mu.Lock()
	q.nextID++
	job.ID = q.nextID
	job.Status = StatusQueued
	job.QueuedAt = time.Now()
	q.jobs = append(q.jobs, job)
	q.pending++
	q.mu.Unlock()
	q.notify(*job)
	q.ch <- job
	return job.ID
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
		out = append(out, *j)
	}
	return out
}

// Close stops accepting work and waits for workers to drain.
func (q *Queue) Close() {
	q.mu.Lock()
	if q.stopped {
		q.mu.Unlock()
		return
	}
	q.stopped = true
	q.mu.Unlock()
	close(q.ch)
	q.wg.Wait()
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
	job.Status = StatusRunning
	job.StartedAt = time.Now()
	q.mu.Unlock()
	q.notify(*job)

	var err error
	for attempt := 1; attempt <= q.opts.Retries+1; attempt++ {
		q.mu.Lock()
		job.Attempts = attempt
		q.mu.Unlock()

		timeout := q.opts.Timeout
		if job.Kind != KindURL && q.opts.UploadTimeout > 0 {
			timeout = q.opts.UploadTimeout
		}
		ctx, cancel := context.WithTimeout(context.Background(), timeout)
		err = q.attempt(ctx, job)
		cancel()
		if err == nil {
			break
		}
		q.mu.Lock()
		job.Err = err.Error()
		q.mu.Unlock()
		q.notify(*job)
		if !retryable(err) || attempt == q.opts.Retries+1 {
			break
		}
		time.Sleep(time.Duration(attempt) * 2 * time.Second)
	}
	q.finish(job, err)
}

func (q *Queue) attempt(ctx context.Context, job *Job) error {
	switch job.Kind {
	case KindFile:
		doc, err := q.api.UploadDocument(ctx, job.Path)
		if err != nil {
			return err
		}
		q.mu.Lock()
		job.SignalID = doc.ID
		job.Bytes = int(doc.Size)
		q.mu.Unlock()
		return nil
	case KindArchive:
		data, err := archive.Read(job.Path)
		if err != nil {
			return err
		}
		src := job.URL
		if src == "" {
			src = archive.Infer(data)
		}
		if src == "" {
			return fmt.Errorf("%s: %w", filepath.Base(job.Path), archive.ErrNoURL)
		}
		sig, err := q.api.Capture(ctx, platform.CaptureInput{
			URL:      src,
			Channel:  platform.InferChannel(src),
			Archive:  data,
			Filename: filepath.Base(job.Path),
		})
		if err != nil {
			return err
		}
		q.mu.Lock()
		job.URL = src
		job.Bytes = len(data)
		job.SignalID = sig.ID
		job.Title = sig.Title
		q.mu.Unlock()
		return nil
	default:
		if q.engine == nil {
			return errors.New("no capture engine available")
		}
		page, err := q.engine.Capture(ctx, job.URL)
		if err != nil {
			return err
		}
		q.mu.Lock()
		job.Bytes = len(page.HTML)
		q.mu.Unlock()
		channel := job.Channel
		if channel == "" {
			channel = platform.InferChannel(job.URL)
		}
		sig, err := q.api.Capture(ctx, platform.CaptureInput{
			URL:     page.URL,
			Channel: channel,
			Archive: page.HTML,
		})
		if err != nil {
			return err
		}
		q.mu.Lock()
		job.SignalID = sig.ID
		job.Title = sig.Title
		if job.Title == "" {
			job.Title = page.Title
		}
		q.mu.Unlock()
		return nil
	}
}

func (q *Queue) finish(job *Job, err error) {
	q.mu.Lock()
	if err != nil {
		job.Status = StatusFailed
		job.Err = err.Error()
	} else {
		job.Status = StatusDone
		job.Err = ""
	}
	job.FinishedAt = time.Now()
	snapshot := *job
	q.pending--
	q.cond.Broadcast()
	q.mu.Unlock()
	q.notify(snapshot)
}

func (q *Queue) notify(job Job) {
	if q.opts.OnUpdate != nil {
		q.opts.OnUpdate(job)
	}
}

func retryable(err error) bool {
	var se *platform.StatusError
	if errors.As(err, &se) {
		return se.Retryable()
	}
	var ne net.Error
	if errors.As(err, &ne) {
		return true
	}
	return false
}
