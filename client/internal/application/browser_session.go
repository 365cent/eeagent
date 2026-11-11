package application

import (
	"context"
	"errors"
	"strings"
	"sync"

	"eea/capture/internal/capture"
)

type browser interface {
	Capture(context.Context, string) (*capture.Archive, error)
	Close() error
}

type browserLauncher func(context.Context, capture.Options) (browser, error)

// BrowserSession lazily launches one browser and waits for active captures
// before closing or replacing it. Launch failures are not cached.
type BrowserSession struct {
	mu       sync.RWMutex
	browser  browser
	opts     capture.Options
	launch   browserLauncher
	closed   bool
	gateOnce sync.Once
	gate     chan struct{}
}

func NewBrowserSession(opts capture.Options) *BrowserSession {
	return &BrowserSession{opts: opts, launch: func(ctx context.Context, opts capture.Options) (browser, error) { return capture.Launch(ctx, opts) }}
}

func (s *BrowserSession) Capture(ctx context.Context, url string) (*capture.Archive, error) {
	// SingleFile uses shared browser state and its fallback selects the active
	// tab. Serializing captures avoids cross-tab evidence and state races;
	// uploads and server polling may still proceed concurrently.
	s.gateOnce.Do(func() { s.gate = make(chan struct{}, 1) })
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case s.gate <- struct{}{}:
	}
	defer func() { <-s.gate }()
	for attempt := 0; attempt < 2; attempt++ {
		used, archive, err := s.captureOnce(ctx, url)
		if err == nil || attempt == 1 || !needsBrowserReset(err) {
			return archive, err
		}
		s.mu.Lock()
		if used != nil && s.browser == used {
			_ = s.browser.Close()
			s.browser = nil
		}
		s.mu.Unlock()
	}
	panic("unreachable")
}

func (s *BrowserSession) captureOnce(ctx context.Context, url string) (browser, *capture.Archive, error) {
	for {
		s.mu.RLock()
		if s.closed {
			s.mu.RUnlock()
			return nil, nil, errors.New("browser session is closed")
		}
		if s.browser != nil {
			b := s.browser
			archive, err := b.Capture(ctx, url)
			s.mu.RUnlock()
			return b, archive, err
		}
		s.mu.RUnlock()
		s.mu.Lock()
		if s.closed {
			s.mu.Unlock()
			return nil, nil, errors.New("browser session is closed")
		}
		if s.browser == nil {
			b, err := s.launch(ctx, s.opts)
			if err != nil {
				s.mu.Unlock()
				return nil, nil, err
			}
			s.browser = b
		}
		s.mu.Unlock()
	}
}

func needsBrowserReset(err error) bool {
	msg := err.Error()
	if strings.Contains(msg, "prepare article images") {
		return false
	}
	return strings.Contains(msg, "content-script capture") ||
		strings.Contains(msg, "singlefile content execution context") ||
		strings.Contains(msg, "singlefile extension did not load") ||
		strings.Contains(msg, "service worker not found")
}

// Close is idempotent and waits for in-flight captures to finish.
func (s *BrowserSession) Close() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.closed = true
	if s.browser != nil {
		_ = s.browser.Close()
		s.browser = nil
	}
}
