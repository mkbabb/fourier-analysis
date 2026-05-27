"""Idempotent backfill: inline image ``blob`` + ``thumbnail`` Binary → filesystem.

fourier-C.W5 (thread β). One-way clean ATOMIC cutover (`R-storage-spec §4`):
each relocated file is a pure function of the existing Mongo ``Binary``, so NO
dual-read layer is needed (forbidden legacy code, invariant 3). Per document the
cutover is three steps — (1) read ``blob`` (+ ``thumbnail``) bytes already in
Mongo; (2) ``write_bytes`` the file(s) to ``<blob_dir>/<slug>`` (+
``<slug>.thumb``); (3) ONE atomic ``update_one($set storage_uri/thumbnail_uri,
$unset blob/thumbnail)``. Step 2 precedes step 3, so a flipped doc's file
provably exists; step 3 is a single-doc atomic op, so ``blob`` XOR
``storage_uri`` holds at every instant.

    python -m api.scripts.migrate_image_blobs            # live backfill
    python -m api.scripts.migrate_image_blobs --dry-run  # report only, no writes

``--reload`` constraint (L6 chronic #5): run STANDALONE against a non-``--reload``
backend (or the backend down). The clean cutover depends on a stable process.

Idempotency (`R-storage-spec §3.1`; C11 — `challenge-P3.md §6 C3`)
------------------------------------------------------------------
The marker is the DB **field flip** (``storage_uri`` presence), NEVER file
existence. The selector ``{blob exists, storage_uri absent}`` makes a converged
re-run a total no-op. ``Path.write_bytes`` is non-atomic (open→write→close), so a
crash mid-write leaves a truncated partial file; the self-heal rests entirely on
the re-run re-issuing a truncate-and-overwrite ``write_bytes`` against any doc
still matching the selector. A "skip if file exists" short-circuit would skip the
truncated partial PERMANENTLY → corruption, so it is deliberately ABSENT.

Rollback substrate
------------------
During the backfill the inline ``blob`` field on not-yet-converted docs is the
rollback substrate. Once the deletion-proof commit lands, rollback is via the
pre-W5 commit + the retained files (the files are the new source of truth).
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import random
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from bson import Binary

from api.config import settings
from api.services.database import close_db, connect_db, get_db

logger = logging.getLogger("migrate_image_blobs")

# The seed=42 / 10-row spot-check discipline (mirrors migrate_visualization.py).
_SPOT_CHECK_SEED = 42
_SPOT_CHECK_N = 10


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------


@dataclass
class Report:
    images_before: int = 0
    relocated: int = 0
    thumbnails_relocated: int = 0
    # Already carry ``storage_uri`` (idempotent re-run skips them).
    skipped_already_migrated: int = 0
    # Primary relocated; the doc never had a thumbnail → ``thumbnail_uri = None``.
    no_thumbnail: int = 0
    dry_run: bool = False
    spot_check: list[dict] = field(default_factory=list)

    def summary(self) -> str:
        mode = "DRY-RUN (no writes)" if self.dry_run else "LIVE"
        return (
            f"migrate_image_blobs [{mode}]\n"
            f"  images_before             = {self.images_before}\n"
            f"  relocated                 = {self.relocated}\n"
            f"  thumbnails_relocated      = {self.thumbnails_relocated}\n"
            f"  no_thumbnail              = {self.no_thumbnail}\n"
            f"  skipped_already_migrated  = {self.skipped_already_migrated}"
        )


def _blob_dir() -> Path:
    p = Path(settings.blob_dir)
    p.mkdir(parents=True, exist_ok=True)
    return p


# ---------------------------------------------------------------------------
# The main backfill pass
# ---------------------------------------------------------------------------


async def run_migration(db: Any, *, dry_run: bool = False) -> Report:
    """Single idempotent pass relocating inline blobs onto the filesystem backend.

    Returns a :class:`Report`. In live mode raises ``RuntimeError`` if a
    post-condition fails (the dry-run writes nothing, so it asserts count-parity
    on the planned counts rather than the persisted DB).
    """
    report = Report(dry_run=dry_run)
    report.images_before = await db.images.count_documents({})
    blob_dir = _blob_dir()

    # The skipped count is the convergence marker: docs that already carry a
    # ``storage_uri`` were relocated by a prior run.
    report.skipped_already_migrated = await db.images.count_documents(
        {"storage_uri": {"$exists": True}}
    )

    # Idempotency by marker: select ONLY docs that still carry an inline ``blob``
    # AND lack a ``storage_uri``. A re-run is a total no-op once converged. The
    # marker is the field flip, NEVER file existence (C11).
    cursor = db.images.find({"blob": {"$exists": True}, "storage_uri": {"$exists": False}})
    async for doc in cursor:
        slug = doc["image_slug"]
        blob = doc["blob"]
        data = bytes(blob) if isinstance(blob, Binary) else blob

        update_set: dict = {"storage_uri": f"fs:{slug}"}
        update_unset: dict = {"blob": ""}

        # The thumbnail (the SECOND blob — invariant 18). Relocate alongside, or
        # record ``thumbnail_uri = None`` when the doc never had one (the
        # ``_generate_thumbnail`` except path can leave none).
        tdata: bytes | None = None
        if doc.get("thumbnail") is not None:
            thumb = doc["thumbnail"]
            tdata = bytes(thumb) if isinstance(thumb, Binary) else thumb
            update_set["thumbnail_uri"] = f"fs:{slug}.thumb"
            update_unset["thumbnail"] = ""
        else:
            update_set["thumbnail_uri"] = None
            report.no_thumbnail += 1

        if not dry_run:
            # 1. write file(s) — a pure function of the existing Mongo bytes,
            #    retryable; truncate-and-overwrite (no skip-if-exists, C11).
            (blob_dir / slug).write_bytes(data)
            if tdata is not None:
                (blob_dir / f"{slug}.thumb").write_bytes(tdata)
            # 2 & 3. ATOMIC per-doc flip: $set uri + $unset inline in ONE op.
            await db.images.update_one(
                {"_id": doc["_id"]},
                {"$set": update_set, "$unset": update_unset},
            )

        report.relocated += 1
        if tdata is not None:
            report.thumbnails_relocated += 1
        # Capture the spot-check sample (the former blob bytes) BEFORE the field
        # delete is observable so the verification pass can read the file and
        # assert byte-identity.
        if len(report.spot_check) < _SPOT_CHECK_N:
            report.spot_check.append(
                {
                    "slug": slug,
                    "bytes": len(data),
                    "blob_bytes": data,
                    "had_thumb": tdata is not None,
                }
            )

    if not dry_run:
        await _assert_post_conditions(db)
    assert_count_parity(report)
    return report


# ---------------------------------------------------------------------------
# Post-condition assertions (the blob-XOR-uri invariant — verified, not hoped)
# ---------------------------------------------------------------------------


async def _assert_post_conditions(db: Any) -> None:
    """Invariant-18 post-conditions. ``RuntimeError`` on any."""
    # (a) Mutual exclusion: NO doc carries both ``blob`` and ``storage_uri``.
    both = await db.images.count_documents(
        {"blob": {"$exists": True}, "storage_uri": {"$exists": True}}
    )
    if both > 0:
        raise RuntimeError(f"post-condition: {both} image(s) carry BOTH blob and storage_uri")
    # (b) Completeness: every doc carries a ``storage_uri`` (none left inline).
    missing = await db.images.count_documents({"storage_uri": {"$exists": False}})
    if missing > 0:
        raise RuntimeError(f"post-condition: {missing} image(s) lack storage_uri")
    # (c) Thumbnail parity: no surviving inline ``thumbnail`` Binary.
    stale_thumb = await db.images.count_documents({"thumbnail": {"$exists": True}})
    if stale_thumb > 0:
        raise RuntimeError(f"post-condition: {stale_thumb} image(s) retain inline thumbnail")


def assert_count_parity(report: Report) -> None:
    """images_before == relocated + skipped (`R-storage-spec §3.2` / `C.md §6`)."""
    produced = report.relocated + report.skipped_already_migrated
    if produced != report.images_before:
        raise RuntimeError(
            f"count-parity: images_before ({report.images_before}) != "
            f"relocated+skipped ({produced})"
        )


# ---------------------------------------------------------------------------
# 10-row byte-identity spot-check (a separate verification pass, run live)
# ---------------------------------------------------------------------------


def verify_spot_check(report: Report) -> list[dict]:
    """Read the relocated file for each sampled doc; assert byte-identity.

    Run AFTER a live ``run_migration`` (the sample carries the former ``blob``
    bytes). Reads ``<blob_dir>/<slug>`` and asserts its bytes ``==`` the captured
    blob. Raises ``RuntimeError`` unless all sampled rows are byte-identical.
    Returns a redacted summary (no raw bytes) for the run report.
    """
    blob_dir = _blob_dir()
    random.seed(_SPOT_CHECK_SEED)
    sample = random.sample(report.spot_check, min(_SPOT_CHECK_N, len(report.spot_check)))
    out: list[dict] = []
    for row in sample:
        path = blob_dir / row["slug"]
        on_disk = path.read_bytes()
        identical = on_disk == row["blob_bytes"]
        if not identical:
            raise RuntimeError(
                f"spot-check: file {path} bytes != former blob bytes for {row['slug']!r}"
            )
        out.append({"slug": row["slug"], "bytes": row["bytes"], "byte_identical": True})
    return out


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


async def _amain(dry_run: bool) -> int:
    await connect_db()
    try:
        db = get_db()
        report = await run_migration(db, dry_run=dry_run)
        assert_count_parity(report)
        print(report.summary())
        if not dry_run and report.spot_check:
            verified = verify_spot_check(report)
            print(f"\nspot-check (seed={_SPOT_CHECK_SEED}, n={len(verified)}): all byte-identical")
            for row in verified:
                print(f"  {row}")
        return 0
    finally:
        await close_db()


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="migrate_image_blobs",
        description="Relocate inline image blobs → filesystem backend (idempotent).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="report counts without writing any file or flipping any document.",
    )
    args = parser.parse_args()
    return asyncio.run(_amain(args.dry_run))


if __name__ == "__main__":
    sys.exit(main())
