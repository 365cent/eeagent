"""Start the backend stack in the background (PostgreSQL if needed + uvicorn API).

Usage:  uv run python scripts/start_api.py
Logs:   backend/.pg/api.log    PID file: backend/.pg/api.pid
Stop:   uv run python scripts/stop_api.py   (API only)
        uv run python scripts/stop_db.py   (PostgreSQL portable only)

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
EXTERNAL_DB_MARKER = PG_DIR / "use-external-db"
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


def database_initialized() -> bool:
    return DATA.is_dir() or EXTERNAL_DB_MARKER.is_file()


def ensure_portable_postgres() -> None:
    if not DATA.is_dir():
        return
    r = subprocess.run([str(BIN / "pg_ctl"), "-D", str(DATA), "status"], capture_output=True)
    if r.returncode != 0:
        subprocess.run(
            [str(BIN / "pg_ctl"), "-D", str(DATA), "-o", f"-p {PG_PORT} -h 127.0.0.1", "-w", "start"],
            check=True,
        )


if api_up():
    print(f"API already running on http://127.0.0.1:{API_PORT}")
    raise SystemExit(0)

if not database_initialized():
    raise SystemExit("database not initialized — run: uv run python scripts/bootstrap.py")

if EXTERNAL_DB_MARKER.is_file() and not DATA.is_dir():
    print("using external PostgreSQL (see .pg/use-external-db); ensure the server is running")
else:
    ensure_portable_postgres()

PG_DIR.mkdir(exist_ok=True)
pop_kw: dict = {
    "args": [sys.executable, str(ROOT / "scripts" / "dev.py")],
    "stdout": subprocess.DEVNULL,
    "stderr": subprocess.STDOUT,
    "cwd": ROOT,
    "env": os.environ.copy(),
}
if sys.platform == "win32":
    # DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_BREAKAWAY_FROM_JOB
    detached = 0x00000008 | 0x00000200 | 0x1000000
    with LOG.open("ab") as log:
        proc = subprocess.Popen(
            pop_kw["args"],
            stdout=log,
            stderr=subprocess.STDOUT,
            cwd=pop_kw["cwd"],
            env=pop_kw["env"],
            creationflags=detached,
            close_fds=True,
        )
else:
    with LOG.open("ab") as log:
        proc = subprocess.Popen(
            pop_kw["args"],
            stdout=log,
            stderr=subprocess.STDOUT,
            cwd=pop_kw["cwd"],
            env=pop_kw["env"],
            start_new_session=True,
        )

PID_FILE.write_text(str(proc.pid), encoding="utf-8")

for _ in range(80):
    if api_up():
        print(f"API running on http://127.0.0.1:{API_PORT} (pid {proc.pid}, log {LOG})")
        raise SystemExit(0)
    time.sleep(0.5)

raise SystemExit(f"API did not become healthy within 40s; see {LOG}")
