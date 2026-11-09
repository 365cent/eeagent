"""Daily dev entrypoint: ensure postgres is up, then start uvicorn.

Usage: uv run python scripts/dev.py
Stop postgres afterwards with:  uv run python scripts/stop_db.py
"""
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BIN = ROOT / ".pg" / "pgsql" / "bin"
DATA = ROOT / ".pg" / "data"
PG_PORT = int(os.environ.get("DB_PORT", "54329"))

if not DATA.exists():
    raise SystemExit("database not initialized — run: uv run python scripts/bootstrap.py")

r = subprocess.run([str(BIN / "pg_ctl"), "-D", str(DATA), "status"], capture_output=True)
if r.returncode != 0:
    subprocess.run(
        [str(BIN / "pg_ctl"), "-D", str(DATA), "-o", f"-p {PG_PORT} -h 127.0.0.1", "-w", "start"],
        check=True,
    )

if sys.platform == "win32":
    import asyncio

    # psycopg async requires a selector loop; uvicorn default on Windows is Proactor
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import uvicorn  # noqa: E402

os.chdir(ROOT)
uvicorn.run(
    "app.main:app",
    host=os.environ.get("API_HOST", "0.0.0.0"),
    port=int(os.environ.get("API_PORT", "8000")),
    loop="none",  # keep the WindowsSelectorEventLoop policy set above (psycopg requirement)
)
