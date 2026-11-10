package capture

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"eea/capture/internal/cdp"
)

func (b *Browser) enableTargetDiscovery(ctx context.Context) {
	_, _ = b.cdp.Call(ctx, "Target.setDiscoverTargets", map[string]any{"discover": true})
	_, _ = b.cdp.Call(ctx, "Target.setAutoAttach", map[string]any{
		"autoAttach":             true,
		"waitForDebuggerOnStart": false,
		"flatten":                true,
	})
}

// extensionIDFromManifest returns the store extension id when manifest.json contains a public key.
func extensionIDFromManifest(extRoot string) string {
	data, err := os.ReadFile(filepath.Join(extRoot, "manifest.json"))
	if err != nil {
		return ""
	}
	if strings.Contains(string(data), `"key"`) {
		return chromeWebStoreSingleFileID
	}
	return ""
}

func (b *Browser) waitForSingleFileExtension(ctx context.Context) (string, error) {
	deadline := time.Now().Add(20 * time.Second)
	for time.Now().Before(deadline) {
		if targets, err := fetchDevToolsTargets(ctx, b.devtoolsHost); err == nil {
			if id := extensionIDFromTargets(targets); id != "" {
				return id, nil
			}
		}
		if id := extensionIDFromManifest(b.extensionPath); id != "" {
			if sw, err := findServiceWorkerTargetID(ctx, b, id, nil); err == nil && sw != "" {
				return id, nil
			}
		}
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-time.After(250 * time.Millisecond):
		}
	}
	return "", fmt.Errorf("no SingleFile chrome-extension target within 20s (check staged extension at %s)", b.extensionPath)
}

func (b *Browser) resolveExtensionID(ctx context.Context) (string, error) {
	if b.singleFileExtID != "" {
		return b.singleFileExtID, nil
	}
	if b.extensionPath != "" {
		if id := extensionIDFromManifest(b.extensionPath); id != "" {
			b.singleFileExtID = id
			return id, nil
		}
	}
	if targets, err := fetchDevToolsTargets(ctx, b.devtoolsHost); err == nil {
		if id := extensionIDFromTargets(targets); id != "" {
			b.singleFileExtID = id
			return id, nil
		}
	}
	return "", fmt.Errorf("SingleFile extension id not found")
}

const wakeExtensionServiceWorkerExpr = `(async () => {
  try {
    await chrome.runtime.sendMessage({ method: "content.maybeInit" });
  } catch (_) {}
  return true;
})()`

func (b *Browser) wakeSingleFileExtension(ctx context.Context, extID string) {
	url := fmt.Sprintf("chrome-extension://%s/src/ui/pages/help.html", extID)
	sess, err := b.cdp.NewTarget(ctx, url)
	if err != nil {
		return
	}
	_ = sess.CallDecode(ctx, "Runtime.enable", nil, nil)
	_ = sess.CallDecode(ctx, "Runtime.evaluate", map[string]any{
		"expression":    wakeExtensionServiceWorkerExpr,
		"awaitPromise":  true,
		"returnByValue": true,
	}, nil)
	select {
	case <-ctx.Done():
	case <-time.After(1800 * time.Millisecond):
	}
	closeCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, _ = b.cdp.Call(closeCtx, "Target.closeTarget", map[string]any{"targetId": sess.TargetID})
}

func findServiceWorkerTargetID(ctx context.Context, br *Browser, extID string, wake func()) (string, error) {
	deadline := time.Now().Add(30 * time.Second)
	prefix := "chrome-extension://" + extID + "/"
	wakeAt := time.Now()
	for time.Now().Before(deadline) {
		if id, ok := serviceWorkerTargetID(ctx, br.cdp, br.devtoolsHost, prefix); ok {
			return id, nil
		}
		if wake != nil && time.Since(wakeAt) > 2*time.Second {
			wakeAt = time.Now()
			wake()
		}
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-time.After(300 * time.Millisecond):
		}
	}
	return "", fmt.Errorf("singlefile service worker not found for extension %s", extID)
}

func serviceWorkerTargetID(ctx context.Context, b *cdp.Browser, devtoolsHost, prefix string) (string, bool) {
	var cdpOut struct {
		TargetInfos []struct {
			TargetID string `json:"targetId"`
			Type     string `json:"type"`
			URL      string `json:"url"`
		} `json:"targetInfos"`
	}
	raw, err := b.Call(ctx, "Target.getTargets", nil)
	if err == nil {
		_ = json.Unmarshal(raw, &cdpOut)
		for _, t := range cdpOut.TargetInfos {
			if t.Type == "service_worker" && strings.HasPrefix(t.URL, prefix) {
				return t.TargetID, true
			}
			if strings.HasPrefix(t.URL, prefix) && strings.Contains(t.URL, "background") {
				return t.TargetID, true
			}
		}
	}
	if targets, err := fetchDevToolsTargets(ctx, devtoolsHost); err == nil {
		for _, t := range targets {
			if t.Type == "service_worker" && strings.HasPrefix(t.URL, prefix) {
				return t.ID, true
			}
		}
	}
	return "", false
}
