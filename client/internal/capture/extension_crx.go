package capture

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/binary"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const singleFileCRXUpdateURL = "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=131.0.6778.0&acceptformat=crx2,crx3&x=id%3D" + chromeWebStoreSingleFileID + "%26uc"

// downloadAndUnpackSingleFileCRX fetches the Chrome Web Store CRX and unpacks it into dest.
func downloadAndUnpackSingleFileCRX(ctx context.Context, dest string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, singleFileCRXUpdateURL, nil)
	if err != nil {
		return err
	}
	client := &http.Client{Timeout: 3 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("download SingleFile CRX: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download SingleFile CRX: HTTP %s", resp.Status)
	}
	body, err := io.ReadAll(io.LimitReader(resp.Body, 64<<20))
	if err != nil {
		return err
	}
	zipBytes, err := crxPayload(body)
	if err != nil {
		return err
	}
	if err := os.RemoveAll(dest); err != nil && !os.IsNotExist(err) {
		return err
	}
	return unzipToDir(zipBytes, dest)
}

func crxPayload(crx []byte) ([]byte, error) {
	if len(crx) < 16 || string(crx[:4]) != "Cr24" {
		return nil, fmt.Errorf("not a CRX file")
	}
	version := binary.LittleEndian.Uint32(crx[4:8])
	switch version {
	case 2:
		pubKeyLen := binary.LittleEndian.Uint32(crx[8:12])
		sigLen := binary.LittleEndian.Uint32(crx[12:16])
		off := 16 + int(pubKeyLen) + int(sigLen)
		if off > len(crx) {
			return nil, fmt.Errorf("truncated CRX2")
		}
		return crx[off:], nil
	case 3:
		headerLen := binary.LittleEndian.Uint32(crx[8:12])
		off := 12 + int(headerLen)
		if off > len(crx) {
			return nil, fmt.Errorf("truncated CRX3")
		}
		return crx[off:], nil
	default:
		return nil, fmt.Errorf("unsupported CRX version %d", version)
	}
}

func unzipToDir(zipBytes []byte, dest string) error {
	zr, err := zip.NewReader(bytes.NewReader(zipBytes), int64(len(zipBytes)))
	if err != nil {
		return err
	}
	for _, f := range zr.File {
		target := filepath.Join(dest, f.Name)
		if !strings.HasPrefix(filepath.Clean(target), filepath.Clean(dest)+string(os.PathSeparator)) {
			return fmt.Errorf("zip path escapes dest: %s", f.Name)
		}
		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(target, 0o755); err != nil {
				return err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return err
		}
		rc, err := f.Open()
		if err != nil {
			return err
		}
		out, err := os.OpenFile(target, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, f.Mode())
		if err != nil {
			rc.Close()
			return err
		}
		_, copyErr := io.Copy(out, rc)
		closeErr := out.Close()
		rc.Close()
		if copyErr != nil {
			return copyErr
		}
		if closeErr != nil {
			return closeErr
		}
	}
	return assertExtensionRoot(dest)
}
