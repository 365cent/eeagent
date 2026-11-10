from app.services.doc_pdf_preview import OfficePreviewUnavailableError
from app.services.pptx_slide_render import render_pptx_slide_pngs


def test_render_pptx_slide_pngs_without_libreoffice(monkeypatch, tmp_path):
    """Missing soffice should not raise; deck build still uses structure mode."""

    def _boom(*_a, **_k):
        raise OfficePreviewUnavailableError("no soffice")

    monkeypatch.setattr("app.services.pptx_slide_render.build_pdf_preview_bytes", _boom)
    count = render_pptx_slide_pngs(b"not-used", tmp_path / "render")
    assert count == 0
