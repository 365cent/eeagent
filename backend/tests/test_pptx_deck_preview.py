import io

import pytest
from pptx import Presentation

from app.services.pptx_deck_preview import (
    _sanitize_deckpeek_html_for_eea,
    build_pptx_deck_preview,
    deck_preview_cached,
    deck_preview_html_is_legacy,
    deck_preview_index_key,
    inject_deck_preview_base_href,
    pptx_deck_preview_supported,
)
from app.services.objectstore import load_bytes


def _mini_pptx() -> bytes:
    buf = io.BytesIO()
    prs = Presentation()
    slide = prs.slides.add_slide(prs.slide_layouts[5])
    slide.shapes.title.text = "EEA deck preview"
    prs.save(buf)
    return buf.getvalue()


def test_pptx_deck_preview_supported():
    assert pptx_deck_preview_supported("a.pptx", None)
    assert not pptx_deck_preview_supported("a.pdf", "application/pdf")


def test_build_and_cache_deck_preview(tmp_path, monkeypatch):
    monkeypatch.setenv("OBJECT_DIR", str(tmp_path / "objects"))
    digest = "a" * 64
    build_pptx_deck_preview(_mini_pptx(), "demo.pptx", digest)
    assert deck_preview_cached(digest)
    html = load_bytes(deck_preview_index_key(digest))
    assert html and b"deckpeek" in html.lower() or b"slide" in html.lower()
    assert b'id="banner"' not in html
    assert b"force-render" not in html


def test_sanitize_drops_banner_and_flips_structure_mode():
    raw = (
        '<motion></motion><div id="banner">missing slides</div>'
        "<script>setMode(false);\nshow(fromHash(), true);</script>"
    )
    out = _sanitize_deckpeek_html_for_eea(raw)
    assert 'id="banner"' not in out
    assert "setMode(true);\nshow(fromHash()" in out


def test_deck_preview_legacy_detection():
    legacy = (
        b'<div id="banner">missing PNG</div><script>setMode(false);\nshow(fromHash(), true);</script>'
    )
    assert deck_preview_html_is_legacy(legacy)
    fresh = b"<script>setMode(true);\nshow(fromHash(), true);</script>"
    assert not deck_preview_html_is_legacy(fresh)


def test_inject_base_href():
    sample = (
        b"<head><title>x</title></head><body>"
        b'<div id="banner">missing 57 slide PNGs</div>'
        b"</body>"
    )
    out = inject_deck_preview_base_href(sample, "/api/v1/documents/x/deck-preview/")
    assert b'<base href="/api/v1/documents/x/deck-preview/">' in out
    assert b'id="banner"' not in out
    assert b"eea-deck-embed-boot" in out
    assert b"eea-deck-embed-tail" in out
