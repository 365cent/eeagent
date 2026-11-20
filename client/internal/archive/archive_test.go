package archive

import (
	"os"
	"path/filepath"
	"testing"
)

func TestInfer(t *testing.T) {
	cases := []struct {
		name string
		html string
		want string
	}{
		{
			name: "canonical first",
			html: `<html><head><link rel="canonical" href="https://mp.weixin.qq.com/s/abc"></head></html>`,
			want: "https://mp.weixin.qq.com/s/abc",
		},
		{
			name: "href before rel",
			html: `<LINK HREF='https://example.com/a?x=1' REL='Canonical'>`,
			want: "https://example.com/a?x=1",
		},
		{
			name: "og url fallback",
			html: `<meta property="og:url" content="https://example.com/post/1">`,
			want: "https://example.com/post/1",
		},
		{
			name: "twitter fallback",
			html: `<meta name="twitter:url" content="https://example.com/t/2">`,
			want: "https://example.com/t/2",
		},
		{
			name: "canonical wins over og",
			html: `<meta property="og:url" content="https://example.com/og"><link rel="canonical" href="https://example.com/can">`,
			want: "https://example.com/can",
		},
		{
			name: "relative canonical ignored",
			html: `<link rel="canonical" href="/local/path">`,
			want: "",
		},
		{
			name: "unquoted attributes (SingleFile rewrite)",
			html: `<html lang=en style><link rel=canonical href=https://www.eet-china.com/mp/a491751.html><meta http-equiv=content-security-policy content="default-src 'none'">`,
			want: "https://www.eet-china.com/mp/a491751.html",
		},
		{
			name: "unquoted og url",
			html: `<meta property=og:url content=https://example.com/u/1>`,
			want: "https://example.com/u/1",
		},
		{
			name: "singlefile provenance comment",
			html: `<html lang=en style><!--
 Page saved with SingleFile 
 url: https://www.eet-china.com/mp/a491751.html 
 saved date: Thu Nov 19 2026 16:55:30 GMT+0800 (中国标准时间)
--><meta charset=utf-8><title>北京车展</title>`,
			want: "https://www.eet-china.com/mp/a491751.html",
		},
		{
			name: "singlefile comment wins over canonical",
			html: `<!-- saved with SingleFile url: https://example.com/saved --><link rel=canonical href=https://example.com/canonical>`,
			want: "https://example.com/saved",
		},
		{
			name: "singlefile comment with unusable url falls back to canonical",
			html: `<!-- saved with SingleFile url: about:blank --><link rel=canonical href="https://example.com/page">`,
			want: "https://example.com/page",
		},
		{
			name: "legacy saved from url comment",
			html: `<!-- saved from url=(0045)https://example.com/legacy --><html><body>x</body></html>`,
			want: "https://example.com/legacy",
		},
		{
			name: "ampersand escaped canonical",
			html: `<link rel=canonical href="https://example.com/a?x=1&amp;y=2">`,
			want: "https://example.com/a?x=1&y=2",
		},
		{
			name: "no url",
			html: `<html><body><p>saved page</p></body></html>`,
			want: "",
		},
	}
	for _, c := range cases {
		if got := Infer([]byte(c.html)); got != c.want {
			t.Errorf("%s: Infer = %q, want %q", c.name, got, c.want)
		}
	}
}

func TestInferIframeNotConfused(t *testing.T) {
	html := `<link rel="stylesheet" href="https://example.com/a.css">
<link rel="canonical" href="https://example.com/page">
<meta name="description" content="x">`
	if got := Infer([]byte(html)); got != "https://example.com/page" {
		t.Fatalf("Infer = %q", got)
	}
}

func TestSourceURLFromFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "page.html")
	body := "\xef\xbb\xbf<!DOCTYPE html><html><head><link rel=\"canonical\" href=\"https://example.com/x\"></head></html>"
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
	got, err := SourceURL(path)
	if err != nil {
		t.Fatal(err)
	}
	if got != "https://example.com/x" {
		t.Fatalf("SourceURL = %q", got)
	}
	if _, err := SourceURL(filepath.Join(dir, "missing.html")); err == nil {
		t.Fatal("expected error for missing file")
	}
}
