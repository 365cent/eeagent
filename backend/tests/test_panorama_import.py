"""Panorama workbook import and client-awaiting capture jobs."""
from __future__ import annotations

from io import BytesIO

import pytest
from openpyxl import Workbook

from app.services.panorama_workbook import parse_panorama_workbook
from app.services.refcodes import normalize


def _minimal_workbook_bytes() -> bytes:
    wb = Workbook()
    ws_sources = wb.active
    ws_sources.title = "数据来源"
    ws_sources["B2"] = "产业链价值环节"
    ws_sources["C2"] = "信息来源"
    ws_sources["B4"] = "创造端（供应链）"
    ws_sources["C4"] = "产品技术发布会"
    ws_sources["D4"] = "https://example.com/panorama-a"
    ws_sources["B7"] = "创造端（供应链）"
    ws_sources["C7"] = "公开材料（招股书、官网等）"
    ws_sources["D7"] = "https://example.com/panorama-b"

    ws_panorama = wb.create_sheet("EEA 技术全景图")
    ws_panorama["B2"] = "产业价值链环节"
    ws_panorama["D2"] = "新技术需求点"
    ws_panorama["E2"] = "新技术映射车辆功能"
    ws_panorama["F3"] = "软件"
    ws_panorama["B4"] = "创造端（供应链）"
    ws_panorama["D4"] = "测试需求点"
    ws_panorama["E4"] = "测试车辆功能"
    ws_panorama["F4"] = "测试软件落脚点"
    ws_panorama["K4"] = "设计阶段工程化要求"
    ws_panorama["P4"] = "建议"
    ws_panorama["Q4"] = "L2"
    ws_panorama["R4"] = "4"
    ws_panorama["S4"] = "测试推荐原因"
    ws_panorama["N4"] = "L2/L4 差异说明"

    ws_diff = wb.create_sheet("数据来源-功能要求差异")
    ws_diff["A1"] = "官方/权威来源"
    ws_diff["E1"] = "链接"
    ws_diff["A2"] = "SAE J3016"
    ws_diff["E2"] = "https://example.com/l2-l4-standard"

    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


def test_rule_end_stage_alias():
    assert normalize("value_chain_stage", "规则端（行业标准/规定）") == "regulation_standard"


def test_workbook_parser_dedupes_urls():
    data = _minimal_workbook_bytes()
    model = parse_panorama_workbook(data)
    assert len(model.sources) == 3
    urls = {row.url_normalized for row in model.sources}
    assert "https://example.com/panorama-a" in urls
    assert "https://example.com/panorama-b" in urls
    pdf = next((s for s in model.sources if s.url.endswith(".pdf")), None)
    assert pdf is None
    assert model.chain_rows
    assert model.chain_rows[0].demand_name == "测试需求点"


@pytest.mark.anyio
async def test_import_panorama_rejects_server_side_db_import(client):
    data = _minimal_workbook_bytes()
    files = {
        "file": (
            "fixture.xlsx",
            data,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    }
    resp = await client.post("/api/v1/imports/panorama", files=files)
    assert resp.status_code == 422
    assert "批量粘贴" in resp.text


@pytest.mark.anyio
async def test_capture_url_list_creates_awaiting_jobs(client):
    body = {
        "text": "https://example.com/a\nhttps://example.com/b\n",
    }
    resp = await client.post("/api/v1/imports/capture-urls", json=body)
    assert resp.status_code == 201, resp.text
    batch = resp.json()
    assert batch["capture_jobs_total"] >= 2
    jobs = await client.get("/api/v1/capture/jobs?status=awaiting_client&limit=10")
    assert jobs.status_code == 200
    assert len(jobs.json()) >= 2


@pytest.mark.anyio
async def test_client_submit_queues_worker_without_server_fetch(client):
    unique = __import__("uuid").uuid4().hex
    source_url = f"https://example.com/panorama-client-submit-{unique}"
    queued = await client.post(
        "/api/v1/imports/capture-urls",
        json={"text": f"{source_url}\n"},
    )
    assert queued.status_code == 201, queued.text
    jobs = await client.get("/api/v1/capture/jobs?status=awaiting_client&limit=50")
    assert jobs.status_code == 200
    job = next(j for j in jobs.json() if j.get("source_url") == source_url)
    claim = await client.post(f"/api/v1/capture/jobs/{job['id']}/claim", data={"worker_id": "test-client"})
    assert claim.status_code == 200
    html = b"<html><head><title>Panorama fixture</title></head><body>evidence</body></html>"
    submit = await client.post(
        f"/api/v1/capture/jobs/{job['id']}/client-submit",
        data={"worker_id": "test-client"},
        files={"file": ("archive.html", html, "text/html")},
    )
    assert submit.status_code == 200, submit.text
    assert submit.json()["status"] == "queued"

    import asyncio

    from app.services.capture_jobs import run_claimed_job, make_worker_id

    await asyncio.sleep(0.05)
    worker = make_worker_id()
    from sqlalchemy import select

    from app.db.base import SessionLocal
    from app.models.models import CaptureJob

    async with SessionLocal() as db:
        row = (
            await db.execute(select(CaptureJob).where(CaptureJob.id == job["id"]))
        ).scalar_one()
        row.status = "running"
        row.worker_id = worker
        row.stage = "processing"
        await db.commit()

    await run_claimed_job(job["id"], worker)

    refreshed = await client.get(f"/api/v1/capture/jobs/{job['id']}")
    assert refreshed.status_code == 200
    body = refreshed.json()
    assert body["status"] == "succeeded"
    assert body["signal_id"] is not None

    overview = await client.get("/api/v1/overview")
    assert overview.status_code == 200


@pytest.mark.anyio
async def test_client_release_returns_job_to_awaiting_client(client):
    unique = __import__("uuid").uuid4().hex
    source_url = f"https://example.com/panorama-release-{unique}"
    resp = await client.post("/api/v1/imports/capture-urls", json={"text": f"{source_url}\n"})
    assert resp.status_code == 201
    jobs = await client.get("/api/v1/capture/jobs?status=awaiting_client&limit=50")
    job = next(j for j in jobs.json() if j.get("source_url") == source_url)
    claim = await client.post(f"/api/v1/capture/jobs/{job['id']}/claim", data={"worker_id": "test-client"})
    assert claim.status_code == 200
    released = await client.post(
        f"/api/v1/capture/jobs/{job['id']}/client-release",
        data={"worker_id": "test-client", "reason": "abort"},
    )
    assert released.status_code == 200, released.text
    assert released.json()["status"] == "awaiting_client"


@pytest.mark.anyio
async def test_client_fail_marks_import_job_failed(client):
    unique = __import__("uuid").uuid4().hex
    source_url = f"https://example.com/panorama-fail-{unique}"
    resp = await client.post("/api/v1/imports/capture-urls", json={"text": f"{source_url}\n"})
    batch_id = resp.json()["id"]
    jobs = await client.get("/api/v1/capture/jobs?status=awaiting_client&limit=50")
    job = next(j for j in jobs.json() if j.get("source_url") == source_url)
    await client.post(f"/api/v1/capture/jobs/{job['id']}/claim", data={"worker_id": "test-client"})
    failed = await client.post(
        f"/api/v1/capture/jobs/{job['id']}/client-fail",
        data={"worker_id": "test-client", "error": "captcha"},
    )
    assert failed.status_code == 200
    assert failed.json()["status"] == "failed"
    batch = await client.get(f"/api/v1/imports/panorama/{batch_id}")
    assert batch.json()["signals_failed"] >= 1


@pytest.mark.anyio
async def test_reclaim_stale_client_captures(client):
    from datetime import datetime, timedelta, timezone

    from app.db.base import SessionLocal
    from app.models.models import CaptureJob
    from app.services.capture_jobs import reclaim_stale_client_captures
    from sqlalchemy import select

    unique = __import__("uuid").uuid4().hex
    source_url = f"https://example.com/panorama-stale-{unique}"
    await client.post("/api/v1/imports/capture-urls", json={"text": f"{source_url}\n"})
    jobs = await client.get("/api/v1/capture/jobs?status=awaiting_client&limit=50")
    job = next(j for j in jobs.json() if j.get("source_url") == source_url)
    await client.post(f"/api/v1/capture/jobs/{job['id']}/claim", data={"worker_id": "test-client"})
    async with SessionLocal() as db:
        row = (await db.execute(select(CaptureJob).where(CaptureJob.id == job["id"]))).scalar_one()
        row.lease_until = datetime.now(timezone.utc) - timedelta(minutes=1)
        await db.commit()
    n = await reclaim_stale_client_captures()
    assert n >= 1
    refreshed = await client.get(f"/api/v1/capture/jobs/{job['id']}")
    assert refreshed.json()["status"] == "awaiting_client"
