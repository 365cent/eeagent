import sys

if sys.platform == "win32":
    import asyncio

    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.api.llms_docs import render_index_html, render_llms_txt
from app.api.v1 import (
    agent,
    capture,
    imports,
    demands,
    documents,
    functions,
    landing_points,
    llm,
    overview,
    panorama,
    session,
    signals,
    standards,
    strategy,
    themes,
    trace,
    vocab,
)
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins,
        allow_origin_regex=settings.cors_origin_regex or None,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # v1 routers are included directly (not via a mounted sub-app) so that the
    # root /openapi.json and /docs list every /api/v1 route, not just /healthz.
    app.include_router(overview.router, prefix="/api/v1")
    app.include_router(vocab.router, prefix="/api/v1")
    app.include_router(capture.router, prefix="/api/v1")
    app.include_router(imports.router, prefix="/api/v1")
    app.include_router(signals.router, prefix="/api/v1")
    app.include_router(documents.router, prefix="/api/v1")
    app.include_router(themes.router, prefix="/api/v1")
    app.include_router(demands.router, prefix="/api/v1")
    app.include_router(functions.router, prefix="/api/v1")
    app.include_router(landing_points.router, prefix="/api/v1")
    app.include_router(panorama.router, prefix="/api/v1")
    app.include_router(standards.router, prefix="/api/v1")
    app.include_router(strategy.router, prefix="/api/v1")
    app.include_router(trace.router, prefix="/api/v1")
    app.include_router(llm.router, prefix="/api/v1")
    app.include_router(session.router, prefix="/api/v1")
    app.include_router(agent.router, prefix="/api/v1")

    @app.get("/healthz")
    async def healthz():
        return {"status": "ok", "service": settings.app_name}

    # LLM-friendly docs, generated from the app's own OpenAPI schema: the
    # handlers read request.app.openapi() (memoized by FastAPI) and
    # request.base_url, so every route line derives from the schema walk in
    # app/api/llms_docs.py — there is no hand-maintained route list. Both
    # routes stay out of the schema (include_in_schema=False) so /docs and
    # /openapi.json keep serving exactly the /api/v1 surface, and the
    # rendered pages are cached per base URL, not rebuilt on every request.
    _docs_cache: dict[str, dict] = {}

    def _rendered_docs(request: Request) -> dict:
        spec = request.app.openapi()
        base_url = str(request.base_url)
        cached = _docs_cache.get(base_url)
        if cached is None or cached["spec"] is not spec:
            cached = {
                "spec": spec,
                "llms_txt": render_llms_txt(spec, base_url),
                "index_html": render_index_html(spec, base_url),
            }
            _docs_cache[base_url] = cached
        return cached

    @app.get("/llms.txt", include_in_schema=False)
    async def llms_txt(request: Request) -> Response:
        return Response(
            content=_rendered_docs(request)["llms_txt"], media_type="text/markdown"
        )

    @app.get("/", include_in_schema=False)
    async def index(request: Request) -> HTMLResponse:
        return HTMLResponse(content=_rendered_docs(request)["index_html"])

    return app


app = create_app()
