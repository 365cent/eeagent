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

PPTX slide preview (structure DOM + optional slide PNGs) follows the deckpeek
reference — see docs/research/2026-11-10-deckpeek-pptx-preview-reference.md.
Figure order for evidence/captions remains this module's rel walk, not preview z-index alone.
"""
from __future__ import annotations

import asyncio
import hashlib
import io
import os
import random
import re
import tempfile
import time
import zipfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path
from typing import Awaitable, Callable

from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings, model_chain
from app.services.caption_cache import load_caption, store_caption
from app.platform.llm_gateway import resolve_vision_model
from app.platform.llm_prompts import VISION_CAPTION_PROMPT as _CAPTION_PROMPT
from app.platform.llm_usage import (
    http_status_of,
    log_llm_call,
    usage_from_agent_result,
    usage_without_result,
)
from app.domains.evidence.doc_structure import assign_figure_locations

MAX_FIGURES = 8  # default only; runtime cap comes from settings.max_figures
MAX_FIGURE_BYTES = 4 * 1024 * 1024

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
    "application/vnd.ms-excel": ".xls",
}

_FILENAME_MIME = {
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".ppt": "application/vnd.ms-powerpoint",
}
_AMBIGUOUS_MIMES = {
    "application/zip",
    "application/x-zip-compressed",
    "application/octet-stream",
    "binary/octet-stream",
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

#: ``(stage, percent)`` hook awaited while a document is ingested.
ProgressCallback = Callable[[str, int], Awaitable[None]]


@dataclass(slots=True)
class Figure:
    index: int
    source: str
    mime: str
    data: bytes
    page: int | None = None
    caption: str = ""
    caption_model: str | None = None
    occurrence_count: int = 1
    section_path: list[str] | None = None
    position: int | None = None
    confidence: float | None = None


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


def normalize_document_mime(filename: str | None, mime: str | None) -> str | None:
    """Prefer filename extension over ambiguous zip/octet-stream content types."""
    if filename:
        suffix = Path(filename).suffix.lower()
        if suffix in _FILENAME_MIME:
            return _FILENAME_MIME[suffix]
    lowered = (mime or "").strip().lower()
    if lowered and lowered not in _AMBIGUOUS_MIMES:
        return lowered
    if filename:
        suffix = Path(filename).suffix.lower()
        if suffix in _FILENAME_MIME:
            return _FILENAME_MIME[suffix]
    return lowered or None


# A cover page or a caption-only section still yields a few characters; require
# enough text to be readable evidence when the text layer is missing.
_PDF_MIN_TEXT_CHARS = 120


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


def _slide_no_from_rels_path(rel_name: str) -> int | None:
    m = re.search(r"/slides/_rels/slide(\d+)\.xml\.rels$", rel_name.replace("\\", "/"))
    return int(m.group(1)) if m else None


def _document_part_order(zf: zipfile.ZipFile, suffix: str) -> tuple[dict[str, int], dict[str, int]]:
    """Media file name → first position in document order.

    Walks the .rels of document-body parts (slides, notes, worksheets, …) in
    their numeric order and records each relationship target's first use.
    Media never referenced by a body part (slide-layout/master chrome, unused
    assets) gets no entry and sorts after every referenced figure.

    For PPTX, the second map is media file name → first slide index that references it.
    """
    pattern = _PART_ORDER.get(suffix)
    if pattern is None:
        return {}, {}
    order: dict[str, int] = {}
    slide_of: dict[str, int] = {}
    rel_parts = sorted(
        (n for n in zf.namelist() if pattern.search(n)), key=_numeric_part_key
    )
    position = 0
    for rel_name in rel_parts:
        slide_no = _slide_no_from_rels_path(rel_name) if suffix == ".pptx" else None
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
                if slide_no is not None:
                    slide_of[file_name] = slide_no
                position += 1
    return order, slide_of


def _relationship_targets(zf: zipfile.ZipFile, part: str) -> dict[str, str]:
    folder, name = part.rsplit("/", 1)
    rels_name = folder + "/_rels/" + name + ".rels"
    if rels_name not in zf.namelist():
        return {}
    try:
        root = ET.fromstring(zf.read(rels_name))
    except ET.ParseError:
        return {}
    targets: dict[str, str] = {}
    for rel in root.findall(f"{_RELS_NS}Relationship"):
        target = rel.get("Target", "")
        rid = rel.get("Id", "")
        if rid and target:
            targets[rid] = target.rsplit("/", 1)[-1]
    return targets


_BODY_PART_RE = {
    ".docx": re.compile(r"^word/(document|header\d*|footer\d*)\.xml$"),
    ".pptx": re.compile(r"^ppt/(slides|notesSlides)/(slide|notesSlide)\d+\.xml$"),
}


def _media_occurrence_counts(zf: zipfile.ZipFile, suffix: str) -> dict[str, int]:
    pattern = _BODY_PART_RE.get(suffix)
    if pattern is None:
        return {}
    counts: dict[str, int] = {}
    for part in zf.namelist():
        if not pattern.match(part):
            continue
        try:
            root = ET.fromstring(zf.read(part))
        except ET.ParseError:
            continue
        targets = _relationship_targets(zf, part)
        for element in root.iter():
            for key, value in element.attrib.items():
                if key.endswith("}embed") or key.endswith("}link"):
                    target = targets.get(value)
                    if target:
                        counts[target] = counts.get(target, 0) + 1
    return counts


def _zip_figures(data: bytes, suffix: str, prefix: str) -> list[Figure]:
    """Embedded media in document order; identical bytes share one asset."""
    figures: list[Figure] = []
    by_digest: dict[str, Figure] = {}
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            order, slide_of = _document_part_order(zf, suffix)
            occurrences = _media_occurrence_counts(zf, suffix)
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
                base = Path(name).name
                digest = hashlib.sha256(blob).hexdigest()
                existing = by_digest.get(digest)
                if existing is not None:
                    existing.occurrence_count += occurrences.get(base, 1)
                    continue
                figure = Figure(
                    index=len(figures) + 1,
                    source=base,
                    page=slide_of.get(base),
                    mime=_EXT_MIME.get(ext, "image/png"),
                    data=blob,
                    occurrence_count=occurrences.get(base, 1),
                )
                by_digest[digest] = figure
                figures.append(figure)
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
    """Caption one figure; retries rotate through the configured vision models.

    `model` may be a comma-separated list (``VISION_MODEL``), e.g.
    ``Qwen3.8-27B,Qwen3.6-35B``. Every listed model is tried at least once, and
    `retries` extra attempts are spread across the list in order, so a gateway
    that rejects one id (404/503) still gets the next one. The first attempt on
    a figure occasionally returns an empty body from a transient upstream error.
    """
    settings = get_settings()
    base = settings.chat_base_url_normalized
    models = model_chain(model)
    if not base or not models:
        return ""
    for candidate in models:
        cached = load_caption(figure.data, candidate)
        if cached is not None:
            figure.caption_model = cached.served_model or candidate
            return cached.caption
    attempts = max(retries + 1, len(models))
    delay_base = float(getattr(settings, "vision_retry_base_delay_seconds", 1.5))
    for attempt in range(attempts):
        if attempt:
            # gateway rate-limits long batches; short jittered beat, in model order
            await asyncio.sleep(delay_base * attempt + random.uniform(0, 0.2))
        current = models[attempt % len(models)]
        caption, served = await _caption_once(
            figure, model=current, settings=settings, base=base, attempt=attempt + 1
        )
        if caption:
            figure.caption_model = served or current
            store_caption(figure.data, current, caption, served_model=served)
            return caption
    return ""


_CAPTION_CACHE_SETTING = {"messages": False}


def _caption_agent(model: str, settings) -> "Agent[None, str]":
    """Pydantic AI agent for one vision caption.

    The static instruction block stays first so a provider can cache the prompt
    prefix. Each figure is a one-off conversation, so the conversation itself is
    not written to the prompt cache (it is never read back).
    """
    from pydantic_ai import Agent
    from pydantic_ai.models.openai import OpenAIChatModel

    from app.platform.llm import gateway_openai_provider

    return Agent(
        OpenAIChatModel(model, provider=gateway_openai_provider(settings)),
        output_type=str,
        system_prompt=_CAPTION_PROMPT,
        model_settings={
            "temperature": 0,
            "max_tokens": int(getattr(settings, "vision_caption_max_tokens", 1024)),
            "cache": dict(_CAPTION_CACHE_SETTING),
        },
    )


async def _caption_once(
    figure: Figure, *, model: str, settings, base: str, attempt: int = 1
) -> tuple[str, str]:
    """One vision attempt through Pydantic AI; returns (caption, served model)."""
    from pydantic_ai import BinaryContent

    started = time.perf_counter()
    try:
        result = await _caption_agent(model, settings).run(
            [BinaryContent(data=figure.data, media_type=figure.mime or "image/png")]
        )
    except Exception as exc:  # noqa: BLE001 - unknown ids fall through the chain
        log_llm_call(
            usage_without_result(
                task="vision_caption",
                requested_model=model,
                latency_ms=int((time.perf_counter() - started) * 1000),
                caller_attempt=attempt,
                fallback=attempt > 1,
                http_status=http_status_of(exc),
            )
        )
        return "", ""
    latency_ms = int((time.perf_counter() - started) * 1000)
    response = getattr(result, "response", None)
    served = str(getattr(response, "model_name", None) or "")
    log_llm_call(
        usage_from_agent_result(
            result,
            task="vision_caption",
            requested_model=model,
            caller_attempt=attempt,
            fallback=attempt > 1,
            latency_ms=latency_ms,
        )
    )
    caption = (getattr(result, "output", "") or "").strip().replace("\n", " ")
    # A caption is a note under one image, not prose. Cut at a sentence end so a
    # runaway model response cannot paste article text into the figure caption.
    return _clip_caption(caption), served or model


def _clip_caption(text: str, limit: int = 180) -> str:
    """Trim a vision caption to a single short sentence-level note."""
    cleaned = re.sub(r"\s+", " ", text or "").strip()
    if not cleaned:
        return ""
    if len(cleaned) <= limit:
        return cleaned
    window = cleaned[: limit + 40]
    stop = max(window.rfind("。"), window.rfind("；"), window.rfind(". "))
    if stop >= 40:
        return window[: stop + 1].strip()
    return cleaned[:limit].rstrip("，,、 ") + "…"


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


async def ingest_document(
    data: bytes,
    filename: str | None,
    mime: str | None,
    *,
    vision_captions: bool = True,
    on_progress: "ProgressCallback | None" = None,
) -> IngestResult:
    """Convert, extract figures, caption them, and build the canonical Markdown.

    ``on_progress(stage, percent)`` is awaited as the work advances so the
    capture job can report "图块识别 3/16"-style progress to the import panel.
    """

    async def progress(stage: str, percent: int) -> None:
        if on_progress is not None:
            await on_progress(stage, max(0, min(100, percent)))

    settings = get_settings()
    suffix = suffix_for(filename, mime)
    await progress("parsing", 20)
    markdown, md_version = await run_in_threadpool(_convert_sync, data, suffix)
    figures = await run_in_threadpool(extract_figures, data, suffix)
    figures = figures[: settings.max_figures]
    await progress("parsing", 45)

    vision_chain: str = ""
    vision_model: str | None = None
    if figures and vision_captions:
        try:
            vision_chain = await resolve_vision_model()
        except Exception:  # noqa: BLE001 - captions are best-effort
            vision_chain = ""
        # ``VISION_MODEL`` may list fallbacks (``A,B``); keep the whole chain for
        # the caption calls and record the id that actually answered below.
        vision_model = (model_chain(vision_chain) or [None])[0]
        if vision_chain:

            async def caption_figures() -> None:
                semaphore = asyncio.Semaphore(3)
                done = 0
                total = len(figures)

                async def caption(figure: Figure) -> None:
                    nonlocal done
                    async with semaphore:
                        figure.caption = await caption_figure(
                            figure,
                            model=vision_chain,
                            retries=settings.vision_caption_retry,
                        )
                    done += 1
                    # Captioning is the slow part of a document ingest: 45 -> 85.
                    await progress("captioning", 45 + int(40 * done / total))

                await asyncio.gather(*(caption(figure) for figure in figures))
                for figure in figures:
                    if not figure.caption:
                        figure.caption = await caption_figure(
                            figure,
                            model=vision_chain,
                            retries=settings.vision_caption_retry,
                        )
                        await asyncio.sleep(0.5)

            try:
                await asyncio.wait_for(
                    caption_figures(),
                    timeout=settings.doc_ingest_vision_timeout_seconds,
                )
            except asyncio.TimeoutError:
                pass
        # Prefer the model that really answered over the head of the chain.
        served = next((f.caption_model for f in figures if f.caption_model), None)
        if served:
            vision_model = served

    if suffix == ".pdf" and len(markdown.strip()) < _PDF_MIN_TEXT_CHARS:
        # Figure captions must not make a text-less scan look readable.
        raise ValueError(
            "PDF 没有可提取的文本层（可能需要 OCR）；原始文件已保留，请 OCR 后重新上传"
        )
    if not markdown.strip():
        markdown = f"# {filename or 'document'}\n\n（MarkItDown 未抽取到文本）"
    canonical = apply_captions(markdown, figures)
    assign_figure_locations(canonical, figures)
    await progress("indexing", 92)
    return IngestResult(
        canonical_md=canonical,
        markitdown_version=md_version,
        figures=figures,
        vision_model=vision_model,
    )
