"""Background theme-clustering runs.

A run row lives in ``eea_theme_cluster_run``. A signal insert queues one (see
create_signal_record), the manual 重放聚类 button queues one, and the clustering
worker claims them, builds the report and publishes it. The report snapshot is
what GET /themes/cluster-report serves.

Why a loop in the worker process instead of spawning a script per run: the API
is a threaded server, and fork+exec from it was measured taking ~25 s before the
child even started (the same command from a shell took 1 s). A warm loop in the
worker claims a run within a couple of seconds and never touches the API.
"""

from __future__ import annotations

import asyncio
import logging
import threading
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.models.models import ThemeClusterRun

logger = logging.getLogger(__name__)

QUEUED = "queued"
RUNNING = "running"
READY = "ready"
FAILED = "failed"

# How often an idle worker looks for queued runs.
POLL_SECONDS = 2.0
# A run that has been "running" longer than this lost its worker (deploy, OOM
# kill); the loop may claim a new pass instead of waiting forever.
STALE_RUNNING = timedelta(minutes=10)

# Own engine: the clustering loop runs in its own thread/loop (see
# start_cluster_thread), and async connections must not hop between loops.
_engine: AsyncEngine | None = None
_sessions: async_sessionmaker[AsyncSession] | None = None


def _session() -> AsyncSession:
    global _engine, _sessions
    if _sessions is None:
        _engine = create_async_engine(
            get_settings().database_url, pool_size=2, max_overflow=1, pool_pre_ping=True
        )
        _sessions = async_sessionmaker(_engine, expire_on_commit=False)
    return _sessions()


async def dispose_engine() -> None:
    global _engine, _sessions
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _sessions = None


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


async def _claim_queued() -> list[ThemeClusterRun]:
    now = _now()
    async with _session() as db:
        queued_ids = (
            select(ThemeClusterRun.id)
            .where(ThemeClusterRun.status == QUEUED)
            .with_for_update(skip_locked=True)
        )
        rows = (
            await db.execute(
                update(ThemeClusterRun)
                .where(ThemeClusterRun.id.in_(queued_ids))
                .values(status=RUNNING, started_at=now)
                .returning(ThemeClusterRun.id, ThemeClusterRun.trigger)
            )
        ).all()
        await db.commit()
        return [ThemeClusterRun(id=row.id, trigger=row.trigger, status=RUNNING) for row in rows]


async def run_queued_reports() -> int:
    """Claim every queued pass, compute once, publish the JSON. 0 when idle."""
    claimed = await _claim_queued()
    if not claimed:
        return 0
    ids = [run.id for run in claimed]
    try:
        from app.domains.tagging.clustering import build_theme_cluster_report

        async with _session() as db:
            report = await build_theme_cluster_report(db)
        async with _session() as db:
            await db.execute(
                update(ThemeClusterRun)
                .where(ThemeClusterRun.id.in_(ids))
                .values(
                    status=READY,
                    payload=report.model_dump(mode="json"),
                    signal_count=report.sample_size,
                    cluster_count=len(report.clusters),
                    error=None,
                    finished_at=_now(),
                )
            )
            await db.commit()
        return len(claimed)
    except Exception as exc:  # noqa: BLE001 - the row records the failure
        detail = f"{type(exc).__name__}: {exc}"[:1000]
        async with _session() as db:
            await db.execute(
                update(ThemeClusterRun)
                .where(ThemeClusterRun.id.in_(ids))
                .values(status=FAILED, error=detail, finished_at=_now())
            )
            await db.commit()
        logger.warning("theme cluster run failed (%s)", detail)
        return len(claimed)


async def cluster_worker_loop(stop_event: asyncio.Event) -> None:
    """Publish queued clustering passes until stopped.

    Runs next to the capture worker so a new signal produces a new graph within
    a couple of seconds without any request having to start a process.
    """
    while not stop_event.is_set():
        try:
            processed = await run_queued_reports()
            if processed:
                logger.info("theme cluster run published (%d pass(es))", processed)
        except Exception as exc:  # noqa: BLE001 - the loop never dies
            logger.warning("theme cluster loop pass failed (%s)", exc.__class__.__name__)
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=POLL_SECONDS)
        except asyncio.TimeoutError:
            pass


def start_cluster_thread() -> threading.Event:
    """Run the clustering loop in its own thread and event loop.

    A capture worker pass can hold the main loop for over ten seconds (jieba
    tagging, LLM calls with timeouts), which starved the 2 s poll: a queued run
    waited 13 s. A separate thread with its own loop and engine is immune to it.
    Returns the stop flag; set it to shut the thread down.
    """
    stop = threading.Event()

    def run() -> None:
        async def runner() -> None:
            event = asyncio.Event()
            task = asyncio.create_task(cluster_worker_loop(event))
            while not stop.is_set():
                await asyncio.sleep(0.25)
            event.set()
            try:
                await task
            finally:
                await dispose_engine()

        asyncio.run(runner())

    thread = threading.Thread(target=run, name="eea-cluster-worker", daemon=True)
    thread.start()
    return stop
