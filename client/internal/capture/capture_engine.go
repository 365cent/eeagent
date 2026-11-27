package capture

import (
	"context"
)

// CaptureEngine captures a URL into a self-contained archive.
type CaptureEngine interface {
	Capture(ctx context.Context, url string) (*Archive, error)
}

// PhaseReporter is implemented by engines that can describe what the capture is
// doing right now ("加载页面…", "页面需要人工验证"). The queue shows it next to
// the percentage, because a two-minute page load otherwise looks like a hang.
type PhaseReporter interface {
	CaptureWithProgress(ctx context.Context, url string, progress func(string)) (*Archive, error)
}
