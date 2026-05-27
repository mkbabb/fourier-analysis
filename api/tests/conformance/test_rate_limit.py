"""Conformance — RateLimit headers (CONFORMANCE-MATRIX CS4.1, CS4.2; RFC 9239, invariant 24).

Exercises ``RateLimitHeaderMiddleware`` — the ~15-LOC dispatch that reads (never
records) the per-key budget from the surface's limiter and stamps RFC 9239
``RateLimit-Limit`` / ``RateLimit-Remaining`` / ``RateLimit-Reset`` on every
response; a 429 additionally carries ``Retry-After``. Driven directly with a
stub ``call_next`` and a fresh limiter — no live server, no Mongo.
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
    def __init__(self, path: str = "/api/visualizations"):
        self.url = _StubURL(path)
        self.client = _StubClient()


def _dispatch(request: _StubRequest, response: Response) -> Response:
    middleware = RateLimitHeaderMiddleware(app=lambda *a, **k: None)

    async def call_next(_req):
        return response

    return asyncio.run(middleware.dispatch(request, call_next))


def test_headers_present():
    """CS4.1 — every response carries the three RateLimit-* headers; 0 ≤ remaining ≤ limit."""
    # Fresh state: nothing recorded for this key.
    rl.write_limiter._buckets.clear()
    out = _dispatch(_StubRequest("/api/visualizations"), Response(status_code=200))
    assert "RateLimit-Limit" in out.headers
    assert "RateLimit-Remaining" in out.headers
    assert "RateLimit-Reset" in out.headers
    limit = int(out.headers["RateLimit-Limit"])
    remaining = int(out.headers["RateLimit-Remaining"])
    assert 0 <= remaining <= limit


def test_429_headers():
    """CS4.2 — a 429 response carries ``Retry-After`` (≥ 1) and ``RateLimit-Reset``."""
    # Exhaust the write budget for this key so the snapshot reports remaining 0.
    rl.write_limiter._buckets.clear()
    key = hash_ip("127.0.0.1")
    for _ in range(rl.write_limiter.max_requests):
        rl.write_limiter.check(key)
    out = _dispatch(_StubRequest("/api/visualizations"), Response(status_code=429))
    assert out.status_code == 429
    assert "RateLimit-Reset" in out.headers
    assert "Retry-After" in out.headers
    assert int(out.headers["Retry-After"]) >= 1
    # The exhausted budget surfaces as zero remaining.
    assert int(out.headers["RateLimit-Remaining"]) == 0
