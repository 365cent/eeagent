"""Document-sourced signals (S1-3, 2026-10-29 会议):

- POST /signals with document_id creates the signal with a server-built
  SUMMARY body (never the whole canonical Markdown), an eea:// URL and no
  automatic theme (the W4.1 demo-theme misattribution must not recur);
- SignalDetail carries linked_demand_points for the 来源栏「关联需求」;
- the manual PUT /theme stays the audited path in and out.
"""

import pytest

from tests.support import (
    assign_signal_theme,
    create_confirmed_demand,
    create_theme,
    set_signal_tags,
)

pytestmark = pytest.mark.anyio


async def _upload_document(client, monkeypatch, canonical_md: str) -> dict:
    """Store a raw document with a canned canonical Markdown (no vision calls)."""
    from app.services import doc_ingest

    async def fake_ingest(data, filename, mime, **kwargs):
        return doc_ingest.IngestResult(
            canonical_md=canonical_md,
            markitdown_version="0.1.9",
            figures=[],
            vision_model=None,
        )

    monkeypatch.setattr("app.api.v1.documents.ingest_document", fake_ingest)
    r = await client.post(
        "/api/v1/documents/raw",
        files={"file": ("QCC-Figma-Compose-工具链.pptx", b"deck-bytes", "application/octet-stream")},
    )
    assert r.status_code == 201, r.text
    return r.json()


_DECK_MD = (
    "<!-- Slide number: 1 -->\n\n"
    "# Figma→Compose 工具链\n\n"
    "设计到代码的转换流程\n\n"
    "![Picture 1](data:image/png;base64,AAA)\n\n"
    "### Notes:\n"
    "本次分享覆盖 Figma 设计稿到 Compose 代码的映射规则。\n\n"
    "<!-- Slide number: 2 -->\n\n"
    "# 组件映射规则\n\n"
    "### Notes:\n"
    "布局属性按 token 表映射，动效走 transition 表。\n"
)


async def test_document_signal_uses_summary_body_and_skips_auto_theme(client, monkeypatch):
    doc = await _upload_document(client, monkeypatch, _DECK_MD)

    # the seed demo theme matches jieba tokens from EEA 演示词料 — the exact
    # tags a full-deck body used to produce (W4.1). A summary body plus the
    # no-auto-aggregate rule must leave tech_theme_id null.
    r = await client.post(
        "/api/v1/signals",
        json={"document_id": doc["id"], "channel_code": "web"},
    )
    assert r.status_code == 201, r.text
    sig = r.json()
    assert sig["tech_theme_id"] is None
    assert sig["document_id"] == doc["id"]
    assert sig["url"] == f"eea://document/{doc['id']}"
    # S1-3 正文策略：标题默认取文件名，body 是摘要而非 canonical 全文
    assert sig["title"] == "QCC-Figma-Compose-工具链"
    assert "Figma→Compose 工具链" in sig["excerpt"]

    body = await client.get(f"/api/v1/signals/{sig['id']}/body")
    assert body.status_code == 200
    text = body.text
    assert "来源文档：QCC-Figma-Compose-工具链.pptx" in text
    assert "Figma→Compose 工具链" in text  # slide title in the summary
    assert "讲稿摘录" in text  # speaker notes condensed
    assert "布局属性按 token 表映射，动效走 transition 表。" in text
    assert "<!-- Slide number" not in text  # no raw canonical artifacts


async def test_document_signal_with_seed_overlapping_body_stays_unthemed(client, monkeypatch):
    """Even a deck whose text overlaps the EEA seed tags stays unthemed until
    a human assigns one — the regression the meeting called out."""
    doc = await _upload_document(
        client,
        monkeypatch,
        "# 低压系统智能化\n\n主动配电与故障隔离是 EEA 48V 的核心议题，"
        "智能配电、区域控制、eFuse 反复出现。\n",
    )
    r = await client.post(
        "/api/v1/signals", json={"document_id": doc["id"], "channel_code": "web"}
    )
    assert r.status_code == 201
    assert r.json()["tech_theme_id"] is None


async def test_document_signal_auto_aggregate_refused_manual_theme_allowed(client, monkeypatch):
    doc = await _upload_document(client, monkeypatch, _DECK_MD)
    sig = (
        await client.post(
            "/api/v1/signals", json={"document_id": doc["id"], "channel_code": "web"}
        )
    ).json()

    r = await client.post(f"/api/v1/signals/{sig['id']}/auto-aggregate")
    assert r.status_code == 409
    assert "人工指定主题" in r.json()["detail"]

    theme = await create_theme(client, working_name="Figma 工具链专题")
    assigned = await assign_signal_theme(client, sig["id"], theme["id"])
    assert assigned["tech_theme_id"] == theme["id"]
    assert assigned["theme"]["working_name"] == "Figma 工具链专题"


async def test_document_signal_explicit_fields_win_over_defaults(client, monkeypatch):
    doc = await _upload_document(client, monkeypatch, _DECK_MD)
    r = await client.post(
        "/api/v1/signals",
        json={
            "document_id": doc["id"],
            "channel_code": "web",
            "title": "自定义标题",
            "url": "https://example.com/override",
            "body_text": "自定义正文",
            "evidence_status_code": "pending_review",
        },
    )
    assert r.status_code == 201, r.text
    sig = r.json()
    assert sig["title"] == "自定义标题"
    assert sig["url"] == "https://example.com/override"
    assert sig["evidence_status_code"] == "pending_review"
    assert sig["document_id"] == doc["id"]


async def test_document_signal_unknown_document_404(client):
    r = await client.post(
        "/api/v1/signals",
        json={"document_id": "00000000-0000-0000-0000-000000000000", "channel_code": "web"},
    )
    assert r.status_code == 404
    assert "document not found" in r.json()["detail"]


async def test_signal_without_title_or_url_or_document_is_422(client):
    r = await client.post("/api/v1/signals", json={"channel_code": "web"})
    assert r.status_code == 422


async def test_signal_detail_exposes_linked_demand_points(client):
    """来源栏「关联需求」：the signal's theme feeds demand points — the detail
    lists them; an unthemed signal returns [] (未关联, never a demo placeholder)."""
    theme = await create_theme(client, working_name="低压系统智能化")
    demand = await create_confirmed_demand(client, theme_id=theme["id"])
    r = await client.post(
        "/api/v1/signals",
        json={
            "title": "48V 信号",
            "url": "https://example.com/linked",
            "channel_code": "web",
        },
    )
    assert r.status_code == 201
    sig = r.json()
    assert sig["linked_demand_points"] == []

    await set_signal_tags(client, sig["id"], ["智能配电"])
    await assign_signal_theme(client, sig["id"], theme["id"])
    detail = (await client.get(f"/api/v1/signals/{sig['id']}")).json()
    assert [d["id"] for d in detail["linked_demand_points"]] == [demand["id"]]
    assert detail["linked_demand_points"][0]["name"] == demand["name"]


async def test_doc_summary_builder_shapes():
    from app.services.doc_summary import build_document_body_summary

    out = build_document_body_summary("deck.pptx", _DECK_MD)
    assert out.startswith("来源文档：deck.pptx")
    assert "- Figma→Compose 工具链" in out
    assert "- 组件映射规则" in out
    assert "讲稿摘录" in out
    assert "<!--" not in out

    # degenerate inputs never produce an empty body
    assert "来源文档" in build_document_body_summary("empty.docx", "")
    assert build_document_body_summary("", "").strip()
