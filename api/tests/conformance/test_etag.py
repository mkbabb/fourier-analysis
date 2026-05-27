"""Conformance — ETag / If-Match concurrency (CONFORMANCE-MATRIX CS2.1, CS2.2; RFC 9110, invariant 23).

Exercises the strong-validator ``api/lib/crud/etag.py`` primitives the
visualization surface composes: ``compute_etag`` mints a strong
``"<sha256-hex>"`` validator over the mutable projection; ``require_if_match``
enforces the ``If-Match`` precondition (match → pass, mismatch → 412, missing →
428). These are the runnable conformance assertions behind the matrix's CS2
rows; the dependency is async but needs no DB — it is driven with a tiny stub
Request.
"""

import asyncio

import pytest
from fastapi import HTTPException

from api.lib.crud import etag


class _StubRequest:
    def __init__(self, if_match: str | None):
        self.headers = {} if if_match is None else {"If-Match": if_match}


def test_concurrency():
    """CS2.1 — ETag is ``"<sha256-hex>"``; matching If-Match → pass, mismatch → 412."""
    doc = {"visibility": "public", "title": "a", "tags": ["x"]}
    validator = etag.compute_etag(doc)
    # Strong validator shape: 64 hex + 2 quotes, never weak (``W/``).
    assert validator[0] == '"' and validator[-1] == '"' and len(validator) == 66
    assert not validator.startswith("W/")
    # Matching If-Match → handler proceeds (no raise).
    assert asyncio.run(etag.require_if_match(_StubRequest(validator), validator)) is None
    # Stale If-Match → 412 etag-mismatch.
    with pytest.raises(HTTPException) as exc:
        asyncio.run(etag.require_if_match(_StubRequest('"stale"'), validator))
    assert exc.value.status_code == 412
    assert "urn:contract:etag-mismatch" in exc.value.detail


def test_delete_requires_match():
    """CS2.2 — DELETE without If-Match → 428; with a stale validator → 412."""
    validator = etag.compute_etag({"visibility": "public"})
    # Missing precondition → 428 precondition-required.
    with pytest.raises(HTTPException) as missing:
        asyncio.run(etag.require_if_match(_StubRequest(None), validator))
    assert missing.value.status_code == 428
    assert "urn:contract:precondition-required" in missing.value.detail
    # Stale precondition → 412.
    with pytest.raises(HTTPException) as stale:
        asyncio.run(etag.require_if_match(_StubRequest('"nope"'), validator))
    assert stale.value.status_code == 412
    # The wildcard admin override matches any current state.
    assert asyncio.run(etag.require_if_match(_StubRequest("*"), validator)) is None
