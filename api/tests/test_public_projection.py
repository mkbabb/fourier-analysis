"""FORTY-SIXTH C — the blocker before any public row: no reader but its owner
sees a row's owner.

A user slug alone signs in (``POST /api/sessions/login``), so the public lists
(``GET /api/visualizations``, ``GET /api/gallery/cursor``), a single read, the
forks list, the version list and the provenance walk must never carry the
owner's slug (``owner_slug``, ``author_slug``) to anyone else. The owner still
reads their own (a single read, ``?owner=me``, the create response).

Driven against a throwaway Mongo through the same harness as
``test_visualization_ownership``; skips when no Mongo.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta

from fastapi import Response
from starlette.requests import Request

import api.routers.gallery as gallery
import api.routers.visualizations as viz
import api.services.database as database
from api.models.visualization import VisualizationCreate

from conftest import requires_mongo, run_db

OWNER, OWNER_TOK = "alpha-beta-gamma-delta", "tok-a"
STRANGER, STRANGER_TOK = "zeta-eta-theta-iota", "tok-z"


def _req(method: str = "GET", path: str = "/api/visualizations", token: str | None = None, body: bytes = b"") -> Request:
    headers = [(b"x-session-token", token.encode())] if token else []
    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": headers,
        "client": ("127.0.0.1", 5000),
        "scheme": "http",
        "server": ("test", 80),
    }
    sent = {"done": False}

    async def receive() -> dict:
        if sent["done"]:
            return {"type": "http.disconnect"}
        sent["done"] = True
        return {"type": "http.request", "body": body, "more_body": False}

    return Request(scope, receive)


async def _seed(db) -> str:
    database._db = db
    viz._idem_store = None
    await db.images.insert_one({"image_slug": "tidy-image-slug-here", "blob": b"x"})
    await db.contours.insert_one({"contour_hash": "c" * 64})
    for slug, tok in ((OWNER, OWNER_TOK), (STRANGER, STRANGER_TOK)):
        await db.users.insert_one({"_id": slug})
        await db.sessions.insert_one(
            {"_id": tok, "user_slug": slug, "expires_at": datetime.now(UTC) + timedelta(days=30)}
        )
    raw = json.dumps(
        {
            "image_slug": "tidy-image-slug-here",
            "contour_hash": "c" * 64,
            "active_bases": ["fourier-epicycles"],
            "n_harmonics": 8,
            "visibility": "public",
            "title": "A public piece",
        }
    ).encode()
    resp = await viz.create_visualization(
        VisualizationCreate.model_validate_json(raw), _req("POST", token=OWNER_TOK, body=raw)
    )
    viz._idem_store = None
    created = json.loads(bytes(resp.body))
    # The owner's own create response names them.
    assert created["owner_slug"] == OWNER
    return created["slug"]


def _body(resp) -> dict:
    return json.loads(bytes(resp.body))


@requires_mongo
def test_public_lists_carry_no_owner():
    async def body(db):
        slug = await _seed(db)
        listed = _body(await viz.list_visualizations(_req(), limit=20, sort="newest", cursor="", owner=""))
        alias = _body(await gallery.list_public_gallery(limit=20, sort="newest", cursor=""))
        forks = _body(await viz.list_forks(slug, limit=20, sort="newest", cursor=""))
        return slug, listed, alias, forks

    slug, listed, alias, forks = run_db(body)
    assert [i["slug"] for i in listed["items"]] == [slug]
    for items in (listed["items"], alias["items"], forks["items"]):
        for item in items:
            assert "owner_slug" not in item, item
    assert json.dumps(listed).find(OWNER) == -1
    assert json.dumps(alias).find(OWNER) == -1


@requires_mongo
def test_a_single_read_names_the_owner_to_the_owner_only():
    async def body(db):
        slug = await _seed(db)
        path = f"/api/visualizations/{slug}"
        anon = _body(await viz.get_visualization(slug, _req(path=path), Response()))
        stranger = _body(await viz.get_visualization(slug, _req(path=path, token=STRANGER_TOK), Response()))
        own = _body(await viz.get_visualization(slug, _req(path=path, token=OWNER_TOK), Response()))
        mine = _body(
            await viz.list_visualizations(_req(token=OWNER_TOK), limit=20, sort="newest", cursor="", owner="me")
        )
        return anon, stranger, own, mine

    anon, stranger, own, mine = run_db(body)
    assert "owner_slug" not in anon
    assert "owner_slug" not in stranger
    assert own["owner_slug"] == OWNER
    assert all(i["owner_slug"] == OWNER for i in mine["items"])


@requires_mongo
def test_versions_and_provenance_name_no_author_to_others():
    async def body(db):
        slug = await _seed(db)
        anon_versions = _body(await viz.list_versions(slug, _req(path=f"/api/visualizations/{slug}/versions")))
        anon_prov = _body(await viz.get_provenance(slug, _req(path=f"/api/visualizations/{slug}/provenance")))
        own_versions = _body(
            await viz.list_versions(slug, _req(path=f"/api/visualizations/{slug}/versions", token=OWNER_TOK))
        )
        return anon_versions, anon_prov, own_versions

    anon_versions, anon_prov, own_versions = run_db(body)
    assert anon_versions["versions"], "the piece has its root version"
    assert all(v["author_slug"] is None for v in anon_versions["versions"])
    assert all(n["author_slug"] is None for n in anon_prov["chain"])
    assert all(c.get("author_slug") is None for c in anon_prov["fork_breadcrumb"])
    assert OWNER not in json.dumps(anon_versions) + json.dumps(anon_prov)
    assert all(v["author_slug"] == OWNER for v in own_versions["versions"])
