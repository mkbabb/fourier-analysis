"""FastAPI application entry point."""

from __future__ import annotations

import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.config import (
    CORS_ALLOW_HEADERS,
    CORS_ALLOW_METHODS,
    CORS_EXPOSE_HEADERS,
    settings,
)
from api.lib.crud.errors import internal_error
from api.routers import contours, equations, images, sessions, visualizations
from api.routers.admin import admin_router
from api.routers.gallery import gallery_router
from api.services.computation import shutdown_process_pool
from api.services.database import close_db, connect_db
from api.services.janitor import run_janitor
from api.services.rate_limiter import RateLimitHeaderMiddleware

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate admin token in production
    env = os.environ.get("ENV", "development").lower()
    if env == "production" and not settings.admin_token:
        raise RuntimeError(
            "ADMIN_TOKEN must be set in production. "
            "Set the ADMIN_TOKEN environment variable before starting the server."
        )
    elif not settings.admin_token:
        logger.warning(
            "ADMIN_TOKEN is not set. Admin endpoints will return 503. "
            "Set ADMIN_TOKEN for full functionality."
        )

    await connect_db()
    janitor_task = asyncio.create_task(run_janitor())
    yield
    janitor_task.cancel()
    shutdown_process_pool()
    await close_db()


app = FastAPI(
    title="Fourier Analysis API",
    version="0.2.0",
    lifespan=lifespan,
)

class UnhandledErrorProblem:
    """The API's one boundary for an unhandled exception: log it and answer the
    typed ``urn:contract:internal-error`` problem.

    Starlette routes an ``Exception`` handler to ``ServerErrorMiddleware``, the
    OUTERMOST layer, so its 500 never passes through ``CORSMiddleware``: the
    browser sees a response without ``Access-Control-Allow-Origin`` and reports
    a server fault as a CORS failure.  This pure-ASGI layer is registered
    BEFORE the CORS middleware (``add_middleware`` prepends, so it sits INSIDE
    CORS), and the problem it answers carries the CORS headers like every other
    response.  An exception after the response has started cannot be answered
    again; it propagates to the server's own error layer unchanged.
    """

    def __init__(self, app) -> None:
        self.app = app

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        started = False

        async def send_tracking(message) -> None:
            nonlocal started
            if message["type"] == "http.response.start":
                started = True
            await send(message)

        try:
            await self.app(scope, receive, send_tracking)
        except Exception:
            logger.exception("Unhandled exception on %s %s", scope["method"], scope["path"])
            if started:
                raise
            await internal_error(instance=scope["path"])(scope, receive, send)


app.add_middleware(UnhandledErrorProblem)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=list(CORS_ALLOW_METHODS),
    allow_headers=list(CORS_ALLOW_HEADERS),
    expose_headers=list(CORS_EXPOSE_HEADERS),
)

# RFC 9239 RateLimit-* headers on every response (Invariant 24 / CRUD-CONTRACT
# §0 SOTA-6). Registered after CORS so its ``RateLimit-*`` fields ride out
# through the CORS-wrapped response unmodified.
app.add_middleware(RateLimitHeaderMiddleware)


def _has_dollar_keys(obj) -> bool:
    if obj is None or not isinstance(obj, (dict, list)):
        return False
    if isinstance(obj, list):
        return any(_has_dollar_keys(item) for item in obj)
    for key in obj:
        if key.startswith("$"):
            return True
        if _has_dollar_keys(obj[key]):
            return True
    return False


@app.middleware("http")
async def reject_dollar_keys(request: Request, call_next):
    if request.method in ("POST", "PUT", "PATCH"):
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            body = await request.body()
            if body:
                try:
                    parsed = json.loads(body)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    pass
                else:
                    if _has_dollar_keys(parsed):
                        return JSONResponse(
                            status_code=400,
                            content={
                                "detail": "Invalid input: keys starting with '$' are not allowed"
                            },
                        )
    return await call_next(request)


app.include_router(images.router)
app.include_router(contours.router)
app.include_router(equations.router)
app.include_router(sessions.router)
app.include_router(visualizations.router)
app.include_router(gallery_router)
app.include_router(admin_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
