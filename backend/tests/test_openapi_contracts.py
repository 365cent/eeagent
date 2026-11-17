"""Static OpenAPI contracts — no database reset per test (see test_openapi_snapshot for full inventory)."""

from __future__ import annotations

import pytest

pytestmark = pytest.mark.no_db

THEME_PATHS = {
    "/api/v1/themes",
    "/api/v1/themes/cluster-report",
    "/api/v1/themes/name-suggestion",
    "/api/v1/themes/{theme_id}",
}
THEME_METHODS = {
    "/api/v1/themes": {"get", "post"},
    "/api/v1/themes/cluster-report": {"get"},
    "/api/v1/themes/name-suggestion": {"post"},
    "/api/v1/themes/{theme_id}": {"get", "patch", "delete"},
}

DEMAND_PATHS = {
    "/api/v1/demands",
    "/api/v1/demands/assistant/draft",
    "/api/v1/demands/assistant/messages",
    "/api/v1/demands/{demand_id}",
}
DEMAND_METHODS = {
    "/api/v1/demands": {"get", "post"},
    "/api/v1/demands/assistant/draft": {"post"},
    "/api/v1/demands/assistant/messages": {"post"},
    "/api/v1/demands/{demand_id}": {"get", "patch", "delete"},
}


def _openapi_paths() -> dict:
    from app.main import app

    return app.openapi()["paths"]


def test_theme_routes_expose_only_expected_operations() -> None:
    paths = _openapi_paths()
    exposed = {p for p in paths if "themes" in p}
    assert exposed == THEME_PATHS
    for path, allowed in THEME_METHODS.items():
        assert set(paths[path]) <= allowed


def test_demand_routes_expose_only_expected_operations() -> None:
    paths = _openapi_paths()
    exposed = {p for p in paths if "demands" in p}
    assert exposed == DEMAND_PATHS
    for path, allowed in DEMAND_METHODS.items():
        assert set(paths[path]) <= allowed