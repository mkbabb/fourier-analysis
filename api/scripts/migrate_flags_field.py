"""Idempotent rename: ``flags.snapshot_hash`` → ``flags.content_hash``.

fourier-D.W3 (thread γ). One-way ATOMIC per-document cutover that aligns the
moderation-FK band's *field name* with the value it has always held (the
visualization's ``content_hash``). The legacy name ``snapshot_hash`` was a
user-facing-identity slot in a long-retired schema; the live ``flags`` band
keys against the converged ``visualization.content_hash`` value, so the
field name is renamed to its truthful target.

    python -m api.scripts.migrate_flags_field            # live rename
    python -m api.scripts.migrate_flags_field --dry-run  # report only

Idempotency (mirrors ``migrate_image_blobs.py`` §3.1)
-----------------------------------------------------
Mongo's ``$rename`` is a no-op on a document that already lacks the source
field, so re-running this script after convergence affects zero documents.
The selector is the *presence of the source field* (``snapshot_hash``); a
converged doc carries only ``content_hash`` and is bypassed.

Index swap (atomic per-index)
-----------------------------
The two stale ``snapshot_hash`` indexes are dropped FIRST so the
``init_db`` boot-time re-assertion of the new ``content_hash`` indexes is
clean. Both drop+create operations are idempotent: drop is a no-op if the
named index is absent; create is a no-op if the same-key/same-options index
exists.

Names
~~~~~
- legacy unique compound:  ``snapshot_hash_1_reporter_slug_1`` (default name)
- legacy plain:            ``snapshot_hash_1``
- new unique compound:     ``content_hash_1_reporter_slug_1`` (default name)
- new plain:               ``content_hash_1``
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from dataclasses import dataclass
from typing import Any

from api.services.database import close_db, connect_db, get_db

logger = logging.getLogger("migrate_flags_field")


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------


@dataclass
class Report:
    flags_before: int = 0
    renamed: int = 0
    # Already carry only ``content_hash`` (idempotent re-run skips them).
    skipped_already_migrated: int = 0
    indexes_dropped: int = 0
    indexes_created: int = 0
    dry_run: bool = False

    def summary(self) -> str:
        mode = "DRY-RUN (no writes)" if self.dry_run else "LIVE"
        return (
            f"migrate_flags_field [{mode}]\n"
            f"  flags_before              = {self.flags_before}\n"
            f"  renamed                   = {self.renamed}\n"
            f"  skipped_already_migrated  = {self.skipped_already_migrated}\n"
            f"  indexes_dropped           = {self.indexes_dropped}\n"
            f"  indexes_created           = {self.indexes_created}"
        )


# ---------------------------------------------------------------------------
# Main rename pass
# ---------------------------------------------------------------------------


async def run_migration(db: Any, *, dry_run: bool = False) -> Report:
    """Single idempotent pass renaming ``snapshot_hash`` → ``content_hash``."""
    report = Report(dry_run=dry_run)
    report.flags_before = await db.flags.count_documents({})

    # The convergence marker: docs that already carry ``content_hash`` and lack
    # ``snapshot_hash`` were renamed by a prior run.
    report.skipped_already_migrated = await db.flags.count_documents(
        {"content_hash": {"$exists": True}, "snapshot_hash": {"$exists": False}}
    )

    if dry_run:
        # Count the docs we *would* rename without writing.
        report.renamed = await db.flags.count_documents(
            {"snapshot_hash": {"$exists": True}}
        )
        _assert_count_parity(report)
        return report

    # 1. Rename the field atomically per-document. Mongo's ``$rename`` is a
    #    no-op on docs already missing the source field, so the selector is
    #    belt-and-braces (the no-op would be cheap regardless).
    result = await db.flags.update_many(
        {"snapshot_hash": {"$exists": True}},
        {"$rename": {"snapshot_hash": "content_hash"}},
    )
    report.renamed = result.modified_count

    # 2. Drop the stale indexes (idempotent — a missing index does not raise
    #    if we catch ``OperationFailure`` per-index).
    report.indexes_dropped = await _drop_legacy_indexes(db)

    # 3. Re-create under the new field name. ``init_db`` also asserts these
    #    on boot; doing it here means a pre-boot operator run leaves the
    #    collection ready for the first request after deploy.
    await db.flags.create_index(
        [("content_hash", 1), ("reporter_slug", 1)], unique=True
    )
    await db.flags.create_index("content_hash")
    report.indexes_created = 2

    await _assert_post_conditions(db)
    _assert_count_parity(report)
    return report


async def _drop_legacy_indexes(db: Any) -> int:
    """Drop the two legacy ``snapshot_hash`` indexes (best-effort, idempotent)."""
    from pymongo.errors import OperationFailure

    dropped = 0
    for name in ("snapshot_hash_1_reporter_slug_1", "snapshot_hash_1"):
        try:
            await db.flags.drop_index(name)
            dropped += 1
            logger.info("Dropped legacy index %s", name)
        except OperationFailure as exc:
            # Index already absent (re-run, or fresh DB) — not an error.
            logger.info("Legacy index %s absent (skipped): %s", name, exc)
    return dropped


# ---------------------------------------------------------------------------
# Post-condition assertions (mirrors migrate_image_blobs.py §post-conditions)
# ---------------------------------------------------------------------------


async def _assert_post_conditions(db: Any) -> None:
    """Mutual-exclusion + completeness invariants on the ``flags`` band."""
    # (a) Mutual exclusion: NO doc carries both ``snapshot_hash`` AND
    #     ``content_hash``.
    both = await db.flags.count_documents(
        {"snapshot_hash": {"$exists": True}, "content_hash": {"$exists": True}}
    )
    if both > 0:
        raise RuntimeError(
            f"post-condition: {both} flag(s) carry BOTH snapshot_hash and content_hash"
        )
    # (b) Completeness: no doc still carries the legacy name.
    legacy = await db.flags.count_documents({"snapshot_hash": {"$exists": True}})
    if legacy > 0:
        raise RuntimeError(
            f"post-condition: {legacy} flag(s) still carry legacy snapshot_hash"
        )
    # (c) Every doc that was a flag (had reporter_slug) now carries the new
    #     name — the rename's completeness check against the population.
    missing = await db.flags.count_documents(
        {"reporter_slug": {"$exists": True}, "content_hash": {"$exists": False}}
    )
    if missing > 0:
        raise RuntimeError(
            f"post-condition: {missing} flag(s) lack content_hash post-rename"
        )


def _assert_count_parity(report: Report) -> None:
    """``flags_before == renamed + skipped_already_migrated`` (mirrors C.W5)."""
    produced = report.renamed + report.skipped_already_migrated
    if produced != report.flags_before:
        raise RuntimeError(
            f"count-parity: flags_before ({report.flags_before}) != "
            f"renamed+skipped ({produced})"
        )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


async def _amain(dry_run: bool) -> int:
    await connect_db()
    try:
        db = get_db()
        report = await run_migration(db, dry_run=dry_run)
        print(report.summary())
        return 0
    finally:
        await close_db()


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="migrate_flags_field",
        description="Rename flags.snapshot_hash → flags.content_hash (idempotent).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="report counts without renaming any document or touching indexes.",
    )
    args = parser.parse_args()
    return asyncio.run(_amain(args.dry_run))


if __name__ == "__main__":
    sys.exit(main())
