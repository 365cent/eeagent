// Package config loads the capture client settings.
package config

import (
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"eea/capture/internal/netinfo"
)

// Config mirrors config.json. Zero values are replaced by defaults on load.
type Config struct {
	APIBase            string `json:"api_base"`
	AutoAPI            bool   `json:"auto_api"` // follow the LAN address when api_base is empty/loopback
	CaptureEngine      string `json:"capture_engine"`
	BrowserPath        string `json:"browser_path"`
	UserDataDir        string `json:"user_data_dir"`
	QueueDir           string `json:"queue_dir"`
	MaxParallel        int    `json:"max_parallel"`
	MaxUploadMB        int    `json:"max_upload_mb"`
	TimeoutSec         int    `json:"timeout_sec"`
	UploadTimeout      int    `json:"upload_timeout_sec"`
	ReadyTimeout       int    `json:"page_ready_timeout_sec"`
	InteractiveTimeout int    `json:"interactive_timeout_sec"`
	MinTextChars       int    `json:"min_text_chars"`
	Headless           bool   `json:"headless"`
	// capture_archive: auto | extension | embedded (auto prefers the store extension).
	CaptureArchive            string `json:"capture_archive"`
	SingleFileExtensionPath   string `json:"singlefile_extension_path"`
	CACertPath                string `json:"ca_cert_path"`
	AuthTokenEnv              string `json:"auth_token_env"`
	AuthTokenFile             string `json:"auth_token_file"`
}

// Default returns the settings used when config.json is absent.
func Default() Config {
	return Config{
		APIBase:            "",
		AutoAPI:            true,
		CaptureEngine:      "edge",
		UserDataDir:        filepath.Join("data", "browser-profile"),
		QueueDir:           filepath.Join("data", "capture-queue"),
		MaxParallel:        2,
		MaxUploadMB:        120,
		TimeoutSec:         150,
		UploadTimeout:      900,
		ReadyTimeout:       25,
		InteractiveTimeout: 180,
		MinTextChars:       10,
		CaptureArchive:     "extension",
	}
}

func (c *Config) applyDefaults() {
	d := Default()
	if c.APIBase == "" {
		c.APIBase = d.APIBase
	}
	if c.CaptureEngine == "" {
		c.CaptureEngine = d.CaptureEngine
	}
	if c.UserDataDir == "" {
		c.UserDataDir = d.UserDataDir
	}
	if c.QueueDir == "" {
		c.QueueDir = d.QueueDir
	}
	if c.MaxParallel <= 0 {
		c.MaxParallel = d.MaxParallel
	}
	if c.MaxUploadMB <= 0 {
		c.MaxUploadMB = d.MaxUploadMB
	}
	if c.TimeoutSec <= 0 {
		c.TimeoutSec = d.TimeoutSec
	}
	if c.UploadTimeout <= 0 {
		c.UploadTimeout = d.UploadTimeout
	}
	if c.ReadyTimeout <= 0 {
		c.ReadyTimeout = d.ReadyTimeout
	}
	if c.InteractiveTimeout <= 0 {
		c.InteractiveTimeout = d.InteractiveTimeout
	}
	if c.MinTextChars <= 0 {
		c.MinTextChars = d.MinTextChars
	}
	if strings.TrimSpace(c.CaptureArchive) == "" {
		c.CaptureArchive = d.CaptureArchive
	}
	archive := strings.TrimSpace(c.CaptureArchive)
	if archive == "extension" || archive == "auto" {
		c.Headless = false
	}
	c.APIBase = strings.TrimRight(c.APIBase, "/")
}

// Load reads config.json from dir (ignored when missing) and applies env overrides.
// EEA_API_BASE overrides api_base; EEA_CLIENT_CONFIG points at a different file.
func Load(dir string) (Config, error) {
	path := filepath.Join(dir, "config.json")
	if override := os.Getenv("EEA_CLIENT_CONFIG"); override != "" {
		path = override
	}
	cfg := Default()
	switch data, err := os.ReadFile(path); {
	case err == nil:
		if err := json.Unmarshal(data, &cfg); err != nil {
			return cfg, fmt.Errorf("parse %s: %w", path, err)
		}
	case !errors.Is(err, os.ErrNotExist):
		return cfg, fmt.Errorf("read %s: %w", path, err)
	}
	if v := os.Getenv("EEA_API_BASE"); v != "" {
		cfg.APIBase = v
		cfg.AutoAPI = false
	}
	cfg.applyDefaults()
	return cfg, nil
}

// EffectiveAPIBase resolves auto mode: an empty or loopback api_base follows
// the physical LAN address (e.g. http://10.215.8.74:8000) so the client talks
// to the same host the browser uses. Explicit https:// or non-loopback bases
// never fall back to LAN auto-discovery.
func (c Config) EffectiveAPIBase() string {
	base := strings.TrimSpace(c.APIBase)
	if base != "" {
		lower := strings.ToLower(base)
		if strings.HasPrefix(lower, "https://") || !isLoopbackURL(base) {
			return strings.TrimRight(base, "/")
		}
	}
	if c.AutoAPI && (base == "" || isLoopbackURL(base)) {
		return netinfo.BaseURL(8000)
	}
	if base == "" {
		return "http://127.0.0.1:8000"
	}
	return strings.TrimRight(base, "/")
}

// BearerToken resolves the capture upload credential from env or file (never config.json).
func (c Config) BearerToken() string {
	envName := strings.TrimSpace(c.AuthTokenEnv)
	if envName == "" {
		envName = "EEA_CAPTURE_TOKEN"
	}
	if value := strings.TrimSpace(os.Getenv(envName)); value != "" {
		return value
	}
	path := strings.TrimSpace(c.AuthTokenFile)
	if path == "" {
		return ""
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

// AuthTokenSource reports where the bearer credential was loaded (redacted).
func (c Config) AuthTokenSource() string {
	if c.BearerToken() == "" {
		return "none"
	}
	envName := strings.TrimSpace(c.AuthTokenEnv)
	if envName == "" {
		envName = "EEA_CAPTURE_TOKEN"
	}
	if strings.TrimSpace(os.Getenv(envName)) != "" {
		return "env:" + envName
	}
	if strings.TrimSpace(c.AuthTokenFile) != "" {
		return "file"
	}
	return "unknown"
}

func isLoopbackURL(raw string) bool {
	u, err := url.Parse(raw)
	if err != nil {
		return false
	}
	host := u.Hostname()
	if host == "" {
		return false
	}
	if strings.EqualFold(host, "localhost") {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}

// QueueStateDir resolves queue_dir relative to the directory containing
// config.json, keeping persistent job state stable when the app is launched
// from a shortcut with a different working directory.
func QueueStateDir(configDir string, c Config) string {
	path := c.QueueDir
	if !filepath.IsAbs(path) {
		path = filepath.Join(configDir, path)
	}
	if abs, err := filepath.Abs(path); err == nil {
		return abs
	}
	return filepath.Clean(path)
}

// Save writes the config back to dir as indented JSON.
func Save(dir string, cfg Config) error {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dir, "config.json"), append(data, '\n'), 0o644)
}
