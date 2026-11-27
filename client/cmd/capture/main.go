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
	if len(os.Args) > 1 {
		os.Exit(cli.Run(os.Args[1:], os.Stdout, version))
	}

	dir, err := resolveConfigDir()
	if err != nil {
		reportFatalStartup("无法确定配置目录，采集客户端未能启动：\n" + err.Error())
		os.Exit(1)
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
		os.Exit(1)
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

	os.Exit(ui.Run(cfg, dir))
}
