package capture

import (
	"fmt"
	"path/filepath"
	"strings"
)

// EnsureSingleFileExtension resolves bundled or staged SingleFile for --load-extension.
// It updates *singleFileExtensionPath when staging succeeds. Call before the first URL capture.
func EnsureSingleFileExtension(
	configDir, userDataDir, captureArchive, captureEngine string,
	singleFileExtensionPath *string,
) error {
	archive := strings.TrimSpace(captureArchive)
	if archive == ArchiveModeEmbedded {
		return nil
	}
	if archive == "" {
		archive = ArchiveModeExtension
	}
	if singleFileExtensionPath != nil && *singleFileExtensionPath == "" {
		if bundled := FirstBundledExtensionRoot(configDir); bundled != "" {
			*singleFileExtensionPath = bundled
		}
	}
	profile, err := absUserDataDir(configDir, userDataDir)
	if err != nil {
		return err
	}
	stageDir := filepath.Join(filepath.Dir(profile), "extensions", "singlefile")
	extPath := ""
	if singleFileExtensionPath != nil {
		extPath = *singleFileExtensionPath
	}
	path, err := PrepareSingleFileExtension(stageDir, captureEngine, extPath)
	if err != nil {
		if archive == ArchiveModeExtension {
			return fmt.Errorf("SingleFile 扩展未就绪（采集时会自动加载到专用浏览器，无需在系统浏览器里手动安装）: %w", err)
		}
		return nil
	}
	if singleFileExtensionPath != nil {
		*singleFileExtensionPath = path
	}
	return nil
}

func absUserDataDir(configDir, userDataDir string) (string, error) {
	p := strings.TrimSpace(userDataDir)
	if p == "" {
		p = filepath.Join("data", "browser-profile")
	}
	if !filepath.IsAbs(p) {
		p = filepath.Join(configDir, p)
	}
	return filepath.Abs(p)
}
