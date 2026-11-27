"""Theme clustering runs in the background: queue on signal, serve the snapshot.

The page used to recompute the report inside the request, so a new signal only
appeared after a reload and 重放聚类 replayed the same graph. These cases pin the
new pipeline: a signal queues a pass, the job script stores the payload, the API
serves it, and the recompute button queues a fresh one.
"""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest
from sqlalchemy import select

from app.db.base import SessionLocal
from app.models.models import ThemeClusterRun
from app.services import cluster_job
from app.services.cluster_runner import QUEUED, READY, enqueue_cluster_run

pytestmark = [pytest.mark.anyio, pytest.mark.db]


async def _runs() -> list[ThemeClusterRun]:
    async with SessionLocal() as db:
        return list(
            (await db.execute(select(ThemeClusterRun).order_by(ThemeClusterRun.requested_at))).scalars()
        )


async def _create_signal(client, url: str, title: str):
    response = await client.post(
        "/api/v1/signals",
        json={
            "title": title,
            "url": url,
            "channel_code": "web",
            "evidence_status_code": "retained",
            "body_text": "车用芯粒互联标准化需求研究报告正文，涉及封装、供电与散热设计。",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def test_new_signal_queues_a_cluster_run(client):
    await _create_signal(client, "https://example.com/cluster-one", "芯粒报告 A")

    runs = await _runs()

    assert len(runs) == 1
    assert runs[0].status == QUEUED
    assert runs[0].trigger == "signal"


async def test_a_second_signal_reuses_the_pending_run(client):
    await _create_signal(client, "https://example.com/cluster-two", "芯粒报告 B")
    await _create_signal(client, "https://example.com/cluster-three", "芯粒报告 C")

    runs = await _runs()

    assert len(runs) == 1, "a burst of signals must not queue one job per signal"

    async with SessionLocal() as db:
        assert await enqueue_cluster_run(db, trigger="signal") is None


async def test_job_computes_and_stores_the_payload():
    async with SessionLocal() as db:
        db.add(ThemeClusterRun(trigger="manual", status=QUEUED))
        await db.commit()

    code = await cluster_job.main()

    assert code == 0
    runs = await _runs()
    assert len(runs) == 1
    assert runs[0].status == READY
    assert runs[0].payload is not None
    assert runs[0].finished_at is not None
    assert "clusters" in runs[0].payload


async def test_report_serves_the_stored_snapshot(client):
    await _create_signal(client, "https://example.com/cluster-snapshot", "芯粒快照报告")
    await cluster_job.main()

    response = await client.get("/api/v1/themes/cluster-report")

    assert response.status_code == 200, response.text
    report = response.json()
    stored = (await _runs())[0]
    assert report["run_id"] == str(stored.id)
    assert report["computed_at"] is not None
    assert report["pending"] is False
    assert len(report["clusters"]) == len(stored.payload["clusters"])


async def test_recompute_button_queues_and_starts_the_job(client, monkeypatch):
    spawn = AsyncMock(return_value=True)
    monkeypatch.setattr("app.api.v1.themes.spawn_cluster_job", spawn)

    response = await client.post("/api/v1/themes/cluster-report/recompute")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["run_id"] is not None
    assert body["status"] in {QUEUED, "running"}
    spawn.assert_awaited()

    status = await client.get("/api/v1/themes/cluster-report/status")
    assert status.json()["run_id"] == body["run_id"]


async def test_status_reports_when_nothing_ran_yet(client):
    response = await client.get("/api/v1/themes/cluster-report/status")

    assert response.status_code == 200
    assert response.json()["status"] == "idle"
    assert response.json()["run_id"] is None
