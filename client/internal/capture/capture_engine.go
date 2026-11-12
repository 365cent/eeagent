package capture

import (
	"context"
)

// CaptureEngine captures a URL into a self-contained archive.
type CaptureEngine interface {
	Capture(ctx context.Context, url string) (*Archive, error)
}
