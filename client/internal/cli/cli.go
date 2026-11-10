// Package cli implements the headless commands of the capture client.
package cli

import (
	"context"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"eea/capture/internal/capture"
	"eea/capture/internal/config"
	"eea/capture/internal/netinfo"
	"eea/capture/internal/importdrain"
	"eea/capture/internal/platform"
	"eea/capture/internal/queue"
)

// Run dispatches a subcommand; it returns a process exit code.
func Run(args []string, out io.Writer, version string) int {
	if len(args) == 0 {
		fmt.Fprintln(out, "usage: capture [upload|doctor|version]")
		return 2
	}
	switch args[0] {
	case "upload":
		return runUpload(args[1:], out)
	case "doctor":
		return runDoctor(args[1:], out)
	case "version":
		fmt.Fprintf(out, "capture %s\n", version)
		return 0
	case "help", "-h", "--help":
		usage(out)
		return 0
	default:
		fmt.Fprintf(out, "unknown command %q\n", args[0])
		usage(out)
		return 2
	}
}

func usage(out io.Writer) {
	fmt.Fprintln(out, `usage:
  capture                       open the capture window
  capture upload --url U [...]  capture live pages and upload them
  capture upload --html F       upload a saved SingleFile HTML (URL read from it)
  capture upload --html F --html-url U   saved HTML with an explicit source URL
  capture upload --file F       upload raw documents
  capture upload --resume       resume persisted unfinished jobs
  capture upload --drain-server   process server URL batches (awaiting_client)
  capture doctor                check browser and API
  capture version`)

}

type stringList []string

func (s *stringList) String() string { return strings.Join(*s, ",") }

func (s *stringList) Set(v string) error {
	*s = append(*s, v)
	return nil
}

type deferredEngine struct {
	opts    capture.Options
	once    sync.Once
	browser *capture.Browser
	err     error
}

func (e *deferredEngine) Capture(ctx context.Context, rawURL string) (*capture.Archive, error) {
	e.once.Do(func() { e.browser, e.err = capture.Launch(context.Background(), e.opts) })
	if e.err != nil {
		return nil, e.err
	}
	return e.browser.Capture(ctx, rawURL)
}

func (e *deferredEngine) Close() {
	if e.browser != nil {
		_ = e.browser.Close()
	}
}

func runUpload(args []string, out io.Writer) int {
	fs := flag.NewFlagSet("upload", flag.ContinueOnError)
	fs.SetOutput(out)
	var urls, files, htmls stringList
	fs.Var(&urls, "url", "page URL to capture now (repeatable)")
	fs.Var(&files, "file", "document path (repeatable)")
	fs.Var(&htmls, "html", "saved SingleFile HTML to upload (repeatable)")
	htmlURL := fs.String("html-url", "", "source URL for a single --html file")
	apiBase := fs.String("api-base", "", "override api_base")
	channel := fs.String("channel", "", "override channel_code")
	resume := fs.Bool("resume", false, "resume persisted unfinished jobs")
	drainServer := fs.Bool("drain-server", false, "claim and capture jobs queued from the web UI URL paste")
	engine := fs.String("engine", "", "edge or chrome")
	browserPath := fs.String("browser-path", "", "explicit browser executable")
	headless := fs.Bool("headless", false, "run the browser headless")
	configDir := fs.String("config-dir", "", "directory holding config.json")
	parallel := fs.Int("parallel", 0, "override max_parallel")
	if err := fs.Parse(args); err != nil {
		return 2
	}
	if len(urls) == 0 && len(files) == 0 && len(htmls) == 0 && !*resume && !*drainServer {
		fmt.Fprintln(out, "nothing to do: pass --url, --html, --file, --drain-server or --resume")
		return 2
	}
	if *htmlURL != "" && len(htmls) != 1 {
		fmt.Fprintln(out, "--html-url needs exactly one --html file")
		return 2
	}

	dir := *configDir
	if dir == "" {
		dir, _ = os.Getwd()
	}
	cfg, err := config.Load(dir)
	if err != nil {
		fmt.Fprintf(out, "config: %v\n", err)
		return 1
	}
	if *apiBase != "" {
		cfg.APIBase = strings.TrimRight(*apiBase, "/")
		cfg.AutoAPI = false
	}
	base := cfg.EffectiveAPIBase()
	if *engine != "" {
		cfg.CaptureEngine = *engine
	}
	if *browserPath != "" {
		cfg.BrowserPath = *browserPath
	}
	if *headless {
		cfg.Headless = true
	}
	if *drainServer {
		cfg.CaptureArchive = capture.ArchiveModeEmbedded
		// Visible browser: many publisher sites reject headless loads (chrome-error://).
		cfg.Headless = false
	}
	if *parallel > 0 {
		cfg.MaxParallel = *parallel
	}
	_ = config.EnsureSingleFileExtension(dir, &cfg)

	api := platform.New(base, cfg.MaxUploadMB)

	engineImpl := &deferredEngine{opts: capture.Options{
		Engine:                  cfg.CaptureEngine,
		BrowserPath:             cfg.BrowserPath,
		UserDataDir:             cfg.UserDataDir,
		Headless:                cfg.Headless,
		ArchiveMode:             cfg.CaptureArchive,
		SingleFileExtensionPath: cfg.SingleFileExtensionPath,
		ReadyWait:               time.Duration(cfg.ReadyTimeout) * time.Second,
		InteractiveWait:         time.Duration(cfg.InteractiveTimeout) * time.Second,
		MinTextChars:            cfg.MinTextChars,
	}}
	defer engineImpl.Close()

	q := queue.New(engineImpl, api, queue.Options{
		Workers:       cfg.MaxParallel,
		Retries:       2,
		Timeout:       time.Duration(cfg.TimeoutSec) * time.Second,
		UploadTimeout: time.Duration(cfg.UploadTimeout) * time.Second,
		StateDir:      config.QueueStateDir(dir, cfg),
	})
	if err := q.Restore(); err != nil {
		fmt.Fprintf(out, "queue restore: %v\n", err)
		return 1
	}
	current := make(map[int]bool)
	for _, job := range q.Snapshot() {
		if job.Status == queue.StatusQueued || job.Status == queue.StatusRunning {
			current[job.ID] = true
		}
	}
	q.Start()
	if *drainServer {
		ctx := context.Background()
		for round := 0; round < 500; round++ {
			okN, failN := importdrain.DrainAwaitingJobs(ctx, out, api, engineImpl, *channel)
			if okN == 0 && failN == 0 {
				break
			}
			time.Sleep(2 * time.Second)
		}
	}
	for _, u := range urls {
		current[q.SubmitURL(strings.TrimSpace(u), *channel)] = true
	}
	for _, f := range files {
		abs, err := filepath.Abs(strings.TrimSpace(f))
		if err != nil {
			fmt.Fprintf(out, "file %s: %v\n", f, err)
			continue
		}
		current[q.SubmitFile(abs)] = true
	}
	for _, f := range htmls {
		abs, err := filepath.Abs(strings.TrimSpace(f))
		if err != nil {
			fmt.Fprintf(out, "html %s: %v\n", f, err)
			continue
		}
		current[q.SubmitArchive(abs, *htmlURL)] = true
	}
	q.Wait()
	allJobs := q.Snapshot()
	q.Close()
	jobs := make([]queue.Job, 0, len(current))
	for _, job := range allJobs {
		if current[job.ID] {
			jobs = append(jobs, job)
		}
	}

	failed := 0
	for _, j := range jobs {
		target := j.URL
		if j.Kind == queue.KindFile || j.Kind == queue.KindArchive {
			target = filepath.Base(j.Path)
			if j.Kind == queue.KindArchive && j.URL != "" {
				target += " → " + j.URL
			}
		}
		switch j.Status {
		case queue.StatusDone:
			fmt.Fprintf(out, "ok    %-8s %s  %s\n", j.SignalID, humanSize(j.Bytes), target)
		default:
			failed++
			fmt.Fprintf(out, "FAIL  %s  %s\n", target, j.Err)
		}
	}
	fmt.Fprintf(out, "%d ok, %d failed\n", len(jobs)-failed, failed)
	if failed > 0 {
		return 1
	}
	return 0
}

func runDoctor(args []string, out io.Writer) int {
	fs := flag.NewFlagSet("doctor", flag.ContinueOnError)
	fs.SetOutput(out)
	configDir := fs.String("config-dir", "", "directory holding config.json")
	apiBase := fs.String("api-base", "", "override api_base")
	if err := fs.Parse(args); err != nil {
		return 2
	}
	dir := *configDir
	if dir == "" {
		dir, _ = os.Getwd()
	}
	cfg, err := config.Load(dir)
	if err != nil {
		fmt.Fprintf(out, "config: %v\n", err)
		return 1
	}
	if *apiBase != "" {
		cfg.APIBase = strings.TrimRight(*apiBase, "/")
		cfg.AutoAPI = false
	}
	base := cfg.EffectiveAPIBase()
	fmt.Fprintf(out, "api_base      %s\n", base)
	fmt.Fprintf(out, "auto_api      %v (lan %s)\n", cfg.AutoAPI, orDash(netinfo.PrimaryIPv4()))
	var exe string
	var browserErr error
	if cfg.CaptureArchive == capture.ArchiveModeExtension || cfg.CaptureArchive == capture.ArchiveModeAuto || cfg.CaptureArchive == "" {
		exe, browserErr = capture.ResolveBrowserForExtension(cfg.CaptureEngine, cfg.BrowserPath)
	} else {
		exe, browserErr = capture.ResolveBrowser(cfg.CaptureEngine, cfg.BrowserPath)
	}
	if browserErr != nil {
		fmt.Fprintf(out, "browser       missing (%v)\n", browserErr)
	} else {
		fmt.Fprintf(out, "browser       %s\n", exe)
		if capture.BlocksCommandLineExtensionLoad(cfg.BrowserPath) && cfg.BrowserPath != "" {
			fmt.Fprintln(out, "browser_note  Google Chrome stable blocks --load-extension; edge or Chromium required")
		} else if strings.EqualFold(cfg.CaptureEngine, "chrome") && capture.BlocksCommandLineExtensionLoad(exe) {
			fmt.Fprintln(out, "browser_note  use capture_engine edge for SingleFile extension loading")
		}
	}
	profile, _ := filepath.Abs(cfg.UserDataDir)
	fmt.Fprintf(out, "profile       %s\n", profile)
	fmt.Fprintf(out, "parallel      %d\n", cfg.MaxParallel)

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	if err := platform.New(base, cfg.MaxUploadMB).Reachable(ctx); err != nil {
		fmt.Fprintf(out, "backend       unreachable (%v)\n", err)
		return 1
	}
	fmt.Fprintln(out, "backend       ok")
	ok, err := platform.New(base, cfg.MaxUploadMB).SupportsCapture(ctx)
	if err != nil || !ok {
		fmt.Fprintln(out, "capture       endpoint missing (backend W2 未实现)")
		return 1
	}
	fmt.Fprintln(out, "capture       ok")

	fmt.Fprintf(out, "capture_archive %s\n", cfg.CaptureArchive)
	stageDir := filepath.Join(filepath.Dir(profile), "extensions", "singlefile")
	switch cfg.CaptureArchive {
	case capture.ArchiveModeEmbedded:
		fmt.Fprintln(out, "singlefile    embedded core (no browser extension)")
	case capture.ArchiveModeExtension, capture.ArchiveModeAuto, "":
		if path, err := capture.PrepareSingleFileExtension(stageDir, cfg.CaptureEngine, cfg.SingleFileExtensionPath); err != nil {
			fmt.Fprintf(out, "singlefile    not ready (%v)\n", err)
			if cfg.CaptureArchive == capture.ArchiveModeExtension {
				return 1
			}
		} else {
			fmt.Fprintf(out, "singlefile    %s\n", path)
		}
	}
	return 0
}

func orDash(s string) string {
	if s == "" {
		return "(none)"
	}
	return s
}

func humanSize(n int) string {
	switch {
	case n <= 0:
		return "-"
	case n < 1024:
		return fmt.Sprintf("%dB", n)
	case n < 1<<20:
		return fmt.Sprintf("%.0fKB", float64(n)/1024)
	default:
		return fmt.Sprintf("%.1fMB", float64(n)/(1<<20))
	}
}
