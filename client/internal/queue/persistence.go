package queue

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"time"
)

const queueStateVersion = 1

type queueState struct {
	Version int         `json:"version"`
	NextID  int         `json:"next_id"`
	Jobs    []storedJob `json:"jobs"`
}

type storedJob struct {
	ID            int       `json:"id"`
	Kind          Kind      `json:"kind"`
	URL           string    `json:"url,omitempty"`
	Path          string    `json:"path,omitempty"`
	Channel       string    `json:"channel,omitempty"`
	SubmissionID  string    `json:"submission_id,omitempty"`
	CaptureJobID  string    `json:"capture_job_id,omitempty"`
	RetryCapture  bool      `json:"retry_capture,omitempty"`
	RetrySafe     bool      `json:"retry_safe,omitempty"`
	CaptureURL    string    `json:"capture_url,omitempty"`
	Stage         string    `json:"stage,omitempty"`
	EvidenceState string    `json:"evidence_state,omitempty"`
	Status        Status    `json:"status"`
	Attempts      int       `json:"attempts"`
	Err           string    `json:"error,omitempty"`
	SignalID      string    `json:"signal_id,omitempty"`
	Title         string    `json:"title,omitempty"`
	Bytes         int       `json:"bytes,omitempty"`
	QueuedAt      time.Time `json:"queued_at"`
	StartedAt     time.Time `json:"started_at,omitempty"`
	FinishedAt    time.Time `json:"finished_at,omitempty"`
	HasPayload    bool      `json:"has_payload,omitempty"`
	PayloadBytes  int64     `json:"payload_bytes,omitempty"`
}

// Restore loads durable history and prepares queued/running jobs for Start.
// Call it before Start; it is a no-op when Options.StateDir is empty.
func (q *Queue) Restore() error {
	q.mu.Lock()
	defer q.mu.Unlock()
	if q.restored {
		return nil
	}
	if q.opts.StateDir == "" {
		q.restored = true
		return nil
	}
	if q.started || len(q.jobs) != 0 {
		return errors.New("queue restore must happen before jobs are submitted or Start is called")
	}
	if err := ensurePrivateDir(q.opts.StateDir); err != nil {
		return fmt.Errorf("prepare queue state directory: %w", err)
	}
	if err := ensurePrivateDir(filepath.Join(q.opts.StateDir, "payloads")); err != nil {
		return fmt.Errorf("prepare queue payload directory: %w", err)
	}

	statePath := q.statePath()
	data, err := os.ReadFile(statePath)
	if err != nil && !errors.Is(err, fs.ErrNotExist) {
		return fmt.Errorf("read queue state: %w", err)
	}
	state := queueState{Version: queueStateVersion}
	if err == nil {
		if err := os.Chmod(statePath, 0o600); err != nil {
			return fmt.Errorf("restrict queue state permissions: %w", err)
		}
		if err := json.Unmarshal(data, &state); err != nil {
			return fmt.Errorf("decode queue state: %w", err)
		}
		if state.Version != queueStateVersion {
			return fmt.Errorf("unsupported queue state version %d", state.Version)
		}
	}

	jobs := make([]*Job, 0, len(state.Jobs))
	active := make([]*Job, 0, len(state.Jobs))
	seen := make(map[int]struct{}, len(state.Jobs))
	maxID := 0
	for _, entry := range state.Jobs {
		if entry.ID <= 0 {
			return fmt.Errorf("queue state contains invalid job id %d", entry.ID)
		}
		if _, exists := seen[entry.ID]; exists {
			return fmt.Errorf("queue state contains duplicate job id %d", entry.ID)
		}
		seen[entry.ID] = struct{}{}
		if entry.Kind < KindURL || entry.Kind > KindManualFallback {
			return fmt.Errorf("queue job %d has invalid kind %d", entry.ID, entry.Kind)
		}
		switch entry.Status {
		case StatusQueued, StatusRunning, StatusDone, StatusFailed, StatusCanceled:
		default:
			return fmt.Errorf("queue job %d has invalid status %q", entry.ID, entry.Status)
		}
		job := &Job{
			ID:            entry.ID,
			Kind:          entry.Kind,
			URL:           entry.URL,
			Path:          entry.Path,
			Channel:       entry.Channel,
			SubmissionID:  entry.SubmissionID,
			CaptureJobID:  entry.CaptureJobID,
			RetryCapture:  entry.RetryCapture,
			RetrySafe:     entry.RetrySafe,
			captureURL:    entry.CaptureURL,
			Stage:         entry.Stage,
			EvidenceState: entry.EvidenceState,
			Status:        entry.Status,
			Attempts:      entry.Attempts,
			Err:           safeDiagnostic(entry.Err),
			SignalID:      entry.SignalID,
			Title:         entry.Title,
			Bytes:         entry.Bytes,
			QueuedAt:      entry.QueuedAt,
			StartedAt:     entry.StartedAt,
			FinishedAt:    entry.FinishedAt,
			hasPayload:    entry.HasPayload,
		}
		if (job.Status == StatusQueued || job.Status == StatusRunning) &&
			(job.Kind == KindURL || job.Kind == KindArchive) && job.SubmissionID == "" {
			return fmt.Errorf("queue job %d has no stable submission id", job.ID)
		}
		if job.hasPayload && job.Kind != KindURL && job.Kind != KindArchive && job.Kind != KindManualFallback {
			return fmt.Errorf("queue job %d has an unexpected payload", job.ID)
		}
		if job.Status == StatusRunning {
			job.Status = StatusQueued
			job.StartedAt = time.Time{}
		}
		if job.Status == StatusQueued {
			if job.hasPayload && job.CaptureJobID == "" {
				payloadPath := q.payloadPath(job.ID)
				payload, readErr := os.ReadFile(payloadPath)
				if readErr != nil {
					return fmt.Errorf("restore payload for queue job %d: %w", job.ID, readErr)
				}
				if err := os.Chmod(payloadPath, 0o600); err != nil {
					return fmt.Errorf("restrict payload permissions for queue job %d: %w", job.ID, err)
				}
				if entry.PayloadBytes != int64(len(payload)) {
					return fmt.Errorf("queue job %d payload size mismatch: state says %d bytes, file has %d", job.ID, entry.PayloadBytes, len(payload))
				}
				if job.Kind == KindManualFallback {
					job.manualBody = payload
				} else {
					job.archive = payload
				}
			}
			active = append(active, job)
		}
		jobs = append(jobs, job)
		if job.ID > maxID {
			maxID = job.ID
		}
	}
	if state.NextID < maxID {
		state.NextID = maxID
	}
	if state.NextID < 0 {
		return errors.New("queue state has a negative next_id")
	}

	// Persist recovery of interrupted running jobs before exposing them to workers.
	recovered, err := encodeQueueState(state.NextID, jobs)
	if err != nil {
		return err
	}
	if err := atomicWriteFile(statePath, recovered, 0o600); err != nil {
		return fmt.Errorf("write recovered queue state: %w", err)
	}
	q.jobs = jobs
	q.restoreJobs = active
	q.pending = len(active)
	q.nextID = state.NextID
	q.restored = true
	q.persistErr = nil
	return nil
}

func (q *Queue) cachePayload(job *Job, data []byte, sourceURL string) error {
	if q.opts.StateDir != "" {
		if err := ensurePrivateDir(filepath.Join(q.opts.StateDir, "payloads")); err != nil {
			q.setPersistenceError(err)
			return fmt.Errorf("prepare queue payload directory: %w", err)
		}
		if err := atomicWriteFile(q.payloadPath(job.ID), data, 0o600); err != nil {
			q.setPersistenceError(err)
			return fmt.Errorf("persist capture payload: %w", err)
		}
	}
	q.mu.Lock()
	defer q.mu.Unlock()
	if q.opts.StateDir != "" {
		job.hasPayload = true
	}
	job.captureURL = sourceURL
	if job.Kind == KindArchive {
		job.URL = sourceURL
	}
	job.archive = data
	job.Bytes = len(data)
	if err := q.persistLocked(); err != nil {
		q.setPersistenceErrorLocked(err)
		return fmt.Errorf("persist queued job with capture payload: %w", err)
	}
	return nil
}

func (q *Queue) persistLocked() error {
	if q.opts.StateDir == "" {
		return nil
	}
	if err := ensurePrivateDir(q.opts.StateDir); err != nil {
		return err
	}
	data, err := encodeQueueState(q.nextID, q.jobs)
	if err != nil {
		return err
	}
	if err := atomicWriteFile(q.statePath(), data, 0o600); err != nil {
		return err
	}
	q.persistErr = nil
	return nil
}

func (q *Queue) persistChangedLocked() {
	if err := q.persistLocked(); err != nil {
		q.setPersistenceErrorLocked(err)
	}
}

func (q *Queue) setPersistenceError(err error) {
	q.mu.Lock()
	q.setPersistenceErrorLocked(err)
	q.mu.Unlock()
}

func (q *Queue) setPersistenceErrorLocked(err error) {
	if err != nil {
		q.persistErr = err
	}
}

func (q *Queue) removePayloadLocked(id int) {
	if q.opts.StateDir == "" {
		return
	}
	if err := os.Remove(q.payloadPath(id)); err != nil && !errors.Is(err, fs.ErrNotExist) {
		q.setPersistenceErrorLocked(fmt.Errorf("remove queue payload %d: %w", id, err))
	}
}

func (q *Queue) statePath() string {
	return filepath.Join(q.opts.StateDir, "queue-state.json")
}

func (q *Queue) payloadPath(id int) string {
	return filepath.Join(q.opts.StateDir, "payloads", fmt.Sprintf("job-%d.bin", id))
}

func encodeQueueState(nextID int, jobs []*Job) ([]byte, error) {
	entries := make([]storedJob, 0, len(jobs))
	for _, job := range jobs {
		entry := storedJob{
			ID:            job.ID,
			Kind:          job.Kind,
			URL:           job.URL,
			Path:          job.Path,
			Channel:       job.Channel,
			SubmissionID:  job.SubmissionID,
			CaptureJobID:  job.CaptureJobID,
			RetryCapture:  job.RetryCapture,
			RetrySafe:     job.RetrySafe,
			CaptureURL:    job.captureURL,
			Stage:         job.Stage,
			EvidenceState: job.EvidenceState,
			Status:        job.Status,
			Attempts:      job.Attempts,
			Err:           job.Err,
			SignalID:      job.SignalID,
			Title:         job.Title,
			Bytes:         job.Bytes,
			QueuedAt:      job.QueuedAt,
			StartedAt:     job.StartedAt,
			FinishedAt:    job.FinishedAt,
			HasPayload:    job.hasPayload,
		}
		if job.hasPayload {
			entry.PayloadBytes = int64(job.Bytes)
		}
		entries = append(entries, entry)
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].ID < entries[j].ID })
	data, err := json.MarshalIndent(queueState{Version: queueStateVersion, NextID: nextID, Jobs: entries}, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("encode queue state: %w", err)
	}
	return append(data, '\n'), nil
}

func ensurePrivateDir(path string) error {
	if err := os.MkdirAll(path, 0o700); err != nil {
		return err
	}
	return os.Chmod(path, 0o700)
}

func atomicWriteFile(path string, data []byte, mode fs.FileMode) error {
	dir := filepath.Dir(path)
	if err := ensurePrivateDir(dir); err != nil {
		return err
	}
	tmp, err := os.CreateTemp(dir, ".eea-queue-*.tmp")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	cleanup := true
	defer func() {
		if cleanup {
			_ = os.Remove(tmpName)
		}
	}()
	if err := tmp.Chmod(mode); err != nil {
		_ = tmp.Close()
		return err
	}
	if _, err := tmp.Write(data); err != nil {
		_ = tmp.Close()
		return err
	}
	if err := tmp.Sync(); err != nil {
		_ = tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	if err := atomicReplace(tmpName, path); err != nil {
		return err
	}
	cleanup = false
	return nil
}
