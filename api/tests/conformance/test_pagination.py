"""Conformance skeleton — pagination / cursor (SCHEMA §1, CONFORMANCE-MATRIX §S*). Implemented at B.W3.

Bound by CONFORMANCE-MATRIX.md (cursor / pagination rows); this skeleton
satisfies the W1 paper-binding (named test path exists). Tests are skipped
until W3 lands the list endpoint.
"""
import pytest

pytestmark = pytest.mark.skip(reason="conformance skeleton — implemented at B.W3")


def test_placeholder():
    """Replaced by the conformance assertions at B.W3."""
