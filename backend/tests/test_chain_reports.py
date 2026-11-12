"""BE-15 chain report persistence."""

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
