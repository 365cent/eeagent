"""API documentation surface: Swagger UI + OpenAPI JSON only."""

import pytest

from app.main import app

pytestmark = pytest.mark.anyio


def _spec() -> dict:
    return app.openapi()


async def test_swagger_ui(client):
    """GET / and /docs serve SwaggerUIBundle with deep linking and /openapi.json."""
    for path in ("/", "/docs"):
        r = await client.get(path)
        assert r.status_code == 200, path
        html = r.text
        assert "swagger-ui-dist@4.5.0" in html
        assert "deepLinking: true" in html
        assert "url: '/openapi.json'" in html
        assert "SwaggerUIBundle" in html


async def test_docs_routes_not_in_openapi(client):
    spec = _spec()
    assert "/" not in spec["paths"]
    assert "/docs" not in spec["paths"]
    assert "/llms.txt" not in spec["paths"]


async def test_llms_txt_removed(client):
    r = await client.get("/llms.txt")
    assert r.status_code == 404


async def test_docs_surface(client):
    """OpenAPI JSON and health remain; llms alternate pages are gone."""
    spec = _spec()
    for route in ("/healthz", "/openapi.json"):
        r = await client.get(route)
        assert r.status_code == 200, route
    body = r.json()
    assert body["openapi"].startswith("3.0.")
    assert body["paths"] == spec["paths"]
    r = await client.get("/api/v1/ref-codes")
    assert r.status_code == 200
