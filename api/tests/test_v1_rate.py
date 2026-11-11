"""F-L1-6 — /api/v1 is limited per token, at the token's own rate; bad tokens per IP."""

from __future__ import annotations

import pytest

import api.services.database as database
from api.config import settings

from _v1 import ADMIN, bearer, contour_body, mint
from conftest import asgi_full, requires_mongo, run_db

PATH = "/api/v1/spectrum/contour"


@pytest.fixture(autouse=True)
def _admin(monkeypatch):
    monkeypatch.setattr(settings, "admin_token", ADMIN)


@requires_mongo
def test_eleventh_call_in_a_minute_is_429_and_other_tokens_are_unaffected():
    async def body(db):
        database._db = db
        _s, a = await mint("a")
        _s, b = await mint("b")
        statuses, last_headers = [], {}
        for _ in range(11):
            status, h, _raw = await asgi_full("POST", PATH, contour_body(), bearer(a["token"]))
            statuses.append(status)
            last_headers = h
        other = await asgi_full("POST", PATH, contour_body(), bearer(b["token"]))
        return statuses, last_headers, other[0], other[1]

    statuses, h429, other_status, other_h = run_db(body)
    assert statuses[:10] == [200] * 10
    assert statuses[10] == 429
    assert h429["content-type"].startswith("application/problem+json")
    assert int(h429["retry-after"]) > 0
    assert h429["ratelimit-limit"] == "10" and h429["ratelimit-remaining"] == "0"
    assert other_status == 200
    assert other_h["ratelimit-limit"] == "10" and other_h["ratelimit-remaining"] == "9"


@requires_mongo
def test_a_token_rate_is_its_own():
    async def body(db):
        database._db = db
        _s, slow = await mint("slow", rate=2)
        return [(await asgi_full("POST", PATH, contour_body(), bearer(slow["token"])))[0] for _ in range(3)]

    assert run_db(body) == [200, 200, 429]


@requires_mongo
def test_bad_tokens_are_counted_by_ip():
    async def body(db):
        database._db = db
        _s, good = await mint("good")
        bad = [
            (await asgi_full("POST", PATH, contour_body(), bearer("fk_aaaaaaaaaaaa_bad"), client=("10.0.0.9", 1)))[0]
            for _ in range(settings.compute_rate_limit + 1)
        ]
        # The flooding IP is now refused even with a good token; another IP is not.
        same_ip = (await asgi_full("POST", PATH, contour_body(), bearer(good["token"]), client=("10.0.0.9", 1)))[0]
        other_ip = (await asgi_full("POST", PATH, contour_body(), bearer(good["token"]), client=("10.0.0.8", 1)))[0]
        return bad, same_ip, other_ip

    bad, same_ip, other_ip = run_db(body)
    assert bad[:-1] == [401] * settings.compute_rate_limit
    assert bad[-1] == 429
    assert same_ip == 429
    assert other_ip == 200
