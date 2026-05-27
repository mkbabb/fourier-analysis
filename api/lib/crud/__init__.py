"""api.lib.crud — utilities for the slug-addressed CRUD contract.

Each sub-module is a pure utility for one section of
``docs/tranches/B/coordination/CRUD-CONTRACT.md``: ``slugs`` → §2;
``cursors`` → §0 SOTA-1 + SCHEMA §1; ``errors`` → §0 SOTA-3 + SCHEMA §5
(RFC 9457); ``etag`` → §0 SOTA-2 + SCHEMA §1; ``idempotency`` → §0 SOTA-4;
``softdelete`` → §5; ``pinned_cron`` → §8.

NOT included: a ``BaseCRUDRouter`` / ``CRUDMixin`` / ``@crud_endpoint``
decorator. The Wχ.P1 ``framework-in-disguise`` probe rejects any helper that
owns the request lifecycle. Each router composes the helpers explicitly.
"""

from __future__ import annotations

from . import cursors, errors, etag, idempotency, pinned_cron, slugs, softdelete
from .cursors import CursorPayload, decode_cursor, encode_cursor, next_cursor_from_last, paginate
from .errors import ProblemDetails, problem
from .etag import compute_etag, require_if_match, set_etag_header
from .idempotency import IdempotencyStore, replay_or_record
from .pinned_cron import cron_prune, mark_pinned
from .slugs import SLUG_PATTERN, generate_slug, slug_with_retry, validate_slug
from .softdelete import SoftDeleteMixin, not_deleted_filter, restore, soft_delete, with_not_deleted

# fmt: off
__all__ = [
    "slugs", "cursors", "errors", "etag", "idempotency", "softdelete", "pinned_cron",
    "generate_slug", "validate_slug", "slug_with_retry", "SLUG_PATTERN",
    "encode_cursor", "decode_cursor", "paginate", "next_cursor_from_last", "CursorPayload",
    "ProblemDetails", "problem",
    "compute_etag", "require_if_match", "set_etag_header",
    "IdempotencyStore", "replay_or_record",
    "SoftDeleteMixin", "not_deleted_filter", "with_not_deleted", "soft_delete", "restore",
    "mark_pinned", "cron_prune",
]
# fmt: on
