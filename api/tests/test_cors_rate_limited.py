"""F.REL .pd (PD-2, COHESION §0fq.2): a rate-limited cross-origin request is a
readable 429.

Before the cure ``RateLimitHeaderMiddleware`` was registered after
``CORSMiddleware`` and so ran outside it: a burst past the budget answered the
429 from outside the CORS layer, without ``Access-Control-Allow-Origin``, and a
browser reported the rate limit as a CORS failure.  CORS is now the outermost
middleware, so every response, the 429 included, carries the CORS headers.  The
app is driven at the ASGI boundary, through its full middleware stack.
"""

from __future__ import annotations

import asyncio

import api.services.rate_limiter as rl
from api.config import settings
from api.main import app

_ORIGIN = [o.strip() for o in settings.cors_origins.split(",") if o.strip()][0]
# A write (POST) rides ``write_limiter``; the limiter counts before routing, so
# the probe path needs no route behind it.
_PATH = "/api/visualizations/frel-pd2-rate-limit-probe"


def _post(origin: str) -> tuple[int, dict[str, str]]:
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "POST",
        "scheme": "http",
        "path": _PATH,
        "raw_path": _PATH.encode(),
        "root_path": "",
        "query_string": b"",
        "headers": [(b"host", b"testserver"), (b"origin", origin.encode())],
        "client": ("127.0.0.1", 50000),
        "server": ("testserver", 80),
    }
    messages: list[dict] = []

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message):
        messages.append(message)

    asyncio.run(app(scope, receive, send))
    start = next(m for m in messages if m["type"] == "http.response.start")
    return start["status"], {k.decode().lower(): v.decode() for k, v in start["headers"]}


def test_cross_origin_429_carries_cors_and_ratelimit_headers() -> None:
    budget = rl.write_limiter.max_requests
    for _ in range(budget):
        status, _headers = _post(_ORIGIN)
        assert status != 429
    status, headers = _post(_ORIGIN)

    assert status == 429
    assert headers["access-control-allow-origin"] == _ORIGIN
    assert headers["ratelimit-limit"] == str(budget)
    assert headers["ratelimit-remaining"] == "0"
    assert int(headers["ratelimit-reset"]) >= 0
    exposed = {h.strip().lower() for h in headers["access-control-expose-headers"].split(",")}
    assert "ratelimit-reset" in exposed
