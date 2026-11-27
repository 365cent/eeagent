"""Interface-test suite configuration.

The suite runs against a DEDICATED ``eea_test`` database on the project's
PostgreSQL (127.0.0.1:54329) — never the live ``eea`` database, which holds
the acceptance seed data.

``DB_NAME`` / ``OBJECT_DIR`` are set BEFORE the first ``app`` import:
the settings object is lru_cached (app/core/config.py:42) and the async engine
is created at import time (app/db/base.py:12), so the override must land first.
Importing ``app.main`` also sets WindowsSelectorEventLoopPolicy
(app/main.py:3-6), which psycopg's async connections require on Windows — it
must happen before any test event loop is created (anyio creates a fresh loop
per test).
"""

import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

try:  # POSIX file lock; Windows uses msvcrt below
    import fcntl
except ImportError:  # pragma: no cover - Windows
    import msvcrt

BACKEND_ROOT = Path(__file__).resolve().parent.parent

TEST_DB_NAME = "eea_test"
os.environ["APP_ENV"] = "test"
os.environ["CAPTURE_SERVER_FETCH_ENABLED"] = "true"
os.environ["DB_NAME"] = TEST_DB_NAME
# keep test bodies out of backend/.pg/objects (the dev object store)
_OBJECT_DIR = tempfile.mkdtemp(prefix="eea-test-objects-")
os.environ["OBJECT_DIR"] = _OBJECT_DIR
for _gateway in ("CHAT", "EMBEDDING", "RERANK"):
    os.environ[f"{_gateway}_BASE_URL"] = ""
    os.environ[f"{_gateway}_API_KEY"] = ""
    os.environ[f"{_gateway}_MODEL"] = ""

import psycopg  # noqa: E402
import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config as AlembicConfig  # noqa: E402
from alembic.script import ScriptDirectory  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.domains.vocab.refcodes import REF_CODES  # noqa: E402

SETTINGS = get_settings()  # cached with DB_NAME=eea_test

_APP_IMPORTED = False


def _ensure_app_imported() -> None:
    """Import app.main once (Windows event-loop policy + FastAPI app wiring)."""
    global _APP_IMPORTED
    if not _APP_IMPORTED:
        import app.main  # noqa: F401

        _APP_IMPORTED = True

_ADMIN_DSN = (
    f"host={SETTINGS.db_host} port={SETTINGS.db_port} "
    f"user={SETTINGS.db_user} password={SETTINGS.db_password} dbname=postgres"
)

# ``eea_ref_code`` is session-seeded once; per-test cleanup only rewinds mutable business data.
_TRUNCATE_SQL = text(
    "TRUNCATE TABLE eea_agent_event, eea_agent_message, eea_agent_patch, eea_agent_run, eea_agent_memory, "
    "eea_agent_session, eea_document_chunk, eea_document_figure, "
    "eea_maintenance_run, eea_chain_report, eea_embedding_cache, eea_signal_source, "
    "eea_stored_object_orphan, "
    "eea_panorama_import_url, eea_panorama_import_batch, "
    "eea_access_log, eea_capture_client_claim, eea_capture_job, eea_document, eea_signal_tag, eea_signal, "
    "eea_correction_audit, "
    "eea_capture_token, "
    "eea_strategic_assessment, eea_strategic_funnel, eea_deployment_standard, eea_tech_landing_point, "
    "eea_vehicle_function, eea_demand_point, eea_tech_theme, eea_vocab CASCADE"
)

_DOMAIN_VOCAB = ("软件", "硬件", "通信", "电源与能源管理", "工具")

# loop-independent cleanup connection (sync psycopg) — see scripts/bootstrap.py
# for how the live stack creates databases; the test DB is created the same way
_SYNC_ENGINE = create_engine(SETTINGS.database_url)

# Session-level mutual exclusion for the shared eea_test database. The
# autouse _clean_database fixture TRUNCATEs every table per test: a second
# concurrent pytest session against the same database deadlocks on those
# TRUNCATE locks (psycopg DeadlockDetected at setup) and every suite reports
# spurious failures. TODO.md B6 documents the gate must run exclusively; this
# lock makes that constraint explicit — a second session blocks until the
# first finishes (pytest-xdist workers within ONE session are unaffected:
# the lock is taken once per session in the parent, before workers fork).
#
# ``no_db`` tests skip the lock entirely so quick checks can run beside a
# long integration session (see ``scripts/pytest_slices.sh unit``).
_TEST_LOCK_PATH = BACKEND_ROOT / ".pg" / "eea_test_suite.lock"
_TEST_LOCK_FILE = None


def _lock_mode() -> str:
    """``fail`` = CI strict; ``skip`` = fast local no_db alongside integration; default steals stale locks."""
    raw = os.environ.get("EEA_PYTEST_LOCK", "takeover").strip().lower()
    if raw in ("skip", "none", "0"):
        return "skip"
    if raw == "fail":
        return "fail"
    return "takeover"


def _write_lock_owner(lock_file) -> None:
    lock_file.seek(0)
    lock_file.truncate()
    lock_file.write(f"{os.getpid()}\n")
    lock_file.flush()


def _acquire_suite_lock() -> None:
    global _TEST_LOCK_FILE
    if _lock_mode() == "skip":
        return
    _TEST_LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    non_blocking = _lock_mode() == "fail"
    for attempt in range(2 if _lock_mode() == "takeover" else 1):
        _TEST_LOCK_FILE = open(_TEST_LOCK_PATH, "a+")
        try:
            if "msvcrt" in sys.modules:
                lock_flag = msvcrt.LK_NBLCK if non_blocking else msvcrt.LK_LOCK
                msvcrt.locking(_TEST_LOCK_FILE.fileno(), lock_flag, 1)
            else:
                flags = fcntl.LOCK_EX | (fcntl.LOCK_NB if non_blocking else 0)
                fcntl.flock(_TEST_LOCK_FILE.fileno(), flags)
            _write_lock_owner(_TEST_LOCK_FILE)
            return
        except BlockingIOError:
            _TEST_LOCK_FILE.close()
            _TEST_LOCK_FILE = None
            if attempt == 0 and _lock_mode() == "takeover":
                try:
                    _TEST_LOCK_PATH.unlink(missing_ok=True)
                except OSError:
                    pass
                time.sleep(0.05)
                continue
            pytest.exit(
                f"eea_test 已被其它 pytest 会话占用 ({_TEST_LOCK_PATH})。\n"
                "  快检: uv run pytest -m no_db -q  或  scripts/pytest_slices.sh unit\n"
                "  集成独占: EEA_PYTEST_LOCK=fail",
                returncode=2,
            )
        except OSError as exc:  # pragma: no cover - platform edge cases
            _TEST_LOCK_FILE.close()
            _TEST_LOCK_FILE = None
            pytest.exit(
                f"eea_test 会话互斥锁获取失败 ({_TEST_LOCK_PATH}): {exc}",
                returncode=1,
            )


def _item_needs_db(item: pytest.Item) -> bool:
    return item.get_closest_marker("no_db") is None


def _session_needs_db(session: pytest.Session) -> bool:
    return any(_item_needs_db(item) for item in session.items)


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line(
        "markers",
        "no_db: pure unit test — no eea_test lock, migrate, or per-test TRUNCATE",
    )
    config.addinivalue_line(
        "markers",
        "db: integration test using eea_test (default when no_db is absent)",
    )


def pytest_collection_modifyitems(session: pytest.Session, config: pytest.Config, items: list) -> None:
    del config
    for item in items:
        if item.get_closest_marker("no_db") is None:
            item.add_marker(pytest.mark.db)


@pytest.fixture(autouse=True)
def _clear_caption_cache():
    """Vision captions are cached on disk; a test must not seed the next one."""
    try:
        from app.platform.caption_cache import cache_root
    except Exception:
        yield
        return
    shutil.rmtree(cache_root(), ignore_errors=True)
    yield
    shutil.rmtree(cache_root(), ignore_errors=True)


@pytest.fixture(scope="session", autouse=True)
def _prepared_test_db(request: pytest.FixtureRequest):
    """Create eea_test if absent, migrate it to head (repeat-safe), and hold
    the cross-process session lock for the whole run (B6 独占执行)."""
    global _TEST_LOCK_FILE
    if not _session_needs_db(request.session):
        yield
        shutil.rmtree(_OBJECT_DIR, ignore_errors=True)
        return
    _ensure_app_imported()
    _acquire_suite_lock()
    if not _pg_is_up():
        external_marker = BACKEND_ROOT / ".pg" / "use-external-db"
        portable_data = BACKEND_ROOT / ".pg" / "data"
        if external_marker.is_file() and not portable_data.is_dir():
            raise RuntimeError(
                "PostgreSQL is not reachable for eea_test. On macOS/Linux, start your "
                "local PostgreSQL service, confirm DB_HOST/DB_PORT/DB_USER in backend/.env, "
                "then re-run pytest. See README.md at repo root."
            )
        # Portable Windows dev: start bundled PostgreSQL (if needed) and background API
        subprocess.run(
            [sys.executable, str(BACKEND_ROOT / "scripts" / "start_api.py")],
            check=True,
            cwd=str(BACKEND_ROOT),
            timeout=180,
        )
        if not _pg_is_up():
            raise RuntimeError(
                "PostgreSQL still unreachable after scripts/start_api.py; "
                "check backend/.pg/api.log and DB_* settings."
            )
    _create_test_db()
    _run_migrations()
    with _SYNC_ENGINE.begin() as conn:
        _seed_reference_data(conn)
    yield
    shutil.rmtree(_OBJECT_DIR, ignore_errors=True)
    # the OS releases the lock when the session process exits; close the
    # handle explicitly anyway so a session-2 re-run inside the same
    # interpreter (pytest.main twice) also works
    if _TEST_LOCK_FILE is not None:
        _TEST_LOCK_FILE.close()
        _TEST_LOCK_FILE = None


def _pg_is_up() -> bool:
    try:
        with psycopg.connect(_ADMIN_DSN, connect_timeout=3):
            return True
    except psycopg.OperationalError:
        return False


def _create_test_db() -> None:
    with psycopg.connect(_ADMIN_DSN, autocommit=True) as conn:
        exists = conn.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s", (TEST_DB_NAME,)
        ).fetchone()
        if not exists:
            conn.execute(f'CREATE DATABASE "{TEST_DB_NAME}"')


def _current_revision() -> str | None:
    with _SYNC_ENGINE.connect() as conn:
        try:
            return conn.execute(text("SELECT version_num FROM alembic_version")).scalar_one_or_none()
        except Exception:
            return None


def _run_migrations() -> None:
    cfg = AlembicConfig()
    cfg.set_main_option("script_location", str(BACKEND_ROOT / "migrations"))
    head = ScriptDirectory.from_config(cfg).get_current_head()
    if head is not None and _current_revision() == head:
        return
    command.upgrade(cfg, "head")


def _seed_reference_data(conn) -> None:
    if conn.execute(text("SELECT 1 FROM eea_ref_code LIMIT 1")).first() is None:
        for domain, items in REF_CODES.items():
            for item in items:
                conn.execute(
                    text(
                        "INSERT INTO eea_ref_code (domain, code, label, fixture_alias) "
                        "VALUES (:domain, :code, :label, :alias)"
                    ),
                    {
                        "domain": domain,
                        "code": item[0],
                        "label": item[1],
                        "alias": item[2] if len(item) > 2 else None,
                    },
                )


def _reseed_domain_vocab(conn) -> None:
    conn.execute(
        text(
            "INSERT INTO eea_vocab (id, kind, name) "
            "SELECT gen_random_uuid(), 'domain', name FROM unnest(CAST(:names AS text[])) AS name"
        ),
        {"names": list(_DOMAIN_VOCAB)},
    )


@pytest.fixture(autouse=True)
def _clean_database(request: pytest.FixtureRequest):
    """Each db test starts from empty business tables; closed ref codes persist for the session."""
    if not _item_needs_db(request.node):
        yield
        return
    _ensure_app_imported()
    with _SYNC_ENGINE.begin() as conn:
        conn.execute(_TRUNCATE_SQL)
        _reseed_domain_vocab(conn)
    yield


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    """FastAPI's documented async test pattern: httpx AsyncClient over
    ASGITransport (fastapi.tiangolo.com/advanced/async-tests/)."""
    _ensure_app_imported()
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
