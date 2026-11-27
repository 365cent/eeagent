// Command capture is the EEA capture client: GUI by default, plus upload,
// doctor and version subcommands.
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"eea/capture/internal/cli"
	"eea/capture/internal/config"
	"eea/capture/internal/ui"
)

var version = "dev"

func main() {
	run(args())
}

// args keeps os.Args out of the testable path and trims the argv[0] program name.
func args() []string { return os.Args[1:] }

func run(argv []string) {
	// eea-capture://claim?batch=… (the platform's "打开采集客户端" link) is a GUI
	// launch with an intent, not a subcommand.
	if link := ui.LaunchLink(argv); link != "" {
		os.Exit(runGUI(link))
	}
	if len(argv) > 0 {
		os.Exit(cli.Run(argv, os.Stdout, version))
	}
	os.Exit(runGUI(""))
}

// runGUI starts the desktop client; link is the app link that woke it, if any.
func runGUI(link string) int {
	// Let the platform's app-internal link open this exe. Best effort: a portable
	// copy without registry access still works when started by hand.
	_ = ui.RegisterLinkProtocol()

	dir, err := resolveConfigDir()
	if err != nil {
		reportFatalStartup("无法确定配置目录，采集客户端未能启动：\n" + err.Error())
		return 1
	}

	notices := make([]string, 0, 2)
	cfg, loadErr := config.Load(dir)
	if loadErr != nil {
		// A broken config.json used to end the process before any window could
		// appear, which reads as "double-click does nothing". Start with the
		// built-in defaults and say so in the window instead.
		fmt.Fprintln(os.Stderr, "config:", loadErr)
		cfg = config.Default()
		notices = append(notices, "配置文件读取失败，已用默认配置启动："+loadErr.Error())
	}

	// The exe may sit in a folder this user cannot write (Program Files, a
	// locked-down share). Pick a writable data root before the window opens and
	// report the move, instead of surfacing "capture failed" minutes later.
	dataRoot, dataNotice, dataErr := config.DataRoot(dir)
	if dataErr != nil {
		writeStartupLog(filepath.Join(dir, "capture-startup.log"), dir, "", cfg, loadErr, dataErr)
		reportFatalStartup("采集客户端未能启动：\n" + dataErr.Error())
		return 1
	}
	cfg = config.RebaseDataPaths(cfg, filepath.Dir(dataRoot))
	if dataNotice != "" {
		notices = append(notices, dataNotice)
	}
	if len(notices) > 0 {
		cfg.StartupNotice = strings.Join(notices, "；")
	}

	// One file the colleague can send back when it misbehaves on another PC.
	writeStartupLog(filepath.Join(dataRoot, "capture-startup.log"), dir, dataRoot, cfg, loadErr, nil)

	return ui.Run(cfg, dir, link)
}
