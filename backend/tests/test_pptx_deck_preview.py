import io

import pytest
from pptx import Presentation

from app.services.pptx_deck_preview import (
    build_pptx_deck_preview,
    deck_preview_cached,
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


def test_inject_base_href():
    out = inject_deck_preview_base_href(b"<head><title>x</title></head>", "/api/v1/documents/x/deck-preview/")
    assert b'<base href="/api/v1/documents/x/deck-preview/">' in out
