"""Prune stale object-store and capture data, and record the run (BE-01)."""
from __future__ import annotations

import argparse
import asyncio
import socket
import sys
from datetime import datetime, timezone

if sys.platform == "win32":
    # psycopg async needs a selector loop, not the Windows default proactor.
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.core.config import get_settings
from app.db.base import SessionLocal
from app.models.models import MaintenanceRun
from app.domains.capture.retention import prune_terminal_capture_jobs
from app.domains.capture.orphan_objects import prune_resolved_orphans


def _operator() -> str:
    host = socket.gethostname().strip() or "unknown-host"
    return f"system:orphan-maintenance@{host}"[:200]


async def _run(*, apply: bool, limit: int, job_retention_days: int) -> int:
    started_at = datetime.now(timezone.utc)
    async with SessionLocal() as db:
        orphans = await prune_resolved_orphans(db, limit=limit, apply=apply)
        jobs = await prune_terminal_capture_jobs(
            db, retention_days=job_retention_days, limit=limit, apply=apply
        )
        finished_at = datetime.now(timezone.utc)
        if apply:
            db.add(
                MaintenanceRun(
                    command="orphan_maintenance",
                    scan_limit=limit,
                    scanned=orphans.scanned + jobs.scanned,
                    pruned=orphans.pruned + jobs.pruned,
                    operator_subject=_operator(),
                    operator_role="system",
                    details={
                        "orphans": {
                            "resolved": orphans.resolved,
                            "missing_blob": orphans.missing_blob,
                            "object_keys": list(orphans.object_keys),
                        },
                        "capture_jobs": {
                            "scanned": jobs.scanned,
                            "pruned": jobs.pruned,
                            "payloads_deleted": jobs.payloads_deleted,
                            "payloads_kept": jobs.payloads_kept,
                            "retention_days": job_retention_days,
                            "cutoff": jobs.cutoff.isoformat(),
                        },
                    },
                    started_at=started_at,
                    finished_at=finished_at,
                )
            )
            await db.commit()
    mode = "apply" if apply else "dry-run"
    print(
        f"orphan_maintenance {mode}: scanned={orphans.scanned + jobs.scanned} "
        f"pruned_orphans={orphans.pruned} terminal_jobs_pruned={jobs.pruned} "
        f"retention_days={job_retention_days}"
    )
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Prune resolved object-store orphans and expired terminal capture jobs "
            "(dry run by default)."
        ),
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="delete matching rows and record the run (default is dry run: count only)",
    )
    parser.add_argument(
        "--limit", type=int, default=500, help="maximum rows to scan per category"
    )
    parser.add_argument(
        "--job-retention-days",
        type=int,
        default=None,
        help=(
            "delete terminal capture jobs older than this many days "
            "(default: CAPTURE_JOB_RETENTION_DAYS)"
        ),
    )
    args = parser.parse_args(argv)
    if args.limit < 1:
        parser.error("--limit must be at least 1")
    retention_days = args.job_retention_days
    if retention_days is None:
        retention_days = get_settings().capture_job_retention_days
    if retention_days < 1:
        parser.error("--job-retention-days must be at least 1")
    return asyncio.run(
        _run(apply=args.apply, limit=args.limit, job_retention_days=retention_days)
    )


if __name__ == "__main__":
    raise SystemExit(main())
