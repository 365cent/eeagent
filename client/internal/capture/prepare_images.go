package capture

import (
	"context"
	"fmt"
	"time"

	"eea/capture/internal/cdp"
)

// prepareArticleImages scrolls the main article region and waits for inline
// figures to load (lazy src, intersection observers) so SingleFile can fetch
// and embed them as data: URLs.
const prepareArticleImagesExpr = `(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const maxImgs = 12;
  const perImgMs = 1200;
  const maxTotalMs = 32000;
  const started = Date.now();
  const srcAttrs = [
    "data-src",
    "data-original",
    "data-actualsrc",
    "data-lazy-src",
  ];
  const roots = [
    document.querySelector(".art-con.article_body"),
    document.querySelector(".article_body"),
    document.querySelector(".article_text"),
    document.querySelector("#js_content"),
    document.querySelector(".rich_media_content"),
    document.querySelector("article"),
    document.querySelector("main"),
    document.body,
  ].filter(Boolean);
  const root = roots[0];
  if (!root) {
    return { ok: true, total: 0, loaded: 0 };
  }

  const imgs = Array.from(root.querySelectorAll("img"));
  for (const img of imgs) {
    for (const attr of srcAttrs) {
      const v = (img.getAttribute(attr) || "").trim();
      if (!v || v.startsWith("data:")) {
        continue;
      }
      const cur = (img.getAttribute("src") || "").trim();
      if (!cur || cur.startsWith("data:")) {
        img.setAttribute("src", v);
      }
      break;
    }
    img.loading = "eager";
    img.removeAttribute("loading");
  }

  const maxScroll = Math.max(
    root.scrollHeight || 0,
    document.documentElement.scrollHeight || 0,
  );
  const step = Math.max(320, Math.floor(window.innerHeight * 0.75));
  for (let y = 0; y <= maxScroll; y += step) {
    window.scrollTo(0, y);
    await sleep(80);
  }
  window.scrollTo(0, 0);

  let loaded = 0;
  const waitFor = (img, ms) =>
    new Promise((resolve) => {
      const done = () => resolve();
      if (img.complete && img.naturalWidth > 0) {
        resolve();
        return;
      }
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
      setTimeout(done, ms);
    });

  const work = imgs.slice(0, maxImgs);
  for (const img of work) {
    if (Date.now() - started > maxTotalMs) {
      break;
    }
    try {
      img.scrollIntoView({ block: "center", inline: "nearest" });
    } catch (_) {}
    await sleep(40);
    if (img.decode) {
      try {
        await img.decode();
      } catch (_) {}
    }
    const left = Math.max(200, maxTotalMs - (Date.now() - started));
    await waitFor(img, Math.min(perImgMs, left));
    if (img.naturalWidth > 0) {
      loaded++;
    }
  }

  return { ok: true, total: imgs.length, loaded, prepared: work.length };
})()`

func prepareArticleImages(ctx context.Context, sess *cdp.Session) error {
	budget := 45 * time.Second
	if dl, ok := ctx.Deadline(); ok {
		remain := time.Until(dl) - 20*time.Second
		if remain < 5*time.Second {
			return nil
		}
		if remain < budget {
			budget = remain
		}
	}
	prepCtx, cancel := context.WithTimeout(context.Background(), budget)
	defer cancel()

	var wire struct {
		Result struct {
			Value struct {
				OK     bool `json:"ok"`
				Total  int  `json:"total"`
				Loaded int  `json:"loaded"`
			} `json:"value"`
		} `json:"result"`
		ExceptionDetails *struct {
			Text string `json:"text"`
		} `json:"exceptionDetails"`
	}
	if err := sess.CallDecode(prepCtx, "Runtime.evaluate", map[string]any{
		"expression":    prepareArticleImagesExpr,
		"awaitPromise":  true,
		"returnByValue": true,
	}, &wire); err != nil {
		return fmt.Errorf("prepare article images: %w", err)
	}
	if wire.ExceptionDetails != nil {
		return fmt.Errorf("prepare article images: %s", wire.ExceptionDetails.Text)
	}
	if !wire.Result.Value.OK {
		return fmt.Errorf("prepare article images failed (total=%d loaded=%d)",
			wire.Result.Value.Total, wire.Result.Value.Loaded)
	}
	return nil
}
