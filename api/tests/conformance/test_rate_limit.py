"""Conformance — RateLimit headers (CONFORMANCE-MATRIX CS4.1, CS4.2; RFC 9239, invariant 24).

Exercises ``RateLimitHeaderMiddleware`` — the single enforce+report path (F.W1
α.4). The dispatch calls ``limiter.check()`` (the one place that records the hit
*and* enforces the budget), then stamps RFC 9239 ``RateLimit-Limit`` /
``RateLimit-Remaining`` / ``RateLimit-Reset`` from the post-check snapshot. A
breach short-circuits into the ``application/problem+json`` 429 envelope carrying
``Retry-After``. Driven directly with a stub ``call_next`` and a fresh limiter —
no live server, no Mongo.
"""

import asyncio

from starlette.responses import Response

import api.services.rate_limiter as rl
from api.services.rate_limiter import RateLimitHeaderMiddleware, hash_ip


class _StubURL:
    def __init__(self, path: str):
        self.path = path


class _StubClient:
    host = "127.0.0.1"


class _StubRequest:
    def __init__(self, path: str = "/api/visualizations", method: str = "POST"):
        self.url = _StubURL(path)
        self.client = _StubClient()
        self.method = method


def _dispatch(request: _StubRequest, response: Response) -> Response:
    middleware = RateLimitHeaderMiddleware(app=lambda *a, **k: None)

    async def call_next(_req):
        return response

    return asyncio.run(middleware.dispatch(request, call_next))


def test_headers_present():
    """CS4.1 — every response carries the three RateLimit-* headers; 0 ≤ remaining ≤ limit."""
    # Fresh state: nothing recorded for this key. A POST to /api/visualizations
    # routes to the write limiter (the single enforcement point now records it).
    rl.write_limiter._buckets.clear()
    out = _dispatch(_StubRequest("/api/visualizations", "POST"), Response(status_code=200))
    assert "RateLimit-Limit" in out.headers
    assert "RateLimit-Remaining" in out.headers
    assert "RateLimit-Reset" in out.headers
    limit = int(out.headers["RateLimit-Limit"])
    remaining = int(out.headers["RateLimit-Remaining"])
    assert 0 <= remaining <= limit


def test_remaining_decrements_across_burst():
    """CS4.1 — the middleware records each hit, so Remaining strictly decreases."""
    rl.write_limiter._buckets.clear()
    seen = []
    for _ in range(3):
        out = _dispatch(_StubRequest("/api/visualizations", "POST"), Response(status_code=200))
        seen.append(int(out.headers["RateLimit-Remaining"]))
    # Each recorded hit drops the remaining budget by one.
    assert seen == sorted(seen, reverse=True)
    assert seen[0] > seen[-1]


def test_429_headers():
    """CS4.2 — a burst past the budget yields a 429 problem+json with Retry-After and Remaining 0."""
    rl.write_limiter._buckets.clear()
    budget = rl.write_limiter.max_requests
    last = None
    # One request beyond the budget must be denied by the single enforcement point.
    for _ in range(budget + 1):
        last = _dispatch(_StubRequest("/api/visualizations", "POST"), Response(status_code=200))
    assert last.status_code == 429
    assert last.media_type == "application/problem+json"
    assert "RateLimit-Reset" in last.headers
    assert "Retry-After" in last.headers
    assert int(last.headers["Retry-After"]) >= 1
    # The exhausted budget surfaces as zero remaining.
    assert int(last.headers["RateLimit-Remaining"]) == 0


def test_reads_ride_generous_budget():
    """CS4.1 — GET reads route to the generous read budget, not the tight write budget."""
    rl.read_limiter._buckets.clear()
    out = _dispatch(_StubRequest("/api/visualizations", "GET"), Response(status_code=200))
    assert int(out.headers["RateLimit-Limit"]) == rl.read_limiter.max_requests
