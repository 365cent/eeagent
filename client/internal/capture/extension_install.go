package capture

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// PrepareSingleFileExtension stages an unpacked SingleFile tree for --load-extension.
// explicitPath, when set, must already be a valid extension root. Otherwise the
// extension is copied from the host browser install into stageDir (created on demand).
func PrepareSingleFileExtension(stageDir, engine, explicitPath string) (string, error) {
	if explicitPath = strings.TrimSpace(explicitPath); explicitPath != "" {
		abs, err := filepath.Abs(explicitPath)
		if err != nil {
			return "", err
		}
		if err := assertExtensionRoot(abs); err != nil {
			return "", err
		}
		return abs, nil
	}
	if stageDir != "" {
		if abs, err := filepath.Abs(stageDir); err == nil {
			stageDir = abs
		}
		if err := assertExtensionRoot(stageDir); err == nil {
			if extensionStageComplete(stageDir) == nil {
				return stageDir, nil
			}
		}
	}
	src, err := ResolveSingleFileExtension("", engine)
	if err != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 4*time.Minute)
		defer cancel()
		if stageDir != "" {
			if dlErr := downloadAndUnpackSingleFileCRX(ctx, stageDir); dlErr == nil {
				return stageDir, nil
			}
		}
		return "", fmt.Errorf(
			"SingleFile is not installed for %s (install the browser extension, run scripts/vendor-singlefile-extension.sh, or allow CRX download): %w",
			engine,
			err,
		)
	}
	if stageDir == "" {
		return src, nil
	}
	if err := os.MkdirAll(filepath.Dir(stageDir), 0o755); err != nil {
		return "", err
	}
	if err := copyExtensionTree(src, stageDir); err != nil {
		return "", fmt.Errorf("stage SingleFile extension to %s: %w", stageDir, err)
	}
	if err := assertExtensionRoot(stageDir); err != nil {
		return "", err
	}
	if err := extensionStageComplete(stageDir); err != nil {
		return "", err
	}
	abs, err := filepath.Abs(stageDir)
	if err != nil {
		return stageDir, nil
	}
	return abs, nil
}

func extensionStageComplete(dir string) error {
	bg := filepath.Join(dir, "lib", "single-file-extension-background.js")
	if _, err := os.Stat(bg); err != nil {
		return fmt.Errorf("extension stage incomplete (missing %s)", bg)
	}
	return nil
}

func copyExtensionTree(src, dst string) error {
	if err := os.RemoveAll(dst); err != nil && !os.IsNotExist(err) {
		return err
	}
	return filepath.WalkDir(src, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)
		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return err
		}
		return copyFile(path, target)
	})
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}
