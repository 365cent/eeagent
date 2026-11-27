"""BE-02: stored-object references must fail clearly when the blob is gone."""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import select

from app.db.base import SessionLocal
from app.models.agent_models import DocumentFigure
from app.models.models import Document
from app.platform.objectstore import delete_object
from tests.support import create_signal
from tests.test_capture import ARCHIVE_HTML

pytestmark = pytest.mark.anyio

PAGE_URL = "https://mp.weixin.qq.com/s/efuse-missing-objects"


@pytest.fixture
def fake_doc_ingest(monkeypatch):
    async def _ingest(data, filename, mime, **kwargs):
        from app.domains.evidence.doc_ingest import IngestResult

        return IngestResult(
            canonical_md="# Missing objects\n\nCanonical body for the test.",
            markitdown_version="test-missing",
            figures=[],
        )

    monkeypatch.setattr("app.domains.evidence.document_pipeline.ingest_document", _ingest)
    return _ingest


async def _capture_html(client):
    response = await client.post(
        "/api/v1/capture",
        data={"url": PAGE_URL},
        files={"file": ("page.html", ARCHIVE_HTML.encode("utf-8"), "text/html")},
    )
    assert response.status_code == 201, response.text
    return response.json()


async def _capture_pdf(client):
    response = await client.post(
        "/api/v1/capture",
        files={"file": ("report.pdf", b"%PDF-missing-object", "application/pdf")},
    )
    assert response.status_code == 201, response.text
    return response.json()


async def test_missing_signal_body_returns_404(client):
    signal = await create_signal(client, body_text="Stored body for the missing-object test.")
    detail = (await client.get(f"/api/v1/signals/{signal['id']}")).json()
    key = detail["body_object_key"]
    assert key
    assert (await client.get(f"/api/v1/signals/{signal['id']}/body")).status_code == 200

    assert delete_object(key) is True
    missing = await client.get(f"/api/v1/signals/{signal['id']}/body")
    assert missing.status_code == 404, missing.text
    assert "missing from the object store" in missing.json()["detail"]


async def test_missing_snapshot_breaks_archive_and_figures(client):
    captured = await _capture_html(client)
    signal_id = captured["signal"]["id"]
    key = captured["signal"]["snapshot_html_object_key"]
    assert key

    assert (await client.get(f"/api/v1/signals/{signal_id}/archive")).status_code == 200
    assert (await client.get(f"/api/v1/signals/{signal_id}/figures")).status_code == 200

    assert delete_object(key) is True
    archive = await client.get(f"/api/v1/signals/{signal_id}/archive")
    assert archive.status_code == 404, archive.text
    assert "missing from the object store" in archive.json()["detail"]
    figures = await client.get(f"/api/v1/signals/{signal_id}/figures")
    assert figures.status_code == 404, figures.text
    assert "missing from the object store" in figures.json()["detail"]


async def test_missing_document_canonical_returns_404(client, fake_doc_ingest):
    captured = await _capture_pdf(client)
    document_id = captured["document"]["id"]
    async with SessionLocal() as db:
        doc = (
            await db.execute(select(Document).where(Document.id == uuid.UUID(document_id)))
        ).scalar_one()
        key = doc.canonical_md_object_key
    assert key
    assert (await client.get(f"/api/v1/documents/{document_id}/canonical.md")).status_code == 200

    assert delete_object(key) is True
    missing = await client.get(f"/api/v1/documents/{document_id}/canonical.md")
    assert missing.status_code == 404, missing.text
    assert "missing from the object store" in missing.json()["detail"]


async def test_missing_document_raw_returns_404_for_preview_and_figures(client, fake_doc_ingest):
    captured = await _capture_pdf(client)
    document_id = captured["document"]["id"]
    signal_id = captured["signal"]["id"]
    async with SessionLocal() as db:
        doc = (
            await db.execute(select(Document).where(Document.id == uuid.UUID(document_id)))
        ).scalar_one()
        key = doc.object_key
    assert key
    assert (await client.get(f"/api/v1/documents/{document_id}/preview.pdf")).status_code == 200

    assert delete_object(key) is True
    preview = await client.get(f"/api/v1/documents/{document_id}/preview.pdf")
    assert preview.status_code == 404, preview.text
    assert "missing from the object store" in preview.json()["detail"]

    figures = await client.get(f"/api/v1/signals/{signal_id}/figures")
    assert figures.status_code == 404, figures.text
    assert "raw object" in figures.json()["detail"]

async def test_missing_figure_image_returns_404_and_recaption_marks_review(
    client, fake_doc_ingest
):
    captured = await _capture_pdf(client)
    document_id = uuid.UUID(captured["document"]["id"])
    async with SessionLocal() as db:
        db.add(
            DocumentFigure(
                document_id=document_id,
                figure_index=1,
                object_key="documents/figures/missing.png",
                mime="image/png",
                source="embedded",
                caption="stale caption",
            )
        )
        await db.commit()

    image = await client.get(f"/api/v1/documents/{document_id}/figures/1/image")
    assert image.status_code == 404, image.text
    assert "missing from the object store" in image.json()["detail"]

    recaption = await client.post(f"/api/v1/documents/{document_id}/figures/1/recaption")
    assert recaption.status_code == 200, recaption.text
    body = recaption.json()
    assert body["review_status"] == "needs_review"
    assert "未留存" in body["review_reason"]
