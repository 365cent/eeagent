//go:build !darwin && !windows

package capture

import "fmt"

func hostProfileExtensionsDir(engine string) (string, error) {
	return "", fmt.Errorf("automatic SingleFile discovery is not supported on this platform; set singlefile_extension_path")
}
