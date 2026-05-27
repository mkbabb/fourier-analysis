"""C9 regression gate (C.W5, thread β) — the dedup-hit-on-migrated-doc bug.

The full C9 assertion lives in ``test_migrate_image_blobs.py`` alongside the
``blob_dir`` fixture and seed helpers it shares; this module is the named gate
path (``W5.md §gate``) and re-exposes the test so
``pytest api/tests/test_dedup_hit_on_migrated_doc.py`` resolves and runs it
standalone.

The bug it guards (``challenge-P3.md §2``): ``store_image_asset``'s sha256-dedup
branch read ``existing["blob"]`` as a subscript → ``KeyError`` on a migrated
(``blob``-less) doc → swallowed by the broad ``except Exception`` → a silent
missing-thumbnail regression on EVERY dedup upload post-migration, with zero
prior test coverage. The fix reads the primary bytes through the shim and writes
the regenerated thumbnail back as a FILE + ``thumbnail_uri`` (never an inline
``Binary``, which would re-violate invariant 18).
"""

from test_migrate_image_blobs import (  # noqa: F401  (re-export = the gate)
    blob_dir,
    test_dedup_hit_on_migrated_doc,
)
