"""Conformance skeleton — URL shape / no-secrets (SCHEMA §1, CS6.* rows). Implemented at B.W3.

Bound by CONFORMANCE-MATRIX.md (CS6.* url-shape rows); this skeleton satisfies
the W1 paper-binding (named test path exists). At W3 this drives the
`scripts/conformance/grep-no-internal-id-in-url.sh` source-grep. Tests are
skipped until W3.
"""
import pytest

pytestmark = pytest.mark.skip(reason="conformance skeleton — implemented at B.W3")


def test_placeholder():
    """Replaced by the conformance assertions at B.W3."""
