"""F.REL .s1 (COHESION §0gi.2): production boots only with its admin token.

``api.main.lifespan`` refuses to start when ``ENV=production`` and
``ADMIN_TOKEN`` is empty.  Until ``.s1`` the production compose set neither,
so the guard was dormant: the backend read ``ENV=development``, booted, and
every admin endpoint answered 503 ("Admin not configured").  The compose now
sets ``ENV=production`` and interpolates ``ADMIN_TOKEN`` from the host secret
store (``docker-compose.prod.yml``); these tests bind the guard it relies on.

- production + an empty token: the lifespan raises before it touches the DB;
- production + a token: the app boots, and ``/api/admin/verify`` rejects a
  request without the token (403, the ``admin_required`` contract) instead of
  answering 503, while the token itself is accepted.
"""

from __future__ import annotations

import asyncio
import uuid

import pytest

from api import main as api_main
from api.config import settings
from conftest import _MONGO_URI, asgi, requires_mongo

_FIXTURE_TOKEN = "boot-guard-fixture-token"
_VERIFY = "/api/admin/verify"


def test_production_without_admin_token_refuses_to_boot(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENV", "production")
    monkeypatch.setattr(settings, "admin_token", "")
    touched: list[str] = []

    async def _no_db() -> None:
        touched.append("connect_db")

    monkeypatch.setattr(api_main, "connect_db", _no_db)

    async def _boot() -> None:
        async with api_main.lifespan(api_main.app):
            pass

    with pytest.raises(RuntimeError, match="ADMIN_TOKEN must be set in production"):
        asyncio.run(_boot())
    assert touched == [], "the guard must refuse before the database is touched"


@requires_mongo
def test_production_with_admin_token_boots_and_admin_rejects_no_token(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    base, _, query = _MONGO_URI.partition("?")
    name = f"fourier_boot_guard_test_{uuid.uuid4().hex[:8]}"
    monkeypatch.setenv("ENV", "production")
    monkeypatch.setattr(settings, "admin_token", _FIXTURE_TOKEN)
    monkeypatch.setattr(settings, "mongo_uri", f"{base.rstrip('/')}/{name}" + (f"?{query}" if query else ""))

    async def _boot_and_probe() -> tuple[int, int, int]:
        from api.services.database import get_db

        async with api_main.lifespan(api_main.app):
            try:
                no_token, _ = await asgi("GET", _VERIFY)
                wrong, _ = await asgi("GET", _VERIFY, headers=[("authorization", "Bearer not-the-token")])
                right, _ = await asgi(
                    "GET", _VERIFY, headers=[("authorization", f"Bearer {_FIXTURE_TOKEN}")]
                )
            finally:
                await get_db().client.drop_database(name)
        return no_token, wrong, right

    no_token, wrong, right = asyncio.run(_boot_and_probe())
    assert no_token == 403, f"no token: {no_token} (503 = the token never reached the app)"
    assert wrong == 403, f"wrong token: {wrong}"
    assert right == 200, f"the configured token: {right}"
