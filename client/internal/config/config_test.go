package config

import "testing"

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
