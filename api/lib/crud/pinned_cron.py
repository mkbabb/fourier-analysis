"""``pinned: bool`` flag + bounded cron prune (CRUD-CONTRACT §8).

Retires the unbounded ``$nin``-over-``distinct()`` janitor anti-pattern. The
prune query is the indexed ``{pinned: False, last_accessed_at: {$lt: cutoff}}``
shape; ``(pinned, last_accessed_at)`` is the required compound index.
"""

from datetime import datetime

from motor.motor_asyncio import AsyncIOMotorCollection


async def mark_pinned(
    collection: AsyncIOMotorCollection,
    query: dict,
    pinned: bool,
) -> int:
    """Set ``pinned`` on every doc matching ``query``. Returns matched count.

    Called on entity publish (pin children) / unpublish (recompute pin).
    """
    result = await collection.update_many(query, {"$set": {"pinned": pinned}})
    return result.matched_count


async def cron_prune(
    collection: AsyncIOMotorCollection,
    *,
    cutoff: datetime,
    batch_size: int = 1000,
) -> int:
    """Bounded prune. Returns the total deleted count.

    Query (R-lifecycle-spec §4.2): ``{pinned: False, last_accessed_at:
    {$lt: cutoff}}``. Required index: ``(pinned, last_accessed_at)``.
    ``batch_size`` chunks the delete via repeated bounded ``_id`` queries,
    guarding against a runaway delete on a pathological cutoff.
    """
    predicate = {"pinned": False, "last_accessed_at": {"$lt": cutoff}}
    total = 0
    while True:
        ids = await collection.find(predicate, {"_id": 1}).limit(batch_size).to_list(batch_size)
        if not ids:
            break
        result = await collection.delete_many({"_id": {"$in": [d["_id"] for d in ids]}})
        total += result.deleted_count
        if len(ids) < batch_size:
            break
    return total
