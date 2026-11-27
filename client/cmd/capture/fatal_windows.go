//go:build windows

package main

import (
	"github.com/rodrigocfd/windigo/co"
	"github.com/rodrigocfd/windigo/win"
)

// reportFatalStartup shows a modal dialog for a failure that happens before the
// capture window exists. The release binary is built with -H=windowsgui, so a
// stderr message is invisible on a double-click: without this the app would
// simply never appear.
func reportFatalStartup(message string) {
	_, _ = win.HWND(0).MessageBox(message, "EEA 采集", co.MB_OK|co.MB_ICONERROR)
}
