"""A Chinese document name must not break the preview response.

Header values are latin-1, so interpolating the raw filename raised
UnicodeEncodeError and /preview.pdf answered 500 for every non-ASCII name.
"""
from __future__ import annotations

import pytest

from app.platform.http_headers import content_disposition

pytestmark = [pytest.mark.anyio, pytest.mark.db]

MINIMAL_PDF = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n"


def test_content_disposition_is_latin1_safe_for_chinese_names():
    header = content_disposition("佐思-2026年智能汽车区域控制器研究报告.pdf")
    header.encode("latin-1")  # what Starlette does when sending headers
    assert 'filename="' in header
    assert "filename*=UTF-8''" in header
    assert "inline" in header


def test_content_disposition_keeps_ascii_names_and_strips_quotes():
    assert content_disposition("report.pdf").startswith('inline; filename="report.pdf"')
    header = content_disposition('we"ird\\name.pdf')
    header.encode("latin-1")
    assert '"we_ird_name.pdf"' in header


async def test_pdf_preview_works_for_a_chinese_filename(client):
    upload = await client.post(
        "/api/v1/documents/raw",
        files={"file": ("佐思研究报告.pdf", MINIMAL_PDF, "application/pdf")},
    )
    assert upload.status_code == 201, upload.text
    document_id = upload.json()["id"]

    response = await client.get(f"/api/v1/documents/{document_id}/preview.pdf")

    assert response.status_code == 200, response.text
    assert response.headers["content-type"] == "application/pdf"
    disposition = response.headers["content-disposition"]
    assert "+" not in disposition or "filename*=UTF-8''" in disposition
    assert "filename*=UTF-8''" in disposition
