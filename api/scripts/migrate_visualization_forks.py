"""J.W2 — additive backfill: ``set_hash`` + fork fields + a root version per row.

The one IMPL-side schema touch the WAVE-D CORE needs for EXISTING rows (native
rows born after J.W2 already carry the fields). It is purely **additive** and
**idempotent** (J.W1-crud-remix §7; J.md §9 — no brittleness window):

  * each live ``visualizations`` row gains ``set_hash`` (the atom-set identity,
    §1.3) + the fork fields (``fork_of=None``, ``fork_of_hash=None``,
    ``fork_count=0``, ``version_count=1``) where absent — one ``$set`` per row,
    no destructive op;
  * each live row gains one root ``VisualizationVersion`` (``parent_hash=None``,
    ``root_hash=set_hash``, ``depth=0``, ``atom_diff=[]``) — the version ``_id``
    is the content-addressed ``f"{slug}:{set_hash}"`` so a re-insert is a no-op.

No Mongo transaction (standalone-topology-honest, §11); a re-run is a total
no-op (rows already carrying ``set_hash`` + their root version are skipped).

Run modes::

    python -m api.scripts.migrate_visualization_forks            # live backfill
    python -m api.scripts.migrate_visualization_forks --dry-run   # report only

Registered in ``run_pending_migrations.MIGRATIONS`` (F-16); the deploy-hook runs
it post-up/post-health-gate, serialized by the deploy flock.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from pymongo.errors import DuplicateKeyError

from api.lib.crud import atomdiff
from api.models.visualization import VisualizationVersion
from api.services.database import close_db, connect_db, get_db

# Bump when re-running an already-applied backfill is intended (F-16 / the
# ``run_pending_migrations`` unique ``(name, version)`` contract).
MIGRATION_VERSION = 1


@dataclass
class ForkBackfillReport:
    """Counters for the additive backfill (the close evidence)."""

    dry_run: bool = False
    rows_scanned: int = 0
    fields_backfilled: int = 0  # rows that gained set_hash / fork fields
    root_versions_written: int = 0
    versions_skipped_existing: int = 0

    def summary(self) -> str:
        mode = "DRY-RUN" if self.dry_run else "APPLIED"
        return (
            f"[migrate_visualization_forks {mode}] scanned={self.rows_scanned} "
            f"fields_backfilled={self.fields_backfilled} "
            f"root_versions_written={self.root_versions_written} "
            f"versions_skipped_existing={self.versions_skipped_existing}"
        )


_FORK_FIELD_DEFAULTS: dict[str, Any] = {
    "fork_of": None,
    "fork_of_hash": None,
    "fork_count": 0,
    "version_count": 1,
}


async def run_fork_backfill(db: Any, *, dry_run: bool = False) -> ForkBackfillReport:
    """One idempotent additive pass over ``visualizations``.

    Returns a :class:`ForkBackfillReport`. Live mode writes one ``$set`` per row
    that lacks ``set_hash`` (or any fork field) + one root version per row that
    lacks it; a re-run writes nothing (every row already carries both).
    """
    report = ForkBackfillReport(dry_run=dry_run)

    async for row in db.visualizations.find({}):
        report.rows_scanned += 1

        atoms = atomdiff.enumerate_atoms(row)
        set_hash_value = row.get("set_hash") or atomdiff.set_hash(atoms)

        # (1) additive $set — set_hash + any absent fork field (idempotent).
        updates: dict[str, Any] = {}
        if not row.get("set_hash"):
            updates["set_hash"] = set_hash_value
        for field, default in _FORK_FIELD_DEFAULTS.items():
            if field not in row:
                updates[field] = default
        if updates:
            report.fields_backfilled += 1
            if not dry_run:
                await db.visualizations.update_one({"_id": row["_id"]}, {"$set": updates})

        # (2) one root version per row (content-addressed _id → idempotent).
        version_id = f"{row['slug']}:{set_hash_value}"
        existing = await db.visualization_versions.find_one({"_id": version_id}, {"_id": 1})
        if existing is not None:
            report.versions_skipped_existing += 1
            continue
        report.root_versions_written += 1
        if dry_run:
            continue
        version = VisualizationVersion(
            _id=version_id,
            viz_slug=row["slug"],
            set_hash=set_hash_value,
            author_slug=row.get("owner_slug", ""),
            active_bases=atoms["active_bases"],
            n_harmonics=atoms["n_harmonics"],
            contour_settings=atoms["contour_settings"] or {},
            animation_settings=atoms["animation_settings"] or {},
            palette_slug=atoms.get("palette_slug"),
            parent_hash=None,
            forked_from_hash=row.get("fork_of_hash"),
            root_hash=set_hash_value,
            depth=0,
            atom_diff=[],
            created_at=row.get("created_at") or datetime.now(UTC),
        )
        try:
            await db.visualization_versions.insert_one(version.model_dump(by_alias=True))
        except DuplicateKeyError:
            pass  # raced/re-run — content-addressed, an idempotent no-op

    return report


async def _amain(dry_run: bool) -> int:
    await connect_db()
    try:
        report = await run_fork_backfill(get_db(), dry_run=dry_run)
        print(report.summary())
        return 0
    finally:
        await close_db()


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="migrate_visualization_forks",
        description="Additive backfill: set_hash + fork fields + root versions (idempotent).",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="report counts without writing any document."
    )
    args = parser.parse_args()
    return asyncio.run(_amain(args.dry_run))


if __name__ == "__main__":
    sys.exit(main())
