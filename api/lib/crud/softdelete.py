"""``deleted_at`` soft-delete primitives (CRUD-CONTRACT §5).

No cascade on soft-delete (R-lifecycle-spec §3.2); the cron handles hard-delete
cascade via ``pinned_cron.cron_prune``. ``hard_delete_past_grace`` is NOT
exported (R3 §1.4).
"""

from datetime import UTC, datetime, timedelta
from typing import Literal

from motor.motor_asyncio import AsyncIOMotorCollection
from pydantic import BaseModel


class SoftDeleteMixin(BaseModel):
    """Pydantic mixin: every persisted entity inherits this ``deleted_at`` field."""

    deleted_at: datetime | None = None


def not_deleted_filter() -> dict:
    """``{"deleted_at": None}`` — use in every list/read query."""
    return {"deleted_at": None}


def with_not_deleted(query: dict) -> dict:
    """``query | {"deleted_at": None}``; does not mutate ``query``."""
    return {**query, "deleted_at": None}


async def soft_delete(
    collection: AsyncIOMotorCollection, slug: str, *, owner_slug: str | None = None
) -> bool:
    """``deleted_at = now()`` on the live ``slug`` doc (owner-bound if ``owner_slug``).

    True on modification; False if no matching live row. Does NOT cascade.
    """
    query: dict = {"slug": slug, "deleted_at": None}
    if owner_slug is not None:
        query["owner_slug"] = owner_slug
    result = await collection.update_one(query, {"$set": {"deleted_at": datetime.now(UTC)}})
    return result.modified_count > 0


async def restore(
    collection: AsyncIOMotorCollection,
    slug: str,
    *,
    owner_slug: str | None = None,
    grace_days: int = 30,
) -> Literal["restored", "not_found", "expired"]:
    """Clear ``deleted_at`` within grace; past grace → ``expired`` (callers map 200/404/410)."""
    query: dict = {"slug": slug}
    if owner_slug is not None:
        query["owner_slug"] = owner_slug
    doc = await collection.find_one(query, {"deleted_at": 1})
    if doc is None:
        return "not_found"

    deleted_at = doc.get("deleted_at")
    if deleted_at is None:
        return "restored"  # already alive — idempotent

    if deleted_at.tzinfo is None:
        deleted_at = deleted_at.replace(tzinfo=UTC)
    if deleted_at < datetime.now(UTC) - timedelta(days=grace_days):
        return "expired"

    await collection.update_one(
        query, {"$set": {"deleted_at": None, "restored_at": datetime.now(UTC)}}
    )
    return "restored"
