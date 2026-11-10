// Package capture drives a local Edge/Chrome over the DevTools protocol and
// archives the page with SingleFile, producing one self-contained HTML file.
package capture

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"

	"eea/capture/internal/cdp"
	"eea/capture/internal/singlefile"
)

// ArchiveMode selects how HTML is produced for a captured URL.
const (
	ArchiveModeAuto      = "auto"
	ArchiveModeExtension = "extension"
	ArchiveModeEmbedded  = "embedded"
)

// Options configures the browser used for captures.
type Options struct {
	Engine      string // edge | chrome
	BrowserPath string
	UserDataDir string
	Headless    bool
	LaunchWait  time.Duration

	// ArchiveMode: extension (Chrome/Edge SingleFile), embedded (injected core), or auto.
	ArchiveMode string
	// SingleFileExtensionPath overrides automatic discovery of the store extension.
	SingleFileExtensionPath string

	// ReadyWait bounds how long a normal page may take to produce readable
	// content after load. InteractiveWait is the longer budget for a verification
	// challenge (WeChat/Cloudflare) that a human may solve in a visible window.
	// MinTextChars is the readable-body threshold used to reject empty shells.
	ReadyWait       time.Duration
	InteractiveWait time.Duration
	MinTextChars    int
}

// Archive is a captured page.
type Archive struct {
	URL      string
	Title    string
	MimeType string
	HTML     []byte
}

// Browser is a long-lived Chrome/Edge process shared by all captures.
type Browser struct {
	opts    Options
	cmd     *exec.Cmd
	cdp     *cdp.Browser
	profile string
	stderr  *tailBuffer
	owned   bool

	devtoolsHost    string
	singleFileExtID string
	extensionPath   string
	archiveMode     string

	singleFileReloaded bool

	closeMu sync.Mutex
	closed  bool
}

// Launch starts the browser with a private profile and connects over CDP.
func Launch(ctx context.Context, opts Options) (*Browser, error) {
	useExtension := opts.ArchiveMode == ArchiveModeExtension || opts.ArchiveMode == ArchiveModeAuto
	var exe string
	var err error
	if useExtension {
		exe, err = ResolveBrowserForExtension(opts.Engine, opts.BrowserPath)
	} else {
		exe, err = ResolveBrowser(opts.Engine, opts.BrowserPath)
	}
	if err != nil {
		return nil, err
	}
	if opts.LaunchWait <= 0 {
		opts.LaunchWait = 30 * time.Second
	}
	if opts.ReadyWait <= 0 {
		opts.ReadyWait = 25 * time.Second
	}
	if opts.InteractiveWait <= 0 {
		opts.InteractiveWait = 180 * time.Second
	}
	if opts.MinTextChars <= 0 {
		opts.MinTextChars = 10
	}
	if opts.ArchiveMode == "" {
		opts.ArchiveMode = ArchiveModeAuto
	}
	if useExtension && opts.Headless {
		// Many news sites block headless loads (chrome-error://); extension mode needs a visible window.
		opts.Headless = false
	}
	profile := opts.UserDataDir
	if profile == "" {
		tmp, err := os.MkdirTemp("", "eea-capture-profile-*")
		if err != nil {
			return nil, err
		}
		profile = tmp
	}
	absProfile, err := filepath.Abs(profile)
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(absProfile, 0o755); err != nil {
		return nil, err
	}

	portFile := filepath.Join(absProfile, "DevToolsActivePort")

	// A crash or a killed parent can leave a dead DevToolsActivePort behind.
	// Reuse a live browser on this profile, otherwise drop the stale file so
	// the launch below cannot pick up its old port.
	// Reusing an unknown macOS browser profile is a common source of wedged captures.
	// Never attach when SingleFile must be command-line loaded — a reused process would lack the extension.
	if runtime.GOOS != "darwin" && !useExtension {
		if conn, ok := attachExisting(ctx, portFile); ok {
			b := &Browser{opts: opts, profile: absProfile, cdp: conn, archiveMode: opts.ArchiveMode}
			if devtools, ok := devtoolsBaseFromPortFile(portFile); ok {
				b.devtoolsHost = devtools
			}
			return b, nil
		}
	}
	_ = os.Remove(portFile)

	var extensionPath string
	var errExt error
	if useExtension {
		stageDir := filepath.Join(filepath.Dir(absProfile), "extensions", "singlefile")
		extensionPath, errExt = PrepareSingleFileExtension(stageDir, opts.Engine, opts.SingleFileExtensionPath)
		if errExt == nil && extensionPath != "" {
			extensionPath, errExt = filepath.Abs(extensionPath)
		}
	}
	if opts.ArchiveMode == ArchiveModeExtension && errExt != nil {
		return nil, fmt.Errorf("singlefile extension: %w", errExt)
	}
	args := []string{
		"--remote-debugging-port=0",
		"--remote-allow-origins=*",
		"--user-data-dir=" + absProfile,
		"--no-first-run",
		"--no-default-browser-check",
		"--disable-features=Translate,MediaRouter",
		"about:blank",
	}
	if extensionPath != "" {
		args = append(args, "--load-extension="+extensionPath)
		if !blocksCommandLineExtensionLoad(exe) {
			args = append(args, "--disable-extensions-except="+extensionPath)
		}
		args = append(args, "--exclude-switches=enable-automation")
	}
	if opts.Headless {
		args = append([]string{"--headless=new", "--disable-gpu"}, args...)
	}

	cmd := exec.Command(exe, args...)
	tail := &tailBuffer{limit: 8 << 10}
	cmd.Stdout = io.Discard
	cmd.Stderr = tail
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("start %s: %w", exe, err)
	}

	b := &Browser{opts: opts, cmd: cmd, profile: absProfile, stderr: tail, owned: true}
	port, path, err := waitDevToolsPort(ctx, portFile, tail, opts.LaunchWait)
	if err != nil {
		_ = cmd.Process.Kill()
		return nil, err
	}
	wsURL := fmt.Sprintf("ws://127.0.0.1:%d%s", port, path)
	conn, err := cdp.NewBrowser(wsURL, opts.LaunchWait)
	if err != nil {
		_ = cmd.Process.Kill()
		return nil, fmt.Errorf("connect devtools: %w (%s)", err, tail.String())
	}
	b.cdp = conn
	b.devtoolsHost = fmt.Sprintf("http://127.0.0.1:%d", port)
	b.extensionPath = extensionPath
	b.archiveMode = opts.ArchiveMode
	if extensionPath != "" {
		b.archiveMode = ArchiveModeExtension
		b.enableTargetDiscovery(ctx)
		id, err := b.waitForSingleFileExtension(ctx)
		if err != nil {
			_ = cmd.Process.Kill()
			return nil, fmt.Errorf("SingleFile extension did not load in %s (%w); Google Chrome stable blocks --load-extension — use capture_engine edge", filepath.Base(exe), err)
		}
		b.singleFileExtID = id
		b.wakeSingleFileExtension(ctx, b.singleFileExtID)
	} else if b.archiveMode == ArchiveModeAuto || b.archiveMode == ArchiveModeExtension {
		b.archiveMode = ArchiveModeEmbedded
	}
	return b, nil
}

// attachExisting connects to a browser already serving this profile.
func attachExisting(ctx context.Context, portFile string) (*cdp.Browser, bool) {
	data, err := os.ReadFile(portFile)
	if err != nil {
		return nil, false
	}
	lines := strings.Split(strings.TrimSpace(string(data)), "\n")
	if len(lines) < 2 {
		return nil, false
	}
	port := strings.TrimSpace(lines[0])
	path := strings.TrimSpace(lines[1])
	probeCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(probeCtx, http.MethodGet,
		fmt.Sprintf("http://127.0.0.1:%s/json/version", port), nil)
	if err != nil {
		return nil, false
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, false
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, io.LimitReader(resp.Body, 4096))
	if resp.StatusCode != http.StatusOK {
		return nil, false
	}
	conn, err := cdp.NewBrowser(fmt.Sprintf("ws://127.0.0.1:%s%s", port, path), 5*time.Second)
	if err != nil {
		return nil, false
	}
	return conn, true
}

func devtoolsBaseFromPortFile(portFile string) (string, bool) {
	data, err := os.ReadFile(portFile)
	if err != nil {
		return "", false
	}
	lines := strings.Split(strings.TrimSpace(string(data)), "\n")
	if len(lines) < 1 {
		return "", false
	}
	port := strings.TrimSpace(lines[0])
	if port == "" {
		return "", false
	}
	return fmt.Sprintf("http://127.0.0.1:%s", port), true
}

func (b *Browser) captureEmbeddedOnPage(ctx context.Context, sess *cdp.Session) (*Archive, error) {
	if err := inject(ctx, sess); err != nil {
		return nil, err
	}
	archive, err := extract(ctx, sess)
	if err != nil && isStaleContextError(err) {
		if injectErr := inject(ctx, sess); injectErr == nil {
			archive, err = extract(ctx, sess)
		}
	}
	return archive, err
}

// Close terminates the browser process.
func (b *Browser) Close() error {
	b.closeMu.Lock()
	defer b.closeMu.Unlock()
	if b.closed {
		return nil
	}
	b.closed = true
	if b.cdp != nil {
		_ = b.cdp.Close()
	}
	if b.owned && b.cmd != nil && b.cmd.Process != nil {
		_ = b.cmd.Process.Kill()
		_, _ = b.cmd.Process.Wait()
	}
	return nil
}

// Profile returns the absolute user-data-dir in use.
func (b *Browser) Profile() string { return b.profile }

// Capture navigates to url and returns a SingleFile archive of it.
func (b *Browser) Capture(ctx context.Context, url string) (*Archive, error) {
	if b.closed {
		return nil, errors.New("browser already closed")
	}
	b.singleFileReloaded = false
	sess, err := b.cdp.NewTarget(ctx, "about:blank")
	if err != nil {
		return nil, err
	}
	defer func() {
		closeCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		_, _ = b.cdp.Call(closeCtx, "Target.closeTarget", map[string]any{"targetId": sess.TargetID})
	}()

	if err := sess.CallDecode(ctx, "Page.enable", nil, nil); err != nil {
		return nil, err
	}
	if err := sess.CallDecode(ctx, "Runtime.enable", nil, nil); err != nil {
		return nil, err
	}

	if b.archiveMode == ArchiveModeExtension {
		if extID, err := b.resolveExtensionID(ctx); err == nil && extID != "" {
			b.wakeSingleFileExtension(ctx, extID)
		}
	}

	loaded, stop := b.cdp.Watch(func(ev cdp.Event) bool {
		return ev.SessionID == sess.ID && ev.Method == "Page.loadEventFired"
	})
	defer stop()

	navigateCtx, cancel := context.WithTimeout(ctx, 45*time.Second)
	defer cancel()
	if err := sess.CallDecode(navigateCtx, "Page.navigate", map[string]any{"url": url}, nil); err != nil {
		return nil, fmt.Errorf("navigate: %w", err)
	}

	select {
	case <-loaded:
	case <-navigateCtx.Done():
		// Leave the page to the readyState probe below: slow pages still capture.
	}

	if err := b.waitForContent(ctx, sess); err != nil {
		return nil, err
	}

	if err := prepareArticleImages(ctx, sess); err != nil {
		if errors.Is(err, context.DeadlineExceeded) || strings.Contains(err.Error(), "context deadline exceeded") {
			// Best-effort lazy-load prep; SingleFile can still fetch deferred images.
		} else {
			return nil, err
		}
	}

	if b.archiveMode == ArchiveModeExtension {
		state, err := readPageState(ctx, sess)
		if err != nil {
			return nil, err
		}
		pageURL := state.URL
		if pageURL == "" {
			pageURL = url
		}
		archive, extErr := b.captureWithSingleFileExtension(ctx, sess, pageURL)
		if extErr == nil {
			return archive, nil
		}
		if emb, embErr := b.captureEmbeddedOnPage(ctx, sess); embErr == nil {
			return emb, nil
		}
		return nil, extErr
	}

	if err := inject(ctx, sess); err != nil {
		return nil, err
	}
	archive, err := extract(ctx, sess)
	if err != nil && isStaleContextError(err) {
		// A redirect may have discarded the injected script; retry once.
		if injectErr := inject(ctx, sess); injectErr == nil {
			archive, err = extract(ctx, sess)
		}
	}
	if err != nil {
		return nil, err
	}
	return archive, nil
}

const stateExpr = `(() => {
  const body = document.body;
  const text = ((body && body.innerText) || "").trim();
  const href = location.href;
  const hasArticle = !!document.querySelector(
    "#js_content, .rich_media_content, .article_body, .article_text, .art-con.article_body, article, main"
  );
  const challengeUrl = /wappoc_appmsgcaptcha|wappoc_appmsg/i.test(href);
  const challengeText = !hasArticle &&
    /(环境异常|完成验证|安全验证|Just a moment|Checking your browser|Enable JavaScript and cookies)/i.test(text);
  const errorPage = location.protocol === "chrome-error:" ||
    /chromewebdata/i.test(href) ||
    !!document.querySelector("#main-message, .interstitial-wrapper, .error-code, .neterror");
  return {
    ready: document.readyState,
    textLen: text.length,
    challenge: challengeUrl || challengeText,
    hasArticle,
    errorPage,
    url: href
  };
})()`

type pageState struct {
	Ready      string `json:"ready"`
	TextLen    int    `json:"textLen"`
	Challenge  bool   `json:"challenge"`
	HasArticle bool   `json:"hasArticle"`
	ErrorPage  bool   `json:"errorPage"`
	URL        string `json:"url"`
}

func readPageState(ctx context.Context, sess *cdp.Session) (pageState, error) {
	var wire struct {
		Result struct {
			Value pageState `json:"value"`
		} `json:"result"`
		ExceptionDetails *struct {
			Text string `json:"text"`
		} `json:"exceptionDetails"`
	}
	var state pageState
	err := sess.CallDecode(ctx, "Runtime.evaluate", map[string]any{
		"expression":    stateExpr,
		"returnByValue": true,
	}, &wire)
	if err != nil {
		return state, err
	}
	if wire.ExceptionDetails != nil {
		return state, fmt.Errorf("page state: %s", wire.ExceptionDetails.Text)
	}
	return wire.Result.Value, nil
}

// waitForContent waits for readable, stable content instead of just the load
// event. Challenge pages are given a longer interactive window (a human can
// solve them in the visible browser); empty shells are rejected rather than
// uploaded as evidence.
func (b *Browser) waitForContent(ctx context.Context, sess *cdp.Session) error {
	readyWait := b.opts.ReadyWait
	interactiveWait := b.opts.InteractiveWait
	minText := b.opts.MinTextChars

	readyDeadline := time.Now().Add(readyWait)
	interactiveDeadline := time.Now().Add(interactiveWait)
	stable, lastLen := 0, -1

	for {
		state, err := readPageState(ctx, sess)
		if err != nil {
			return err
		}
		switch {
		case state.ErrorPage:
			return fmt.Errorf(
				"page did not load (%s); turn off headless capture, use capture_engine edge, and retry in a visible browser window",
				state.URL,
			)
		case state.Challenge:
			stable = 0
			if b.opts.Headless {
				if time.Now().After(readyDeadline) {
					return fmt.Errorf(
						"page is a verification challenge (%s); complete it in a visible browser with a logged-in profile",
						state.URL,
					)
				}
			} else if time.Now().After(interactiveDeadline) {
				return fmt.Errorf(
					"verification challenge was not completed within %s: %s",
					interactiveWait, state.URL,
				)
			}
		case state.Ready == "complete" && state.TextLen >= minText:
			if state.TextLen == lastLen {
				stable++
			} else {
				stable = 1
				lastLen = state.TextLen
			}
			if stable >= 2 {
				return nil
			}
		default:
			stable = 0
			lastLen = state.TextLen
			if time.Now().After(readyDeadline) {
				if state.TextLen > 0 && !state.Challenge {
					return nil
				}
				return fmt.Errorf(
					"no readable content within %s (text=%d, url=%s)",
					readyWait, state.TextLen, state.URL,
				)
			}
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(250 * time.Millisecond):
		}
	}
}

func evalBool(ctx context.Context, sess *cdp.Session, expr string) (bool, error) {
	var res struct {
		Result struct {
			Value bool `json:"value"`
		} `json:"result"`
		ExceptionDetails *struct {
			Text string `json:"text"`
		} `json:"exceptionDetails"`
	}
	if err := sess.CallDecode(ctx, "Runtime.evaluate", map[string]any{
		"expression":    expr,
		"returnByValue": true,
	}, &res); err != nil {
		return false, err
	}
	if res.ExceptionDetails != nil {
		return false, fmt.Errorf("evaluate %q: %s", expr, res.ExceptionDetails.Text)
	}
	return res.Result.Value, nil
}

func inject(ctx context.Context, sess *cdp.Session) error {
	script := singlefile.Script() + "\n;globalThis.__EEA_SF__ !== undefined;"
	var res struct {
		Result struct {
			Value bool `json:"value"`
		} `json:"result"`
		ExceptionDetails *struct {
			Text string `json:"text"`
		} `json:"exceptionDetails"`
	}
	if err := sess.CallDecode(ctx, "Runtime.evaluate", map[string]any{
		"expression":    script,
		"returnByValue": true,
	}, &res); err != nil {
		return fmt.Errorf("inject singlefile: %w", err)
	}
	if res.ExceptionDetails != nil {
		return fmt.Errorf("inject singlefile: %s", res.ExceptionDetails.Text)
	}
	if !res.Result.Value {
		return errors.New("singlefile did not install in page context")
	}
	return nil
}

const extractExpr = `(async () => {
  const sf = globalThis.__EEA_SF__;
  if (!sf || typeof sf.getPageData !== "function") {
    return { error: "singlefile library missing" };
  }
  if (typeof sf.init === "function") {
    try { sf.init({ fetch: globalThis.fetch.bind(globalThis) }); } catch (_) {}
  }
  try {
    const data = await sf.getPageData({
      loadDeferredContent: true,
      blockImages: false,
      blockScripts: false,
      blockVideos: false,
      compressContent: false
    });
    return {
      url: location.href,
      title: document.title,
      mimeType: data.mimeType,
      content: data.content
    };
  } catch (e) {
    return { error: String((e && e.stack) || e) };
  }
})()`

func extract(ctx context.Context, sess *cdp.Session) (*Archive, error) {
	var wire struct {
		Result struct {
			Value json.RawMessage `json:"value"`
		} `json:"result"`
		ExceptionDetails *struct {
			Text string `json:"text"`
		} `json:"exceptionDetails"`
	}
	if err := sess.CallDecode(ctx, "Runtime.evaluate", map[string]any{
		"expression":    extractExpr,
		"awaitPromise":  true,
		"returnByValue": true,
	}, &wire); err != nil {
		return nil, fmt.Errorf("singlefile run: %w", err)
	}
	if wire.ExceptionDetails != nil {
		return nil, fmt.Errorf("singlefile run: %s", wire.ExceptionDetails.Text)
	}
	if len(wire.Result.Value) == 0 {
		return nil, errors.New("singlefile returned no data")
	}
	var page struct {
		URL      string `json:"url"`
		Title    string `json:"title"`
		MimeType string `json:"mimeType"`
		Content  string `json:"content"`
		Error    string `json:"error"`
	}
	if err := json.Unmarshal(wire.Result.Value, &page); err != nil {
		return nil, fmt.Errorf("decode singlefile result: %w", err)
	}
	if page.Error != "" {
		return nil, fmt.Errorf("singlefile: %s", page.Error)
	}
	if len(page.Content) == 0 {
		return nil, errors.New("singlefile produced empty content")
	}
	if !strings.Contains(page.Content, "<html") && !strings.Contains(page.Content, "<!DOCTYPE") {
		return nil, errors.New("singlefile content is not an HTML document")
	}
	if page.MimeType == "" {
		page.MimeType = "text/html"
	}
	return &Archive{
		URL:      page.URL,
		Title:    strings.TrimSpace(page.Title),
		MimeType: page.MimeType,
		HTML:     []byte(page.Content),
	}, nil
}

func isStaleContextError(err error) bool {
	msg := err.Error()
	return strings.Contains(msg, "singlefile library missing") ||
		strings.Contains(msg, "Cannot access") ||
		strings.Contains(msg, "Execution context was destroyed") ||
		strings.Contains(msg, "Inspected target navigated")
}

// ResolveBrowser finds the browser executable for the requested engine.
func ResolveBrowser(engine, explicit string) (string, error) {
	if explicit != "" {
		if _, err := os.Stat(explicit); err != nil {
			return "", fmt.Errorf("browser_path: %w", err)
		}
		return explicit, nil
	}
	engine = strings.ToLower(strings.TrimSpace(engine))
	if engine == "" {
		engine = "edge"
	}
	names, err := platformBrowserCandidates(engine)
	if err != nil {
		return "", err
	}
	for _, c := range names {
		if c == "" {
			continue
		}
		if _, err := os.Stat(c); err == nil {
			return c, nil
		}
	}
	return "", fmt.Errorf("no %s executable found; set browser_path in config.json", engine)
}

func waitDevToolsPort(ctx context.Context, path string, stderr *tailBuffer, limit time.Duration) (int, string, error) {
	deadline := time.Now().Add(limit)
	for {
		if data, err := os.ReadFile(path); err == nil {
			lines := strings.Split(strings.TrimSpace(string(data)), "\n")
			if len(lines) >= 2 {
				port, err := strconv.Atoi(strings.TrimSpace(lines[0]))
				if err == nil && port > 0 {
					return port, strings.TrimSpace(lines[1]), nil
				}
			}
		}
		if time.Now().After(deadline) {
			return 0, "", fmt.Errorf("browser did not expose DevTools port: %s", stderr.String())
		}
		select {
		case <-ctx.Done():
			return 0, "", ctx.Err()
		case <-time.After(100 * time.Millisecond):
		}
	}
}

type tailBuffer struct {
	mu    sync.Mutex
	buf   bytes.Buffer
	limit int
}

func (t *tailBuffer) Write(p []byte) (int, error) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.buf.Write(p)
	if t.buf.Len() > t.limit {
		b := t.buf.Bytes()
		t.buf.Reset()
		t.buf.Write(b[len(b)-t.limit:])
	}
	return len(p), nil
}

func (t *tailBuffer) String() string {
	t.mu.Lock()
	defer t.mu.Unlock()
	return strings.TrimSpace(t.buf.String())
}
