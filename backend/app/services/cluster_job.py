"""Compute queued theme-cluster reports. Run as `python -m app.services.cluster_job`.

The API queues a row (a new signal, or the 重放聚类 button) and starts this script
in its own process. It claims every queued row, builds the clustering report once
(so a burst of signals costs one pass), and stores the JSON the page renders.
Exit code 0 when there was nothing to do or the pass succeeded.
"""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timezone

from sqlalchemy import select, update

from app.db.base import SessionLocal, engine
from app.models.models import ThemeClusterRun
from app.services.cluster_runner import FAILED, QUEUED, READY, RUNNING


async def _claim() -> list[ThemeClusterRun]:
    now = datetime.now(timezone.utc)
    async with SessionLocal() as db:
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


async def _finish(ids: list, *, payload: dict | None = None, signal_count: int | None = None,
                  cluster_count: int | None = None, error: str | None = None) -> None:
    now = datetime.now(timezone.utc)
    async with SessionLocal() as db:
        await db.execute(
            update(ThemeClusterRun)
            .where(ThemeClusterRun.id.in_(ids))
            .values(
                status=FAILED if error else READY,
                payload=payload,
                signal_count=signal_count,
                cluster_count=cluster_count,
                error=error,
                finished_at=now,
            )
        )
        await db.commit()


async def main() -> int:
    claimed = await _claim()
    if not claimed:
        return 0
    ids = [row.id for row in claimed]
    triggers = sorted({row.trigger for row in claimed})
    try:
        from app.domains.tagging.clustering import build_theme_cluster_report

        async with SessionLocal() as db:
            report = await build_theme_cluster_report(db)
        await _finish(
            ids,
            payload=report.model_dump(mode="json"),
            signal_count=report.sample_size,
            cluster_count=len(report.clusters),
        )
        print(f"cluster run ready: triggers={triggers} signals={report.sample_size} clusters={len(report.clusters)}")
        return 0
    except Exception as exc:  # noqa: BLE001 - the row records the failure
        detail = f"{type(exc).__name__}: {exc}"[:1000]
        await _finish(ids, error=detail)
        print(f"cluster run failed: {detail}", file=sys.stderr)
        return 1


async def _run() -> int:
    try:
        return await main()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    # psycopg's async driver cannot run on Windows' ProactorEventLoop, the same
    # constraint the API works around when it starts.
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    sys.exit(asyncio.run(_run()))
