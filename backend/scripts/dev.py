"""Daily dev entrypoint: ensure postgres is up, then API + capture worker.

Usage: uv run python scripts/dev.py
API without worker: EEA_DEV_API_ONLY=1 uv run python scripts/dev.py
Stop postgres afterwards with:  uv run python scripts/stop_db.py
"""
import os
import signal
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from scripts._dev_env import api_only, ensure_object_dir, load_dotenv_file
load_dotenv_file()
ensure_object_dir()
BIN = ROOT / ".pg" / "pgsql" / "bin"
DATA = ROOT / ".pg" / "data"
EXTERNAL_DB_MARKER = ROOT / ".pg" / "use-external-db"
PG_PORT = int(os.environ.get("DB_PORT", "54329"))

use_portable_pg = DATA.exists()
use_external_pg = EXTERNAL_DB_MARKER.is_file()

if not use_portable_pg and not use_external_pg:
    raise SystemExit("database not initialized — run: uv run python scripts/bootstrap.py")

if use_portable_pg:
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

worker_proc: subprocess.Popen | None = None
if not api_only():
    worker_proc = subprocess.Popen(
        [sys.executable, "-m", "app.worker"],
        cwd=ROOT,
        env=os.environ.copy(),
    )
    print("[dev] capture worker started", flush=True)


def _stop_worker() -> None:
    if worker_proc is None or worker_proc.poll() is not None:
        return
    worker_proc.send_signal(signal.SIGINT)
    try:
        worker_proc.wait(timeout=90)
    except subprocess.TimeoutExpired:
        worker_proc.kill()
        worker_proc.wait(timeout=10)


try:
    uvicorn.run(
        "app.main:app",
        host=os.environ.get("API_HOST", "127.0.0.1" if use_external_pg else "0.0.0.0"),
        port=int(os.environ.get("API_PORT", "8000")),
        loop="none",  # keep the WindowsSelectorEventLoop policy set above (psycopg requirement)
    )
finally:
    _stop_worker()
