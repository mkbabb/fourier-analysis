# C5 — Migration story audit (Wave 2)

**Agent**: C5 — Migration story audit. **Mode**: READ-ONLY. **HEAD**: `f8db2c6`.

## §0 — Goal + completion criterion

**Goal.** Audit the migration path by which fourier's five identity schemes collapse to one `visualization` entity — no data loss, no fallback, no legacy code surviving past `W5 — close ceremony`. Surface every pre-migration entity, its transformation, the risks, and the W3 scope gaps that prevent the convergence from being honest.

**Completion criterion.** The §1 inventory enumerates every collection that mints / addresses identity today; §3 names a detection-transformation-validation-cutover quadruple per entity; §4–§5 surface risks the W3 spec does not yet absorb; §7 issues a discrete set of scope-item additions for `docs/tranches/B/waves/W3.md`. The final report names the pre-migration entity count, the transformation count, the risk count, and the W3-gap count.

## §1 — Substrate observed (pre-migration inventory)

| Entity | Collection | Primary key | Secondary indexes | Lifecycle | Client cache | Citation |
|---|---|---|---|---|---|---|
| `image` | `images` | ObjectId | `image_slug` unique; `sha256` unique; `last_accessed_at`; `(pinned, last_accessed_at)` | janitor `:60-78` cascade prunes by pin+atime | none | `database.py:42-49`; `image_storage.py:75-110` |
| `contour` | `contours` | ObjectId | `contour_hash` unique; `extraction_cache_key`; `image_slug`; `last_accessed_at`; `(pinned, last_accessed_at)` | janitor prunes by pin+atime | none | `database.py:52-57`; `image_storage.py:180-216` |
| `snapshot` | `snapshots` | ObjectId | `snapshot_hash` unique; `(image_slug, snapshot_hash)` unique | **never pruned** — no `last_accessed_at`, no janitor branch | none | `database.py:60-61`; `routers/snapshots.py:38-78` |
| `gallery_entry` | `gallery` | ObjectId | `snapshot_hash` unique; `(tier, created_at)`; `image_slug`; `views`; `likes`; `user_slug`; three compound cursor indexes | hard-deleted by owner (`gallery.py:311`) or admin | none | `database.py:74-85`; `gallery.py:155-244` |
| `user_slug` | `users` | string = `user_slug` | `last_seen_at` | janitor cascade-prunes by stale `last_seen_at` | implicit (session header) | `database.py:63-64`; `sessions.py:47-49` |
| `session_token` | `sessions` | string = uuid4 | `user_slug`; `expires_at` | janitor expires by `expires_at`; lazy TTL drop+recreate at `database.py:67-72` | `localStorage` | `sessions.py:23-54` |
| `flag` | `flags` | ObjectId | `(snapshot_hash, reporter_slug)` unique | retained for audit | none | `database.py:88-92` |
| `WorkspaceDraft` | IndexedDB `fourier-drafts` / `drafts` | `imageSlug` (string) | none | client-only; never reaches the server | sole owner | `draftStorage.ts:14-62`; `types.ts:100-115` |
| `epicycle_animation` | embedded — lives as `animation_settings` + `active_bases` + `n_harmonics` on `snapshots` and (denormalised) on `gallery` | n/a | n/a | piggybacks on parents | none | `gallery.py:178-194`; snapshot `routers/snapshots.py:38-47` |

**Findings.**
- The audit-E "five identity schemes" tally re-derives: human slug (`image_slug`, `user_slug`), content hash (`sha256`, `contour_hash`, `snapshot_hash`), uuid4 (`sessions._id`), ObjectId (`gallery._id` etc.), client-keyed `imageSlug` (`draftStorage.ts:14`).
- `snapshot` is the only entity with **no `last_accessed_at`** — confirms `R-lifecycle-spec.md §1.1`'s "snapshot lifecycle never pruned" finding; the pre-migration count of orphan snapshots (no gallery row pointing at them) is therefore unbounded above.
- `epicycle_animation` is **not a top-level entity**; it is two parallel payload fields embedded on both `snapshots` and `gallery` — denormalisation drift is latent (`gallery.py:181-194`).

## §2 — Target state (post-migration `visualization` shape)

Per `R-identity-spec §7b Phase 2`, ratified by `B.md §1 thesis bullet 1`:

```python
{
    "_id": ObjectId,
    "slug": str,                  # ^[a-z]+(-[a-z]+){3}$ — unique, immutable, server-minted
    "owner_slug": str,            # NOT NULL (invariant 14); FK → users._id
    "image_slug": str,            # FK → images.image_slug
    "contour_hash": str,          # FK → contours.contour_hash
    "contour_settings": dict,
    "animation_settings": dict,
    "content_hash": str,          # was snapshot_hash; server-internal only
    "visibility": "draft"|"unlisted"|"public",
    "deleted_at": datetime|None,  # soft-delete (invariant; R-lifecycle-spec §3)
    "pinned": bool,               # cron pin flag (W4.a retrofit)
    "tier": "normal"|"saved"|"featured",
    "views": int, "likes": int, "liked_ips": list,
    "version_count": int,         # ETag substrate
    "created_at": datetime, "updated_at": datetime,
    "published_at": datetime|None,
    "last_accessed_at": datetime,
}
```

Drift against B's specs — none material. One nuance: `R-identity-spec §7b Phase 2` does **not** carry `pinned`; W3.md scope-item 5 retrofits it. Pinned IS load-bearing for the janitor `$nin` retirement (`R-lifecycle-spec §4.2`); the model must include it.

## §3 — Per-entity migration mechanism

| Pre-entity | Detection | Transformation | Validation | Cutover |
|---|---|---|---|---|
| `gallery_entry` | `db.gallery.find({"_id": {"$gte": min}})` | mint `slug` via `slug_with_retry`; copy `(image_slug, contour_hash, contour_settings, animation_settings, user_slug, tier, views, likes, liked_ips, created_at, updated_at)`; set `content_hash = snapshot_hash`; `visibility="public"`; `deleted_at=None`; `pinned=True` (gallery rows pin their referents); join the parent `snapshot` for `contour_settings`/`animation_settings` | C-mig-1: `count(visualizations) == count(gallery) + count(orphan_snapshots)` | one-shot script |
| `snapshot` (orphan — no gallery row) | `db.snapshots.find({"snapshot_hash": {"$nin_chunked": gallery_snapshot_hashes}})` (chunked aggregation to avoid the BSON-16MB risk) OR `db.snapshots.aggregate([{$lookup: gallery on snapshot_hash}, {$match: {gallery: {$size: 0}}}])` | mint `slug`; assign `owner_slug = "anon-migrated-NNN"` per §4 risk #2 + audit-E ratified loophole; `visibility="draft"`; `pinned=False`; `content_hash=snapshot_hash` | C-mig-3: zero `owner_slug=null`; C-slug-4 scoped to exclude `^anon-migrated-\d+$` | one-shot |
| `snapshot` (referenced — has gallery row) | the gallery row drives the migration; the snapshot is absorbed as a payload source | merged into `visualization` via the gallery branch above; snapshot is NOT separately inserted | parity: `gallery_count` rows produced one visualization each | one-shot |
| `contour` | n/a — stays in `contours` as content-addressed substrate | unchanged; visualization carries `contour_hash` as FK | grep: `visualizations.contour_hash` resolves into `contours` for 100 % of rows | none — substrate preserved |
| `image` | n/a — stays in `images` as blob substrate (see §6) | unchanged; visualization carries `image_slug` as FK | grep: `visualizations.image_slug` resolves into `images` for 100 % | none — substrate preserved |
| `user_slug` | n/a | unchanged | `R-identity-spec §5d` legacy admission: shape-validate, no re-mint | none |
| `session_token` | n/a | unchanged | none | none |
| IndexedDB `WorkspaceDraft` | `imageSlug` keyPath; client-side at the next visit | **no server-side migration**; remains a client-only draft tier; the `WorkspaceDraft` → `visualization(draft)` lift happens on the user's *next save* via `POST /visualizations` (not at the migration boundary) | none — drafts are ephemeral; the converged path is the new-create path, not a backfill | per-user, lazy |
| `gallery.user_slug = None` (the orphan owner at `gallery.py:188`) | `db.gallery.find({"user_slug": null})` | re-keyed to `anon-migrated-NNN` per the same loophole class as orphan snapshots; visibility retained (public if it was public) | C-mig-3 | one-shot, in the gallery pass |

**Cutover shape**: batch one-time `python -m api.scripts.migrate_visualization`; per-document `$set`; idempotent by `gallery._id` (skip if `visualization.slug` exists with a marker field `migrated_from = gallery._id`). The legacy `snapshots` and `gallery` collections survive until `W5 — close ceremony` per W3 hard-gate #9 and `R-identity-spec §7d` recommend (a).

**Rollback** — forbidden by invariant 16 (no legacy code). Convergence + idempotency hold: re-running the script is a no-op (the `migrated_from` index ensures one-to-one). The "rollback substrate" is the unrenamed legacy collections retained through W5 — not a code path.

## §4 — Risks + edge cases

1. **Orphan snapshots** — `R-lifecycle-spec §1.1` names "snapshot lifecycle never pruned". Pre-flight Phase 0 count (`R-identity-spec §7b`) is the only honest baseline; the migration must report `len(orphan_snapshots)` in `audit/migration-counts.md` and assign each an `anon-migrated-NNN` owner.
2. **`user_slug: None` gallery rows** — `gallery.py:188` admits `None` from `resolve_session()` returning `None` on unauthenticated POST. W3 scope-item 6 tightens `resolve_session`-on-publish-path → 401; legacy rows are re-keyed to `anon-migrated-NNN`. Synthesis from `2026-05-19-crud-deepen/SYNTHESIS.md:51` ratifies this.
3. **Contour-hash collision** — pre-W4.b state hashed independent-axis-sorted coords; the A.W4 fix at `7936137` re-hashed on extraction. Any `contour` minted before that commit may carry the old hash. **The migration must NOT rehash on its own** (it does not own contour content), but it must validate that every visualization's `contour_hash` resolves in `contours` — if it does not, the migration aborts with that visualization's slug listed for manual reconciliation (the script's post-condition gate per W3 scope-item 8).
4. **IndexedDB stale `imageSlug`** — `draftStorage.ts:14` uses `imageSlug` as the IndexedDB keyPath. Post-migration server-side slugs are unchanged for `image_slug` (kept per `R-identity-spec §7a`); the keyPath therefore remains resolvable. **No client-side migration is needed** — but the `WorkspaceDraft → visualization` lift on next save (W4 work) must avoid double-creating drafts when a user re-visits an old `/w/{imageSlug}` URL.
5. **value.js one-sided story** — the orphan verdict means value.js's half (palette schema migration to required-owner + 3-state visibility) never runs. fourier's migration is therefore standalone; the contract's value.js-side conformance rows hold DEFERRED. No fourier-side action required, but the migration script's docstring must not reference a cohort-paired run.
6. **`--reload` aborts compute during migration** — `L6-deferred-chronic.md` chronic item; if `pdm run uvicorn --reload` triggers during the migration script's runtime, the migration interrupts mid-pass. Mitigation: the script MUST run against a production-mode backend (`--reload` disabled) OR be a standalone `python -m` invocation that does not import the uvicorn lifecycle. The latter is already the W3 scope-item 8 shape; document the constraint in the script docstring.
7. **Image-blob size** — `image_storage.py:97` stores `Binary(content)` inline; gallery rows may indirectly tether to multi-MB blobs. The migration does NOT touch image blobs (§6); but the cutover validation must verify that `images.{image_slug}` resolves for every visualization. The `storage_budget_gb` band-aid retirement (W3 scope-item 7) is a SEPARATE concern from the migration.
8. **`anon-migrated-NNN` slug pattern violation** — deliberately violates `^[a-z]+(-[a-z]+){3}$`. Audit-E ratified (`2026-05-19-crud-deepen/SYNTHESIS.md:117`); `R-identity-spec §9 #3` resolves the loophole by scoping C-slug-4. The migration MUST emit these slugs through a separate `mint_anon_migrated_slug(n)` function, not through `slug_with_retry`, to prevent the retry from rejecting the non-conformant shape.
9. **`epicycle_animation` denormalisation drift** — gallery rows carry `active_bases` and `n_harmonics` (`gallery.py:181-194`) that may diverge from their parent snapshot's `animation_settings`. The migration's transformation MUST canonicalise on the snapshot's settings (the parent is the source of truth); the spot-check verifies parity.
10. **`migrate_visualization.py` not idempotent at the orphan-snapshot pass** — re-running could mint multiple `anon-migrated-NNN` slugs for the same orphan if the marker field is missing. The script MUST stamp `migrated_from = snapshot._id` on the orphan-pass insert, and the second pass MUST skip on the presence of that marker.

## §5 — Migration test surface

| Test | What it asserts | File |
|---|---|---|
| `test_migrate_transform_gallery_row` | gallery row + parent snapshot → visualization with all fields populated; ETag substrate present; `pinned=True` | `api/tests/test_migrate_transform.py` (new) |
| `test_migrate_transform_orphan_snapshot` | orphan snapshot → visualization with `owner_slug=anon-migrated-NNN`, `visibility=draft`, `pinned=False` | same |
| `test_migrate_seeded_db_end_to_end` | seeded pre-migration DB → run migration → assert `count(visualizations) == count(gallery) + count(orphans)` | `api/tests/test_migrate_integration.py` (new) |
| `test_migrate_idempotent` | run migration twice → second pass mutates zero documents | same |
| `test_migrate_orphan_user_slug` | gallery row with `user_slug=null` → visualization with `owner_slug=anon-migrated-N` | same |
| `test_migrate_dangling_contour_hash_aborts` | gallery row whose `contour_hash` does not resolve in `contours` → migration aborts with the slug listed | same |
| `test_migrate_anon_migrated_slug_pattern_scoped` | C-slug-4 scoping admits `^anon-migrated-\d+$` for migration artefacts only | `api/tests/test_visualization_ownership.py` (W3 scope-item 10) |
| `test_migrate_dry_run_no_writes` | `--dry-run` flag reports counts but mutates nothing | same |
| `test_migrate_legacy_collections_survive` | post-migration `db.getCollectionNames()` contains `snapshots` AND `gallery` AND `visualizations` | per W3 hard-gate #9 |

The W3 scope-item 10 spec names four pytest specs; the integration + transform specs above are net-new and not yet enumerated.

## §6 — Image-blob fork recommendation

Three options:

| Option | Cost (LOC) | Risk | Disposition |
|---|---|---|---|
| **A.** Migrate `images.blob` to a separate collection now | ~120 LOC change in `image_storage.py`; new `image_blobs` coll; migration step in `migrate_visualization.py` | HIGH — couples a storage-architecture decision to an identity-migration tranche; conflates the W3 brittleness window | **REJECT** |
| **B.** Defer entirely; visualization carries `image_ref = image_slug` resolving to wherever the blob lives (today: Mongo-inline; future C: external) | 0 LOC | LOW — the FK shape is unchanged; the storage backend can move under it | **RECOMMEND** |
| **C.** Excise the blob inline during the identity migration | ~200 LOC + a second brittleness window | HIGH — two architectural moves in one wave; failure mode is correlated | **REJECT** |

**Recommendation: Option B.** Rationale: `B.md §7` explicitly defers "Image-blob storage redesign — the Wα research lane R4 decides whether it lands inside B's scope or defers; the default is C"; `R-lifecycle-spec §1.1` confirms `storage_budget_gb` is a KISS-violation band-aid named for retirement at fourier-C. W3 scope-item 7 retires the band-aid without moving the blob — this is the honest minimum. The visualization's `image_slug` FK resolves wherever the image lives; the migration is invariant under future storage backends.

Cost of C-future-deferral: the `images.blob` Binary field continues to inflate Mongo storage at the rate it does today. The W3 scope-item 7 retirement of `storage_budget_gb` removes the band-aid but does NOT cap growth; W3's brittleness window therefore implicitly bounds the storage clock until fourier-C opens. Recorded.

## §7 — W3 scope-item gaps + proposed additions

W3.md's existing scope items 1–15 cover the router carve, the model, the indexes, the dependencies, the janitor retirement, the utility module landing, the migration script, the verification artefact, the pytest specs, the README block, the levels-derivation lift, and the auto-recompute discipline. Gaps surfaced by this audit:

| Gap | Existing W3 coverage | Proposed scope-item addition |
|---|---|---|
| **G1**: orphan-snapshot detection mechanism not specified | scope-item 8 mentions "orphan-snapshot rule" but no detection query | **W3.16**: name the chunked aggregation `{$lookup: gallery on snapshot_hash}` form; reject the unbounded `$nin` over `gallery.distinct("snapshot_hash")` (mirrors the janitor retirement) |
| **G2**: `anon-migrated-NNN` minting function not specified | scope-item 8 cites "anon-migrated-NNN" but no minting | **W3.17**: add `api/scripts/migrate_visualization.py::mint_anon_migrated_slug(n)` — separate from `slug_with_retry`; emits `f"anon-migrated-{n:05d}"` against an unindexed counter |
| **G3**: dangling-contour-hash post-condition not specified | scope-item 8 says "post-condition straggler check" — only checks null owners + valid visibility + slug uniqueness | **W3.18**: extend the post-condition to assert `db.visualizations.aggregate([{$lookup: contours on contour_hash}])` finds zero unresolved FKs; abort the migration with the unresolved slugs listed |
| **G4**: `migrated_from` marker for idempotency not named | scope-item 8 cites "idempotent" but no marker field | **W3.19**: stamp `migrated_from: {coll, _id}` on every migrated visualization; the script's first action is `find({migrated_from: {$exists: false}})` |
| **G5**: `epicycle_animation` denormalisation canonicalisation not named | scope-item 8 silent on parent-vs-child source-of-truth | **W3.20**: canonicalise on the snapshot's `animation_settings` (the parent); the `active_bases` / `n_harmonics` denormalisation on gallery is reset from the parent during transformation |
| **G6**: image-blob fork disposition not recorded in W3 | scope-item 7 retires `storage_budget_gb` but does not name the FK survival | **W3.21**: state explicitly that the migration treats `image_slug` as a stable FK; image blobs are not migrated; future fourier-C may relocate them under the unchanged FK |
| **G7**: IndexedDB `WorkspaceDraft` lift not named in W3 (it's W4) | scope-item 1-15 silent | **W3.22 (cross-reference)**: name the deferral — IndexedDB drafts are not server-migrated; the `WorkspaceDraft → visualization(draft)` lift is W4 work, not W3 |
| **G8**: integration + transform pytest specs not enumerated | scope-item 10 names CRUD/ownership/soft-delete/janitor specs — no transform/integration specs | **W3.23**: add `test_migrate_transform.py` (unit) and `test_migrate_integration.py` (seeded-DB end-to-end) — closes §5 of this audit |
| **G9**: `--reload` interference with migration not mitigated | not mentioned | **W3.24**: document in the migration script docstring that the script must run against a non-`--reload` backend, OR be invoked as a standalone `python -m` not embedded in the uvicorn lifecycle |

---

## Final report

- **Pre-migration entities catalogued**: 9 (7 server collections + IndexedDB drafts + the embedded epicycle payload).
- **Transformations specified**: 9 (one per pre-migration entity; per §3).
- **Risks surfaced**: 10 (per §4).
- **W3 scope-item gaps**: 9 (W3.16 through W3.24; per §7).
- **Image-blob fork**: Option B (defer; FK-stable migration) recommended.
- **Deliverable**: `docs/audits/runs/2026-05-26-B-audit-wave-2/C5-migration-story.md`.
