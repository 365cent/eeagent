// Command capture is the EEA capture client: GUI by default, plus upload,
// doctor and version subcommands.
package main

import (
	"fmt"
	"os"

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
	cfg, err := config.Load(dir)
	if err != nil {
		// A broken config.json used to end the process before any window could
		// appear, which reads as "double-click does nothing". Start with the
		// built-in defaults and say so in the window instead.
		fmt.Fprintln(os.Stderr, "config:", err)
		cfg = config.Default()
		cfg.StartupNotice = "配置文件读取失败，已用默认配置启动：" + err.Error()
	}
	os.Exit(ui.Run(cfg, dir))
}
