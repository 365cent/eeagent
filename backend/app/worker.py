"""Standalone durable capture worker entry point for Linux/systemd."""
from __future__ import annotations

import asyncio
import os
import signal

os.environ.setdefault("PYDANTIC_AI_NO_BANNER", "1")

from app.core.bootstrap_env import bootstrap_environment

bootstrap_environment()

from app.services.capture_jobs import worker_loop
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
        await worker_loop(stop_event)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(_run())
