//go:build !windows

package credential

func Read(string) (string, error) { return "", ErrUnsupported }

func Write(string, string) error { return ErrUnsupported }

func Delete(string) error { return ErrUnsupported }
