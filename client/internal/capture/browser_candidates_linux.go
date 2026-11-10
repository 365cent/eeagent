//go:build linux

package capture

import (
	"fmt"
)

func platformBrowserCandidates(engine string) ([]string, error) {
	switch engine {
	case "edge", "":
		return []string{
			"/usr/bin/microsoft-edge",
			"/usr/bin/microsoft-edge-stable",
			"/snap/bin/edge",
		}, nil
	case "chrome":
		return []string{
			"/usr/bin/google-chrome",
			"/usr/bin/google-chrome-stable",
			"/usr/bin/chromium",
			"/usr/bin/chromium-browser",
			"/snap/bin/chromium",
		}, nil
	default:
		return nil, fmt.Errorf("unknown capture_engine %q (want edge or chrome)", engine)
	}
}
