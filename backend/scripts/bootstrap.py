"""One-time (and repeat-safe) backend bootstrap.

Usage: uv run python scripts/bootstrap.py   (or: .venv\\Scripts\\python scripts\\bootstrap.py)

Windows:
  1. Downloads portable PostgreSQL into backend/.pg/
  2. initdb, start on 127.0.0.1:54329, create `eea` database
  3. Alembic migrate + seed

macOS / Linux (Homebrew or system PostgreSQL):
  1. Reads backend/.env (or defaults: 127.0.0.1:5432, user/db `eea`)
  2. Creates the app database when missing (role must already exist)
  3. Alembic migrate + seed; records backend/.pg/use-external-db for dev.py

Daily start after bootstrap:  uv run python scripts/dev.py
"""
import os
import subprocess
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(line_buffering=True)
    except (OSError, ValueError):
        pass

# log4cxx "No appender could be found for logger (SGEPLog...)" noise is printed
# by a DLL the corporate endpoint software injects into every process on this
# machine — not by PostgreSQL or this script. Stream child output line by line
# and drop those lines so bootstrap stays readable.
_NOISE = ("log4cxx:", "Please initialize the log4cxx system")

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from scripts._dev_env import ensure_object_dir, load_dotenv_file  # noqa: E402

EXTERNAL_DB_MARKER = ROOT / ".pg" / "use-external-db"


def step(message: str) -> None:
    print(message, flush=True)


def run(cmd: list[str], **kw) -> None:
    cmd = [str(c) for c in cmd]
    print(">", " ".join(cmd), flush=True)
    if sys.platform == "win32" and kw.get("capture_output") is not True:
        kw.pop("capture_output", None)
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            errors="replace",
            **kw,
        )
        assert proc.stdout is not None
        for line in proc.stdout:
            if any(marker in line for marker in _NOISE):
                continue
            print(line, end="", flush=True)
        proc.stdout.close()
        if proc.wait() != 0:
            raise SystemExit(f"command failed (exit {proc.returncode}): {' '.join(cmd)}")
        return
    kw.pop("capture_output", None)
    subprocess.run(cmd, check=True, **kw)
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


def download() -> None:
    if BIN.exists():
        step(f"portable PostgreSQL binaries: ok ({BIN.parent})")
        return
    ZIP.parent.mkdir(exist_ok=True)
    if not ZIP.exists():
        step(f"downloading PostgreSQL {PG_VERSION} portable binaries...")
        step(PG_URL)
        urllib.request.urlretrieve(PG_URL, ZIP)
    step("extracting PostgreSQL archive...")
    with zipfile.ZipFile(ZIP) as z:
        z.extractall(PG_DIR)
    ZIP.unlink(missing_ok=True)


def initdb() -> None:
    if DATA.exists():
        step(f"postgres data directory: ok ({DATA})")
        return
    step("initializing postgres data directory (first run)...")
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


def run_quiet(
    cmd: list[str],
    env: dict | None = None,
    *,
    timeout: float = 120,
) -> subprocess.CompletedProcess:
    """Captured run that also swallows the injected-DLL noise."""
    try:
        r = subprocess.run(
            [str(c) for c in cmd],
            capture_output=True,
            text=True,
            env=env,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as exc:
        raise SystemExit(
            f"timed out after {timeout}s: {' '.join(str(c) for c in cmd)}\n"
            "If another bootstrap is running, wait for it or stop the stuck process and retry."
        ) from exc
    if r.stdout:
        r.stdout = "\n".join(
            l for l in r.stdout.splitlines() if not any(m in l for m in _NOISE)
        )
    if r.stderr:
        r.stderr = "\n".join(
            l for l in r.stderr.splitlines() if not any(m in l for m in _NOISE)
        )
    return r


def _print_captured(cmd: list[str], result: subprocess.CompletedProcess) -> None:
    print(">", " ".join(str(c) for c in cmd), flush=True)
    for chunk in (result.stdout, result.stderr):
        if chunk:
            print(chunk, flush=True)


def _hint_postgres_log(log_file: Path) -> None:
    if not log_file.is_file():
        return
    lines = log_file.read_text(encoding="utf-8", errors="replace").splitlines()
    tail = lines[-25:]
    if not tail:
        return
    step(f"--- last lines of {log_file} ---")
    for line in tail:
        if any(marker in line for marker in _NOISE):
            continue
        print(line, flush=True)


def postgres_is_ready() -> bool:
    """True when the server accepts connections (preferred over pg_ctl status on Windows)."""
    try:
        r = subprocess.run(
            [str(BIN / "pg_isready"), "-h", "127.0.0.1", "-p", str(PG_PORT), "-q"],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=15,
        )
    except subprocess.TimeoutExpired:
        return False
    return r.returncode == 0


def start() -> None:
    step(f"checking postgres on 127.0.0.1:{PG_PORT}...")
    if postgres_is_ready():
        step("postgres already running")
        _pwfile_cleanup()
        return

    log_file = PG_DIR / "postgres.log"
    cmd = [
        BIN / "pg_ctl",
        "-D",
        DATA,
        "-l",
        str(log_file),
        "-o",
        f"-p {PG_PORT} -h 127.0.0.1",
        "-w",
        "start",
    ]
    # Never pipe pg_ctl start on Windows: the postmaster can fill the pipe and deadlock
    # bootstrap (stdout streaming) or hang communicate() (capture_output=True).
    step("starting postgres...")
    print(">", " ".join(str(c) for c in cmd), flush=True)
    try:
        r = subprocess.run(
            [str(c) for c in cmd],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=120,
        )
    except subprocess.TimeoutExpired:
        _hint_postgres_log(log_file)
        raise SystemExit(
            "pg_ctl start timed out after 120s; see log above. "
            "Stop any stuck postgres.exe or re-run bootstrap."
        ) from None

    if r.returncode != 0:
        _hint_postgres_log(log_file)
        raise SystemExit(f"pg_ctl start failed (exit {r.returncode})")

    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if postgres_is_ready():
            step("postgres started")
            _pwfile_cleanup()
            return
        time.sleep(0.25)

    _hint_postgres_log(log_file)
    raise SystemExit("postgres did not accept connections after start")


def _pwfile_cleanup() -> None:
    (PG_DIR / "pwfile.txt").unlink(missing_ok=True)


def create_db() -> None:
    step(f"ensuring database '{PG_DB}' exists...")
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
        step(f"creating database '{PG_DB}'...")
        run(
            [
                BIN / "createdb", "-h", "127.0.0.1", "-p", str(PG_PORT),
                "-U", PG_USER, PG_DB,
            ],
            env=env,
        )
    else:
        step(f"database '{PG_DB}': ok")


def bootstrap_external_postgres() -> None:
    """macOS/Linux: use running system Postgres (see repo README.md)."""
    load_dotenv_file()
    ensure_object_dir()
    host = os.environ.get("DB_HOST", "127.0.0.1")
    port = str(os.environ.get("DB_PORT", "5432"))
    user = os.environ.get("DB_USER", "eea")
    password = os.environ.get("DB_PASSWORD", "eea")
    db = os.environ.get("DB_NAME", "eea")
    env = {**os.environ, "PGPASSWORD": password}
    PG_DIR.mkdir(exist_ok=True)
    run(
        [
            "psql",
            "-h",
            host,
            "-p",
            port,
            "-U",
            user,
            "-d",
            "postgres",
            "-v",
            "ON_ERROR_STOP=1",
            "-c",
            "SELECT 1",
        ],
        env=env,
    )
    exists = subprocess.run(
        [
            "psql",
            "-h",
            host,
            "-p",
            port,
            "-U",
            user,
            "-d",
            "postgres",
            "-tAc",
            f"SELECT 1 FROM pg_database WHERE datname='{db}'",
        ],
        env=env,
        capture_output=True,
        text=True,
    )
    if exists.returncode != 0:
        raise SystemExit(f"psql failed: {exists.stderr or exists.stdout}")
    if "1" not in (exists.stdout or ""):
        run(
            ["createdb", "-h", host, "-p", port, "-U", user, db],
            env=env,
        )
    EXTERNAL_DB_MARKER.write_text(f"host={host} port={port} db={db}\n", encoding="utf-8")
    print(f"external PostgreSQL ready at {host}:{port}/{db}")


def sync_app_db_env_for_portable() -> None:
    """Align app/Alembic settings with the portable instance we just started.

    bootstrap does not load backend/.env before picking PG_PORT (defaults to 54329).
    Alembic loads .env via pydantic-settings; a copied .env.example often has
    DB_PORT=5432 for macOS/Linux and causes migration connection timeouts on Windows.
    """
    os.environ["DB_HOST"] = "127.0.0.1"
    os.environ["DB_PORT"] = str(PG_PORT)
    os.environ["DB_USER"] = PG_USER
    os.environ["DB_PASSWORD"] = PG_PASSWORD
    os.environ["DB_NAME"] = PG_DB


def migrate_and_seed() -> None:
    # sys.executable, not "uv run": the venv may be pip-created and the server
    # may not have uv (env convention: scripts run under whatever interpreter
    # started them). `uv run python scripts/bootstrap.py` still works — its
    # sys.executable is the same venv interpreter.
    step("running alembic migrations...")
    run([sys.executable, "-m", "alembic", "upgrade", "head"], cwd=ROOT)
    step("seeding reference data...")
    run([sys.executable, "-m", "app.seed"], cwd=ROOT)


if __name__ == "__main__":
    step("EEA backend bootstrap")
    if sys.platform == "win32":
        download()
        initdb()
        start()
        create_db()
    else:
        bootstrap_external_postgres()
    if sys.platform == "win32":
        sync_app_db_env_for_portable()
    migrate_and_seed()
    step("\nbootstrap complete. start the API with:  uv run python scripts/dev.py")
