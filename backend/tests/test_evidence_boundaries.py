"""The ingestion layer must remain usable without HTTP router imports."""
import re
from pathlib import Path
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.domains.evidence import signal_queries

pytestmark = pytest.mark.no_db
APP_DIR = Path(__file__).resolve().parents[1] / "app"

_API_IMPORT = re.compile(
    r"^\s*(?:from\s+app\.api(?:\.\w+)*\s+import|import\s+app\.api(?:\.\w+)*)",
    re.MULTILINE,
)

# Ingestion paths only — full services→API rule stays in import-linter (contracts slice).
_INGESTION_PATHS = (
    [APP_DIR / "api/v1/capture.py"]
    + sorted((APP_DIR / "domains/evidence").glob("*.py"))
    + sorted((APP_DIR / "domains/capture").glob("*.py"))
)


def test_capture_and_ingestion_do_not_import_api_routes() -> None:
    violations: list[str] = []
    for path in _INGESTION_PATHS:
        if path.name.startswith("_"):
            continue
        text = path.read_text(encoding="utf-8")
        for match in _API_IMPORT.finditer(text):
            line = text.count("\n", 0, match.start()) + 1
            violations.append(f"{path.relative_to(APP_DIR)}:{line}: {match.group(0).strip()}")
    assert not violations, "\n".join(violations)


@pytest.mark.anyio
async def test_missing_signal_detail_returns_none(monkeypatch) -> None:
    find_signal = AsyncMock(return_value=None)
    monkeypatch.setattr(signal_queries, "find_signal", find_signal)
    db = object()
    signal_id = uuid4()

    assert await signal_queries.get_signal_detail(db, signal_id) is None
    find_signal.assert_awaited_once_with(db, signal_id)
