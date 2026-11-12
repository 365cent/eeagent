"""Deterministic Markdown → PDF for chain reports (CJK via ReportLab CID font)."""
from __future__ import annotations

from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfgen import canvas

_FONT = "STSong-Light"
_PAGE_W, _PAGE_H = A4
_MARGIN_X = 48
_MARGIN_Y = 56
_LINE_HEIGHT = 16
_FONT_SIZE = 11


def _ensure_font_registered() -> None:
    try:
        pdfmetrics.getFont(_FONT)
    except KeyError:
        pdfmetrics.registerFont(UnicodeCIDFont(_FONT))


def render_markdown_to_pdf_bytes(markdown: str) -> bytes:
    """Render plain Markdown lines to a simple paginated PDF (no full MD parser)."""
    _ensure_font_registered()
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setTitle("EEA Chain Report")
    pdf.setFont(_FONT, _FONT_SIZE)

    max_chars = 84
    y = _PAGE_H - _MARGIN_Y
    for raw_line in markdown.splitlines():
        line = raw_line.replace("\t", "    ")
        if not line.strip():
            y -= _LINE_HEIGHT
            if y < _MARGIN_Y:
                pdf.showPage()
                pdf.setFont(_FONT, _FONT_SIZE)
                y = _PAGE_H - _MARGIN_Y
            continue
        while len(line) > max_chars:
            chunk = line[:max_chars]
            line = line[max_chars:]
            pdf.drawString(_MARGIN_X, y, chunk)
            y -= _LINE_HEIGHT
            if y < _MARGIN_Y:
                pdf.showPage()
                pdf.setFont(_FONT, _FONT_SIZE)
                y = _PAGE_H - _MARGIN_Y
        pdf.drawString(_MARGIN_X, y, line)
        y -= _LINE_HEIGHT
        if y < _MARGIN_Y:
            pdf.showPage()
            pdf.setFont(_FONT, _FONT_SIZE)
            y = _PAGE_H - _MARGIN_Y

    pdf.save()
    return buffer.getvalue()
