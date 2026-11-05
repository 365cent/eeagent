"""Stop the portable postgres instance. Usage: uv run python scripts/stop_db.py"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BIN = ROOT / ".pg" / "pgsql" / "bin"
DATA = ROOT / ".pg" / "data"

if not DATA.exists():
    raise SystemExit("no local database initialized")
subprocess.run([str(BIN / "pg_ctl"), "-D", str(DATA), "-m", "fast", "stop"], check=False)
print("postgres stopped")
