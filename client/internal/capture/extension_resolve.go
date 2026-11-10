package capture

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// chromeWebStoreSingleFileID is the Chromium extension id when installed from
// Chrome Web Store or Edge Add-ons (same package).
const chromeWebStoreSingleFileID = "mpiodijhokgodhhofbcjdecpffjipkle"

type extensionManifest struct {
	Name              string `json:"name"`
	ManifestVersion   int    `json:"manifest_version"`
	ShortName         string `json:"short_name"`
	BrowserAction     any    `json:"browser_action"`
	Action            any    `json:"action"`
	Background        any    `json:"background"`
	Version           string `json:"version"`
}

func isSingleFileManifest(data []byte) bool {
	raw := strings.ToLower(string(data))
	if strings.Contains(raw, "single-file-background") || strings.Contains(raw, "singlefile") {
		return true
	}
	var m extensionManifest
	if err := json.Unmarshal(data, &m); err != nil {
		return false
	}
	name := strings.ToLower(m.Name + " " + m.ShortName)
	return strings.Contains(name, "singlefile") || strings.Contains(name, "single file")
}

// ResolveSingleFileExtension returns an unpacked extension directory to pass to
// --load-extension. When path is non-empty it must contain manifest.json.
func ResolveSingleFileExtension(path, engine string) (string, error) {
	if strings.TrimSpace(path) != "" {
		abs, err := filepath.Abs(path)
		if err != nil {
			return "", err
		}
		if err := assertExtensionRoot(abs); err != nil {
			return "", err
		}
		return abs, nil
	}
	if p, err := discoverSingleFileForEngine(engine); err == nil {
		return p, nil
	}
	alt := "chrome"
	if engine == "chrome" {
		alt = "edge"
	}
	if p, err := discoverSingleFileForEngine(alt); err == nil {
		return p, nil
	}
	extRoot, _ := hostProfileExtensionsDir(engine)
	return "", fmt.Errorf("SingleFile not found under %s (install the browser extension or set singlefile_extension_path)", extRoot)
}

func discoverSingleFileForEngine(engine string) (string, error) {
	extRoot, err := hostProfileExtensionsDir(engine)
	if err != nil {
		return "", err
	}
	return DiscoverInstalledSingleFile(extRoot)
}

func assertExtensionRoot(dir string) error {
	manifestPath := filepath.Join(dir, "manifest.json")
	data, err := os.ReadFile(manifestPath)
	if err != nil {
		return fmt.Errorf("read extension manifest: %w", err)
	}
	if !isSingleFileManifest(data) {
		return fmt.Errorf("%s is not a SingleFile extension (manifest %s)", dir, manifestPath)
	}
	return nil
}

// DiscoverInstalledSingleFile scans a browser profile's Extensions folder for SingleFile.
func DiscoverInstalledSingleFile(profileExtensionsDir string) (string, error) {
	entries, err := os.ReadDir(profileExtensionsDir)
	if err != nil {
		return "", err
	}
	storePath := filepath.Join(profileExtensionsDir, chromeWebStoreSingleFileID)
	if st, err := os.Stat(storePath); err == nil && st.IsDir() {
		if ver, err := newestVersionDir(storePath); err == nil {
			return ver, nil
		}
	}
	var hits []string
	for _, ent := range entries {
		if !ent.IsDir() {
			continue
		}
		extRoot := filepath.Join(profileExtensionsDir, ent.Name())
		ver, err := newestVersionDir(extRoot)
		if err != nil {
			continue
		}
		data, err := os.ReadFile(filepath.Join(ver, "manifest.json"))
		if err != nil || !isSingleFileManifest(data) {
			continue
		}
		hits = append(hits, ver)
	}
	if len(hits) == 0 {
		return "", fmt.Errorf("SingleFile not found under %s (install the Chrome/Edge extension or set singlefile_extension_path)", profileExtensionsDir)
	}
	sort.Strings(hits)
	return hits[len(hits)-1], nil
}

func newestVersionDir(extIDDir string) (string, error) {
	versions, err := os.ReadDir(extIDDir)
	if err != nil {
		return "", err
	}
	var names []string
	for _, v := range versions {
		if v.IsDir() {
			names = append(names, v.Name())
		}
	}
	if len(names) == 0 {
		return "", fmt.Errorf("no versions in %s", extIDDir)
	}
	sort.Strings(names)
	return filepath.Join(extIDDir, names[len(names)-1]), nil
}
