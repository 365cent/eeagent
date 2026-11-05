"""LLM-friendly docs pages (/llms.txt and /): rendered from the app's own
OpenAPI schema, so they cannot drift from the registered routes.

Every expectation re-derives from ``app.openapi()`` inside the test — the
H1 title, the route groups, each operation's link text and summary, and
every field name, enum value, format and parameter name the schema carries
— so any route or schema change that misses the docs pages fails here
rather than in production. No route or field list is kept in this file.
"""

import pytest

from app.main import app

pytestmark = pytest.mark.anyio

_METHODS = ("get", "post", "put", "patch", "delete")
_API_PREFIX = "/api/v1/"
# the three doc links the HTML index must carry
_LINKS = ("/llms.txt", "/docs", "/openapi.json")


def _spec() -> dict:
    """The schema both pages are generated from — the same dict
    ``request.app.openapi()`` serves at /openapi.json."""
    return app.openapi()


def _operations(spec: dict):
    """Every (METHOD, path, summary) in the schema."""
    for path, item in spec["paths"].items():
        for method in _METHODS:
            if method in item:
                summary = item[method]["summary"]
                assert summary, f"{method.upper()} {path} carries no summary"
                yield method.upper(), path, summary


def _groups(spec: dict) -> set[str]:
    """The H2 groups: /healthz lives in the llms.txt Optional section (not
    its own heading); every other path groups by its first segment after
    the /api/v1/ prefix."""
    names = set()
    for path in spec["paths"]:
        if path == "/healthz":
            continue
        assert path.startswith(_API_PREFIX), f"route outside {_API_PREFIX}: {path}"
        names.add(path[len(_API_PREFIX):].split("/", 1)[0])
    return names


def _success_status(op: dict) -> str | None:
    codes = [
        (int(status), str(status))
        for status in op.get("responses", {})
        if str(status).isdigit() and 200 <= int(status) < 300
    ]
    return min(codes)[1] if codes else None


def _documented_facts(spec: dict) -> tuple[set[str], set[str], set[str]]:
    """(field names, enum values, formats) the docs must list: every
    property of each operation's request-body schema and success-response
    schema, plus every parameter name — the full-content contract."""
    fields: set[str] = set()
    enums: set[str] = set()
    formats: set[str] = set()
    components = spec["components"]["schemas"]

    def _collect(schema: dict) -> None:
        for name, prop in (schema.get("properties") or {}).items():
            fields.add(name)
            if isinstance(prop, dict):
                if "enum" in prop:
                    enums.update(str(value) for value in prop["enum"])
                if prop.get("format"):
                    formats.add(str(prop["format"]))

    for path, item in spec["paths"].items():
        for method in _METHODS:
            op = item.get(method)
            if op is None:
                continue
            for param in op.get("parameters", []):
                fields.add(str(param.get("name", "")))
                schema = param.get("schema") or {}
                if schema.get("format"):
                    formats.add(str(schema["format"]))
            body = (op.get("requestBody") or {}).get("content", {}).get("application/json", {})
            body_schema = body.get("schema", {})
            if isinstance(body_schema, dict) and "$ref" in body_schema:
                _collect(components.get(str(body_schema["$ref"]).rsplit("/", 1)[-1], {}))
            status = _success_status(op)
            if status:
                content = op["responses"][status].get("content", {})
                schema = content.get("application/json", {}).get("schema", {})
                if isinstance(schema, dict):
                    target = schema
                    if target.get("type") == "array" and isinstance(target.get("items"), dict):
                        target = target["items"]
                    if "$ref" in target:
                        _collect(components.get(str(target["$ref"]).rsplit("/", 1)[-1], {}))
    return fields, enums, formats


async def test_llms_txt_full_content(client):
    """/llms.txt: markdown per llmstxt.org — H1 title, an H2 per group, the
    standard's bullet form for every operation ([METHOD /path] link plus
    ': Summary' description), and every field, enum value and format the
    schema constrains, so an agent never needs a second fetch."""
    spec = _spec()
    r = await client.get("/llms.txt")
    assert r.status_code == 200
    assert r.headers["content-type"].split(";")[0] == "text/markdown"
    body = r.text
    assert body.startswith(f"# {spec['info']['title']}")
    for name in _groups(spec):
        assert f"## {name}" in body
    for method, path, summary in _operations(spec):
        assert f"[{method} {path}]" in body, (method, path)  # the required hyperlink
        assert f": {summary}" in body, (method, path)  # the description's lead
    fields, enums, formats = _documented_facts(spec)
    for field in sorted(fields):
        assert field in body, field
    for value in sorted(enums):
        assert value in body, value
    for fmt in sorted(formats):
        assert fmt in body, fmt


async def test_index_html(client):
    """GET /: simple server-rendered HTML — the same routes as /llms.txt
    plus links to /llms.txt, /docs and /openapi.json; no JS, no assets."""
    spec = _spec()
    r = await client.get("/")
    assert r.status_code == 200
    assert r.headers["content-type"].split(";")[0] == "text/html"
    html = r.text
    assert html.startswith("<!doctype html>")
    assert f"<title>{spec['info']['title']}</title>" in html
    assert "<script" not in html
    assert "<link" not in html
    for link in _LINKS:
        assert f'href="{link}"' in html
    for method, path, summary in _operations(spec):
        assert f"{method} {path} — {summary}" in html


async def test_docs_surface_unchanged(client):
    """The new pages stay out of the schema and the existing surface keeps
    serving: /docs, /redoc, /healthz, /openapi.json and the /api/v1 routes
    exactly as before."""
    spec = _spec()
    assert "/llms.txt" not in spec["paths"]
    assert "/" not in spec["paths"]
    for route in ("/docs", "/redoc", "/healthz", "/openapi.json"):
        r = await client.get(route)
        assert r.status_code == 200, route
    r = await client.get("/openapi.json")
    assert r.json()["paths"] == spec["paths"]
    r = await client.get("/api/v1/ref-codes")
    assert r.status_code == 200
