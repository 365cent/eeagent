package platform

import (
	"eea/capture/internal/config"
	"eea/capture/internal/httpx"
)

// NewForConfig builds an API client from capture client settings.
func NewForConfig(cfg config.Config) *Client {
	return NewWithOptions(
		cfg.EffectiveAPIBase(),
		cfg.MaxUploadMB,
		httpx.ClientOptions{CACertPath: cfg.CACertPath},
		cfg.BearerToken(),
	)
}
