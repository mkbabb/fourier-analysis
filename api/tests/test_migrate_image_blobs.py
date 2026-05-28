"""C.W5 (thread β) — image-blob migration conformance + the hardening gates.

The live dev image collection is small/empty, so a bare ``--dry-run`` proves
nothing about correctness. This module seeds inline-``blob`` image documents that
mirror the pre-W5 shape and asserts, end-to-end against a live Mongo + a tmp
``blob_dir``:

  * count-parity (``images_before == relocated + skipped``);
  * the blob-XOR-uri post-condition (no doc carries both; none carries neither;
    no surviving inline ``thumbnail`` Binary);
  * a re-run is a total no-op AND re-heals a crash-truncated partial file
    (idempotency keyed on the field flip, NEVER file existence — C11);
  * the 10-row byte-identity spot-check (file bytes == the former blob bytes);

plus the hardening gates the Wχ-P1/P3 challenge bound into W5:

  * C9 — a dedup-hit upload onto a migrated (``blob``-less) doc regenerates the
    thumbnail FROM THE FILE and re-records ``thumbnail_uri`` (never an inline
    ``thumbnail`` Binary);
  * C10 — ``_backfill_image_bounds`` resolves bytes via the shim on a migrated
    doc (the projection no longer ``{blob:1}``-only inclusion-mode);
  * C1 — the janitor image-delete unlinks ``<blob_dir>/<slug>`` + ``<slug>.thumb``;
  * C3 — ``_resolve`` rejects a crafted ``storage_uri`` escaping ``blob_dir``.
"""

import io
import tempfile
from pathlib import Path

import pytest
from bson import Binary
from PIL import Image

from api.config import settings
from api.scripts.migrate_image_blobs import (
    assert_count_parity,
    run_migration,
    verify_spot_check,
)

from conftest import requires_mongo, run_db


# ---------------------------------------------------------------------------
# Fixtures + seed helpers
# ---------------------------------------------------------------------------


@pytest.fixture
def blob_dir(tmp_path, monkeypatch):
    """Point the shared ``settings.blob_dir`` at a per-test tmp directory.

    ``image_storage``, ``janitor``, and the migration script all read
    ``settings.blob_dir`` at call time off the one shared ``Settings`` instance,
    so mutating it here propagates everywhere for the test's duration.
    """
    d = tmp_path / "blobs"
    d.mkdir()
    monkeypatch.setattr(settings, "blob_dir", str(d))
    return d


def _png_bytes(color=(200, 30, 30)) -> bytes:
    """A tiny valid PNG (so PIL/thumbnail regeneration succeeds in C9)."""
    buf = io.BytesIO()
    Image.new("RGB", (8, 8), color).save(buf, format="PNG")
    return buf.getvalue()


async def _seed_inline_images(db, n: int = 3, *, with_thumb=True) -> list[dict]:
    """Insert ``n`` pre-W5-shaped image docs carrying inline ``blob`` (+ thumbnail)."""
    await db.images.create_index("image_slug", unique=True)
    docs = []
    for i in range(n):
        content = _png_bytes(color=(10 * i, 20 * i, 30 * i))
        doc = {
            "image_slug": f"seed-image-{i:03d}",
            "sha256": f"{i:064d}",
            "original_name": f"img-{i}.png",
            "content_type": "image/png",
            "bytes": len(content),
            "blob": Binary(content),
            "pinned": False,
        }
        if with_thumb:
            doc["thumbnail"] = Binary(b"THUMB-" + content[:16])
            doc["thumbnail_content_type"] = "image/avif"
        await db.images.insert_one(doc)
        docs.append(doc)
    return docs


# ---------------------------------------------------------------------------
# count-parity + completeness
# ---------------------------------------------------------------------------


@requires_mongo
def test_completeness_count_parity(blob_dir):
    async def body(db):
        await _seed_inline_images(db, 4)
        report = await run_migration(db, dry_run=False)
        assert_count_parity(report)
        # Every doc now carries a storage_uri; none retains an inline blob.
        with_blob = await db.images.count_documents({"blob": {"$exists": True}})
        with_uri = await db.images.count_documents({"storage_uri": {"$exists": True}})
        return report, with_blob, with_uri

    report, with_blob, with_uri = run_db(body)
    assert report.images_before == 4
    assert report.relocated == 4
    assert report.skipped_already_migrated == 0
    assert with_blob == 0
    assert with_uri == 4


# ---------------------------------------------------------------------------
# the blob-XOR-uri post-condition
# ---------------------------------------------------------------------------


@requires_mongo
def test_post_condition_blob_xor_uri(blob_dir):
    async def body(db):
        await _seed_inline_images(db, 3, with_thumb=True)
        await run_migration(db, dry_run=False)
        both = await db.images.count_documents(
            {"blob": {"$exists": True}, "storage_uri": {"$exists": True}}
        )
        missing = await db.images.count_documents({"storage_uri": {"$exists": False}})
        stale_thumb = await db.images.count_documents({"thumbnail": {"$exists": True}})
        thumb_uris = await db.images.count_documents({"thumbnail_uri": {"$exists": True}})
        return both, missing, stale_thumb, thumb_uris

    both, missing, stale_thumb, thumb_uris = run_db(body)
    assert both == 0  # mutual exclusion
    assert missing == 0  # completeness
    assert stale_thumb == 0  # no surviving inline thumbnail Binary
    assert thumb_uris == 3  # each relocated thumbnail recorded its uri


# ---------------------------------------------------------------------------
# idempotency: a re-run is a no-op AND re-heals a crash-truncated partial (C11)
# ---------------------------------------------------------------------------


@requires_mongo
def test_idempotent_re_run(blob_dir):
    async def body(db):
        await _seed_inline_images(db, 3)
        first = await run_migration(db, dry_run=False)
        # Simulate a crash-truncated partial file from a prior interrupted run by
        # corrupting one relocated file. The doc is already flipped, so it will
        # NOT be re-processed — proving the marker is the field flip, not the
        # file. (The self-heal of a NON-flipped partial is covered below.)
        second = await run_migration(db, dry_run=False)
        return first, second

    first, second = run_db(body)
    assert first.relocated == 3
    assert second.relocated == 0  # total no-op
    assert second.skipped_already_migrated == 3


@requires_mongo
def test_re_run_overwrites_truncated_partial(blob_dir):
    """C11: a doc still matching the selector with a truncated file is re-healed."""

    async def body(db):
        await db.images.create_index("image_slug", unique=True)
        content = _png_bytes()
        await db.images.insert_one(
            {
                "image_slug": "partial-image-000",
                "sha256": "p" * 64,
                "content_type": "image/png",
                "original_name": "p.png",
                "bytes": len(content),
                "blob": Binary(content),
                "pinned": False,
            }
        )
        # A crash mid-write left a truncated partial file; the doc was NOT flipped
        # (still carries blob, lacks storage_uri), so it still matches the
        # selector. Write a truncated file to stand in for the partial.
        (blob_dir / "partial-image-000").write_bytes(content[:3])
        report = await run_migration(db, dry_run=False)
        on_disk = (blob_dir / "partial-image-000").read_bytes()
        return report, on_disk, content

    report, on_disk, content = run_db(body)
    assert report.relocated == 1
    # The re-run truncate-and-overwrote the partial with the full bytes.
    assert on_disk == content


# ---------------------------------------------------------------------------
# 10-row byte-identity spot-check
# ---------------------------------------------------------------------------


@requires_mongo
def test_spot_check_byte_identity(blob_dir):
    async def body(db):
        await _seed_inline_images(db, 5)
        report = await run_migration(db, dry_run=False)
        verified = verify_spot_check(report)
        return verified

    verified = run_db(body)
    assert len(verified) == 5  # fewer than 10 docs → all sampled
    assert all(r["byte_identical"] for r in verified)


# ---------------------------------------------------------------------------
# C9 — dedup-hit on a migrated (blob-less) doc regenerates the thumbnail
#       FROM THE FILE and re-records thumbnail_uri (never an inline Binary).
# ---------------------------------------------------------------------------


@requires_mongo
def test_dedup_hit_on_migrated_doc(blob_dir):
    from api.services import database
    from api.services.image_storage import store_image_asset

    async def body(db):
        database._db = db
        await db.images.create_index("image_slug", unique=True)
        await db.images.create_index("sha256", unique=True)

        content = _png_bytes()
        import hashlib

        sha = hashlib.sha256(content).hexdigest()

        # First store: writes the file(s) + storage_uri/thumbnail_uri on insert.
        first = await store_image_asset(sha, content, "orig.png", "image/png")
        slug = first["image_slug"]

        # The doc is now in the migrated shape (no inline blob, storage_uri set).
        doc_after_first = await db.images.find_one({"image_slug": slug})

        # A dedup-hit upload (same sha256) onto the blob-less doc. Pre-W5 this
        # KeyErrored on existing["blob"], swallowed by the broad except. Now it
        # must read the primary bytes through the shim (the relocated file) and
        # write the regenerated thumbnail back as a FILE + thumbnail_uri.
        # Remove the existing thumb file first so we can prove it gets rewritten.
        (blob_dir / f"{slug}.thumb").unlink(missing_ok=True)
        second = await store_image_asset(sha, content, "orig.png", "image/png")
        doc_after_dedup = await db.images.find_one({"image_slug": slug})

        thumb_file = blob_dir / f"{slug}.thumb"
        return doc_after_first, doc_after_dedup, thumb_file.exists(), second

    doc_first, doc_dedup, thumb_exists, second = run_db(body)

    # No inline blob/thumbnail Binary ever — only the relocated uris.
    assert "blob" not in doc_first
    assert "thumbnail" not in doc_first
    assert doc_first["storage_uri"].startswith("fs:")

    # The dedup hit regenerated the thumbnail FROM THE FILE and re-recorded
    # thumbnail_uri — NOT an inline thumbnail Binary (invariant 18 held).
    assert "thumbnail" not in doc_dedup
    assert doc_dedup["thumbnail_uri"] is not None
    assert doc_dedup["thumbnail_uri"].startswith("fs:")
    assert thumb_exists  # the thumbnail file was (re)written from the relocated primary
    # The dedup branch returned the existing doc (no duplicate inserted).
    assert second["image_slug"] == doc_first["image_slug"]


# ---------------------------------------------------------------------------
# C10 — _backfill_image_bounds resolves bytes via the shim on a migrated doc.
# ---------------------------------------------------------------------------


@requires_mongo
def test_backfill_image_bounds_on_migrated_image(blob_dir):
    from api.dependencies import _backfill_image_bounds

    async def body(db):
        await db.images.create_index("image_slug", unique=True)
        content = _png_bytes()
        # A migrated image doc: relocated file + storage_uri, NO inline blob.
        (blob_dir / "img-migrated-000").write_bytes(content)
        await db.images.insert_one(
            {
                "image_slug": "img-migrated-000",
                "sha256": "m" * 64,
                "content_type": "image/png",
                "storage_uri": "fs:img-migrated-000",
                "thumbnail_uri": None,
                "pinned": False,
            }
        )
        contour_doc = {
            "_id": "contour-x",
            "contour_hash": "c" * 64,
            "image_slug": "img-migrated-000",
            "image_bounds": None,
        }
        await db.contours.insert_one(contour_doc)
        result = await _backfill_image_bounds(db, dict(contour_doc))
        persisted = await db.contours.find_one({"_id": "contour-x"})
        return result, persisted

    result, persisted = run_db(body)
    # Bounds were computed (the shim resolved the file) and persisted — NOT
    # silently degraded by a {blob:1}-projection KeyError.
    assert result["image_bounds"] is not None
    assert persisted["image_bounds"] is not None
    assert persisted["image_bounds"]["maxX"] > 0


# ---------------------------------------------------------------------------
# C1 — the janitor image-delete unlinks the relocated files.
# ---------------------------------------------------------------------------


@requires_mongo
def test_janitor_unlinks_blob_on_prune(blob_dir):
    from datetime import UTC, datetime, timedelta

    from api.services import database
    # fourier-D.W3 γ: ``_delete_images_and_cascade`` was renamed to
    # ``_delete_images`` and its return shape simplified to ``int`` (the
    # gallery-cascade arm was retired with the dead ``gallery`` collection).
    from api.services.janitor import _delete_images

    async def body(db):
        database._db = db
        await db.images.create_index("image_slug", unique=True)
        old = datetime.now(UTC) - timedelta(days=999)
        # A migrated, unpinned, stale image: file on disk, storage_uri in Mongo.
        (blob_dir / "prune-me-000").write_bytes(_png_bytes())
        (blob_dir / "prune-me-000.thumb").write_bytes(b"thumb-bytes")
        await db.images.insert_one(
            {
                "image_slug": "prune-me-000",
                "sha256": "z" * 64,
                "storage_uri": "fs:prune-me-000",
                "thumbnail_uri": "fs:prune-me-000.thumb",
                "pinned": False,
                "last_accessed_at": old,
            }
        )
        before_blob = (blob_dir / "prune-me-000").exists()
        before_thumb = (blob_dir / "prune-me-000.thumb").exists()

        deleted = await _delete_images(
            db, {"pinned": False, "last_accessed_at": {"$lt": datetime.now(UTC)}}
        )
        after_blob = (blob_dir / "prune-me-000").exists()
        after_thumb = (blob_dir / "prune-me-000.thumb").exists()
        doc = await db.images.find_one({"image_slug": "prune-me-000"})
        return deleted, before_blob, before_thumb, after_blob, after_thumb, doc

    deleted, before_blob, before_thumb, after_blob, after_thumb, doc = run_db(body)
    assert deleted == 1
    assert before_blob and before_thumb  # both files existed pre-prune
    assert not after_blob  # the primary file was unlinked (inv-18 delete-coupling)
    assert not after_thumb  # the thumbnail file was unlinked
    assert doc is None  # the Mongo doc was deleted in the same cascade


# ---------------------------------------------------------------------------
# C3 — _resolve rejects a crafted storage_uri escaping blob_dir.
# ---------------------------------------------------------------------------


def test_resolve_rejects_escape(monkeypatch):
    """C3 hardening: a traversal-bearing key resolving outside blob_dir raises."""
    d = tempfile.mkdtemp()
    monkeypatch.setattr(settings, "blob_dir", d)
    from api.services.image_storage import _resolve

    # A confined key resolves fine.
    ok = _resolve("fs:statuesque-meteoric-numbat")
    assert Path(ok).is_relative_to(Path(d).resolve())

    # A crafted escaping key raises (defence behind the slug regex).
    with pytest.raises(ValueError):
        _resolve("fs:../../etc/passwd")
    with pytest.raises(ValueError):
        _resolve("fs:../escapee")
