"""Mongo-backed ``Idempotency-Key`` replay store, 24h TTL (CRUD-CONTRACT §0 SOTA-4).

``replay_or_record`` is an explicit callback taking the handler as an argument,
NOT a decorator that owns the request (the P1 framework-in-disguise certification).
"""

import hashlib
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime

from fastapi import Request, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from api.lib.crud.errors import idempotency_replay_conflict

_TTL_SECONDS = 86400  # 24h


class _IdempotencyRecord(BaseModel):
    key: str  # Idempotency-Key header value, ≤255 chars
    scope: str  # user_slug OR session token (anonymous)
    request_hash: str  # sha256(method + path + canonical body)
    status: int
    response_body: bytes
    response_headers: dict[str, str]
    created_at: datetime  # TTL index target; 24h expiry


def _request_hash(method: str, path: str, body: bytes) -> str:
    return hashlib.sha256(b"\0".join([method.encode(), path.encode(), body])).hexdigest()


class IdempotencyStore:
    """``idempotency`` collection wrapper (TTL index mirrors ``sessions.expires_at``)."""

    def __init__(self, db: AsyncIOMotorDatabase, collection: str = "idempotency"):
        self._coll = db[collection]

    async def ensure_indexes(self) -> None:
        await self._coll.create_index("created_at", expireAfterSeconds=_TTL_SECONDS)
        await self._coll.create_index([("key", 1), ("scope", 1)], unique=True)

    async def lookup(self, key: str, scope: str, request_hash: str) -> _IdempotencyRecord | None:
        doc = await self._coll.find_one({"key": key, "scope": scope})
        return _IdempotencyRecord.model_validate(doc) if doc is not None else None

    async def store(self, record: _IdempotencyRecord) -> None:
        # Upsert-once: a concurrent racing write is a no-op (unique key + $setOnInsert).
        await self._coll.update_one(
            {"key": record.key, "scope": record.scope},
            {"$setOnInsert": record.model_dump()},
            upsert=True,
        )


async def replay_or_record(
    request: Request,
    store: IdempotencyStore,
    scope: str,
    handler: Callable[[], Awaitable[Response]],
) -> Response:
    """``Idempotency-Key`` envelope around a write handler (RFC draft + Stripe).

    No header → ``handler()``. New key → call/store/return. Same key + matching
    hash → stored; differing hash → 409. ``scope``: user_slug / session / IP.
    """
    key = request.headers.get("Idempotency-Key")
    if not key:
        return await handler()

    body = await request.body()
    req_hash = _request_hash(request.method, request.url.path, body)

    existing = await store.lookup(key, scope, req_hash)
    if existing is not None:
        if existing.request_hash != req_hash:
            return idempotency_replay_conflict()
        return Response(existing.response_body, existing.status, existing.response_headers)

    response = await handler()
    # fmt: off
    await store.store(_IdempotencyRecord(
        key=key, scope=scope, request_hash=req_hash, status=response.status_code,
        response_body=bytes(response.body), response_headers=dict(response.headers),
        created_at=datetime.now(UTC),
    ))
    # fmt: on
    return response
