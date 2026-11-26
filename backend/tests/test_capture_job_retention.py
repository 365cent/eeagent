"""Terminal capture-job retention and payload cleanup (BE-01)."""

import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from sqlalchemy import select

from app.core.config import get_settings
from app.db.base import SessionLocal
from app.models.models import CaptureJob, PanoramaImportBatch, PanoramaImportUrl
from app.services.capture_job_retention import prune_terminal_capture_jobs
from app.services.objectstore import load_bytes, put_object

pytestmark = pytest.mark.anyio

NOW = datetime(2026, 11, 26, 12, 0, tzinfo=timezone.utc)
OLD = NOW - timedelta(days=40)
RECENT = NOW - timedelta(days=5)

_STAGES = {
    "succeeded": "completed",
    "failed": "failed",
    "cancelled": "cancelled",
    "queued": "queued",
    "running": "processing",
}


def _job(*, status="succeeded", age_anchor=OLD, payload_key=None):
    return CaptureJob(
        id=uuid.uuid4(),
        submission_id=uuid.uuid4(),
        fingerprint="a" * 64,
        via="test",
        status=status,
        stage=_STAGES[status],
        payload_object_key=payload_key,
        payload_size=0,
        finished_at=None if status in ("queued", "running") else age_anchor,
        updated_at=age_anchor,
    )


def _age_object(key: str, when: datetime) -> None:
    path = Path(get_settings().object_dir) / key
    stamp = when.timestamp()
    os.utime(path, (stamp, stamp))


def _batch():
    return PanoramaImportBatch(
        id=uuid.uuid4(),
        sha256="b" * 64,
        workbook_object_key="panorama/test.xlsx",
        snapshot_json={},
        status="completed",
    )


async def test_dry_run_counts_expired_terminal_jobs_only():
    key = put_object("capture-jobs/dry-run.bin", b"dry")
    async with SessionLocal() as db:
        db.add_all(
            [
                _job(payload_key=key),
                _job(status="failed"),
                _job(age_anchor=RECENT),
                _job(status="queued"),
            ]
        )
        await db.commit()

    async with SessionLocal() as db:
        result = await prune_terminal_capture_jobs(
            db, retention_days=30, apply=False, now=NOW
        )

    assert (result.scanned, result.pruned) == (2, 2)
    assert (result.payloads_deleted, result.payloads_kept) == (0, 0)
    async with SessionLocal() as db:
        assert len((await db.execute(select(CaptureJob))).scalars().all()) == 4
    assert load_bytes(key) == b"dry"


async def test_apply_deletes_expired_jobs_and_only_unreferenced_payloads():
    unique = put_object("capture-jobs/unique.bin", b"unique")
    shared = put_object("capture-jobs/shared.bin", b"shared")
    _age_object(unique, OLD)
    _age_object(shared, OLD)
    async with SessionLocal() as db:
        old_unique = _job(payload_key=unique)
        old_shared = _job(payload_key=shared)
        old_failed = _job(status="failed")
        recent_shared = _job(status="queued", age_anchor=RECENT, payload_key=shared)
        batch = _batch()
        url = PanoramaImportUrl(
            id=uuid.uuid4(),
            batch_id=batch.id,
            url="https://example.com/a",
            url_normalized="https://example.com/a",
            contexts=[],
            is_pdf=False,
            capture_job_id=old_unique.id,
        )
        db.add_all([old_unique, old_shared, old_failed, recent_shared, batch, url])
        url_id = url.id
        recent_id = recent_shared.id
        await db.commit()

    async with SessionLocal() as db:
        result = await prune_terminal_capture_jobs(
            db, retention_days=30, apply=True, now=NOW
        )
        await db.commit()

    assert (result.scanned, result.pruned) == (3, 3)
    assert (result.payloads_deleted, result.payloads_kept) == (1, 1)
    async with SessionLocal() as db:
        remaining = (await db.execute(select(CaptureJob))).scalars().all()
        assert {job.id for job in remaining} == {recent_id}
        url_row = await db.get(PanoramaImportUrl, url_id)
        assert url_row is not None
        assert url_row.capture_job_id is None
    assert load_bytes(unique) is None
    assert load_bytes(shared) == b"shared"


async def test_limit_bounds_each_scan():
    async with SessionLocal() as db:
        db.add_all([_job(), _job(), _job()])
        await db.commit()

    async with SessionLocal() as db:
        result = await prune_terminal_capture_jobs(
            db, retention_days=30, limit=2, apply=False, now=NOW
        )

    assert (result.scanned, result.pruned) == (2, 2)
