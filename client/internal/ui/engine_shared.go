package ui

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"eea/capture/internal/capture"
	"eea/capture/internal/config"
)

func bounded(text string, lo, hi int) (int, error) {
	n, err := strconv.Atoi(strings.TrimSpace(text))
	if err != nil || n < lo || n > hi {
		return 0, fmt.Errorf("out of range")
	}
	return n, nil
}

func engineOptions(cfg config.Config) capture.Options {
	headless := cfg.Headless
	archive := strings.TrimSpace(cfg.CaptureArchive)
	if archive == "" || archive == capture.ArchiveModeExtension || archive == capture.ArchiveModeAuto {
		headless = false
	}
	return capture.Options{
		Engine:                  cfg.CaptureEngine,
		BrowserPath:             cfg.BrowserPath,
		UserDataDir:             cfg.UserDataDir,
		Headless:                headless,
		ArchiveMode:             cfg.CaptureArchive,
		SingleFileExtensionPath: cfg.SingleFileExtensionPath,
		ReadyWait:               time.Duration(cfg.ReadyTimeout) * time.Second,
		InteractiveWait:         time.Duration(cfg.InteractiveTimeout) * time.Second,
		MinTextChars:            cfg.MinTextChars,
	}
}

type lazyEngine struct {
	mu   sync.Mutex
	b    *capture.Browser
	opts capture.Options
}

func (l *lazyEngine) Capture(ctx context.Context, url string) (*capture.Archive, error) {
	archive, err := l.captureOnce(ctx, url)
	if err == nil || !captureNeedsBrowserReset(err) {
		return archive, err
	}
	l.mu.Lock()
	if l.b != nil {
		_ = l.b.Close()
		l.b = nil
	}
	l.mu.Unlock()
	return l.captureOnce(ctx, url)
}

func captureNeedsBrowserReset(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	if strings.Contains(msg, "prepare article images") {
		return false
	}
	return strings.Contains(msg, "content-script capture") ||
		strings.Contains(msg, "singlefile content execution context") ||
		strings.Contains(msg, "singlefile extension did not load") ||
		strings.Contains(msg, "service worker not found")
}

func (l *lazyEngine) captureOnce(ctx context.Context, url string) (*capture.Archive, error) {
	l.mu.Lock()
	if l.b == nil {
		b, err := capture.Launch(ctx, l.opts)
		if err != nil {
			l.mu.Unlock()
			return nil, err
		}
		l.b = b
	}
	b := l.b
	l.mu.Unlock()
	return b.Capture(ctx, url)
}

func (l *lazyEngine) close() {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.b != nil {
		_ = l.b.Close()
		l.b = nil
	}
}
