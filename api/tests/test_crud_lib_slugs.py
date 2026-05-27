"""W3.12 spec — api/lib/crud/slugs.py (CRUD-CONTRACT §2).

Pure-function rows (pattern, validate, word-list membership, loader) run with
no DB. The DuplicateKeyError retry rows drive ``slug_with_retry`` with an
async ``insert_fn`` via ``asyncio.run`` — no Mongo required (the unique-index
collision is simulated by raising ``DuplicateKeyError``).
"""

import asyncio

import pytest
from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError

from api.lib.crud import slugs


def test_generate_slug_matches_pattern():
    for _ in range(1000):
        s = slugs.generate_slug()
        assert slugs.SLUG_PATTERN.match(s), s


def test_validate_slug_negatives():
    for bad in [
        "",
        "big",
        "Big-Red-Angry-Python",
        "big-red-angry-python-extra",
        "big-red-angry",
        "big1-red-angry-python",
        "-big-red-angry-python",
        "big-red-angry-python-",
    ]:
        assert not slugs.validate_slug(bad), bad


def test_validate_slug_positive():
    assert slugs.validate_slug("big-red-angry-python")


def test_words_in_list():
    members = {w for lst in slugs._WORD_LISTS.values() for w in lst}
    for _ in range(200):
        for token in slugs.generate_slug().split("-"):
            assert token in members, token


def test_slug_words_load_smoke():
    lists = slugs._WORD_LISTS
    assert set(lists) == {"adjective", "verb", "color", "animal"}
    assert all(len(v) == 128 for v in lists.values())


def test_slug_with_retry_succeeds_first_try():
    calls: list[str] = []

    async def insert_fn(c: str) -> None:
        calls.append(c)

    out = asyncio.run(slugs.slug_with_retry(insert_fn))
    assert len(calls) == 1 and out == calls[-1]


def test_slug_with_retry_recovers_from_dup_key():
    calls: list[str] = []

    async def insert_fn(c: str) -> None:
        calls.append(c)
        if len(calls) <= 2:
            raise DuplicateKeyError("dup")

    out = asyncio.run(slugs.slug_with_retry(insert_fn))
    assert len(calls) == 3 and out == calls[-1]


def test_slug_with_retry_exhausts():
    async def insert_fn(c: str) -> None:
        raise DuplicateKeyError("dup")

    with pytest.raises(HTTPException) as exc:
        asyncio.run(slugs.slug_with_retry(insert_fn, max_attempts=10))
    assert exc.value.status_code == 503
    assert "urn:contract:slug-exhausted" in exc.value.detail
