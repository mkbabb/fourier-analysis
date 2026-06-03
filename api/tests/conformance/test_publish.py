"""J.W2 conformance — the publish/unpublish OPERATION (J.W1c).

The idempotent in-place visibility flag-flip: publish → public, unpublish →
the contract-legal ``public→unlisted`` exit; NEVER a new row (anti-duplication
structural); the dead ``visibility_illegal_transition`` guard's first live
caller; owner-gated, If-Match-guarded, no-resurrect over soft-delete.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException

import api.routers.visualizations as viz
from api.models.visualization import VisualizationCreate, VisualizationUpdate

from conftest import requires_mongo, run_db

from ._harness import bind, create_body, make_request, seed_fixtures

_TOK = {"X-Session-Token": "tok-alpha"}
_TOK_IM = {"X-Session-Token": "tok-alpha", "If-Match": "*"}


async def _create(db, **over) -> str:
    bind(db)
    await seed_fixtures(db)
    raw = create_body(**over)
    created = await viz.create_visualization(
        VisualizationCreate.model_validate_json(raw),
        make_request("POST", headers=_TOK, body=raw),
    )
    viz._idem_store = None
    return json.loads(bytes(created.body))["slug"]


def _publish(slug, headers=_TOK_IM):
    path = f"/api/visualizations/{slug}/publish"
    return viz.publish_visualization(slug, make_request("POST", path=path, headers=headers))


def _unpublish(slug, headers=_TOK_IM):
    path = f"/api/visualizations/{slug}/unpublish"
    return viz.unpublish_visualization(slug, make_request("POST", path=path, headers=headers))


# ---------------------------------------------------------------------------
# publish — in-place flip, no duplicate, idempotent no-op
# ---------------------------------------------------------------------------


@requires_mongo
def test_publish_draft_flips_in_place_no_duplicate():
    async def body(db):
        slug = await _create(db, visibility="draft")
        before = await db.visualizations.count_documents({})
        resp = await _publish(slug)
        after = await db.visualizations.count_documents({})
        return resp.status_code, json.loads(bytes(resp.body)), before, after

    status, doc, before, after = run_db(body)
    assert status == 200
    assert doc["visibility"] == "public"
    assert doc["published"] is True  # derived convenience (§6)
    assert before == after == 1  # SAME row — anti-duplication structural


@requires_mongo
def test_republish_public_is_idempotent_noop():
    async def body(db):
        slug = await _create(db, visibility="public")
        r1 = await _publish(slug)
        r2 = await _publish(slug)
        count = await db.visualizations.count_documents({"slug": slug})
        return r1.status_code, r2.status_code, json.loads(bytes(r2.body))["visibility"], count

    s1, s2, vis, count = run_db(body)
    assert s1 == 200 and s2 == 200
    assert vis == "public" and count == 1


# ---------------------------------------------------------------------------
# unpublish — public → unlisted (never the forbidden public → draft)
# ---------------------------------------------------------------------------


@requires_mongo
def test_unpublish_public_lands_unlisted():
    async def body(db):
        slug = await _create(db, visibility="public")
        resp = await _unpublish(slug)
        return json.loads(bytes(resp.body))

    doc = run_db(body)
    assert doc["visibility"] == "unlisted"  # the contract-legal exit (NOT draft)
    assert doc["published"] is False


@requires_mongo
def test_unpublish_unlisted_is_noop():
    async def body(db):
        slug = await _create(db, visibility="unlisted")
        resp = await _unpublish(slug)
        return resp.status_code, json.loads(bytes(resp.body))["visibility"]

    status, vis = run_db(body)
    assert status == 200 and vis == "unlisted"  # already out of public view — stays put


# ---------------------------------------------------------------------------
# the guard's first live REJECTION — a direct public→draft via arbitrary PATCH
# ---------------------------------------------------------------------------


@requires_mongo
def test_patch_public_to_draft_is_409_illegal_transition():
    async def body(db):
        slug = await _create(db, visibility="public")
        patch_req = make_request("PATCH", headers=_TOK_IM, body=b"{}")
        resp = await viz.update_visualization(slug, VisualizationUpdate(visibility="draft"), patch_req)
        return resp.status_code, json.loads(bytes(resp.body))

    status, problem = run_db(body)
    assert status == 409
    assert problem["type"] == "urn:contract:visibility-illegal-transition"


# ---------------------------------------------------------------------------
# authz + lifecycle — anon / non-owner / soft-deleted / If-Match
# ---------------------------------------------------------------------------


@requires_mongo
def test_anonymous_publish_is_401():
    async def body(db):
        slug = await _create(db, visibility="draft")
        resp = await _publish(slug, headers={"If-Match": "*"})
        return resp.status_code

    assert run_db(body) == 401


@requires_mongo
def test_non_owner_publish_is_403():
    async def body(db):
        slug = await _create(db, visibility="draft")
        await db.users.insert_one({"_id": "other-user-slug-here"})
        await db.sessions.insert_one(
            {
                "_id": "tok-other",
                "user_slug": "other-user-slug-here",
                "expires_at": datetime.now(UTC) + timedelta(days=30),
            }
        )
        resp = await _publish(slug, headers={"X-Session-Token": "tok-other", "If-Match": "*"})
        return resp.status_code

    assert run_db(body) == 403


@requires_mongo
def test_publish_soft_deleted_is_404_no_resurrect():
    async def body(db):
        slug = await _create(db, visibility="draft")
        await db.visualizations.update_one(
            {"slug": slug}, {"$set": {"deleted_at": datetime.now(UTC)}}
        )
        resp = await _publish(slug)
        still_deleted = await db.visualizations.find_one({"slug": slug}, {"deleted_at": 1})
        return resp.status_code, still_deleted["deleted_at"]

    status, deleted_at = run_db(body)
    assert status == 404
    assert deleted_at is not None  # publish never touches deleted_at (no resurrect)


@requires_mongo
def test_publish_missing_if_match_is_428():
    async def body(db):
        slug = await _create(db, visibility="draft")
        try:
            await viz.publish_visualization(
                slug, make_request("POST", path=f"/api/visualizations/{slug}/publish", headers=_TOK)
            )
        except HTTPException as exc:
            return exc.status_code
        return None

    assert run_db(body) == 428
