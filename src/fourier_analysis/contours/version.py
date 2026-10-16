"""The contour pipeline's fingerprint, for caches keyed on its output.

A stored extraction is valid only for the code that drew it. Rather than a
hand-bumped number (which F.CT's phase 2 never bumped, so the served app kept
returning iso-contour tours for images extracted before it), the version is a
digest of the pipeline's own source: every module under ``contours/`` and the
tour in ``shortest_tour.py``. Any change to either retires the old entries.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

_PACKAGE = Path(__file__).resolve().parent


def _fingerprint() -> str:
    digest = hashlib.sha256()
    sources = sorted(_PACKAGE.rglob("*.py")) + [_PACKAGE.parent / "shortest_tour.py"]
    for source in sources:
        digest.update(source.relative_to(_PACKAGE.parent).as_posix().encode())
        digest.update(source.read_bytes())
    return digest.hexdigest()[:16]


PIPELINE_VERSION = _fingerprint()
