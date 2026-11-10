package main

import (
	"os"
	"path/filepath"
)

// resolveConfigDir picks the directory that holds config.json: cwd first, then
// the macOS .app Resources folder or the executable directory.
func resolveConfigDir() (string, error) {
	if wd, err := os.Getwd(); err == nil {
		if _, err := os.Stat(filepath.Join(wd, "config.json")); err == nil {
			return wd, nil
		}
		if _, err := os.Stat(filepath.Join(wd, "config.example.json")); err == nil {
			return wd, nil
		}
	}
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}
	macOS := filepath.Clean(filepath.Join(filepath.Dir(exe), "..", "Resources"))
	if _, err := os.Stat(filepath.Join(macOS, "config.json")); err == nil {
		return macOS, nil
	}
	exeDir := filepath.Dir(exe)
	if _, err := os.Stat(filepath.Join(exeDir, "config.json")); err == nil {
		return exeDir, nil
	}
	if wd, err := os.Getwd(); err == nil {
		return wd, nil
	}
	return exeDir, nil
}
