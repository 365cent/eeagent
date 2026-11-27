//go:build windows

package ui

import (
	"testing"

	"eea/capture/internal/queue"
)

func TestLaunchLinkFindsTheAppLinkAmongArgs(t *testing.T) {
	cases := []struct {
		name string
		args []string
		want string
	}{
		{"plain launch", nil, ""},
		{"subcommand", []string{"upload", "-url", "https://example.com"}, ""},
		{"link first", []string{"eea-capture://claim?batch=abc"}, "eea-capture://claim?batch=abc"},
		{"link after flags", []string{"--verbose", " eea-capture://claim?batch=abc "}, "eea-capture://claim?batch=abc"},
		{"uppercase scheme", []string{"EEA-Capture://claim"}, "EEA-Capture://claim"},
		{"http is not a link", []string{"https://example.com/signals"}, ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := LaunchLink(tc.args); got != tc.want {
				t.Fatalf("LaunchLink(%q) = %q, want %q", tc.args, got, tc.want)
			}
		})
	}
}

func TestBatchIDFromLinkIsShortAndOptional(t *testing.T) {
	long := "eea-capture://claim?batch=12345678-90ab-cdef-1234-567890abcdef"
	if got := batchIDFromLink(long); got != "12345678" {
		t.Fatalf("short batch id = %q, want 12345678", got)
	}
	if got := batchIDFromLink("eea-capture://claim"); got != "" {
		t.Fatalf("link without a batch must not invent one, got %q", got)
	}
}

func TestFailedJobAlwaysHasAnAction(t *testing.T) {
	// The reported dead end: "失败" with an unsafe retry showed no control at
	// all, so the footer's "逐项处理" had nothing to click.
	unsafeRetry := queue.Job{ID: 1, Status: queue.StatusFailed, Kind: queue.KindURL, RetrySafe: false}
	if jobSecondaryAction(unsafeRetry) != "重采" {
		t.Fatalf("failed job needs a re-capture action, got %q", jobSecondaryAction(unsafeRetry))
	}
	safeRetry := queue.Job{ID: 2, Status: queue.StatusFailed, Kind: queue.KindURL, RetrySafe: true}
	if jobPrimaryAction(safeRetry) != "重试" {
		t.Fatalf("safe retry should stay primary, got %q", jobPrimaryAction(safeRetry))
	}
	done := queue.Job{ID: 3, Status: queue.StatusDone, Kind: queue.KindURL, SignalID: "sig"}
	if jobSecondaryAction(done) != "" {
		t.Fatalf("finished jobs need no secondary action, got %q", jobSecondaryAction(done))
	}
	if jobPrimaryAction(done) != "打开" {
		t.Fatalf("finished web job should open its signal, got %q", jobPrimaryAction(done))
	}
}
