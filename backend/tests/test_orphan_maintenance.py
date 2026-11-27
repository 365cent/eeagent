"""Orphan-prune counts and the maintenance-run audit row (BE-01)."""

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from app.db.base import SessionLocal
from app.models.models import CaptureJob, MaintenanceRun, StoredObjectOrphan
from app.domains.capture.orphan_maintenance import _run
from app.domains.capture.orphan_objects import prune_resolved_orphans

pytestmark = pytest.mark.anyio


def _missing(key: str) -> StoredObjectOrphan:
    return StoredObjectOrphan(object_key=key, reason="test write failed")


async def test_prune_counts_resolved_and_missing_blobs():
    async with SessionLocal() as db:
        db.add_all(
            [
                _missing("missing/one.bin"),
                StoredObjectOrphan(
                    object_key="resolved/two.bin",
                    reason="test write failed",
                    resolved_at=datetime.now(timezone.utc),
                ),
                _missing("missing/three.bin"),
            ]
        )
        await db.commit()

    async with SessionLocal() as db:
        result = await prune_resolved_orphans(db, limit=10, apply=False)

    assert result.scanned == 3
    assert result.pruned == 3
    assert result.resolved == 1
    assert result.missing_blob == 2
    assert result.object_keys == (
        "missing/one.bin",
        "missing/three.bin",
        "resolved/two.bin",
    )


async def test_apply_deletes_rows_and_writes_one_audit_run(capsys):
    async with SessionLocal() as db:
        db.add_all([_missing("missing/apply-one.bin"), _missing("missing/apply-two.bin")])
        await db.commit()

    assert await _run(apply=True, limit=7, job_retention_days=30) == 0

    out = capsys.readouterr().out
    assert "orphan_maintenance apply" in out
    assert "scanned=2" in out
    assert "pruned_orphans=2" in out

    async with SessionLocal() as db:
        runs = (await db.execute(select(MaintenanceRun))).scalars().all()
        assert len(runs) == 1
        run = runs[0]
        assert run.command == "orphan_maintenance"
        assert run.scan_limit == 7
        assert (run.scanned, run.pruned) == (2, 2)
        assert run.operator_role == "system"
        assert run.operator_subject.startswith("system:orphan-maintenance@")
        assert run.details["orphans"]["resolved"] == 0
        assert run.details["orphans"]["missing_blob"] == 2
        assert run.details["orphans"]["object_keys"] == [
            "missing/apply-one.bin",
            "missing/apply-two.bin",
        ]
        assert run.details["capture_jobs"]["scanned"] == 0
        assert run.details["capture_jobs"]["pruned"] == 0
        assert run.details["capture_jobs"]["retention_days"] == 30
        assert run.started_at <= run.finished_at
        assert (await db.execute(select(StoredObjectOrphan))).scalars().all() == []


async def test_apply_audits_terminal_job_cleanup(capsys):
    old = datetime.now(timezone.utc) - timedelta(days=40)
    async with SessionLocal() as db:
        db.add(
            CaptureJob(
                id=uuid.uuid4(),
                submission_id=uuid.uuid4(),
                fingerprint="a" * 64,
                via="test",
                status="succeeded",
                stage="completed",
                payload_object_key=None,
                payload_size=0,
                finished_at=old,
                updated_at=old,
            )
        )
        await db.commit()

    assert await _run(apply=True, limit=10, job_retention_days=30) == 0
    assert "terminal_jobs_pruned=1" in capsys.readouterr().out

    async with SessionLocal() as db:
        run = (await db.execute(select(MaintenanceRun))).scalars().one()
        assert (run.scanned, run.pruned) == (1, 1)
        assert run.details["capture_jobs"]["pruned"] == 1
        assert run.details["capture_jobs"]["retention_days"] == 30
        assert (await db.execute(select(CaptureJob))).scalars().all() == []


async def test_dry_run_writes_no_audit_and_keeps_rows(capsys):
    async with SessionLocal() as db:
        db.add(_missing("missing/dry-run.bin"))
        await db.commit()

    assert await _run(apply=False, limit=10, job_retention_days=30) == 0

    assert "orphan_maintenance dry-run" in capsys.readouterr().out
    async with SessionLocal() as db:
        assert (await db.execute(select(MaintenanceRun))).scalars().all() == []
        assert len((await db.execute(select(StoredObjectOrphan))).scalars().all()) == 1
