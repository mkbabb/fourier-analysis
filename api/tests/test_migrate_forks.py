"""J.W2 — the additive fork-fields + root-version backfill migration proof.

Seeds legacy ``visualizations`` rows (no ``set_hash``, no fork fields, no
version) and asserts the migration backfills them idempotently — a second run
writes nothing, a dry-run mutates nothing (the J.md §9 no-brittleness claim).
"""

from __future__ import annotations

from datetime import UTC, datetime

from bson import ObjectId

from api.lib.crud import atomdiff
from api.scripts.migrate_visualization_forks import run_fork_backfill

from conftest import requires_mongo, run_db


def _legacy_row(slug: str, **over) -> dict:
    """A pre-J row: full config atoms, but NO set_hash / fork fields / version."""
    doc = {
        "_id": ObjectId(),
        "slug": slug,
        "owner_slug": "happy-paint-blue-cat",
        "visibility": "public",
        "content_hash": "h" * 64,
        "image_slug": "img-shared",
        "contour_hash": "c" * 64,
        "active_bases": ["fourier-epicycles"],
        "n_harmonics": 64,
        "contour_settings": {"blur_sigma": 0.5, "n_harmonics": 200},
        "animation_settings": {"fps": 30},
        "palette_slug": None,
        "created_at": datetime(2026, 1, 1, tzinfo=UTC),
        "updated_at": datetime(2026, 1, 1, tzinfo=UTC),
        "deleted_at": None,
    }
    doc.update(over)
    return doc


@requires_mongo
def test_backfill_writes_set_hash_and_root_versions():
    async def body(db):
        await db.visualizations.insert_many(
            [_legacy_row("alpha-walk-blue-cat"), _legacy_row("merry-run-gold-fox", n_harmonics=128)]
        )
        report = await run_fork_backfill(db, dry_run=False)
        rows = {r["slug"]: r async for r in db.visualizations.find({})}
        versions = [v async for v in db.visualization_versions.find({})]
        return report, rows, versions

    report, rows, versions = run_db(body)
    assert report.rows_scanned == 2
    assert report.fields_backfilled == 2
    assert report.root_versions_written == 2

    for slug, row in rows.items():
        assert row["set_hash"]  # the atom-set identity is now stamped
        assert row["fork_of"] is None
        assert row["fork_count"] == 0
        assert row["version_count"] == 1
        # the set_hash is the real atom-set hash (not a placeholder)
        assert row["set_hash"] == atomdiff.set_hash(atomdiff.enumerate_atoms(row))

    # one root version per row, content-addressed _id, depth 0, empty diff.
    assert len(versions) == 2
    for v in versions:
        assert v["_id"] == f"{v['viz_slug']}:{v['set_hash']}"
        assert v["depth"] == 0
        assert v["parent_hash"] is None
        assert v["atom_diff"] == []


@requires_mongo
def test_backfill_is_idempotent_second_run_zero_writes():
    async def body(db):
        await db.visualizations.insert_one(_legacy_row("alpha-walk-blue-cat"))
        first = await run_fork_backfill(db, dry_run=False)
        second = await run_fork_backfill(db, dry_run=False)
        total_versions = await db.visualization_versions.count_documents({})
        return first, second, total_versions

    first, second, total_versions = run_db(body)
    assert first.root_versions_written == 1
    assert second.fields_backfilled == 0
    assert second.root_versions_written == 0
    assert second.versions_skipped_existing == 1
    assert total_versions == 1  # no duplicate version


@requires_mongo
def test_backfill_dry_run_mutates_nothing():
    async def body(db):
        await db.visualizations.insert_one(_legacy_row("alpha-walk-blue-cat"))
        report = await run_fork_backfill(db, dry_run=True)
        row = await db.visualizations.find_one({"slug": "alpha-walk-blue-cat"})
        versions = await db.visualization_versions.count_documents({})
        return report, row, versions

    report, row, versions = run_db(body)
    assert report.fields_backfilled == 1  # what WOULD be written
    assert report.root_versions_written == 1
    assert row.get("set_hash") in (None, "")  # nothing persisted
    assert versions == 0
