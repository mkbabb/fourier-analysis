"""Conformance — admin moderation + audit (CONFORMANCE-MATRIX C7.1–C7.6; CRUD-CONTRACT §7).

``test_non_admin_rejected`` drives the ``admin_required`` dependency directly
(no token → 503 admin-not-configured; wrong token → 403). The moderation rows
drive the admin router coroutines against a throwaway Mongo: every mutation
writes one ``admin_audit`` row (C7.1); suspend is idempotent and audited twice
(C7.2); the ``(content_hash, reporter_slug)`` unique index forecloses a
double-flag (C7.4); ``?hard=true`` bypasses the §5 grace window in one op
(C7.5); the batch return carries the unified ``{ok, affected}`` shape (C7.6 —
the W5.c contract-bug fix; not the retired ``{processed, errors}``).
"""

from __future__ import annotations

import json

import pytest
from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError

import api.routers.admin as admin
import api.services.database as database
from api.config import settings
from api.dependencies import admin_required
from api.models.admin import BatchGalleryRequest, SetUserStatusRequest
from api.models.gallery import SetTierRequest

from conftest import requires_mongo, run_db

from ._harness import bind, create_body, make_request, seed_fixtures
import api.routers.visualizations as viz
from api.models.visualization import VisualizationCreate


async def _create_public(db) -> str:
    raw = create_body(visibility="public")
    created = await viz.create_visualization(
        VisualizationCreate.model_validate_json(raw),
        make_request("POST", headers={"X-Session-Token": "tok-alpha"}, body=raw),
    )
    return json.loads(bytes(created.body))["slug"]


def test_non_admin_rejected():
    """C7.3 — no token → 503 (not configured) or 403; a wrong bearer → 403; never 200."""
    import asyncio

    saved = settings.admin_token
    try:
        # Unconfigured admin token → 503 admin-not-configured.
        settings.admin_token = ""
        with pytest.raises(HTTPException) as unconfigured:
            asyncio.run(admin_required(make_request("GET", path="/api/admin/verify")))
        assert unconfigured.value.status_code == 503
        # Configured token, wrong bearer → 403.
        settings.admin_token = "s3cret-admin-token"
        with pytest.raises(HTTPException) as wrong:
            asyncio.run(admin_required(
                make_request("GET", path="/api/admin/verify",
                             headers={"Authorization": "Bearer not-the-token"})))
        assert wrong.value.status_code == 403
        # Correct bearer → True (never raises).
        ok = asyncio.run(admin_required(
            make_request("GET", path="/api/admin/verify",
                         headers={"Authorization": "Bearer s3cret-admin-token"})))
        assert ok is True
    finally:
        settings.admin_token = saved


@requires_mongo
def test_audit_row_per_action():
    """C7.1 — an admin mutation writes one ``admin_audit`` row with the action + target."""
    async def body(db):
        bind(db)
        await seed_fixtures(db)
        slug = await _create_public(db)
        etag = (await db.visualizations.find_one({"slug": slug}))
        # Recompute the current ETag for the If-Match precondition.
        from api.lib.crud.etag import compute_etag

        req = make_request("PUT", path=f"/api/admin/visualizations/{slug}/tier",
                           headers={"If-Match": compute_etag(etag)})
        resp = await admin.set_tier(slug, SetTierRequest(tier="featured"), req)
        rows = await db.admin_audit.count_documents(
            {"action": "set_tier:featured", "target": slug}
        )
        return resp.status_code, rows

    status, rows = run_db(body)
    assert status == 200
    assert rows == 1


@requires_mongo
def test_idempotent_suspend():
    """C7.2 — suspending twice → 200 + 200; both audited."""
    async def body(db):
        bind(db)
        await db.users.insert_one({"_id": "zeta-eta-theta-iota"})
        req1 = make_request("POST", path="/api/admin/users/zeta-eta-theta-iota/status")
        req2 = make_request("POST", path="/api/admin/users/zeta-eta-theta-iota/status")
        r1 = await admin.set_user_status("zeta-eta-theta-iota",
                                         SetUserStatusRequest(status="suspended"), req1)
        r2 = await admin.set_user_status("zeta-eta-theta-iota",
                                         SetUserStatusRequest(status="suspended"), req2)
        audited = await db.admin_audit.count_documents(
            {"action": "set_user_status:suspended", "target": "zeta-eta-theta-iota"}
        )
        return r1.status_code, r2.status_code, audited

    s1, s2, audited = run_db(body)
    assert s1 == 200 and s2 == 200
    assert audited == 2


@requires_mongo
def test_flag_uniqueness():
    """C7.4 — ``(content_hash, reporter_slug)`` is unique; a double-flag raises DuplicateKeyError."""
    async def body(db):
        await db.flags.create_index([("content_hash", 1), ("reporter_slug", 1)], unique=True)
        await db.flags.insert_one({"content_hash": "h", "reporter_slug": "r", "reason": "spam"})
        try:
            await db.flags.insert_one(
                {"content_hash": "h", "reporter_slug": "r", "reason": "other"}
            )
            return "no-error"
        except DuplicateKeyError:
            return "duplicate-rejected"

    assert run_db(body) == "duplicate-rejected"


@requires_mongo
def test_hard_delete_bypasses_grace():
    """C7.5 — ``?hard=true`` hard-deletes in one op (no grace) + writes an audit row."""
    async def body(db):
        bind(db)
        await seed_fixtures(db)
        slug = await _create_public(db)
        req = make_request("DELETE", path=f"/api/admin/visualizations/{slug}?hard=true")
        resp = await admin.delete_visualization(slug, req, hard=True)
        remaining = await db.visualizations.count_documents({"slug": slug})
        audited = await db.admin_audit.count_documents({"action": "delete:hard", "target": slug})
        return resp.status_code, remaining, audited

    status, remaining, audited = run_db(body)
    assert status == 200
    assert remaining == 0  # gone in one operation, not soft-deleted
    assert audited == 1


@requires_mongo
def test_batch_return_shape():
    """C7.6 — batch returns the unified ``{ok, affected}`` shape (W5.c contract-bug fix)."""
    async def body(db):
        bind(db)
        await seed_fixtures(db)
        slug = await _create_public(db)
        req = make_request("POST", path="/api/admin/visualizations/batch")
        resp = await admin.batch_visualizations(
            BatchGalleryRequest(action="delete", hashes=[slug, "absent-slug-not-here"]), req
        )
        return resp.status_code, json.loads(bytes(resp.body))

    status, payload = run_db(body)
    assert status == 200
    assert payload["ok"] is True
    assert payload["affected"] == 1  # one real slug soft-deleted, the absent one a no-op
    assert "processed" not in payload  # the retired offset-shape key is gone
