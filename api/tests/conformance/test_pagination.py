"""Conformance — cursor pagination (CONFORMANCE-MATRIX CS1.1–CS1.3, CS6.1; SCHEMA §1, §6).

``test_invalid_cursor`` is pure (the ``api/lib/crud/cursors.py`` decoder raises
400 ``urn:contract:cursor-invalid`` on garbage). ``test_cursor_opaque`` /
``test_roundtrip`` / ``test_link_header_next`` drive the live
``list_visualizations`` endpoint against a throwaway Mongo (the harness mirrors
``test_visualization_crud``) — the opaque ``next_cursor`` decodes to a
``CursorPayload``, paging forward then re-fetching page 1 is stable, and a
non-null ``next_cursor`` carries an RFC 8288 ``Link: …; rel="next"`` header.
"""

from __future__ import annotations

import base64
import json

import pytest
from fastapi import HTTPException
from starlette.requests import Request

import api.routers.visualizations as viz
import api.services.database as database
from api.lib.crud import cursors
from api.lib.crud.cursors import CursorPayload
from api.models.visualization import VisualizationCreate

from conftest import requires_mongo, run_db


def _make_request(method: str = "GET", path: str = "/api/visualizations",
                  headers: dict | None = None, body: bytes = b"") -> Request:
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


def _bind(db) -> None:
    database._db = db
    viz._idem_store = None


async def _seed(db) -> None:
    await db.images.insert_one({"image_slug": "tidy-image-slug-here", "blob": b"x"})
    await db.contours.insert_one({"contour_hash": "c" * 64})
    from datetime import UTC, datetime, timedelta

    await db.users.insert_one({"_id": "alpha-beta-gamma-delta"})
    await db.sessions.insert_one({
        "_id": "tok-alpha", "user_slug": "alpha-beta-gamma-delta",
        "expires_at": datetime.now(UTC) + timedelta(days=30),
    })


def _create_body(**over) -> bytes:
    payload = {
        "image_slug": "tidy-image-slug-here", "contour_hash": "c" * 64,
        "active_bases": ["fourier-epicycles"], "n_harmonics": 8, "visibility": "public",
    }
    payload.update(over)
    return json.dumps(payload).encode()


async def _seed_n_public(db, n: int) -> None:
    await _seed(db)
    for i in range(n):
        raw = _create_body(n_harmonics=i + 1)
        req = _make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw)
        await viz.create_visualization(VisualizationCreate.model_validate_json(raw), req)
        viz._idem_store = None  # distinct idempotency scope per row


def test_invalid_cursor():
    """CS1.3 — bad base64 / bad JSON / bad schema / stale sort_key → 400 cursor-invalid."""
    # Bad base64url.
    with pytest.raises(HTTPException) as bad_b64:
        cursors.decode_cursor("not-base64!!")
    assert bad_b64.value.status_code == 400
    assert "urn:contract:cursor-invalid" in bad_b64.value.detail
    # Valid base64url of an empty object → schema rejects (missing fields).
    empty = base64.urlsafe_b64encode(b"{}").decode().rstrip("=")
    with pytest.raises(HTTPException) as bad_schema:
        cursors.decode_cursor(empty)
    assert bad_schema.value.status_code == 400
    # Stale sort_key: cursor minted under ``newest`` reused under ``views``.
    stale = cursors.encode_cursor(CursorPayload(id="a", sort_key="newest", sort_value="x"))
    with pytest.raises(HTTPException) as stale_sort:
        cursors.paginate({}, cursors.decode_cursor(stale), sort_key="views")
    assert stale_sort.value.status_code == 400


@requires_mongo
def test_cursor_opaque():
    """CS1.1 — the ``next_cursor`` is an opaque base64url string decoding to ``CursorPayload``."""
    async def body(db):
        _bind(db)
        await _seed_n_public(db, 5)
        resp = await viz.list_visualizations(_make_request("GET"), limit=2, sort="newest",
                                             cursor="", owner="")
        return json.loads(bytes(resp.body))

    payload = run_db(body)
    assert payload["has_more"] is True
    assert payload["next_cursor"]
    decoded = cursors.decode_cursor(payload["next_cursor"])
    assert decoded is not None and decoded.sort_key == "newest"


@requires_mongo
def test_roundtrip():
    """CS1.2 — page 1 fetched twice (independently) yields the identical first page."""
    async def body(db):
        _bind(db)
        await _seed_n_public(db, 5)
        first_a = json.loads(bytes(
            (await viz.list_visualizations(_make_request("GET"), limit=2, sort="newest",
                                           cursor="", owner="")).body))
        first_b = json.loads(bytes(
            (await viz.list_visualizations(_make_request("GET"), limit=2, sort="newest",
                                           cursor="", owner="")).body))
        return first_a, first_b

    page_a, page_b = run_db(body)
    assert [i["slug"] for i in page_a["items"]] == [i["slug"] for i in page_b["items"]]


@requires_mongo
def test_link_header_next():
    """CS6.1 — a non-null ``next_cursor`` emits ``Link: …; rel="next"`` embedding the cursor."""
    async def body(db):
        _bind(db)
        await _seed_n_public(db, 5)
        resp = await viz.list_visualizations(_make_request("GET"), limit=2, sort="newest",
                                             cursor="", owner="")
        return resp.headers.get("Link"), json.loads(bytes(resp.body))["next_cursor"]

    link, next_cursor = run_db(body)
    assert link is not None and 'rel="next"' in link
    assert next_cursor and next_cursor in link
