//go:build windows

// Package ui is the compact capture window: one merged paste/drop surface,
// with deployment details behind an advanced panel.
package ui

import (
	"context"
	"fmt"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/rodrigocfd/windigo/co"
	"github.com/rodrigocfd/windigo/ui"
	"github.com/rodrigocfd/windigo/win"

	"eea/capture/internal/archive"
	"eea/capture/internal/capture"
	"eea/capture/internal/config"
	"eea/capture/internal/platform"
	"eea/capture/internal/queue"
)

const (
	winTitle = "EEA 采集"
	winClass = "EEACaptureWindow"
)

// Run shows the window and blocks until it closes.
func Run(cfg config.Config, dir string) int {
	runtime.LockOSThread()
	if err := win.OleInitialize(); err != nil {
		win.HWND(0).MessageBox("OLE 初始化失败："+err.Error(), winTitle, co.MB_ICONERROR)
		return 1
	}
	defer win.OleUninitialize()

	app := newApp(cfg, dir)
	code := app.wnd.RunAsMain()
	app.engine.close()
	return code
}

type appState struct {
	wnd     *ui.Main
	hwnd    win.HWND
	page    win.HBRUSH
	nullPen win.HPEN
	fonts   fonts
	lay     frame
	engine  *lazyEngine

	edt       *ui.Edit
	edtAPI    *ui.Edit
	edtPar    *ui.Edit
	edtMax    *ui.Edit
	edtTime   *ui.Edit
	panelOpen bool
	panelNote string

	cfg config.Config
	dir string

	busy       int
	done       int
	failed     int
	lastErr    string
	lastSignal string
	notice     string

	engineChrome bool
	headlessOn   bool

	buf     win.HDC
	bufBmp  win.HBITMAP
	bufOld  win.HBITMAP
	bufW    int
	bufH    int
	curHand win.HCURSOR
	mu      sync.Mutex
}

func newApp(cfg config.Config, dir string) *appState {
	w := ui.DpiX(460)
	h := ui.DpiY(308)
	app := &appState{
		cfg:          cfg,
		dir:          dir,
		panelNote:    "",
		engine:       &lazyEngine{opts: engineOptions(cfg)},
		engineChrome: strings.EqualFold(cfg.CaptureEngine, "chrome"),
		headlessOn:   cfg.Headless,
	}

	wnd := ui.NewMain(ui.OptsMain().
		ClassName(winClass).
		Title(winTitle).
		Size(w, h).
		ClassStyle(co.CS_DBLCLKS | co.CS_DROPSHADOW | co.CS_HREDRAW | co.CS_VREDRAW).
		Style(co.WS_POPUP | co.WS_SYSMENU | co.WS_CLIPCHILDREN | co.WS_VISIBLE).
		ExStyle(co.WS_EX_APPWINDOW).
		DropFiles(true))
	app.wnd = wnd

	f := layoutFrame(w, h, winScale)
	app.lay = f

	app.edt = ui.NewEdit(wnd, ui.OptsEdit().
		Position(int(f.area.l), int(f.area.t)).
		Width(f.area.dx()).
		Height(f.area.dy()).
		CtrlStyle(co.ES_MULTILINE|co.ES_AUTOVSCROLL|co.ES_WANTRETURN).
		WndStyle(co.WS_CHILD|co.WS_VISIBLE|co.WS_TABSTOP).
		WndExStyle(co.WS_EX_LEFT))

	app.edtAPI = panelField(wnd, f.apiField)
	app.edtPar = panelField(wnd, f.parallelField)
	app.edtMax = panelField(wnd, f.maxField)
	app.edtTime = panelField(wnd, f.timeField)

	app.events()
	return app
}

func panelField(parent ui.Parent, b box) *ui.Edit {
	return ui.NewEdit(parent, ui.OptsEdit().
		Position(int(b.l)+winScale.x(8), int(b.t)+winScale.y(5)).
		Width(b.dx()-winScale.x(16)).
		Height(b.dy()-winScale.y(10)).
		WndStyle(co.WS_CHILD|co.WS_VISIBLE|co.WS_TABSTOP).
		WndExStyle(co.WS_EX_LEFT))
}

func (a *appState) events() {
	a.wnd.On().WmCreate(func(ui.WmCreate) int {
		a.hwnd = a.wnd.Hwnd()
		a.page = solidBrush(pageR, pageG, pageB)
		if stock, err := win.GetStockObject(co.STOCK_NULL_PEN); err == nil {
			a.nullPen = win.HPEN(stock)
		}
		a.fonts = fonts{
			title: segoeFont(ui.DpiY(16), co.FW_SEMIBOLD),
			body:  segoeFont(ui.DpiY(13), co.FW_NORMAL),
			small: segoeFont(ui.DpiY(11), co.FW_NORMAL),
		}
		a.applyEditFont(a.edt)
		a.applyEditFont(a.edtAPI)
		a.applyEditFont(a.edtPar)
		a.applyEditFont(a.edtMax)
		a.applyEditFont(a.edtTime)
		a.hidePanel(true)
		roundWindow(a.hwnd)
		_, _ = a.edt.Hwnd().SetFocus()
		a.invalidate()
		return 0
	})

	a.wnd.On().WmEraseBkgnd(func(ui.WmEraseBkgnd) int { return 1 })
	a.wnd.On().WmPaint(func() { a.paint() })

	a.wnd.On().WmNcHitTest(func(p ui.WmNcHitTest) co.HT {
		pt := p.CursorPos()
		_ = a.hwnd.ScreenToClientPt(&pt)
		if a.lay.header.contains(pt.X, pt.Y) {
			if a.lay.settings.contains(pt.X, pt.Y) || a.lay.min.contains(pt.X, pt.Y) || a.lay.close.contains(pt.X, pt.Y) {
				return co.HT_CLIENT
			}
			return co.HT_CAPTION
		}
		return co.HT_CLIENT
	})

	a.wnd.On().WmLButtonUp(func(p ui.WmMouse) {
		a.click(p.Pos())
	})

	a.wnd.On().WmSetCursor(func(p ui.WmSetCursor) bool {
		ht := co.HT(p.Raw.LParam.LoWord())
		if ht != co.HT_CLIENT {
			return false
		}
		pt, err := win.GetCursorPos()
		if err != nil {
			return false
		}
		_ = a.hwnd.ScreenToClientPt(&pt)
		if a.hitButton(pt) {
			setCursor(a.handCursor())
			return true
		}
		return false
	})

	a.wnd.On().WmKeyDown(func(p ui.WmKey) {
		if win.GetAsyncKeyState(co.VK_CONTROL)&0x8000 != 0 && p.VirtualKeyCode() == co.VK_RETURN {
			a.submitText()
		}
		if p.VirtualKeyCode() == co.VK_ESCAPE && a.panelOpen {
			a.closePanel()
		}
	})

	a.wnd.On().WmDropFiles(func(p ui.WmDropFiles) {
		files, err := p.HDrop().DragQueryFile()
		p.HDrop().DragFinish()
		if err != nil {
			a.notice = "读取拖入文件失败"
			a.invalidate()
			return
		}
		a.submitDropped(files)
	})

	a.wnd.On().WmClose(func() {
		_ = a.hwnd.DestroyWindow()
	})

	a.wnd.On().WmDestroy(func() {
		a.dropBack()
		for _, f := range []win.HFONT{a.fonts.title, a.fonts.body, a.fonts.small} {
			if f != 0 {
				_ = f.DeleteObject()
			}
		}
		if a.page != 0 {
			_ = a.page.DeleteObject()
		}
	})
}

func (a *appState) click(pt win.POINT) {
	f := a.lay
	switch {
	case f.close.contains(pt.X, pt.Y):
		_ = a.hwnd.DestroyWindow()
	case f.min.contains(pt.X, pt.Y):
		a.hwnd.ShowWindow(co.SW_MINIMIZE)
	case f.settings.contains(pt.X, pt.Y):
		if a.panelOpen {
			a.closePanel()
		} else {
			a.openPanel()
		}
	case a.panelOpen && f.save.contains(pt.X, pt.Y):
		a.savePanel()
	case a.panelOpen && f.cancel.contains(pt.X, pt.Y):
		a.closePanel()
	case a.panelOpen && f.engineRow.contains(pt.X, pt.Y):
		a.engineChrome = !a.engineChrome
		a.invalidate()
	case a.panelOpen && f.headlessRow.contains(pt.X, pt.Y):
		a.headlessOn = !a.headlessOn
		a.invalidate()
	case !a.panelOpen && f.send.contains(pt.X, pt.Y):
		a.submitText()
	}
}

func (a *appState) hitButton(pt win.POINT) bool {
	f := a.lay
	if f.settings.contains(pt.X, pt.Y) || f.min.contains(pt.X, pt.Y) || f.close.contains(pt.X, pt.Y) {
		return true
	}
	if a.panelOpen {
		return f.save.contains(pt.X, pt.Y) || f.cancel.contains(pt.X, pt.Y) ||
			f.engineRow.contains(pt.X, pt.Y) || f.headlessRow.contains(pt.X, pt.Y)
	}
	return f.send.contains(pt.X, pt.Y)
}

func (a *appState) openPanel() {
	a.panelOpen = true
	a.panelNote = ""
	a.edtAPI.SetText(a.cfg.EffectiveAPIBase())
	a.edtPar.SetText(strconv.Itoa(a.cfg.MaxParallel))
	a.edtMax.SetText(strconv.Itoa(a.cfg.MaxUploadMB))
	a.edtTime.SetText(strconv.Itoa(a.cfg.TimeoutSec))
	a.hidePanel(false)
	a.edt.Hwnd().ShowWindow(co.SW_HIDE)
	_, _ = a.edtAPI.Hwnd().SetFocus()
	a.invalidate()
}

func (a *appState) closePanel() {
	a.panelOpen = false
	a.hidePanel(true)
	_ = a.edt.Hwnd().ShowWindow(co.SW_SHOW)
	_, _ = a.edt.Hwnd().SetFocus()
	a.invalidate()
}

func (a *appState) hidePanel(hide bool) {
	cmd := co.SW_SHOW
	if hide {
		cmd = co.SW_HIDE
	}
	for _, e := range []*ui.Edit{a.edtAPI, a.edtPar, a.edtMax, a.edtTime} {
		if e != nil {
			e.Hwnd().ShowWindow(cmd)
		}
	}
}

func (a *appState) savePanel() {
	api := strings.TrimRight(strings.TrimSpace(a.edtAPI.Text()), "/")
	if !strings.HasPrefix(api, "http://") && !strings.HasPrefix(api, "https://") {
		a.panelNote = "接口地址需以 http:// 或 https:// 开头"
		a.invalidate()
		return
	}
	par, err1 := bounded(a.edtPar.Text(), 1, 8)
	maxMB, err2 := bounded(a.edtMax.Text(), 1, 512)
	secs, err3 := bounded(a.edtTime.Text(), 5, 900)
	if err1 != nil || err2 != nil || err3 != nil {
		a.panelNote = "并发 1–8，上限 1–512 MB，超时 5–900 秒"
		a.invalidate()
		return
	}

	engine := "edge"
	if a.engineChrome {
		engine = "chrome"
	}
	engineChanged := a.cfg.CaptureEngine != engine || a.cfg.Headless != a.headlessOn
	a.cfg.APIBase = api
	a.cfg.AutoAPI = false
	a.cfg.MaxParallel = par
	a.cfg.MaxUploadMB = maxMB
	a.cfg.TimeoutSec = secs
	a.cfg.CaptureEngine = engine
	a.cfg.Headless = a.headlessOn
	if err := config.Save(a.dir, a.cfg); err != nil {
		a.panelNote = "保存失败：" + err.Error()
		a.invalidate()
		return
	}
	if engineChanged {
		a.engine.close()
		a.engine = &lazyEngine{opts: engineOptions(a.cfg)}
	}
	a.closePanel()
}

func bounded(text string, lo, hi int) (int, error) {
	n, err := strconv.Atoi(strings.TrimSpace(text))
	if err != nil || n < lo || n > hi {
		return 0, fmt.Errorf("out of range")
	}
	return n, nil
}

func (a *appState) submitText() {
	urls := a.pendingURLs()
	if len(urls) == 0 {
		a.notice = "先粘贴至少一条 http(s) 链接，或拖入文件"
		a.invalidate()
		return
	}
	a.notice = ""
	a.edt.SetText("")
	a.resetCounters()
	a.startBatch(func(q *queue.Queue) {
		for _, u := range urls {
			q.SubmitURL(u, "")
		}
	}, len(urls))
}

// submitDropped routes saved SingleFile HTML to the archive endpoint and every
// other file to the raw document endpoint. HTML without a source URL is skipped
// rather than silently filed as an anonymous document.
func (a *appState) submitDropped(files []string) {
	type drop struct {
		path  string
		url   string
		saved bool
	}
	var items []drop
	var noURL []string
	for _, f := range files {
		switch strings.ToLower(filepath.Ext(f)) {
		case ".html", ".htm":
			if u, err := archive.SourceURL(f); err == nil && u != "" {
				items = append(items, drop{path: f, url: u, saved: true})
			} else {
				noURL = append(noURL, filepath.Base(f))
			}
		default:
			items = append(items, drop{path: f})
		}
	}
	if len(items) == 0 {
		a.notice = "HTML 里找不到 canonical/og:url：" + strings.Join(noURL, "、")
		a.invalidate()
		return
	}
	a.notice = ""
	if len(noURL) > 0 {
		a.notice = "已跳过无原链接的 HTML：" + strings.Join(noURL, "、")
	}
	a.resetCounters()
	a.startBatch(func(q *queue.Queue) {
		for _, it := range items {
			if it.saved {
				q.SubmitArchive(it.path, it.url)
			} else {
				q.SubmitFile(it.path)
			}
		}
	}, len(items))
}

func (a *appState) resetCounters() {
	if a.busy == 0 {
		a.done, a.failed = 0, 0
		a.lastErr, a.lastSignal = "", ""
	}
}

func (a *appState) startBatch(submit func(*queue.Queue), n int) {
	a.busy += n
	api := platform.New(a.cfg.EffectiveAPIBase(), a.cfg.MaxUploadMB)
	q := queue.New(a.engine, api, queue.Options{
		Workers:       a.cfg.MaxParallel,
		Retries:       2,
		Timeout:       time.Duration(a.cfg.TimeoutSec) * time.Second,
		UploadTimeout: time.Duration(a.cfg.UploadTimeout) * time.Second,
		OnUpdate:      a.onJob,
	})
	submit(q)
	q.Start()
	a.invalidate()

	go func() {
		q.Wait()
		q.Close()
		a.wnd.UiThread(func() { a.invalidate() })
	}()
}

func (a *appState) onJob(j queue.Job) {
	a.wnd.UiThread(func() {
		switch j.Status {
		case queue.StatusDone:
			a.done++
			if j.SignalID != "" {
				a.lastSignal = j.SignalID
			}
			a.busy--
		case queue.StatusFailed:
			a.failed++
			a.lastErr = j.Err
			a.busy--
		}
		if a.busy < 0 {
			a.busy = 0
		}
		a.invalidate()
	})
}

func (a *appState) pendingURLs() []string {
	seen := map[string]bool{}
	var urls []string
	for _, line := range strings.Split(a.edt.Text(), "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "http://") && !strings.HasPrefix(line, "https://") {
			continue
		}
		if seen[line] {
			continue
		}
		seen[line] = true
		urls = append(urls, line)
	}
	return urls
}

func (a *appState) pendingLines() int { return len(a.pendingURLs()) }

func (a *appState) canSend() bool { return a.pendingLines() > 0 && a.busy == 0 }

func (a *appState) statusText() string {
	switch {
	case a.busy > 0:
		return fmt.Sprintf("处理中 · 剩余 %d", a.busy)
	case a.failed > 0:
		msg := fmt.Sprintf("完成 %d · 失败 %d", a.done, a.failed)
		if a.lastErr != "" {
			msg += " · " + truncate(a.lastErr, 40)
		}
		return msg
	case a.notice != "":
		return a.notice
	case a.done > 0:
		msg := fmt.Sprintf("完成 %d", a.done)
		if a.lastSignal != "" {
			msg += " · " + a.lastSignal
		}
		return msg
	default:
		return "就绪"
	}
}

func (a *appState) engineText() string {
	if a.engineChrome {
		return "Chrome"
	}
	return "Edge"
}

func (a *appState) profilePath() string {
	abs, err := filepath.Abs(a.cfg.UserDataDir)
	if err != nil {
		return a.cfg.UserDataDir
	}
	return abs
}

func (a *appState) applyEditFont(e *ui.Edit) {
	if e == nil || e.Hwnd() == 0 {
		return
	}
	_, _ = e.Hwnd().SendMessage(co.WM_SETFONT, win.WPARAM(a.fonts.body), win.LPARAM(1))
}

func (a *appState) handCursor() win.HCURSOR {
	if a.curHand == 0 {
		a.curHand, _ = win.HINSTANCE(0).LoadCursor(win.CursorResIdc(co.IDC_HAND))
	}
	return a.curHand
}

func truncate(s string, n int) string {
	s = strings.TrimSpace(strings.ReplaceAll(s, "\n", " "))
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n-1]) + "…"
}

func segoeFont(height int, weight co.FW) win.HFONT {
	lf := &win.LOGFONT{Height: -int32(height), Weight: weight}
	lf.SetFaceName("Segoe UI")
	font, err := win.CreateFontIndirect(lf)
	if err != nil {
		return 0
	}
	return font
}

func engineOptions(cfg config.Config) capture.Options {
	return capture.Options{
		Engine:          cfg.CaptureEngine,
		BrowserPath:     cfg.BrowserPath,
		UserDataDir:     cfg.UserDataDir,
		Headless:        cfg.Headless,
		ReadyWait:       time.Duration(cfg.ReadyTimeout) * time.Second,
		InteractiveWait: time.Duration(cfg.InteractiveTimeout) * time.Second,
		MinTextChars:    cfg.MinTextChars,
	}
}

type lazyEngine struct {
	mu   sync.Mutex
	b    *capture.Browser
	opts capture.Options
}

func (l *lazyEngine) Capture(ctx context.Context, url string) (*capture.Archive, error) {
	l.mu.Lock()
	if l.b == nil {
		b, err := capture.Launch(ctx, l.opts)
		if err != nil {
			l.mu.Unlock()
			return nil, err
		}
		l.b = b
	}
	b := l.b
	l.mu.Unlock()
	return b.Capture(ctx, url)
}

func (l *lazyEngine) close() {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.b != nil {
		_ = l.b.Close()
		l.b = nil
	}
}
