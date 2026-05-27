# Challenge-P3 — is the brittleness window honest, or is the filesystem cutover truly atomic?

**Probe**: Wχ.P3 (tranche-C challenge wave). **Mode**: RESEARCH-ONLY, ADVERSARIAL — single deliverable; no source/spec/coordination edits, no commit.
**Date**: 2026-05-27. **Working tree**: `fourier-analysis` @ branch `master`.

**The claim under attack** (`R-storage-spec.md §4`, `R1-storage-backend.md §4`): per-document `write file → update_one($set storage_uri, $unset blob)` is atomic, so `blob` XOR `storage_uri` holds document-by-document at every instant, so NO dual-read compatibility layer is needed, so the `C.md §8` brittleness window is **REMOVED**.

Every claim below was independently verified against the live tree (`api/services/{image_storage,database}.py`, `api/routers/images.py`, `api/dependencies.py`, `api/config.py`, `docker-compose*.yml`) and the live spec docs (`R-storage-spec.md`, `R1-storage-backend.md`, `C.md`, `W0-baseline.md`). Findings are mine, not relays.

---

## §0 — Verdict (up front)

**PASS-WITH-CONDITIONS on "window removed."**

The core atomicity claim survives: the in-database post-condition `blob` XOR `storage_uri` genuinely holds document-by-document because step 3 is a single-document `update_one` (Mongo's atomicity guarantee) and the deployment is a single standalone `mongod` (`docker-compose.prod.yml:11` `replicas: 1`; no `--replSet` at `:45`) read at `primary`/`local` (default client, `database.py:29`) — so read-your-writes is satisfied and there is no stale-read hole *in the migration's own write path*. The endpoint `GET /api/images/{slug}/blob` is never *suspended*: each document serves from exactly one backend throughout the sweep. On the narrow question "is the per-doc flip atomic, and is the disk orphan harmless/self-healing," the spec is **correct**.

BUT the spec's leap from "each doc is atomic" to "no correctness layer is needed mid-sweep" is **not fully honest**. There is a concrete, untested correctness hole — the **dedup-hit-on-migrated-doc path** — that is a *runtime write-path bug*, not a transient migration artifact, and it KeyErrors the instant the first doc loses its `blob`. The spec §3.3 *names* this path but the brief's suspicion is correct: naming it in a rewrite-list is not the same as the window-removal proof covering it. The conditions in §6 are the exact holes W5 must close before `C.md §8` is struck.

---

## §1 — The stale-read / read-during-backfill race (sub-probe 1)

**Verdict: NO stale-read hole on this deployment. The atomicity proof holds for the read shim's own resolution. (clean)**

The shim (`R-storage-spec.md §2.1`, the post-W5 form) resolves by `storage_uri`-presence: `uri = asset.get("storage_uri"); if uri is not None: read file; else: read asset["blob"]`. The race the brief asks about — "is there a window where a doc has the FILE written but the `update_one` hasn't landed, OR the `update_one` landed but a reader cached the old doc?" — decomposes into two sub-cases, both clean on this tree:

1. **File written, flip not yet landed.** The doc still carries `blob` and lacks `storage_uri`. The shim reads `blob` — correct. The orphan file on disk is unreferenced and harmless (§4). The migration's write ordering (`R-storage-spec.md §3.1` lines: `write_bytes` *then* `update_one`) guarantees the file exists *before* the flip is visible, so there is never a flipped doc whose file is missing. **Clean.**

2. **Flip landed, reader sees stale (pre-flip) doc.** This is the only genuine stale-read concern. It cannot occur on this deployment because:
   - The prod Mongo is a **single standalone node** (`docker-compose.prod.yml:11` `replicas: 1`; the `mongod` command at `:45-47` carries no `--replSet`). There is no secondary to read a stale copy from.
   - The Motor client (`database.py:29`, `AsyncIOMotorClient(settings.mongo_uri, …)`) sets **no `readPreference` and no `readConcern`** — defaults are `primary` + `local`. On a standalone, every read hits the one node's latest committed state. A reader that issues `find_one` *after* the flip commits sees the flipped doc.
   - There is **no app-side document cache** in the read path: `get_image_asset` (`dependencies.py:47-55`) does a fresh `db.images.find_one({"image_slug": …})` per request. No `lru_cache`, no in-process doc memo. (The only in-memory cache in `dependencies.py` is `_suspended_cache` at `:24`, scoped to user suspension — irrelevant here.)

So the document a reader resolves is always either the pre-flip state (reads `blob`, file may or may not exist yet — irrelevant, `blob` is authoritative) or the post-flip state (reads file, which provably exists). **There is no instant where a reader needs both backends, and no stale-read hole.** The spec's "resolves by `storage_uri`-presence … determined atomically" (`R-storage-spec.md §4`) is sound *for this serving path on this topology*.

**Caveat for the record (not a defect, but a binding precondition):** the proof is contingent on the single-standalone topology. Invariant 19 (`C.md §2`) explicitly preserves single-replica and forbids horizontal scaling in C, so the precondition is contract-guaranteed. **If a future tranche introduces a replica set, the default `readPreference` would have to stay `primary` (or `readConcern: majority`) or the stale-read hole opens.** W5 should record this as a topology-bound assumption, not a universal truth — the spec currently states the atomicity as unconditional (`R1 §4` fact 1 "Mongo single-document `update_one` is atomic") without noting the read side depends on standalone/primary reads.

---

## §2 — The dedup-hit path (sub-probe 2) — THE REAL BUG

**Verdict: CONCRETE CORRECTNESS HOLE. The dedup-hit thumbnail-regen path reads `existing["blob"]` unconditionally and KeyErrors on an already-migrated doc. The spec §3.3 *mentions* it but does not prove the window-removal covers it — and it is a RUNTIME write-path bug, not a transient migration artifact. (FAIL absent the §6 condition)**

### 2.1 The live code

`store_image_asset` (`image_storage.py:54-136`) on a sha256 dedup hit (`:66-85`):

```python
existing = await db.images.find_one({"sha256": sha256})        # :66  — full doc, no projection
if existing is not None:
    try:
        thumb_bytes, thumb_ct = _generate_thumbnail(
            bytes(existing["blob"])                              # :70  — UNCONDITIONAL blob read
            if isinstance(existing["blob"], Binary)              # :71
            else existing["blob"],                               # :72
            existing.get("content_type", "image/png"),
        )
        …
    except Exception:                                            # :81
        logger.warning("Thumbnail regeneration failed …")       # :82-84
```

`existing["blob"]` at `:70-72` is a **subscript, not `.get()`** — it raises `KeyError` if the key is absent. After migration, an already-migrated doc has had `blob` `$unset` (`R-storage-spec.md §3.1`, `update_unset = {"blob": ""}`), so `existing["blob"]` is **gone**.

### 2.2 Why this is worse than the spec admits

The spec disposition (`R-storage-spec.md §3.3`, fourth bullet) reads:

> "The `_generate_thumbnail`-on-dedup-hit path (`image_storage.py:69-80`) reads `existing["blob"]`; it is rewritten to read through the shim (the relocated file) — it currently assumes an inline `blob`."

This is in the §3.3 **deletion-proof commit** list — i.e. the rewrite is bundled into the same W5 commit that lands the cutover. The brief's suspicion is exactly right: **this is a real bug the spec must handle, and "rewritten to read through the shim" is the *only* sentence covering it.** Three problems:

1. **It is masked, not crashed, but silently broken.** The `except Exception:` at `:81-84` catches the `KeyError` and logs a warning, then `:85` `return existing`. So a dedup upload onto a migrated doc does NOT 500 — it **silently fails to (re)generate the thumbnail** and returns the existing doc. The brief asks "this KeyErrors" — it does raise `KeyError`, but the broad `except` swallows it. The *observable* failure is a missing/stale thumbnail on a dedup re-upload, logged but not surfaced. This is arguably worse than a crash: it is a silent correctness regression that the deletion-proof commit's green test suite would NOT catch, because **there is zero test coverage for this path** (`grep -rn 'store_image_asset' api/tests/` returns nothing; no dedup-hit test exists). The spec's §3.2 harness asserts migration post-conditions; it does NOT exercise a concurrent/subsequent upload that dedups onto a migrated doc.

2. **It is a runtime path, not a migration path.** This fires on **every** new upload whose bytes hash to an already-stored sha256 (`images.py:113` `upload_image` → `store_image_asset` → the `:66` dedup branch). After W5 completes and *all* docs are migrated, *every* dedup hit takes this path against a `blob`-less doc. So the bug is permanent until §3.3's rewrite lands — it is not confined to the backfill window. The spec correctly lists the rewrite in §3.3, but the §4 window-removal proof reasons only about the *read shim* (`image_bytes`) and the *backfill loop*; it never reasons about the *write path's own internal read of `existing["blob"]`*. The atomicity proof and the dedup-path fix are coupled in the same commit by §3.3, but the §4 *honesty argument* ("no dual-read layer needed") does not mention that the write path itself contains a second blob-read site that must be cut over in lockstep.

3. **The during-backfill case is genuinely racy.** Consider the brief's scenario: a NEW upload arrives mid-sweep and dedups onto a doc that the migration has ALREADY flipped (file written, `blob` unset). The current `:70` reads `existing["blob"]` → `KeyError` → swallowed → thumbnail not regenerated. If W5 lands the cutover code (the shim + the file-write insert) but the migration backfill is still *running* on older docs, then `store_image_asset`'s dedup branch must already resolve bytes via the shim — i.e. the §3.3 rewrite must be **present from the first moment any doc can be migrated**, which it is (same commit). So the *coupling* is correct; what is missing is a **test that a dedup-hit on a migrated (`storage_uri`-only, no-`blob`) doc regenerates the thumbnail from the relocated file, not from a phantom `blob`.** Without that test, §3.3's "rewritten to read through the shim" is an unverified assertion.

### 2.3 The §3.3 rewrite is also under-specified for the SECOND blob

Note the dedup branch writes a NEW thumbnail back (`:75-78` `update_one($set thumbnail: Binary(thumb_bytes))`). After W5, the thumbnail is a *file* (`thumbnail_uri`), not an inline `Binary`. So the §3.3 rewrite must ALSO change `:75-78` to **write the regenerated thumbnail to `<blob_dir>/<slug>.thumb` and `$set thumbnail_uri`**, not `$set thumbnail: Binary(...)`. The spec §3.3 says the dedup path "is rewritten to read through the shim" — it addresses the *read* (`existing["blob"]`) but is **silent on the dedup path's thumbnail WRITE-BACK** (`:75-80`), which currently re-inlines a `Binary`. If only the read is fixed, the write-back at `:77` re-introduces an inline `thumbnail` Binary — directly violating invariant 18's `thumbnail` XOR `thumbnail_uri` and re-creating the very inline-blob the migration just relocated. **This is a second, distinct hole the spec's one-line §3.3 bullet does not cover.** (Post-condition (c) at `R-storage-spec.md §3.2`, `stale_thumb = count_documents({"thumbnail": {"$exists": True}})`, would catch it only if the migration harness re-ran *after* such an upload — but the harness runs once, at migration time, not on every subsequent dedup upload.)

---

## §3 — The compute backfill `{blob:1}` projection (sub-probe 3)

**Verdict: BREAKS the instant a doc loses its `blob`; it IS in the spec's §3.3 rewrite list, but the rewrite as worded is incomplete. (covered-but-thin)**

`_backfill_image_bounds` (`dependencies.py:87-130`) projects `{"blob": 1, "content_type": 1}` (`:93`) then reads `image_doc["blob"]` at `:99` (subscript, not `.get()`):

```python
image_doc = await db.images.find_one(
    {"image_slug": contour_doc["image_slug"]},
    {"blob": 1, "content_type": 1},                              # :93  — projects ONLY blob+ct
)
…
blob = image_doc["blob"]                                          # :99  — KeyError on migrated doc
data = bytes(blob) if isinstance(blob, Binary) else blob
```

This is reached lazily from `get_contour` (`dependencies.py:81-82`) whenever a pre-migration contour lacks `image_bounds`. On a migrated image doc:
- The projection `{"blob": 1}` returns a doc with **no `blob` field** (it was `$unset`) and **no `storage_uri`** (because the projection is *inclusion*-mode: it returns only `blob` + `content_type` + `_id`, deliberately excluding `storage_uri`). So even the shim could not rescue it — the projection itself starves the shim of `storage_uri`.
- `image_doc["blob"]` at `:99` → `KeyError`. Unlike §2, this is wrapped in `try/except Exception` at `:98/:125-128` → logged warning → `:130` returns `contour_doc` *without* backfilling bounds. So again: **silently broken, not crashed** — the contour's `image_bounds` never backfills, and overlay alignment silently degrades.

The spec §3.3 fourth-list-item says "`dependencies.py:91-100` (compute backfill projecting `{blob:1}`) is rewritten to read through the shim." For the shim to work, the **projection at `:93` must change to include `storage_uri` + `content_type` (or drop the projection entirely)** — `image_bytes(image_doc)` cannot resolve a doc that was projected down to `{blob, content_type}` only. The spec names the line range but does not call out that the **projection** (not just the read) must change. **Covered in the list, but the rewrite instruction is too thin to be a binding gate** — W5 must change `:93` AND `:99`, and the §3.2 harness does not test this path at all (no `test_backfill_image_bounds_on_migrated_image` exists).

---

## §4 — The crash-between-write-and-flip (sub-probe 4)

**Verdict: "harmless, self-healing" is SUBSTANTIALLY TRUE, with one unproven assumption about partial-write overwrite. (clean-with-one-condition)**

The spec (`R-storage-spec.md §4`, `R1 §4`) claims the only crash mode — death between step 2 (file write) and step 3 (flip) — leaves "a harmless, idempotent, self-healing disk orphan." Adversarial decomposition:

1. **In-database post-condition is never violated.** Correct, unconditionally. Step 3 is atomic, so a crash before it leaves the doc with `blob` and no `storage_uri` — a valid pre-flip state. The shim reads `blob`. No reader is harmed. ✅

2. **Is `write_bytes` atomic on the filesystem? NO — and the spec is right that it doesn't matter, BUT only under an unverified re-run assumption.** `Path.write_bytes` (`R-storage-spec.md §3.1` line `(blob_dir / slug).write_bytes(data)`) is **not** atomic: it `open(…, "wb")` → `write` → `close`. A crash mid-write leaves a **truncated/partial file** on disk. The spec's safety argument is: the partial file is at `<blob_dir>/<slug>`, the doc was NOT flipped (still has `blob`), so the shim reads `blob` and never touches the partial file — correct so far. **The unproven link is the re-run.** The idempotency query (`R-storage-spec.md §3.1`) is `find({"blob": {"$exists": True}, "storage_uri": {"$exists": False}})` — a doc with a partial file but no flip STILL MATCHES (it still has `blob`, still lacks `storage_uri`), so the re-run re-processes it and re-issues `(blob_dir / slug).write_bytes(data)`. Because `write_bytes` opens with `"wb"` (truncate-and-overwrite), the re-run **overwrites** the partial file with the full byte-identical content. ✅ **So the self-healing claim holds — BUT it rests on the idempotency query keying off the *flip* (`storage_uri` absence), not off file existence.** The spec gets this right by construction: the marker is the DB field, not the file. If a future "skip if file exists" optimization were ever added, it would skip the partial file and the orphan would become a permanent corruption. **Condition: W5 must NOT add a file-existence skip; the idempotency marker must remain the `storage_uri` field flip.** The spec already implies this; it should be made an explicit gate.

3. **A safer-still alternative the spec does not adopt (note, not a blocker):** `migrate_visualization.py` (the mirrored idiom) does not write files, so it offers no precedent for atomic file replace. The robust filesystem idiom is write-to-temp + `os.replace` (atomic rename within a volume). The spec uses bare `write_bytes`. This is *acceptable* given the re-run-overwrites argument in (2), but it means a partial file is briefly observable on disk after a crash. Since the doc is unflipped, no reader sees it, so it is harmless — but W5 *could* use `os.replace` for strictly-no-partial-file-ever-observable semantics. **Not a blocker; recorded as a hardening option.**

---

## §5 — Is "window removed" honest, or should W5 keep a minimal window? (sub-probe 5)

**Verdict: the endpoint is never SUSPENDED, but it IS silently WRONG mid-sweep for the two non-shim consumers (§2 dedup-write-back, §3 backfill projection) until §3.3's rewrites land. Since §3.3 bundles those rewrites into the same cutover commit, there is no span where the cutover code is live but the consumers are unfixed — PROVIDED §3.3 is implemented completely. The "window removed" claim is therefore HONEST for the *serving endpoint* and CONDITIONAL on §3.3 being complete for the *write-path + backfill consumers*.**

The honest framing:
- `GET /api/images/{slug}/blob`, `…/thumbnail`, `…/overlay` (the *serving* endpoints) are never suspended and never wrong — they all flow through `image_bytes` / the shim (`images.py:135,151,169`), which resolves by `storage_uri`-presence per-doc. **The §8 `suspended_gates` list (`GET /api/images/{slug}/blob during cutover`) is genuinely empty.** ✅
- The *write path* (`store_image_asset` dedup branch, §2) and the *lazy backfill* (`_backfill_image_bounds`, §3) are NOT shim consumers today — they read `blob` directly. They are correct ONLY after §3.3 rewrites them. Because §3.3 lands them in the cutover commit, there is no live-but-broken span — **but this is a property of §3.3 being implemented *completely and tested*, which the spec asserts but does not yet verify.** The §3.2 harness tests the migration; it does not test these two consumers against a migrated doc.

So "the window is removed" is honest **iff** the W5 deletion-proof commit (a) rewrites the dedup-path read AND write-back (§2), (b) rewrites the backfill projection AND read (§3), and (c) ships tests for both against a `blob`-less doc. Absent (c), the claim is *asserted* atomicity with two untested correctness holes hiding behind broad `except Exception` swallows — which is exactly the kind of "looks atomic, is silently wrong" gap this probe exists to catch. **No standing dual-read window is needed** (the shim is sufficient for the serving path); what is needed is that the two non-shim consumers be cut over in the same commit and *proven* by test, not just named in a list.

---

## §6 — DISPOSITION

**PASS-WITH-CONDITIONS on "window removed" (`C.md §8` may be struck at Wχ close ONLY with conditions 1–4 bound into the W5 hard-gate list).**

The atomic-cutover proof is sound for the serving path: single-doc `update_one` atomicity + single-standalone-`mongod` primary/local reads + no app-side doc cache ⇒ `blob` XOR `storage_uri` holds per-doc at every instant, no stale-read hole, the disk orphan is harmless and self-healing, and `GET …/blob` is never suspended. The §8 window is genuinely removable for the *endpoint*. But the spec's §4 honesty argument reasons only about the read shim and omits two non-shim blob-read sites that the write path and backfill carry. W5 must close these:

> **Condition 1 — dedup-hit-on-migrated-doc (the sharpest hole, §2).** The §3.3 rewrite of `image_storage.py:66-85` must fix BOTH (a) the READ `existing["blob"]` at `:70-72` → resolve bytes via the shim (relocated file), AND (b) the WRITE-BACK at `:75-80` → write the regenerated thumbnail to `<blob_dir>/<slug>.thumb` + `$set thumbnail_uri`, NOT `$set thumbnail: Binary(...)` (else it re-inlines a Binary, violating invariant 18). The broad `except Exception` at `:81` currently MASKS the `KeyError` as a silent missing-thumbnail regression — there is zero test coverage (`grep store_image_asset api/tests/` is empty). W5 must add `api/tests/test_migrate_image_blobs.py::test_dedup_hit_on_migrated_doc_regenerates_from_file` (or a write-path test) asserting a dedup upload onto a `storage_uri`-only doc regenerates the thumbnail from the file and re-records `thumbnail_uri` (not `thumbnail`).
>
> **Condition 2 — compute backfill projection (§3).** The §3.3 rewrite of `dependencies.py:87-130` must change the PROJECTION at `:93` (currently `{"blob": 1, "content_type": 1}` — inclusion-mode, which starves the shim of `storage_uri`) to include `storage_uri`/`thumbnail_uri` (or drop the projection), AND the read at `:99` to go through the shim. Add `test_backfill_image_bounds_on_migrated_image`. The current `try/except` at `:98/:125` silently degrades overlay alignment, not crashes — equally untested.
>
> **Condition 3 — the crash-overwrite invariant (§4).** The idempotency marker MUST remain the `storage_uri` field flip, never file existence. W5 must NOT add a "skip if file exists" optimization (it would skip a crash-truncated partial file permanently). `Path.write_bytes` is non-atomic; the self-healing rests entirely on the re-run re-issuing a truncate-and-overwrite `write_bytes` against any doc that still matches `{blob exists, storage_uri absent}`. Hardening option (not a blocker): use write-temp + `os.replace` for no-partial-file-ever-observable semantics.
>
> **Condition 4 — record the topology precondition (§1).** The stale-read-free proof is contingent on the single-standalone-`mongod` topology (`prod.yml:11` `replicas: 1`) read at `primary`/`local` (default client). The spec states atomicity as unconditional; W5 should record that a replica-set future would require `readPreference: primary` (or `readConcern: majority`) to preserve read-your-writes. Invariant 19 guarantees the precondition for C, so this is a documentation gate, not an architecture gate.

With conditions 1–4 bound into the W5 hard-gate list and PROVEN by test (not merely named in §3.3's prose), **the cutover is genuinely atomic, no standing dual-read window is needed, and `C.md §8` may be struck at Wχ close.** Without condition 1 in particular, W5 would ship a silent thumbnail-regression bug behind a broad `except` that no current test catches — the "atomic, no window needed" claim would be honest about the database post-condition while concealing a real write-path correctness hole.
