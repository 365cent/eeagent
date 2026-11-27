package ui

import (
	"strings"
	"testing"
	"time"

	"eea/capture/internal/queue"
)

func TestJobStatusLabelShowsPhaseAndElapsed(t *testing.T) {
	job := queue.Job{
		ID:             1,
		Status:         queue.StatusRunning,
		Stage:          "capturing",
		Progress:       22,
		Detail:         "等待页面就绪…",
		StageStartedAt: time.Now().Add(-72 * time.Second),
	}

	label := jobStatusLabel(job)

	for _, want := range []string{"抓取中 22%", "等待页面就绪…", "1m12s"} {
		if !strings.Contains(label, want) {
			t.Fatalf("label %q is missing %q", label, want)
		}
	}
}

func TestJobStatusLabelOmitsEmptyDetail(t *testing.T) {
	job := queue.Job{
		ID:       2,
		Status:   queue.StatusRunning,
		Stage:    "uploading",
		Progress: 42,
	}

	label := jobStatusLabel(job)

	if label != "上传中 42%" {
		t.Fatalf("label = %q, want the plain stage", label)
	}
}

func TestRunningCaptureOffersStop(t *testing.T) {
	running := queue.Job{ID: 3, Status: queue.StatusRunning, Stage: "capturing"}
	uploading := queue.Job{ID: 4, Status: queue.StatusRunning, Stage: "uploading"}

	if got := jobPrimaryAction(running); got != "停止" {
		t.Fatalf("running capture action = %q, want 停止", got)
	}
	if got := jobPrimaryAction(uploading); got != "" {
		t.Fatalf("uploading action = %q, want none", got)
	}
}
