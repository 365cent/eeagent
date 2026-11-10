package capture

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// 1x1 transparent PNG.
var pngPixel = []byte{
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
	0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
	0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
	0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
	0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
	0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
}

const testPage = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>EEA 抓取测试</title>
<style>body { font-family: sans-serif; } .hero { background-image: url("/bg.png"); }</style>
</head>
<body>
<h1 id="headline">前瞻技术扫描</h1>
<p>正文段落用于验证快照完整性。</p>
<img id="pic" src="/img.png" alt="pixel">
<div class="hero">CSS 背景</div>
<script>document.getElementById("headline").dataset.stamp = "rendered";</script>
</body>
</html>`

func TestCaptureExtensionModeLocalPage(t *testing.T) {
	if testing.Short() {
		t.Skip("launches a real browser")
	}
	engine := "edge"
	if _, err := ResolveBrowserForExtension(engine, ""); err != nil {
		t.Skipf("edge not available: %v", err)
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(testPage))
	}))
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	extRoot := filepath.Join("..", "..", "data", "extensions", "singlefile")
	if _, err := os.Stat(filepath.Join(extRoot, "manifest.json")); err != nil {
		t.Skip("staged SingleFile extension not present; run doctor or vendor script")
	}
	browser, err := Launch(ctx, Options{
		Engine:                  engine,
		ArchiveMode:             ArchiveModeExtension,
		UserDataDir:             t.TempDir(),
		Headless:                true,
		SingleFileExtensionPath: extRoot,
	})
	if err != nil {
		t.Fatalf("launch: %v", err)
	}
	defer browser.Close()

	archive, err := browser.Capture(ctx, srv.URL+"/page.html")
	if err != nil {
		t.Fatalf("capture: %v", err)
	}
	if !strings.Contains(string(archive.HTML), "前瞻技术扫描") {
		t.Fatal("extension capture missing article text")
	}
}

func TestCaptureLocalPage(t *testing.T) {
	if testing.Short() {
		t.Skip("launches a real browser")
	}
	engine := "edge"
	if _, err := ResolveBrowser(engine, ""); err != nil {
		t.Skipf("edge not available: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/page.html", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(testPage))
	})
	png := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "image/png")
		w.Write(pngPixel)
	}
	mux.HandleFunc("/img.png", png)
	mux.HandleFunc("/bg.png", png)
	srv := httptest.NewServer(mux)
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()

	browser, err := Launch(ctx, Options{
		Engine:      engine,
		UserDataDir: t.TempDir(),
		Headless:    true,
	})
	if err != nil {
		t.Fatalf("launch: %v", err)
	}
	defer browser.Close()

	archive, err := browser.Capture(ctx, srv.URL+"/page.html")
	if err != nil {
		t.Fatalf("capture: %v", err)
	}
	if archive.Title != "EEA 抓取测试" {
		t.Errorf("title = %q", archive.Title)
	}
	html := string(archive.HTML)
	for _, want := range []string{
		"前瞻技术扫描",
		"正文段落用于验证快照完整性。",
		`data:image/png;base64,`,
		`data-stamp="rendered"`,
	} {
		if !strings.Contains(html, want) {
			t.Errorf("archive missing %q", want)
		}
	}
	for _, unwanted := range []string{`src="/img.png"`, `url("/bg.png")`} {
		if strings.Contains(html, unwanted) {
			t.Errorf("archive still references external resource %q", unwanted)
		}
	}
	t.Logf("archive: %d bytes, url=%s", len(archive.HTML), archive.URL)
}

func TestCaptureWaitsForDelayedContent(t *testing.T) {
	if testing.Short() {
		t.Skip("launches a real browser")
	}
	if _, err := ResolveBrowser("edge", ""); err != nil {
		t.Skipf("edge not available: %v", err)
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>延迟渲染</title></head>
<body><div id="js_content"></div>
<script>
setTimeout(function () {
  document.getElementById("js_content").innerHTML =
    "<p>延迟渲染的正文内容：48V 智能配电与区域控制器。</p>";
}, 1200);
</script></body></html>`))
	}))
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	browser, err := Launch(ctx, Options{
		Engine: "edge", UserDataDir: t.TempDir(), Headless: true,
		ReadyWait: 10 * time.Second, MinTextChars: 8,
	})
	if err != nil {
		t.Fatalf("launch: %v", err)
	}
	defer browser.Close()

	archive, err := browser.Capture(ctx, srv.URL+"/article")
	if err != nil {
		t.Fatalf("capture: %v", err)
	}
	if !strings.Contains(string(archive.HTML), "延迟渲染的正文内容") {
		t.Fatal("archive was captured before the delayed content rendered")
	}
}

func TestCaptureRejectsChallengePage(t *testing.T) {
	if testing.Short() {
		t.Skip("launches a real browser")
	}
	if _, err := ResolveBrowser("edge", ""); err != nil {
		t.Skipf("edge not available: %v", err)
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>微信公众平台</title></head>
<body><p>环境异常，请完成验证后继续访问。</p></body></html>`))
	}))
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	browser, err := Launch(ctx, Options{
		Engine: "edge", UserDataDir: t.TempDir(), Headless: true,
		ReadyWait: 800 * time.Millisecond,
	})
	if err != nil {
		t.Fatalf("launch: %v", err)
	}
	defer browser.Close()

	_, err = browser.Capture(ctx, srv.URL+"/mp/wappoc_appmsgcaptcha")
	if err == nil {
		t.Fatal("challenge page must not be archived as evidence")
	}
	if !strings.Contains(err.Error(), "verification challenge") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCaptureArticleBodyLazyImages(t *testing.T) {
	if testing.Short() {
		t.Skip("launches a real browser")
	}
	if _, err := ResolveBrowser("edge", ""); err != nil {
		t.Skipf("edge not available: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/article", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(`<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>懒加载正文图</title></head>
<body>
<div class="art-con article_body article_text"><div class="article_text">
<p>正文起段落，用于满足可读性阈值与图像抓取。</p>
<img id="one" width="400" height="300" data-src="/a.png" alt="one">
<img id="two" width="400" height="300" data-src="/b.png" alt="two">
</div></div>
<script>
const imgs = document.querySelectorAll("img[data-src]");
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const img = e.target;
    img.src = img.getAttribute("data-src");
    io.unobserve(img);
  });
}, { rootMargin: "0px", threshold: 0.1 });
imgs.forEach((img) => io.observe(img));
</script>
</body></html>`))
	})
	png := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "image/png")
		w.Write(pngPixel)
	}
	mux.HandleFunc("/a.png", png)
	mux.HandleFunc("/b.png", png)
	srv := httptest.NewServer(mux)
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()
	browser, err := Launch(ctx, Options{
		Engine: "edge", UserDataDir: t.TempDir(), Headless: true,
	})
	if err != nil {
		t.Fatalf("launch: %v", err)
	}
	defer browser.Close()

	archive, err := browser.Capture(ctx, srv.URL+"/article")
	if err != nil {
		t.Fatalf("capture: %v", err)
	}
	html := string(archive.HTML)
	if n := strings.Count(html, `data:image/png;base64,`); n < 2 {
		t.Fatalf("expected >=2 inlined PNGs, got %d", n)
	}
}
