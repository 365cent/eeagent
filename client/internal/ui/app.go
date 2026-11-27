//go:build windows

// Package ui is the compact capture window: one merged paste/drop surface,
// with deployment details behind an advanced panel.
package ui

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/rodrigocfd/windigo/co"
	"github.com/rodrigocfd/windigo/ui"
	"github.com/rodrigocfd/windigo/win"

	"eea/capture/internal/application"
	"eea/capture/internal/archive"
	"eea/capture/internal/capture"
	"eea/capture/internal/config"
	"eea/capture/internal/importdrain"
	"eea/capture/internal/queue"
)

const (
	winTitle = "EEA 采集"
	winClass = "EEACaptureWindow"
)

// Run shows the window and blocks until it closes.
//
// link is the eea-capture:// URL the process was launched with (empty for a
// normal double-click): the platform's "打开采集客户端" button uses it to hand
// queued jobs to this instance.
func Run(cfg config.Config, dir, link string) (code int) {
	runtime.LockOSThread()
	// A panic before the first window exists is invisible in a -H=windowsgui
	// build; turn it into a dialog so "double-click did nothing" is diagnosable.
	defer func() {
		if r := recover(); r != nil {
			_, _ = win.HWND(0).MessageBox(fmt.Sprintf("采集客户端启动失败：\n%v", r), winTitle, co.MB_OK|co.MB_ICONERROR)
			code = 1
		}
	}()
	if err := win.OleInitialize(); err != nil {
		win.HWND(0).MessageBox("OLE 初始化失败："+err.Error(), winTitle, co.MB_ICONERROR)
		return 1
	}
	defer win.OleUninitialize()

	// Double-clicking again while an instance is already up (minimised, behind
	// the editor) used to open a second window nobody noticed. Bring the running
	// one forward instead: one queue, one browser profile, one visible result.
	// An app link also tells that instance to start claiming right away.
	if hwnd, ok := runningWindow(); ok {
		bringForward(hwnd)
		if link != "" {
			if !sendLaunchLink(hwnd, link) {
				// Delivery failed: the 20s drain still claims the queued job.
				_ = hwnd.SetForegroundWindow()
			}
		}
		return 0
	}

	app := newApp(cfg, dir, link)
	drainCtx, stopDrain := context.WithCancel(context.Background())
	app.drainWG.Add(1)
	go func() {
		defer app.drainWG.Done()
		app.runServerImportDrain(drainCtx)
	}()
	app.kickDrain()
	code = app.wnd.RunAsMain()
	stopDrain()
	app.drainWG.Wait()
	app.rt.Close()
	return code
}

type appState struct {
	wnd     *ui.Main
	hwnd    win.HWND
	page    win.HBRUSH
	nullPen win.HPEN
	fonts   fonts
	lay     frame
	rt      *application.Runtime

	edt       *ui.Edit
	edtAPI    *ui.Edit
	edtPar    *ui.Edit
	edtMax    *ui.Edit
	edtTime   *ui.Edit
	panelOpen bool
	panelNote string
	showJobs  bool

	cfg config.Config
	dir string

	busy          int
	done          int
	failed        int
	notice        string
	jobs          map[int]queue.Job
	jobPage       int
	activeQueue   *queue.Queue
	queueRunning  bool
	closeWhenIdle bool
	tickerStop    chan struct{}

	// The local queue and the platform (awaiting_client) drain share one
	// browser session; captureOwner serializes them. drainRunning mirrors the
	// server drain for UI checks.
	drainRunning atomic.Bool
	drainWG      sync.WaitGroup
	// drainKick asks the drain loop for an immediate pass (app link received).
	drainKick    chan struct{}
	launchLink   string
	captureMu    sync.Mutex
	captureOwner string

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

func newApp(cfg config.Config, dir, link string) *appState {
	w := ui.DpiX(460)
	h := ui.DpiY(308)
	panelNote := ""
	if err := capture.EnsureSingleFileExtension(dir, cfg.UserDataDir, cfg.CaptureArchive, cfg.CaptureEngine, &cfg.SingleFileExtensionPath); err != nil {
		panelNote = err.Error()
	}
	app := &appState{
		cfg:          cfg,
		dir:          dir,
		panelNote:    panelNote,
		rt:           application.New(cfg, dir),
		engineChrome: strings.EqualFold(cfg.CaptureEngine, "chrome"),
		headlessOn:   cfg.Headless,
		jobs:         make(map[int]queue.Job),
		drainKick:    make(chan struct{}, 1),
		launchLink:   link,
	}
	if cfg.StartupNotice != "" {
		// main had to fall back to defaults; say so on the status line rather
		// than opening a window that silently ignores the user's config.
		app.notice = cfg.StartupNotice
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
		a.showInputControls()
		roundWindow(a.hwnd)
		_, _ = a.edt.Hwnd().SetFocus()
		a.resumeQueue()
		a.startRepaintTicker()
		if a.launchLink != "" {
			a.acceptLaunchLink(a.launchLink)
		}
		a.invalidate()
		return 0
	})

	// A second instance forwards its app link here instead of opening a window.
	a.wnd.On().WmCopyData(func(p ui.WmCopyData) bool { return a.onLaunchLink(p) })

	a.wnd.On().WmEraseBkgnd(func(ui.WmEraseBkgnd) int { return 1 })
	a.wnd.On().WmPaint(func() { a.paint() })

	a.wnd.On().WmNcHitTest(func(p ui.WmNcHitTest) co.HT {
		pt := p.CursorPos()
		_ = a.hwnd.ScreenToClientPt(&pt)
		if a.lay.header.contains(pt.X, pt.Y) {
			if a.lay.settings.contains(pt.X, pt.Y) || a.lay.min.contains(pt.X, pt.Y) || a.lay.close.contains(pt.X, pt.Y) ||
				a.lay.linkNav.contains(pt.X, pt.Y) || a.lay.jobsNav.contains(pt.X, pt.Y) {
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
		if !a.panelOpen && !a.showJobs && win.GetAsyncKeyState(co.VK_CONTROL)&0x8000 != 0 && p.VirtualKeyCode() == co.VK_RETURN {
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
		a.requestClose()
	})

	a.wnd.On().WmDestroy(func() {
		a.stopRepaintTicker()
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
		a.requestClose()
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
	case !a.panelOpen && f.linkNav.contains(pt.X, pt.Y):
		a.showJobs = false
		a.notice = ""
		a.showInputControls()
		_, _ = a.edt.Hwnd().SetFocus()
		a.invalidate()
	case !a.panelOpen && f.jobsNav.contains(pt.X, pt.Y):
		a.showJobs = true
		a.notice = ""
		a.showInputControls()
		a.invalidate()
	case !a.panelOpen && a.showJobs && f.jobPrev.contains(pt.X, pt.Y):
		if a.jobPage > 0 {
			a.jobPage--
		}
		a.invalidate()
	case !a.panelOpen && a.showJobs && f.jobNext.contains(pt.X, pt.Y):
		if (a.jobPage+1)*len(f.jobRows) < len(a.orderedJobs()) {
			a.jobPage++
		}
		a.invalidate()
	case !a.panelOpen && a.showJobs && a.clickJobAction(pt, f):
		return
	case !a.panelOpen && !a.showJobs && f.send.contains(pt.X, pt.Y):
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
	if f.linkNav.contains(pt.X, pt.Y) || f.jobsNav.contains(pt.X, pt.Y) {
		return true
	}
	if a.showJobs {
		if f.jobPrev.contains(pt.X, pt.Y) || f.jobNext.contains(pt.X, pt.Y) {
			return true
		}
		for i, row := range f.jobRows {
			if row.empty() {
				continue
			}
			if f.jobPrimary[i].contains(pt.X, pt.Y) || f.jobSecondary[i].contains(pt.X, pt.Y) {
				return true
			}
		}
		return false
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
	a.hideInputControls()
	_, _ = a.edtAPI.Hwnd().SetFocus()
	a.invalidate()
}

func (a *appState) closePanel() {
	a.panelOpen = false
	a.hidePanel(true)
	a.showInputControls()
	_, _ = a.edt.Hwnd().SetFocus()
	a.invalidate()
}

func (a *appState) hideInputControls() {
	for _, e := range []*ui.Edit{a.edt} {
		if e != nil {
			_ = e.Hwnd().ShowWindow(co.SW_HIDE)
		}
	}
}

func (a *appState) showInputControls() {
	if a.panelOpen {
		a.hideInputControls()
		return
	}
	if a.showJobs {
		a.hideInputControls()
		return
	}
	_ = a.edt.Hwnd().ShowWindow(co.SW_SHOW)
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
	if a.busy > 0 || a.captureQueued() || !a.beginLocalCapture() {
		a.panelNote = "当前任务尚未结束，请等待后再保存设置"
		a.invalidate()
		return
	}
	defer a.endLocalCapture()
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
	next := a.cfg
	next.APIBase = api
	next.AutoAPI = false
	next.MaxParallel = par
	next.MaxUploadMB = maxMB
	next.TimeoutSec = secs
	next.CaptureEngine = engine
	next.Headless = a.headlessOn
	if err := config.Save(a.dir, next); err != nil {
		a.panelNote = "保存失败：" + err.Error()
		a.invalidate()
		return
	}
	if err := capture.EnsureSingleFileExtension(a.dir, next.UserDataDir, next.CaptureArchive, next.CaptureEngine, &next.SingleFileExtensionPath); err != nil {
		a.panelNote = err.Error()
	}
	a.cfg = next
	a.rt.Close()
	a.rt = application.New(a.cfg, a.dir)
	a.closePanel()
}

func (a *appState) submitText() {
	if a.busy > 0 || a.captureQueued() {
		a.notice = "当前任务尚未结束，请等待后再提交"
		a.invalidate()
		return
	}
	urls := a.pendingURLs()
	if len(urls) == 0 {
		a.notice = "先粘贴至少一条 http(s) 链接，或拖入文件"
		a.invalidate()
		return
	}
	a.notice = ""
	a.showJobs = true
	a.showInputControls()
	a.recountJobs()
	if a.startBatch(func(q *queue.Queue) {
		for _, u := range urls {
			q.SubmitURL(u, "")
		}
	}) {
		a.edt.SetText("")
	}
}

// submitDropped routes saved SingleFile HTML to the archive endpoint and every
// other file to the raw document endpoint. HTML without a source URL is skipped
// rather than silently filed as an anonymous document.
func (a *appState) submitDropped(files []string) {
	if a.busy > 0 || a.captureQueued() {
		a.notice = "当前任务尚未结束，请等待后再提交"
		a.invalidate()
		return
	}
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
	a.showJobs = true
	a.showInputControls()
	a.recountJobs()
	a.startBatch(func(q *queue.Queue) {
		for _, it := range items {
			if it.saved {
				q.SubmitArchive(it.path, it.url)
			} else {
				q.SubmitFile(it.path)
			}
		}
	})
}

func (a *appState) startBatch(submit func(*queue.Queue)) bool {
	if !a.beginLocalCapture() {
		a.notice = "平台排队链接正在采集，请稍后再提交"
		a.invalidate()
		return false
	}
	q := a.newQueue()
	if err := q.Restore(); err != nil {
		a.endLocalCapture()
		a.notice = "恢复本地任务失败；请检查本地队列目录"
		a.invalidate()
		return false
	}
	a.mergeJobs(q.Snapshot())
	a.activeQueue = q
	a.queueRunning = true
	a.jobPage = 0
	q.Start()
	submit(q)
	a.mergeJobs(q.Snapshot())
	a.invalidate()
	a.waitQueue(q)
	return true
}

func (a *appState) resumeQueue() {
	if !a.beginLocalCapture() {
		return
	}
	q := a.newQueue()
	if err := q.Restore(); err != nil {
		a.endLocalCapture()
		a.notice = "恢复本地任务失败；请检查本地队列目录"
		return
	}
	a.mergeJobs(q.Snapshot())
	a.activeQueue = q
	a.queueRunning = true
	q.Start()
	a.waitQueue(q)
}

func (a *appState) onJob(j queue.Job) {
	a.wnd.UiThread(func() {
		a.upsertJob(j)
		a.invalidate()
	})
}

func (a *appState) waitQueue(q *queue.Queue) {
	go func() {
		q.Wait()
		q.Close()
		snapshot := q.Snapshot()
		a.wnd.UiThread(func() {
			if a.activeQueue == q {
				a.activeQueue = nil
				a.queueRunning = false
				a.endLocalCapture()
			}
			a.mergeJobs(snapshot)
			a.invalidate()
			if a.closeWhenIdle && !a.queueRunning {
				_ = a.hwnd.DestroyWindow()
			}
		})
	}()
}

// runServerImportDrain claims URL-list jobs queued from the platform dashboard
// (awaiting_client). It wakes every 20s, or immediately when an app link asks
// for it, and skips while the local queue owns the shared browser session.
func (a *appState) runServerImportDrain(ctx context.Context) {
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		case <-a.drainKick:
		}
		a.drainOnce(ctx)
	}
}

// drainOnce runs one claim-and-capture pass over the platform queue.
func (a *appState) drainOnce(ctx context.Context) {
	rt, ok := a.beginServerDrain()
	if !ok {
		return
	}
	jobCtx, cancel := context.WithTimeout(ctx, 10*time.Minute)
	okN, failN := importdrain.DrainAwaitingJobs(jobCtx, io.Discard, rt.API, rt.Browser, rt.PublicHTTP, "")
	cancel()
	a.endServerDrain()
	if okN+failN > 0 {
		a.wnd.UiThread(func() {
			a.notice = fmt.Sprintf("平台排队链接：完成 %d · 失败 %d", okN, failN)
			a.invalidate()
		})
	}
}

// beginServerDrain reserves the browser session for queued server jobs.
func (a *appState) beginServerDrain() (*application.Runtime, bool) {
	a.captureMu.Lock()
	defer a.captureMu.Unlock()
	if a.captureOwner != "" {
		return nil, false
	}
	a.captureOwner = "server"
	a.drainRunning.Store(true)
	return a.rt, true
}

func (a *appState) endServerDrain() {
	a.captureMu.Lock()
	if a.captureOwner == "server" {
		a.captureOwner = ""
	}
	a.drainRunning.Store(false)
	a.captureMu.Unlock()
}

// beginLocalCapture reserves the browser session for a local queue batch.
func (a *appState) beginLocalCapture() bool {
	a.captureMu.Lock()
	defer a.captureMu.Unlock()
	if a.captureOwner != "" {
		return false
	}
	a.captureOwner = "local"
	return true
}

func (a *appState) endLocalCapture() {
	a.captureMu.Lock()
	if a.captureOwner == "local" {
		a.captureOwner = ""
	}
	a.captureMu.Unlock()
}

// captureQueued reports whether a batch is already driving the browser.
func (a *appState) captureQueued() bool {
	return a.queueRunning || a.drainRunning.Load()
}

func (a *appState) upsertJob(job queue.Job) {
	if a.jobs == nil {
		a.jobs = make(map[int]queue.Job)
	}
	a.jobs[job.ID] = job
	a.recountJobs()
}

func (a *appState) mergeJobs(jobs []queue.Job) {
	if a.jobs == nil {
		a.jobs = make(map[int]queue.Job)
	}
	for _, job := range jobs {
		a.jobs[job.ID] = job
	}
	a.recountJobs()
}

func (a *appState) recountJobs() {
	a.busy, a.done, a.failed = 0, 0, 0
	for _, job := range a.jobs {
		switch job.Status {
		case queue.StatusQueued, queue.StatusRunning:
			a.busy++
		case queue.StatusDone:
			a.done++
		case queue.StatusFailed:
			a.failed++
		}
	}
}

func (a *appState) orderedJobs() []queue.Job {
	jobs := make([]queue.Job, 0, len(a.jobs))
	for _, job := range a.jobs {
		jobs = append(jobs, job)
	}
	sort.Slice(jobs, func(i, j int) bool { return jobs[i].ID > jobs[j].ID })
	return jobs
}

func (a *appState) clickJobAction(pt win.POINT, f frame) bool {
	start := a.jobPage * len(f.jobRows)
	jobs := a.orderedJobs()
	for row := range f.jobRows {
		idx := start + row
		if idx >= len(jobs) {
			break
		}
		job := jobs[idx]
		if f.jobPrimary[row].contains(pt.X, pt.Y) {
			if jobPrimaryAction(job) == "" {
				return true
			}
			switch job.Status {
			case queue.StatusDone:
				if job.SignalID != "" && job.Kind != queue.KindFile {
					a.openSignal(job.SignalID)
				}
			case queue.StatusFailed:
				if job.RetrySafe {
					a.retryJob(job.ID)
				}
			case queue.StatusQueued:
				a.cancelQueued(job.ID)
			case queue.StatusRunning:
				a.cancelRunning(job.ID)
			}
			return true
		}
		if f.jobSecondary[row].contains(pt.X, pt.Y) {
			if job.Status == queue.StatusFailed {
				a.recaptureJob(job)
			}
			return true
		}
		// A failed row without a safe retry used to dead-end here: the footer
		// said "逐项处理" but no control explained why. The row itself now
		// shows the recorded reason.
		if f.jobRows[row].contains(pt.X, pt.Y) && job.Status == queue.StatusFailed {
			a.showJobReason(job)
			return true
		}
	}
	return false
}

// showJobReason puts the recorded failure (and where to look next) in a native
// dialog: the compact row has no space for a second line.
func (a *appState) showJobReason(job queue.Job) {
	reason := strings.TrimSpace(job.Err)
	if reason == "" {
		reason = "客户端没有记录到失败原因。"
	}
	lines := []string{
		"任务：" + jobDisplayTarget(job),
		"状态：" + jobStatusLabel(job),
		"",
		"原因：" + reason,
	}
	if job.URL != "" {
		lines = append(lines, "链接："+job.URL)
	}
	if job.Attempts > 0 {
		lines = append(lines, fmt.Sprintf("尝试次数：%d", job.Attempts))
	}
	if job.CaptureJobID != "" {
		lines = append(lines, "服务端任务："+job.CaptureJobID)
	}
	lines = append(lines, "", "可用「重采」按新的提交标识重新采集同一来源。")
	_, _ = a.hwnd.MessageBox(strings.Join(lines, "\n"), winTitle, co.MB_OK|co.MB_ICONINFORMATION)
}

// recaptureJob submits the same source again under a fresh submission id. That
// is safe even when RetrySafe is false: the server treats it as a new capture,
// not a replay of an uncertain POST.
func (a *appState) recaptureJob(job queue.Job) {
	if a.captureQueued() || a.busy > 0 {
		a.notice = "当前队列仍有任务，稍后再重新采集"
		a.invalidate()
		return
	}
	var submit func(*queue.Queue)
	switch job.Kind {
	case queue.KindURL:
		if strings.TrimSpace(job.URL) == "" {
			a.notice = "此项目缺少原链接，无法重新采集"
			a.invalidate()
			return
		}
		target := job.URL
		channel := job.Channel
		submit = func(q *queue.Queue) { q.SubmitURL(target, channel) }
	case queue.KindFile:
		if strings.TrimSpace(job.Path) == "" {
			a.notice = "原始文件已不在本地，无法重新采集"
			a.invalidate()
			return
		}
		path := job.Path
		submit = func(q *queue.Queue) { q.SubmitFile(path) }
	case queue.KindArchive:
		if strings.TrimSpace(job.URL) == "" || strings.TrimSpace(job.Path) == "" {
			a.notice = "此项目缺少原链接或快照文件，无法重新采集"
			a.invalidate()
			return
		}
		path, target := job.Path, job.URL
		submit = func(q *queue.Queue) { q.SubmitArchive(path, target) }
	default:
		a.notice = "此项目无法重新采集"
		a.invalidate()
		return
	}
	a.showJobs = true
	a.showInputControls()
	if a.startBatch(submit) {
		a.notice = "已按新的提交标识重新采集"
		a.invalidate()
	}
}

func (a *appState) retryJob(id int) {
	if a.captureQueued() || a.busy > 0 {
		a.notice = "当前队列仍有任务，稍后再重试"
		a.invalidate()
		return
	}
	if !a.beginLocalCapture() {
		a.notice = "平台排队链接正在采集，请稍后再重试"
		a.invalidate()
		return
	}
	q := a.newQueue()
	if err := q.Restore(); err != nil {
		a.endLocalCapture()
		a.notice = "恢复本地任务失败；请检查本地队列目录"
		a.invalidate()
		return
	}
	if err := q.RetryFailed(id); err != nil {
		q.Close()
		a.endLocalCapture()
		a.notice = "此项目无法安全重试；请检查服务端任务后改用链接或文件重新采集"
		a.invalidate()
		return
	}
	a.showJobs = true
	a.showInputControls()
	a.mergeJobs(q.Snapshot())
	a.activeQueue = q
	a.queueRunning = true
	q.Start()
	a.waitQueue(q)
	a.notice = "已重新排入原任务；复用原任务标识"
	a.invalidate()
}

func (a *appState) cancelQueued(id int) {
	if a.activeQueue == nil || !a.activeQueue.CancelQueued(id) {
		a.notice = "项目已开始处理，未执行取消"
		a.invalidate()
		return
	}
	a.upsertJob(findJob(a.activeQueue.Snapshot(), id))
	a.notice = "已取消尚未开始的项目"
	a.invalidate()
}

func (a *appState) cancelRunning(id int) {
	if a.activeQueue == nil || !a.activeQueue.CancelRunning(id) {
		a.notice = "该项目已不在抓取阶段，无法停止"
		a.invalidate()
		return
	}
	a.notice = "已停止抓取；可在项目页重新采集"
	a.invalidate()
}

// startRepaintTicker keeps "抓取中 22% · 等待页面就绪 · 1m12s" counting while a
// capture is in flight; without it the window only repaints on state changes and
// the elapsed seconds look frozen.
func (a *appState) startRepaintTicker() {
	if a.tickerStop != nil {
		return
	}
	stop := make(chan struct{})
	a.tickerStop = stop
	go func() {
		ticker := time.NewTicker(time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-stop:
				return
			case <-ticker.C:
				a.mu.Lock()
				running := false
				for _, job := range a.jobs {
					if job.Status == queue.StatusRunning {
						running = true
						break
					}
				}
				a.mu.Unlock()
				if running {
					a.invalidate()
				}
			}
		}
	}()
}

func (a *appState) stopRepaintTicker() {
	if a.tickerStop == nil {
		return
	}
	close(a.tickerStop)
	a.tickerStop = nil
}

// shortDuration renders an elapsed time compactly: 42s, 1m12s.
func shortDuration(d time.Duration) string {
	if d < time.Minute {
		return fmt.Sprintf("%ds", int(d.Seconds()))
	}
	return fmt.Sprintf("%dm%02ds", int(d.Minutes()), int(d.Seconds())%60)
}

func findJob(jobs []queue.Job, id int) queue.Job {
	for _, job := range jobs {
		if job.ID == id {
			return job
		}
	}
	return queue.Job{ID: id, Status: queue.StatusCanceled}
}

func (a *appState) newQueue() *queue.Queue {
	return a.rt.NewQueue(0, a.onJob)
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

func (a *appState) canSend() bool {
	if a.busy > 0 || a.captureQueued() {
		return false
	}
	return a.pendingLines() > 0
}

func (a *appState) statusText() string {
	switch {
	case a.busy > 0:
		return fmt.Sprintf("处理中 · %d 项", a.busy)
	case a.notice != "":
		return a.notice
	case a.failed > 0:
		return fmt.Sprintf("%d 项失败 · 点任务行看原因，可重试或重采", a.failed)
	case a.done > 0:
		return fmt.Sprintf("任务记录 · %d 项已提交或完成", a.done)
	default:
		return "就绪"
	}
}

func (a *appState) requestClose() {
	if a.queueRunning {
		a.closeWhenIdle = true
		a.notice = "任务完成后将关闭窗口；可在任务页取消尚未开始的项目"
		a.invalidate()
		return
	}
	_ = a.hwnd.DestroyWindow()
}

func (a *appState) openSignal(signalID string) {
	base, err := url.Parse(a.cfg.EffectiveAPIBase())
	if err != nil || base.Host == "" {
		a.notice = "无法打开信号；请检查平台地址"
		a.invalidate()
		return
	}
	base.User = nil
	base.RawQuery = ""
	base.Fragment = ""
	base.Path = strings.TrimRight(base.Path, "/") + "/singal/" + url.PathEscape(signalID)
	base.RawPath = ""
	if err := exec.Command("rundll32.exe", "url.dll,FileProtocolHandler", base.String()).Start(); err != nil {
		a.notice = "无法打开信号；请检查默认浏览器和平台地址"
		a.invalidate()
	}
}

func jobStatusLabel(job queue.Job) string {
	switch job.Status {
	case queue.StatusQueued:
		return "排队中"
	case queue.StatusRunning:
		label := "处理中"
		switch job.Stage {
		case "capturing":
			label = "抓取中"
		case "uploading":
			label = "上传中"
		case "processing":
			label = "解析中"
		}
		if job.Progress > 0 && job.Progress < 100 {
			label = fmt.Sprintf("%s %d%%", label, job.Progress)
		}
		// A slow page must look alive: name the current step and how long it has
		// been there, the same way the chat shows elapsed model time.
		if job.Detail != "" {
			label += " · " + job.Detail
		}
		if !job.StageStartedAt.IsZero() {
			if elapsed := time.Since(job.StageStartedAt).Round(time.Second); elapsed >= time.Second {
				label += " · " + shortDuration(elapsed)
			}
		}
		return label
	case queue.StatusDone:
		if job.Kind == queue.KindFile {
			return "已上传"
		}
		if job.EvidenceState == "pending_review" {
			return "待复核"
		}
		return "成功"
	case queue.StatusFailed:
		return "失败"
	case queue.StatusCanceled:
		return "已取消"
	default:
		return "未知"
	}
}

func jobDisplayTarget(job queue.Job) string {
	if job.Title != "" {
		return truncate(job.Title, 22)
	}
	if job.Kind == queue.KindFile {
		return truncate(filepath.Base(job.Path), 24)
	}
	parsed, err := url.Parse(job.URL)
	if err != nil || parsed.Host == "" {
		return "来源地址已隐藏"
	}
	return truncate(parsed.Hostname(), 30)
}

func jobPrimaryAction(job queue.Job) string {
	switch job.Status {
	case queue.StatusDone:
		if job.SignalID != "" && job.Kind != queue.KindFile {
			return "打开"
		}
	case queue.StatusFailed:
		if job.RetrySafe {
			return "重试"
		}
	case queue.StatusQueued:
		if job.Attempts == 0 && job.CaptureJobID == "" {
			return "取消"
		}
	case queue.StatusRunning:
		// A capture waiting on a verification page can sit for minutes; let the
		// operator stop it instead of closing the window.
		if job.Stage == "capturing" {
			return "停止"
		}
	}
	return ""
}

func jobSecondaryAction(job queue.Job) string {
	if job.Status == queue.StatusFailed {
		// Always available: a fresh submission under a new id, even when an
		// automatic replay would be unsafe.
		return "重采"
	}
	return ""
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
