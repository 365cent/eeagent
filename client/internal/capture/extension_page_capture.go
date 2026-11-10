package capture

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"eea/capture/internal/cdp"
)

const extensionContentCaptureExpr = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  for (let i = 0; i < 48; i++) {
    const sf = globalThis.singlefile;
    if (sf && typeof sf.getPageData === "function") {
      if (typeof sf.init === "function") {
        try { sf.init({ fetch: globalThis.fetch.bind(globalThis) }); } catch (_) {}
      }
      const data = await sf.getPageData({
        loadDeferredContent: true,
        loadDeferredImages: true,
        removeHiddenElements: true,
        blockMixedContent: false,
      });
      return {
        url: location.href,
        title: document.title || "",
        mimeType: data.mimeType || "text/html",
        content: data.content || ""
      };
    }
    await wait(300);
  }
  return { error: "singlefile content script is not ready on this page" };
})()`

func (b *Browser) captureWithSingleFileOnPage(ctx context.Context, sess *cdp.Session, pageURL string) (*Archive, error) {
	extID, err := b.resolveExtensionID(ctx)
	if err != nil {
		return nil, err
	}
	_ = sess.CallDecode(ctx, "Runtime.enable", nil, nil)
	ctxID, err := findExtensionExecutionContext(ctx, sess, extID)
	if err != nil {
		return nil, err
	}
	var wire struct {
		Result struct {
			Value json.RawMessage `json:"value"`
		} `json:"result"`
		ExceptionDetails *struct {
			Text string `json:"text"`
		} `json:"exceptionDetails"`
	}
	params := map[string]any{
		"expression":    extensionContentCaptureExpr,
		"awaitPromise":  true,
		"returnByValue": true,
		"contextId":     ctxID,
	}
	if err := sess.CallDecode(ctx, "Runtime.evaluate", params, &wire); err != nil {
		return nil, err
	}
	if wire.ExceptionDetails != nil {
		return nil, fmt.Errorf("singlefile content capture: %s", wire.ExceptionDetails.Text)
	}
	return decodeExtensionCaptureResult(wire.Result.Value, pageURL)
}

const singleFileContextProbe = `typeof globalThis.singlefile?.getPageData === "function"`

func findExtensionExecutionContext(ctx context.Context, sess *cdp.Session, extID string) (int, error) {
	_ = extID // content scripts run in the page isolated world, not under chrome-extension:// origin.
	deadline := time.Now().Add(35 * time.Second)
	for time.Now().Before(deadline) {
		if id, ok := probeSingleFileContext(ctx, sess); ok {
			return id, nil
		}
		select {
		case <-ctx.Done():
			return 0, ctx.Err()
		case <-time.After(350 * time.Millisecond):
		}
	}
	return 0, fmt.Errorf("singlefile content execution context not found (extension %s)", extID)
}

func probeSingleFileContext(ctx context.Context, sess *cdp.Session) (int, bool) {
	var out struct {
		Result []struct {
			ID int `json:"id"`
		} `json:"result"`
	}
	if err := sess.CallDecode(ctx, "Runtime.getExecutionContexts", nil, &out); err != nil {
		return 0, false
	}
	for _, ec := range out.Result {
		var wire struct {
			Result struct {
				Value bool `json:"value"`
			} `json:"result"`
			ExceptionDetails *struct {
				Exception struct {
					Description string `json:"description"`
				} `json:"exception"`
			} `json:"exceptionDetails"`
		}
		params := map[string]any{
			"expression":    singleFileContextProbe,
			"contextId":     ec.ID,
			"returnByValue": true,
		}
		if err := sess.CallDecode(ctx, "Runtime.evaluate", params, &wire); err != nil {
			continue
		}
		if wire.ExceptionDetails != nil {
			continue
		}
		if wire.Result.Value {
			return ec.ID, true
		}
	}
	return 0, false
}

func decodeExtensionCaptureResult(raw json.RawMessage, fallbackURL string) (*Archive, error) {
	var page struct {
		URL      string `json:"url"`
		Title    string `json:"title"`
		MimeType string `json:"mimeType"`
		Content  string `json:"content"`
		Error    string `json:"error"`
	}
	if err := json.Unmarshal(raw, &page); err != nil {
		return nil, fmt.Errorf("decode extension capture: %w", err)
	}
	if page.Error != "" {
		return nil, fmt.Errorf("singlefile extension: %s", page.Error)
	}
	if len(page.Content) == 0 {
		return nil, fmt.Errorf("singlefile extension produced empty HTML")
	}
	if !strings.Contains(page.Content, "<html") && !strings.Contains(page.Content, "<!DOCTYPE") {
		return nil, fmt.Errorf("singlefile extension content is not HTML")
	}
	if page.MimeType == "" {
		page.MimeType = "text/html"
	}
	url := page.URL
	if url == "" {
		url = fallbackURL
	}
	return &Archive{
		URL:      url,
		Title:    strings.TrimSpace(page.Title),
		MimeType: page.MimeType,
		HTML:     []byte(page.Content),
	}, nil
}
