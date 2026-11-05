"""Start the backend stack in the background (PostgreSQL if needed + uvicorn API).

Usage:  uv run python scripts/start_api.py
Logs:   backend/.pg/api.log    PID file: backend/.pg/api.pid
Stop:   uv run python scripts/stop_api.py   (API only)
        uv run python scripts/stop_db.py   (PostgreSQL)

Repeat-safe: exits 0 without doing anything if the API already answers /healthz.
"""
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PG_DIR = ROOT / ".pg"
BIN = PG_DIR / "pgsql" / "bin"
DATA = PG_DIR / "data"
PID_FILE = PG_DIR / "api.pid"
LOG = PG_DIR / "api.log"
API_PORT = int(os.environ.get("API_PORT", "8000"))
PG_PORT = int(os.environ.get("DB_PORT", "54329"))
HEALTH = f"http://127.0.0.1:{API_PORT}/healthz"


def api_up() -> bool:
    try:
        with urllib.request.urlopen(HEALTH, timeout=2) as r:
            return r.status == 200
    except OSError:
        return False


def ensure_postgres() -> None:
    r = subprocess.run([str(BIN / "pg_ctl"), "-D", str(DATA), "status"], capture_output=True)
    if r.returncode != 0:
        subprocess.run(
            [str(BIN / "pg_ctl"), "-D", str(DATA), "-o", f"-p {PG_PORT} -h 127.0.0.1", "-w", "start"],
            check=True,
        )


if api_up():
    print(f"API already running on http://127.0.0.1:{API_PORT}")
    raise SystemExit(0)

if not DATA.exists():
    raise SystemExit("database not initialized — run: uv run python scripts/bootstrap.py")

ensure_postgres()

# DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_BREAKAWAY_FROM_JOB:
# the API survives this console and whatever launched it.
DETACHED = 0x00000008 | 0x00000200 | 0x1000000
PG_DIR.mkdir(exist_ok=True)
with LOG.open("ab") as log:
    proc = subprocess.Popen(
        [sys.executable, str(ROOT / "scripts" / "dev.py")],
        stdout=log,
        stderr=subprocess.STDOUT,
        cwd=ROOT,
        creationflags=DETACHED,
        close_fds=True,
    )
PID_FILE.write_text(str(proc.pid), encoding="utf-8")

for _ in range(80):
    if api_up():
        print(f"API running on http://127.0.0.1:{API_PORT} (pid {proc.pid}, log {LOG})")
        raise SystemExit(0)
    time.sleep(0.5)

raise SystemExit(f"API did not become healthy within 40s; see {LOG}")
