"""Standalone durable capture worker entry point for Linux/systemd."""
from __future__ import annotations

import asyncio
import os
import signal
import sys

os.environ.setdefault("PYDANTIC_AI_NO_BANNER", "1")

from app.core.bootstrap_env import bootstrap_environment

bootstrap_environment()

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.domains.capture.jobs import worker_loop
from app.services.cluster_runner import start_cluster_thread
from app.db.base import engine


async def _run() -> None:
    stop_event = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, stop_event.set)
        except (NotImplementedError, RuntimeError):
            # Windows development can stop the process with the default handler.
            pass
    try:
        # Clustering runs on its own thread: an ingest pass can block this loop
        # for >10 s, and the queued run would sit there waiting for it.
        cluster_stop = start_cluster_thread()
        await worker_loop(stop_event)
    finally:
        if "cluster_stop" in locals():
            cluster_stop.set()
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(_run())
