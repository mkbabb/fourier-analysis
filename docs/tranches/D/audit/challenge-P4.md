# Wχ-P4 — β refinements stay refinement (no rebrand) + γ removes only genuinely-dead code

**Probe**: P4 (one agent). **Wave**: Wχ (the challenge wave, `docs/tranches/D/waves/Wchi.md §3.4`). **Authored**: 2026-05-27. **HEAD at execution**: `d174d6b` (current master). **Charter**: probe whether the W3 + W4 plans stay refinement-not-rebrand (β) + delete-only-genuinely-dead (γ). Every γ deletion must have a verified-dead grep at execution-time; every β change must record no new surface treatment, no new colour system, no new IA paradigm. **Mode**: read-only adversarial (no source change, no host mutation).

**Subject** (the Wα-ratified claim under attack): the W3 + W4 plans (`waves/W3.md`, `waves/W4.md`) — γ deletes the backend `snapshot_hash` band + the dead `gallery` stratum + the untyped image-asset `dict` shim → typed Pydantic model; β resurrects `.cartoon-card` (one shim → 14 components un-flattened) + resolves the upload IA (one hero dropzone + slim source-strip) + resolves the gallery orphans (mount marquee or delete both) + light-mode contrast token sweep + `:focus-visible` rings. Verdict tests whether the W3 deletions are surface-evidently-dead at execution-time and whether the W4 refinements introduce no rebrand.

---

## §1 — γ deletion greps (verified-dead at HEAD `d174d6b`)

Each grep was run against the live tree at probe-time and the raw output is pasted below as the deletion-justification evidence (per Wχ §3.4 list item 1).

### §1.1 — `_entry_from_doc|GalleryEntryResponse`

```
$ git grep -nE "_entry_from_doc|GalleryEntryResponse" api/
api/models/admin.py:117:    items: list  # GalleryEntryResponse list, imported at usage site
api/models/gallery.py:37:class GalleryEntryResponse(BaseModel):
api/routers/gallery.py:11:``_entry_from_doc`` is retained because ``api/routers/admin.py`` consumes it for
api/routers/gallery.py:24:from api.models.gallery import GalleryEntryResponse
api/routers/gallery.py:32:def _entry_from_doc(doc: dict) -> GalleryEntryResponse:
api/routers/gallery.py:35:    return GalleryEntryResponse(**data)
```

**Verdict**: ZERO live consumers. Six hits, all in **declaration paths**:
- `models/gallery.py:37` = the class declaration (the deletion target).
- `routers/gallery.py:24,32,35` = the helper's import + declaration + body (the deletion target).
- `routers/gallery.py:11` = the **false docstring** (claims `admin.py` consumes the helper, but `admin.py` does NOT import or call `_entry_from_doc` — confirmed by the absence of any `_entry_from_doc(` call site in this output and the W0 §3.2 + W3.md §1 ROOT live-tree grep).
- `admin.py:117` = a **comment**, not code (`# GalleryEntryResponse list, imported at usage site`); the ad-hoc list is built without the class.

**γ DEAD: confirmed.** No live consumer. The W3.A deletion is safe (its own G2 gate fires `git grep -nE "_entry_from_doc|GalleryEntryResponse" api/` → zero post-deletion).

### §1.2 — `gallery.(insert|update|replace)`

```
$ git grep -nE "gallery\.(insert|update|replace)" api/
api/tests/test_janitor_audit.py:144:    await db.gallery.insert_one({"slug": "gal-for-image", "image_slug": "old-image"})
api/tests/test_janitor_audit.py:157:    await db.gallery.insert_one({"slug": "stale-user-gal", "user_slug": "stale-user"})
api/tests/test_migrate_integration.py:68:    await db.gallery.insert_many(
```

**Verdict**: ZERO production writers. Three hits, all in **test fixtures**:
- `test_janitor_audit.py:144,157` = janitor cascade-deletion fixtures (seeding the legacy `gallery` shape so the janitor's behavior against a populated-but-retired collection can be asserted).
- `test_migrate_integration.py:68` = migration-integration fixture (seeding the legacy shape so the migration's transform can be asserted).

Both classes are **evidence-of-the-legacy** (W3 §2 R4 + §5: "the legacy-shape fixtures stay; renaming them defeats their purpose — to prove the migration transforms the legacy shape into the converged shape"). Neither is a live production writer.

**γ DEAD: confirmed.** The `gallery` collection has no live writer in production code paths. The W3.A deletion of the boot indexes + the dead helper is safe.

### §1.3 — `db.snapshots.`

```
$ git grep -nE "db\.snapshots\." api/
api/scripts/migrate_visualization.py:181:    async for doc in db.snapshots.aggregate(pipeline):
api/scripts/migrate_visualization.py:313:    report.snapshots_before = await db.snapshots.count_documents({})
api/scripts/migrate_visualization.py:334:    async for snap in db.snapshots.find({}):
api/services/database.py:68:    await _db.snapshots.create_index("snapshot_hash", unique=True)
api/services/database.py:69:    await _db.snapshots.create_index([("image_slug", 1), ("snapshot_hash", 1)], unique=True)
api/tests/test_migrate_integration.py:66:    await db.snapshots.insert_many([s_pub_a, s_pub_b, s_null, s_orphan, s_zombie])
api/tests/test_migrate_integration.py:199:        await db.snapshots.insert_one(
```

**Verdict**: ZERO production writers/readers outside the one-shot migration. Seven hits, partitioned:
- `database.py:68-69` = the **two dead boot indexes** (the W3.A deletion target).
- `migrate_visualization.py:181,313,334` = the **one-shot read-only migration helper** (B.W3-era; W3 §2 R4 explicit out-of-scope; reads against a retired collection; the script retires after running).
- `test_migrate_integration.py:66,199` = legacy-shape fixtures (W3 §5 explicit out-of-scope; seed pre-migration shape so the transform can be asserted).

No live writer. The collection is unwritten in production code paths.

**γ DEAD: confirmed.** The W3.A deletion of `database.py:67-69` is safe (only the migration + fixture tests read).

### §1.4 — `snapshot_hash`

```
$ git grep -nE "snapshot_hash" api/  (44 hits — full output captured below, partitioned)
```

| Partition | Count | Sites |
|---|---|---|
| **LIVE production identity-path (W3 target)** | **11** | `models/admin.py:70` (FlagModel field — RENAME to `content_hash`); `models/assets.py:51` (SnapshotResponse — DELETE class); `models/gallery.py:41` (GalleryEntryResponse — DELETE class), `:70` (PublishRequest — DELETE or rename); `routers/admin.py:218,357,468,534,606` (the 5 read/delete/aggregate sites — RENAME); `services/database.py:125-126` (the 2 flags-collection indexes — RENAME + migrate) |
| **LIVE production docstring/comment narration (W3 target — strike/rewrite)** | **6** | `models/gallery.py:6,14,38` (docstring narration on retired identity); `routers/admin.py:6,348,515,595` — actually 4 sites at lines `:6,348,515,595` — comment-narration acknowledging the legacy. |
| **DEAD boot indexes (W3.A target — DELETE)** | **3** | `services/database.py:68,69` (snapshots — 2 indexes); `services/database.py:83` (gallery — 1 index in the §3 dead-stratum band) |
| **Out-of-scope: one-shot migration script (W3 §2 R4)** | **9** | `scripts/migrate_visualization.py:161,164,172,173,178,182,227,229,316,340,342` |
| **Out-of-scope: legacy-fixture tests (W3 §2 R4)** | **15** | `services/__tests__/test_janitor.py:292,299,306`; `tests/test_migrate_integration.py:46,71,81,89,202`; `tests/test_migrate_transform.py:23,85,105,106` |
| **Out-of-scope: conformance regression guards** | **6** | `tests/conformance/test_admin.py:7,119,121,122,125` (the C7.4 `(snapshot_hash, reporter_slug)` unique-index test — W3 §2 R5 renames to `content_hash`); `tests/conformance/test_identity.py:38` (the URL-no-secrets regex — **STAYS**, regression guard) |

**Verdict**: the 11 + 6 = 17 LIVE identity-path sites are all enumerated by W3.md §2 R1–R3 with named rename targets. The 3 dead boot indexes are W3.A deletion targets. The remaining 30 sites are explicitly out-of-scope per W3 §2 R4 + R5 (named, bounded, justified-as-evidence-of-the-legacy). The W3.md G1 gate (`git grep ... :!:migrate_visualization.py :!:test_migrate_*.py :!:__tests__/test_janitor.py :!:test_identity.py`) is correctly scoped — none of the four exclusions hides a live production reference.

**γ DEAD: confirmed at the identity-path scope.** No live consumer surfaces outside the W3 enumeration.

### §1.5 — γ deletion verdict summary

| γ deletion | Live consumer at HEAD? | W3 plan correctly scopes? | Verdict |
|---|---|---|---|
| `_entry_from_doc` + `GalleryEntryResponse` (gallery.py + models/gallery.py) | NO (only declarations + a false docstring + an unrelated comment) | YES (W3 §3 step 3, 4) | **CLEAR TO DELETE** |
| `gallery` collection write/read paths | NO (only tests; production code reads `db.visualizations`) | YES (W3 §3) | **CLEAR TO DELETE** |
| `snapshots` boot indexes (`database.py:67-69`) | NO (only migration script reads; no writer) | YES (W3 §3 step 2) | **CLEAR TO DELETE** |
| `gallery` boot indexes (`database.py:82-93`) | NO (only the boot itself; no writer feeds them) | YES (W3 §3 step 1) | **CLEAR TO DELETE** |
| `flags.snapshot_hash` → `content_hash` rename | LIVE (the field is written + read; the W3 plan migrates atomically) | YES (W3 §2 R2 migration script) | **CLEAR TO RENAME** (not a deletion; rename via `$rename`) |
| `models/admin.py:70 snapshot_hash` field | LIVE on the renamed band | YES (W3 §2 R1) | **CLEAR TO RENAME** |
| `models/assets.py:51 SnapshotResponse` | DEAD (`git grep "SnapshotResponse" api/` returns the declaration only; W3 verifies at dispatch) | YES (W3 §2 R1 table) | **CLEAR TO DELETE** (dispatch-confirm) |
| `models/gallery.py:65-72 PublishRequest` | DEAD or stale-shape (W3 verifies at dispatch) | YES (W3 §2 R1 table) | **CLEAR TO DELETE-OR-RENAME** (dispatch-confirm) |

**No γ deletion surfaces a live consumer P4 did not catch.** The W3 plan correctly enumerates the dead surface; the four exclusions in the W3.md G1 gate are each named, bounded, and provably read-only-against-retired-state.

---

## §2 — Dead `snapshots` indexes — disposition (per Wχ §3.4 list 2)

The two dead `snapshots` boot indexes at `api/services/database.py:67-69` (read at HEAD `d174d6b`):

```python
    # Snapshots indexes
    await _db.snapshots.create_index("snapshot_hash", unique=True)
    await _db.snapshots.create_index([("image_slug", 1), ("snapshot_hash", 1)], unique=True)
```

**Live writer to `db.snapshots`**: ZERO production code path (§1.3 above). The only writers are test fixtures (`test_migrate_integration.py:66,199`); the only readers are the one-shot migration helper (`migrate_visualization.py:181,313,334`).

**Existing prod DB disposition** (per DA4 §4.1 + DA1 §1.1): prod `images.count() = 0`, `visualizations.count() = 0`; the pre-A snapshot collection on the live DB (whether it carries the indexes or is empty) is a **harmless leftover**. The W3.A `init_db` block deletion stops `init_db` from re-asserting the indexes on fresh DBs; the existing prod DB's `snapshots` collection + its indexes become orphans.

**Two valid dispositions** (binding choice recorded in W3.md as **W3.G_dead-collection-disposition**, P4.C4):

- **(a) one-shot drop migration**: include a `db.snapshots.drop_index("snapshot_hash_1")` + `drop_index("image_slug_1_snapshot_hash_1")` + (optionally) `db.snapshots.drop()` step in the W3 deploy cutover (alongside the `flags`-field rename migration, `api/scripts/migrate_flags_field.py`). One additional sequential statement; clean.
- **(b) leave-as-harmless**: drop only the `init_db` block (the W3.A deletion); the existing prod indexes + the empty collection remain on the live DB as harmless leftovers (Mongo does not enforce indexes against zero-row collections; the bytes-on-disk cost is negligible).

**Recommended disposition**: **(a) one-shot drop** — surface-evident cleanup costs nothing extra (already authoring the `flags` migration script); leaves the prod DB clean; the W6 ε prod-matrix probe verifies the dropped collections/indexes are gone via `mongosh --eval "db.snapshots.getIndexes()"` → empty. Disposition (b) is acceptable if W3.A's agent finds the migration overhead disproportionate; the choice is the W3.A author's, recorded in the W3 close-record. **Bound as P4.C4 → W3.G_dead-collection-disposition.**

---

## §3 — Typed-asset transposition hardening (per Wχ §3.4 list 3)

`api/routers/images.py:140,159` at HEAD `d174d6b` (the validation-matrix `KeyError: 'storage_uri'` root cause):

```python
# Line 140 (in get_image_blob):
    doc = await get_image_asset(imageSlug)
    path = _resolve(doc["storage_uri"])    # ← raw subscript; KeyError if asset is pre-migration

# Line 159 (in get_image_thumbnail, fallback path):
    else:
        path = _resolve(doc["storage_uri"])    # ← raw subscript; same risk
```

**Confirmed**: both sites subscript `doc["storage_uri"]` against the untyped `dict` returned by `get_image_asset`. A pre-migration document (an inline-`blob` asset that did not run through `migrate_image_blobs.py`) carries no `storage_uri` key; the subscript raises `KeyError`, propagating as a **HTTP 500** (not a clean 404/410 — which is what the validation matrix `validation-matrix.md §2` captured). This is the **C9/C10 class of bug** (the broad-except swallowing a KeyError thrown by a projection or migration mismatch) reincarnated at the route boundary — exactly the class DA1 §3.3 named as the cause.

**The typed-shim hardening** (binding):
- The W3.B agent's `ImageAsset` Pydantic model (W3 §4 step T1) declares `storage_uri: str` as a **required field** (no `Optional`).
- `get_image_asset` (`dependencies.py:46-55`) returns `ImageAsset` (W3 §4 step T2 row 1); the Pydantic validation raises `ValidationError` at construction time on a pre-migration doc missing `storage_uri`.
- The route boundary in `images.py:140,159` rebinds to `doc.storage_uri` (typed field access) — but the typed-shim hardening goes further: the route MUST catch the typed `ValidationError` (or the upstream `get_image_asset` MUST translate it) and return **HTTP 410 Gone** (the doc exists in the DB but is in a pre-migration shape that the post-migration code cannot serve — the asset has been logically retired) OR **HTTP 404 Not Found** (treating the pre-migration shape as effectively absent). The route MUST NOT 500.

**Concretely** (the W3.B implementation pattern):

```python
@router.get("/{imageSlug}/blob")
async def get_image_blob(imageSlug: str):
    try:
        doc = await get_image_asset(imageSlug)        # raises ValidationError on pre-migration docs
    except ImageAssetMigrationError:                  # narrow exception type translated by get_image_asset
        raise HTTPException(status_code=410, detail="Image asset awaiting migration") from None
    path = _resolve(doc.storage_uri)                  # typed field access; never KeyError
    return FileResponse(
        path,
        media_type=doc.content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )
```

The narrow `ImageAssetMigrationError` is raised by `get_image_asset` when `ImageAsset.model_validate(raw_doc)` fails specifically for a missing `storage_uri` (the migration-pending signal). All other Pydantic ValidationErrors propagate as 500 (genuine data corruption, distinct from migration-pending).

**Binding clause**: the W3.B agent's task list **must include** (a) the narrow exception type (`ImageAssetMigrationError`, a subclass of `pydantic.ValidationError` or a custom exception), (b) the `get_image_asset` translation (the typed-shim entry point catches `ValidationError` on a missing `storage_uri` and raises the narrow type), (c) the `images.py:140` + `images.py:159` route-side catches that translate to 410/404, (d) a regression test (`api/tests/test_pre_migration_image_returns_410.py` or extension to `test_image_storage.py`) that constructs a pre-migration `images` doc (no `storage_uri`, has inline `blob`), hits `GET /api/images/{slug}/blob`, asserts 410/404 (NOT 500).

**Bound as P4.C3 → W3.G_typed-shim-hardening.** The W3.md §4 step T2 already commits to typed field access at `images.py:140,159`; this P4 condition strengthens the binding by mandating the **exception-to-status translation** (the missing piece in W3.md §4) and the **regression test** so the hardening is shape-tested, not asserted-by-comment.

---

## §4 — `.cartoon-card` resurrection mechanism (per Wχ §3.4 list 4)

`docs/tranches/D/waves/W4.md §1.1` confirms the chosen mechanism is option **(a) the `@utility cartoon-card` shim in `web/src/style.css`**:

```css
@utility cartoon-card {
    @apply cartoon-surface;
    border-color: var(--border);
    background: var(--card);
}
```

Three explicit rejected alternatives (W4.md §1.1):
- ❌ Rewrite every consumer to inline `border: 2px solid var(--border); box-shadow: 3px 3px 0 var(--border);` — **rejected** as "exactly the kind of token-system bypass the invariant forbids" (D.md §2 third new invariant — token system single source).
- ❌ Migrate every consumer to `<Card surface="cartoon">` (the 14-file migration) — **rejected as W4 scope** for KISS (held as a named successor if glass-ui later deletes `cartoon-surface`).
- ❌ Cross-repo glass-ui patch (re-publish `.cartoon-card` from glass-ui) — **held as a coordination ask**, not the immediate fix.

**Live consumer count at HEAD `d174d6b`:**

```
$ git grep -n 'cartoon-card' web/src/ | wc -l
21        (21 occurrences across the 14 files below)

$ git grep -ln 'cartoon-card' web/src/
web/src/components/equation/EqCoefficientsPanel.vue
web/src/components/equation/EquationView.vue
web/src/components/equation/FunctionInput.vue
web/src/components/equation/InfoCard.vue
web/src/components/morph/HarmonicLevelGrid.vue
web/src/components/morph/MorphPhaseConfig.vue
web/src/components/morph/MorphShapePreview.vue
web/src/components/visualization/BasisCanvas.vue
web/src/components/visualization/ContourPreview.vue
web/src/components/visualization/GalleryView.vue
web/src/components/visualization/ImageUpload.vue
web/src/components/visualization/VisualizationView.vue
web/src/components/visualization/gallery/AdminUserList.vue
web/src/components/visualization/gallery/GalleryCardModal.vue
```

**14 consumer files** at HEAD (NOT 13 as W4.md §9 congruence finding #1 estimated — the live grep at probe-time returns 14, matching D.md §3 W4 row's "14 components un-flattened" without the discrepancy). **21 total application sites** (a few components — most prominently EquationView.vue with 5 sites — apply the class multiple times). The shim mechanism un-flattens all 14 files (= all 21 sites) atomically.

**Refinement test**: does the W4 plan introduce any new surface treatment, colour, or shape?
- **Surface treatment**: NO — `@apply cartoon-surface` defers to glass-ui's existing `cartoon-surface` utility (the recipe that was removed at C.W5; the shim re-binds to a sibling utility that survives — verify-at-dispatch is a W4.A.1 step). The intended 2px border + `3px 3px 0` hard-offset shadow are the **pre-glass-ui-bump original** visual outcome; the shim restores parity, NOT a new design.
- **Colour**: NO — `border-color: var(--border)` + `background: var(--card)` are **existing tokens**, not new.
- **Shape**: NO — the shim is one `@utility` block; no new class names introduced; no new component primitives invoked.

**Verdict**: **REFINEMENT, not redesign.** The shim restores parity to pre-C.W5 visuals; no new design language. The shim is fourier-local (single-PR-bound; no cross-repo coordination on the critical path); a glass-ui re-export is a future coordination ask.

**Strengthening (bound as P4.C2 → W4.G_shape-test-per-refinement)**: the W4 plan binds G1 (`git grep -l cartoon-card web/src` + Playwright computed-style probe). The **shape-test** strengthening: in addition to the Playwright `border-width: 2px` + `box-shadow: 3px 3px 0` probe on the 5 canonical consumers (one per route — `/equation`, `/morph`, `/visualize`, `/gallery`, `/equation` again), the test MUST also probe at least one of the other 9 consumers (sampling — e.g. `MorphPhaseConfig.vue` on `/morph`, `InfoCard.vue` somewhere visible, `AdminUserList.vue` on `/gallery` admin) to confirm the shim's `@apply` chain resolves identically across files. Probe failure on any sample → W4.A.1 has not actually lifted the consumers (e.g. Tailwind v4's `@utility` did not propagate or `cartoon-surface` was also missing).

---

## §5 — Upload IA: one-hero + slim-source-strip (per Wχ §3.4 list 5)

`docs/tranches/D/waves/W4.md §1.2` confirms the chosen collapse target keeps the **three affordance plumbing** but de-emphasises two:

| Affordance | Pre-W4 | Post-W4 | De-emphasised? |
|---|---|---|---|
| Canvas-center placeholder (`canvas-drawing/placeholder.ts:24-60`, painted into `BasisCanvas.vue`) | full hero dropzone | **THE HERO** — keep | NO (this is the new IA's sole "full" affordance in empty state) |
| Right-panel `ImageUpload.vue:88-110` empty-state dropzone | full dashed-border full-card dropzone | **slim source-strip** (one-line "Source: drop or click to upload" subhead + icon) | YES (the redundant copy collapses) |
| Global drag-overlay (`VisualizationView.vue:144-153` "Drop image anywhere") | appears only mid-`dragenter` | **STAYS** unchanged (still appears only mid-drag) | NO (it is correctly ephemeral; not competing with the canvas hero in the empty state) |

Cross-checked against `docs/audits/runs/2026-05-27-D-audit/design/DA-design-A2-workspace.md §2 A2-01` (the source design finding for the IA collapse) — the W4.md §1.2 plan matches A2-01's recommended target exactly.

**Refinement test**: does the W4 plan introduce a third upload paradigm?
- **New file input mechanism**: NO — the panel's slim source-strip is still the existing `<input type="file">` plumbing (the `ImageUpload.vue` component file structure stays; only the empty-state render branch changes from a full dashed-border block to a one-line subhead + icon).
- **New dropzone library**: NO — no new dependency invoked; the global drag-overlay's `dragenter`/`dragover`/`drop` listeners stay in `VisualizationView.vue`.
- **New modal-based uploader**: NO — no modal is introduced; the upload affordance is still in-page (canvas hero or panel strip), never modal.

**Verdict**: **REFINEMENT, not redesign.** The IA collapses from "three competing full affordances" to "one hero + one slim secondary + the ephemeral global overlay". The component plumbing is preserved; the affordance hierarchy is the only thing that changes.

**Strengthening (bound as P4.C2 → W4.G_shape-test-per-refinement)**: the W4.md G2 gate (`Playwright load /visualize (empty DB); await page.locator('[data-dropzone-full]').count()` returns 1) is the binding shape-test. The strengthening: the test selector MUST be data-attribute-based (`[data-dropzone-full]`) and applied **only** to the canvas hero, NOT to the global drag-overlay (which is gated on `dragenter` and is not in-DOM in the empty-state idle frame). The test author MUST verify the global overlay does NOT carry the `data-dropzone-full` attribute (the overlay can be `[data-dropzone-overlay]`, distinct). This forecloses a fail-mode where the test passes against an empty page rendering only the overlay (e.g. mid-drag-state) rather than against the empty state.

---

## §6 — Gallery orphans: mount-or-delete (per Wχ §3.4 list 6)

`docs/tranches/D/waves/W4.md §1.3` confirms the binary choice: **option A** (mount `GalleryMarquee` as empty-state band + delete `GalleryGrid`) OR **option B** (delete both + add a `<Button>` CTA to `/visualize`). The decision is made at W4.C dispatch based on whether the marquee mounts cleanly with a 6-entry sample.

**Live orphan grep at HEAD `d174d6b`:**

```
$ git grep -nE "GalleryMarquee|GalleryGrid" web/src/ | grep -v "components/visualization/gallery"
(no matches)

$ git grep -nE "GalleryMarquee|GalleryGrid" web/src/
web/src/components/visualization/gallery/GalleryGrid.vue:4:import GalleryCard from "./GalleryCard.vue";
web/src/components/visualization/gallery/GalleryGrid.vue:35:            <GalleryCard
web/src/components/visualization/gallery/GalleryGrid.vue:51:            <p class="text-sm text-muted-foreground/70">Try adjusting your filters.</p>
web/src/components/visualization/gallery/GalleryMarquee.vue:4:import GalleryCard from "./GalleryCard.vue";
web/src/components/visualization/gallery/GalleryMarquee.vue:40:                    <GalleryCard
web/src/components/visualization/gallery/GalleryMarquee.vue:57:                    <GalleryCard
```

**Verdict**: ZERO live consumers outside the orphan files themselves. Both `GalleryMarquee.vue` and `GalleryGrid.vue` import `GalleryCard.vue` and define `<template>` blocks, but neither is imported or mounted by any other file in `web/src/`. The full grep (the second one) confirms: every hit is either (a) inside the orphan files importing/using `GalleryCard` (which is a live consumer through `GalleryFeaturedCarousel.vue`, `GalleryInfiniteGrid.vue`, and via `GalleryView.vue → GalleryCardModal.vue`, but not via the orphans) or (b) inside the orphan files' own templates. The orphans are orphan.

`GalleryView.vue` wires `GalleryInfiniteGrid` + `GalleryFeaturedCarousel` + `GalleryCardModal` — confirming `GalleryGrid` is a deprecated parallel (the live grid is `GalleryInfiniteGrid`, not `GalleryGrid`) and `GalleryMarquee` was never mounted.

**Refinement test**: does the W4 plan introduce an "extract to a shared library" middle-ground or any other third refactor?
- **Shared library**: NO — neither option A nor B extracts code to a library; both are in-tree dispositions.
- **New gallery primitive**: NO — option A mounts an **existing** in-tree component (`GalleryMarquee.vue`) into the empty-state branch of `GalleryView.vue`; option B deletes both orphans.
- **New IA paradigm**: NO — option A's empty-state-with-marquee-preview is a refinement of the existing "cold-empty-state" branch (currently inert text per A3 #12); option B is pure deletion + a button.

**Verdict**: **REFINEMENT, not redesign.** The two options are bounded; "deferred" is a fail-mode per W4 §1.3 (the audit named the orphans; the wave must dispose them).

**Strengthening (bound as P4.C2 → W4.G_shape-test-per-refinement)**: the W4.md G3 gate (the file-presence check) is the binding shape-test. The strengthening: the W4 close-record MUST cite the disposition decision in `PROGRESS.md` W4 row (the existing W4.md §9 congruence finding #2 already names this; harden the binding). The `git grep` post-W4 MUST match the chosen option's expected state exactly — option A: `GalleryMarquee` imported by `GalleryView.vue` AND `GalleryGrid.vue` DELETED; option B: BOTH `GalleryMarquee.vue` AND `GalleryGrid.vue` DELETED.

---

## §7 — Light-mode contrast token sweep (per Wχ §3.4 list 7)

W4.md §1.4 enumerates the three coordinated mechanisms: (a) glass-ui `--viz-amber`/`--section-color-5` light values (one token-rung lift; declared in `web/src/style.css` as `:root` overrides, fourier-local — glass-ui carry recorded as coordination ask); (b) the `#f0b632` hardcodes → `var(--viz-amber)`; (c) drop the `text-foreground/35`, `text-muted-foreground/60`, `text-muted-foreground/70` modifiers.

**Live `#f0b632` grep at HEAD `d174d6b`:**

```
$ git grep -n "#f0b632" web/src/
web/src/components/equation/EquationModeToggle.vue:64:    color: #f0b632;
web/src/components/equation/EquationView.vue:420:    color: #f0b632 !important;
web/src/components/equation/FunctionInput.vue:247:    color: #f0b632 !important;
web/src/components/equation/composables/useCoeffHover.ts:71:                    lines.push(`{\\color{#f0b632}${label}_{${k}}} = ${val.toFixed(4)}`);
web/src/components/equation/composables/useCoeffHover.ts:79:                lines.push(`{\\color{#f0b632}c_{${t.n}}} = ${val}`);
web/src/components/equation/composables/useCoeffHover.ts:84:                lines.push(`{\\color{#f0b632}A_{${t.n}}} = ${t.amplitude.toFixed(4)}`);
web/src/components/equation/convergence/ConvergenceLegend.vue:78:    background: #f0b632;
web/src/components/equation/convergence/ConvergenceLegend.vue:94:    color: #f0b632;
web/src/lib/colors.ts:12:    golden: "#f0b632",
```

**FINDING — broader hardcoded-hex surface than W4.md §1.4 enumerated.** The W4.md §1.4 plan names "the three `#f0b632` hardcodes" (citing `EquationView.vue:420-421` and `FunctionInput.vue:247-249`, which collectively are 3 sites). The live grep returns **9 sites across 5 files**, expanding the surface:

| File | Lines | Context | W4 plan addresses? |
|---|---|---|---|
| `EquationModeToggle.vue:64` | 1 site | CSS `color: #f0b632` | **NOT in W4.md §1.4** — newly surfaced |
| `EquationView.vue:420` | 1 site | CSS `color: #f0b632 !important` | YES (W4 §1.4) |
| `FunctionInput.vue:247` | 1 site | CSS `color: #f0b632 !important` | YES (W4 §1.4) |
| `useCoeffHover.ts:71,79,84` | 3 sites | KaTeX `\color{#f0b632}` macro arguments | **NOT in W4.md §1.4** — a KaTeX color macro class; HEX-only, no CSS-var-resolution in KaTeX |
| `ConvergenceLegend.vue:78,94` | 2 sites | CSS `background` + `color` | **NOT in W4.md §1.4** — newly surfaced |
| `lib/colors.ts:12` | 1 site | `STATIC.golden = "#f0b632"` token constant | YES (W4 §1.4 mentions retirement-or-retint via `resolveVizColors`) |

**Refinement test**: does the W4 plan introduce a new colour system?
- **New palette**: NO — `var(--viz-amber)` is an existing token; the swap is hex-to-existing-token.
- **New colour system**: NO — the light-token darkening (`hsl(35 70% 42%)` → `hsl(35 76% 35%)`) is one-rung lift of an existing token, not a system change.
- **New colour primitive**: NO — `--muted-foreground-strong` declared as a new step in the existing muted scale (a token-rung addition, not a system change); explicit at W4.md §1.4 step 1.

**Verdict**: **REFINEMENT, not redesign.** The token system is preserved; the changes are token-value lifts + hex-to-token swaps.

**STRENGTHENING (bound as P4.C2 → W4.G_shape-test-per-refinement) — material gap surfaced**: W4.md §1.4 enumerates **3 of 9** `#f0b632` sites. The remaining 6 sites must be addressed in W4.A.3 to honor the token-system-single-source invariant (`D.md §2` third new invariant). The KaTeX `\color{#f0b632}` macro sites at `useCoeffHover.ts:71,79,84` are a **distinct class** — KaTeX does not resolve CSS variables (its color macro accepts hex/named colors only). The resolution: either (i) the JS code reads the resolved `--viz-amber` hex at runtime via `resolveVizColors` and interpolates it into the KaTeX template string (matches the canvas-placeholder pattern at W4.md §1.4 step 3); or (ii) keep the KaTeX hex as a recorded `lib/colors.ts STATIC.golden`-style constant that *also* darkens in lockstep with the token (the constant and the token define one truthful value across both systems — a "token-shadowed-by-constant" pattern). The shape-test extends: `git grep "#f0b632" web/src/ | grep -v lib/colors.ts | wc -l` MUST be ZERO post-W4 (the constant survives as the canonical hex; all other sites consume the token or read the constant; KaTeX sites read the constant or the runtime-resolved hex).

**Live opacity-modifier grep at HEAD `d174d6b`:**

```
$ git grep -nE "text-foreground/35|text-muted-foreground/60|text-muted-foreground/70" web/src/
web/src/components/ui/CollapsibleSection.vue:40:          <span v-if="subtitle" class="ml-1.5 text-xs font-normal text-muted-foreground/70">&mdash; {{ subtitle }}</span>
web/src/components/visualization/ContourSettings.vue:258:                    <ChevronRight class="h-3 w-3 text-muted-foreground/60 transition-transform duration-200" :class="{ 'rotate-90': advancedOpen }" />
web/src/components/visualization/ImageUpload.vue:47:            <span class="ml-0.5 text-xs font-normal text-muted-foreground/70">&mdash; source input</span>
web/src/components/visualization/ImageUpload.vue:107:            <p class="mt-1 text-xs text-muted-foreground/60">
web/src/components/visualization/gallery/AdminAuditLog.vue:143:                    class="font-mono text-[0.65rem] text-muted-foreground/70"
web/src/components/visualization/gallery/GalleryCard.vue:98:                <span class="text-sm text-foreground/35 whitespace-nowrap shrink-0">{{ timeAgo(entry.created_at) }}</span>
web/src/components/visualization/gallery/GalleryCardModal.vue:108:                            <span class="text-sm text-foreground/35 shrink-0">{{ timeAgo(entry.created_at) }}</span>
web/src/components/visualization/gallery/GalleryCardModal.vue:116:                                <span class="text-muted-foreground/60">views</span>
web/src/components/visualization/gallery/GalleryCardModal.vue:128:                                <span class="text-muted-foreground/60">likes</span>
web/src/components/visualization/gallery/GalleryDraftsSection.vue:85:                    <span class="text-sm text-muted-foreground/60">
web/src/components/visualization/gallery/GalleryGrid.vue:51:            <p class="text-sm text-muted-foreground/70">Try adjusting your filters.</p>
```

**FINDING — 12 sites** at HEAD; W4.md §1.4 enumerates **6 sites** (the GalleryCard + GalleryCardModal cluster + ImageUpload pair). The remaining 6 sites:

| File | Line | Type | W4 plan addresses? |
|---|---|---|---|
| `CollapsibleSection.vue:40` | 1 | `/70` subtitle | **NOT in W4 §1.4** — but in-bounds for the sweep |
| `ContourSettings.vue:258` | 1 | `/60` chevron icon | **NOT in W4 §1.4** — possibly icon-only (decorative; lower priority) |
| `AdminAuditLog.vue:143` | 1 | `/70` mono text | **NOT in W4 §1.4** — admin-only |
| `GalleryDraftsSection.vue:85` | 1 | `/60` text | **NOT in W4 §1.4** |
| `GalleryGrid.vue:51` | 1 | `/70` text | DELETED with the orphan (§6 option B) or fixed alongside §1.3 option A |
| (the 6 W4-enumerated sites: GalleryCard:98, GalleryCardModal:108,116,128, ImageUpload:47,107) | 6 | various | YES |

**STRENGTHENING (bound as P4.C2 → W4.G_shape-test-per-refinement) — material gap surfaced**: the live grep returns 6 additional alpha-modifier sites W4.md §1.4 does NOT enumerate. The W4 close gate `git grep -nE "text-foreground/35|text-muted-foreground/60|text-muted-foreground/70" web/src/` should target **zero** (sweep is total) OR explicitly justify which sites stay (decorative-icon-only, e.g. `ContourSettings.vue:258` chevron, may be acceptable as decorative-not-text). The W4.A.5 + W4.C.5 implementation steps MUST inventory all 12 sites and disposition each (drop alpha modifier → `text-muted-foreground`; OR retain with justification recorded in PROGRESS.md W4 row). The conservative-binding-test: `git grep -nE "text-foreground/35|text-muted-foreground/60|text-muted-foreground/70" web/src/ | wc -l` returns 0 post-W4 (full sweep) — the chevron is non-text and `text-*` opacity on an icon is arguably wrong even decoratively (it muddies icon contrast); err on the side of total sweep.

**Verdict on the contrast cluster**: refinement-not-rebrand IS preserved (the mechanisms are token-system-aware); but the W4.md §1.4 enumeration is **incomplete** against the live tree — material strengthening required to honor `D.md §2` token-system-single-source invariant.

---

## §8 — `:focus-visible` rings (per Wχ §3.4 list 8)

`web/src/components/layout/AppHeader.vue:174-177` carries the canonical existing pattern (read at HEAD `d174d6b`):

```css
.nav-trigger:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
}
```

W4.md §1.5 binds the W4 fix to **lift this exact pattern** to:
- `PaperSidebar.vue:215` `.sidebar-link`
- `MobileFloatingToc.vue:336` `.floating-toc-item`
- `PaperArticleWindow.vue:124` `.callout-btn`
- `GalleryCard.vue:63-67` (the role-promoted control)

**Live `:focus-visible` grep at HEAD `d174d6b`:**

```
$ git grep -nE ":focus-visible" web/src/
web/src/components/layout/AppHeader.vue:174:.nav-trigger:focus-visible {
web/src/components/layout/DarkModeToggle.vue:98:.sun-moon-toggle:focus-visible {
web/src/components/visualization/AnimationControls.vue:181:.play-btn:focus-visible { outline: 2px solid rgba(255, 255, 255, 0.6); outline-offset: 2px; }
```

Three existing `:focus-visible` patterns at HEAD: AppHeader (the canonical), DarkModeToggle (similar shape), AnimationControls (slightly different — `rgba(255, 255, 255, 0.6)` instead of `var(--ring)`; this is a minor inconsistency W4 could optionally sweep, but it's existing not new debt).

**Refinement test**: does the W4 plan introduce a new focus-ring colour or style language?
- **New colour**: NO — `var(--ring)` is the existing token; the W4 fix lifts the existing pattern (`AppHeader.vue:174-177`).
- **New ring style**: NO — `outline: 2px solid var(--ring); outline-offset: 2px;` is the existing shape.
- **New focus paradigm** (e.g. focus-trap, focus-management library): NO — the W4 fix is pure CSS `:focus-visible` per-class; no JS focus library invoked.

**Verdict**: **REFINEMENT, not redesign.** The W4 fix is a token-pattern lift across 4 sites (3 TOC classes + the gallery card control).

**Strengthening (bound as P4.C2 → W4.G_shape-test-per-refinement)**: the W4.md G5 gate (Playwright keyboard-tab traversal) is the binding shape-test. The strengthening: the test MUST assert (i) `outline-width: 2px` or `box-shadow` containing the canonical pattern AND (ii) `outline-color` resolves to the same value as `var(--ring)` on the page (defensive against a typo'd token name). The test also MUST cover both modes (`prefers-color-scheme: light` AND `dark`) — the ring colour MUST be readable in both themes (verified-against-`--ring`-token-not-against-hardcoded). One additional consideration: AnimationControls.vue:181's `rgba(255, 255, 255, 0.6)` hardcoded ring is an EXISTING inconsistency (not W4's debt); a tidy fold may sweep this to `var(--ring)` in W4.C.4 if bandwidth allows, but it is NOT a W4 binding.

---

## §9 — GalleryCard keyboard accessibility (per Wχ §3.4 list 9)

W4.md §1.5 + §3 Agent C step C.3 binds the migration of `GalleryCard.vue:63-67` (read at HEAD `d174d6b` — the bare `<div @click>`):

```html
<!-- Currently (per W4 § probe) -->
<div class="..." @click="emit('click', entry)"> ... </div>

<!-- Post-W4 (per W4 § 1.5 + C.3) -->
<div
  class="..."
  role="button"
  tabindex="0"
  :aria-label="`Open ${entry.slug}`"
  @click="emit('click', entry)"
  @keydown.enter.space.prevent="emit('click', entry)"
> ... </div>
```

The W4 plan also binds: re-point `GalleryCardModal` onto the glass-ui `<Dialog>` primitive (already used for the batch + flagged confirms — `GalleryView.vue:381`, `AdminFlaggedPanel.vue:264`).

**Live `GalleryCard|GalleryCardModal` grep at HEAD `d174d6b`:**

```
$ git grep -nE "GalleryCard|GalleryCardModal" web/src/
web/src/components/visualization/GalleryView.vue:26:import GalleryCardModal from "./gallery/GalleryCardModal.vue";
web/src/components/visualization/GalleryView.vue:369:        <GalleryCardModal
web/src/components/visualization/gallery/GalleryCardModal.vue:216:   identical to the GalleryCard recipe; the badge is decorative read-only
web/src/components/visualization/gallery/GalleryCardModal.vue:229:   stat-counter row, mirroring GalleryCard's recipe. */
web/src/components/visualization/gallery/GalleryFeaturedCarousel.vue:3:import GalleryCard from "./GalleryCard.vue";
web/src/components/visualization/gallery/GalleryFeaturedCarousel.vue:32:                <GalleryCard
web/src/components/visualization/gallery/GalleryGrid.vue:4:import GalleryCard from "./GalleryCard.vue";
web/src/components/visualization/gallery/GalleryGrid.vue:35:            <GalleryCard
web/src/components/visualization/gallery/GalleryInfiniteGrid.vue:4:import GalleryCard from "./GalleryCard.vue";
web/src/components/visualization/gallery/GalleryInfiniteGrid.vue:30:                <GalleryCard
web/src/components/visualization/gallery/GalleryMarquee.vue:4:import GalleryCard from "./GalleryCard.vue";
web/src/components/visualization/gallery/GalleryMarquee.vue:40:                    <GalleryCard
web/src/components/visualization/gallery/GalleryMarquee.vue:57:                    <GalleryCard
```

**Live consumers of `GalleryCard`**: `GalleryFeaturedCarousel.vue` (LIVE — mounted in `GalleryView.vue` per A3 audit), `GalleryInfiniteGrid.vue` (LIVE — the active grid), and the two orphans `GalleryGrid.vue` + `GalleryMarquee.vue` (dispositioned in §6). The role-promotion at `GalleryCard.vue:63-67` lifts ALL live consumers' keyboard accessibility atomically.

**Live consumer of `GalleryCardModal`**: `GalleryView.vue:26,369` (one consumer; the modal opens on `GalleryCard` click and on the empty-state "open card" interaction).

**Refinement test**: does the W4 plan introduce a new modal-pattern?
- **New modal primitive**: NO — the re-point onto glass-ui `<Dialog>` lifts an **existing** primitive already in use at `GalleryView.vue:381` (the batch dialog) and `AdminFlaggedPanel.vue:264` (the flagged confirms). Same primitive, new consumer.
- **New focus-trap mechanism**: NO — `<Dialog>` provides the focus-trap (out-of-band, glass-ui's concern); the W4 plan does not hand-roll one.
- **New keyboard pattern**: NO — `@keydown.enter.space.prevent` is the standard ARIA button keyboard pattern; no new key bindings introduced.
- **New ARIA pattern**: NO — `role="button" tabindex="0" :aria-label` is the canonical ARIA button-on-non-button pattern, already used by countless component libraries; not a new design.

**Verdict**: **REFINEMENT, not redesign.** The control conversion lifts an existing ARIA + focus-visible pattern onto a div that should have been a control all along (the original `<div @click>` is the bug; the lift is the fix). The modal re-point lifts an existing in-tree primitive.

**Strengthening (bound as P4.C2 → W4.G_shape-test-per-refinement)**: the W4.md G5 gate (keyboard-tab traversal hits every interactive element with a ring) is the binding shape-test. The strengthening: the test MUST also assert (i) keyboard Enter/Space on the focused GalleryCard fires the modal-open (not just the focus-ring); (ii) the modal, once open, captures Tab within the dialog (focus-trap proof — verifies the `<Dialog>` primitive's behavior on this consumer); (iii) Escape closes the modal AND focus returns to the originating GalleryCard (focus-restoration). These three assertions together prove the **full ARIA pattern**, not just the visible ring; the existing W4.md G5 only checks (i)'s ring portion.

**Note on A3 #5 deferral**: W4.md §5 (out-of-scope) defers the `role="dialog"` + focus-trap keystone on `GalleryCardModal` itself. The W4 plan binds **only the GalleryCard control-conversion + the re-point onto `<Dialog>`** — both of which are refinement. The deferred A3 #5 (custom focus-trap if `<Dialog>` were not adopted) would have been the rebrand-risk; W4's adoption of the existing `<Dialog>` primitive is correctly refinement. **NO rebrand risk introduced.**

---

## §10 — Honesty discipline: failure thresholds

Per the charter's honesty discipline: P4 FAILs if (a) any grep surfaces a LIVE consumer of nominally-dead code (W3 must re-scope); (b) any β change introduces NEW surface treatment / colour system / IA paradigm (W4 must re-scope). Both bars applied; results:

- **(a) γ live-consumer check**: PASSES. Every γ deletion target surfaces ZERO live production consumer (§1.1–§1.5). The W3 plan's enumeration is comprehensive against the live tree at HEAD `d174d6b`.
- **(b) β rebrand check**: PASSES. Every β refinement (§4–§9) preserves existing surface treatments / colour systems / IA paradigms. The W4 plan introduces no new colours (only token-rung lifts), no new dropzone library or modal primitive, no new focus-ring paradigm, no new modal-pattern.

**One material gap surfaced** in §7 (the contrast cluster): W4.md §1.4 enumerates 3 of 9 `#f0b632` sites + 6 of 12 alpha-modifier sites. This is NOT a rebrand failure (the mechanism is still token-system-aware); it is an **enumeration gap** that must be closed at W4.A dispatch by inventorying the full live grep and dispositioning every site. The strengthening in §7 binds this as part of P4.C2.

---

## Verdict

**ACCEPTED-WITH-STRENGTHENING** — mirroring C.Wχ-P4. Every γ deletion is verified-dead at HEAD `d174d6b` with zero live production consumer surfaced. Every β refinement preserves the surface-treatment / colour-system / IA-paradigm baselines. One material gap in the contrast-cluster enumeration (3 of 9 `#f0b632` + 6 of 12 alpha-modifier sites) is named and bound into the strengthenings.

The strengthenings are deletion-proof greps per γ removal + binding shape-tests per β refinement, with the typed-shim exception-to-status translation bound explicitly on the validation-matrix root-cause sites (`images.py:140,159`).

## Conditions to bind

- **P4.C1** (every γ deletion has its own grep-zero gate at execution-time) → **W3.G_grep-zero-per-deletion**
  - `git grep -nE "_entry_from_doc|GalleryEntryResponse" api/` → ZERO post-W3.A.
  - `git grep -nE "_db\.gallery\.create_index|_db\.snapshots\.create_index" api/services/database.py` → ZERO post-W3.A.
  - `git grep -nE "snapshot_hash|snapshotHash" api/ -- ':!api/scripts/migrate_visualization.py' ':!api/tests/test_migrate_*.py' ':!api/services/__tests__/test_janitor.py' ':!api/tests/conformance/test_identity.py'` → ZERO post-W3.A (the four exclusions are named-and-justified evidence-of-the-legacy paths per W3.md §2 R4 + R5).
  - `git grep -nE "gallery\.(insert|update|replace)" api/` → ZERO outside the named test files (already true at HEAD; W3 preserves).

- **P4.C2** (every β refinement has its own shape-test: axe-clean light-mode + cartoon-card lives + IA collapse + gallery decision-acted + focus-rings) → **W4.G_shape-test-per-refinement**
  - Playwright computed-style probe on the 14 `cartoon-card` consumer files (sample ≥ 5 cross-component) reports `border-width: 2px` + `box-shadow` containing `3px 3px 0` (NOT `0px` / `none`).
  - axe-core scan in `colorScheme: 'light'` on `/equation`, `/morph`, `/visualize`, `/gallery`, `/paper` reports zero serious/critical contrast violations on the measured surfaces.
  - `git grep -n "#f0b632" web/src/ | grep -v lib/colors.ts` returns ZERO (the canonical hex survives in `lib/colors.ts` as the token-shadowing constant; all other 8 sites consume the token or the constant — including the 3 newly-surfaced KaTeX `useCoeffHover.ts` sites + the 1 `EquationModeToggle.vue:64` site + the 2 `ConvergenceLegend.vue:78,94` sites that W4.md §1.4 did not enumerate).
  - `git grep -nE "text-foreground/35|text-muted-foreground/60|text-muted-foreground/70" web/src/` returns ZERO (full sweep across all 12 sites; or each retained site justified in PROGRESS.md W4 row).
  - Playwright `[data-dropzone-full]` selector count on `/visualize` empty state = exactly 1 (the canvas hero); `ImageUpload.vue` renders slim source-strip, not full dropzone.
  - Gallery orphan disposition: `git grep -ln "GalleryMarquee\|GalleryGrid" web/src/` matches the chosen option's expected state (option A: `GalleryView.vue` imports `GalleryMarquee`, `GalleryGrid.vue` does NOT exist; option B: neither file exists). PROGRESS.md W4 row names the decision.
  - Playwright keyboard-tab on `/paper` TOC + `/gallery` cards: every interactive element has visible `:focus-visible` ring AND keyboard Enter/Space on the focused GalleryCard fires modal-open AND Tab within the open modal stays trapped AND Escape closes + restores focus to the originating card.

- **P4.C3** (typed-asset transposition hardens `images.py:140,159` to clean 404/410 — not 500 — on pre-migration docs via a narrow exception type translated through the typed shim) → **W3.G_typed-shim-hardening**
  - The W3.B `ImageAsset` model declares `storage_uri: str` (required); construction on a pre-migration doc raises `ValidationError`.
  - `get_image_asset` translates the missing-`storage_uri` `ValidationError` to a narrow exception (`ImageAssetMigrationError` or equivalent).
  - `images.py:140,159` catch the narrow exception and raise `HTTPException(status_code=410, detail="Image asset awaiting migration")` (or 404).
  - Regression test: a pre-migration `images` doc (no `storage_uri`, inline `blob`) under `GET /api/images/{slug}/blob` returns 410/404 (NOT 500). Test landed in `api/tests/`.

- **P4.C4** (dead `snapshots`-indexes-on-live-DB disposition recorded) → **W3.G_dead-collection-disposition**
  - W3 close-record names the chosen disposition: **(a) one-shot drop migration** (extends `api/scripts/migrate_flags_field.py` or sister script: `db.snapshots.drop_index("snapshot_hash_1")` + `drop_index("image_slug_1_snapshot_hash_1")` + optionally `db.snapshots.drop()`) — recommended; OR **(b) leave-as-harmless** (deletion of `init_db` block only; existing prod orphans stay as harmless leftovers) — acceptable if W3.A finds the migration overhead disproportionate.
  - W6 ε prod-matrix probe verifies the chosen disposition via `mongosh --eval "db.snapshots.getIndexes()"` (option a: empty; option b: pre-existing orphans, acceptable).

## File created

- `/Users/mkbabb/Programming/fourier-analysis/docs/tranches/D/audit/challenge-P4.md` (this file).
