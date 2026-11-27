//go:build !windows

package ui

import (
	"fmt"
	"os"

	"eea/capture/internal/config"
)

// Run is unavailable on this platform; use CLI subcommands instead.
func Run(cfg config.Config, dir, link string) int {
	_, _, _ = cfg, dir, link
	fmt.Fprintln(os.Stderr, "图形界面仅在 Windows / macOS 提供；请使用子命令，例如: capture upload --url <url>")
	return 1
}

// LaunchLink is a Windows app-link concept; other platforms start normally.
func LaunchLink(args []string) string { _ = args; return "" }

// RegisterLinkProtocol has nothing to register outside Windows.
func RegisterLinkProtocol() error { return nil }
