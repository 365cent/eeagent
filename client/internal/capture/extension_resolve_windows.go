//go:build windows

package capture

import (
	"os"
	"path/filepath"
)

func hostProfileExtensionsDir(engine string) (string, error) {
	local := os.Getenv("LOCALAPPDATA")
	if local == "" {
		return "", os.ErrNotExist
	}
	switch engine {
	case "chrome":
		return filepath.Join(local, "Google", "Chrome", "User Data", "Default", "Extensions"), nil
	default:
		return filepath.Join(local, "Microsoft", "Edge", "User Data", "Default", "Extensions"), nil
	}
}
