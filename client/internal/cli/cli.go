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
	"time"

	"eea/capture/internal/capture"
	"eea/capture/internal/config"
	"eea/capture/internal/netinfo"
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
  capture doctor                check browser and API
  capture version`)

}

type stringList []string

func (s *stringList) String() string { return strings.Join(*s, ",") }

func (s *stringList) Set(v string) error {
	*s = append(*s, v)
	return nil
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
	engine := fs.String("engine", "", "edge or chrome")
	browserPath := fs.String("browser-path", "", "explicit browser executable")
	headless := fs.Bool("headless", false, "run the browser headless")
	configDir := fs.String("config-dir", "", "directory holding config.json")
	parallel := fs.Int("parallel", 0, "override max_parallel")
	if err := fs.Parse(args); err != nil {
		return 2
	}
	if len(urls) == 0 && len(files) == 0 && len(htmls) == 0 {
		fmt.Fprintln(out, "nothing to do: pass --url, --html or --file")
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
	if *parallel > 0 {
		cfg.MaxParallel = *parallel
	}

	api := platform.New(base, cfg.MaxUploadMB)

	var engineImpl queue.CaptureEngine
	if len(urls) > 0 {
		browser, err := capture.Launch(context.Background(), capture.Options{
			Engine:          cfg.CaptureEngine,
			BrowserPath:     cfg.BrowserPath,
			UserDataDir:     cfg.UserDataDir,
			Headless:        cfg.Headless,
			ReadyWait:       time.Duration(cfg.ReadyTimeout) * time.Second,
			InteractiveWait: time.Duration(cfg.InteractiveTimeout) * time.Second,
			MinTextChars:    cfg.MinTextChars,
		})
		if err != nil {
			fmt.Fprintf(out, "browser: %v\n", err)
			return 1
		}
		defer browser.Close()
		engineImpl = browser
	}

	q := queue.New(engineImpl, api, queue.Options{
		Workers:       cfg.MaxParallel,
		Retries:       2,
		Timeout:       time.Duration(cfg.TimeoutSec) * time.Second,
		UploadTimeout: time.Duration(cfg.UploadTimeout) * time.Second,
	})
	q.Start()
	for _, u := range urls {
		q.SubmitURL(strings.TrimSpace(u), *channel)
	}
	for _, f := range files {
		abs, err := filepath.Abs(strings.TrimSpace(f))
		if err != nil {
			fmt.Fprintf(out, "file %s: %v\n", f, err)
			continue
		}
		q.SubmitFile(abs)
	}
	for _, f := range htmls {
		abs, err := filepath.Abs(strings.TrimSpace(f))
		if err != nil {
			fmt.Fprintf(out, "html %s: %v\n", f, err)
			continue
		}
		q.SubmitArchive(abs, *htmlURL)
	}
	q.Wait()
	jobs := q.Snapshot()
	q.Close()

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
	exe, err := capture.ResolveBrowser(cfg.CaptureEngine, cfg.BrowserPath)
	if err != nil {
		fmt.Fprintf(out, "browser       missing (%v)\n", err)
	} else {
		fmt.Fprintf(out, "browser       %s\n", exe)
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
