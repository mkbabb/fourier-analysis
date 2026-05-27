"""Conformance skeleton — Idempotency-Key (invariant per CRUD-CONTRACT §9 / SCHEMA). Implemented at B.W3.

Bound by CONFORMANCE-MATRIX.md (idempotency rows); this skeleton satisfies the
W1 paper-binding (named test path exists). Tests are skipped until W3 lands the
`api/lib/crud/idempotency.py` utility + entity.
"""
import pytest

pytestmark = pytest.mark.skip(reason="conformance skeleton — implemented at B.W3")


def test_placeholder():
    """Replaced by the conformance assertions at B.W3."""
