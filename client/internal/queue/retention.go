package queue

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// PruneReport summarizes queue history cleanup.
type PruneReport struct {
	RemovedJobs       int
	RemovedPayloads   int
	RemovedPayloadBytes int64
	OrphanPayloads    int
}

// PruneHistory drops terminal jobs older than HistoryRetention and deletes
// payload blobs that are no longer referenced. Queued and running jobs are
// never removed. dryRun reports counts without writing state or deleting files.
func (q *Queue) PruneHistory(dryRun bool) (PruneReport, error) {
	q.mu.Lock()
	defer q.mu.Unlock()
	if q.opts.StateDir == "" {
		return PruneReport{}, errors.New("queue has no state directory")
	}
	if !q.restored {
		return PruneReport{}, errors.New("call Restore before PruneHistory")
	}
	if q.opts.HistoryRetention <= 0 {
		return PruneReport{}, errors.New("queue history retention is disabled")
	}
	return q.pruneLocked(time.Now(), dryRun)
}

func (q *Queue) pruneLocked(now time.Time, dryRun bool) (PruneReport, error) {
	jobs, report, err := pruneJobs(q.opts.StateDir, q.jobs, q.opts.HistoryRetention, now, dryRun)
	if err != nil {
		return report, err
	}
	if dryRun {
		return report, nil
	}
	q.jobs = jobs
	if err := q.persistLocked(); err != nil {
		return report, err
	}
	return report, nil
}

func isTerminalStatus(s Status) bool {
	switch s {
	case StatusDone, StatusFailed, StatusCanceled:
		return true
	default:
		return false
	}
}

func terminalEndedAt(job *Job) time.Time {
	if !job.FinishedAt.IsZero() {
		return job.FinishedAt
	}
	return job.QueuedAt
}

func pruneJobs(stateDir string, jobs []*Job, retain time.Duration, now time.Time, dryRun bool) ([]*Job, PruneReport, error) {
	if retain <= 0 {
		return jobs, PruneReport{}, nil
	}
	cutoff := now.Add(-retain)
	kept := make([]*Job, 0, len(jobs))
	ids := make(map[int]struct{}, len(jobs))
	var report PruneReport

	for _, job := range jobs {
		if isTerminalStatus(job.Status) && terminalEndedAt(job).Before(cutoff) {
			report.RemovedJobs++
			path := filepath.Join(stateDir, "payloads", payloadFileName(job.ID))
			if info, err := os.Stat(path); err == nil {
				report.RemovedPayloads++
				report.RemovedPayloadBytes += info.Size()
			} else if !errors.Is(err, fs.ErrNotExist) {
				return nil, report, fmt.Errorf("stat payload for job %d: %w", job.ID, err)
			}
			if !dryRun {
				if err := os.Remove(path); err != nil && !errors.Is(err, fs.ErrNotExist) {
					return nil, report, fmt.Errorf("remove payload for job %d: %w", job.ID, err)
				}
			}
			continue
		}
		kept = append(kept, job)
		ids[job.ID] = struct{}{}
	}

	payloadDir := filepath.Join(stateDir, "payloads")
	entries, err := os.ReadDir(payloadDir)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return kept, report, nil
		}
		return nil, report, fmt.Errorf("read payload directory: %w", err)
	}
	for _, ent := range entries {
		if ent.IsDir() {
			continue
		}
		name := ent.Name()
		if !strings.HasPrefix(name, "job-") || !strings.HasSuffix(name, ".bin") {
			continue
		}
		idText := strings.TrimSuffix(strings.TrimPrefix(name, "job-"), ".bin")
		id, scanErr := strconv.Atoi(idText)
		if scanErr != nil || id <= 0 {
			continue
		}
		if _, ok := ids[id]; ok {
			continue
		}
		info, statErr := ent.Info()
		if statErr != nil {
			return nil, report, fmt.Errorf("stat orphan payload %s: %w", name, statErr)
		}
		report.OrphanPayloads++
		report.RemovedPayloadBytes += info.Size()
		if !dryRun {
			if err := os.Remove(filepath.Join(payloadDir, name)); err != nil && !errors.Is(err, fs.ErrNotExist) {
				return nil, report, fmt.Errorf("remove orphan payload %s: %w", name, err)
			}
		}
	}
	return kept, report, nil
}