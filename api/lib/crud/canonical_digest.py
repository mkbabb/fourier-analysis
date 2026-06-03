"""The single canonical serialize-then-hash primitive (J.W2 / J.W1-crud-remix §12).

The deep-audit's elegance headline: three ad-hoc "canonicalise a dict the same
way, sha256 it" mechanisms coexisted in the codebase —

  1. ``etag.compute_etag`` / ``etag._canonical_json`` (mutable-field projection);
  2. ``visualizations._compute_content_hash`` (subject+config projection);
  3. the WAVE-D atom-set hash (``atomdiff.atom_hash`` / ``set_hash``).

They differ only in *which keys* go in. This module is the one primitive over
all three projections:

  * ETag           = ``canonical_digest(mutable_projection)``
  * ``content_hash`` = ``canonical_digest(subject_projection)``
  * ``atom_hash``    = ``canonical_digest({k: v})[:16]``
  * ``set_hash``     = ``canonical_digest(sorted(atom-hashes))``

The serialisation rules are byte-for-byte the prior ``etag._canonical_json``
(``sort_keys=True``, no whitespace, ISO timestamps) so every existing ETag /
content-hash stays identical — and, unlike the prior ``atomdiff`` sketch, this
one handles ``datetime`` values (the moment an atom gains one, the §1.2 sketch
would have crashed). ``content_hash`` and ``set_hash`` stay DISTINCT identities
(subject-bearing dedup/ETag vs subject-free remix-config) — computed by the
SAME primitive over DIFFERENT projections (J.W1-crud-remix §1.3).
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime
from typing import Any


def _json_default(obj: Any) -> Any:
    """ISO-8601 for datetimes; ``str()`` for anything else non-serialisable."""
    return obj.isoformat() if isinstance(obj, datetime) else str(obj)


def canonical_json(obj: Any) -> bytes:
    """Stable serialisation: ``sort_keys=True``, no whitespace, ISO timestamps."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), default=_json_default).encode()


def canonical_digest(obj: Any) -> str:
    """The one content-address: ``sha256(canonical_json(obj))`` hex digest."""
    return hashlib.sha256(canonical_json(obj)).hexdigest()
