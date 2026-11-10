package capture

import (
	"os"
	"path/filepath"
	"runtime"
)

// BundledSingleFileRoots returns candidate directories that may ship with the client
// (next to config.json, the executable, or a macOS .app Resources folder).
func BundledSingleFileRoots(configDir string) []string {
	configDir = filepath.Clean(configDir)
	var roots []string
	add := func(p string) {
		if p == "" {
			return
		}
		p = filepath.Clean(p)
		for _, existing := range roots {
			if existing == p {
				return
			}
		}
		roots = append(roots, p)
	}
	add(filepath.Join(configDir, "data", "extensions", "singlefile"))
	add(filepath.Join(configDir, "extensions", "singlefile"))
	if exe, err := os.Executable(); err == nil {
		exeDir := filepath.Dir(exe)
		add(filepath.Join(exeDir, "data", "extensions", "singlefile"))
		add(filepath.Join(exeDir, "extensions", "singlefile"))
		if runtime.GOOS == "darwin" {
			add(filepath.Clean(filepath.Join(exeDir, "..", "Resources", "data", "extensions", "singlefile")))
			add(filepath.Clean(filepath.Join(exeDir, "..", "Resources", "extensions", "singlefile")))
		}
	}
	return roots
}

// FirstBundledExtensionRoot returns the first bundled tree that looks like a complete SingleFile unpack.
func FirstBundledExtensionRoot(configDir string) string {
	for _, root := range BundledSingleFileRoots(configDir) {
		if err := assertExtensionRoot(root); err != nil {
			continue
		}
		if err := extensionStageComplete(root); err != nil {
			continue
		}
		if abs, err := filepath.Abs(root); err == nil {
			return abs
		}
		return root
	}
	return ""
}
