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

worker_proc: subprocess.Popen | None = None


def _ensure_postgres() -> None:
    if not use_portable_pg and not use_external_pg:
        raise SystemExit("database not initialized — run: uv run python scripts/bootstrap.py")

    if use_portable_pg:
        r = subprocess.run([str(BIN / "pg_ctl"), "-D", str(DATA), "status"], capture_output=True)
        if r.returncode != 0:
            subprocess.run(
                [str(BIN / "pg_ctl"), "-D", str(DATA), "-o", f"-p {PG_PORT} -h 127.0.0.1", "-w", "start"],
                check=True,
            )


def _stop_worker() -> None:
    if worker_proc is None or worker_proc.poll() is not None:
        return
    worker_proc.send_signal(signal.SIGINT)
    try:
        worker_proc.wait(timeout=90)
    except subprocess.TimeoutExpired:
        worker_proc.kill()
        worker_proc.wait(timeout=10)


def main() -> None:
    global worker_proc

    _ensure_postgres()

    import uvicorn

    os.chdir(ROOT)

    if not api_only():
        # FastAPI lifespan already runs an embedded capture worker (EEA_CAPTURE_EMBEDDED).
        # A second subprocess on Windows lacks the selector event-loop policy → psycopg InterfaceError spam.
        embed_default = os.environ.get("EEA_CAPTURE_EMBEDDED", "1").lower() not in ("0", "false", "no")
        skip_subprocess = sys.platform == "win32" and embed_default
        if skip_subprocess:
            print("[dev] capture worker embedded in API (no subprocess on Windows)", flush=True)
        else:
            worker_proc = subprocess.Popen(
                [sys.executable, "-m", "app.worker"],
                cwd=ROOT,
                env=os.environ.copy(),
            )
            print("[dev] capture worker subprocess started", flush=True)

    reload = os.environ.get("EEA_DEV_RELOAD", "1").lower() not in ("0", "false", "no")
    # Reload worker calls Server.run() before app.main import; on Windows use eea_event_loop()
    # so asyncio.Runner gets a loop instance (not Proactor, not a loop class).
    uvicorn_loop = "app.core.uvicorn_loop:eea_event_loop" if sys.platform == "win32" else "auto"

    try:
        uvicorn.run(
            "app.main:app",
            host=os.environ.get("API_HOST", "127.0.0.1" if use_external_pg else "0.0.0.0"),
            port=int(os.environ.get("API_PORT", "8000")),
            loop=uvicorn_loop,
            reload=reload,
            timeout_graceful_shutdown=15,
        )
    except KeyboardInterrupt:
        print("\n[dev] API stopped", flush=True)
    finally:
        _stop_worker()


if __name__ == "__main__":
    main()
