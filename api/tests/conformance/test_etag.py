"""Conformance skeleton — ETag / If-Match (RFC 9110, invariant 23). Implemented at B.W3.

Bound by CONFORMANCE-MATRIX.md (ETag rows); this skeleton satisfies the W1
paper-binding (named test path exists). Tests are skipped until W3 lands the
`api/lib/crud/etag.py` utility + entity.
"""
import pytest

pytestmark = pytest.mark.skip(reason="conformance skeleton — implemented at B.W3")


def test_placeholder():
    """Replaced by the conformance assertions at B.W3."""
