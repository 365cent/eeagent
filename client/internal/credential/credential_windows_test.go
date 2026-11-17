//go:build windows

package credential

import (
	"errors"
	"fmt"
	"testing"
	"time"
)

func TestWriteReadDelete(t *testing.T) {
	target := fmt.Sprintf("eea-capture-test-%d", time.Now().UnixNano())
	defer Delete(target)

	if err := Write(target, "token-123"); err != nil {
		t.Fatal(err)
	}
	got, err := Read(target)
	if err != nil {
		t.Fatal(err)
	}
	if got != "token-123" {
		t.Fatalf("token = %q", got)
	}
	if err := Delete(target); err != nil {
		t.Fatal(err)
	}
	if _, err := Read(target); !errors.Is(err, ErrNotFound) {
		t.Fatalf("read after delete = %v", err)
	}
}
