"""W3.23 / H-W3-3 — THE load-bearing seeded migration proof.

The live dev DB source collections are EMPTY (``snapshots=0, gallery=0``), so
the ``--dry-run`` gate proves NOTHING about correctness (challenge.md §2). This
spec seeds a fixture covering every adversarial shape and asserts count-parity +
transform correctness on the seed, end-to-end against a live Mongo:

  * gallery + parent-snapshot pairs (the happy path)
  * an orphan snapshot (no gallery row → draft + anon-migrated + pinned False)
  * a zombie orphan (gallery deleted out from under a once-public snapshot →
    was_public True)
  * a ``user_slug:None`` gallery row (resolved to anon-migrated, stays public)
  * mixed naive/aware ``created_at`` timestamps (the D-1 coercion landmine)

Asserts: count-parity; second-run zero writes (idempotency via ``migrated_from``);
dangling-contour-hash aborts; ``--dry-run`` mutates nothing.
"""

from datetime import UTC, datetime

from bson import ObjectId

from api.scripts.migrate_visualization import (
    assert_count_parity,
    run_migration,
)

from conftest import requires_mongo, run_db

# A real contour hash present in the seed `contours` collection so the
# dangling-hash post-condition resolves for the well-formed rows.
_CONTOUR_OK = "a" * 64
_CONTOUR_DANGLING = "d" * 64


async def _seed(db) -> None:
    """Seed the adversarial fixture. Contours has only ``_CONTOUR_OK``."""
    await db.contours.insert_one({"contour_hash": _CONTOUR_OK, "image_slug": "img-shared"})

    def snap(h: str, *, naive: bool, contour: str = _CONTOUR_OK, **over) -> dict:
        created = datetime(2026, 1, 1, 12, 0, 0)
        if not naive:
            created = created.replace(tzinfo=UTC)
        doc = {
            "_id": ObjectId(),
            "snapshot_hash": h,
            "image_slug": "img-shared",
            "contour_hash": contour,
            "contour_settings": {"n_harmonics": 200},
            "animation_settings": {"active_bases": ["fourier-epicycles"]},
            "created_at": created,
        }
        doc.update(over)
        return doc

    # Two gallery-backed pairs: one with a real owner, one mixed-tz.
    s_pub_a = snap("a" * 64, naive=True)
    s_pub_b = snap("b" * 64, naive=False)
    # A user_slug:None gallery row (R5 §2.3).
    s_null = snap("c" * 64, naive=True)
    # An orphan snapshot — never published (no gallery row).
    s_orphan = snap("e" * 64, naive=True)
    # A zombie orphan — once public, gallery row gone; provenance survives.
    s_zombie = snap("f" * 64, naive=False, published_at=datetime(2025, 12, 1, tzinfo=UTC))

    await db.snapshots.insert_many([s_pub_a, s_pub_b, s_null, s_orphan, s_zombie])

    await db.gallery.insert_many(
        [
            {
                "snapshot_hash": s_pub_a["snapshot_hash"],
                "image_slug": "img-shared",
                "user_slug": "happy-paint-blue-cat",
                "views": 5,
                "likes": 1,
                "active_bases": ["DRIFTED"],
                "n_harmonics": 999,
                "updated_at": datetime(2026, 2, 1, tzinfo=UTC),
            },
            {
                "snapshot_hash": s_pub_b["snapshot_hash"],
                "image_slug": "img-shared",
                "user_slug": "merry-walk-gold-fox",
                "views": 0,
                "likes": 0,
                "updated_at": datetime(2026, 2, 2, tzinfo=UTC),
            },
            {
                "snapshot_hash": s_null["snapshot_hash"],
                "image_slug": "img-shared",
                "user_slug": None,  # the orphan-gallery path
                "views": 2,
                "likes": 0,
                "updated_at": datetime(2026, 2, 3, tzinfo=UTC),
            },
        ]
    )


# ---------------------------------------------------------------------------
# count-parity + transform correctness on the seed
# ---------------------------------------------------------------------------


@requires_mongo
def test_seeded_migration_count_parity_and_transforms():
    async def body(db):
        await _seed(db)
        report = await run_migration(db, dry_run=False)
        assert_count_parity(report)

        vizzes = {v["content_hash"]: v async for v in db.visualizations.find({})}
        return report, vizzes

    report, vizzes = run_db(body)

    # 5 snapshots = 3 gallery-backed + 2 orphans (the orphan + the zombie).
    assert report.snapshots_before == 5
    assert report.gallery_before == 3
    assert report.orphan_snapshots_before == 2
    # PARITY (challenge.md §2 / R5 §3.1):
    #   visualizations_after == snapshots_before == gallery_before + orphans
    assert report.visualizations_after == 5
    assert report.visualizations_after == report.gallery_before + report.orphan_snapshots_before
    assert report.written == 5

    # Two anon owners minted: the user_slug:None row + the orphan + the zombie.
    assert report.anon_minted == 3
    assert report.null_owner_resolved == 1
    assert report.zombie_orphans == 1

    # gallery-backed, real owner → public, gallery-side owner, parent-canonical.
    pub_a = vizzes["a" * 64]
    assert pub_a["visibility"] == "public"
    assert pub_a["owner_slug"] == "happy-paint-blue-cat"
    assert pub_a["active_bases"] == ["fourier-epicycles"]  # NOT the drifted copy
    assert pub_a["n_harmonics"] == 200
    assert pub_a["views"] == 5
    assert pub_a["created_at"].tzinfo is not None  # naive→aware coerced
    assert pub_a["migrated_from"]["was_public"] is True

    # user_slug:None → resolved to anon-migrated, stays public.
    null_row = vizzes["c" * 64]
    assert null_row["visibility"] == "public"
    assert null_row["owner_slug"].startswith("anon-migrated-")
    assert null_row["migrated_from"]["was_public"] is True

    # orphan snapshot → draft, anon-migrated, pinned False, was_public False.
    orphan = vizzes["e" * 64]
    assert orphan["visibility"] == "draft"
    assert orphan["owner_slug"].startswith("anon-migrated-")
    assert orphan["pinned"] is False
    assert orphan["migrated_from"]["was_public"] is False

    # zombie orphan → draft BUT was_public True (the honesty marker).
    zombie = vizzes["f" * 64]
    assert zombie["visibility"] == "draft"
    assert zombie["migrated_from"]["was_public"] is True
    assert zombie["created_at"].tzinfo is not None

    # no null owners anywhere (post-condition held).
    assert all(v["owner_slug"] for v in vizzes.values())


# ---------------------------------------------------------------------------
# idempotency — second run writes nothing (W3.19)
# ---------------------------------------------------------------------------


@requires_mongo
def test_second_run_zero_writes():
    async def body(db):
        await _seed(db)
        first = await run_migration(db, dry_run=False)
        anon_after_first = await db.users.count_documents({"status": "orphan-migrated"})
        second = await run_migration(db, dry_run=False)
        anon_after_second = await db.users.count_documents({"status": "orphan-migrated"})
        total = await db.visualizations.count_documents({})
        return first, second, total, anon_after_first, anon_after_second

    first, second, total, anon1, anon2 = run_db(body)
    assert first.written == 5
    assert second.written == 0
    assert second.skipped_already_migrated == 5
    assert total == 5  # no duplicate rows
    assert anon1 == anon2 == 3  # no duplicate anon owners minted on re-run


# ---------------------------------------------------------------------------
# dangling-contour-hash aborts (W3.18)
# ---------------------------------------------------------------------------


@requires_mongo
def test_dangling_contour_hash_aborts():
    async def body(db):
        await _seed(db)
        # A snapshot whose contour was evicted (no row in `contours`).
        await db.snapshots.insert_one(
            {
                "_id": ObjectId(),
                "snapshot_hash": "9" * 64,
                "image_slug": "img-shared",
                "contour_hash": _CONTOUR_DANGLING,
                "contour_settings": {"n_harmonics": 200},
                "animation_settings": {"active_bases": ["fourier-epicycles"]},
                "created_at": datetime(2026, 1, 1, tzinfo=UTC),
            }
        )
        try:
            await run_migration(db, dry_run=False)
        except RuntimeError as exc:
            return str(exc)
        return None

    msg = run_db(body)
    assert msg is not None
    assert "dangling contour_hash" in msg


# ---------------------------------------------------------------------------
# dry-run mutates nothing
# ---------------------------------------------------------------------------


@requires_mongo
def test_dry_run_mutates_nothing():
    async def body(db):
        await _seed(db)
        report = await run_migration(db, dry_run=True)
        viz_count = await db.visualizations.count_documents({})
        user_count = await db.users.count_documents({"status": "orphan-migrated"})
        return report, viz_count, user_count

    report, viz_count, user_count = run_db(body)
    # The dry-run reports what WOULD be written, but persists nothing.
    assert report.written == 5
    assert report.dry_run is True
    assert viz_count == 0  # no visualizations written
    assert user_count == 0  # no anon owners minted
    # count-parity still holds on the planned counts.
    assert_count_parity(report)
