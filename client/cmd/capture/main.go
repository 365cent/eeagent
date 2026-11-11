// Command capture is the EEA capture client: GUI by default, plus upload,
// doctor and version subcommands.
package main

import (
	"fmt"
	"os"

	"eea/capture/internal/capture"
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
		fmt.Fprintf(os.Stderr, "config dir: %v\n", err)
		os.Exit(1)
	}
	cfg, err := config.Load(dir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "config: %v\n", err)
		os.Exit(1)
	}
	_ = capture.EnsureSingleFileExtension(dir, cfg.UserDataDir, cfg.CaptureArchive, cfg.CaptureEngine, &cfg.SingleFileExtensionPath)
	os.Exit(ui.Run(cfg, dir))
}
