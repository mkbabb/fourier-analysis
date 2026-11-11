"""Bearer API tokens for the stateless ``/api/v1`` routes.

A token is ``fk_<id>_<secret>``: ``id`` is 12 public base32 characters (the
key and the name in logs), ``secret`` 32 random bytes in base64url. Only
``sha256(secret)`` is stored, in the ``api_tokens`` collection; the whole token
is shown once, at mint. The admin secret is never a token and a token is never
the admin secret: the ``fk_`` prefix keeps them apart.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import re
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from api.services.database import get_db

PREFIX = "fk_"
_SHAPE = re.compile(r"^fk_([a-z2-7]{12})_([A-Za-z0-9_-]{43})$")
DEFAULT_RATE_PER_MIN = 10
# ``last_used_at`` is written at most this often per token.
_TOUCH_EVERY = timedelta(minutes=1)


def _hash(secret: str) -> str:
    return hashlib.sha256(secret.encode()).hexdigest()


def parse(header: str | None) -> tuple[str, str] | None:
    """``(id, secret)`` from an ``Authorization: Bearer fk_…`` header, or None."""
    if not header or not header.startswith("Bearer "):
        return None
    m = _SHAPE.match(header[len("Bearer ") :].strip())
    return (m.group(1), m.group(2)) if m else None


async def mint(name: str, scopes: list[str], rate_per_min: int) -> tuple[str, dict[str, Any]]:
    """A new token: ``(token, stored doc)``. The token is not stored."""
    tid = base64.b32encode(secrets.token_bytes(10)).decode().lower()[:12]
    secret = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode().rstrip("=")
    doc = {
        "_id": tid,
        "name": name,
        "scopes": sorted(set(scopes)),
        "hash": _hash(secret),
        "rate_per_min": rate_per_min,
        "created_at": datetime.now(UTC),
        "last_used_at": None,
        "revoked_at": None,
    }
    await get_db().api_tokens.insert_one(doc)
    return f"{PREFIX}{tid}_{secret}", doc


async def verify(tid: str, secret: str) -> dict[str, Any] | None:
    """The live token doc for ``(id, secret)``, or None (unknown, wrong secret, revoked)."""
    doc = await get_db().api_tokens.find_one({"_id": tid})
    if not doc or doc.get("revoked_at") is not None:
        return None
    if not hmac.compare_digest(_hash(secret), doc["hash"]):
        return None
    return doc


async def touch(doc: dict[str, Any]) -> None:
    now = datetime.now(UTC)
    last = doc.get("last_used_at")
    if last is not None and last.tzinfo is None:
        last = last.replace(tzinfo=UTC)
    if last is None or now - last >= _TOUCH_EVERY:
        await get_db().api_tokens.update_one({"_id": doc["_id"]}, {"$set": {"last_used_at": now}})


def public(doc: dict[str, Any]) -> dict[str, Any]:
    """A token doc without its hash, for the admin list."""
    return {
        "id": doc["_id"],
        "name": doc["name"],
        "scopes": doc["scopes"],
        "rate_per_min": doc["rate_per_min"],
        "created_at": doc["created_at"],
        "last_used_at": doc.get("last_used_at"),
        "revoked_at": doc.get("revoked_at"),
    }


async def list_tokens() -> list[dict[str, Any]]:
    return [public(d) async for d in get_db().api_tokens.find({}).sort("created_at", -1)]


async def revoke(tid: str) -> bool:
    """Revoke a token; idempotent. False when no such token exists."""
    db = get_db()
    doc = await db.api_tokens.find_one({"_id": tid}, {"revoked_at": 1})
    if not doc:
        return False
    if doc.get("revoked_at") is None:
        await db.api_tokens.update_one({"_id": tid}, {"$set": {"revoked_at": datetime.now(UTC)}})
    return True
