"""Uvicorn loop hooks — Windows reload worker must not use Proactor (psycopg async)."""

from __future__ import annotations

import asyncio
import sys


def eea_event_loop() -> asyncio.AbstractEventLoop:
    """Import target for uvicorn ``loop=`` (custom paths are called as ``factory()``).

    Uvicorn uses a custom ``loop=`` path directly as the asyncio.Runner
    loop factory: return a fresh (not yet running) loop instance.
    """
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    return asyncio.new_event_loop()