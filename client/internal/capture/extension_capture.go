package capture

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"eea/capture/internal/cdp"
)

// Mirrors background xa(): manifest bootstrap alone does not expose globalThis.singlefile.getPageData.
const extensionInjectScriptsExpr = `(async (tabURL) => {
  const tabs = await chrome.tabs.query({});
  const key = (tabURL || "").split("#")[0];
  let tab = tabs.find((t) => t.url && (t.url.split("#")[0] === key || t.url.startsWith(key)));
  if (!tab) {
    const active = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = active && active[0];
  }
  if (!tab?.id) {
    return { error: "no tab for SingleFile injection" };
  }
  const tabId = tab.id;
  try {
    await chrome.tabs.update(tabId, { active: true });
  } catch (_) {}
  const frameScripts = [
    "lib/single-file-frames.bundle.js",
  ];
  const bootstrapScripts = [
    "lib/single-file-bootstrap.bundle.js",
  ];
  const hasSingleFile = async () => {
    const res = await chrome.scripting.executeScript({
      target: { tabId },
      world: "ISOLATED",
      func: () => Boolean(globalThis.singlefile && typeof globalThis.singlefile.getPageData === "function"),
    });
    return res && res[0] && res[0].result;
  };
  if (await hasSingleFile()) {
    return { ok: true };
  }
  try {
    await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: frameScripts });
    await chrome.scripting.executeScript({ target: { tabId }, files: bootstrapScripts });
    await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ["lib/single-file-hooks-frames.js"], world: "MAIN" });
    await chrome.scripting.executeScript({ target: { tabId }, files: ["lib/single-file.js", "lib/single-file-extension.js"] });
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
  if (!(await hasSingleFile())) {
    return { error: "singlefile getPageData still missing after injection" };
  }
  try {
    await chrome.tabs.sendMessage(tabId, { method: "content.maybeInit" });
  } catch (_) {}
  return { ok: true };
})`

const extensionScriptingCaptureExpr = `(async (tabURL) => {
  const tabs = await chrome.tabs.query({});
  const key = (tabURL || "").split("#")[0];
  let tab = tabs.find((t) => t.url && (t.url.split("#")[0] === key || t.url.startsWith(key)));
  if (!tab) {
    const active = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = active && active[0];
  }
  if (!tab || tab.id == null) {
    return { error: "no tab for capture" };
  }
  await chrome.tabs.update(tab.id, { active: true });
  try {
    await chrome.tabs.sendMessage(tab.id, { method: "content.maybeInit" });
  } catch (_) {}
  const capturePage = async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    for (let i = 0; i < 48; i++) {
      const res = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: false },
        world: "ISOLATED",
        func: async () => {
          const sf = globalThis.singlefile;
          if (!sf || typeof sf.getPageData !== "function") {
            return null;
          }
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
            content: data.content || "",
          };
        },
      });
      const page = res && res[0] && res[0].result;
      if (page && page.content) {
        if (!page.url) {
          page.url = tab.url || tabURL;
        }
        return page;
      }
      await wait(350);
    }
    return { error: "singlefile not ready in isolated world" };
  };
  try {
    return await capturePage();
  } catch (e) {
    return { error: String((e && e.stack) || e) };
  }
})`

func (b *Browser) captureWithSingleFileExtension(ctx context.Context, pageSess *cdp.Session, pageURL string) (*Archive, error) {
	if b.devtoolsHost == "" {
		return nil, fmt.Errorf("missing devtools endpoint")
	}
	extID, err := b.resolveExtensionID(ctx)
	if err != nil {
		return nil, err
	}
	b.wakeSingleFileExtension(ctx, extID)
	pageErr := b.ensureSingleFileContentReady(ctx, pageSess, extID, pageURL)
	if archive, capErr := b.captureWithSingleFileOnPage(ctx, pageSess, pageURL); capErr == nil {
		return archive, nil
	} else {
		pageErr = capErr
	}
	swTarget, swErr := findServiceWorkerTargetID(ctx, b, extID, func() {
		b.wakeSingleFileExtension(ctx, extID)
	})
	if swErr != nil {
		if pageErr != nil {
			return nil, fmt.Errorf("content-script capture: %v; service worker: %w", pageErr, swErr)
		}
		return nil, swErr
	}
	return b.captureWithSingleFileServiceWorker(ctx, swTarget, pageURL, pageErr)
}

func (b *Browser) injectSingleFileScripts(ctx context.Context, extID, pageURL string) error {
	deadline := time.Now().Add(20 * time.Second)
	var lastErr error
	for time.Now().Before(deadline) {
		raw, err := b.evaluateInSingleFileWorker(ctx, extID, pageURL, extensionInjectScriptsExpr)
		if err != nil {
			lastErr = err
		} else {
			var wire struct {
				Error string `json:"error"`
				OK    bool   `json:"ok"`
			}
			if err := json.Unmarshal(raw, &wire); err != nil {
				return fmt.Errorf("decode SingleFile injection: %w", err)
			}
			if wire.Error == "" {
				return nil
			}
			lastErr = fmt.Errorf("inject SingleFile scripts: %s", wire.Error)
			if !strings.Contains(wire.Error, "no tab for SingleFile injection") {
				return lastErr
			}
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(400 * time.Millisecond):
		}
	}
	if lastErr != nil {
		return lastErr
	}
	return fmt.Errorf("inject SingleFile scripts: timed out")
}

func (b *Browser) evaluateInSingleFileWorker(ctx context.Context, extID, pageURL, jsExpr string) (json.RawMessage, error) {
	swTarget, err := findServiceWorkerTargetID(ctx, b, extID, func() {
		b.wakeSingleFileExtension(ctx, extID)
	})
	if err != nil {
		return nil, err
	}
	swSess, err := b.cdp.AttachTarget(ctx, swTarget)
	if err != nil {
		return nil, fmt.Errorf("attach extension worker: %w", err)
	}
	defer func() {
		detachCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		_, _ = b.cdp.Call(detachCtx, "Target.detachFromTarget", map[string]any{"sessionId": swSess.ID})
	}()
	_ = swSess.CallDecode(ctx, "Runtime.enable", nil, nil)
	escapedURL, err := json.Marshal(pageURL)
	if err != nil {
		return nil, err
	}
	expr := jsExpr + "(" + string(escapedURL) + ")"
	var wire struct {
		Result struct {
			Value json.RawMessage `json:"value"`
		} `json:"result"`
		ExceptionDetails *struct {
			Text string `json:"text"`
		} `json:"exceptionDetails"`
	}
	evalCtx, cancel := context.WithTimeout(ctx, 3*time.Minute)
	defer cancel()
	if err := swSess.CallDecode(evalCtx, "Runtime.evaluate", map[string]any{
		"expression":    expr,
		"awaitPromise":  true,
		"returnByValue": true,
	}, &wire); err != nil {
		return nil, err
	}
	if wire.ExceptionDetails != nil {
		return nil, fmt.Errorf("%s", strings.TrimSpace(wire.ExceptionDetails.Text))
	}
	return wire.Result.Value, nil
}

// ensureSingleFileContentReady injects SingleFile once and reloads at most once per Capture.
func (b *Browser) ensureSingleFileContentReady(ctx context.Context, sess *cdp.Session, extID, pageURL string) error {
	if _, ok := probeSingleFileContext(ctx, sess); ok {
		return nil
	}
	if err := b.injectSingleFileScripts(ctx, extID, pageURL); err != nil {
		return err
	}
	if _, ok := probeSingleFileContext(ctx, sess); ok {
		return nil
	}
	if b.singleFileReloaded {
		return fmt.Errorf("singlefile content script did not attach (extension %s)", extID)
	}
	b.singleFileReloaded = true
	loaded, stop := b.cdp.Watch(func(ev cdp.Event) bool {
		return ev.SessionID == sess.ID && ev.Method == "Page.loadEventFired"
	})
	defer stop()
	if err := sess.CallDecode(ctx, "Page.reload", map[string]any{"ignoreCache": false}, nil); err != nil {
		return err
	}
	select {
	case <-loaded:
	case <-time.After(45 * time.Second):
	case <-ctx.Done():
		return ctx.Err()
	}
	if err := b.waitForContent(ctx, sess); err != nil {
		return err
	}
	b.wakeSingleFileExtension(ctx, extID)
	if err := b.injectSingleFileScripts(ctx, extID, pageURL); err != nil {
		return err
	}
	if _, ok := probeSingleFileContext(ctx, sess); !ok {
		return fmt.Errorf("singlefile content script did not attach after reload (extension %s)", extID)
	}
	return nil
}

func (b *Browser) captureWithSingleFileServiceWorker(ctx context.Context, swTarget, pageURL string, contentErr error) (*Archive, error) {
	_ = swTarget
	_ = contentErr
	extID, err := b.resolveExtensionID(ctx)
	if err != nil {
		return nil, err
	}
	raw, err := b.evaluateInSingleFileWorker(ctx, extID, pageURL, extensionScriptingCaptureExpr)
	if err != nil {
		return nil, fmt.Errorf("singlefile extension capture: %w", err)
	}
	return decodeExtensionCaptureResult(raw, pageURL)
}
