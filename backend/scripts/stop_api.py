"""Stop the background API started by scripts/start_api.py.

Usage: uv run python scripts/stop_api.py
PostgreSQL keeps running; stop portable PostgreSQL with scripts/stop_db.py.
"""
import os
import signal
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PID_FILE = ROOT / ".pg" / "api.pid"

if not PID_FILE.exists():
    print("no api.pid — API not started via scripts/start_api.py, nothing to stop")
    raise SystemExit(0)

pid = int(PID_FILE.read_text(encoding="utf-8").strip())
if sys.platform == "win32":
    subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], check=False)
else:
    try:
        os.killpg(pid, signal.SIGTERM)
    except (ProcessLookupError, PermissionError):
        try:
            os.kill(pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
PID_FILE.unlink(missing_ok=True)
print(f"api stopped (pid {pid})")
