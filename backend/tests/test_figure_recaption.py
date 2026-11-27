# -*- coding: utf-8 -*-
"""BE-12 per-figure recaption: one retry, stable text, no fake success."""

import pytest

from app.domains.evidence import figure_recaption
from app.domains.evidence.figure_recaption import (
    figure_review_state,
    replace_figure_caption,
)

pytestmark = pytest.mark.anyio


def test_replace_figure_caption_only_touches_target_marker():
    markdown = "# A\n\n> 图 1：旧一\n\n> 图 2：旧二\n"
    updated = replace_figure_caption(markdown, 2, "新二")
    assert updated.count("新二") == 1
    assert "> 图 1：旧一" in updated
    assert "旧二" not in updated


def test_figure_review_state_flags_empty_and_unlocated():
    assert figure_review_state(None, ["A"]) == ("needs_review", "视觉模型未返回描述")
    assert figure_review_state("描述", None) == ("needs_review", "未在正文中定位图块")
    assert figure_review_state("描述", ["A"]) == ("ready", None)


async def _upload_with_figure(client, monkeypatch, caption: str = ""):
    from app.domains.evidence import document_pipeline
    from app.domains.evidence.doc_ingest import Figure, IngestResult

    async def fake_ingest(data, filename, mime, **kwargs):
        return IngestResult(
            canonical_md="# A\n\n> 图 1：待重试\n",
            markitdown_version="0.1.9",
            figures=[
                Figure(
                    index=1,
                    source="x.png",
                    mime="image/png",
                    data=b"png-bytes",
                    caption=caption,
                    section_path=["A"],
                    position=7,
                )
            ],
        )

    monkeypatch.setattr(document_pipeline, "ingest_document", fake_ingest)
    response = await client.post(
        "/api/v1/documents/raw",
        files={"file": ("retry.docx", b"docx-bytes", "application/octet-stream")},
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


async def test_recaption_fills_missing_caption_and_marks_ready(client, monkeypatch):
    doc_id = await _upload_with_figure(client, monkeypatch)

    async def fake_model():
        return "qwen-vision"

    async def fake_caption(figure, *, model, retries=0):
        assert model == "qwen-vision"
        return "重试识别成功"

    monkeypatch.setattr(figure_recaption, "resolve_vision_model", fake_model)
    monkeypatch.setattr(figure_recaption, "caption_figure", fake_caption)

    response = await client.post(f"/api/v1/documents/{doc_id}/figures/1/recaption")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["caption"] == "重试识别成功"
    assert body["review_status"] == "ready"
    assert body["review_reason"] is None
    assert body["image_url"]

    markdown = await client.get(f"/api/v1/documents/{doc_id}/canonical.md")
    assert "> 图 1：重试识别成功" in markdown.text


async def test_recaption_failure_keeps_image_and_needs_review(client, monkeypatch):
    doc_id = await _upload_with_figure(client, monkeypatch)

    async def fake_model():
        return "qwen-vision"

    async def empty_caption(figure, *, model, retries=0):
        return ""

    monkeypatch.setattr(figure_recaption, "resolve_vision_model", fake_model)
    monkeypatch.setattr(figure_recaption, "caption_figure", empty_caption)

    response = await client.post(f"/api/v1/documents/{doc_id}/figures/1/recaption")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["review_status"] == "needs_review"
    assert body["review_reason"] == "视觉模型未返回描述"
    assert body["image_url"]


async def test_recaption_model_unavailable_reports_reason(client, monkeypatch):
    doc_id = await _upload_with_figure(client, monkeypatch)

    async def no_model():
        raise RuntimeError("gateway down")

    monkeypatch.setattr(figure_recaption, "resolve_vision_model", no_model)

    response = await client.post(f"/api/v1/documents/{doc_id}/figures/1/recaption")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["review_status"] == "needs_review"
    assert body["review_reason"] == "视觉模型不可用，未能重试识别"


async def test_recaption_unknown_figure_is_404(client, monkeypatch):
    doc_id = await _upload_with_figure(client, monkeypatch, caption="已有描述")
    response = await client.post(f"/api/v1/documents/{doc_id}/figures/9/recaption")
    assert response.status_code == 404

async def test_recaption_without_marker_keeps_needs_review(client, monkeypatch):
    from app.domains.evidence import document_pipeline
    from app.domains.evidence.doc_ingest import Figure, IngestResult

    async def fake_ingest(data, filename, mime, **kwargs):
        return IngestResult(
            canonical_md="# A\n\n正文没有图注标记\n",
            markitdown_version="0.1.9",
            figures=[
                Figure(
                    index=1,
                    source="x.png",
                    mime="image/png",
                    data=b"png-bytes",
                    caption="",
                    section_path=["A"],
                    position=7,
                )
            ],
        )

    monkeypatch.setattr(document_pipeline, "ingest_document", fake_ingest)
    response = await client.post(
        "/api/v1/documents/raw",
        files={"file": ("markerless.docx", b"markerless-bytes", "application/octet-stream")},
    )
    assert response.status_code == 201, response.text
    doc_id = response.json()["id"]

    async def fake_model():
        return "qwen-vision"

    async def fake_caption(figure, *, model, retries=0):
        return "识别成功但正文无标记"

    monkeypatch.setattr(figure_recaption, "resolve_vision_model", fake_model)
    monkeypatch.setattr(figure_recaption, "caption_figure", fake_caption)

    body = (await client.post(f"/api/v1/documents/{doc_id}/figures/1/recaption")).json()
    assert body["review_status"] == "needs_review"
    assert body["review_reason"] == "未在正文中定位图块"
    markdown = await client.get(f"/api/v1/documents/{doc_id}/canonical.md")
    assert "正文没有图注标记" in markdown.text

async def test_recaption_requires_allowed_role_and_audits(client, monkeypatch):
    from app.core.identity import OperatorIdentity, get_operator_identity
    from app.main import app

    doc_id = await _upload_with_figure(client, monkeypatch)

    async def fake_model():
        return 'qwen-vision'

    async def fake_caption(figure, *, model, retries=0):
        return '重试后描述'

    monkeypatch.setattr(figure_recaption, 'resolve_vision_model', fake_model)
    monkeypatch.setattr(figure_recaption, 'caption_figure', fake_caption)

    async def anonymous_actor():
        return OperatorIdentity('unknown-role', 'guest')

    app.dependency_overrides[get_operator_identity] = anonymous_actor
    try:
        denied = await client.post(f'/api/v1/documents/{doc_id}/figures/1/recaption')
        assert denied.status_code == 403, denied.text
        assert '当前角色' in denied.json()['detail']
    finally:
        app.dependency_overrides.pop(get_operator_identity, None)

    allowed = await client.post(f'/api/v1/documents/{doc_id}/figures/1/recaption')
    assert allowed.status_code == 200, allowed.text

    from sqlalchemy import select
    from app.db.base import SessionLocal
    from app.models.models import CorrectionAudit

    async with SessionLocal() as db:
        rows = (
            await db.execute(
                select(CorrectionAudit).where(
                    CorrectionAudit.entity_type == 'document_figure',
                    CorrectionAudit.entity_id == __import__('uuid').UUID(doc_id),
                )
            )
        ).scalars().all()
    assert rows, 'retry must leave an audit row'
    audit = rows[-1]
    assert audit.operator_role == 'platform_admin'
    assert audit.field_name.startswith('caption:')
    assert audit.new_value == '重试后描述'
    assert audit.reason == '单图重新识别'
