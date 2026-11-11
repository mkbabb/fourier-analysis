"""F-L1-4 — bearer API tokens on /api/v1: mint once, scope, revoke, never echo."""

from __future__ import annotations

import json

import pytest

import api.services.database as database
from api.config import settings

from _v1 import ADMIN, admin_headers, bearer, contour_body, mint
from conftest import asgi_full, requires_mongo, run_db

PATH = "/api/v1/spectrum/contour"


@pytest.fixture(autouse=True)
def _admin(monkeypatch):
    monkeypatch.setattr(settings, "admin_token", ADMIN)


@requires_mongo
def test_token_lifecycle():
    seen: list[bytes] = []

    async def call(method, path, body=b"", headers=None, client=("127.0.0.1", 50000)):
        status, h, raw = await asgi_full(method, path, body, headers, client=client)
        seen.append(raw + json.dumps(h).encode())
        return status, h, raw

    async def body(db):
        database._db = db
        out: dict = {}
        out["none"] = (await call("POST", PATH, contour_body(), [("Content-Type", "application/json")]))[0]
        out["admin_as_bearer"] = (await call("POST", PATH, contour_body(), bearer(ADMIN)))[0]
        out["malformed"] = (await call("POST", PATH, contour_body(), bearer("fk_nope")))[0]

        status, _h, raw = await call(
            "POST", "/api/admin/tokens", json.dumps({"name": "lifecycle", "scopes": ["spectrum"]}).encode(), admin_headers()
        )
        minted = json.loads(raw)
        assert status == 201, minted
        token, tid = minted["token"], minted["id"]
        assert token.startswith(f"fk_{tid}_")

        out["unknown_secret"] = (await call("POST", PATH, contour_body(), bearer(f"fk_{tid}_wrong")))[0]
        out["token_as_admin"] = (await call("GET", "/api/admin/tokens", b"", bearer(token)))[0]
        status, _h, raw = await call("POST", PATH, contour_body(), bearer(token))
        out["minted"] = status
        out["spectrum"] = json.loads(raw)["spectrum"]

        status, _h, raw = await call("GET", "/api/admin/tokens", b"", admin_headers())
        out["listed"] = json.loads(raw)
        doc = await db.api_tokens.find_one({"_id": tid})
        out["stored"] = doc

        status, _h, _raw = await call("DELETE", f"/api/admin/tokens/{tid}", b"", admin_headers())
        out["revoke"] = status
        out["revoke_again"] = (await call("DELETE", f"/api/admin/tokens/{tid}", b"", admin_headers()))[0]
        out["revoked"] = (await call("POST", PATH, contour_body(), bearer(token)))[0]

        status, other = await mint("wrong-scope", scopes=["nothing"])
        out["wrong_scope_mint"] = status
        if status == 201:
            # From another address: this one has spent its bad-token budget above.
            out["wrong_scope"] = (
                await call("POST", PATH, contour_body(), bearer(other["token"]), client=("10.1.1.1", 1))
            )[0]
        out["token"] = token
        out["audit"] = [r["action"] async for r in db.admin_audit.find({})]
        return out

    out = run_db(body)
    assert out["none"] == 401
    assert out["admin_as_bearer"] == 401
    assert out["malformed"] == 401
    assert out["unknown_secret"] == 401
    assert out["token_as_admin"] == 403
    assert out["minted"] == 200
    assert len(out["spectrum"]["c"]) == 2 * (2 * 16 + 1)
    assert out["revoke"] == 200 and out["revoke_again"] == 200
    assert out["revoked"] == 401
    assert out["wrong_scope_mint"] == 201 and out["wrong_scope"] == 403

    stored = out["stored"]
    assert stored["last_used_at"] is not None
    assert "secret" not in stored and len(stored["hash"]) == 64
    secret = out["token"].split("_", 2)[2]
    assert secret not in json.dumps(stored, default=str)
    listed = out["listed"]["tokens"]
    assert listed and all("hash" not in t and "token" not in t for t in listed)

    # The token appears in exactly one response: its mint.
    hits = [raw for raw in seen if secret.encode() in raw]
    assert len(hits) == 1 and b'"token"' in hits[0]
    assert "mint_token:lifecycle" in out["audit"]
    assert any(a.startswith("revoke_token:") for a in out["audit"])
