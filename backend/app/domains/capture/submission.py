from __future__ import annotations

import json
from pathlib import Path

from app.services.objectstore import sha256_bytes

_HTML_SUFFIXES = {".html", ".htm", ".xhtml"}


def _is_html(*, mime: str | None, filename: str | None) -> bool:
    # split off charset parameters ("text/html; charset=utf-8")
    base = (mime or "").split(";")[0].strip().lower()
    if base == "text/html":
        return True
    return bool(filename) and Path(filename).suffix.lower() in _HTML_SUFFIXES


def _submission_fingerprint(
    *,
    url: str | None,
    data: bytes,
    filename: str | None,
    mime: str | None,
    channel_code: str | None,
    publisher: str | None,
    source_label: str | None,
) -> str:
    payload = {
        "url": url,
        "content_sha256": sha256_bytes(data) if data else None,
        "filename": filename if data else None,
        "mime": mime if data else None,
        "channel_code": channel_code,
        "publisher": publisher,
        "source_label": source_label,
    }
    canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return sha256_bytes(canonical.encode("utf-8"))
