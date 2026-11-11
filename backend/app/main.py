import asyncio
import os
import sys
from contextlib import asynccontextmanager

from app.core.bootstrap_env import bootstrap_environment

bootstrap_environment()

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from app.api.swagger_ui import SWAGGER_UI_HTML
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
from app.platform.errors import DomainError


def create_app() -> FastAPI:
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        worker_stop = asyncio.Event()
        worker_task: asyncio.Task | None = None
        embed = settings.app_env != "production" and os.environ.get("EEA_CAPTURE_EMBEDDED", "1").lower() not in (
            "0",
            "false",
            "no",
        )
        if embed and os.environ.get("EEA_DEV_API_ONLY", "").lower() not in ("1", "true", "yes"):
            from app.services.capture_jobs import worker_loop

            worker_task = asyncio.create_task(worker_loop(worker_stop), name="eea-capture-worker")
        yield
        if worker_task is not None:
            worker_stop.set()
            worker_task.cancel()
            try:
                await worker_task
            except asyncio.CancelledError:
                pass

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
    )
    # Swagger UI 4.5 (bundled at /) only accepts openapi: 3.0.x — FastAPI defaults to 3.1.0.
    app.openapi_version = "3.0.2"

    @app.exception_handler(DomainError)
    async def domain_error_handler(_request: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

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

    # OpenAPI explorer: Swagger UI loads /openapi.json (deep-linkable #/tag/op).
    # No separate llms.txt or static HTML index — schema is the single contract.
    @app.get("/", include_in_schema=False)
    @app.get("/docs", include_in_schema=False)
    async def swagger_ui() -> HTMLResponse:
        return HTMLResponse(content=SWAGGER_UI_HTML)

    return app


app = create_app()
