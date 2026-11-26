"""重新解析文档 must finish the figures the ingest vision batch left empty.

The batch shares one timeout window, so a large PDF can return with every caption
empty while the per-figure 重新识别 button succeeds. The endpoint now calls the
same per-figure repair; this pins that wiring without re-parsing a real document.
"""
from __future__ import annotations

import uuid

import pytest

from app.api.v1 import documents as documents_api

pytestmark = [pytest.mark.anyio, pytest.mark.db]

MINIMAL_PDF = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n"


async def test_reingest_repairs_pending_figure_captions(client, monkeypatch):
    upload = await client.post(
        "/api/v1/documents/raw",
        files={"file": ("scan.pdf", MINIMAL_PDF, "application/pdf")},
    )
    assert upload.status_code == 201, upload.text
    document_id = upload.json()["id"]

    calls: dict[str, object] = {}

    async def fake_ingest(db, doc, data, *, vision_captions=True):  # noqa: ANN001
        calls["ingested"] = doc.id

    async def fake_pending(db, doc_id, *, limit=None):  # noqa: ANN001
        calls["recaptioned"] = doc_id
        return [1, 2], [2]

    monkeypatch.setattr(documents_api, "_ingest", fake_ingest)
    monkeypatch.setattr(documents_api, "recaption_pending_figures", fake_pending)

    response = await client.post(f"/api/v1/documents/{document_id}/ingest")

    assert response.status_code == 200, response.text
    assert calls["ingested"] == uuid.UUID(document_id)
    assert calls["recaptioned"] == uuid.UUID(document_id)


async def test_reingest_skips_recaption_when_nothing_is_pending(client, monkeypatch):
    upload = await client.post(
        "/api/v1/documents/raw",
        files={"file": ("clean.pdf", MINIMAL_PDF, "application/pdf")},
    )
    document_id = upload.json()["id"]
    calls: dict[str, object] = {}

    async def fake_ingest(db, doc, data, *, vision_captions=True):  # noqa: ANN001
        calls["ingested"] = True

    async def fake_pending(db, doc_id, *, limit=None):  # noqa: ANN001
        return [], []

    monkeypatch.setattr(documents_api, "_ingest", fake_ingest)
    monkeypatch.setattr(documents_api, "recaption_pending_figures", fake_pending)

    response = await client.post(f"/api/v1/documents/{document_id}/ingest")

    assert response.status_code == 200
    assert calls.get("ingested") is True
