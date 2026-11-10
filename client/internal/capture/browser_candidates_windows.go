//go:build windows

package capture

import (
	"fmt"
	"os"
	"path/filepath"
)

func platformBrowserCandidates(engine string) ([]string, error) {
	switch engine {
	case "edge":
		return []string{
			`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
			`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
		}, nil
	case "chrome":
		return []string{
			filepath.Join(os.Getenv("LOCALAPPDATA"), `Google\Chrome for Testing\Application\chrome.exe`),
			`C:\Program Files\Google\Chrome for Testing\Application\chrome.exe`,
			`C:\Program Files\Google\Chrome\Application\chrome.exe`,
			`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
			filepath.Join(os.Getenv("LOCALAPPDATA"), `Google\Chrome\Application\chrome.exe`),
		}, nil
	default:
		return nil, fmt.Errorf("unknown capture_engine %q (want edge or chrome)", engine)
	}
}
