"""PPTX slide PNG renders without PowerPoint COM (LibreOffice → PDF → pypdfium2)."""
from __future__ import annotations

import logging
from pathlib import Path

from app.services.doc_pdf_preview import DocumentPreviewError, OfficePreviewUnavailableError
from app.services.doc_pdf_preview import build_pdf_preview_bytes

logger = logging.getLogger(__name__)

# ~1280 px wide for a standard 13.33"×7.5" deck at 96 dpi (960 px native width).
_DEFAULT_RENDER_SCALE = 1.35


def render_pptx_slide_pngs(
    raw: bytes,
    render_dir: Path,
    *,
    filename: str | None = "deck.pptx",
    scale: float = _DEFAULT_RENDER_SCALE,
) -> int:
    """Write deckpeek-style `s01.png` … into `render_dir`. Returns count written (0 if skipped)."""
    render_dir = Path(render_dir)
    render_dir.mkdir(parents=True, exist_ok=True)
    try:
        pdf = build_pdf_preview_bytes(raw, filename, "application/vnd.openxmlformats-officedocument.presentationml.presentation")
    except OfficePreviewUnavailableError as exc:
        logger.info("PPTX slide renders skipped (no LibreOffice): %s", exc)
        return 0
    except DocumentPreviewError as exc:
        logger.warning("PPTX slide renders skipped (PDF conversion failed): %s", exc)
        return 0
    try:
        import pypdfium2 as pdfium
    except ImportError:  # pragma: no cover
        logger.info("PPTX slide renders skipped (pypdfium2 missing)")
        return 0

    count = 0
    try:
        doc = pdfium.PdfDocument(pdf)
        page_count = len(doc)
        for i in range(page_count):
            n = i + 1
            bitmap = doc[i].render(scale=scale)
            image = bitmap.to_pil()
            out = render_dir / ("s%02d.png" % n)
            image.save(out, format="PNG")
            count += 1
    except Exception as exc:  # noqa: BLE001
        logger.warning("PPTX slide PNG render stopped after %d pages: %s", count, exc)
    return count
