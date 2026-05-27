"""Human-readable slug generation.

Thin wrapper around ``api.lib.crud.slugs`` (fourier-B.W3 / H-W3-8). The
implementation moved to the utility module, which mints via ``secrets.choice``
(cryptographic RNG) over the cohort word-lists at
``docs/precepts/data/slug-words.json`` — retiring the prior ``coolname``
delegate (CPython Mersenne, ``random.choice``) per CRUD-CONTRACT §2
"Generation" and B.md invariant 21.

The public surface is preserved for existing call sites
(``api.routers.sessions``, ``api.services.image_storage``):

- ``generate_slug()`` — mint a 4-word ``^[a-z]+(-[a-z]+){3}$`` slug.
- ``validate_slug(s)`` — pure pattern predicate.
- ``slug_with_retry(insert_fn, ...)`` — generate-then-insert-then-catch
  ``DuplicateKeyError`` loop (retires the check-then-insert TOCTOU race).
- ``SLUG_PATTERN`` — the compiled contract pattern.
"""

from __future__ import annotations

from api.lib.crud.slugs import (
    SLUG_PATTERN,
    generate_slug,
    slug_with_retry,
    validate_slug,
)

__all__ = [
    "SLUG_PATTERN",
    "generate_slug",
    "slug_with_retry",
    "validate_slug",
]
