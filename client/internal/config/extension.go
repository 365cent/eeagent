package config

import (
	"fmt"
	"path/filepath"
	"strings"

	"eea/capture/internal/capture"
)

// AbsUserDataDir resolves user_data_dir relative to the directory that holds config.json.
func (c Config) AbsUserDataDir(configDir string) (string, error) {
	p := strings.TrimSpace(c.UserDataDir)
	if p == "" {
		p = Default().UserDataDir
	}
	if !filepath.IsAbs(p) {
		p = filepath.Join(configDir, p)
	}
	return filepath.Abs(p)
}

// EnsureSingleFileExtension resolves bundled or staged SingleFile for --load-extension.
// It updates cfg.SingleFileExtensionPath when staging succeeds. Call before the first URL capture.
func EnsureSingleFileExtension(configDir string, cfg *Config) error {
	archive := strings.TrimSpace(cfg.CaptureArchive)
	if archive == capture.ArchiveModeEmbedded {
		return nil
	}
	if archive == "" {
		archive = Default().CaptureArchive
	}
	if cfg.SingleFileExtensionPath == "" {
		if bundled := capture.FirstBundledExtensionRoot(configDir); bundled != "" {
			cfg.SingleFileExtensionPath = bundled
		}
	}
	profile, err := cfg.AbsUserDataDir(configDir)
	if err != nil {
		return err
	}
	stageDir := filepath.Join(filepath.Dir(profile), "extensions", "singlefile")
	path, err := capture.PrepareSingleFileExtension(stageDir, cfg.CaptureEngine, cfg.SingleFileExtensionPath)
	if err != nil {
		if archive == capture.ArchiveModeExtension {
			return fmt.Errorf("SingleFile 扩展未就绪（采集时会自动加载到专用浏览器，无需在系统浏览器里手动安装）: %w", err)
		}
		return nil
	}
	cfg.SingleFileExtensionPath = path
	return nil
}
