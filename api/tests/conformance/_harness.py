"""Shared endpoint-conformance harness (not a test module — leading underscore).

The visualization / admin / session routers are exercised directly (no
``httpx``/``TestClient`` in the dependency set) by constructing minimal
Starlette ``Request`` objects and driving the router coroutines against a
throwaway Mongo database (``conftest.run_db``). This mirrors the W3.10 proxy
suites (``test_visualization_crud`` et al.) so the conformance paths assert the
same end-to-end behaviour the matrix cites.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta

from starlette.requests import Request

import api.routers.visualizations as viz
import api.services.database as database


def make_request(
    method: str = "GET",
    path: str = "/api/visualizations",
    headers: dict | None = None,
    body: bytes = b"",
) -> Request:
    """A minimal Starlette ``Request`` with a one-shot receive channel."""
    raw = [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()]
    scope = {
        "type": "http", "method": method, "path": path, "raw_path": path.encode(),
        "query_string": b"", "headers": raw, "client": ("127.0.0.1", 5000),
        "scheme": "http", "server": ("test", 80),
    }
    _state = {"sent": False}

    async def receive() -> dict:
        if _state["sent"]:
            return {"type": "http.disconnect"}
        _state["sent"] = True
        return {"type": "http.request", "body": body, "more_body": False}

    return Request(scope, receive)


def bind(db) -> None:
    """Point ``get_db()`` at the throwaway db; reset the process-local idem +
    suspension caches so a prior test's suspend does not bleed across the
    process-global state (the single-replica posture, invariant 12)."""
    from api.dependencies import _suspended_cache

    database._db = db
    viz._idem_store = None
    _suspended_cache.clear()


async def seed_fixtures(db, *, owner: str = "alpha-beta-gamma-delta", token: str = "tok-alpha") -> None:
    """A resolvable image + contour + a live session for ``owner``."""
    await db.images.insert_one({"image_slug": "tidy-image-slug-here", "blob": b"x"})
    await db.contours.insert_one({"contour_hash": "c" * 64})
    await db.users.insert_one({"_id": owner})
    await db.sessions.insert_one({
        "_id": token, "user_slug": owner,
        "expires_at": datetime.now(UTC) + timedelta(days=30),
    })


def create_body(**over) -> bytes:
    """A valid ``VisualizationCreate`` JSON body, overridable per call."""
    payload = {
        "image_slug": "tidy-image-slug-here", "contour_hash": "c" * 64,
        "active_bases": ["fourier-epicycles"], "n_harmonics": 8, "visibility": "public",
    }
    payload.update(over)
    return json.dumps(payload).encode()
