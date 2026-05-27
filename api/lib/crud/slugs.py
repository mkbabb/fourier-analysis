"""Slug gen/validation/insert-then-catch retry (CRUD-CONTRACT §2); ``secrets.choice`` mint (Invariant 21), import-time loader (R3 §4.2 Path A)."""

import json
import re
import secrets
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any, Final

from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError

from api.lib.crud.errors import slug_pool_exhausted

SLUG_PATTERN: Final[re.Pattern] = re.compile(r"^[a-z]+(-[a-z]+){3}$")
SLUG_PATTERN_WORD: Final[re.Pattern] = re.compile(r"^[a-z]+$")

# In-repo home per invariant 16; the precepts relocation is a recorded B-residual.
_WORDS_PATH = Path(__file__).with_name("slug_words.json")

_WORD_KEYS: Final = ("adjective", "verb", "color", "animal")


def _load_word_lists() -> dict[str, list[str]]:
    data = json.loads(_WORDS_PATH.read_text())
    lists = {k: data[k] for k in _WORD_KEYS}
    for key, words in lists.items():
        if (
            len(words) < 64
            or len(set(words)) != len(words)
            or not all(map(SLUG_PATTERN_WORD.match, words))
        ):
            raise ValueError(f"slug word list {key!r}: bad count/duplicate/non-[a-z]+ entry")
    return lists


_WORD_LISTS: Final[dict[str, list[str]]] = _load_word_lists()


def generate_slug() -> str:
    """4-word adjective-verb-color-animal slug via cryptographic RNG (CRUD-CONTRACT §2)."""
    return "-".join(secrets.choice(_WORD_LISTS[k]) for k in _WORD_KEYS)


def validate_slug(s: str) -> bool:
    """Pure shape predicate; does *not* check word-list membership."""
    return bool(SLUG_PATTERN.match(s))


async def slug_with_retry(
    insert_fn: Callable[[str], Awaitable[Any]],
    *,
    max_attempts: int = 10,
) -> str:
    """Generate-then-insert-then-catch-``DuplicateKeyError`` loop.

    ``insert_fn`` performs the unique-index insert with the candidate slug. On
    ``DuplicateKeyError`` the loop retries; after ``max_attempts`` it raises 503
    ``urn:contract:slug-exhausted``.
    """
    for _ in range(max_attempts):
        candidate = generate_slug()
        try:
            await insert_fn(candidate)
        except DuplicateKeyError:
            continue
        return candidate
    raise HTTPException(status_code=503, detail=slug_pool_exhausted().body.decode())
