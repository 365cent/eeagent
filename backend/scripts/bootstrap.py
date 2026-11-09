"""One-time (and repeat-safe) backend bootstrap.

Usage: uv run python scripts/bootstrap.py   (or: .venv\\Scripts\\python scripts\\bootstrap.py)

1. Downloads portable PostgreSQL binaries into backend/.pg/ (no Windows service, no admin).
2. initdb a data dir, start postgres on 127.0.0.1:54329.
3. Create role/db `eea`.
4. Run Alembic migrations + seed (closed vocabularies and five confirmed technical domains only).
"""
import os
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path

# log4cxx "No appender could be found for logger (SGEPLog...)" noise is printed
# by a DLL the corporate endpoint software injects into every process on this
# machine — not by PostgreSQL or this script. Stream child output line by line
# and drop those lines so bootstrap stays readable.
_NOISE = ("log4cxx:", "Please initialize the log4cxx system")


def run(cmd: list[str], **kw) -> None:
    cmd = [str(c) for c in cmd]
    print(">", " ".join(cmd))
    kw.pop("capture_output", None)
    proc = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, errors="replace", **kw
    )
    assert proc.stdout is not None
    for line in proc.stdout:
        if any(marker in line for marker in _NOISE):
            continue
        print(line, end="")
    proc.stdout.close()
    if proc.wait() != 0:
        raise SystemExit(f"command failed (exit {proc.returncode}): {' '.join(cmd)}")

ROOT = Path(__file__).resolve().parent.parent
PG_DIR = ROOT / ".pg"
BIN = PG_DIR / "pgsql" / "bin"
DATA = PG_DIR / "data"
ZIP = PG_DIR / "pg-binaries.zip"

PG_VERSION = os.environ.get("PG_VERSION", "16.9-1")
PG_URL = os.environ.get(
    "PG_URL",
    f"https://get.enterprisedb.com/postgresql/postgresql-{PG_VERSION}-windows-x64-binaries.zip",
)
PG_PORT = int(os.environ.get("DB_PORT", "54329"))
PG_USER = os.environ.get("DB_USER", "eea")
PG_PASSWORD = os.environ.get("DB_PASSWORD", "eea")
PG_DB = os.environ.get("DB_NAME", "eea")


def run(cmd: list[str], **kw) -> None:
    print(">", " ".join(str(c) for c in cmd))
    subprocess.run([str(c) for c in cmd], check=True, **kw)


def download() -> None:
    if BIN.exists():
        return
    ZIP.parent.mkdir(exist_ok=True)
    if not ZIP.exists():
        print(f"downloading PostgreSQL {PG_VERSION} portable binaries...")
        print(PG_URL)
        urllib.request.urlretrieve(PG_URL, ZIP)
    print("extracting...")
    with zipfile.ZipFile(ZIP) as z:
        z.extractall(PG_DIR)
    ZIP.unlink(missing_ok=True)


def initdb() -> None:
    if DATA.exists():
        return
    run(
        [
            BIN / "initdb",
            "-D", DATA,
            "-U", PG_USER,
            "--pwfile=" + _pwfile(),
            "-E", "UTF8",
            "--locale=C",
        ]
    )


def _pwfile() -> str:
    f = PG_DIR / "pwfile.txt"
    f.write_text(PG_PASSWORD, encoding="utf-8")
    return str(f)


def run_quiet(cmd: list[str], env: dict | None = None) -> subprocess.CompletedProcess:
    """Captured run that also swallows the injected-DLL noise."""
    r = subprocess.run(
        [str(c) for c in cmd], capture_output=True, text=True, env=env
    )
    if r.stderr:
        r.stderr = "\n".join(
            l for l in r.stderr.splitlines() if not any(m in l for m in _NOISE)
        )
    return r


def start() -> None:
    r = run_quiet([BIN / "pg_ctl", "-D", DATA, "status"])
    if r.returncode == 0:
        print("postgres already running")
        return
    run([BIN / "pg_ctl", "-D", DATA, "-o", f"-p {PG_PORT} -h 127.0.0.1", "-w", "start"])
    _pwfile_cleanup()


def _pwfile_cleanup() -> None:
    (PG_DIR / "pwfile.txt").unlink(missing_ok=True)


def create_db() -> None:
    env = dict(os.environ, PGPASSWORD=PG_PASSWORD)
    q = f"SELECT 1 FROM pg_database WHERE datname='{PG_DB}'"
    r = run_quiet(
        [
            BIN / "psql", "-h", "127.0.0.1", "-p", str(PG_PORT),
            "-U", PG_USER, "-d", "postgres", "-tAc", q,
        ],
        env=env,
    )
    if r.returncode != 0:
        sys.exit(f"psql failed: {r.stderr}")
    if "1" not in r.stdout:
        run(
            [
                BIN / "createdb", "-h", "127.0.0.1", "-p", str(PG_PORT),
                "-U", PG_USER, PG_DB,
            ],
            env=env,
        )


def migrate_and_seed() -> None:
    # sys.executable, not "uv run": the venv may be pip-created and the server
    # may not have uv (env convention: scripts run under whatever interpreter
    # started them). `uv run python scripts/bootstrap.py` still works — its
    # sys.executable is the same venv interpreter.
    run([sys.executable, "-m", "alembic", "upgrade", "head"], cwd=ROOT)
    run([sys.executable, "-m", "app.seed"], cwd=ROOT)


if __name__ == "__main__":
    download()
    initdb()
    start()
    create_db()
    migrate_and_seed()
    print("\nbootstrap complete. start the API with:  uv run python scripts/dev.py")
