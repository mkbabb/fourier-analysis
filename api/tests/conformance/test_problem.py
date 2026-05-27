"""Conformance skeleton — problem+json envelope (RFC 9457, invariant 22). Implemented at B.W3.

Bound by CONFORMANCE-MATRIX.md (§S5 problem+json rows); this skeleton satisfies
the W1 paper-binding (named test path exists). Tests are skipped until W3 lands
the `Problem` class in `api/lib/crud/errors.py`.
"""
import pytest

pytestmark = pytest.mark.skip(reason="conformance skeleton — implemented at B.W3")


def test_placeholder():
    """Replaced by the conformance assertions at B.W3."""
