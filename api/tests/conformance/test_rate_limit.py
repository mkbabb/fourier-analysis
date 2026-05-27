"""Conformance skeleton — RateLimit headers (RFC 9239, invariant 24). Implemented at B.W3.

Bound by CONFORMANCE-MATRIX.md (rate-limit rows); this skeleton satisfies the
W1 paper-binding (named test path exists). Tests are skipped until W3 lands the
RateLimit-header transparency on the entity surface.
"""
import pytest

pytestmark = pytest.mark.skip(reason="conformance skeleton — implemented at B.W3")


def test_placeholder():
    """Replaced by the conformance assertions at B.W3."""
