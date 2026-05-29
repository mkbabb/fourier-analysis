"""Conformance — sessions register / me / logout / suspend (CONFORMANCE-MATRIX C6.1–C6.4; CRUD-CONTRACT §6).

Drives the session router coroutines against a throwaway Mongo:
``register`` mints ``{token, user_slug}`` and ``me`` round-trips the same
user_slug (C6.1); ``logout`` revokes the session so a re-resolve fails (C6.2);
``login`` is timing-flat — existing and missing slugs both pay the constant
≥200ms delay so their means differ by < 50ms (C6.3); a suspended user's session
resolve → 403 ``Account suspended`` (C6.4). Requires live Mongo.
"""

from __future__ import annotations

import time

import pytest

import api.routers.sessions as sessions
import api.services.database as database
import api.services.rate_limiter as rl
from api.dependencies import (
    _suspended_cache,
    mark_suspended_in_cache,
    resolve_session,
)
from fastapi import HTTPException

from conftest import requires_mongo, run_db

from ._harness import make_request


def _bind(db) -> None:
    database._db = db
    _suspended_cache.clear()


@requires_mongo
def test_register_and_me():
    """C6.1 — register → ``{token, user_slug}``; ``me`` returns the same user_slug."""
    async def body(db):
        _bind(db)
        reg = await sessions.register(make_request("POST", path="/api/sessions"))
        info = await sessions.me(user_slug=reg["user_slug"])
        return reg, info

    reg, info = run_db(body)
    assert reg["token"] and reg["user_slug"]
    assert info["user_slug"] == reg["user_slug"]


@requires_mongo
def test_logout():
    """C6.2 — logout revokes the session; the revoked token then resolves → 401."""
    async def body(db):
        _bind(db)
        reg = await sessions.register(make_request("POST", path="/api/sessions"))
        token = reg["token"]
        before = await resolve_session(
            make_request("GET", headers={"X-Session-Token": token}))
        out = await sessions.logout(make_request("DELETE", headers={"X-Session-Token": token}))
        # A present-but-revoked token is a 401 (``urn:contract:session-invalid``),
        # never a silent None — None is reserved for an absent header.
        try:
            await resolve_session(make_request("GET", headers={"X-Session-Token": token}))
            after_status = None
        except HTTPException as exc:
            after_status = exc.status_code
        return before, out, after_status

    before, out, after_status = run_db(body)
    assert before is not None  # the session resolved before logout
    assert out == {"ok": True}
    assert after_status == 401  # the revoked token no longer resolves


@requires_mongo
def test_login_timing():
    """C6.3 — login is timing-flat: existing vs missing slug differ < 50ms; both ≥ 200ms."""
    async def body(db):
        _bind(db)
        reg = await sessions.register(make_request("POST", path="/api/sessions"))
        existing = reg["user_slug"]

        async def _time_login(slug: str) -> float:
            import json as _json

            # F.W1: login rate limiting now lives solely in
            # RateLimitHeaderMiddleware (the single enforce+report path), which
            # this direct-coroutine call bypasses — so the login coroutine no
            # longer touches the budget. The clear stays as a defensive reset of
            # shared module state across timed trials.
            rl.login_limiter._buckets.clear()
            req = make_request(
                "POST", path="/api/sessions/login",
                body=_json.dumps({"slug": slug}).encode(),
            )
            t0 = time.perf_counter()
            try:
                await sessions.login(req)
            except HTTPException:
                pass  # missing slug raises 404 after the constant delay
            return time.perf_counter() - t0

        # A few trials each, averaged (the constant delay dominates).
        n = 3
        hits = [await _time_login(existing) for _ in range(n)]
        misses = [await _time_login("no-such-slug-here") for _ in range(n)]
        return sum(hits) / n, sum(misses) / n

    hit, miss = run_db(body)
    assert hit >= 0.20 and miss >= 0.20  # the constant 200ms floor on both paths
    assert abs(hit - miss) < 0.05  # timing-flat to within 50ms


@requires_mongo
def test_suspended_403():
    """C6.4 — a suspended user's session resolve → 403 ``Account suspended``."""
    async def body(db):
        _bind(db)
        reg = await sessions.register(make_request("POST", path="/api/sessions"))
        slug, token = reg["user_slug"], reg["token"]
        await db.users.update_one({"_id": slug}, {"$set": {"status": "suspended"}})
        mark_suspended_in_cache(slug)
        try:
            await resolve_session(make_request("GET", headers={"X-Session-Token": token}))
            return None
        except HTTPException as exc:
            return exc.status_code

    status = run_db(body)
    assert status == 403
