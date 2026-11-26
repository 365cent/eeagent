"""Capture queue concurrency: lease recovery, duplicate POST races, stale workers."""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import func, select

from app.db.base import SessionLocal
from app.models.models import CaptureJob, Signal
from app.services.capture_jobs import (
    _mark_failed,
    _mark_succeeded,
    claim_next_job,
    heartbeat,
    make_worker_id,
    run_claimed_job,
)
from tests.test_capture import ARCHIVE_HTML

pytestmark = pytest.mark.anyio

PAGE_URL = "https://mp.weixin.qq.com/s/efuse-job-concurrency"


async def _create_html_job(client, submission_id: uuid.UUID):
    return await client.post(
        "/api/v1/capture/jobs",
        data={"submission_id": str(submission_id), "url": PAGE_URL},
        files={"file": ("page.html", ARCHIVE_HTML.encode("utf-8"), "text/html")},
    )


async def _signal_count() -> int:
    async with SessionLocal() as db:
        return (await db.execute(select(func.count()).select_from(Signal))).scalar_one()


async def _job_state(job_id: uuid.UUID) -> dict:
    async with SessionLocal() as db:
        row = await db.get(CaptureJob, job_id)
        assert row is not None
        return {
            "status": row.status,
            "stage": row.stage,
            "attempt_count": row.attempt_count,
            "worker_id": row.worker_id,
            "signal_id": row.signal_id,
            "error": row.error,
            "finished_at": row.finished_at,
        }


async def _expire_lease(job_id: uuid.UUID, *, attempts: int | None = None) -> None:
    """Simulate a worker crash: the process stops but its lease goes stale."""
    async with SessionLocal() as db:
        row = await db.get(CaptureJob, job_id)
        assert row is not None
        row.lease_until = datetime.now(timezone.utc) - timedelta(seconds=30)
        if attempts is not None:
            row.attempt_count = attempts
        await db.commit()


async def test_expired_worker_lease_resumes_without_duplicate_signal(client):
    submission_id = uuid.uuid4()
    created = await _create_html_job(client, submission_id)
    assert created.status_code == 202, created.text
    job_id = uuid.UUID(created.json()["id"])
    before = await _signal_count()

    worker_a = make_worker_id()
    assert await claim_next_job(worker_a) == job_id
    await _expire_lease(job_id)

    worker_b = make_worker_id()
    assert await claim_next_job(worker_b) == job_id
    state = await _job_state(job_id)
    assert state["status"] == "running"
    assert state["worker_id"] == worker_b
    assert state["attempt_count"] == 2

    await run_claimed_job(job_id, worker_b)
    state = await _job_state(job_id)
    assert state["status"] == "succeeded"
    assert state["worker_id"] is None
    assert state["signal_id"] is not None
    assert await _signal_count() == before + 1


async def test_concurrent_duplicate_submissions_share_one_job_and_signal(client):
    submission_id = uuid.uuid4()

    async def submit():
        return await client.post(
            "/api/v1/capture/jobs",
            data={"submission_id": str(submission_id), "url": PAGE_URL},
            files={"file": ("page.html", ARCHIVE_HTML.encode("utf-8"), "text/html")},
        )

    first, second = await asyncio.gather(submit(), submit())
    assert first.status_code == 202, first.text
    assert second.status_code == 202, second.text
    assert first.json()["id"] == second.json()["id"]
    job_id = uuid.UUID(first.json()["id"])

    async with SessionLocal() as db:
        jobs = (
            await db.execute(
                select(func.count())
                .select_from(CaptureJob)
                .where(CaptureJob.submission_id == submission_id)
            )
        ).scalar_one()
    assert jobs == 1

    worker = make_worker_id()
    assert await claim_next_job(worker) == job_id
    await run_claimed_job(job_id, worker)

    assert (await _job_state(job_id))["status"] == "succeeded"
    async with SessionLocal() as db:
        signals = (
            await db.execute(
                select(func.count())
                .select_from(Signal)
                .where(Signal.capture_submission_id == submission_id)
            )
        ).scalar_one()
    assert signals == 1


async def test_stale_worker_cannot_finish_or_heartbeat_a_reclaimed_job(client):
    submission_id = uuid.uuid4()
    created = await _create_html_job(client, submission_id)
    assert created.status_code == 202, created.text
    job_id = uuid.UUID(created.json()["id"])

    worker_a = make_worker_id()
    assert await claim_next_job(worker_a) == job_id
    await _expire_lease(job_id)
    worker_b = make_worker_id()
    assert await claim_next_job(worker_b) == job_id

    assert await heartbeat(job_id, worker_a) is False
    assert await heartbeat(job_id, worker_b) is True

    await _mark_succeeded(job_id, worker_a, uuid.uuid4())
    await _mark_failed(job_id, worker_a, RuntimeError("stale worker"))
    state = await _job_state(job_id)
    assert state["status"] == "running"
    assert state["worker_id"] == worker_b
    assert state["signal_id"] is None

    await run_claimed_job(job_id, worker_b)
    assert (await _job_state(job_id))["status"] == "succeeded"


async def test_lease_expiry_past_attempt_limit_fails_the_job(client):
    from app.core.config import get_settings

    max_attempts = get_settings().capture_worker_max_attempts
    submission_id = uuid.uuid4()
    created = await _create_html_job(client, submission_id)
    assert created.status_code == 202, created.text
    job_id = uuid.UUID(created.json()["id"])

    assert await claim_next_job(make_worker_id()) == job_id
    await _expire_lease(job_id, attempts=max_attempts)

    assert await claim_next_job(make_worker_id()) is None
    state = await _job_state(job_id)
    assert state["status"] == "failed"
    assert state["stage"] == "failed"
    assert "retry limit" in (state["error"] or "")
    assert state["finished_at"] is not None