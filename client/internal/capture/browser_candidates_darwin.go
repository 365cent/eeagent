//go:build darwin

package capture

import (
	"fmt"
	"os"
	"path/filepath"
)

func platformBrowserCandidates(engine string) ([]string, error) {
	switch engine {
	case "edge", "":
		return []string{
			"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
			filepath.Join(os.Getenv("HOME"), "Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"),
		}, nil
	case "chrome":
		return []string{
			"/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
			filepath.Join(os.Getenv("HOME"), "Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"),
			"/Applications/Chromium.app/Contents/MacOS/Chromium",
			"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			filepath.Join(os.Getenv("HOME"), "Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
		}, nil
	default:
		return nil, fmt.Errorf("unknown capture_engine %q (want edge or chrome)", engine)
	}
}
