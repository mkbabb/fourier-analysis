"""Conformance skeleton — soft-delete (CRUD-CONTRACT §5). Implemented at B.W3.

Bound by CONFORMANCE-MATRIX.md (C5.* rows); this skeleton satisfies the W1
paper-binding (named test path exists). Tests are skipped until W3 lands the
`deleted_at` field + soft-delete state machine.
"""
import pytest

pytestmark = pytest.mark.skip(reason="conformance skeleton — implemented at B.W3")


def test_placeholder():
    """Replaced by the conformance assertions at B.W3."""
