"""Seed one deterministic seven-stage chain for the Playwright smoke test.

Acceptance SAMPLE, not production data. Every row is written through the same
public REST API a researcher uses, into an isolated dev/test database. Prints
the ids the browser test asserts on.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

import httpx  # noqa: E402

from tests.support import build_chain  # noqa: E402

API_ROOT = os.environ.get("EEA_API_URL", "http://127.0.0.1:8000")


async def main() -> None:
    async with httpx.AsyncClient(base_url=API_ROOT, timeout=60.0) as client:
        chain = await build_chain(client)
    print(
        json.dumps(
            {
                "signal_id": chain["signal"]["id"],
                "demand_id": chain["demand"]["id"],
                "function_id": chain["function"]["id"],
                "landing_point_id": chain["landing_point"]["id"],
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    asyncio.run(main())
