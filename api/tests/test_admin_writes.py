"""X·F F-D6 (FW6-G8, G9, G10, G12) — admin writes are stated, attributed and cascaded.

(a) every audit row names its actor ({kind: user | system, id}); the janitor is
    a system actor and carries no IP hash, never a sentinel in ``ip_hash``;
(b) a tier write follows the stated transition table: unfeaturing a ``saved``
    row is skipped (and reported), never an overwrite;
(c) the grace hard-delete leaves no flag keyed to a hash no row holds;
(d) every admin route declares its response model.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.routing import APIRoute

import api.services.database as database
from api.config import settings
from api.services import janitor

from conftest import asgi, requires_mongo, run_db

TOKEN = "fd6-admin-fixture-token"


@pytest.fixture
def admin(monkeypatch):
    monkeypatch.setattr(settings, "admin_token", TOKEN)
    return [("Authorization", f"Bearer {TOKEN}"), ("Content-Type", "application/json")]


async def _indexes(db) -> None:
    await db.contours.create_index("contour_hash", unique=True)
    await db.images.create_index("image_slug", unique=True)


@requires_mongo
def test_audit_rows_name_their_actor(admin):
    """(a) the janitor is {kind: system}; an admin write is {kind: user}; ip_hash is never a sentinel."""

    async def body(db):
        database._db = db
        await _indexes(db)
        old = datetime.now(UTC) - timedelta(days=400)
        await db.visualizations.insert_one({"slug": "gone-viz-aa-bb", "owner_slug": "o", "deleted_at": old})
        await janitor._cleanup_cycle()
        await db.visualizations.insert_one(
            {"slug": "live-viz-cc-dd", "owner_slug": "o", "deleted_at": None, "tier": "normal"}
        )
        await asgi("POST", "/api/admin/visualizations/batch",
                   json.dumps({"action": "feature", "hashes": ["live-viz-cc-dd"]}).encode(), admin)
        return [r async for r in db.admin_audit.find({})]

    rows = run_db(body)
    system = [r for r in rows if r["action"].startswith("janitor:")]
    user = [r for r in rows if r["action"].startswith("batch_visualizations:")]
    assert system and user
    for r in system:
        assert r["actor"] == {"kind": "system", "id": "janitor"}
        assert r["ip_hash"] is None
    for r in user:
        assert r["actor"]["kind"] == "user"
        assert r["ip_hash"] and not r["ip_hash"].startswith("system:")


@requires_mongo
def test_tier_writes_follow_the_transition_table(admin):
    """(b) unfeature on a saved row is skipped; on a featured row it applies."""

    async def body(db):
        database._db = db
        for slug, tier in (("saved-one-aa-bb", "saved"), ("feat-one-cc-dd", "featured")):
            await db.visualizations.insert_one(
                {"slug": slug, "owner_slug": "o", "deleted_at": None, "tier": tier}
            )
        status, raw = await asgi(
            "POST", "/api/admin/visualizations/batch",
            json.dumps({"action": "unfeature", "hashes": ["saved-one-aa-bb", "feat-one-cc-dd"]}).encode(),
            admin,
        )
        tiers = {d["slug"]: d["tier"] async for d in db.visualizations.find({})}
        return status, json.loads(raw), tiers

    status, payload, tiers = run_db(body)
    assert status == 200
    assert tiers == {"saved-one-aa-bb": "saved", "feat-one-cc-dd": "normal"}
    assert payload["affected"] == 1
    assert payload["skipped"] == ["saved-one-aa-bb"]


@requires_mongo
def test_grace_hard_delete_cascades_flags_by_content_hash():
    """(c) a hard-deleted row's flags go with it unless another row still holds the hash."""

    async def body(db):
        database._db = db
        await _indexes(db)
        old = datetime.now(UTC) - timedelta(days=400)
        await db.visualizations.insert_many([
            {"slug": "gone-viz-aa-bb", "owner_slug": "o", "content_hash": "H-gone", "deleted_at": old},
            {"slug": "gone-twin-cc-dd", "owner_slug": "o", "content_hash": "H-shared", "deleted_at": old},
            {"slug": "live-twin-ee-ff", "owner_slug": "o", "content_hash": "H-shared", "deleted_at": None},
        ])
        await db.users.insert_one({"_id": "reporter", "last_seen_at": datetime.now(UTC)})
        await db.flags.insert_many([
            {"content_hash": "H-gone", "reporter_slug": "reporter", "created_at": old},
            {"content_hash": "H-shared", "reporter_slug": "reporter", "created_at": old},
        ])
        await janitor._cleanup_cycle()
        return sorted([f["content_hash"] async for f in db.flags.find({})])

    assert run_db(body) == ["H-shared"]


def test_every_admin_route_declares_a_response_model():
    """(d) the route walk: 13 admin routes, each with a response_model."""
    from api.main import app

    routes = [r for r in app.routes if isinstance(r, APIRoute) and r.path.startswith("/api/admin")]
    missing = sorted(f"{sorted(r.methods)} {r.path}" for r in routes if r.response_model is None)
    assert len(routes) == 13
    assert missing == []


@requires_mongo
def test_the_audit_trail_migrates_to_one_shape():
    """The stored trail is backfilled: the janitor sentinel becomes a system actor."""
    from api.models.admin import AuditEntry
    from api.scripts.migrate_audit_actor import run_migration

    async def body(db):
        now = datetime.now(UTC)
        await db.admin_audit.insert_many([
            {"timestamp": now, "action": "janitor:prune_images", "target": "count=1", "ip_hash": "system:janitor"},
            {"timestamp": now, "action": "delete", "target": "x", "ip_hash": "abc123"},
        ])
        await run_migration(db)
        await run_migration(db)  # idempotent
        return [AuditEntry(**{k: v for k, v in r.items() if k != "_id"}) async for r in db.admin_audit.find({})]

    entries = {e.action: e for e in run_db(body)}
    assert entries["janitor:prune_images"].actor.kind == "system"
    assert entries["janitor:prune_images"].ip_hash is None
    assert entries["delete"].actor.model_dump() == {"kind": "user", "id": "admin"}
    assert entries["delete"].ip_hash == "abc123"
