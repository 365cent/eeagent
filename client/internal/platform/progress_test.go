package platform

import "testing"

func TestCaptureJobProgressPercent(t *testing.T) {
	if got := CaptureJobProgressPercent("running", "processing"); got != 68 {
		t.Fatalf("processing = %d, want 68", got)
	}
	if got := LocalJobProgressPercent("processing", "running", "fetching"); got != 30 {
		t.Fatalf("merged fetching = %d, want 30", got)
	}
}
