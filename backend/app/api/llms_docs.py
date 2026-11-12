"""OpenAPI schema walkers and render helpers (library only; not mounted as HTTP).

Production serves Swagger UI at ``/`` and ``/docs`` plus ``GET /openapi.json``.
These functions remain for tests or future offline doc export from
``app.openapi()``.

Bullet form (llmstxt.org full-content variant): ``[METHOD /path](absolute
URL)`` as the required hyperlink, then ``: `` and the route description —
``Summary — <inline docs>``. The inline docs carry everything an agent needs
to call the endpoint without a second fetch: every path/query parameter with
its type, format and constraints; the request body schema with EVERY field
(required and optional) typed, with enum values, numeric bounds and defaults;
and the success response schema with its full field list. $ref-typed fields
expand one level (the referenced schema's fields inline) so each note stands
alone; refs nested deeper render as bare schema names.
"""

from __future__ import annotations

import json
from html import escape
from typing import NamedTuple
from urllib.parse import urljoin

# Methods in the fixed order every route listing uses.
_METHOD_ORDER = ("get", "post", "put", "patch", "delete")

# Route groups in router-include order (app/main.py); ``healthz`` is served
# in the llms.txt Optional section instead of its own heading.
_GROUP_ORDER = (
    "overview",
    "vocab",
    "signals",
    "themes",
    "demands",
    "functions",
    "landing-points",
    "panorama",
    "strategy",
    "trace",
    "audit",
    "ref-codes",
)

_API_PREFIX = "/api/v1/"

# Secondary links an agent may skip when context is tight (llmstxt.org
# Optional convention); /healthz joins them from the schema walk.
_OPTIONAL_LINKS = (
    ("/docs", "Interactive API documentation (Swagger UI)"),
    ("/openapi.json", "Machine-readable OpenAPI schema — the single source this file is generated from"),
)


class Route(NamedTuple):
    """One operation from the schema walk."""

    method: str  # lowercase HTTP method, e.g. "get"
    path: str  # schema path, e.g. "/api/v1/signals"
    op: dict  # the OpenAPI operation object


def group_of(path: str) -> str:
    """/healthz -> healthz; otherwise the first segment after /api/v1/."""
    if path == "/healthz":
        return "healthz"
    if path.startswith(_API_PREFIX) and len(path) > len(_API_PREFIX):
        return path[len(_API_PREFIX):].split("/", 1)[0]
    return path.strip("/").split("/", 1)[0] or "root"


def walk(spec: dict) -> dict[str, list[Route]]:
    """Every operation grouped by ``group_of``: paths in sorted order, methods
    in ``_METHOD_ORDER`` — the single walk both pages render from."""
    groups: dict[str, list[Route]] = {}
    for path in sorted(spec.get("paths", {})):
        item = spec["paths"][path]
        for method in _METHOD_ORDER:
            if method in item:
                groups.setdefault(group_of(path), []).append(Route(method, path, item[method]))
    return groups


def group_order(spec: dict) -> list[str]:
    """Walk groups in the fixed order: documented groups first (router
    include order), unknown groups sorted next, healthz last — the slot the
    llms.txt Optional section holds."""
    groups = walk(spec)
    ordered = [name for name in _GROUP_ORDER if name in groups]
    ordered += sorted(
        name for name in groups if name not in _GROUP_ORDER and name != "healthz"
    )
    if "healthz" in groups:
        ordered.append("healthz")
    return ordered


# --- schema resolution -------------------------------------------------


def _ref_name(schema: dict) -> str | None:
    """Resolve a $ref to its trailing schema name, unwrapping array items
    (FastAPI renders ``list[SignalOut]`` as ``{type: array, items: {$ref}}``)."""
    while isinstance(schema, dict):
        if "$ref" in schema:
            return str(schema["$ref"]).rsplit("/", 1)[-1]
        if schema.get("type") == "array" and isinstance(schema.get("items"), dict):
            schema = schema["items"]
            continue
        break
    return None


def _resolve(ref: str, spec: dict) -> dict | None:
    """Look up a ``#/components/schemas/<name>`` reference in the spec."""
    schema = spec.get("components", {}).get("schemas", {}).get(str(ref).rsplit("/", 1)[-1])
    return schema if isinstance(schema, dict) else None


def _ref_target(schema: dict, spec: dict) -> tuple[str, dict | None] | None:
    """(display name, schema) when a field is a $ref, an array of a $ref, or
    a nullable $ref — the three shapes Pydantic emits for related-model
    fields; the display carries ``[]`` for arrays."""
    if not isinstance(schema, dict):
        return None
    if "$ref" in schema:
        name = _ref_name(schema)
        return (name, _resolve(schema["$ref"], spec)) if name else None
    items = schema.get("items")
    if schema.get("type") == "array" and isinstance(items, dict) and "$ref" in items:
        name = _ref_name(items)
        return (name + "[]", _resolve(items["$ref"], spec)) if name else None
    for key in ("anyOf", "oneOf"):
        branches = [b for b in schema.get(key, []) if isinstance(b, dict) and b.get("type") != "null"]
        if len(branches) == 1 and "$ref" in branches[0]:
            name = _ref_name(branches[0])
            return (name, _resolve(branches[0]["$ref"], spec)) if name else None
    return None


def _num(value) -> str:
    """Render 4.0 as 4 — OpenAPI serializes integer bounds as floats."""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def _default_str(value) -> str:
    """Defaults render as the JSON an agent would send (strings bare, the
    empty string quoted so it stays visible)."""
    if isinstance(value, str):
        return value or '""'
    return json.dumps(value, ensure_ascii=False)


def _type_str(schema: dict, spec: dict) -> str:
    """The bare type: $ref names, array items with ``[]``, the non-null
    branch of anyOf/oneOf, the declared type plus format, ``any`` otherwise."""
    if not isinstance(schema, dict):
        return "any"
    if "$ref" in schema:
        return _ref_name(schema) or "any"
    if schema.get("type") == "array":
        item = schema.get("items")
        return _type_str(item, spec) + "[]" if isinstance(item, dict) else "array"
    if "type" in schema:
        base = str(schema["type"])
        fmt = schema.get("format")
        return f"{base} {fmt}" if fmt else base
    for key in ("anyOf", "oneOf"):
        branches = [b for b in schema.get(key, []) if isinstance(b, dict) and b.get("type") != "null"]
        if branches:
            return " or ".join(_type_str(branch, spec) for branch in branches)
    return "any"


def _constraints(schema: dict) -> list[str]:
    """Enum values, numeric bounds and default, in that order."""
    parts = []
    if "enum" in schema:
        parts.append("enum: " + "|".join(str(value) for value in schema["enum"]))
    lo, hi = schema.get("minimum"), schema.get("maximum")
    if lo is not None and hi is not None:
        parts.append(f"{_num(lo)}-{_num(hi)}")
    elif lo is not None:
        parts.append(f">={_num(lo)}")
    elif hi is not None:
        parts.append(f"<={_num(hi)}")
    if "default" in schema:
        parts.append("default: " + _default_str(schema["default"]))
    return parts


def _descriptor(schema: dict, spec: dict) -> str:
    """A value's full contract: type (with format), enum values, numeric
    bounds, default. Nullable fields carry constraints on their single
    non-null anyOf/oneOf branch, so both places are checked."""
    parts = [_type_str(schema, spec)]
    holders = [schema]
    for key in ("anyOf", "oneOf"):
        branches = [b for b in schema.get(key, []) if isinstance(b, dict) and b.get("type") != "null"]
        if len(branches) == 1:
            holders.append(branches[0])
    seen: set[str] = set()
    for holder in holders:
        for part in _constraints(holder):
            if part not in seen:
                seen.add(part)
                parts.append(part)
    return " ".join(parts)


def _fields_note(schema: dict, spec: dict, expand: bool = True) -> str:
    """``{name (type [constraints], required|optional), ...}`` — every
    property of an object schema, in schema order. $ref-typed fields expand
    one level (their own field list inline) so a note stands alone without a
    second fetch; refs nested deeper render as bare names."""
    props = schema.get("properties") or {}
    if not props:
        return ""
    required = set(schema.get("required") or [])
    parts = []
    for name, prop in props.items():
        marker = "required" if name in required else "optional"
        target = _ref_target(prop, spec) if expand else None
        if target:
            display, ref_schema = target
            inner = _fields_note(ref_schema, spec, expand=False) if ref_schema else ""
            head = f"{display} {inner}" if inner else display
            parts.append(f"{name} ({head}, {marker})")
        else:
            parts.append(f"{name} ({_descriptor(prop, spec)}, {marker})")
    return "{" + ", ".join(parts) + "}"


# --- per-operation notes ------------------------------------------------


def _success_status(op: dict) -> str | None:
    """The lowest 2xx status an operation declares (FastAPI emits 200/201)."""
    statuses = []
    for status in op.get("responses", {}):
        try:
            code = int(status)
        except (TypeError, ValueError):
            continue
        if 200 <= code < 300:
            statuses.append((code, str(status)))
    return min(statuses)[1] if statuses else None


def _pick_media(content: dict) -> tuple[str, dict]:
    """The media type a response note documents: JSON when it carries a
    schema, otherwise the first media that does (FastAPI merges custom
    response entries into the default content dict, so an endpoint can end
    up with several media types — e.g. an empty application/json next to the
    documented text/plain)."""
    json_payload = content.get("application/json")
    if isinstance(json_payload, dict) and json_payload.get("schema"):
        return "application/json", json_payload
    with_schema = [
        (media, payload)
        for media, payload in content.items()
        if isinstance(payload, dict) and payload.get("schema")
    ]
    if with_schema:
        return with_schema[0]
    return next(iter(content.items()))


def _params_note(op: dict, spec: dict) -> str:
    """``name (type [format] [constraints], required|optional), ...`` for
    every path/query parameter."""
    parts = []
    for param in op.get("parameters", []):
        marker = "required" if param.get("required") else "optional"
        parts.append(
            f"{param.get('name', '')} ({_descriptor(param.get('schema', {}), spec)}, {marker})"
        )
    return ", ".join(parts)


def _body_note(spec: dict, op: dict) -> str:
    """``body: SignalCreate {title (string, required), ...}`` — the request
    schema name plus EVERY field (required and optional), each with its type,
    enum values, bounds and default."""
    body = op.get("requestBody") or {}
    schema = (body.get("content", {}).get("application/json", {}) or {}).get("schema", {})
    ref = schema.get("$ref") if isinstance(schema, dict) else None
    if not ref:
        return "body: JSON" if body else ""
    name = str(ref).rsplit("/", 1)[-1]
    resolved = _resolve(ref, spec)
    if resolved:
        fields = _fields_note(resolved, spec)
        return f"body: {name} {fields}" if fields else f"body: {name}"
    return f"body: {name}"


def _response_note(spec: dict, op: dict) -> str:
    """``200 -> SignalDetail {fields}`` / ``200 -> SignalOut[] {fields}`` /
    ``200 -> text/plain string`` — the success status with the response
    schema name and its full field list (arrays unwrapped to the item
    schema), or the media type for non-JSON bodies. A response with no
    schema at all (healthz) renders as the bare status."""
    status = _success_status(op)
    if not status:
        return ""
    content = op["responses"][status].get("content", {})
    if not content:
        return status
    media, payload = _pick_media(content)
    schema = (payload or {}).get("schema", {})
    if media != "application/json":
        descriptor = _descriptor(schema, spec) if schema else ""
        return f"{status} -> {media} {descriptor}".rstrip()
    name = _ref_name(schema)
    if not name:
        return status
    is_array = isinstance(schema, dict) and schema.get("type") == "array"
    display = name + ("[]" if is_array else "")
    resolved = _resolve(f"#/components/schemas/{name}", spec)
    if resolved:
        fields = _fields_note(resolved, spec)
        return f"{status} -> {display} {fields}" if fields else f"{status} -> {display}"
    return f"{status} -> {display}"


def route_notes(spec: dict, route: Route) -> str:
    """Full inline docs for one operation: parameters, request body (every
    field with its contract) and success response (with its field list)."""
    notes = [
        note
        for note in (
            _params_note(route.op, spec),
            _body_note(spec, route.op),
            _response_note(spec, route.op),
        )
        if note
    ]
    return "; ".join(notes)


def route_label(route: Route) -> str:
    """``GET /api/v1/signals — List Signals``: method, path and summary in
    the one string the HTML route listing uses."""
    summary = route.op.get("summary") or route.op.get("operationId") or ""
    return f"{route.method.upper()} {route.path} — {summary}"


# --- page-level prose ----------------------------------------------------


def summary_line(spec: dict, base_url: str) -> str:
    """The one-line fact sheet both pages show: what the API is, how it
    speaks, where it lives, where the schema and docs are, which version."""
    parts = [
        "REST API for the EEA signal-to-strategy pipeline — JSON over HTTP.",
        f"Base URL: {base_url}",
        f"Machine-readable schema at {urljoin(base_url, '/openapi.json')};",
        f"interactive docs at {urljoin(base_url, '/docs')}.",
    ]
    version = spec.get("info", {}).get("version")
    if version:
        parts.append(f"Version {version}.")
    return " ".join(part if part.endswith((".", ";")) else part + "." for part in parts)


def orientation_paragraph(spec: dict) -> str:
    """One orientation paragraph between the blockquote and the first H2.
    The checkable claims derive from the schema, so they cannot go stale:
    the /api/v1 prefix, the absence of security schemes, and the 422
    validation-error contract are all read from the spec, not asserted."""
    sentences = []
    paths = spec.get("paths", {})
    if paths and all(p.startswith("/api/v1") for p in paths if p != "/healthz"):
        sentences.append("All data routes live under /api/v1.")
    if not spec.get("components", {}).get("securitySchemes"):
        sentences.append("No authentication is required (the schema defines no security schemes).")
    sentences.append("Request and response bodies are JSON.")
    if "HTTPValidationError" in spec.get("components", {}).get("schemas", {}):
        sentences.append("Validation errors return HTTP 422 with the HTTPValidationError schema.")
    return " ".join(sentences)


def _bullet(spec: dict, route: Route, base_url: str) -> str:
    """One llms.txt bullet in the standard's form: ``[METHOD /path]`` as the
    required hyperlink to the endpoint's absolute URL, then ``: `` and the
    route description — summary first, then the full inline docs."""
    url = urljoin(base_url, route.path)
    summary = route.op.get("summary") or route.op.get("operationId") or ""
    notes = route_notes(spec, route)
    if notes:
        return f"- [{route.method.upper()} {route.path}]({url}): {summary} — {notes}"
    return f"- [{route.method.upper()} {route.path}]({url}): {summary}"


def render_llms_txt(spec: dict, base_url: str) -> str:
    """The full-content llms.txt (llmstxt.org): H1 from ``info.title``, a
    blockquote summary, an orientation paragraph, one H2 per route group
    with every operation documented inline, and the closing Optional
    section."""
    title = spec.get("info", {}).get("title", "API")
    lines = [f"# {title}", "", f"> {summary_line(spec, base_url)}", ""]
    orientation = orientation_paragraph(spec)
    if orientation:
        lines += [orientation, ""]
    groups = walk(spec)
    for name in group_order(spec):
        if name == "healthz":
            continue  # served in the Optional section, not its own H2
        lines.append(f"## {name}")
        lines.append("")
        lines.extend(_bullet(spec, route, base_url) for route in groups[name])
        lines.append("")
    lines.append("## Optional")
    lines.append("")
    for path, description in _OPTIONAL_LINKS:
        lines.append(f"- [{path}]({urljoin(base_url, path)}): {description}")
    if "healthz" in groups:
        for route in groups["healthz"]:
            lines.append(_bullet(spec, route, base_url))
    lines.append("")
    return "\n".join(lines)


def _html_route_item(spec: dict, route: Route, base_url: str) -> str:
    """One operation as HTML: linked method/path, summary, full inline contract."""
    url = escape(urljoin(base_url, route.path))
    label = escape(route_label(route))
    summary = escape(route.op.get("summary") or route.op.get("operationId") or "")
    notes = escape(route_notes(spec, route))
    anchor = escape(f"{route.method}-{route.path.strip('/').replace('/', '-')}")
    head = f'<a href="{url}"><code>{label}</code></a>'
    body = f"<p class=\"route-notes\">{notes}</p>" if notes else ""
    return f'<li id="{anchor}"><p class="route-head">{head} — {summary}</p>{body}</li>'


def _html_group_section(spec: dict, name: str, routes: list[Route], base_url: str) -> str:
    items = "".join(_html_route_item(spec, route, base_url) for route in routes)
    return f"<h2>{escape(name)}</h2>\n<ul class=\"routes\">\n{items}\n</ul>\n"


def _html_optional_section(spec: dict, groups: dict[str, list[Route]], base_url: str) -> str:
    lines = [
        f'<li><a href="{escape(urljoin(base_url, path))}"><code>{escape(path)}</code></a>'
        f" — {escape(desc)}</li>"
        for path, desc in _OPTIONAL_LINKS
    ]
    if "healthz" in groups:
        for route in groups["healthz"]:
            lines.append(_html_route_item(spec, route, base_url))
    return "<h2>Optional</h2>\n<ul class=\"optional\">\n" + "\n".join(lines) + "\n</ul>\n"


_HTML = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="OpenAPI-derived API reference for LLM agents (llmstxt.org full content).">
<title>{title} — OpenAPI for LLMs</title>
<style>
body {{ font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.55; max-width: 52rem; margin: 2rem auto; padding: 0 1.25rem; color: #111; }}
h1 {{ margin-bottom: 0.5rem; font-size: 1.75rem; }}
h2 {{ margin-top: 2rem; font-size: 1.15rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25rem; }}
blockquote {{ margin: 1rem 0; padding: 0.75rem 1rem; background: #f9fafb; border-left: 4px solid #6b7280; }}
.meta {{ font-size: 0.95rem; color: #374151; }}
.meta a {{ color: #1d4ed8; }}
.routes li, .optional li {{ margin: 1rem 0; list-style: none; }}
.routes {{ padding-left: 0; }}
.route-head {{ margin: 0; font-weight: 600; }}
.route-notes {{ margin: 0.35rem 0 0; font-size: 0.9rem; color: #374151; word-break: break-word; }}
code {{ background: #f3f4f6; padding: 0.12rem 0.35rem; border-radius: 4px; font-size: 0.88em; }}
</style>
</head>
<body>
<h1>{title}</h1>
<blockquote><p>{summary}</p></blockquote>
<p class="meta">{orientation}</p>
<p class="meta">Machine surfaces: <a href="/llms.txt">/llms.txt</a> (Markdown),
<a href="/openapi.json">/openapi.json</a> (OpenAPI 3 schema), <a href="/">/</a> and
<a href="/docs">/docs</a> (Swagger UI with deep links).</p>
{sections}
{optional}
</body>
</html>
"""


def render_index_html(spec: dict, base_url: str) -> str:
    """HTML index at ``/``: same full-content contract as ``/llms.txt`` (every
    parameter, body field and response field inlined per operation). No JS,
    no external assets."""
    title = escape(spec.get("info", {}).get("title", "API"))
    orientation = escape(orientation_paragraph(spec))
    groups = walk(spec)
    sections = []
    for name in group_order(spec):
        if name == "healthz":
            continue
        if name not in groups:
            continue
        sections.append(_html_group_section(spec, name, groups[name], base_url))
    optional = _html_optional_section(spec, groups, base_url)
    return _HTML.format(
        title=title,
        summary=escape(summary_line(spec, base_url)),
        orientation=orientation,
        sections="\n".join(sections),
        optional=optional,
    )
