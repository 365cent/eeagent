"""Compute queued theme-cluster reports once, then exit.

Kept as a manual escape hatch (`python -m app.services.cluster_job`) for ops and
for a host that runs the clustering without the worker; production runs the same
function inside the clustering worker loop (app/services/cluster_runner.py).
"""

from __future__ import annotations

import asyncio
import sys

from app.services.cluster_runner import dispose_engine, run_queued_reports


async def _run() -> int:
    try:
        processed = await run_queued_reports()
        print(f"theme cluster job: {processed} pass(es)")
        return 0
    finally:
        await dispose_engine()


if __name__ == "__main__":
    # psycopg's async driver cannot run on Windows' ProactorEventLoop, the same
    # constraint the API works around when it starts.
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    sys.exit(asyncio.run(_run()))
