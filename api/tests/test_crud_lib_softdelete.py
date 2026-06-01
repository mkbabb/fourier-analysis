"""W3.12 spec — api/lib/crud/softdelete.py (CRUD-CONTRACT §5 state machine).

Pure helpers (filters) run with no DB. The state-machine rows (soft_delete /
restore over a collection) require a live Mongo and skip otherwise.
"""

import asyncio
import uuid
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import Any

from api.lib.crud import softdelete

from conftest import _MONGO_URI, requires_mongo, run_db


def _run_db_naive(body: Callable[[Any], Awaitable[Any]]) -> Any:
    """Like ``conftest.run_db`` but with a ``tz_aware=False`` client.

    The H.W4 (γ) naive-row regression below needs a ``deleted_at`` that reads
    back as a *naive* datetime (``tzinfo is None``) — exactly the legacy-row
    shape the ``softdelete.py:64-65`` guard defends against. The production /
    conftest client is ``tz_aware=True`` (it re-attaches UTC on read, hiding the
    naive case), so this throwaway-database runner pins ``tz_aware=False`` to
    faithfully round-trip a naive BSON date back as naive — proving ``restore``'s
    grace comparison does NOT raise the "can't compare offset-naive and
    offset-aware datetimes" ``TypeError``.
    """
    from motor.motor_asyncio import AsyncIOMotorClient

    async def _runner() -> Any:
        client = AsyncIOMotorClient(_MONGO_URI, serverSelectionTimeoutMS=800, tz_aware=False)
        name = f"fourier_crudlib_naive_test_{uuid.uuid4().hex[:8]}"
        try:
            return await body(client[name])
        finally:
            await client.drop_database(name)
            client.close()

    return asyncio.run(_runner())


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


# ── H.W4 (γ) — naive-datetime ``deleted_at`` regression ───────────────────────
#
# Locks in the ``softdelete.py:64-65`` guard:
#
#     if deleted_at.tzinfo is None:
#         deleted_at = deleted_at.replace(tzinfo=UTC)
#
# A row whose ``deleted_at`` is a *naive* datetime (no tzinfo — e.g. written by a
# legacy / non-tz-aware client) must NOT crash ``restore``. Without the guard,
# the grace comparison ``deleted_at < datetime.now(UTC) - timedelta(...)`` raises
# ``TypeError: can't compare offset-naive and offset-aware datetimes`` because
# ``datetime.now(UTC)`` is aware. ``_run_db_naive`` pins ``tz_aware=False`` so the
# inserted naive value round-trips back naive (the conftest ``tz_aware=True``
# client would silently re-attach UTC and never exercise the branch).


@requires_mongo
def test_restore_naive_deleted_at_within_grace_does_not_raise_and_restores():
    """Naive ``deleted_at`` inside the grace window → restored, no TypeError."""

    async def body(db):
        recent_naive = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=1)
        assert recent_naive.tzinfo is None  # guard the test's own premise
        await db.viz.insert_one(
            {"slug": "a-b-c-d", "owner_slug": "u", "deleted_at": recent_naive}
        )
        # Confirm the row really reads back naive (the precondition the guard exists for).
        raw = await db.viz.find_one({"slug": "a-b-c-d"}, {"deleted_at": 1})
        assert raw["deleted_at"].tzinfo is None
        # Must NOT raise the naive/aware comparison TypeError.
        result = await softdelete.restore(db.viz, "a-b-c-d", owner_slug="u")
        doc = await db.viz.find_one({"slug": "a-b-c-d"})
        return result, doc["deleted_at"]

    result, deleted_at = _run_db_naive(body)
    assert result == "restored" and deleted_at is None


@requires_mongo
def test_restore_naive_deleted_at_past_grace_returns_expired():
    """Naive ``deleted_at`` older than the grace window → expired, no TypeError."""

    async def body(db):
        old_naive = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=31)
        assert old_naive.tzinfo is None
        await db.viz.insert_one(
            {"slug": "a-b-c-d", "owner_slug": "u", "deleted_at": old_naive}
        )
        raw = await db.viz.find_one({"slug": "a-b-c-d"}, {"deleted_at": 1})
        assert raw["deleted_at"].tzinfo is None
        # Must NOT raise; the past-grace branch returns "expired" (no mutation).
        result = await softdelete.restore(db.viz, "a-b-c-d", owner_slug="u", grace_days=30)
        doc = await db.viz.find_one({"slug": "a-b-c-d"})
        return result, doc["deleted_at"]

    result, deleted_at = _run_db_naive(body)
    # Past grace: "expired", and the doc is left untouched (still soft-deleted, naive).
    assert result == "expired" and deleted_at is not None and deleted_at.tzinfo is None
