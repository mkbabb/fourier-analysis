"""Gallery browsing and publishing endpoints."""

from __future__ import annotations

import base64
import json
import logging
import re
from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pymongo.errors import DuplicateKeyError

from api.dependencies import (
    get_client_ip,
    hash_ip,
    require_session,
    resolve_session,
)
from api.models.admin import CursorInfo, FlagRequest, GalleryCursorResponse
from api.models.gallery import (
    GalleryEntryResponse,
    PublishRequest,
    UpdateEntryRequest,
)
from api.services.database import get_db
from api.services.rate_limiter import like_limiter, write_limiter

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

gallery_router = APIRouter(prefix="/api/gallery", tags=["gallery"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

SORT_KEYS = {
    "newest": ("created_at", -1),
    "views": ("views", -1),
    "likes": ("likes", -1),
}


def _entry_from_doc(doc: dict) -> GalleryEntryResponse:
    """Build a response model from a MongoDB gallery document."""
    data = {k: v for k, v in doc.items() if k not in ("_id", "liked_ips")}
    return GalleryEntryResponse(**data)


def _encode_cursor(doc: dict, sort_field: str) -> str:
    val = doc[sort_field]
    payload = {
        "s": val.isoformat() if hasattr(val, "isoformat") else val,
        "id": str(doc["_id"]),
    }
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()


def _decode_cursor(raw: str) -> dict | None:
    try:
        data = json.loads(base64.urlsafe_b64decode(raw))
        return data
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Public gallery endpoints
# ---------------------------------------------------------------------------


@gallery_router.get("/cursor")
async def list_gallery_cursor(
    limit: int = Query(default=20, ge=1, le=100),
    sort: str = Query(default="newest"),
    cursor: str = Query(default=""),
    tier: str = Query(default="all"),
    q: str = Query(default=""),
    basis: str = Query(default=""),
    user_slug: str = Query(default=""),
):
    """Cursor-based pagination for gallery entries."""
    db = get_db()

    # Build base filter (same as offset-based endpoint)
    base_filter: dict = {}
    if tier != "all":
        base_filter["tier"] = tier
    if q:
        base_filter["image_slug"] = {"$regex": re.escape(q), "$options": "i"}
    if basis:
        base_filter["active_bases"] = basis
    if user_slug:
        base_filter["user_slug"] = user_slug

    sort_field, sort_dir = SORT_KEYS.get(sort, SORT_KEYS["newest"])

    # Build cursor filter
    query_filter = dict(base_filter)
    if cursor:
        cursor_data = _decode_cursor(cursor)
        if cursor_data:
            # Parse cursor value back to the correct type
            if sort_field == "created_at":
                cursor_val = datetime.fromisoformat(cursor_data["s"])
            else:
                cursor_val = cursor_data["s"]

            cursor_id = ObjectId(cursor_data["id"])
            cmp = "$lt" if sort_dir == -1 else "$gt"
            query_filter["$or"] = [
                {sort_field: {cmp: cursor_val}},
                {sort_field: cursor_val, "_id": {cmp: cursor_id}},
            ]

    docs = (
        await db.gallery.find(query_filter, {"liked_ips": 0})
        .sort([(sort_field, sort_dir), ("_id", sort_dir)])
        .limit(limit + 1)
        .to_list(limit + 1)
    )

    has_more = len(docs) > limit
    if has_more:
        docs = docs[:limit]

    items = [_entry_from_doc(doc) for doc in docs]

    next_cursor = _encode_cursor(docs[-1], sort_field) if has_more and docs else None

    # No `count_documents` on the hot path — cursor pagination needs no total.
    # The previous O(n) count drag is dropped; the UI shows the loaded entries
    # and the cursor's has_more flag tells the reader whether more remain.
    return GalleryCursorResponse(
        items=items,
        cursor=CursorInfo(next_cursor=next_cursor, has_more=has_more),
    )


@gallery_router.get("/{hash}", response_model=GalleryEntryResponse)
async def get_gallery_entry(hash: str):
    """Fetch a single gallery entry by snapshot_hash."""
    db = get_db()
    doc = await db.gallery.find_one({"snapshot_hash": hash})
    if doc is None:
        raise HTTPException(status_code=404, detail="Gallery entry not found")
    return _entry_from_doc(doc)


@gallery_router.post("", response_model=GalleryEntryResponse)
async def publish_to_gallery(body: PublishRequest, request: Request):
    """Publish a snapshot to the gallery."""
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)
    write_limiter.check(ip_hashed)

    user_slug = await resolve_session(request)

    db = get_db()

    # Verify snapshot exists
    snapshot = await db.snapshots.find_one({"snapshot_hash": body.snapshot_hash})
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    # Check for duplicate
    existing = await db.gallery.find_one({"snapshot_hash": body.snapshot_hash})
    if existing is not None:
        raise HTTPException(status_code=409, detail="Snapshot already published")

    now = datetime.now(UTC)

    # Extract denormalized fields from snapshot's nested settings
    anim_settings = snapshot.get("animation_settings", {})
    contour_settings = snapshot.get("contour_settings", {})
    active_bases = anim_settings.get("active_bases", [])
    n_harmonics = contour_settings.get("n_harmonics", 0)

    gallery_doc = {
        "snapshot_hash": body.snapshot_hash,
        "image_slug": body.image_slug,
        "contour_hash": snapshot.get("contour_hash", ""),
        "user_slug": user_slug,
        "tier": "normal",
        "views": 0,
        "likes": 0,
        "liked_ips": [],
        "active_bases": active_bases,
        "n_harmonics": n_harmonics,
        "created_at": now,
        "updated_at": now,
    }

    await db.gallery.insert_one(gallery_doc)
    return _entry_from_doc(gallery_doc)


@gallery_router.post("/{hash}/view")
async def increment_view(hash: str):
    """Increment the view counter for a gallery entry."""
    db = get_db()
    result = await db.gallery.update_one(
        {"snapshot_hash": hash},
        {"$inc": {"views": 1}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gallery entry not found")

    doc = await db.gallery.find_one({"snapshot_hash": hash}, {"views": 1})
    return {"views": doc["views"]}


@gallery_router.post("/{hash}/like")
async def toggle_like(hash: str, request: Request):
    """Toggle a like for a gallery entry, keyed by hashed IP."""
    client_ip = get_client_ip(request)
    ip_hashed = hash_ip(client_ip)
    like_limiter.check(ip_hashed)

    db = get_db()
    doc = await db.gallery.find_one({"snapshot_hash": hash})
    if doc is None:
        raise HTTPException(status_code=404, detail="Gallery entry not found")

    liked_ips: list = doc.get("liked_ips", [])
    if ip_hashed in liked_ips:
        # Unlike
        await db.gallery.update_one(
            {"snapshot_hash": hash},
            {"$pull": {"liked_ips": ip_hashed}, "$inc": {"likes": -1}},
        )
        liked = False
    else:
        # Like
        await db.gallery.update_one(
            {"snapshot_hash": hash},
            {"$push": {"liked_ips": ip_hashed}, "$inc": {"likes": 1}},
        )
        liked = True

    updated = await db.gallery.find_one({"snapshot_hash": hash}, {"likes": 1})
    return {"liked": liked, "likes": updated["likes"]}


# ---------------------------------------------------------------------------
# Entry ownership CRUD
# ---------------------------------------------------------------------------


@gallery_router.delete("/{hash}")
async def delete_own_entry(
    hash: str, request: Request, user_slug: str = Depends(require_session)
):
    """Delete a gallery entry owned by the current user."""
    db = get_db()
    doc = await db.gallery.find_one({"snapshot_hash": hash})
    if doc is None:
        raise HTTPException(status_code=404, detail="Gallery entry not found")
    if doc["user_slug"] != user_slug:
        raise HTTPException(status_code=403, detail="Not your entry")

    await db.gallery.delete_one({"snapshot_hash": hash})
    await db.flags.delete_many({"snapshot_hash": hash})
    return {"ok": True}


@gallery_router.put("/{hash}", response_model=GalleryEntryResponse)
async def update_own_entry(
    hash: str,
    body: UpdateEntryRequest,
    request: Request,
    user_slug: str = Depends(require_session),
):
    """Update a gallery entry owned by the current user."""
    db = get_db()
    doc = await db.gallery.find_one({"snapshot_hash": hash})
    if doc is None:
        raise HTTPException(status_code=404, detail="Gallery entry not found")
    if doc["user_slug"] != user_slug:
        raise HTTPException(status_code=403, detail="Not your entry")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(UTC)

    await db.gallery.update_one({"snapshot_hash": hash}, {"$set": updates})
    updated_doc = await db.gallery.find_one({"snapshot_hash": hash})
    return _entry_from_doc(updated_doc)


@gallery_router.post("/{hash}/flag")
async def flag_entry(
    hash: str,
    body: FlagRequest,
    request: Request,
    user_slug: str = Depends(require_session),
):
    """Flag a gallery entry for moderation."""
    db = get_db()
    entry = await db.gallery.find_one({"snapshot_hash": hash})
    if entry is None:
        raise HTTPException(status_code=404, detail="Gallery entry not found")

    if entry["user_slug"] == user_slug:
        raise HTTPException(status_code=400, detail="Cannot flag own entry")

    flag_doc = {
        "snapshot_hash": hash,
        "reporter_slug": user_slug,
        "reason": body.reason,
        "detail": body.detail,
        "created_at": datetime.now(UTC),
    }

    try:
        await db.flags.insert_one(flag_doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Already flagged")

    return {"flagged": True}
