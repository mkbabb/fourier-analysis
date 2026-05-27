"""W3.10 spec — ``api/routers/visualizations.py`` CRUD lifecycle (CRUD-CONTRACT §1–§5).

The endpoints are exercised directly (no ``httpx``/``TestClient`` in the
dependency set) by constructing minimal Starlette ``Request`` objects and
driving the router coroutines against a throwaway Mongo database (the
``run_db`` helper from ``conftest``). ``api.services.database._db`` is pointed
at the throwaway db so ``get_db()`` resolves inside the handlers.

Skips gracefully when no live Mongo is reachable (``requires_mongo``).
"""

from __future__ import annotations

import json

from starlette.requests import Request

import api.routers.visualizations as viz
import api.services.database as database
from api.models.visualization import VisualizationCreate

from conftest import requires_mongo, run_db

# ---------------------------------------------------------------------------
# Harness
# ---------------------------------------------------------------------------


def _make_request(
    method: str = "GET",
    path: str = "/api/visualizations",
    headers: dict | None = None,
    body: bytes = b"",
) -> Request:
    raw = [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()]
    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": raw,
        "client": ("127.0.0.1", 5000),
        "scheme": "http",
        "server": ("test", 80),
    }
    _state = {"sent": False}

    async def receive() -> dict:
        if _state["sent"]:
            return {"type": "http.disconnect"}
        _state["sent"] = True
        return {"type": "http.request", "body": body, "more_body": False}

    return Request(scope, receive)


async def _seed_fixtures(db) -> None:
    """A resolvable image + contour + a session for owner 'alpha-beta-gamma-delta'."""
    await db.images.insert_one({"image_slug": "tidy-image-slug-here", "blob": b"x"})
    await db.contours.insert_one({"contour_hash": "c" * 64})
    from datetime import UTC, datetime, timedelta

    await db.users.insert_one({"_id": "alpha-beta-gamma-delta"})
    await db.sessions.insert_one(
        {
            "_id": "tok-alpha",
            "user_slug": "alpha-beta-gamma-delta",
            "expires_at": datetime.now(UTC) + timedelta(days=30),
        }
    )


def _create_body(**over) -> bytes:
    payload = {
        "image_slug": "tidy-image-slug-here",
        "contour_hash": "c" * 64,
        "active_bases": ["fourier-epicycles"],
        "n_harmonics": 8,
        "visibility": "public",
    }
    payload.update(over)
    return json.dumps(payload).encode()


def _bind(db) -> None:
    database._db = db
    viz._idem_store = None  # reset the process-local idempotency cache


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@requires_mongo
def test_create_returns_201_with_slug_and_etag():
    async def body(db):
        _bind(db)
        await _seed_fixtures(db)
        raw = _create_body()
        req = _make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw)
        model = VisualizationCreate.model_validate_json(raw)
        resp = await viz.create_visualization(model, req)
        payload = json.loads(bytes(resp.body))
        return resp.status_code, resp.headers.get("ETag"), payload

    status, etag, payload = run_db(body)
    assert status == 201
    assert etag and etag.startswith('"')
    assert payload["owner_slug"] == "alpha-beta-gamma-delta"
    assert payload["visibility"] == "public"
    assert "_id" not in payload  # §1 C1.3
    # slug is a 4-word lowercase phrase
    import re

    assert re.fullmatch(r"[a-z]+(-[a-z]+){3}", payload["slug"])


@requires_mongo
def test_create_404_when_image_does_not_resolve():
    async def body(db):
        _bind(db)
        await _seed_fixtures(db)
        raw = _create_body(image_slug="nope-nope-nope-nope")
        req = _make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw)
        model = VisualizationCreate.model_validate_json(raw)
        resp = await viz.create_visualization(model, req)
        return resp.status_code, json.loads(bytes(resp.body))

    status, payload = run_db(body)
    assert status == 404
    assert payload["type"] == "urn:contract:not-found"


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------


@requires_mongo
def test_get_public_returns_200():
    from starlette.responses import Response

    async def body(db):
        _bind(db)
        await _seed_fixtures(db)
        raw = _create_body()
        req = _make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw)
        created = await viz.create_visualization(VisualizationCreate.model_validate_json(raw), req)
        slug = json.loads(bytes(created.body))["slug"]

        get_req = _make_request("GET", path=f"/api/visualizations/{slug}")
        resp = await viz.get_visualization(slug, get_req, Response())
        return resp.status_code, json.loads(bytes(resp.body))

    status, payload = run_db(body)
    assert status == 200
    assert payload["visibility"] == "public"


@requires_mongo
def test_get_invalid_slug_returns_400():
    from starlette.responses import Response

    async def body(db):
        _bind(db)
        resp = await viz.get_visualization("not_a_slug", _make_request("GET"), Response())
        return resp.status_code, json.loads(bytes(resp.body))

    status, payload = run_db(body)
    assert status == 400
    assert payload["type"] == "urn:contract:slug-invalid"


@requires_mongo
def test_get_missing_returns_404():
    from starlette.responses import Response

    async def body(db):
        _bind(db)
        resp = await viz.get_visualization(
            "absent-from-the-store", _make_request("GET"), Response()
        )
        return resp.status_code

    assert run_db(body) == 404


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@requires_mongo
def test_list_returns_only_public_to_anonymous():
    async def body(db):
        _bind(db)
        await _seed_fixtures(db)
        # one public, one draft for the same owner
        for vis in ("public", "draft"):
            raw = _create_body(visibility=vis)
            req = _make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw)
            await viz.create_visualization(VisualizationCreate.model_validate_json(raw), req)
            viz._idem_store = None  # distinct content/idempotency per row

        anon = _make_request("GET")
        resp = await viz.list_visualizations(anon, limit=20, sort="newest", cursor="", owner="")
        return json.loads(bytes(resp.body))

    payload = run_db(body)
    assert payload["has_more"] is False
    visibilities = {item["visibility"] for item in payload["items"]}
    assert visibilities == {"public"}


@requires_mongo
def test_list_owner_me_returns_all_states():
    async def body(db):
        _bind(db)
        await _seed_fixtures(db)
        for vis in ("public", "draft", "unlisted"):
            raw = _create_body(
                visibility=vis, n_harmonics={"public": 4, "draft": 5, "unlisted": 6}[vis]
            )
            req = _make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw)
            await viz.create_visualization(VisualizationCreate.model_validate_json(raw), req)
            viz._idem_store = None

        owner_req = _make_request(
            "GET", path="/api/visualizations", headers={"X-Session-Token": "tok-alpha"}
        )
        resp = await viz.list_visualizations(
            owner_req, limit=20, sort="newest", cursor="", owner="me"
        )
        return json.loads(bytes(resp.body))

    payload = run_db(body)
    visibilities = {item["visibility"] for item in payload["items"]}
    assert visibilities == {"public", "draft", "unlisted"}


@requires_mongo
def test_list_bad_sort_returns_400():
    async def body(db):
        _bind(db)
        resp = await viz.list_visualizations(_make_request("GET"), sort="bogus")
        return resp.status_code, json.loads(bytes(resp.body))

    status, payload = run_db(body)
    assert status == 400
    assert payload["type"] == "urn:contract:cursor-invalid"
