//go:build darwin

package ui

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"eea/capture/internal/capture"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/widget"

	"eea/capture/internal/archive"
	"eea/capture/internal/config"
	"eea/capture/internal/importdrain"
	"eea/capture/internal/platform"
	"eea/capture/internal/queue"
)

// Run shows the macOS capture window (blocks until closed).
func Run(cfg config.Config, dir string) int {
	_ = capture.EnsureSingleFileExtension(dir, cfg.UserDataDir, cfg.CaptureArchive, cfg.CaptureEngine, &cfg.SingleFileExtensionPath)
	a := &darwinApp{
		cfg:    cfg,
		dir:    dir,
		engine: &lazyEngine{opts: engineOptions(cfg)},
		jobs:   make(map[int]queue.Job),
	}
	a.loop()
	a.engine.close()
	if a.exitCode != 0 {
		return a.exitCode
	}
	return 0
}

type darwinApp struct {
	cfg    config.Config
	dir    string
	engine *lazyEngine
	mu     sync.Mutex

	fyneApp fyne.App
	win     fyne.Window
	input   *widget.Entry
	status  *widget.Label
	jobList *widget.List
	notice  string

	jobs          map[int]queue.Job
	jobOrder      []int
	activeQueue   *queue.Queue
	queueRunning  bool
	queueBusy     int
	closeWhenIdle bool
	exitCode      int
}

func (a *darwinApp) loop() {
	a.fyneApp = app.NewWithID("com.eea.capture")
	a.win = a.fyneApp.NewWindow("EEA 采集")
	a.win.Resize(fyne.NewSize(500, 420))
	a.win.SetMaster()
	a.win.SetOnClosed(func() {
		if a.queueRunning {
			a.closeWhenIdle = true
		}
	})

	a.input = widget.NewMultiLineEntry()
	a.input.SetPlaceHolder("粘贴 http(s) 链接，每行一条；或将 PDF / Word / Excel、或 SingleFile 保存的 HTML 拖入窗口")
	a.input.Wrapping = fyne.TextWrapWord

	a.status = widget.NewLabel("就绪")
	a.jobList = widget.NewList(
		func() int { return len(a.jobOrder) },
		func() fyne.CanvasObject { return widget.NewLabel("job") },
		func(id widget.ListItemID, obj fyne.CanvasObject) {
			label := obj.(*widget.Label)
			a.mu.Lock()
			job := a.jobs[a.jobOrder[id]]
			a.mu.Unlock()
			label.SetText(fmt.Sprintf("#%d  %s", job.ID, darwinJobLabel(job)))
		},
	)

	uploadBtn := widget.NewButton("上传", func() { a.submitText() })
	cancelBtn := widget.NewButton("取消排队", func() { a.cancelQueued() })
	settingsBtn := widget.NewButton("设置", func() { a.showSettings() })
	doctorBtn := widget.NewButton("诊断", func() { a.showDoctor() })

	toolbar := container.NewHBox(uploadBtn, cancelBtn, settingsBtn, doctorBtn)
	body := container.NewBorder(
		container.NewVBox(
			widget.NewLabel("粘贴 / 拖放"),
			a.input,
			toolbar,
			a.status,
			widget.NewLabel("任务"),
		),
		nil, nil, nil,
		container.NewMax(a.jobList),
	)
	a.win.SetContent(body)

	a.win.SetOnDropped(func(_ fyne.Position, uris []fyne.URI) {
		var paths []string
		for _, u := range uris {
			if u == nil {
				continue
			}
			paths = append(paths, u.Path())
		}
		if len(paths) > 0 {
			a.submitDropped(paths)
		}
	})

	a.win.CenterOnScreen()
	a.win.Show()
	a.win.RequestFocus()
	go func() {
		time.Sleep(300 * time.Millisecond)
		a.resumeQueue()
	}()
	go a.runServerImportDrain()
	a.fyneApp.Run()
}

func (a *darwinApp) runServerImportDrain() {
	api := platform.New(a.cfg.EffectiveAPIBase(), a.cfg.MaxUploadMB)
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()
	for range ticker.C {
		if a.queueRunning {
			continue
		}
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		importdrain.DrainAwaitingJobs(ctx, io.Discard, api, a.engine, "")
		cancel()
	}
}

func (a *darwinApp) ui(fn func()) {
	if fn == nil {
		return
	}
	fyne.Do(fn)
}

func (a *darwinApp) setStatus(text string) {
	a.ui(func() { a.status.SetText(text) })
}

func (a *darwinApp) resumeQueue() {
	if a.queueRunning {
		return
	}
	q := a.newQueue()
	if err := q.Restore(); err != nil {
		a.setStatus("恢复本地任务失败；请检查队列目录")
		return
	}
	jobs := q.Snapshot()
	a.mergeJobs(jobs)
	pending := 0
	for _, job := range jobs {
		if job.Status == queue.StatusQueued {
			pending++
		}
	}
	if pending == 0 {
		return
	}
	a.setStatus(fmt.Sprintf("恢复 %d 条待处理任务…", pending))
	a.activeQueue = q
	a.queueRunning = true
	q.Start()
	go a.waitQueue(q)
}

func (a *darwinApp) cancelQueued() {
	a.mu.Lock()
	q := a.activeQueue
	a.mu.Unlock()
	if q == nil {
		a.setStatus("当前没有可取消的排队任务")
		return
	}
	canceled := 0
	for _, id := range a.jobOrder {
		a.mu.Lock()
		job, ok := a.jobs[id]
		a.mu.Unlock()
		if !ok || job.Status != queue.StatusQueued {
			continue
		}
		if q.CancelQueued(job.ID) {
			canceled++
		}
	}
	if canceled == 0 {
		a.setStatus("没有仍在排队的任务（进行中的任务需等待完成或超时）")
		return
	}
	a.setStatus(fmt.Sprintf("已取消 %d 条排队任务", canceled))
}

func (a *darwinApp) submitText() {
	if a.queueRunning {
		a.setStatus("当前任务尚未结束，请等待后再提交")
		return
	}
	urls := pendingURLs(a.input.Text)
	if len(urls) == 0 {
		a.setStatus("先粘贴至少一条 http(s) 链接，或拖入文件")
		return
	}
	if err := capture.EnsureSingleFileExtension(a.dir, a.cfg.UserDataDir, a.cfg.CaptureArchive, a.cfg.CaptureEngine, &a.cfg.SingleFileExtensionPath); err != nil {
		a.setStatus(err.Error())
		return
	}
	a.engine.close()
	a.engine = &lazyEngine{opts: engineOptions(a.cfg)}
	a.input.SetText("")
	a.startBatch(func(q *queue.Queue) {
		for _, u := range urls {
			q.SubmitURL(u, "")
		}
	})
}

func (a *darwinApp) submitDropped(files []string) {
	if a.queueRunning {
		a.setStatus("当前任务尚未结束，请等待后再提交")
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
		a.setStatus("HTML 里找不到 canonical/og:url：" + strings.Join(noURL, "、"))
		return
	}
	if len(noURL) > 0 {
		a.setStatus("已跳过无原链接的 HTML：" + strings.Join(noURL, "、"))
	}
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

func (a *darwinApp) startBatch(submit func(*queue.Queue)) {
	q := a.newQueue()
	if err := q.Restore(); err != nil {
		a.setStatus("恢复本地任务失败；请检查本地队列目录")
		return
	}
	a.mergeJobs(q.Snapshot())
	a.activeQueue = q
	a.queueRunning = true
	q.Start()
	submit(q)
	a.mergeJobs(q.Snapshot())
	go a.waitQueue(q)
}

func (a *darwinApp) waitQueue(q *queue.Queue) {
	q.Wait()
	q.Close()
	a.mu.Lock()
	if a.activeQueue == q {
		a.queueRunning = false
		a.activeQueue = nil
	}
	a.mu.Unlock()
	a.mergeJobs(q.Snapshot())
	a.refreshJobSummary()
	if a.closeWhenIdle {
		a.ui(func() { a.win.Close() })
	}
}

func (a *darwinApp) newQueue() *queue.Queue {
	api := platform.New(a.cfg.EffectiveAPIBase(), a.cfg.MaxUploadMB)
	workers := a.cfg.MaxParallel
	if workers > 1 {
		// One shared browser/CDP session on macOS; parallel captures deadlock behind the engine lock.
		workers = 1
	}
	return queue.New(a.engine, api, queue.Options{
		Workers:       workers,
		Retries:       2,
		Timeout:       time.Duration(a.cfg.TimeoutSec) * time.Second,
		UploadTimeout: time.Duration(a.cfg.UploadTimeout) * time.Second,
		StateDir:      config.QueueStateDir(a.dir, a.cfg),
		OnUpdate: func(job queue.Job) {
			a.mu.Lock()
			a.jobs[job.ID] = job
			a.mu.Unlock()
			a.ui(func() {
				a.jobList.Refresh()
				a.refreshJobSummary()
			})
		},
	})
}

func (a *darwinApp) mergeJobs(jobs []queue.Job) {
	a.mu.Lock()
	defer a.mu.Unlock()
	seen := map[int]bool{}
	for _, id := range a.jobOrder {
		seen[id] = true
	}
	for _, job := range jobs {
		a.jobs[job.ID] = job
		if !seen[job.ID] {
			a.jobOrder = append(a.jobOrder, job.ID)
			seen[job.ID] = true
		}
	}
	a.ui(func() { a.jobList.Refresh() })
}

func (a *darwinApp) refreshJobSummary() {
	a.mu.Lock()
	defer a.mu.Unlock()
	done, failed, running := 0, 0, 0
	for _, job := range a.jobs {
		switch job.Status {
		case queue.StatusDone:
			done++
		case queue.StatusFailed:
			failed++
		case queue.StatusQueued, queue.StatusRunning:
			running++
		}
	}
	switch {
	case a.queueRunning || running > 0:
		progressHint := ""
		for _, job := range a.jobs {
			if job.Status == queue.StatusRunning && job.Progress > 0 && job.Progress < 100 {
				progressHint = fmt.Sprintf("（当前 %d%%）", job.Progress)
				break
			}
		}
		a.setStatus(fmt.Sprintf("处理中 · %d 项进行中%s", running, progressHint))
	case a.notice != "":
		a.setStatus(a.notice)
	case failed > 0:
		a.setStatus(fmt.Sprintf("%d 项失败", failed))
	case done > 0:
		a.setStatus(fmt.Sprintf("完成 %d 项", done))
	default:
		a.setStatus("就绪")
	}
}

func (a *darwinApp) showSettings() {
	apiEntry := widget.NewEntry()
	apiEntry.SetText(a.cfg.EffectiveAPIBase())
	parEntry := widget.NewEntry()
	parEntry.SetText(fmt.Sprintf("%d", a.cfg.MaxParallel))
	headlessCheck := widget.NewCheck("无窗口抓取", func(v bool) { a.cfg.Headless = v })
	headlessCheck.SetChecked(a.cfg.Headless)
	items := container.NewVBox(
		widget.NewLabel("平台 API 根地址"),
		apiEntry,
		widget.NewLabel("并发数 (1–8)"),
		parEntry,
		headlessCheck,
	)
	dialog.ShowCustomConfirm("采集设置", "保存", "取消", items, func(ok bool) {
		if !ok {
			return
		}
		par, err := bounded(parEntry.Text, 1, 8)
		if err != nil {
			dialog.ShowError(fmt.Errorf("并发数无效"), a.win)
			return
		}
		a.cfg.APIBase = strings.TrimSpace(apiEntry.Text)
		a.cfg.AutoAPI = a.cfg.APIBase == ""
		a.cfg.MaxParallel = par
		a.cfg.Headless = headlessCheck.Checked
		if err := config.Save(a.dir, a.cfg); err != nil {
			dialog.ShowError(err, a.win)
			return
		}
		a.engine.close()
		a.engine = &lazyEngine{opts: engineOptions(a.cfg)}
		a.setStatus("设置已保存")
	}, a.win)
}

func (a *darwinApp) showDoctor() {
	lines := []string{
		fmt.Sprintf("api_base      %s", a.cfg.EffectiveAPIBase()),
	}
	if exe, err := capture.ResolveBrowser(a.cfg.CaptureEngine, a.cfg.BrowserPath); err != nil {
		lines = append(lines, "browser       missing ("+err.Error()+")")
	} else {
		lines = append(lines, "browser       "+exe)
	}
	profile, _ := filepath.Abs(a.cfg.UserDataDir)
	lines = append(lines,
		fmt.Sprintf("profile       %s", profile),
		fmt.Sprintf("parallel      %d", a.cfg.MaxParallel),
	)
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	c := platform.New(a.cfg.EffectiveAPIBase(), a.cfg.MaxUploadMB)
	if err := c.Reachable(ctx); err != nil {
		lines = append(lines, "backend       unreachable ("+err.Error()+")")
	} else {
		lines = append(lines, "backend       ok")
		if ok, err := c.SupportsCapture(ctx); err == nil && ok {
			lines = append(lines, "capture       ok")
		}
	}
	dialog.ShowInformation("诊断", strings.Join(lines, "\n"), a.win)
}

func pendingURLs(text string) []string {
	seen := map[string]bool{}
	var urls []string
	for _, line := range strings.Split(text, "\n") {
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

func darwinJobLabel(job queue.Job) string {
	prefix := ""
	switch job.Status {
	case queue.StatusQueued:
		prefix = "排队"
	case queue.StatusRunning:
		switch job.Stage {
		case "capturing":
			prefix = "抓取中"
		case "uploading":
			prefix = "上传中"
		case "processing":
			prefix = "服务端解析中"
		default:
			prefix = "处理中"
		}
		if job.Progress > 0 && job.Progress < 100 {
			prefix = fmt.Sprintf("%s %d%%", prefix, job.Progress)
		}
	case queue.StatusDone:
		if job.Title != "" {
			return fmt.Sprintf("成功 · %s", job.Title)
		}
		if job.SignalID != "" {
			return fmt.Sprintf("成功 · %s", job.SignalID)
		}
		return "成功"
	case queue.StatusFailed:
		prefix = "失败"
	case queue.StatusCanceled:
		prefix = "已取消"
	}
	line := prefix
	if job.URL != "" {
		line += " · " + job.URL
	} else if job.Path != "" {
		line += " · " + filepath.Base(job.Path)
	}
	if job.Err != "" && job.Status == queue.StatusFailed {
		line += " — " + job.Err
	}
	return line
}
