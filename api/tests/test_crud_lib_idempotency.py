"""W3.12 spec — api/lib/crud/idempotency.py (CRUD-CONTRACT §0 SOTA-4 replay).

All rows exercise ``IdempotencyStore`` over a real ``idempotency`` collection
and require a live Mongo (skip otherwise). A tiny ``_Req`` stub stands in for
the FastAPI ``Request`` (headers + method + path + body).
"""

import json

from fastapi import Response

from api.lib.crud import idempotency
from api.lib.crud.idempotency import IdempotencyStore

from conftest import requires_mongo, run_db


class _URL:
    def __init__(self, path: str):
        self.path = path


class _Req:
    def __init__(self, body: bytes = b"", key: str | None = None, method: str = "POST"):
        self.headers = {} if key is None else {"Idempotency-Key": key}
        self.method = method
        self.url = _URL("/visualizations")
        self._body = body

    async def body(self) -> bytes:
        return self._body


def _handler_factory(calls: list[int], payload: dict):
    async def handler() -> Response:
        calls.append(1)
        return Response(json.dumps(payload).encode(), status_code=201)

    return handler


@requires_mongo
def test_no_header_passthrough():
    async def body(db):
        store = IdempotencyStore(db)
        await store.ensure_indexes()
        calls: list[int] = []
        resp = await idempotency.replay_or_record(
            _Req(b'{"x":1}'), store, "u", _handler_factory(calls, {"ok": True})
        )
        rows = await db.idempotency.count_documents({})
        return len(calls), resp.status_code, rows

    n_calls, status, rows = run_db(body)
    assert n_calls == 1 and status == 201 and rows == 0


@requires_mongo
def test_first_request_records():
    async def body(db):
        store = IdempotencyStore(db)
        await store.ensure_indexes()
        calls: list[int] = []
        await idempotency.replay_or_record(
            _Req(b'{"x":1}', key="k1"), store, "u", _handler_factory(calls, {"ok": True})
        )
        return len(calls), await db.idempotency.count_documents({})

    n_calls, rows = run_db(body)
    assert n_calls == 1 and rows == 1


@requires_mongo
def test_replay_returns_stored():
    async def body(db):
        store = IdempotencyStore(db)
        await store.ensure_indexes()
        calls: list[int] = []
        r1 = await idempotency.replay_or_record(
            _Req(b'{"x":1}', key="k2"), store, "u", _handler_factory(calls, {"n": 1})
        )
        r2 = await idempotency.replay_or_record(
            _Req(b'{"x":1}', key="k2"), store, "u", _handler_factory(calls, {"n": 2})
        )
        return len(calls), bytes(r1.body), bytes(r2.body)

    n_calls, b1, b2 = run_db(body)
    assert n_calls == 1 and b1 == b2  # handler ran once; second call replayed byte-equal


@requires_mongo
def test_replay_different_body_409():
    async def body(db):
        store = IdempotencyStore(db)
        await store.ensure_indexes()
        calls: list[int] = []
        await idempotency.replay_or_record(
            _Req(b'{"x":1}', key="k3"), store, "u", _handler_factory(calls, {"n": 1})
        )
        conflict = await idempotency.replay_or_record(
            _Req(b'{"x":2}', key="k3"), store, "u", _handler_factory(calls, {"n": 1})
        )
        return conflict.status_code, json.loads(conflict.body)["type"]

    status, type_ = run_db(body)
    assert status == 409 and type_ == "urn:contract:idempotency-replay-conflict"


@requires_mongo
def test_scope_isolation():
    async def body(db):
        store = IdempotencyStore(db)
        await store.ensure_indexes()
        calls: list[int] = []
        await idempotency.replay_or_record(
            _Req(b'{"x":1}', key="k4"), store, "alice", _handler_factory(calls, {"n": 1})
        )
        await idempotency.replay_or_record(
            _Req(b'{"x":1}', key="k4"), store, "bob", _handler_factory(calls, {"n": 1})
        )
        return len(calls)

    assert run_db(body) == 2  # different scopes → both handlers ran


@requires_mongo
def test_ttl_index_created():
    async def body(db):
        store = IdempotencyStore(db)
        await store.ensure_indexes()
        info = await db.idempotency.index_information()
        ttl = [v for v in info.values() if v.get("expireAfterSeconds") is not None]
        return ttl

    ttl = run_db(body)
    assert len(ttl) == 1
    assert ttl[0]["key"] == [("created_at", 1)] and ttl[0]["expireAfterSeconds"] == 86400


@requires_mongo
def test_store_idempotent_upsert():
    async def body(db):
        from datetime import UTC, datetime

        store = IdempotencyStore(db)
        await store.ensure_indexes()
        rec = idempotency._IdempotencyRecord(
            key="k5",
            scope="u",
            request_hash="h",
            status=201,
            response_body=b"{}",
            response_headers={},
            created_at=datetime.now(UTC),
        )
        await store.store(rec)
        await store.store(rec)  # second store is a no-op (upsert)
        return await db.idempotency.count_documents({"key": "k5", "scope": "u"})

    assert run_db(body) == 1
