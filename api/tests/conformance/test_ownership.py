"""Conformance — owner-bound mutation (CONFORMANCE-MATRIX C3.1–C3.3; CRUD-CONTRACT §3).

Every row carries a non-null ``owner_slug`` (invariant 14). Anonymous publish →
401 ``owner-required``; a cross-owner PATCH → 403 ``not-owner``; and the
``Visualization`` model itself rejects a ``None`` owner at construction (the
schema-level guard behind the DB validator). The endpoint rows drive the live
router (throwaway Mongo); the schema row is pure.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

import api.routers.visualizations as viz
from api.models.visualization import Visualization, VisualizationCreate, VisualizationUpdate

from conftest import requires_mongo, run_db

from ._harness import bind, create_body, make_request, seed_fixtures


@requires_mongo
def test_anonymous_create_401():
    """C3.1 — POST without a session → 401 ``urn:contract:owner-required``."""
    async def body(db):
        bind(db)
        await seed_fixtures(db)
        raw = create_body()
        resp = await viz.create_visualization(
            VisualizationCreate.model_validate_json(raw), make_request("POST", body=raw)
        )
        return resp.status_code, json.loads(bytes(resp.body))

    status, payload = run_db(body)
    assert status == 401
    assert payload["type"] == "urn:contract:owner-required"


@requires_mongo
def test_wrong_owner_403():
    """C3.2 — PATCH by a different owner's session → 403 ``urn:contract:not-owner``."""
    async def body(db):
        bind(db)
        await seed_fixtures(db)  # owner alpha-beta-gamma-delta, token tok-alpha
        # A second, distinct owner + session.
        await db.users.insert_one({"_id": "zeta-eta-theta-iota"})
        await db.sessions.insert_one({
            "_id": "tok-beta", "user_slug": "zeta-eta-theta-iota",
            "expires_at": datetime.now(UTC) + timedelta(days=30),
        })
        raw = create_body(visibility="unlisted")
        created = await viz.create_visualization(
            VisualizationCreate.model_validate_json(raw),
            make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw),
        )
        slug = json.loads(bytes(created.body))["slug"]
        etag = created.headers["ETag"]
        patch_raw = json.dumps({"visibility": "public"}).encode()
        resp = await viz.update_visualization(
            slug,
            VisualizationUpdate.model_validate_json(patch_raw),
            make_request("PATCH", headers={"X-Session-Token": "tok-beta", "If-Match": etag},
                         body=patch_raw),
        )
        return resp.status_code, json.loads(bytes(resp.body))

    status, payload = run_db(body)
    assert status == 403
    assert payload["type"] == "urn:contract:not-owner"


def test_schema_null_owner():
    """C3.3 — the entity schema rejects a ``None`` owner (the DB validator's source)."""
    with pytest.raises(ValidationError):
        Visualization(
            slug="quiet-blue-morning-fox",
            owner_slug=None,  # type: ignore[arg-type]
            content_hash="h",
            image_slug="tidy-image-slug-here",
            contour_hash="c" * 64,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
