"""Document ingest: MarkItDown text + vision captions for embedded figures (W4).

Raw uploads are stored verbatim by `POST /documents/raw`; this module turns the
same bytes into canonical Markdown:

1. MarkItDown converts docx/pptx/xlsx/pdf/html/... into Markdown.
2. Embedded images are extracted (docx/pptx/xlsx media, PDF pages that contain
   images, or a directly uploaded image) and captioned by the gateway vision
   model (Qwen 3.8 -> 3.6, resolved dynamically).
3. Image placeholders in the MarkItDown output are replaced with `> 图 N：…`
   quotes; figures without a placeholder are appended as a table.

Everything is local: the only network call is the enterprise LLM gateway.
"""
from __future__ import annotations

import asyncio
import base64
import io
import os
import re
import tempfile
import zipfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path

import httpx
from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings
from app.services.llm_gateway import resolve_vision_model

MAX_FIGURES = 8  # default only; runtime cap comes from settings.max_figures
MAX_FIGURE_BYTES = 4 * 1024 * 1024
VISION_TIMEOUT = 60.0

_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tif", ".tiff"}
_EXT_MIME = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
}
_MIME_EXT = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
}

_ZIP_MEDIA_PREFIX = {
    ".docx": "word/media/",
    ".pptx": "ppt/media/",
    ".xlsx": "xl/media/",
}

# Part-name prefixes that hold document-BODY media, in document order. Layout/
# master assets (ppt/slideLayouts/, ppt/slideMasters/, theme images) decorate
# the chrome, not the content, and are never captioned. OOXML keeps each
# part's relationships in a sibling _rels directory (e.g.
# ppt/slides/_rels/slide1.xml.rels), which the patterns must reflect.
_PART_ORDER = {
    ".pptx": re.compile(r"^ppt/(slides|notesSlides)/_rels/[^/]+\.rels$"),
    ".docx": re.compile(r"^word/_rels/(document|header\d*|footer\d*)\.xml\.rels$"),
    ".xlsx": re.compile(r"^xl/(worksheets|charts)/_rels/[^/]+\.rels$"),
}

_IMAGE_TAG = re.compile(r"!\[[^\]]*\]\(\s*(?:data:image/[^)]*|[^)\s]+)\s*\)")
_CAPTION_PROMPT = (
    "用一句简体中文描述这张图的要点（不超过 60 字）。只描述可见内容，"
    "不要推测背景，不要输出 Markdown。"
)


@dataclass(slots=True)
class Figure:
    index: int
    source: str
    mime: str
    data: bytes
    page: int | None = None
    caption: str = ""


@dataclass(slots=True)
class IngestResult:
    canonical_md: str
    markitdown_version: str | None
    figures: list[Figure] = field(default_factory=list)
    vision_model: str | None = None

    @property
    def figure_count(self) -> int:
        return len(self.figures)


def suffix_for(filename: str | None, mime: str | None) -> str:
    if filename:
        suffix = Path(filename).suffix.lower()
        if suffix:
            return suffix
    return _MIME_EXT.get((mime or "").lower(), ".bin")


def _convert_sync(data: bytes, suffix: str) -> tuple[str, str | None]:
    from importlib.metadata import PackageNotFoundError, version

    from markitdown import MarkItDown

    handle = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        handle.write(data)
        handle.close()
        text = MarkItDown().convert(handle.name).text_content or ""
    finally:
        os.unlink(handle.name)
    try:
        md_version = version("markitdown")
    except PackageNotFoundError:  # pragma: no cover - dependency is declared
        md_version = None
    return text, md_version


def extract_figures(data: bytes, suffix: str) -> list[Figure]:
    """Images embedded in the document, in document order."""
    if suffix in _ZIP_MEDIA_PREFIX:
        return _zip_figures(data, suffix, _ZIP_MEDIA_PREFIX[suffix])
    if suffix == ".pdf":
        return _pdf_figures(data)
    if suffix in _IMAGE_EXTS:
        return [Figure(index=1, source=f"upload{suffix}", mime=_EXT_MIME.get(suffix, "image/png"), data=data)]
    return []


_RELS_NS = "{http://schemas.openxmlformats.org/package/2006/relationships}"


def _numeric_part_key(name: str) -> list[tuple[int, str | int]]:
    """Sort key so slide2 sorts before slide10 (string sort would swap them)."""
    return [
        (1, int(text)) if text.isdigit() else (0, text)
        for text in re.findall(r"\d+|\D+", name)
    ]


def _document_part_order(zf: zipfile.ZipFile, suffix: str) -> dict[str, int]:
    """Media file name → first position in document order.

    Walks the .rels of document-body parts (slides, notes, worksheets, …) in
    their numeric order and records each relationship target's first use.
    Media never referenced by a body part (slide-layout/master chrome, unused
    assets) gets no entry and sorts after every referenced figure.
    """
    pattern = _PART_ORDER.get(suffix)
    if pattern is None:
        return {}
    order: dict[str, int] = {}
    rel_parts = sorted(
        (n for n in zf.namelist() if pattern.search(n)), key=_numeric_part_key
    )
    position = 0
    for rel_name in rel_parts:
        try:
            root = ET.fromstring(zf.read(rel_name))
        except ET.ParseError:
            continue
        for rel in root.findall(f"{_RELS_NS}Relationship"):
            target = rel.get("Target", "")
            # normalize ../media/x.png or media/x.png to the bare file name
            file_name = target.rsplit("/", 1)[-1]
            if file_name not in order:
                order[file_name] = position
                position += 1
    return order


def _zip_figures(data: bytes, suffix: str, prefix: str) -> list[Figure]:
    """Embedded media in DOCUMENT order (rels), not zip-lexicographic order.

    Unreferenced media (layout/master/theme chrome) keeps a stable position
    after all referenced figures, so captions land where the reader sees them.
    """
    figures: list[Figure] = []
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            order = _document_part_order(zf, suffix)
            names = sorted(
                (n for n in zf.namelist() if n.startswith(prefix) and not n.endswith("/")),
                key=lambda n: (order.get(Path(n).name, len(order)), _numeric_part_key(n)),
            )
            for name in names:
                ext = Path(name).suffix.lower()
                if ext not in _IMAGE_EXTS:
                    continue
                blob = zf.read(name)
                if not blob or len(blob) > MAX_FIGURE_BYTES:
                    continue
                figures.append(
                    Figure(
                        index=len(figures) + 1,
                        source=Path(name).name,
                        mime=_EXT_MIME.get(ext, "image/png"),
                        data=blob,
                    )
                )
    except zipfile.BadZipFile:
        return []
    return figures


def _pdf_figures(data: bytes) -> list[Figure]:
    """Pages that contain raster images, rendered once per page."""
    try:
        import pdfplumber
    except Exception:  # pragma: no cover - optional extra
        return []
    try:
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            pages = [i + 1 for i, page in enumerate(pdf.pages) if page.images]
    except Exception:
        return []
    if not pages:
        return []
    try:
        import pypdfium2 as pdfium
    except Exception:  # pragma: no cover - optional extra
        return []
    figures: list[Figure] = []
    try:
        doc = pdfium.PdfDocument(data)
        for page_no in pages[: get_settings().max_figures]:
            bitmap = doc[page_no - 1].render(scale=1.4)
            image = bitmap.to_pil()
            buffer = io.BytesIO()
            image.save(buffer, format="PNG")
            blob = buffer.getvalue()
            if len(blob) > MAX_FIGURE_BYTES:
                continue
            figures.append(
                Figure(
                    index=len(figures) + 1,
                    source=f"page-{page_no}",
                    page=page_no,
                    mime="image/png",
                    data=blob,
                )
            )
    except Exception:
        return figures
    return figures


async def caption_figure(figure: Figure, *, model: str, retries: int = 0) -> str:
    """One vision call; empty responses retried up to `retries` extra times.

    The first attempt on a figure occasionally returns an empty body from the
    gateway (transient upstream error); one retry recovers most of those.
    """
    settings = get_settings()
    base = settings.llm_base_url_normalized
    if not base or not model:
        return ""
    for attempt in range(retries + 1):
        if attempt:
            # gateway rate-limits long batches; give it a beat before retrying
            await asyncio.sleep(2.0 * attempt)
        caption = await _caption_once(figure, model=model, settings=settings, base=base)
        if caption:
            return caption
    return ""


async def _caption_once(figure: Figure, *, model: str, settings, base: str) -> str:
    encoded = base64.b64encode(figure.data).decode("ascii")
    payload = {
        "model": model,
        "max_tokens": 160,
        "temperature": 0,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": _CAPTION_PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{figure.mime};base64,{encoded}"},
                    },
                ],
            }
        ],
    }
    headers = {"Content-Type": "application/json"}
    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"
    try:
        async with httpx.AsyncClient(timeout=VISION_TIMEOUT) as client:
            response = await client.post(
                f"{base}/chat/completions", headers=headers, json=payload
            )
    except httpx.HTTPError:
        return ""
    if response.status_code >= 400:
        return ""
    try:
        content = response.json()["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return ""
    return content.strip().replace("\n", " ")[:300]


def apply_captions(markdown: str, figures: list[Figure]) -> str:
    """Replace image tags in document order; append unused figures as a table."""
    counter = 0

    def replace(_match: re.Match[str]) -> str:
        nonlocal counter
        if counter >= len(figures):
            return ""
        figure = figures[counter]
        counter += 1
        text = figure.caption or f"（{figure.source}，视觉模型未返回描述）"
        return f"\n\n> 图 {figure.index}：{text}\n\n"

    output = _IMAGE_TAG.sub(replace, markdown)
    leftovers = figures[counter:]
    if leftovers:
        rows = ["", "## 图块语义", "", "| # | 来源 | 描述 |", "| --- | --- | --- |"]
        for figure in leftovers:
            caption = figure.caption or "（视觉模型未返回描述）"
            origin = f"第 {figure.page} 页" if figure.page else figure.source
            rows.append(f"| {figure.index} | {origin} | {caption} |")
        output = output.rstrip() + "\n" + "\n".join(rows) + "\n"
    return output.strip() + "\n"


async def ingest_document(data: bytes, filename: str | None, mime: str | None) -> IngestResult:
    settings = get_settings()
    suffix = suffix_for(filename, mime)
    markdown, md_version = await run_in_threadpool(_convert_sync, data, suffix)
    figures = await run_in_threadpool(extract_figures, data, suffix)
    figures = figures[: settings.max_figures]

    vision_model: str | None = None
    if figures:
        try:
            vision_model = await resolve_vision_model()
        except Exception:  # noqa: BLE001 - captions are best-effort
            vision_model = None
        if vision_model:
            semaphore = asyncio.Semaphore(3)

            async def caption(figure: Figure) -> None:
                async with semaphore:
                    figure.caption = await caption_figure(
                        figure,
                        model=vision_model,
                        retries=settings.vision_caption_retry,
                    )

            await asyncio.gather(*(caption(figure) for figure in figures))
            # The concurrent pass drops captions when the gateway rate-limits
            # long batches; top up the stragglers one at a time, with pacing.
            for figure in figures:
                if not figure.caption:
                    figure.caption = await caption_figure(
                        figure,
                        model=vision_model,
                        retries=settings.vision_caption_retry,
                    )
                    await asyncio.sleep(0.5)

    if not markdown.strip():
        markdown = f"# {filename or 'document'}\n\n（MarkItDown 未抽取到文本）"
    canonical = apply_captions(markdown, figures)
    return IngestResult(
        canonical_md=canonical,
        markitdown_version=md_version,
        figures=figures,
        vision_model=vision_model,
    )
