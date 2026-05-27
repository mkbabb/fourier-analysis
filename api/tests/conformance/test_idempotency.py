"""Conformance — Idempotency-Key replay (CONFORMANCE-MATRIX CS3.1, CS3.2; SCHEMA §1, §9).

Exercises ``api/lib/crud/idempotency.py``'s ``replay_or_record`` envelope over a
real ``idempotency`` collection (the write surface composes it explicitly — not
a decorator, per the P1 framework-in-disguise certification). Same key + same
body → the handler runs once, the second call replays the stored response
byte-equal; same key + different body → 409
``urn:contract:idempotency-replay-conflict``. Requires live Mongo; skips
honestly otherwise.
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
def test_replay_same_body():
    """CS3.1 — same key + same body: handler runs once, second call replays verbatim."""
    async def body(db):
        store = IdempotencyStore(db)
        await store.ensure_indexes()
        calls: list[int] = []
        r1 = await idempotency.replay_or_record(
            _Req(b'{"x":1}', key="K"), store, "owner", _handler_factory(calls, {"slug": "a-b-c-d"})
        )
        r2 = await idempotency.replay_or_record(
            _Req(b'{"x":1}', key="K"), store, "owner", _handler_factory(calls, {"slug": "z-z-z-z"})
        )
        rows = await db.idempotency.count_documents({})
        return len(calls), bytes(r1.body), bytes(r2.body), rows

    n_calls, b1, b2, rows = run_db(body)
    assert n_calls == 1  # the handler ran exactly once
    assert b1 == b2  # the replay is byte-identical
    assert rows == 1  # a single recorded key


@requires_mongo
def test_replay_conflict():
    """CS3.2 — same key + different body within TTL → 409 idempotency-replay-conflict."""
    async def body(db):
        store = IdempotencyStore(db)
        await store.ensure_indexes()
        calls: list[int] = []
        await idempotency.replay_or_record(
            _Req(b'{"x":1}', key="K2"), store, "owner", _handler_factory(calls, {"n": 1})
        )
        conflict = await idempotency.replay_or_record(
            _Req(b'{"x":2}', key="K2"), store, "owner", _handler_factory(calls, {"n": 1})
        )
        return conflict.status_code, json.loads(conflict.body)["type"]

    status, type_ = run_db(body)
    assert status == 409
    assert type_ == "urn:contract:idempotency-replay-conflict"
