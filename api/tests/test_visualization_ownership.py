"""W3.10 / W3.23 spec — ownership-bound mutation (CRUD-CONTRACT §3).

Anonymous publish → 401; cross-owner PATCH / DELETE → 403; plus the C-slug-4
migration-artefact exception that admits ``^anon-migrated-\\d+$`` slugs minted
by the orphan-pass (W3.17) — these deliberately violate the user-facing
``^[a-z]+(-[a-z]+){3}$`` pattern.

Endpoints are driven directly against a throwaway Mongo (see
``test_visualization_crud`` for the harness rationale); skips when no Mongo.
"""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime, timedelta

from starlette.requests import Request

import api.routers.visualizations as viz
import api.services.database as database
from api.models.visualization import VisualizationCreate, VisualizationUpdate

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
    for slug, tok in (("alpha-beta-gamma-delta", "tok-a"), ("zeta-eta-theta-iota", "tok-z")):
        await db.users.insert_one({"_id": slug})
        await db.sessions.insert_one(
            {"_id": tok, "user_slug": slug, "expires_at": datetime.now(UTC) + timedelta(days=30)}
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


async def _create_as(db, tok: str, **over) -> dict:
    raw = _create_body(**over)
    req = _make_request("POST", headers={"X-Session-Token": tok}, body=raw)
    resp = await viz.create_visualization(VisualizationCreate.model_validate_json(raw), req)
    viz._idem_store = None
    return json.loads(bytes(resp.body))


# ---------------------------------------------------------------------------
# Anonymous publish → 401
# ---------------------------------------------------------------------------


@requires_mongo
def test_anonymous_publish_returns_401():
    async def body(db):
        _bind(db)
        await _seed(db)
        raw = _create_body()
        req = _make_request("POST", body=raw)  # no X-Session-Token
        resp = await viz.create_visualization(VisualizationCreate.model_validate_json(raw), req)
        return resp.status_code, json.loads(bytes(resp.body))

    status, payload = run_db(body)
    assert status == 401
    assert payload["type"] == "urn:contract:owner-required"


# ---------------------------------------------------------------------------
# Cross-owner PATCH / DELETE → 403
# ---------------------------------------------------------------------------


@requires_mongo
def test_patch_by_non_owner_returns_403():
    async def body(db):
        _bind(db)
        await _seed(db)
        created = await _create_as(db, "tok-a")
        slug = created["slug"]
        patch = json.dumps({"title": "stolen"}).encode()
        req = _make_request(
            "PATCH",
            path=f"/api/visualizations/{slug}",
            headers={"X-Session-Token": "tok-z", "If-Match": "*"},
            body=patch,
        )
        resp = await viz.update_visualization(
            slug, VisualizationUpdate.model_validate_json(patch), req
        )
        return resp.status_code, json.loads(bytes(resp.body))

    status, payload = run_db(body)
    assert status == 403
    assert payload["type"] == "urn:contract:not-owner"


@requires_mongo
def test_delete_by_non_owner_returns_403():
    async def body(db):
        _bind(db)
        await _seed(db)
        created = await _create_as(db, "tok-a")
        slug = created["slug"]
        req = _make_request(
            "DELETE",
            path=f"/api/visualizations/{slug}",
            headers={"X-Session-Token": "tok-z", "If-Match": "*"},
        )
        resp = await viz.delete_visualization(slug, req)
        return resp.status_code, json.loads(bytes(resp.body))

    status, payload = run_db(body)
    assert status == 403
    assert payload["type"] == "urn:contract:not-owner"


@requires_mongo
def test_owner_patch_succeeds_with_matching_etag():
    async def body(db):
        _bind(db)
        await _seed(db)
        created = await _create_as(db, "tok-a")
        slug = created["slug"]
        # fetch the current etag via a read
        from starlette.responses import Response

        read = await viz.get_visualization(slug, _make_request("GET"), Response())
        current_etag = read.headers["ETag"]

        patch = json.dumps({"title": "mine, renamed"}).encode()
        req = _make_request(
            "PATCH",
            path=f"/api/visualizations/{slug}",
            headers={"X-Session-Token": "tok-a", "If-Match": current_etag},
            body=patch,
        )
        resp = await viz.update_visualization(
            slug, VisualizationUpdate.model_validate_json(patch), req
        )
        return resp.status_code, json.loads(bytes(resp.body))

    status, payload = run_db(body)
    assert status == 200
    assert payload["title"] == "mine, renamed"


@requires_mongo
def test_patch_without_if_match_returns_428():
    async def body(db):
        _bind(db)
        await _seed(db)
        created = await _create_as(db, "tok-a")
        slug = created["slug"]
        patch = json.dumps({"title": "x"}).encode()
        req = _make_request(
            "PATCH",
            path=f"/api/visualizations/{slug}",
            headers={"X-Session-Token": "tok-a"},  # no If-Match
            body=patch,
        )
        try:
            await viz.update_visualization(
                slug, VisualizationUpdate.model_validate_json(patch), req
            )
            return None
        except Exception as exc:  # require_if_match raises HTTPException(428)
            return getattr(exc, "status_code", None)

    assert run_db(body) == 428


# ---------------------------------------------------------------------------
# C-slug-4 migration-artefact exception (W3.17 / W3.23)
# ---------------------------------------------------------------------------

_ANON_MIGRATED = re.compile(r"^anon-migrated-\d+$")
_USER_FACING = re.compile(r"^[a-z]+(-[a-z]+){3}$")


def test_migrate_anon_migrated_slug_pattern_scoped():
    """The orphan-pass owner slug ``anon-migrated-NNNNN`` is admitted as a
    migration-artefact exception (C-slug-4) even though it deliberately fails
    the user-facing 4-word pattern."""
    minted = f"anon-migrated-{42:05d}"
    assert minted == "anon-migrated-00042"
    assert _ANON_MIGRATED.fullmatch(minted)
    # It is intentionally NOT a valid user-facing slug (audit-E §4 / R-identity §9 #3).
    assert _USER_FACING.fullmatch(minted) is None
    # The user-facing validator (consumed by the router) rejects it.
    from api.lib.crud import slugs

    assert slugs.validate_slug(minted) is False
