"""Shared FastAPI dependencies."""

from __future__ import annotations

import hashlib
import hmac
import io
import logging
import re
import time
from datetime import UTC, datetime
from typing import Any, cast

from fastapi import HTTPException, Request
from PIL import Image, ImageOps
from pydantic import ValidationError
from pymongo import ReturnDocument

from api.config import settings
from api.models.assets import ImageAsset
from api.services.database import get_db, touch_document

logger = logging.getLogger(__name__)

# In-memory suspension cache: {user_slug: expires_at_monotonic}
# 60-second TTL avoids a DB round-trip on every authenticated request.
_suspended_cache: dict[str, float] = {}
_SUSPENSION_CACHE_TTL = 60.0

# CRUD-CONTRACT §2: the *visualization* slug shape — the user-named noun is
# exactly four lowercase hyphenated words (matches ``api/lib/crud/slugs.SLUG_PATTERN``).
SLUG_PATTERN = re.compile(r"^[a-z]+(-[a-z]+){3}$")

# The *image* slug is an internal content-addressed FK, NOT the user-named noun.
# New image slugs are 4-word (issued via ``slug_with_retry`` → ``generate_slug``),
# but legacy slugs were ``coolname``-issued (variable token count, e.g.
# ``statuesque-meteoric-numbat-of-force``). The W3 migration keeps ``image_slug``
# as a STABLE FK (image-blob Option B — images are not migrated), so the image
# validator must accept both forms or legacy images fail to load post-migration.
# Hence the laxer pre-B shape here, distinct from the strict visualization slug.
IMAGE_SLUG_PATTERN = re.compile(r"^[a-zA-Z0-9][-a-zA-Z0-9]{2,80}$")


def validate_image_slug(slug: str) -> str:
    if not IMAGE_SLUG_PATTERN.match(slug):
        raise HTTPException(status_code=400, detail="Invalid image slug")
    return slug


async def get_image_asset(image_slug: str) -> ImageAsset:
    """Fetch full image document and return the typed asset.

    404 if the image is absent. 410 if the document is pre-migration (lacks
    the ``storage_uri`` field that the typed ``ImageAsset`` model requires) —
    a Pydantic ``ValidationError`` at the model boundary is surfaced as a
    clean 410 ``Gone`` rather than swallowed as a 500 ``KeyError`` deeper in
    the call chain (D.W3 γ ``W3.G_typed-shim-hardening``).
    """
    image_slug = validate_image_slug(image_slug)
    db = get_db()
    doc = await db.images.find_one({"image_slug": image_slug})
    if doc is None:
        raise HTTPException(status_code=404, detail="Image not found")
    try:
        asset = ImageAsset.model_validate(doc)
    except ValidationError as exc:
        logger.warning(
            "Pre-migration image asset rejected by typed shim: %s (%s)",
            image_slug,
            exc.errors(include_url=False),
        )
        raise HTTPException(
            status_code=410, detail="Image asset is pre-migration and unavailable"
        )
    await touch_document("images", {"image_slug": image_slug})
    return asset


async def get_image_meta(image_slug: str) -> dict[str, Any]:
    """Fetch image metadata (excluding blob). 404 if not found."""
    image_slug = validate_image_slug(image_slug)
    db = get_db()
    doc = await db.images.find_one({"image_slug": image_slug}, {"blob": 0})
    if doc is None:
        raise HTTPException(status_code=404, detail="Image not found")
    return cast("dict[str, Any]", doc)


async def get_contour(contour_hash: str) -> dict[str, Any]:
    """Fetch contour document. 404 if not found.

    Lazily backfills ``image_bounds`` for pre-migration contours by loading
    the linked image, applying the same resize logic as contour extraction,
    and persisting the computed bounds.
    """
    db = get_db()
    doc = await db.contours.find_one({"contour_hash": contour_hash})
    if doc is None:
        raise HTTPException(status_code=404, detail="Contour not found")
    await touch_document("contours", {"contour_hash": contour_hash})

    if doc.get("image_bounds") is None and doc.get("image_slug"):
        doc = await _backfill_image_bounds(db, doc)

    return cast("dict[str, Any]", doc)


async def _backfill_image_bounds(db: Any, contour_doc: dict[str, Any]) -> dict[str, Any]:
    """Compute and persist image_bounds for a contour that lacks it.

    The fetched image document is validated through ``ImageAsset`` — a
    pre-migration shape (missing ``storage_uri``) becomes a typed
    ``ValidationError`` here rather than a ``KeyError`` swallowed by the
    broad ``except`` below; the bounds backfill silently skips that
    contour (the prior C10 silent-degradation mode is foreclosed at the
    typed shim, not at the projection).
    """
    from api.services.image_storage import image_bytes

    # C10 (C.W5): project the shim's required fields. The required
    # ``image_slug`` is the projection key (Pydantic needs it on construct);
    # ``storage_uri`` + ``content_type`` are the bytes-resolution inputs.
    image_doc = await db.images.find_one(
        {"image_slug": contour_doc["image_slug"]},
        {"image_slug": 1, "storage_uri": 1, "content_type": 1},
    )
    if image_doc is None:
        return contour_doc

    try:
        asset = ImageAsset.model_validate(image_doc)
    except ValidationError:
        logger.warning(
            "Pre-migration image rejected by typed shim during bounds backfill: %s",
            contour_doc.get("image_slug"),
        )
        return contour_doc

    try:
        data, _ = image_bytes(asset)
        opened = Image.open(io.BytesIO(data))
        img: Image.Image = ImageOps.exif_transpose(opened) or opened
        orig_w, orig_h = img.size
        img.close()

        # Use default extraction resize of 1024
        resize = 1024
        ratio = resize / max(orig_w, orig_h)
        rw = int(orig_w * ratio)
        rh = int(orig_h * ratio)

        image_bounds = {
            "minX": -rw / 2,
            "maxX": rw / 2,
            "minY": -rh / 2,
            "maxY": rh / 2,
        }

        await db.contours.update_one(
            {"_id": contour_doc["_id"]},
            {"$set": {"image_bounds": image_bounds}},
        )
        contour_doc["image_bounds"] = image_bounds
        logger.info("Backfilled image_bounds for contour %s", contour_doc["contour_hash"])
    except Exception:
        logger.warning(
            "Failed to backfill image_bounds for %s", contour_doc.get("contour_hash"), exc_info=True
        )

    return contour_doc


# ---------------------------------------------------------------------------
# Auth / session helpers
# ---------------------------------------------------------------------------


def get_client_ip(request: Request) -> str:
    """Extract client IP from X-Forwarded-For or request.client."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    if request.client:
        return request.client.host
    logger.warning("Could not determine client IP")
    return "unknown"


def hash_ip(ip: str) -> str:
    """SHA-256 hash of IP address for privacy-safe storage."""
    return hashlib.sha256(ip.encode()).hexdigest()


async def resolve_session(request: Request) -> str | None:
    """Extract X-Session-Token, resolve to user_slug.
    Returns None if no header. Raises 401 if header present but invalid/expired."""
    token = request.headers.get("X-Session-Token")
    if not token:
        return None
    db = get_db()
    session = await db.sessions.find_one_and_update(
        {"_id": token, "expires_at": {"$gt": datetime.now(UTC)}},
        {"$set": {"last_seen_at": datetime.now(UTC)}},
        return_document=ReturnDocument.AFTER,
    )
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user_slug = session["user_slug"]

    # Check suspension status (with 60s cache)
    now_mono = time.monotonic()
    cached_expiry = _suspended_cache.get(user_slug)
    if cached_expiry and cached_expiry > now_mono:
        raise HTTPException(status_code=403, detail="Account suspended")
    elif cached_expiry is None or cached_expiry <= now_mono:
        user = await db.users.find_one({"_id": user_slug}, {"status": 1})
        if user and user.get("status") == "suspended":
            _suspended_cache[user_slug] = now_mono + _SUSPENSION_CACHE_TTL
            raise HTTPException(status_code=403, detail="Account suspended")
        else:
            _suspended_cache.pop(user_slug, None)

    # Touch the user
    await db.users.update_one(
        {"_id": user_slug},
        {"$set": {"last_seen_at": datetime.now(UTC)}},
    )
    return cast("str", user_slug)


def invalidate_suspension_cache(user_slug: str) -> None:
    """Remove a user from the suspension cache (call after status change)."""
    _suspended_cache.pop(user_slug, None)


def mark_suspended_in_cache(user_slug: str) -> None:
    """Eagerly mark a user as suspended in the cache."""
    _suspended_cache[user_slug] = time.monotonic() + _SUSPENSION_CACHE_TTL


async def require_session(request: Request) -> str:
    """Dependency that requires a valid session."""
    user_slug = await resolve_session(request)
    if not user_slug:
        raise HTTPException(status_code=401, detail="Session required")
    return user_slug


async def admin_required(request: Request) -> bool:
    """Timing-safe Bearer token validation."""
    if not settings.admin_token:
        raise HTTPException(status_code=503, detail="Admin not configured")
    auth = request.headers.get("Authorization", "")
    expected = f"Bearer {settings.admin_token}"
    if not hmac.compare_digest(auth.encode(), expected.encode()):
        raise HTTPException(status_code=403, detail="Forbidden")
    return True
