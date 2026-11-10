//go:build !darwin && !windows

package ui

import (
	"fmt"
	"os"

	"eea/capture/internal/config"
)

// Run is unavailable on this platform; use CLI subcommands instead.
func Run(cfg config.Config, dir string) int {
	_ = cfg
	_ = dir
	fmt.Fprintln(os.Stderr, "图形界面仅在 Windows / macOS 提供；请使用子命令，例如: capture upload --url <url>")
	return 1
}
