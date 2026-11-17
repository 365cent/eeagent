"""API documentation surface: Swagger UI + OpenAPI JSON only."""

import pytest

from app.main import app

pytestmark = [pytest.mark.anyio, pytest.mark.no_db]


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


async def test_docs_routes_and_llms_txt(client):
    spec = _spec()
    assert "/" not in spec["paths"]
    assert "/docs" not in spec["paths"]
    assert "/llms.txt" not in spec["paths"]
    assert (await client.get("/llms.txt")).status_code == 404


async def test_openapi_json_matches_in_process_spec(client):
    r = await client.get("/openapi.json")
    assert r.status_code == 200
    body = r.json()
    assert body["openapi"].startswith("3.0.")
    assert body["paths"] == _spec()["paths"]