"""COHESION §0hc.2: the edge's own 429 speaks the backend's CORS.

``nginx/fourier.conf`` answers a request its ``limit_req`` refuses itself
(``@api_rate_limited``), so the backend's ``CORSMiddleware`` never sees it. The
edge therefore states the CORS fields for that one response, and these tests
bind each to its source of truth so the two cannot drift apart:

- the edge allowlist is exactly the production ``CORS_ORIGINS`` default in
  ``docker-compose.prod.yml`` (never ``*``);
- the exposed headers are exactly ``api/config.py``'s ``CORS_EXPOSE_HEADERS``;
- credentials are allowed, as ``api/main.py`` allows them.

The live behaviour (preflights uncounted, the refused POST a 429 with
``Access-Control-Allow-Origin`` for the allowed origin and none for a foreign
one) is proven through the real edge by ``scripts/prod-compose-smoke.sh``.
"""

from __future__ import annotations

import re
from pathlib import Path

from api.config import CORS_EXPOSE_HEADERS
from api.main import app

_ROOT = Path(__file__).resolve().parents[2]
_CONF = (_ROOT / "nginx" / "fourier.conf").read_text()
_PROD_COMPOSE = (_ROOT / "docker-compose.prod.yml").read_text()


def _map_body(variable: str) -> str:
    match = re.search(r"map\s+\S+\s+\$" + re.escape(variable) + r"\s*\{(.*?)\}", _CONF, re.S)
    assert match, f"nginx/fourier.conf declares no map for ${variable}"
    return match.group(1)


def _map_entries(variable: str) -> dict[str, str]:
    entries: dict[str, str] = {}
    for line in _map_body(variable).splitlines():
        line = line.split("#", 1)[0].strip().rstrip(";").strip()
        if not line:
            continue
        key, value = line.split(None, 1)
        entries[key.strip('"')] = value.strip().strip('"')
    return entries


def test_edge_allowlist_is_the_production_cors_origins() -> None:
    match = re.search(r"CORS_ORIGINS=\$\{CORS_ORIGINS:-([^}]*)\}", _PROD_COMPOSE)
    assert match, "docker-compose.prod.yml states no CORS_ORIGINS default"
    prod_origins = {o.strip() for o in match.group(1).split(",") if o.strip()}

    entries = _map_entries("edge_allowed_origin")
    assert entries.pop("default") == "", "a non-allowlisted origin must get no ACAO"
    assert set(entries) == prod_origins
    assert all(value == "$http_origin" for value in entries.values())
    assert "*" not in _CONF.split("map $http_origin $edge_allowed_origin", 1)[1].split("}", 1)[0]


def test_edge_expose_headers_are_the_backend_expose_headers() -> None:
    entries = _map_entries("edge_cors_expose")
    assert entries[""] == ""
    exposed = [h.strip() for h in entries["default"].split(",")]
    assert exposed == list(CORS_EXPOSE_HEADERS)


def test_edge_allows_credentials_as_the_backend_does() -> None:
    cors = next(m for m in app.user_middleware if m.cls.__name__ == "CORSMiddleware")
    assert cors.kwargs["allow_credentials"] is True
    entries = _map_entries("edge_cors_credentials")
    assert entries == {"": "", "default": "true"}


def test_preflights_are_not_counted_and_refusals_are_429() -> None:
    entries = _map_entries("api_compute_key")
    assert entries == {"OPTIONS": "", "default": "$binary_remote_addr"}
    assert re.search(
        r"limit_req_zone\s+\$api_compute_key\s+zone=api_compute:10m\s+rate=2r/s;", _CONF
    )
    assert re.search(r"^limit_req_status\s+429;", _CONF, re.M)
