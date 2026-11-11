"""End-to-end smoke test for the W2 capture pipeline against the running dev API.

Usage: uv run python scripts/smoke_capture.py
Requires the stack up: uv run python scripts/dev.py (foreground) or scripts/start_api.py (background)

Posts one clearly-marked smoke signal (url example.com/eea-wf-smoke) via
POST /api/v1/signals/capture, reads body and archive back, and uploads one
raw document. Exits nonzero on the first failure. The smoke rows stay in the
dev eea database as acceptance-path evidence.
"""
import sys

import httpx

BASE = "http://127.0.0.1:8000/api/v1"
SMOKE_HTML = (
    b"<!DOCTYPE html><html><head>"
    b"<title>EEA W2 capture smoke</title>"
    b"<meta property='og:title' content='EEA W2 capture smoke'>"
    b"<meta property='og:site_name' content='EEA workflow smoke'>"
    b"<meta property='article:published_time' content='2026-10-28T10:00:00+08:00'>"
    b"</head><body><p>EEA W2 capture pipeline smoke body: the markdown conversion keeps this text.</p></body></html>"
)


def main() -> int:
    r = httpx.post(
        f"{BASE}/signals/capture",
        data={"url": "https://example.com/eea-wf-smoke"},  # channel_code omitted: server infers web
        files={"archive_html": ("smoke.html", SMOKE_HTML, "text/html")},
        timeout=30,
    )
    if r.status_code not in (200, 201):
        print(f"FAIL capture: {r.status_code} {r.text[:300]}")
        return 1
    d = r.json()
    if not d.get("id") or not d.get("title"):
        print(f"FAIL capture response missing id/title: {d}")
        return 1
    sid = d["id"]

    b = httpx.get(f"{BASE}/signals/{sid}/body", timeout=30)
    if b.status_code != 200 or len(b.text) < 10:
        print(f"FAIL body: {b.status_code} len={len(b.text)}")
        return 1

    a = httpx.get(f"{BASE}/signals/{sid}/archive", timeout=30)
    ctype = a.headers.get("content-type", "")
    if a.status_code != 200 or not ctype.startswith("text/html"):
        print(f"FAIL archive: {a.status_code} {ctype}")
        return 1

    doc = httpx.post(
        f"{BASE}/documents/raw",
        files={"file": ("notes.txt", b"EEA W2 documents raw smoke payload", "text/plain")},
        timeout=30,
    )
    if doc.status_code not in (200, 201):
        print(f"FAIL documents/raw: {doc.status_code} {doc.text[:300]}")
        return 1
    dd = doc.json()
    for key in ("id", "sha256", "mime", "size"):
        if key not in dd:
            print(f"FAIL documents/raw response missing {key}: {dd}")
            return 1

    print(
        "SMOKE OK "
        f"id={sid} title={d.get('title')!r} published_at={d.get('published_at')} "
        f"evidence={d.get('evidence_status_code')} channel={d.get('channel_code')} "
        f"body_chars={len(b.text)} archive_bytes={len(a.content)} doc={dd}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
