import pytest

pytestmark = pytest.mark.no_db

from app.services.doc_pdf_preview import (
    OfficePreviewUnavailableError,
    build_pdf_preview_bytes,
    document_pdf_preview_supported,
)


def test_document_pdf_preview_supported():
    assert document_pdf_preview_supported("report.pdf", "application/pdf")
    assert document_pdf_preview_supported("deck.pptx", None)
    assert document_pdf_preview_supported("book.docx", None)
    assert not document_pdf_preview_supported("notes.md", "text/markdown")


def test_passthrough_pdf_bytes():
    payload = b"%PDF-1.4 minimal"
    assert build_pdf_preview_bytes(payload, "a.pdf", "application/pdf") == payload


def test_office_without_libreoffice_raises(monkeypatch):
    monkeypatch.setattr("app.services.doc_pdf_preview._soffice_path", lambda: None)
    with pytest.raises(OfficePreviewUnavailableError):
        build_pdf_preview_bytes(b"fake", "report.docx", None)
