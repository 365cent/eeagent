"""Unified capture entry (POST /api/v1/capture): file OR url, one shape out.

No network access anywhere: the server-fetch path stubs
app.services.url_fetch.fetch_url (monkeypatched at the import site in
app.api.v1.capture), the document path stubs ingest_document like
tests/test_documents_raw.py does.
"""

import pytest

from app.services.url_fetch import FetchedPage, FetchError

pytestmark = pytest.mark.anyio

# Reuse the SingleFile-style fixture page from the capture suite (og metadata
# + weixin layout + inlined image noise) — same page, now posted to /capture.
from tests.test_capture import ARCHIVE_HTML  # noqa: E402

PAGE_URL = "https://mp.weixin.qq.com/s/efuse-48v-era"
PDF_URL = "https://example.com/reports/ee-whitepaper.pdf"


def _html_file(name="page.html"):
    return {"file": (name, ARCHIVE_HTML.encode("utf-8"), "text/html")}


async def _count_signals(client) -> int:
    return len((await client.get("/api/v1/signals")).json())


async def test_html_file_upload_creates_snapshot_signal(client):
    """Drop an HTML file (no url) → snapshot signal, eea:// source url."""
    before = await _count_signals(client)
    response = await client.post("/api/v1/capture", files=_html_file())
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["source"] == "html-snapshot"
    assert body["via"] == "upload"
    assert body["document"] is None
    sig = body["signal"]
    assert sig["title"] == "48V低压供电网络研究"
    assert sig["channel_code"] == "web"  # eea:// origin is not weixin mp
    assert sig["snapshot_html_object_key"]
    assert await _count_signals(client) == before + 1


async def test_url_plus_html_file_is_the_extension_case(client):
    """url + html file keeps the canonical source url and infers wechat_mp."""
    response = await client.post(
        "/api/v1/capture", data={"url": PAGE_URL}, files=_html_file()
    )
    assert response.status_code == 201, response.text
    sig = response.json()["signal"]
    assert sig["url"] == PAGE_URL
    assert sig["channel_code"] == "wechat_mp"


async def test_url_only_server_fetches_html(client, monkeypatch):
    """Bare url: server fetches the page and ingests it (static-page path)."""
    async def fake_fetch(url):
        return FetchedPage(
            data=ARCHIVE_HTML.encode("utf-8"),
            content_type="text/html; charset=utf-8",
            final_url=PAGE_URL,
            filename=None,
        )

    monkeypatch.setattr("app.api.v1.capture.fetch_url", fake_fetch)
    before = await _count_signals(client)
    response = await client.post("/api/v1/capture", data={"url": PAGE_URL})
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["source"] == "html-snapshot"
    assert body["via"] == "server-fetch"
    assert body["signal"]["url"] == PAGE_URL
    assert body["signal"]["channel_code"] == "wechat_mp"
    assert await _count_signals(client) == before + 1


async def test_document_file_upload_creates_derived_signal(client, monkeypatch):
    """Drop a pptx → document row + ingest + derived signal with document_id."""

    async def fake_ingest(data, filename, mime, **kwargs):
        from app.services.doc_ingest import IngestResult

        return IngestResult(canonical_md="# 白皮书\n\n48V 智能配电", markitdown_version="0.1.9")

    monkeypatch.setattr("app.api.v1.documents.ingest_document", fake_ingest)
    before = await _count_signals(client)
    response = await client.post(
        "/api/v1/capture",
        files={"file": ("deck.pptx", b"pptx-bytes", "application/vnd.openxmlformats-officedocument.presentationml.presentation")},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["source"] == "document"
    assert body["via"] == "upload"
    assert body["document"]["ingest_status"] == "parsed"
    sig = body["signal"]
    assert sig["document_id"] == body["document"]["id"]
    assert sig["title"] == "deck"  # filename stem (S1-3 document defaults)
    assert sig["url"].startswith("eea://document/")
    assert await _count_signals(client) == before + 1


async def test_url_only_fetching_a_document_goes_document_path(client, monkeypatch):
    """Bare url that returns a PDF: fetched bytes land as a document signal."""

    async def fake_ingest(data, filename, mime, **kwargs):
        from app.services.doc_ingest import IngestResult

        assert data == b"%PDF-fake"
        return IngestResult(canonical_md="# 报告\n", markitdown_version="0.1.9")

    monkeypatch.setattr("app.api.v1.documents.ingest_document", fake_ingest)

    async def fake_fetch(url):
        return FetchedPage(
            data=b"%PDF-fake",
            content_type="application/pdf",
            final_url=PDF_URL,
            filename="ee-whitepaper.pdf",
        )

    monkeypatch.setattr("app.api.v1.capture.fetch_url", fake_fetch)
    response = await client.post("/api/v1/capture", data={"url": PDF_URL})
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["source"] == "document"
    assert body["via"] == "server-fetch"
    assert body["document"]["filename"] == "ee-whitepaper.pdf"
    assert body["signal"]["url"] == PDF_URL


async def test_url_only_fetch_failure_is_a_friendly_422(client, monkeypatch):
    """JS-shell page / dead link: clear 422, nothing ingested."""

    async def fake_fetch(url):
        raise FetchError("目标页面返回空内容（可能是 JS 渲染页），请用浏览器扩展采集")

    monkeypatch.setattr("app.api.v1.capture.fetch_url", fake_fetch)
    before = await _count_signals(client)
    response = await client.post("/api/v1/capture", data={"url": "https://spa.example.com/"})
    assert response.status_code == 422
    assert "浏览器扩展" in response.json()["detail"]
    assert await _count_signals(client) == before


async def test_neither_url_nor_file_is_422(client):
    before = await _count_signals(client)
    response = await client.post("/api/v1/capture")
    assert response.status_code == 422
    assert "file 或 url" in response.json()["detail"]
    assert await _count_signals(client) == before


async def test_empty_file_without_url_is_422(client):
    response = await client.post(
        "/api/v1/capture", files={"file": ("empty.html", b"", "text/html")}
    )
    assert response.status_code == 422
