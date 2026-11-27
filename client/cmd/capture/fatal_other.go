//go:build !windows

package main

import (
	"fmt"
	"os"
)

// reportFatalStartup writes to stderr on platforms that run the client from a
// terminal; only Windows loses stderr when the GUI is double-clicked.
func reportFatalStartup(message string) {
	fmt.Fprintln(os.Stderr, message)
}
