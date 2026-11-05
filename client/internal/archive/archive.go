// Package archive reads previously saved SingleFile HTML and locates its source URL.
package archive

import (
	"bytes"
	"errors"
	"io"
	"net/url"
	"os"
	"regexp"
	"strings"
)

// ErrNoURL means the file carries no canonical/og:url pointing at http(s).
var ErrNoURL = errors.New("no source url in html")

const scanLimit = 2 << 20 // canonical/og:url live in <head>; 2 MiB is plenty

var (
	linkTag = regexp.MustCompile(`(?is)<link\b[^>]*>`)
	metaTag = regexp.MustCompile(`(?is)<meta\b[^>]*>`)
	attrRe  = regexp.MustCompile(`(?is)([a-z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')`)
)

// Read loads a saved archive from disk.
func Read(path string) ([]byte, error) { return os.ReadFile(path) }

// SourceURL infers the original page URL from a saved archive, scanning at most 2 MiB.
func SourceURL(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	head, err := io.ReadAll(io.LimitReader(f, scanLimit))
	if err != nil {
		return "", err
	}
	return Infer(head), nil
}

// Infer returns the canonical or og:url of an HTML document, or "" when absent.
func Infer(html []byte) string {
	doc := bytes.TrimPrefix(html, []byte{0xEF, 0xBB, 0xBF})

	for _, tag := range linkTag.FindAll(doc, -1) {
		attrs := attrsOf(tag)
		if !hasToken(attrs["rel"], "canonical") {
			continue
		}
		if u := usable(attrs["href"]); u != "" {
			return u
		}
	}
	for _, tag := range metaTag.FindAll(doc, -1) {
		attrs := attrsOf(tag)
		key := strings.ToLower(strings.TrimSpace(attrs["property"]))
		if key == "" {
			key = strings.ToLower(strings.TrimSpace(attrs["name"]))
		}
		if key != "og:url" && key != "twitter:url" {
			continue
		}
		if u := usable(attrs["content"]); u != "" {
			return u
		}
	}
	return ""
}

func attrsOf(tag []byte) map[string]string {
	out := make(map[string]string, 6)
	for _, m := range attrRe.FindAllSubmatch(tag, -1) {
		key := strings.ToLower(string(m[1]))
		val := string(m[2])
		if val == "" {
			val = string(m[3])
		}
		out[key] = strings.TrimSpace(val)
	}
	return out
}

func hasToken(list, want string) bool {
	for _, tok := range strings.Fields(strings.ToLower(list)) {
		if tok == want {
			return true
		}
	}
	return false
}

func usable(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	u, err := url.Parse(raw)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return ""
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return ""
	}
	return u.String()
}
