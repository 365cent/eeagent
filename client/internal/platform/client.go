// Package platform uploads captures and raw documents to the EEA backend.
package platform

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net"
	"net/http"
	"net/textproto"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"eea/capture/internal/netinfo"
)

// Client talks to /api/v1 of the EEA backend.
type Client struct {
	base     string
	http     *http.Client
	maxBytes int64
}

// New builds a client for base (e.g. http://10.215.8.74:8000). Outbound
// sockets are bound to the physical LAN address so uploads leave through the
// same adapter the browser uses (not VMnet/Hyper-V).
func New(base string, maxUploadMB int) *Client {
	if maxUploadMB <= 0 {
		maxUploadMB = 120
	}
	bindIP := netinfo.PrimaryIPv4()
	dialer := func(ctx context.Context, network, addr string) (net.Conn, error) {
		host, _, err := net.SplitHostPort(addr)
		if err != nil {
			host = addr
		}
		if bindIP != "" && !isLoopbackHost(host) {
			local := &net.Dialer{
				Timeout:   30 * time.Second,
				LocalAddr: &net.TCPAddr{IP: net.ParseIP(bindIP)},
			}
			return local.DialContext(ctx, network, addr)
		}
		return (&net.Dialer{Timeout: 30 * time.Second}).DialContext(ctx, network, addr)
	}
	transport := &http.Transport{
		Proxy:               http.ProxyFromEnvironment,
		DialContext:         dialer,
		MaxIdleConnsPerHost: 4,
		IdleConnTimeout:     90 * time.Second,
	}
	return &Client{
		base:     strings.TrimRight(base, "/"),
		http:     &http.Client{Transport: transport, Timeout: 15 * time.Minute},
		maxBytes: int64(maxUploadMB) << 20,
	}
}

func isLoopbackHost(host string) bool {
	if strings.EqualFold(host, "localhost") {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}

// Base returns the API root.
func (c *Client) Base() string { return c.base }

// CaptureInput is one page capture awaiting upload.
type CaptureInput struct {
	URL       string
	Channel   string
	Archive   []byte
	Filename  string
	Published string
}

// Signal is the subset of SignalDetail the client displays.
type Signal struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	Publisher     string `json:"publisher"`
	PublishedAt   string `json:"published_at"`
	EvidenceState string `json:"evidence_status_code"`
	Channel       string `json:"channel_code"`
}

// Document is the response of POST /documents/raw.
type Document struct {
	ID     string `json:"id"`
	SHA256 string `json:"sha256"`
	Mime   string `json:"mime"`
	Size   int64  `json:"size"`
}

// Capture uploads url + self-contained HTML to POST /signals/capture.
func (c *Client) Capture(ctx context.Context, in CaptureInput) (*Signal, error) {
	if strings.TrimSpace(in.URL) == "" {
		return nil, errors.New("url is required")
	}
	if len(in.Archive) == 0 {
		return nil, errors.New("archive_html is required")
	}
	if int64(len(in.Archive)) > c.maxBytes {
		return nil, fmt.Errorf("archive is %d bytes, over max_upload_mb", len(in.Archive))
	}
	filename := in.Filename
	if filename == "" {
		filename = "archive.html"
	}

	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	if err := mw.WriteField("url", in.URL); err != nil {
		return nil, err
	}
	if in.Channel != "" {
		if err := mw.WriteField("channel_code", in.Channel); err != nil {
			return nil, err
		}
	}
	if in.Published != "" {
		if err := mw.WriteField("published_at", in.Published); err != nil {
			return nil, err
		}
	}
	part, err := createFilePart(mw, "archive_html", filename, "text/html; charset=utf-8")
	if err != nil {
		return nil, err
	}
	if _, err := part.Write(in.Archive); err != nil {
		return nil, err
	}
	if err := mw.Close(); err != nil {
		return nil, err
	}

	var out Signal
	if err := c.doJSON(ctx, http.MethodPost, "/api/v1/signals/capture", mw.FormDataContentType(), body.Bytes(), &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// UploadDocument posts a raw file to POST /documents/raw; parsing stays server-side.
func (c *Client) UploadDocument(ctx context.Context, path string) (*Document, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil {
		return nil, err
	}
	if info.Size() > c.maxBytes {
		return nil, fmt.Errorf("%s is %d bytes, over max_upload_mb", filepath.Base(path), info.Size())
	}

	head := make([]byte, 512)
	n, _ := io.ReadFull(f, head)
	if _, err := f.Seek(0, io.SeekStart); err != nil {
		return nil, err
	}
	ctype := mimeFor(path, head[:n])

	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	part, err := createFilePart(mw, "file", filepath.Base(path), ctype)
	if err != nil {
		return nil, err
	}
	if _, err := io.Copy(part, f); err != nil {
		return nil, err
	}
	if err := mw.Close(); err != nil {
		return nil, err
	}

	var out Document
	if err := c.doJSON(ctx, http.MethodPost, "/api/v1/documents/raw", mw.FormDataContentType(), body.Bytes(), &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Reachable reports whether /openapi.json answers, used by doctor.
func (c *Client) Reachable(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.base+"/openapi.json", nil)
	if err != nil {
		return err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, io.LimitReader(resp.Body, 4096))
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%s: %s", c.base, resp.Status)
	}
	return nil
}

func (c *Client) doJSON(ctx context.Context, method, path, contentType string, payload []byte, out any) error {
	req, err := http.NewRequestWithContext(ctx, method, c.base+path, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Accept", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return &StatusError{Code: resp.StatusCode, Body: strings.TrimSpace(string(data))}
	}
	if out == nil {
		return nil
	}
	if len(data) == 0 {
		return nil
	}
	return json.Unmarshal(data, out)
}

// StatusError is a non-2xx response; Retryable reports 429/5xx.
type StatusError struct {
	Code int
	Body string
}

func (e *StatusError) Error() string {
	return fmt.Sprintf("http %d: %s", e.Code, e.Body)
}

// Retryable reports whether the request may succeed when repeated.
func (e *StatusError) Retryable() bool {
	return e.Code == http.StatusTooManyRequests || e.Code >= 500
}

// mimeFor prefers the real document type over zip sniffing (docx/pptx are
// ZIP containers, so http.DetectContentType alone reports application/zip).
func mimeFor(path string, head []byte) string {
	switch strings.ToLower(filepath.Ext(path)) {
	case ".pdf":
		return "application/pdf"
	case ".doc":
		return "application/msword"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case ".ppt":
		return "application/vnd.ms-powerpoint"
	case ".pptx":
		return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
	case ".xls":
		return "application/vnd.ms-excel"
	case ".xlsx":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case ".txt":
		return "text/plain; charset=utf-8"
	case ".md":
		return "text/markdown; charset=utf-8"
	case ".html", ".htm":
		return "text/html; charset=utf-8"
	}
	if len(head) == 0 {
		return "application/octet-stream"
	}
	return http.DetectContentType(head)
}

// InferChannel maps well-known hosts to backend channel codes.
func InferChannel(rawURL string) string {
	u, err := url.Parse(strings.TrimSpace(rawURL))
	if err != nil || u.Host == "" {
		return ""
	}
	host := strings.ToLower(u.Hostname())
	switch {
	case host == "mp.weixin.qq.com", host == "weixin.qq.com":
		return "wechat_mp"
	case strings.HasSuffix(host, "weixin.qq.com"):
		return "wechat_mp"
	default:
		return ""
	}
}

func createFilePart(mw *multipart.Writer, field, filename, contentType string) (io.Writer, error) {
	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition",
		fmt.Sprintf(`form-data; name="%s"; filename="%s"`, escapeQuotes(field), escapeQuotes(filename)))
	h.Set("Content-Type", contentType)
	return mw.CreatePart(h)
}

func escapeQuotes(s string) string {
	return strings.NewReplacer("\\", "\\\\", `"`, "\\\"").Replace(s)
}

// SupportsCapture reports whether the backend exposes the W2 capture endpoint.
func (c *Client) SupportsCapture(ctx context.Context) (bool, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.base+"/openapi.json", nil)
	if err != nil {
		return false, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("%s: %s", c.base, resp.Status)
	}
	var doc struct {
		Paths map[string]json.RawMessage `json:"paths"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 8<<20)).Decode(&doc); err != nil {
		return false, err
	}
	for _, p := range []string{
		"/api/v1/signals/capture",
		"/api/v1/documents/raw",
		"/api/v1/signals/{signal_id}/archive",
	} {
		if _, ok := doc.Paths[p]; !ok {
			return false, nil
		}
	}
	return true, nil
}
