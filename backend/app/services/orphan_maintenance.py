"""Compatibility entry point for the maintenance command (BE-01).

The implementation lives in app.domains.capture.orphan_maintenance; this module
keeps python -m app.services.orphan_maintenance working for deploy/ops.
"""
from __future__ import annotations

import asyncio
import sys

if sys.platform == "win32":
    # psycopg async needs a selector loop, not the Windows default proactor.
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.domains.capture.orphan_maintenance import _run, main  # noqa: F401


if __name__ == "__main__":
    raise SystemExit(main())
