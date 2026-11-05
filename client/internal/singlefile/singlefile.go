// Package singlefile embeds the SingleFile core build used for in-page archiving.
package singlefile

import _ "embed"

//go:embed singlefile.js
var script string

// Script returns the SingleFile core bundle. It installs the library on
// globalThis.__EEA_SF__ when evaluated in a page.
func Script() string { return script }
