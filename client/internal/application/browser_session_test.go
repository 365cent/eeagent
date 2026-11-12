package application

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"eea/capture/internal/capture"
	"eea/capture/internal/config"
)

type fakeBrowser struct {
	mu            sync.Mutex
	calls, closes int
	err           error
	started       chan struct{}
	release       chan struct{}
}

func (b *fakeBrowser) Capture(ctx context.Context, _ string) (*capture.Archive, error) {
	b.mu.Lock()
	b.calls++
	err := b.err
	started, release := b.started, b.release
	b.mu.Unlock()
	if started != nil {
		close(started)
		select {
		case <-release:
		case <-ctx.Done():
			return nil, ctx.Err()
		}
	}
	if err != nil {
		return nil, err
	}
	return &capture.Archive{Title: "ok"}, nil
}
func (b *fakeBrowser) Close() error { b.mu.Lock(); defer b.mu.Unlock(); b.closes++; return nil }

func TestSessionReusesBrowserAndClosesOnce(t *testing.T) {
	b := &fakeBrowser{}
	launches := 0
	s := &BrowserSession{launch: func(context.Context, capture.Options) (browser, error) { launches++; return b, nil }}
	for i := 0; i < 2; i++ {
		if _, err := s.Capture(context.Background(), "https://example.com"); err != nil {
			t.Fatal(err)
		}
	}
	s.Close()
	s.Close()
	if launches != 1 || b.calls != 2 || b.closes != 1 {
		t.Fatalf("launches=%d calls=%d closes=%d", launches, b.calls, b.closes)
	}
	if _, err := s.Capture(context.Background(), "https://example.com"); err == nil {
		t.Fatal("closed session accepted capture")
	}
}

func TestSessionRetriesLaunchAndRecoversBrowser(t *testing.T) {
	broken := &fakeBrowser{err: errors.New("service worker not found")}
	healthy := &fakeBrowser{}
	launches := 0
	s := &BrowserSession{launch: func(context.Context, capture.Options) (browser, error) {
		launches++
		switch launches {
		case 1:
			return nil, errors.New("temporary launch failure")
		case 2:
			return broken, nil
		default:
			return healthy, nil
		}
	}}
	if _, err := s.Capture(context.Background(), "x"); err == nil {
		t.Fatal("expected launch failure")
	}
	if _, err := s.Capture(context.Background(), "x"); err != nil {
		t.Fatal(err)
	}
	if launches != 3 || broken.closes != 1 || healthy.calls != 1 {
		t.Fatalf("launches=%d broken closes=%d healthy calls=%d", launches, broken.closes, healthy.calls)
	}
	s.Close()
}

func TestSessionCloseWaitsForCapture(t *testing.T) {
	b := &fakeBrowser{started: make(chan struct{}), release: make(chan struct{})}
	s := &BrowserSession{launch: func(context.Context, capture.Options) (browser, error) { return b, nil }}
	done := make(chan struct{})
	go func() { defer close(done); _, _ = s.Capture(context.Background(), "x") }()
	<-b.started
	closed := make(chan struct{})
	go func() { s.Close(); close(closed) }()
	select {
	case <-closed:
		t.Fatal("closed while capture running")
	case <-time.After(20 * time.Millisecond):
	}
	close(b.release)
	<-done
	<-closed
	if b.closes != 1 {
		t.Fatalf("closed %d times", b.closes)
	}
}

func TestBrowserOptionsKeepExtensionVisible(t *testing.T) {
	for _, mode := range []string{"", capture.ArchiveModeAuto, capture.ArchiveModeExtension} {
		cfg := config.Config{Headless: true, CaptureArchive: mode}
		if BrowserOptions(cfg).Headless {
			t.Errorf("mode %q must use a visible browser", mode)
		}
	}
	if !BrowserOptions(config.Config{Headless: true, CaptureArchive: capture.ArchiveModeEmbedded}).Headless {
		t.Fatal("embedded mode should honor headless")
	}
}
