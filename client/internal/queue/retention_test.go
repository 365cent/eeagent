package queue

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestPruneHistoryDropsOldTerminalJobsAndOrphans(t *testing.T) {
	dir := t.TempDir()
	payloadDir := filepath.Join(dir, "payloads")
	if err := os.MkdirAll(payloadDir, 0o700); err != nil {
		t.Fatal(err)
	}
	stale := time.Now().Add(-8 * 24 * time.Hour)
	fresh := time.Now().Add(-1 * time.Hour)

	seed := New(nil, nil, Options{StateDir: dir, DisableAutoPruneOnRestore: true})
	seed.mu.Lock()
	seed.jobs = []*Job{
		{ID: 1, Kind: KindURL, URL: "https://example.com/old", Status: StatusDone, QueuedAt: stale, FinishedAt: stale, Bytes: 10},
		{ID: 2, Kind: KindURL, URL: "https://example.com/new", Status: StatusDone, QueuedAt: fresh, FinishedAt: fresh, Bytes: 12},
		{ID: 3, Kind: KindURL, URL: "https://example.com/active", Status: StatusQueued, QueuedAt: stale, SubmissionID: "sub-active"},
	}
	seed.nextID = 3
	seed.restored = true
	if err := seed.persistLocked(); err != nil {
		seed.mu.Unlock()
		t.Fatal(err)
	}
	seed.mu.Unlock()

	if err := os.WriteFile(filepath.Join(payloadDir, "job-1.bin"), []byte("stale-snapshot"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(payloadDir, "job-99.bin"), []byte("orphan-snapshot"), 0o600); err != nil {
		t.Fatal(err)
	}

	q := New(nil, nil, Options{
		StateDir:                  dir,
		HistoryRetention:          7 * 24 * time.Hour,
		DisableAutoPruneOnRestore: true,
	})
	if err := q.Restore(); err != nil {
		t.Fatal(err)
	}
	report, err := q.PruneHistory(false)
	if err != nil {
		t.Fatal(err)
	}
	if report.RemovedJobs != 1 || report.RemovedPayloads != 1 || report.OrphanPayloads != 1 {
		t.Fatalf("report = %+v", report)
	}
	jobs := q.Snapshot()
	if len(jobs) != 2 {
		t.Fatalf("kept %d jobs, want 2", len(jobs))
	}
	for _, job := range jobs {
		if job.ID == 1 {
			t.Fatalf("stale job should be removed: %+v", job)
		}
	}
	if _, err := os.Stat(filepath.Join(payloadDir, "job-1.bin")); !os.IsNotExist(err) {
		t.Fatalf("stale payload should be gone: %v", err)
	}
	if _, err := os.Stat(filepath.Join(payloadDir, "job-99.bin")); !os.IsNotExist(err) {
		t.Fatalf("orphan payload should be gone: %v", err)
	}
}

func TestRestoreAutoPrunesWhenRetentionConfigured(t *testing.T) {
	dir := t.TempDir()
	stale := time.Now().Add(-10 * 24 * time.Hour)
	seed := New(nil, nil, Options{StateDir: dir, DisableAutoPruneOnRestore: true})
	seed.mu.Lock()
	seed.jobs = []*Job{
		{ID: 1, Kind: KindURL, URL: "https://example.com/old", Status: StatusFailed, QueuedAt: stale, FinishedAt: stale, Err: "timeout"},
	}
	seed.nextID = 1
	seed.restored = true
	if err := seed.persistLocked(); err != nil {
		seed.mu.Unlock()
		t.Fatal(err)
	}
	seed.mu.Unlock()

	q := New(nil, nil, Options{StateDir: dir, HistoryRetention: 7 * 24 * time.Hour})
	if err := q.Restore(); err != nil {
		t.Fatal(err)
	}
	if len(q.Snapshot()) != 0 {
		t.Fatalf("auto prune should drop stale terminal jobs, got %+v", q.Snapshot())
	}
}