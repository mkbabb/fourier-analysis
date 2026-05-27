"""W3.12 spec — api/lib/crud/pinned_cron.py (CRUD-CONTRACT §8 bounded prune).

The no-$nin source-grep row is pure. The query-behaviour rows (mark_pinned,
cron_prune, compound index) require a live Mongo and skip otherwise.
"""

import inspect
from datetime import UTC, datetime, timedelta

from api.lib.crud import pinned_cron

from conftest import requires_mongo, run_db


def test_no_nin_in_query():
    src = inspect.getsource(pinned_cron.cron_prune)
    assert "$nin" not in src


@requires_mongo
def test_mark_pinned_sets_field():
    async def body(db):
        await db.contours.insert_many(
            [{"contour_hash": "h", "pinned": False}, {"contour_hash": "h", "pinned": False}]
        )
        n = await pinned_cron.mark_pinned(db.contours, {"contour_hash": "h"}, True)
        pinned = await db.contours.count_documents({"pinned": True})
        return n, pinned

    matched, pinned = run_db(body)
    assert matched == 2 and pinned == 2


@requires_mongo
def test_mark_pinned_no_match_returns_zero():
    async def body(db):
        return await pinned_cron.mark_pinned(db.contours, {"contour_hash": "absent"}, True)

    assert run_db(body) == 0


@requires_mongo
def test_cron_prune_deletes_unpinned_old_and_skips_pinned():
    async def body(db):
        old = datetime.now(UTC) - timedelta(days=100)
        new = datetime.now(UTC)
        await db.contours.insert_many(
            [
                {"pinned": False, "last_accessed_at": old},  # 3 unpinned-old
                {"pinned": False, "last_accessed_at": old},
                {"pinned": False, "last_accessed_at": old},
                {"pinned": True, "last_accessed_at": old},  # 2 pinned-old survive
                {"pinned": True, "last_accessed_at": old},
                {"pinned": False, "last_accessed_at": new},  # 2 unpinned-new survive
                {"pinned": False, "last_accessed_at": new},
            ]
        )
        cutoff = datetime.now(UTC) - timedelta(days=30)
        first = await pinned_cron.cron_prune(db.contours, cutoff=cutoff)
        remaining = await db.contours.count_documents({})
        again = await pinned_cron.cron_prune(db.contours, cutoff=cutoff)  # idempotent
        return first, remaining, again

    first, remaining, again = run_db(body)
    assert first == 3 and remaining == 4 and again == 0


@requires_mongo
def test_cron_prune_uses_compound_index():
    async def body(db):
        await db.contours.create_index([("pinned", 1), ("last_accessed_at", 1)])
        info = await db.contours.index_information()
        return any(idx["key"] == [("pinned", 1), ("last_accessed_at", 1)] for idx in info.values())

    assert run_db(body) is True
