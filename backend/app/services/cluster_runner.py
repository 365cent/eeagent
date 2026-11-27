"""Background theme-clustering runs.

The list itself lives in ``eea_theme_cluster_run``; this module owns the queue
rules, the subprocess launcher and the sweeper that restarts a job when runs are
left queued (API restarted, subprocess died, or a signal arrived while nothing
was running).
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import SessionLocal
from app.models.models import ThemeClusterRun

logger = logging.getLogger(__name__)

QUEUED = "queued"
RUNNING = "running"
READY = "ready"
FAILED = "failed"

CLUSTER_JOB_MODULE = "app.services.cluster_job"
# A run that has been "running" longer than this lost its worker (deploy,
# OOM kill); the sweeper may start a new pass instead of waiting forever.
STALE_RUNNING = timedelta(minutes=10)
# Subprocesses are cheap but not free: keep at least this gap between spawns.
MIN_SPAWN_GAP = timedelta(seconds=5)
SWEEP_SECONDS = 5.0

_last_spawn_at: datetime | None = None


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value is not None else None


async def enqueue_cluster_run(db: AsyncSession, *, trigger: str = "signal") -> uuid.UUID | None:
    """Queue one pass; an existing queued/running pass already covers the signal."""
    pending = (
        await db.execute(
            select(ThemeClusterRun.id)
            .where(ThemeClusterRun.status.in_((QUEUED, RUNNING)))
            .limit(1)
        )
    ).scalar_one_or_none()
    if pending is not None:
        return None
    run = ThemeClusterRun(trigger=trigger, status=QUEUED)
    db.add(run)
    await db.flush()
    return run.id


async def latest_run(db: AsyncSession) -> ThemeClusterRun | None:
    return (
        await db.execute(
            select(ThemeClusterRun).order_by(ThemeClusterRun.requested_at.desc()).limit(1)
        )
    ).scalar_one_or_none()


async def ready_run(db: AsyncSession) -> ThemeClusterRun | None:
    return (
        await db.execute(
            select(ThemeClusterRun)
            .where(ThemeClusterRun.status == READY, ThemeClusterRun.payload.is_not(None))
            .order_by(ThemeClusterRun.requested_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()


async def pending_run(db: AsyncSession) -> ThemeClusterRun | None:
    return (
        await db.execute(
            select(ThemeClusterRun)
            .where(ThemeClusterRun.status.in_((QUEUED, RUNNING)))
            .order_by(ThemeClusterRun.requested_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()


def run_summary(run: ThemeClusterRun | None) -> dict[str, object]:
    """API shape for a run; kept here so both endpoints agree."""
    if run is None:
        return {
            "run_id": None,
            "status": "idle",
            "trigger": None,
            "signal_count": None,
            "cluster_count": None,
            "error": None,
            "requested_at": None,
            "started_at": None,
            "finished_at": None,
        }
    return {
        "run_id": run.id,
        "status": run.status,
        "trigger": run.trigger,
        "signal_count": run.signal_count,
        "cluster_count": run.cluster_count,
        "error": run.error,
        "requested_at": _iso(run.requested_at),
        "started_at": _iso(run.started_at),
        "finished_at": _iso(run.finished_at),
    }


async def spawn_cluster_job() -> bool:
    """Start `python -m app.services.cluster_job` without blocking the API.

    The job is a separate process on purpose: sklearn/MDS work never sits on the
    request loop, and a crash there cannot take the API down with it.
    """
    global _last_spawn_at
    now = _now()
    if _last_spawn_at is not None and now - _last_spawn_at < MIN_SPAWN_GAP:
        return False
    _last_spawn_at = now
    try:
        env = os.environ.copy()
        env.setdefault("PYTHONUNBUFFERED", "1")
        await asyncio.create_subprocess_exec(
            sys.executable,
            "-m",
            CLUSTER_JOB_MODULE,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL,
            env=env,
            start_new_session=True,
        )
        return True
    except Exception as exc:  # noqa: BLE001 - a missing spawn must not break the API
        logger.warning("cluster job spawn failed (%s)", exc.__class__.__name__)
        return False


async def _run_is_live(run: ThemeClusterRun | None) -> bool:
    if run is None:
        return False
    if run.status == QUEUED:
        return True
    if run.status != RUNNING:
        return False
    started = run.started_at or run.requested_at
    return started is not None and _now() - started < STALE_RUNNING


async def cluster_sweeper(stop_event: asyncio.Event) -> None:
    """Keep queued runs moving even when no request is in flight.

    A signal commits its run row, but the process that inserted it may be the
    capture worker (or a CLI import) with no request handling the spawn; the
    sweeper is what makes "new signal -> new graph" true without a page reload.
    """
    while not stop_event.is_set():
        try:
            async with SessionLocal() as db:
                pending = await pending_run(db)
                if pending is not None and await _run_is_live(pending):
                    status = (
                        (await db.execute(select(ThemeClusterRun.status).where(ThemeClusterRun.id == pending.id)))
                        .scalar_one_or_none()
                    )
                    if status == QUEUED:
                        await spawn_cluster_job()
                    elif status == RUNNING and pending.started_at is not None:
                        if _now() - pending.started_at >= STALE_RUNNING:
                            await spawn_cluster_job()
        except Exception as exc:  # noqa: BLE001 - the sweeper never dies
            logger.warning("cluster sweeper pass failed (%s)", exc.__class__.__name__)
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=SWEEP_SECONDS)
        except asyncio.TimeoutError:
            pass
