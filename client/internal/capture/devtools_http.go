package capture

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// devtoolsTarget is one row from GET /json or /json/list.
type devtoolsTarget struct {
	ID                   string `json:"id"`
	Type                 string `json:"type"`
	Title                string `json:"title"`
	URL                  string `json:"url"`
	WebSocketDebuggerURL string `json:"webSocketDebuggerUrl"`
}

func fetchDevToolsTargets(ctx context.Context, devtoolsHost string) ([]devtoolsTarget, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, devtoolsHost+"/json/list", nil)
	if err != nil {
		return nil, err
	}
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return nil, fmt.Errorf("devtools list %s: %s", resp.Status, strings.TrimSpace(string(body)))
	}
	var targets []devtoolsTarget
	if err := json.NewDecoder(resp.Body).Decode(&targets); err != nil {
		return nil, err
	}
	return targets, nil
}

func extensionIDFromTargets(targets []devtoolsTarget) string {
	const prefix = "chrome-extension://"
	const marker = "single-file"
	for _, t := range targets {
		if !strings.HasPrefix(t.URL, prefix) || !strings.Contains(strings.ToLower(t.URL), marker) {
			continue
		}
		rest := strings.TrimPrefix(t.URL, prefix)
		if i := strings.IndexByte(rest, '/'); i > 0 {
			return rest[:i]
		}
	}
	for _, t := range targets {
		if !strings.HasPrefix(t.URL, prefix) {
			continue
		}
		rest := strings.TrimPrefix(t.URL, prefix)
		if i := strings.IndexByte(rest, '/'); i > 0 {
			id := rest[:i]
			if id == chromeWebStoreSingleFileID {
				return id
			}
		}
	}
	return ""
}
