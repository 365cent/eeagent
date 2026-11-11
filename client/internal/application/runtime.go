// Package application owns the dependencies shared by a capture session.
package application

import (
	"net/http"
	"strings"
	"time"

	"eea/capture/internal/capture"
	"eea/capture/internal/config"
	"eea/capture/internal/httpx"
	"eea/capture/internal/platform"
	"eea/capture/internal/queue"
)

// Runtime owns one API client and browser session for a configuration snapshot.
// Queues are independently created and closed for each batch.
type Runtime struct {
	config     config.Config
	dir        string
	API        *platform.Client
	Browser    *BrowserSession
	PublicHTTP *http.Client
}

func New(cfg config.Config, dir string) *Runtime {
	return &Runtime{config: cfg, dir: dir, API: platform.New(cfg.EffectiveAPIBase(), cfg.MaxUploadMB), Browser: NewBrowserSession(BrowserOptions(cfg)), PublicHTTP: httpx.OutboundClient(15 * time.Minute)}
}

// BrowserOptions applies the same archive-mode settings for GUI and CLI.
func BrowserOptions(cfg config.Config) capture.Options {
	headless := cfg.Headless
	archive := strings.TrimSpace(cfg.CaptureArchive)
	if archive == "" || archive == capture.ArchiveModeExtension || archive == capture.ArchiveModeAuto {
		headless = false
	}
	return capture.Options{
		Engine: cfg.CaptureEngine, BrowserPath: cfg.BrowserPath,
		UserDataDir: cfg.UserDataDir, Headless: headless,
		ArchiveMode: cfg.CaptureArchive, SingleFileExtensionPath: cfg.SingleFileExtensionPath,
		ReadyWait:       time.Duration(cfg.ReadyTimeout) * time.Second,
		InteractiveWait: time.Duration(cfg.InteractiveTimeout) * time.Second,
		MinTextChars:    cfg.MinTextChars,
	}
}

// NewQueue returns an independent queue without transferring browser ownership.
// maxWorkers limits platform-specific concurrency when positive.
func (r *Runtime) NewQueue(maxWorkers int, onUpdate func(queue.Job)) *queue.Queue {
	workers := r.config.MaxParallel
	if maxWorkers > 0 && workers > maxWorkers {
		workers = maxWorkers
	}
	return queue.New(r.Browser, r.API, queue.Options{
		Workers: workers, Retries: 2,
		Timeout:       time.Duration(r.config.TimeoutSec) * time.Second,
		UploadTimeout: time.Duration(r.config.UploadTimeout) * time.Second,
		StateDir:      config.QueueStateDir(r.dir, r.config), OnUpdate: onUpdate,
	})
}

// Close releases session resources after callers have stopped their queues.
func (r *Runtime) Close() {
	r.Browser.Close()
	r.API.CloseIdleConnections()
	r.PublicHTTP.CloseIdleConnections()
}
