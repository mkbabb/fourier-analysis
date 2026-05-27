"""Conformance — 3-state visibility (CONFORMANCE-MATRIX C4.1–C4.4, C4.7; CRUD-CONTRACT §4).

``test_enum_validation`` / ``test_default_draft`` are pure model assertions (the
``Visibility`` literal + the ``draft`` default). ``test_anonymous_list_public_only``
/ ``test_draft_404_anonymous`` / ``test_owner_sees_all`` drive the live list /
read endpoints against a throwaway Mongo: anonymous callers see only ``public``
live rows, a ``draft`` reads 404 (not 403, refusing to confirm existence), and
``?owner=me`` returns all three states.

The C4.5 / C4.6 transition-guard rows (public→draft rejected; two-step via
unlisted) are NOT asserted here: the router has no transition guard at HEAD —
``update_visualization`` ``$set``s the visibility unconditionally — and the
router is out of W4's bounds. The matrix records their true disposition rather
than citing a method that would assert unimplemented behaviour.
"""

from __future__ import annotations

import json

import pytest
from pydantic import ValidationError
from starlette.responses import Response

import api.routers.visualizations as viz
from api.models.visualization import VisualizationCreate

from conftest import requires_mongo, run_db

from ._harness import bind, create_body, make_request, seed_fixtures


def test_enum_validation():
    """C4.1 — ``visibility`` outside ``{draft, unlisted, public}`` is rejected by the model."""
    with pytest.raises(ValidationError):
        VisualizationCreate.model_validate_json(create_body(visibility="private"))


def test_default_draft():
    """C4.7 — a create body omitting ``visibility`` defaults to ``draft``."""
    payload = {
        "image_slug": "tidy-image-slug-here", "contour_hash": "c" * 64,
        "active_bases": ["fourier-epicycles"], "n_harmonics": 8,
    }
    model = VisualizationCreate.model_validate_json(json.dumps(payload).encode())
    assert model.visibility == "draft"


@requires_mongo
def test_anonymous_list_public_only():
    """C4.2 — anonymous list over {draft, public} returns only the public row."""
    async def body(db):
        bind(db)
        await seed_fixtures(db)
        for vis in ("public", "draft"):
            raw = create_body(visibility=vis, n_harmonics={"public": 4, "draft": 5}[vis])
            await viz.create_visualization(
                VisualizationCreate.model_validate_json(raw),
                make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw),
            )
            viz._idem_store = None
        resp = await viz.list_visualizations(make_request("GET"), limit=20, sort="newest",
                                             cursor="", owner="")
        return json.loads(bytes(resp.body))

    payload = run_db(body)
    assert payload["has_more"] is False
    assert {item["visibility"] for item in payload["items"]} == {"public"}


@requires_mongo
def test_draft_404_anonymous():
    """C4.3 — anonymous read of a draft → 404; unlisted + public → 200."""
    async def body(db):
        bind(db)
        await seed_fixtures(db)
        slugs_by_vis: dict[str, str] = {}
        for vis in ("draft", "unlisted", "public"):
            raw = create_body(visibility=vis, n_harmonics={"draft": 4, "unlisted": 5, "public": 6}[vis])
            created = await viz.create_visualization(
                VisualizationCreate.model_validate_json(raw),
                make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw),
            )
            slugs_by_vis[vis] = json.loads(bytes(created.body))["slug"]
            viz._idem_store = None
        statuses = {}
        for vis, slug in slugs_by_vis.items():
            resp = await viz.get_visualization(slug, make_request("GET"), Response())
            statuses[vis] = resp.status_code
        return statuses

    statuses = run_db(body)
    assert statuses["draft"] == 404
    assert statuses["unlisted"] == 200
    assert statuses["public"] == 200


@requires_mongo
def test_owner_sees_all():
    """C4.4 — ``?owner=me`` with the owner's session returns all three visibility states."""
    async def body(db):
        bind(db)
        await seed_fixtures(db)
        for vis in ("public", "draft", "unlisted"):
            raw = create_body(visibility=vis,
                              n_harmonics={"public": 4, "draft": 5, "unlisted": 6}[vis])
            await viz.create_visualization(
                VisualizationCreate.model_validate_json(raw),
                make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw),
            )
            viz._idem_store = None
        owner_req = make_request("GET", headers={"X-Session-Token": "tok-alpha"})
        resp = await viz.list_visualizations(owner_req, limit=20, sort="newest",
                                             cursor="", owner="me")
        return json.loads(bytes(resp.body))

    payload = run_db(body)
    assert {item["visibility"] for item in payload["items"]} == {"public", "draft", "unlisted"}
