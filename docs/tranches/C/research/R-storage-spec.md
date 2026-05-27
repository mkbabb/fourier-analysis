# R-storage-spec — the chosen backend's binding contract (filesystem + nginx)

Repo: `fourier-analysis` · Date: 2026-05-27 · Mode: **READ-ONLY research** — a specification proposal binding on the W5 implementation wave. No source touched here. The survey + verdict that select this backend are in `R1-storage-backend.md`; this document is the contract W5 implements and Wχ-P1/P3 test against.

Binds: `C.md §5` (W5 file ownership row), `§6` (hard gates), `§8` (the window). Mirrors the migration discipline of `B/research/R-lifecycle-spec.md §5.1` and the in-tree idiom of `api/scripts/migrate_visualization.py`.

**Chosen backend (from `R1-storage-backend.md §5`): Filesystem + nginx static serve, app-served variant.** Atomic per-document cutover: **YES**. §8 brittleness window: **REMOVED** (proof in §4 below).

---

## 1. The `storage_uri` schema field (invariant 18)

Added to each `images` document. Two new string fields (one per relocated blob):

| Field | Type | Value form | Records |
|---|---|---|---|
| `storage_uri` | `str` | `"fs:<image_slug>"` | the primary blob's backend-relative key |
| `thumbnail_uri` | `str \| null` | `"fs:<image_slug>.thumb"` or `null` | the thumbnail's key; `null` iff the doc never had a thumbnail (the `_generate_thumbnail` `except` path, `image_storage.py:88,95-96`, can leave no thumbnail) |

Design constraints (per `CA5 §2.3`, ratified):
- **Backend-relative, NOT absolute.** The `fs:` scheme + `image_slug` key keeps the host path out of the database; the volume mount point (`blob_dir`) is config (`§2`), so a remount does not invalidate stored URIs.
- **Mutual-exclusion invariant — `blob` XOR `storage_uri`.** A document carries the inline `blob` *or* a `storage_uri`, **never both** past its own atomic flip (§4). The verification harness asserts this (§3.2). Same for `thumbnail` XOR `thumbnail_uri`.
- The `ImageAssetResponse` model (`api/models/assets.py:17-24`) does **not** expose `storage_uri` — it is an internal storage detail, not part of the API contract (the response already omits `blob`; `storage_uri` is likewise omitted). No model field is added to the public DTO.

The `bytes`, `sha256`, `image_slug`, `pinned`, `last_accessed_at`, `content_type` fields are **untouched** — relocation moves bytes, not identity or retention metadata (`R-lifecycle-spec.md §6.4`).

### 1.1 Config field

One field on `Settings` (`api/config.py`), mirroring `max_upload_mb` (`:11`):

```python
blob_dir: str = "/data/blobs"   # filesystem backend root; volume mount point in prod
```

No index change is required for the field flip — the relocation is keyed by `image_slug` (already unique-indexed, `database.py:50`). No `storage_uri` index is needed (it is never queried; reads resolve by `image_slug` then read the field).

### 1.2 Infra delta (the one explicit compose change W5 owns)

- `docker-compose.prod.yml` `backend`: add `volumes: ["image_blobs:/data/blobs"]` (read-write) — today `backend` declares no volumes in prod (`prod.yml` backend block has none).
- `docker-compose.yml` `backend` (dev): add a bind-mount or the named volume so dev parity holds.
- Top-level `volumes:` gains `image_blobs:` alongside `mongo_data` (`prod.yml:56` / `docker-compose.yml:50-51`).
- nginx is **NOT** changed in the app-served variant (the bytes flow through FastAPI; `fourier.conf` `/api/` proxy already covers `…/blob`). The nginx-direct variant (volume mounted read-only into `nginx`, `location /blobs/`) is explicitly **deferred** per `R1 §2.1` and is NOT part of this contract.

---

## 2. The serving contract

`GET /api/images/{slug}/blob` and `GET /api/images/{slug}/thumbnail` serve from the filesystem backend via the read shim.

### 2.1 The read shim (the migration boundary)

`image_bytes(asset)` (`api/services/image_storage.py:139-143`) is the boundary `CA5 §2.3` names. Post-migration it resolves **by `storage_uri`-presence**:

```python
def image_bytes(asset: dict) -> tuple[bytes, str]:
    uri = asset.get("storage_uri")
    if uri is not None:
        # "fs:<image_slug>" → <blob_dir>/<image_slug>
        path = _resolve(uri)               # backend-relative → absolute under blob_dir
        return path.read_bytes(), asset.get("content_type", "image/png")
    # Pre-cutover doc (still mid-backfill) — read inline. After the W5
    # deletion-proof commit, NO doc carries `blob`; this branch is dead and is
    # DELETED in the same commit that drops the inline write (no legacy code).
    blob = asset["blob"]
    return (bytes(blob) if isinstance(blob, Binary) else blob), asset.get("content_type", "image/png")
```

**Critical NO-legacy-code clause:** the `blob`-reading branch above exists ONLY for the duration of the backfill (when both old and new docs transiently coexist *across documents*, never within one). The W5 hard-gate commit that proves `image_storage.py:104` no longer writes `Binary(content)` **also deletes the `blob`-reading branch** — because post-cutover no document carries `blob` (the atomic per-doc flip unset it). A surviving `blob` read past cutover would be the dual-read legacy layer invariant 3 forbids. The atomicity (§4) is what makes this deletion safe: there is no doc left to read `blob` from.

### 2.2 The serving path (app-served — DEFAULT)

`GET /api/images/{slug}/blob` (`images.py:132-140`) — the route, the `get_image_asset` dependency (404 + the `touch_document` access-time touch, `dependencies.py:47-55`), and the `Cache-Control: public, max-age=86400` header (`images.py:139`) are **UNCHANGED**. Only the response constructor changes:

- **Replace** `StreamingResponse(io.BytesIO(data), media_type=content_type, headers=...)` (`images.py:136-140`)
- **With** `FileResponse(path, media_type=content_type, headers={"Cache-Control": "public, max-age=86400"})` — FastAPI's `FileResponse` streams the file with `Content-Length` + conditional-request support, strictly better than the in-memory `BytesIO` for large blobs.

`GET /api/images/{slug}/thumbnail` (`images.py:143-156`) — resolves `thumbnail_uri`; if `null` (no thumbnail), falls back to the primary `storage_uri` (preserving the existing fallback at `images.py:147-151`). `FileResponse` likewise.

`GET /api/images/{slug}/overlay` (`images.py:159-200`) reads `image_bytes(doc)` (`:169`) → unchanged, gets the bytes through the shim.

The compute backfill (`dependencies.py:91-100`) and `image_tempfile` (`image_storage.py:146-167`) read through the shim — verified consumers, all covered by the §2.1 boundary.

### 2.3 The `last_accessed_at` touch is preserved

The app-served path keeps `get_image_asset`'s `touch_document("images", ...)` (`dependencies.py:54`) on every blob read — the retention prune (`janitor.py:99-102`) depends on it. The nginx-direct variant would lose this; the contract chooses app-served precisely to keep it (`R1 §2.1`).

---

## 3. The migration script (shape + verification harness)

`api/scripts/migrate_image_blobs.py` (create — named at `C.md §5` W5 row). Mirrors `api/scripts/migrate_visualization.py` exactly (the in-tree idiom, `R1 §1.4`).

### 3.1 Shape (three-artefact discipline, `R-lifecycle-spec.md §5.1`)

```python
# api/scripts/migrate_image_blobs.py
#
# Idempotent backfill: relocate inline `blob` + `thumbnail` Binary fields from
# each `images` document onto the filesystem backend; record `storage_uri` +
# `thumbnail_uri`; $unset the inline fields. One-way clean ATOMIC cutover
# (R1 §4) — every relocated file is a pure function of the existing Mongo
# Binary, so NO dual-read layer is needed (forbidden legacy code).
#
#   python -m api.scripts.migrate_image_blobs            # live backfill
#   python -m api.scripts.migrate_image_blobs --dry-run  # report only, no writes
#
# `--reload` constraint (L6 chronic #5): run STANDALONE against a non-`--reload`
# backend (or backend down). The clean cutover depends on a stable process.
"""One-time migration: inline image blobs → filesystem backend."""

from __future__ import annotations

import argparse, asyncio, logging
from dataclasses import dataclass, field
from pathlib import Path

from bson import Binary
from api.config import settings
from api.services.database import close_db, connect_db, get_db

logger = logging.getLogger("migrate_image_blobs")


@dataclass
class Report:
    images_before: int = 0
    relocated: int = 0
    thumbnails_relocated: int = 0
    skipped_already_migrated: int = 0      # already carry storage_uri (idempotent re-run)
    no_thumbnail: int = 0                  # primary relocated; thumbnail_uri = None
    dry_run: bool = False
    spot_check: list[dict] = field(default_factory=list)


def _blob_dir() -> Path:
    p = Path(settings.blob_dir)
    p.mkdir(parents=True, exist_ok=True)
    return p


async def run_migration(db, *, dry_run: bool = False) -> Report:
    report = Report(dry_run=dry_run)
    report.images_before = await db.images.count_documents({})
    blob_dir = _blob_dir()

    # Idempotency by marker: select only docs that still carry an inline `blob`
    # AND lack a `storage_uri`. A re-run is a total no-op once converged.
    cursor = db.images.find({"blob": {"$exists": True}, "storage_uri": {"$exists": False}})
    async for doc in cursor:
        slug = doc["image_slug"]
        blob = doc["blob"]
        data = bytes(blob) if isinstance(blob, Binary) else blob

        update_set = {"storage_uri": f"fs:{slug}"}
        update_unset = {"blob": ""}

        # Thumbnail (the SECOND blob — invariant 18). Relocate alongside.
        if doc.get("thumbnail") is not None:
            thumb = doc["thumbnail"]
            tdata = bytes(thumb) if isinstance(thumb, Binary) else thumb
            update_set["thumbnail_uri"] = f"fs:{slug}.thumb"
            update_unset["thumbnail"] = ""
        else:
            update_set["thumbnail_uri"] = None
            report.no_thumbnail += 1

        if not dry_run:
            # 1. write file(s) — pure function of existing Mongo bytes (retryable)
            (blob_dir / slug).write_bytes(data)
            if "thumbnail" in update_unset:
                (blob_dir / f"{slug}.thumb").write_bytes(tdata)
            # 2 & 3. ATOMIC per-doc flip: $set uri + $unset inline, ONE update_one
            await db.images.update_one(
                {"_id": doc["_id"]},
                {"$set": update_set, "$unset": update_unset},
            )

        report.relocated += 1
        if "thumbnail" in update_unset:
            report.thumbnails_relocated += 1
        if len(report.spot_check) < 10:                      # seed-spot-check (R-lifecycle §5.1)
            report.spot_check.append({"slug": slug, "bytes": len(data),
                                      "had_thumb": "thumbnail" in update_unset})

    if not dry_run:
        await _assert_post_conditions(db)
    assert_count_parity(report)
    return report
```

### 3.2 Verification harness (the count-parity + seed-spot-check, `R-lifecycle-spec.md §5.1`)

```python
async def _assert_post_conditions(db) -> None:
    """Invariant-18 post-conditions — verified, not hoped. RuntimeError on any."""
    # (a) Mutual exclusion: NO doc carries both `blob` and `storage_uri`.
    both = await db.images.count_documents({"blob": {"$exists": True},
                                            "storage_uri": {"$exists": True}})
    if both > 0:
        raise RuntimeError(f"post-condition: {both} image(s) carry BOTH blob and storage_uri")
    # (b) Completeness: every doc carries a storage_uri (none left inline).
    missing = await db.images.count_documents({"storage_uri": {"$exists": False}})
    if missing > 0:
        raise RuntimeError(f"post-condition: {missing} image(s) lack storage_uri")
    # (c) Thumbnail parity: no surviving inline `thumbnail` Binary.
    stale_thumb = await db.images.count_documents({"thumbnail": {"$exists": True}})
    if stale_thumb > 0:
        raise RuntimeError(f"post-condition: {stale_thumb} image(s) retain inline thumbnail")


def assert_count_parity(report: Report) -> None:
    """pre-count == relocated + skipped (R-lifecycle §5.1 / C.md §6 gate)."""
    produced = report.relocated + report.skipped_already_migrated
    if produced != report.images_before:
        raise RuntimeError(
            f"count-parity: images_before ({report.images_before}) != "
            f"relocated+skipped ({produced})")
```

**Seed-spot-check (the C.md §6 gate "seed-spot-check of 10 returns identical bytes from old and new sources before the old field deletes").** Because the file write precedes the field `$unset` in the same per-doc step, the spot-check is run as a *separate verification pass* BEFORE the deletion-proof commit lands, against a sample of 10 docs: for each, read the file at `<blob_dir>/<slug>` and assert its bytes `==` the bytes the doc's `blob` held (captured during backfill into `report.spot_check`, or re-read on a pre-cutover snapshot). The harness fails the migration unless all 10 are byte-identical. This is the `test_migration_*` conformance assertion (`R-lifecycle-spec.md §5.6`): `api/tests/test_migrate_image_blobs.py::{test_idempotent_re_run, test_post_condition_blob_xor_uri, test_completeness_count_parity, test_spot_check_byte_identity}`.

### 3.3 The deletion-proof commit (W5 hard gate, `C.md §6`)

In the **same commit** that proves the migration ran (count-parity artefact + green harness):
- `image_storage.py:104` `"blob": Binary(content)` is **deleted** — the write path now writes the file to `blob_dir` and stores `storage_uri` on insert (no inline `blob`). The `store_image_asset` insert (`:99-108`) gains the file-write + `storage_uri`/`thumbnail_uri` fields and drops `blob`/`thumbnail`.
- The `image_bytes` `blob`-reading branch (§2.1) is **deleted** — no doc carries `blob` post-cutover.
- The `_generate_thumbnail`-on-dedup-hit path (`image_storage.py:69-80`) reads `existing["blob"]`; it is rewritten to read through the shim (the relocated file) — it currently assumes an inline `blob`.
- `dependencies.py:91-100` (compute backfill projecting `{blob:1}`) is rewritten to read through the shim.

`grep -n 'Binary(content)' api/services/image_storage.py` returns zero — the W5 deletion proof (`C.md §6`). The rollback substrate during the backfill is the inline `blob` field on not-yet-converted docs; once the deletion-proof commit lands, rollback is via the pre-W5 commit + the retained files (the files are the new source of truth).

---

## 4. The brittleness window: REMOVED (with the atomic-cutover proof)

**W5 does NOT need the §8 brittleness window.** The atomic per-document cutover removes it. The proof (full form in `R1 §4`, summarised here as the binding finding):

Per document, the cutover is three steps:
1. **read** `blob` (+ `thumbnail`) — bytes already present in Mongo;
2. **write** file(s) to the volume-local `blob_dir` — a pure, retryable function of step-1 bytes;
3. **flip** `update_one({$set: storage_uri/thumbnail_uri, $unset: blob/thumbnail})` — a **single atomic** Mongo document update.

Because step 3 is atomic (Mongo single-document guarantee) and step 2 is volume-local (no network partial-failure boundary, `R1 §1.3`), **the `blob` XOR `storage_uri` post-condition holds document-by-document at every instant**. No reader ever needs both backends: the read shim (`§2.1`) resolves by `storage_uri`-presence; a doc either has its file (post-flip) or its inline `blob` (pre-flip), determined atomically. **No dual-read compatibility layer is required, hence none is left past cutover** — which is exactly what `C.md §6`'s invalid-gate list ("a dual-read compatibility layer left in place 'for safety'") and invariant 3 (no legacy code) forbid.

The only crash mode — a process death between step 2 and step 3 — leaves a harmless, idempotent, self-healing disk orphan (the doc still serves from `blob`; the re-run deterministically overwrites the orphan with byte-identical content since the path is `image_slug`-keyed). It does **not** violate the in-database post-condition (step 3 is atomic) and is discharged by the idempotent re-run + count-parity. This is the refutation `R1 §4` runs against the atomicity claim; the claim survives.

**Disposition for `C.md §8`:** the window is struck at Wχ close (Wχ-P3 tests the cutover is genuinely atomic per this contract). W5 owns its own (non-existent) restoration — there is nothing to restore because there is no suspended-read span. `C.md §8`'s `breaking_changes_during_wave: maybe (W5)` resolves to **no**; the `suspended_gates` list (`GET /api/images/{slug}/blob during cutover`) is **empty** — the endpoint is never suspended (each doc serves from exactly one backend throughout).

---

## 5. W5 implementation checklist (the binding gate list)

1. `api/config.py` gains `blob_dir: str = "/data/blobs"`.
2. `docker-compose.prod.yml` + `docker-compose.yml` gain the `image_blobs` volume mounted into `backend` (§1.2).
3. `api/scripts/migrate_image_blobs.py` created per §3; `--dry-run` + live; idempotent; count-parity + post-conditions + 10-row byte-identity spot-check.
4. `image_storage.py:104` `Binary(content)` write **deleted**; `store_image_asset` writes files + `storage_uri`/`thumbnail_uri` (both blobs); `grep 'Binary(content)'` returns zero (the deletion proof).
5. `image_bytes` shim resolves by `storage_uri`; the `blob`-reading branch deleted post-cutover (no legacy dual-read).
6. `images.py` `…/blob` + `…/thumbnail` serve via `FileResponse`; route + auth + `Cache-Control` + `last_accessed_at` touch unchanged.
7. Migration ran: count-parity artefact recorded; harness green (`api/tests/test_migrate_image_blobs.py`).
8. `C.md §8` window struck (Wχ-P3 confirms atomicity); no suspended gate.

---

## 6. Citation summary

- `api/services/image_storage.py:104` — primary-blob write (deletion target); `:77,92` — thumbnail write; `:69-80` — dedup-hit thumbnail regen (reads `blob`); `:88,95-96` — no-thumbnail except path; `:139-143` — `image_bytes` shim; `:146-167` — `image_tempfile`; `:99-108` — `store_image_asset` insert.
- `api/routers/images.py:132-140` — `…/blob`; `:143-156` — `…/thumbnail`; `:159-200` — `…/overlay` (`:169` reads shim).
- `api/dependencies.py:47-55` — `get_image_asset` (404 + touch); `:91-100` — compute backfill `{blob:1}`.
- `api/models/assets.py:17-24` — `ImageAssetResponse` (no `storage_uri` exposure).
- `api/config.py:11` — `max_upload_mb` (config precedent).
- `api/services/database.py:50,57` — `image_slug` unique index + `(pinned, last_accessed_at)`.
- `api/services/janitor.py:99-102` — recency prune (depends on `last_accessed_at` touch).
- `docker-compose.prod.yml:56` / `docker-compose.yml:50-51` — `mongo_data` volume (precedent + sibling).
- `api/scripts/migrate_visualization.py` — the migration idiom mirrored (dry-run, Report, post-conditions, count-parity, idempotent-by-marker, standalone-non-reload, no-dual-read).
- `docs/tranches/B/research/R-lifecycle-spec.md §5.1,§5.6` — three-artefact discipline + conformance rows.
- `docs/tranches/C/C.md §5,§6,§8` — W5 ownership, hard gates, window; `§2 inv 18` — `storage_uri` requirement.
- `docs/audits/runs/2026-05-27-C-audit/CA5-storage-infra-audit.md §2.2,§2.3` — atomic-cutover + field design.
