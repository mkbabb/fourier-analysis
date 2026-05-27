"""W3.12 spec — api/lib/crud/softdelete.py (CRUD-CONTRACT §5 state machine).

Pure helpers (filters) run with no DB. The state-machine rows (soft_delete /
restore over a collection) require a live Mongo and skip otherwise.
"""

from datetime import UTC, datetime, timedelta

from api.lib.crud import softdelete

from conftest import requires_mongo, run_db


def test_not_deleted_filter_value():
    assert softdelete.not_deleted_filter() == {"deleted_at": None}


def test_with_not_deleted_does_not_mutate():
    q = {"visibility": "public"}
    out = softdelete.with_not_deleted(q)
    assert out == {"visibility": "public", "deleted_at": None}
    assert q == {"visibility": "public"}  # input unchanged


@requires_mongo
def test_soft_delete_sets_field():
    async def body(db):
        await db.viz.insert_one({"slug": "a-b-c-d", "owner_slug": "u", "deleted_at": None})
        ok = await softdelete.soft_delete(db.viz, "a-b-c-d", owner_slug="u")
        doc = await db.viz.find_one({"slug": "a-b-c-d"})
        return ok, doc["deleted_at"]

    ok, deleted_at = run_db(body)
    assert ok and deleted_at is not None


@requires_mongo
def test_soft_delete_owner_mismatch_returns_false():
    async def body(db):
        await db.viz.insert_one({"slug": "a-b-c-d", "owner_slug": "u", "deleted_at": None})
        ok = await softdelete.soft_delete(db.viz, "a-b-c-d", owner_slug="other")
        doc = await db.viz.find_one({"slug": "a-b-c-d"})
        return ok, doc["deleted_at"]

    ok, deleted_at = run_db(body)
    assert ok is False and deleted_at is None


@requires_mongo
def test_restore_within_grace_returns_restored():
    async def body(db):
        recent = datetime.now(UTC) - timedelta(days=1)
        await db.viz.insert_one({"slug": "a-b-c-d", "owner_slug": "u", "deleted_at": recent})
        result = await softdelete.restore(db.viz, "a-b-c-d", owner_slug="u")
        doc = await db.viz.find_one({"slug": "a-b-c-d"})
        return result, doc["deleted_at"]

    result, deleted_at = run_db(body)
    assert result == "restored" and deleted_at is None


@requires_mongo
def test_restore_past_grace_returns_expired():
    async def body(db):
        old = datetime.now(UTC) - timedelta(days=31)
        await db.viz.insert_one({"slug": "a-b-c-d", "owner_slug": "u", "deleted_at": old})
        return await softdelete.restore(db.viz, "a-b-c-d", owner_slug="u", grace_days=30)

    assert run_db(body) == "expired"


@requires_mongo
def test_restore_not_found_and_idempotent_noop():
    async def body(db):
        # never existed
        missing = await softdelete.restore(db.viz, "no-such-slug-here", owner_slug="u")
        # exists, never deleted → idempotent "restored"
        await db.viz.insert_one({"slug": "a-b-c-d", "owner_slug": "u", "deleted_at": None})
        alive = await softdelete.restore(db.viz, "a-b-c-d", owner_slug="u")
        return missing, alive

    missing, alive = run_db(body)
    assert missing == "not_found" and alive == "restored"
