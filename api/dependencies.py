"""Shared FastAPI dependencies."""

from __future__ import annotations

import hashlib
import hmac
import logging
import re
import time
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from typing import Any, cast

from fastapi import HTTPException, Request, Response
from pydantic import ValidationError
from pymongo import ReturnDocument

from api.config import settings
from api.models.assets import ImageAsset
from api.services.database import get_db

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
    # X·F F-D5: a read never writes — image recency rides the write verbs.
    return asset


async def get_contour(contour_hash: str) -> dict[str, Any]:
    """Fetch contour document. 404 if not found.

    X·F F-D7: a read never writes. The lazy ``image_bounds`` backfill that
    lived here moved to the one-time ``migrate_contour_bounds``; new contours
    carry their bounds from the write (extraction, or the editor's POST).
    """
    db = get_db()
    doc = await db.contours.find_one({"contour_hash": contour_hash})
    if doc is None:
        raise HTTPException(status_code=404, detail="Contour not found")
    return cast("dict[str, Any]", doc)


# ---------------------------------------------------------------------------
# Auth / session helpers
# ---------------------------------------------------------------------------


def get_client_ip(request: Request) -> str:
    """The real client IP behind the host-Apache → docker-nginx chain.

    nginx ``real_ip`` resolves the true client (recursive XFF, trusting only the
    docker bridge gateway) and stamps it as ``X-Real-IP`` — the single trusted
    source of client identity (G.β.2 / inv-11). The raw ``X-Forwarded-For`` is
    deliberately NOT consulted: its rightmost hop is the nginx gateway (not the
    client) and its leftmost hops are client-spoofable, so reading it gave every
    caller the gateway address (one shared bucket). Falls back to the connection
    peer for direct/in-cluster calls with no proxy in front."""
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


def token_required(scope: str) -> Callable[[Request, Response], Awaitable[str]]:
    """Dependency for the ``/api/v1`` routes: a live ``fk_`` bearer token with
    ``scope``, inside its own rate. Returns the token id.

    Missing, malformed, unknown, wrong-secret or revoked → 401 problem+json;
    a live token without ``scope`` → 403. The admin secret is not a token, so
    it is a 401 here. Failed attempts are counted per IP (``bad_token_limiter``),
    and an IP over that budget is refused before its token is read; a good
    token is counted under its id at its ``rate_per_min``. The RateLimit-*
    fields on the answer are the token's.
    """
    from api.lib.crud import errors
    from api.services import api_tokens
    from api.services.rate_limiter import bad_token_limiter, stamp, token_limiter

    def limited(limiter: Any, key: str, limit: int | None = None) -> errors.ProblemError:
        cap, _remaining, reset = limiter.snapshot(key, limit)
        response = errors.rate_limited(reset or int(limiter.window_seconds))
        stamp(response, cap, 0, reset)
        return errors.ProblemError(response)

    async def dependency(request: Request, response: Response) -> str:
        ip = hash_ip(get_client_ip(request))
        if bad_token_limiter.snapshot(ip)[1] == 0:
            raise limited(bad_token_limiter, ip)
        parsed = api_tokens.parse(request.headers.get("Authorization"))
        doc = await api_tokens.verify(*parsed) if parsed else None
        if doc is None:
            bad_token_limiter.check(ip)
            raise errors.ProblemError(errors.token_invalid(instance=request.url.path))
        if scope not in doc["scopes"]:
            raise errors.ProblemError(
                errors.token_scope(detail=f"this route needs the '{scope}' scope", instance=request.url.path)
            )
        rate = int(doc.get("rate_per_min") or api_tokens.DEFAULT_RATE_PER_MIN)
        try:
            token_limiter.check(doc["_id"], rate)
        except HTTPException:
            raise limited(token_limiter, doc["_id"], rate) from None
        await api_tokens.touch(doc)
        stamp(response, *token_limiter.snapshot(doc["_id"], rate))
        return cast("str", doc["_id"])

    return dependency
