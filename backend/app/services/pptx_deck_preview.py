"""PPTX slide viewer HTML via deckpeek (structure mode; optional COM renders on Windows)."""
from __future__ import annotations

import importlib.util
import re
import tempfile
from pathlib import Path

from app.services.doc_ingest import suffix_for
from app.services.objectstore import load_bytes, put_object

_DECKPEEK_SCRIPT = (
    Path(__file__).resolve().parents[3] / "reference-will-deleted/deckpeek-src/src/deckpeek.py"
)
_BASE_TAG_RE = re.compile(r"<head(\s[^>]*)?>", re.IGNORECASE)


class PptxDeckPreviewError(Exception):
    pass


class PptxDeckPreviewUnavailableError(PptxDeckPreviewError):
    """Reference deckpeek.py missing or export failed."""


def pptx_deck_preview_supported(filename: str | None, mime: str | None) -> bool:
    return suffix_for(filename, mime) in {".ppt", ".pptx"}


def deck_preview_prefix(doc_sha256: str) -> str:
    return f"documents/deck-preview/{doc_sha256}"


def deck_preview_index_key(doc_sha256: str) -> str:
    return f"{deck_preview_prefix(doc_sha256)}/index.html"


def deck_preview_cached(doc_sha256: str) -> bool:
    return load_bytes(deck_preview_index_key(doc_sha256)) is not None


def _load_deckpeek():
    if not _DECKPEEK_SCRIPT.is_file():
        raise PptxDeckPreviewUnavailableError(
            f"deckpeek 参考实现不存在：{_DECKPEEK_SCRIPT}"
        )
    spec = importlib.util.spec_from_file_location("deckpeek_ref", _DECKPEEK_SCRIPT)
    if spec is None or spec.loader is None:
        raise PptxDeckPreviewUnavailableError("无法加载 deckpeek 模块")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def build_pptx_deck_preview(raw: bytes, filename: str | None, doc_sha256: str) -> None:
    """Generate deckpeek HTML tree into the object store (idempotent per doc sha256)."""
    if deck_preview_cached(doc_sha256):
        return
    if not pptx_deck_preview_supported(filename, None):
        raise PptxDeckPreviewError("非 PPTX 文档")

    deckpeek = _load_deckpeek()
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        name = Path(filename or "deck.pptx").name
        if not name.lower().endswith((".ppt", ".pptx")):
            name = "deck.pptx"
        src = work / name
        src.write_bytes(raw)
        out_dir = work / "out"
        render_dir = out_dir / "_render"
        render_dir.mkdir(parents=True)
        try:
            deckpeek.export(str(src), str(out_dir), str(render_dir), {1})
        except Exception as exc:  # noqa: BLE001
            raise PptxDeckPreviewError(f"deckpeek 导出失败：{exc}") from exc
        index = out_dir / "index.html"
        if not index.is_file():
            raise PptxDeckPreviewError("deckpeek 未生成 index.html")

        prefix = deck_preview_prefix(doc_sha256)
        for path in out_dir.rglob("*"):
            if not path.is_file():
                continue
            rel = path.relative_to(out_dir).as_posix()
            put_object(f"{prefix}/{rel}", path.read_bytes())


def inject_deck_preview_base_href(html: bytes, base_href: str) -> bytes:
    text = html.decode("utf-8", errors="replace")
    tag = f'<base href="{base_href}">'
    if _BASE_TAG_RE.search(text):
        text = _BASE_TAG_RE.sub(rf"<head\1>{tag}", text, count=1)
    else:
        text = tag + text
    return text.encode("utf-8")
