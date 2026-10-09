"""F.REL .m: an unhandled exception answers the typed problem WITH CORS headers.

Before the cure the ``Exception`` handler ran in Starlette's outermost
``ServerErrorMiddleware``, outside ``CORSMiddleware``: the 500 carried no
``Access-Control-Allow-Origin`` and a browser reported the server fault as a
CORS failure (production's read-only model-cache 500, 2026-10-06).  The app is
driven at the ASGI boundary (no ``httpx`` in the dependency set), through its
full middleware stack.
"""

from __future__ import annotations

import asyncio
import json

import pytest

from api.config import settings
from api.main import app

_PATH = "/api/__frel-unhandled-probe"
_ORIGIN = [o.strip() for o in settings.cors_origins.split(",") if o.strip()][0]


@pytest.fixture
def failing_route():
    async def boom():
        raise RuntimeError("an unhandled defect")

    app.add_api_route(_PATH, boom, methods=["GET"])
    yield
    app.router.routes[:] = [r for r in app.router.routes if getattr(r, "path", None) != _PATH]


def _get(path: str, origin: str) -> tuple[int, dict[str, str], bytes]:
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(),
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
    headers = {k.decode().lower(): v.decode() for k, v in start["headers"]}
    body = b"".join(m.get("body", b"") for m in messages if m["type"] == "http.response.body")
    return start["status"], headers, body


def test_unhandled_exception_is_a_typed_problem_with_cors(failing_route) -> None:
    status, headers, body = _get(_PATH, _ORIGIN)
    assert status == 500
    assert headers["content-type"] == "application/problem+json"
    assert headers["access-control-allow-origin"] == _ORIGIN
    assert headers["access-control-allow-credentials"] == "true"
    problem = json.loads(body)
    assert problem == {
        "type": "urn:contract:internal-error",
        "title": "Internal server error",
        "status": 500,
        "instance": _PATH,
    }
