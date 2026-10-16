"""F.REL .c: CORS is complete for the web client, from one source of truth.

Production (2026-10-06) refused a browser visualization edit or delete at the
preflight: ``PATCH``, ``If-Match`` and ``Idempotency-Key`` were not allowed,
and ``ETag`` was not exposed, so the client could never read the validator it
must replay as ``If-Match``.  The allowances now live in ``api/config.py``
(``CORS_ALLOW_METHODS`` / ``CORS_ALLOW_HEADERS`` / ``CORS_EXPOSE_HEADERS``);
these tests read the client's own bytes and bind them to that source in both
directions, then preflight every verb and header through the full ASGI stack.
"""

from __future__ import annotations

import asyncio
import re
from pathlib import Path

import pytest

from api.config import (
    CORS_ALLOW_HEADERS,
    CORS_ALLOW_METHODS,
    CORS_EXPOSE_HEADERS,
    settings,
)
from api.main import app

_WEB_SRC = Path(__file__).resolve().parents[2] / "web" / "src"
_CLIENT = _WEB_SRC / "lib" / "api.ts"
_ORIGIN = [o.strip() for o in settings.cors_origins.split(",") if o.strip()][0]
_FOREIGN = "https://not-an-allowed-origin.example"
_PATH = "/api/visualizations/frel-cors-probe"
_PROBE = "/api/__frel-cors-etag-probe"
_ETAG = '"frel-cors-probe"'


def _request(method: str, path: str, headers: list[tuple[str, str]]) -> tuple[int, dict[str, str]]:
    """One request through ``api.main.app``'s full middleware stack."""
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(),
        "root_path": "",
        "query_string": b"",
        "headers": [(b"host", b"testserver")]
        + [(k.lower().encode(), v.encode()) for k, v in headers],
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


def _preflight(
    method: str, request_headers: list[str], origin: str = _ORIGIN
) -> tuple[int, dict[str, str]]:
    headers = [("origin", origin), ("access-control-request-method", method)]
    if request_headers:
        headers.append(("access-control-request-headers", ",".join(request_headers)))
    return _request("OPTIONS", _PATH, headers)


def _listed(value: str) -> set[str]:
    return {v.strip().lower() for v in value.split(",") if v.strip()}


# ---- the client's bytes ----------------------------------------------------


def _client_sources() -> list[Path]:
    # Every request goes through ``coreFetch`` in ``api.ts``; its callers (the
    # equation, gallery and admin modules, the stores) choose the verb.
    return [p for ext in ("*.ts", "*.vue") for p in _WEB_SRC.rglob(ext)]


def _client_methods() -> set[str]:
    found: set[str] = set()
    for path in _client_sources():
        found |= set(re.findall(r'\bmethod:\s*"([A-Z]+)"', path.read_text()))
    return found


def _client_request_headers() -> set[str]:
    # coreFetch and the per-call helpers set request headers by key assignment:
    # ``headers["If-Match"] = …`` / ``headers["Content-Type"] ??= …``.
    return set(re.findall(r'headers\["([A-Za-z-]+)"\]\s*(?:\?\?)?=(?!=)', _CLIENT.read_text()))


def _client_read_headers() -> set[str]:
    found: set[str] = set()
    for path in _client_sources():
        found |= set(re.findall(r'\.headers\.get\(\s*"([A-Za-z-]+)"\s*\)', path.read_text()))
    return found


def test_methods_are_the_clients_verbs() -> None:
    assert _client_methods() == {"POST", "PUT", "PATCH", "DELETE"}  # GET is the default
    assert set(CORS_ALLOW_METHODS) == _client_methods() | {"GET"}


def test_allowed_headers_are_the_clients_request_headers() -> None:
    assert set(CORS_ALLOW_HEADERS) == _client_request_headers()


def test_exposed_headers_are_the_headers_the_client_reads() -> None:
    assert set(CORS_EXPOSE_HEADERS) == _client_read_headers()
    assert "ETag" in CORS_EXPOSE_HEADERS


# ---- preflight, per verb and per header --------------------------------------


@pytest.mark.parametrize("method", CORS_ALLOW_METHODS)
def test_preflight_allows_every_client_verb(method: str) -> None:
    status, headers = _preflight(method, [])
    assert status == 200
    assert headers["access-control-allow-origin"] == _ORIGIN
    assert headers["access-control-allow-credentials"] == "true"
    assert method.lower() in _listed(headers["access-control-allow-methods"])


@pytest.mark.parametrize("header", CORS_ALLOW_HEADERS)
@pytest.mark.parametrize("method", CORS_ALLOW_METHODS)
def test_preflight_allows_every_client_header_on_every_verb(method: str, header: str) -> None:
    status, headers = _preflight(method, [header])
    assert status == 200
    assert header.lower() in _listed(headers["access-control-allow-headers"])


def test_preflight_allows_the_edit_request_whole() -> None:
    """The exact preflight a browser sends for a visualization PATCH."""
    status, headers = _preflight(
        "PATCH", ["content-type", "if-match", "idempotency-key", "x-session-token"]
    )
    assert status == 200
    assert "patch" in _listed(headers["access-control-allow-methods"])


def test_preflight_refuses_an_unlisted_header() -> None:
    status, _ = _preflight("PATCH", ["x-not-a-client-header"])
    assert status == 400


def test_preflight_refuses_a_foreign_origin() -> None:
    status, headers = _preflight("PATCH", ["if-match"], origin=_FOREIGN)
    assert status == 400
    assert "access-control-allow-origin" not in headers


# ---- the client can read ETag ------------------------------------------------


@pytest.fixture
def etag_route():
    from fastapi import Response

    async def probe() -> Response:
        return Response(content=b"{}", media_type="application/json", headers={"ETag": _ETAG})

    app.add_api_route(_PROBE, probe, methods=["GET"])
    yield
    app.router.routes[:] = [r for r in app.router.routes if getattr(r, "path", None) != _PROBE]


def test_etag_is_exposed_to_the_client(etag_route) -> None:
    status, headers = _request("GET", _PROBE, [("origin", _ORIGIN)])
    assert status == 200
    assert headers["etag"] == _ETAG
    assert headers["access-control-allow-origin"] == _ORIGIN
    exposed = _listed(headers["access-control-expose-headers"])
    assert {h.lower() for h in CORS_EXPOSE_HEADERS} <= exposed
    assert "etag" in exposed
