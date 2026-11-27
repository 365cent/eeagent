package main

import (
	"os"
	"runtime"
	"strings"
	"time"

	"eea/capture/internal/capture"
	"eea/capture/internal/config"
)

// writeStartupLog records one line per launch fact into path.
//
// The release binary is a GUI app with no console, so "it does not work on my
// colleague's PC" left nothing to inspect. This file names the version, the
// directories actually used, the browser that was found and any startup error;
// it never contains the API token.
func writeStartupLog(path, configDir, dataRoot string, cfg config.Config, loadErr, fatal error) {
	lines := []string{
		time.Now().Format(time.RFC3339) + "  capture " + version + "  (" + runtime.GOOS + "/" + runtime.GOARCH + ")",
		"config_dir=" + configDir,
		"data_dir=" + orDash(dataRoot),
		"user_data_dir=" + cfg.UserDataDir,
		"queue_dir=" + cfg.QueueDir,
		"engine=" + orDash(cfg.CaptureEngine),
		"browser_path=" + orDash(cfg.BrowserPath),
		"api_base=" + orDash(cfg.EffectiveAPIBase()),
		"capture_archive=" + orDash(cfg.CaptureArchive),
	}
	if exe, err := capture.ResolveBrowser(cfg.CaptureEngine, cfg.BrowserPath); err == nil {
		lines = append(lines, "browser="+exe)
	} else {
		lines = append(lines, "browser_error="+err.Error())
	}
	if loadErr != nil {
		lines = append(lines, "config_error="+loadErr.Error())
	}
	if cfg.StartupNotice != "" {
		lines = append(lines, "notice="+cfg.StartupNotice)
	}
	if fatal != nil {
		lines = append(lines, "fatal="+fatal.Error())
	}
	_ = os.WriteFile(path, []byte(strings.Join(lines, "\n")+"\n"), 0o644)
}

func orDash(value string) string {
	if strings.TrimSpace(value) == "" {
		return "-"
	}
	return value
}
