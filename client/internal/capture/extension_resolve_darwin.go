//go:build darwin

package capture

import (
	"os"
	"path/filepath"
)

func hostProfileExtensionsDir(engine string) (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	switch engine {
	case "chrome":
		return filepath.Join(home, "Library", "Application Support", "Google", "Chrome", "Default", "Extensions"), nil
	default:
		return filepath.Join(home, "Library", "Application Support", "Microsoft Edge", "Default", "Extensions"), nil
	}
}
