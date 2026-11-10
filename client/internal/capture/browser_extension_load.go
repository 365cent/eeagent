package capture

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// BlocksCommandLineExtensionLoad reports whether Chromium builds that disallow
// --load-extension (Google Chrome stable) would ignore extension staging.
func BlocksCommandLineExtensionLoad(exe string) bool {
	return blocksCommandLineExtensionLoad(exe)
}

func blocksCommandLineExtensionLoad(exe string) bool {
	lower := strings.ToLower(filepath.Clean(exe))
	if strings.Contains(lower, "chromium") ||
		strings.Contains(lower, "chrome for testing") ||
		strings.Contains(lower, "microsoft edge") ||
		strings.HasSuffix(lower, "msedge.exe") {
		return false
	}
	if strings.Contains(lower, "google chrome") {
		return true
	}
	if strings.HasSuffix(lower, "chrome.exe") &&
		(strings.Contains(lower, `google\chrome`) || strings.Contains(lower, "google/chrome")) {
		return true
	}
	return false
}

// ResolveBrowserForExtension picks an executable that supports --load-extension.
// When capture_engine is chrome but only Google Chrome stable is installed, Edge
// is tried automatically so SingleFile can load in automation profiles.
func ResolveBrowserForExtension(engine, explicit string) (string, error) {
	if strings.TrimSpace(explicit) != "" {
		if _, err := os.Stat(explicit); err != nil {
			return "", fmt.Errorf("browser_path: %w", err)
		}
		if blocksCommandLineExtensionLoad(explicit) {
			return "", fmt.Errorf(
				"%s blocks command-line extension loading; set capture_engine to edge, install Chromium/Google Chrome for Testing, or set browser_path to Microsoft Edge",
				explicit,
			)
		}
		return explicit, nil
	}
	engine = strings.ToLower(strings.TrimSpace(engine))
	if engine == "" {
		engine = "edge"
	}

	var candidates []string
	if engine == "chrome" {
		chrome, err := platformBrowserCandidates("chrome")
		if err != nil {
			return "", err
		}
		for _, c := range chrome {
			if c != "" && !blocksCommandLineExtensionLoad(c) {
				candidates = append(candidates, c)
			}
		}
		edge, err := platformBrowserCandidates("edge")
		if err != nil {
			return "", err
		}
		candidates = append(candidates, edge...)
	} else {
		names, err := platformBrowserCandidates(engine)
		if err != nil {
			return "", err
		}
		candidates = names
	}
	for _, c := range candidates {
		if c == "" {
			continue
		}
		if _, err := os.Stat(c); err == nil {
			return c, nil
		}
	}
	if engine == "chrome" {
		return "", fmt.Errorf(
			"no browser found that allows --load-extension (Google Chrome stable blocks it); install Microsoft Edge or set capture_engine to edge",
		)
	}
	return "", fmt.Errorf("no %s executable found; set browser_path in config.json", engine)
}
