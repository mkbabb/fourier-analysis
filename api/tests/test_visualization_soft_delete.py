"""W3.10 spec — soft-delete → restore → grace-window hard-delete (CRUD-CONTRACT §5).

Drives ``DELETE`` / ``POST .../restore`` against a throwaway Mongo. The grace
expiry is asserted via ``softdelete.restore``'s ``expired`` arm surfaced by the
router as a 410, and the janitor's grace-pass query shape is asserted in
``test_janitor_bounded_query``. Skips when no Mongo.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta

from starlette.requests import Request
from starlette.responses import Response

import api.routers.visualizations as viz
import api.services.database as database
from api.models.visualization import VisualizationCreate

from conftest import requires_mongo, run_db


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


def _bind(db) -> None:
    database._db = db
    viz._idem_store = None


async def _seed(db) -> None:
    await db.images.insert_one({"image_slug": "tidy-image-slug-here", "blob": b"x"})
    await db.contours.insert_one({"contour_hash": "c" * 64})
    await db.users.insert_one({"_id": "alpha-beta-gamma-delta"})
    await db.sessions.insert_one(
        {
            "_id": "tok-a",
            "user_slug": "alpha-beta-gamma-delta",
            "expires_at": datetime.now(UTC) + timedelta(days=30),
        }
    )


async def _create(db) -> str:
    raw = json.dumps(
        {
            "image_slug": "tidy-image-slug-here",
            "contour_hash": "c" * 64,
            "active_bases": ["fourier-epicycles"],
            "n_harmonics": 8,
            "visibility": "public",
        }
    ).encode()
    req = _make_request("POST", headers={"X-Session-Token": "tok-a"}, body=raw)
    resp = await viz.create_visualization(VisualizationCreate.model_validate_json(raw), req)
    viz._idem_store = None
    return json.loads(bytes(resp.body))["slug"]


@requires_mongo
def test_delete_then_anonymous_read_is_404():
    async def body(db):
        _bind(db)
        await _seed(db)
        slug = await _create(db)
        del_req = _make_request(
            "DELETE",
            path=f"/api/visualizations/{slug}",
            headers={"X-Session-Token": "tok-a", "If-Match": "*"},
        )
        del_resp = await viz.delete_visualization(slug, del_req)

        read = await viz.get_visualization(slug, _make_request("GET"), Response())
        # the row still carries deleted_at in the store
        doc = await db.visualizations.find_one({"slug": slug})
        return del_resp.status_code, read.status_code, doc["deleted_at"]

    del_status, read_status, deleted_at = run_db(body)
    assert del_status == 204
    assert read_status == 404
    assert deleted_at is not None


@requires_mongo
def test_delete_then_restore_round_trip():
    async def body(db):
        _bind(db)
        await _seed(db)
        slug = await _create(db)
        del_req = _make_request(
            "DELETE",
            path=f"/api/visualizations/{slug}",
            headers={"X-Session-Token": "tok-a", "If-Match": "*"},
        )
        await viz.delete_visualization(slug, del_req)

        restore_req = _make_request(
            "POST",
            path=f"/api/visualizations/{slug}/restore",
            headers={"X-Session-Token": "tok-a"},
        )
        restore_resp = await viz.restore_visualization(slug, restore_req)

        # restored row is publicly readable again
        read = await viz.get_visualization(slug, _make_request("GET"), Response())
        doc = await db.visualizations.find_one({"slug": slug})
        return restore_resp.status_code, read.status_code, doc["deleted_at"]

    restore_status, read_status, deleted_at = run_db(body)
    assert restore_status == 200
    assert read_status == 200
    assert deleted_at is None


@requires_mongo
def test_restore_past_grace_returns_410():
    async def body(db):
        _bind(db)
        await _seed(db)
        slug = await _create(db)
        # force the deleted_at far past the 30-day grace window
        long_ago = datetime.now(UTC) - timedelta(days=400)
        await db.visualizations.update_one({"slug": slug}, {"$set": {"deleted_at": long_ago}})
        restore_req = _make_request(
            "POST",
            path=f"/api/visualizations/{slug}/restore",
            headers={"X-Session-Token": "tok-a"},
        )
        resp = await viz.restore_visualization(slug, restore_req)
        return resp.status_code, json.loads(bytes(resp.body))

    status, payload = run_db(body)
    assert status == 410
    assert payload["type"] == "urn:contract:soft-deleted"


@requires_mongo
def test_restore_missing_returns_404():
    async def body(db):
        _bind(db)
        await _seed(db)
        req = _make_request(
            "POST",
            path="/api/visualizations/never-was-a-row/restore",
            headers={"X-Session-Token": "tok-a"},
        )
        resp = await viz.restore_visualization("never-was-a-row", req)
        return resp.status_code

    assert run_db(body) == 404
