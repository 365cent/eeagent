"""BE-15 chain report persistence."""
import io

import pytest

from tests.support import build_chain

pytestmark = pytest.mark.anyio


async def test_chain_report_markdown_round_trip(client):
    chain = await build_chain(client)
    created = await client.post(
        "/api/v1/reports",
        json={"landing_point_id": chain["landing_point"]["id"], "format": "md"},
    )
    assert created.status_code == 201, created.text
    report = created.json()
    assert report["status"] == "succeeded", report
    assert report["object_key"]

    listed = (await client.get("/api/v1/reports")).json()
    assert any(item["id"] == report["id"] for item in listed)

    detail = (await client.get(f"/api/v1/reports/{report['id']}")).json()
    assert detail["id"] == report["id"]

    body = await client.get(f"/api/v1/reports/{report['id']}/download", params={"format": "md"})
    assert body.status_code == 200
    assert "链路" in body.text or "报告" in body.text


async def test_chain_report_lists_every_source_with_a_link(client):
    """REQ-RULE-03: each cited source stays traceable from the report itself."""
    chain = await build_chain(client)
    created = await client.post(
        "/api/v1/reports",
        json={"landing_point_id": chain["landing_point"]["id"], "format": "md"},
    )
    assert created.status_code == 201, created.text
    body = await client.get(f"/api/v1/reports/{created.json()['id']}/download", params={"format": "md"})
    text = body.text
    assert "## 原始证据" in text
    evidence_ids = set(chain["demand"]["cross_validation"]["evidence_signal_ids"])
    assert all(str(signal_id) in text for signal_id in evidence_ids)
    assert "- 链接：https://" in text and "- 发布主体：" in text


async def test_chain_report_unknown_target_is_404_not_500(client):
    resp = await client.post(
        "/api/v1/reports",
        json={"landing_point_id": "00000000-0000-0000-0000-000000000000", "format": "md"},
    )
    assert resp.status_code == 404, resp.text


async def test_chain_report_exposes_created_at(client):
    chain = await build_chain(client)
    created = await client.post(
        "/api/v1/reports",
        json={"landing_point_id": chain["landing_point"]["id"], "format": "md"},
    )
    assert created.status_code == 201, created.text
    detail = (await client.get(f"/api/v1/reports/{created.json()['id']}")).json()
    assert detail["created_at"]
    assert detail["finished_at"]
    assert detail["data_snapshot_json"]["format"] == "md"


async def test_chain_report_pdf_round_trip(client):
    chain = await build_chain(client)
    created = await client.post(
        "/api/v1/reports",
        json={"landing_point_id": chain["landing_point"]["id"], "format": "pdf"},
    )
    assert created.status_code == 201, created.text
    report = created.json()
    assert report["status"] == "succeeded", report
    assert report["format"] == "pdf"

    pdf = await client.get(f"/api/v1/reports/{report['id']}/download", params={"format": "pdf"})
    assert pdf.status_code == 200
    assert pdf.headers.get("content-type", "").startswith("application/pdf")
    assert pdf.content[:4] == b"%PDF"

    import pdfplumber

    with pdfplumber.open(io.BytesIO(pdf.content)) as document:
        text = "\n".join(page.extract_text() or "" for page in document.pages)
    assert "链路报告" in text
