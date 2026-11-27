//go:build windows

package ui

import (
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"strings"
	"syscall"

	"github.com/rodrigocfd/windigo/co"
	"github.com/rodrigocfd/windigo/win"
)

// LinkScheme is the app-internal protocol the platform page links to:
//
//	eea-capture://claim?batch=<batch id>
//
// Windows resolves it to this executable once the client has run on the PC, so
// "打开采集客户端领取任务" starts or wakes the client instead of asking the
// researcher to double-click an exe by hand. The batch id is informational -
// claiming is owner-scoped and the client drains every queued job for its user.
const LinkScheme = "eea-capture"

// wmLaunchLink tells an already-running instance that a link arrived. The
// payload is not needed: the drain is owner-scoped, so "claim now" is the whole
// message (and a bare message cannot dangle a cross-process pointer).
const wmLaunchLink = co.WM_APP + 1

// LaunchLink returns the app link this process was started with, if any.
func LaunchLink(args []string) string {
	for _, arg := range args {
		trimmed := strings.TrimSpace(arg)
		if strings.HasPrefix(strings.ToLower(trimmed), LinkScheme+"://") {
			return trimmed
		}
	}
	return ""
}

// RegisterLinkProtocol points LinkScheme at this executable under HKCU, so no
// administrator rights are needed and a portable copy still works after one run.
// Best effort: a locked-down PC keeps working, the page just cannot launch it.
func RegisterLinkProtocol() error {
	exe, err := os.Executable()
	if err != nil || strings.TrimSpace(exe) == "" {
		return fmt.Errorf("executable path unknown: %v", err)
	}
	base := `HKCU\Software\Classes\` + LinkScheme
	reg := func(args ...string) error {
		cmd := exec.Command("reg", args...)
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
		return cmd.Run()
	}
	if err := reg("add", base, "/ve", "/d", "URL:EEA Capture", "/t", "REG_SZ", "/f"); err != nil {
		return err
	}
	// The empty "URL Protocol" value is what makes Windows treat the key as a
	// protocol handler rather than a file association.
	if err := reg("add", base, "/v", "URL Protocol", "/d", "", "/t", "REG_SZ", "/f"); err != nil {
		return err
	}
	return reg("add", base+`\shell\open\command`, "/ve", "/d", fmt.Sprintf(`"%s" "%%1"`, exe),
		"/t", "REG_SZ", "/f")
}

// runningWindow finds the client window of an instance that is already up.
func runningWindow() (win.HWND, bool) {
	hwnd, ok := win.FindWindow(win.ClassNameStr(winClass), "")
	if !ok || hwnd == 0 {
		return 0, false
	}
	return hwnd, true
}

// bringForward restores and raises an existing client window. A background
// process may not raise a window on its own; this is the documented escape
// hatch and is best-effort only.
func bringForward(hwnd win.HWND) {
	_ = win.AllowSetForegroundWindow(0xFFFF_FFFF) // ASFW_ANY
	_ = hwnd.ShowWindowAsync(co.SW_RESTORE)
	_ = hwnd.BringWindowToTop()
	hwnd.SetForegroundWindow()
}

// sendLaunchLink asks the running instance to claim queued platform jobs now.
// Delivery is best effort; the 20s drain still picks them up.
func sendLaunchLink(hwnd win.HWND, link string) bool {
	_ = link // owner-scoped drain: the batch id does not change what is claimed
	return hwnd.PostMessage(wmLaunchLink, 0, 0) == nil
}

// batchIDFromLink returns the short batch id of eea-capture://claim?batch=<id>.
func batchIDFromLink(link string) string {
	parsed, err := url.Parse(strings.TrimSpace(link))
	if err != nil {
		return ""
	}
	batch := strings.TrimSpace(parsed.Query().Get("batch"))
	if len(batch) > 8 {
		batch = batch[:8]
	}
	return batch
}

// acceptLaunchLink switches to the task page and claims the queued jobs now.
func (a *appState) acceptLaunchLink(link string) {
	a.showJobs = true
	a.jobPage = 0
	if a.panelOpen {
		a.panelOpen = false
		a.hidePanel(true)
	}
	a.showInputControls()
	if batch := batchIDFromLink(link); batch != "" {
		a.notice = "已收到平台批次 " + batch + "，正在领取并采集…"
	} else {
		a.notice = "已收到平台任务，正在领取并采集…"
	}
	a.invalidate()
	a.kickDrain()
}

// kickDrain never blocks the UI thread; the drain loop owns the channel.
func (a *appState) kickDrain() {
	if a.drainKick == nil {
		return
	}
	select {
	case a.drainKick <- struct{}{}:
	default:
	}
}
