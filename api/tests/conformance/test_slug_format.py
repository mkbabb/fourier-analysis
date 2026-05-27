"""Conformance — slug format / algorithm (CONFORMANCE-MATRIX C2.1, C2.3, C2.4; CRUD-CONTRACT §2).

Exercises ``api/lib/crud/slugs.py`` — the 4-word ``adjective-verb-color-animal``
generator (``secrets.choice`` mint, invariant 21), the shape predicate, and the
insert-then-catch-``DuplicateKeyError`` retry that forecloses the
check-then-insert race. Pure functions + a source-grep; no DB.
"""

import inspect
import re

from api.lib.crud import slugs

_SLUG_RE = re.compile(r"^[a-z]+(-[a-z]+){3}$")


def test_slug_shape():
    """C2.1 — 1,000 generated slugs all match ``^[a-z]+(-[a-z]+){3}$``."""
    assert all(_SLUG_RE.match(slugs.generate_slug()) for _ in range(1000))
    # The library pattern is the same shape the conformance regex binds.
    assert slugs.validate_slug("quiet-blue-morning-fox")
    assert not slugs.validate_slug("0xdeadbeef")
    assert not slugs.validate_slug("too-few-words")


def test_words_in_list():
    """C2.4 — every emitted word belongs to the contract-binding word lists."""
    members = {w for lst in slugs._WORD_LISTS.values() for w in lst}
    for _ in range(1000):
        for token in slugs.generate_slug().split("-"):
            assert token in members, token


def test_no_check_then_insert():
    """C2.3 — collision is handled by ``DuplicateKeyError`` only, never check-then-insert."""
    src = inspect.getsource(slugs.slug_with_retry)
    # The retry loop catches DuplicateKeyError; it never reads-before-insert.
    assert "DuplicateKeyError" in src
    assert "find_one" not in src
    assert re.search(r"except\s+DuplicateKeyError", src)
