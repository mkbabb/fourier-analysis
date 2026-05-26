"""FastAPI application entry point."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

from api.config import settings
from api.routers import contours, equations, images, sessions, snapshots
from api.routers.admin import admin_router
from api.routers.gallery import gallery_router
from api.services.database import close_db, connect_db
from api.services.janitor import run_janitor


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
    await close_db()


app = FastAPI(
    title="Fourier Analysis API",
    version="0.2.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Session-Token"],
)

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
                            content={"detail": "Invalid input: keys starting with '$' are not allowed"},
                        )
    return await call_next(request)


app.include_router(images.router)
app.include_router(contours.router)
app.include_router(snapshots.router)
app.include_router(equations.router)
app.include_router(sessions.router)
app.include_router(gallery_router)
app.include_router(admin_router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s %s:\n%s", request.method, request.url.path, traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/api/health")
async def health():
    return {"status": "ok"}
