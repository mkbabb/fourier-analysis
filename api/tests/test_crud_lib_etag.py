"""W3.12 spec — api/lib/crud/etag.py (CRUD-CONTRACT §0 SOTA-2, RFC 9110, R3 §1.1 full sha256-hex).

ETag computation + ``set_etag_header`` are pure. ``require_if_match`` is async
but needs no DB; it is driven with a tiny stub Request via ``asyncio.run``.
"""

import asyncio
import random
import string

import pytest
from fastapi import HTTPException

from api.lib.crud import etag


class _StubResponse:
    def __init__(self):
        self.headers: dict[str, str] = {}


class _StubRequest:
    def __init__(self, if_match: str | None):
        self.headers = {} if if_match is None else {"If-Match": if_match}


def _rand_doc():
    return {
        "title": "".join(random.choices(string.ascii_letters, k=8)),
        "visibility": random.choice(["draft", "unlisted", "public"]),
        "tags": random.sample(["a", "b", "c", "d"], k=2),
    }


def test_etag_stable_for_same_doc():
    for _ in range(100):
        doc = _rand_doc()
        assert etag.compute_etag(doc) == etag.compute_etag(dict(doc))


def test_etag_full_sha256_hex_shape():
    e = etag.compute_etag({"title": "a"})
    assert e[0] == '"' and e[-1] == '"' and len(e) == 66  # 64 hex + 2 quotes
    assert not e.startswith("W/")


def test_etag_differs_on_field_change():
    base = {"title": "a", "visibility": "public"}
    assert etag.compute_etag(base) != etag.compute_etag({**base, "title": "b"})


def test_etag_field_order_independent():
    assert etag.compute_etag({"title": "a", "visibility": "p"}) == etag.compute_etag(
        {"visibility": "p", "title": "a"}
    )


def test_require_if_match_missing_428():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(etag.require_if_match(_StubRequest(None), '"abc"'))
    assert exc.value.status_code == 428
    assert "urn:contract:precondition-required" in exc.value.detail


def test_require_if_match_mismatch_412():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(etag.require_if_match(_StubRequest('"other"'), '"abc"'))
    assert exc.value.status_code == 412
    assert "urn:contract:etag-mismatch" in exc.value.detail


def test_require_if_match_wildcard():
    # No raise: '*' matches any current state.
    assert asyncio.run(etag.require_if_match(_StubRequest("*"), '"abc"')) is None


def test_require_if_match_exact_passes():
    assert asyncio.run(etag.require_if_match(_StubRequest('"abc"'), '"abc"')) is None


def test_set_etag_header():
    doc = {"title": "a", "visibility": "public"}
    resp = _StubResponse()
    value = etag.set_etag_header(resp, doc)
    assert resp.headers["ETag"] == value == etag.compute_etag(doc)
