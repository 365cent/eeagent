"""Stop the background API started by scripts/start_api.py.

Usage: uv run python scripts/stop_api.py
PostgreSQL keeps running; stop it separately with scripts/stop_db.py.
"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PID_FILE = ROOT / ".pg" / "api.pid"

if not PID_FILE.exists():
    print("no api.pid — API not started via scripts/start_api.py, nothing to stop")
    raise SystemExit(0)

pid = PID_FILE.read_text(encoding="utf-8").strip()
subprocess.run(["taskkill", "/PID", pid, "/T", "/F"], check=False)
PID_FILE.unlink(missing_ok=True)
print(f"api stopped (pid {pid})")
