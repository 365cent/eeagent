package config

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"testing"
	"time"

	"eea/capture/internal/credential"
)

func TestEffectiveAPIBaseHTTPSDisablesAutoLAN(t *testing.T) {
	cfg := Default()
	cfg.APIBase = "https://eea.example.com"
	cfg.AutoAPI = true
	if got := cfg.EffectiveAPIBase(); got != "https://eea.example.com" {
		t.Fatalf("base = %q", got)
	}
}

func TestBearerTokenFromEnv(t *testing.T) {
	t.Setenv("EEA_CAPTURE_TOKEN", "secret-token")
	cfg := Default()
	if cfg.BearerToken() != "secret-token" {
		t.Fatalf("token = %q", cfg.BearerToken())
	}
	if cfg.AuthTokenSource() != "env:EEA_CAPTURE_TOKEN" {
		t.Fatalf("source = %q", cfg.AuthTokenSource())
	}
}

func TestBearerTokenMissingCredentialFallsBackToFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "capture-token")
	if err := os.WriteFile(path, []byte("file-token"), 0o600); err != nil {
		t.Fatal(err)
	}
	cfg := Default()
	cfg.AuthTokenCredential = "eea-capture-missing-test-target"
	cfg.AuthTokenFile = path
	if got := cfg.BearerToken(); got != "file-token" {
		t.Fatalf("token = %q", got)
	}
	if got := cfg.AuthTokenSource(); got != "file" {
		t.Fatalf("source = %q", got)
	}
}

func TestBearerTokenFromCredential(t *testing.T) {
	target := fmt.Sprintf("eea-capture-config-test-%d", time.Now().UnixNano())
	if err := credential.Write(target, "credential-token"); err != nil {
		if errors.Is(err, credential.ErrUnsupported) {
			t.Skip(err)
		}
		t.Fatal(err)
	}
	defer credential.Delete(target)

	cfg := Default()
	cfg.AuthTokenCredential = target
	if got := cfg.BearerToken(); got != "credential-token" {
		t.Fatalf("token = %q", got)
	}
	if got := cfg.AuthTokenSource(); got != "credential" {
		t.Fatalf("source = %q", got)
	}
}
