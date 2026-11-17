// Package credential stores the capture upload token in the Windows Credential Manager.
package credential

import "errors"

var (
	ErrUnsupported = errors.New("Windows Credential Manager is not available")
	ErrNotFound    = errors.New("credential not found")
)
