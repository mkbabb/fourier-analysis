# Wχ.P4 — does thread γ's discharge remove the legacy name at the ROOT, not behind a new cast?

**Probe**: design the BINDING FAILURE TEST for W4 (the `snapshot_hash` legacy-DTO discharge + the `as unknown as` cast removal + the `FlaggedListResponse` reconcile + the 14 conformance skeletons), and verify the W4 plan (`C.md` W4 row, invariant 20) forces a *root* fix — not a rename-behind-a-new-mask.
**Mode**: adversarial, research-only. One deliverable file. NO source/spec/coordination edits. Every claim grounded in `file:line` + grep output run on the live tree at HEAD `fc5b3b0` + the un-committed `docs/audits/runs/2026-05-27-C-audit/`.
**Date**: 2026-05-27. **Working dir**: `/Users/mkbabb/Programming/fourier-analysis`.

**Verdict in one line**: invariant 20's two greps are **NECESSARY but NOT SUFFICIENT** — a literal-honest W4 could pass both while (a) re-aliasing the type, (b) leaving a *dead duplicate* wrapper (`listFlaggedEntries`, api.ts:691) that re-exports the stale `FlaggedListResponse`, or (c) un-skipping an empty conformance stub. **P4 disposition: ACCEPTED-WITH-STRENGTHENING** — the gate binds the root only once augmented by the four additional checks in §3. The correct end-to-end root name is **`slug`** (with `owner_slug` for the flagged item's owner field), confirmed against the backend wire below.

---

## §1 — The ROOT: what the backend actually sends on the wire

The W4 rename target must be the backend's *actual emitted field name*, not an invented one. I read the response-producing code (not just the Pydantic model declarations, several of which are dead). Three DTO surfaces:

### §1.1 — Gallery / visualization list (`GET /api/visualizations`, `GET /api/gallery/cursor`)

- **Producer**: `api/routers/visualizations.py:215-263` (`list_visualizations`) and `api/routers/gallery.py:43-85` (`list_public_gallery`, the public alias). Both build the body from `_public_doc(doc)` (`visualizations.py:69`, `gallery.py:38-40`), which strips only `_id` / `liked_ips` and serialises the raw `Visualization` document.
- **The persisted entity** (`api/models/visualization.py:93-139`) has fields **`slug`** (`:102`) and **`owner_slug`** (`:103`). There is **no `snapshot_hash` field** on `Visualization`; `content_hash` (`:105`) is explicitly a non-identity dedup/ETag substrate ("never identity", `:96-97`).
- **Envelope**: `{items, next_cursor, has_more}` (`visualizations.py:261-263`; `gallery.py:78-82`).
- **The frontend already names this correctly at the api.ts boundary**: `Visualization { slug; owner_slug; … }` (`web/src/lib/api.ts:30-32`) consumed by `VisualizationListResponse { items: Visualization[]; next_cursor; has_more }` (`:78-81`). The lie begins **one layer up**, in `gallery.ts:33-48` (`toGalleryEntry`), which projects `v.slug → snapshot_hash` (`:37`) into the legacy `GalleryEntry` view-model (`types.ts:115-127`).

**Root name for the gallery/visualization band: `slug`.**

### §1.2 — Flagged list (`GET /api/admin/flagged`) — the cast's target

This is the load-bearing finding. **The endpoint at `api/routers/admin.py:508` declares NO `response_model`** (`grep -n "response_model" api/routers/admin.py` → only `:109` `/stats`). It hand-builds the body via `_json(...)`:

- **Envelope** (`admin.py:551,587`): `{"items": …, "next_cursor": …, "has_more": …}` — the **cursor envelope**, NOT offset pagination.
- **Item shape** (`admin.py:574-584`):
  ```python
  {"slug": doc["slug"], "content_hash": doc["content_hash"],
   "image_slug": doc.get("image_slug"), "owner_slug": doc.get("owner_slug"),
   "tier": doc.get("tier"), "created_at": doc.get("created_at"),
   "flag_count": agg.get("flag_count", 0), "flags": agg.get("flags", [])}
  ```
  The wire fields are **`slug`** and **`owner_slug`** — exactly the shape `AdminFlaggedPanel.vue:30-38` already models locally as `FlaggedVisualization { slug; owner_slug; … }`.

**The Pydantic `FlaggedListResponse` / `FlaggedEntryInfo` (`api/models/admin.py:69-84`) are DEAD CODE.** `git grep -n "FlaggedListResponse\|FlaggedEntryInfo" api/` returns only their definitions + the one internal `items: list[FlaggedEntryInfo]` self-reference (`:81`); they are **never** passed as `response_model` anywhere. They carry the stale `snapshot_hash` (`:70`) + `{items,total,page,pages}` offset shape (`:80-84`) but bind to no runtime behaviour. The frontend's `as unknown as` cast (`AdminFlaggedPanel.vue:56`) exists *solely* to force the truthful local `FlaggedVisualization` shape past the stale frontend `FlaggedListResponse` type alias — which itself mirrors the dead backend model.

**Root name for the flagged band: `slug` + `owner_slug`.** The runtime payload is ALREADY correct; only the *declared types* (frontend `types.ts:191-206` and the dead backend `admin.py:69-84`) lie. **No backend behaviour need change to remove the cast** — only the frontend type. (W4 MAY optionally delete the dead backend models for tidiness; not required by invariant 20, which is web-scoped.)

### §1.3 — Verdict on the root

The B convergence (`CA1 §1`, SYNTHESIS §0) collapsed identity to `slug` **on the backend** correctly. The wire is clean: every producer emits `slug` (+ `owner_slug`). The legacy `snapshot_hash` name survives **only** in three frontend type roots and the projector that feeds them. **W4's rename MUST target `slug` (and `owner_slug` for the flagged owner field) — matching the wire — not a freshly-invented name.** Verified the mirror claim: `gallery.ts:37` is `snapshot_hash: v.slug` ✓; `workspace.ts:57` is `return { slug: data.slug, snapshot_hash: data.slug }` ✓.

---

## §2 — Live grep census (run at HEAD, confirms W0-baseline §2)

```
$ git grep -nE "snapshot_hash|snapshotHash" web/src        → 44 hits / 14 files
$ git grep -n "as unknown as" web/src                      → 3 hits (1 on surface, 2 on equation/api.ts — out of scope)
$ git grep -n "as unknown as" web/src/components/visualization web/src/lib/api.ts web/src/lib/types.ts → 1 hit (AdminFlaggedPanel.vue:56)
$ git grep -n "FlaggedListResponse" web/src                → 7 hits (import + 2 wrapper returns + 2 adminFetch + comment + the type def)
```

The 44 `snapshot_hash` hits decompose (matching W0-baseline §2.1, broader than CA1's 4-site sample):

| Class | Count | Sites |
|---|---|---|
| **Type roots** (rename targets) | 3 | `types.ts:89` (`Snapshot`), `:116` (`GalleryEntry`), `:192` (`FlaggedEntryInfo`) |
| **Store mirror — write** | 2 | `gallery.ts:37` (`snapshot_hash: v.slug`); `workspace.ts:57` (`snapshot_hash: data.slug`) — also `workspace.ts:14` (`SavedVisualizationRef` field) |
| **Store mirror — read getter** | 1 | `gallery.ts:29` (`return e.snapshot_hash`) |
| **Interface field (workspace)** | 1 | `workspace.ts:33` (`snapshot_hash: string`) |
| **Component consumers** (read `.snapshot_hash` as key/id) | ~20 | `GalleryView.vue:73,117,118,119,139,373`; `VisualizationView.vue:112`; `GalleryCard.vue:32,82,129,150,159,168`; `GalleryCardModal.vue:124,173,183`; `GalleryFeaturedCarousel.vue:29`; `GalleryGrid.vue:37`; `GalleryInfiniteGrid.vue:32,36`; `GalleryMarquee.vue:37,53` |
| **Route-param camel variant** | 4 | `useWorkspaceLoader.ts:24,25,26,37` (`snapshotHash`) |
| **Benign — comments/strings documenting the retirement** | ~10 | `api.ts:24,405`; `gallery.ts:10,17,162,240`; `workspace.ts:26,239,346`; `router/index.ts:26` |

The cast census: `git grep -n "as unknown as" web/src` → 3 total; the two at `web/src/lib/equation/api.ts:36,53` are on the **equation** surface (NOT the visualization/gallery converged surface) and are out of invariant-20 scope. The invariant-20-scoped grep isolates exactly the one masking cast at `AdminFlaggedPanel.vue:56`. ✓ This confirms invariant 20's scope-narrowed grep is correctly drawn.

---

## §3 — The BINDING FAILURE TEST (strengthened against cheating)

Invariant 20 (`C.md §2`, `§6`) gives two greps. They are **necessary but not sufficient** — three distinct cheats pass them. I specify the full binding gate: the two original greps as PASS/FAIL conditions, plus four anti-cheat augmentations (G3–G6), plus the type-check + build gate (T1–T2), plus the conformance gate (C-gate, §4).

### The two original greps (NECESSARY — must return zero)

```
# G1 — no legacy identity name on web identity paths
git grep -nE "snapshot_hash|snapshotHash" web/src \
  -- ':!*.md' ':(exclude)web/src/**/*.test.ts' \
  | grep -vE '//|/\*|\*' \
  → MUST be empty (comments tidied or excluded; zero on identity code paths)

# G2 — no masking cast on the converged surface
git grep -n "as unknown as" web/src/components/visualization web/src/lib/api.ts web/src/lib/types.ts
  → MUST be empty
```

**Why insufficient — three cheats that pass G1+G2:**

1. **The type-alias cheat**: rename `snapshot_hash → slug` in the three type roots, but add `export type snapshot_hash_slot = string` or a `type GalleryEntry = { slug: string } & LegacyAlias` indirection — the literal token `snapshot_hash` is gone but the legacy concept persists behind a renamed alias. G1 passes (token absent); the root is not fixed.
2. **The new-cast cheat**: remove the `as unknown as` at AdminFlaggedPanel.vue:56 but re-introduce the same type-truth gap via a DIFFERENT cast spelling — `as FlaggedVisualization[]`, `as any`, `<FlaggedVisualization>`, `@ts-expect-error`, or `satisfies` mis-use. G2 greps only the literal string `as unknown as`; any other cast form passes it while masking the identical gap.
3. **The dead-duplicate cheat**: fix AdminFlaggedPanel.vue but leave `FlaggedListResponse` alive because the **dead duplicate wrapper `listFlaggedEntries` (api.ts:691-700)** still imports + returns it. G1/G2 pass (no `snapshot_hash`, no cast in that wrapper's body), yet the stale offset-shape type `FlaggedListResponse` (with `total/page/pages`) survives in `types.ts`, un-reconciled. **Found live**: `git grep -n "listFlaggedEntries" web/src` → declared at `api.ts:691`, consumed NOWHERE (`AdminFlaggedPanel.vue:53` calls only `listFlaggedVisualizations`). It is a dead re-export that would keep the stale type alive past the "fix".

### The strengthening augmentations (MUST all hold)

```
# G3 — anti-type-alias: the legacy concept name is gone from ALL of web/src,
#       not just the identity code paths — including type aliases, comments
#       that re-document a surviving slot, and the camelCase route variant.
git grep -niE "snapshot_hash|snapshotHash|snapshot.hash" web/src
  → ONLY benign hits permitted, and each MUST be a retirement-history comment
    with no live referent. Strongest form: return ZERO (W4 may tidy the ~10
    benign comment mentions for a clean grep, per W0-baseline §2.1's tidy note).
  FAIL if any new `type`/`interface`/`as` aliases the old slot under a new name.

# G4 — anti-new-cast: NO cast of ANY spelling masks a type-truth gap on the
#       converged surface. Greps the full cast vocabulary, not just one form.
git grep -nE "as unknown as|as any|@ts-(ignore|expect-error)|<[A-Z][A-Za-z]*\[?\]?>\s*\(await|\) as \{" \
  web/src/components/visualization web/src/lib/api.ts web/src/lib/types.ts web/src/stores
  → MUST be empty of any cast/suppression on the flagged/gallery/visualization
    DTO boundary. (NB: the pre-existing benign narrowings — GalleryCard.vue:48
    / GalleryCardModal.vue:44 `.filter(Boolean) as {…}[]`, GallerySearchBar
    `$event as any`, ContourSettings:116 `as any` — are NOT identity/DTO-truth
    masks; W4 need not touch them, but the grep MUST be inspected to confirm no
    NEW cast appears at the flagged/list boundary. The discriminating question
    for each hit: "does this cast bridge a declared API type to a runtime
    payload of a different shape?" — only such a cast is a violation.)

# G5 — anti-dead-duplicate: the stale type symbol itself is gone, killing every
#       re-export path. This is the decisive root check for FlaggedListResponse.
git grep -n "FlaggedListResponse" web/src
  → MUST be ZERO. (Removing the cast but keeping the symbol — alive via the
    dead `listFlaggedEntries` wrapper — is the §3 cheat #3; this grep forecloses
    it. The W4 reconcile must EITHER reshape the symbol to the cursor envelope
    {items, next_cursor, has_more} with slug-keyed items AND delete the dead
    `listFlaggedEntries` duplicate, OR delete the symbol entirely and have the
    one live wrapper return the cursor-envelope type used by the rest of the
    surface — `api.ts:78-81 VisualizationListResponse`-shaped.)

# G6 — positive shape assertion: the reconciled flagged type carries the cursor
#       envelope, never the offset shape.
git grep -nE "total|page|pages" web/src/lib/types.ts | grep -i flag
  → MUST be empty. AND the type that listFlaggedVisualizations returns MUST
    expose {items, next_cursor, has_more} with an item type whose identity
    field is `slug` (not snapshot_hash) and owner field is `owner_slug`.
```

### The type-check + build gate (MUST pass WITHOUT casts)

```
# T1 — vue-tsc compiles with the casts removed. This is the load-bearing proof
#       that the rename is TRUTHFUL: if the types now match the runtime payload,
#       removing the cast must still type-check. A cheat that renames but leaves
#       a shape mismatch will FAIL T1 (which is the point — it forces the
#       FlaggedListResponse reshape, not just the cast deletion).
cd web && npx vue-tsc -b --force        → exit 0, zero errors
# T2 — build green
cd web && npm run build                 → exit 0
```

**T1 is the keystone anti-cheat**: it makes the three cheats mutually exclusive with passing. You cannot delete the `as unknown as` cast AND keep the stale `FlaggedListResponse` type AND have `vue-tsc` pass — the local `FlaggedVisualization` shape will not assign to the stale `{items,total,page,pages}` type without the cast. So removing the cast *forces* the type to be reshaped to the truthful cursor envelope, or the build breaks. **G2 + T1 together bind the root for the flagged surface; G5 forecloses the dead-duplicate escape; G3 forecloses the alias escape.**

### Summary: PASS iff ALL of {G1, G2, G3, G4, G5, G6, T1, T2, C-gate(§4)} hold.

---

## §4 — The 14 conformance skeletons: fill-or-retire HONESTLY

`api/tests/conformance/` holds **14** files (NOT 15 — `C.md §3`/§6 say "15"; the tree has 14; the count corrects to **14** at Wχ harden, matching W0-baseline §2.3). Every one is `pytestmark = pytest.mark.skip(reason="conformance skeleton — implemented at B.W3")` + a lone `test_placeholder()` (`grep -rl pytest.mark.skip api/tests/conformance/` → 14/14; exact reason string is uniform across all 14). **The skip reason is a FALSE claim** — it asserts "implemented at B.W3"; the implementation did not occur (CA1 §2.1; the body is `test_placeholder()`).

**The W4 gate is "fill-or-retire HONESTLY" — a skip-stub may NOT survive cited as evidence in `CONFORMANCE-MATRIX.md`.** The cheat to foreclose: un-skip an empty `test_placeholder()` (it then "passes" while asserting nothing). The honest dispositions, established per-skeleton against whether its backing utility exists in `api/lib/crud/` and whether a passing proxy suite already proves the behaviour:

**Backing-utility census** (`ls api/lib/crud/`): `cursors.py`, `errors.py`, `etag.py`, `idempotency.py`, `pinned_cron.py`, `slugs.py`, `softdelete.py`, `slug_words.json`. **Proxy-suite census** (verified PASSING — ran `uv run pytest api/tests/test_crud_lib_{etag,idempotency,slugs,softdelete,cursors,errors} -q` → **92 passed, 12 skipped** [skips are `@requires_mongo`-gated, `conftest.py:51-53`]): `test_crud_lib_{cursors,errors,etag,idempotency,pinned_cron,slugs,softdelete}.py` + `test_visualization_{crud,ownership,soft_delete}.py`.

| # | Skeleton | Subject (CRUD-CONTRACT §) | Backing utility | Passing proxy suite | Disposition |
|---|---|---|---|---|---|
| 1 | `test_etag.py` | ETag/If-Match (§0, inv 23) | `etag.py` ✓ | `test_crud_lib_etag.py` ✓ | **FILL** (utility + proxy exist; lift assertions or re-point matrix at proxy) |
| 2 | `test_idempotency.py` | Idempotency-Key (§0/§9) | `idempotency.py` ✓ | `test_crud_lib_idempotency.py` ✓ | **FILL** |
| 3 | `test_slug_format.py` | slug format/algorithm (§2) | `slugs.py` + `slug_words.json` ✓ | `test_crud_lib_slugs.py` ✓ | **FILL** |
| 4 | `test_pagination.py` | cursor pagination (§0 SOTA-1) | `cursors.py` ✓ | `test_crud_lib_cursors.py` ✓ | **FILL** |
| 5 | `test_problem.py` | problem+json (RFC 9457, inv 22) | `errors.py` ✓ | `test_crud_lib_errors.py` ✓ | **FILL** |
| 6 | `test_soft_delete.py` | soft-delete state machine (§5) | `softdelete.py` ✓ | `test_crud_lib_softdelete.py` + `test_visualization_soft_delete.py` ✓ | **FILL** |
| 7 | `test_identity.py` | single-slug identity (§1) | `visualization.py` entity ✓ | `test_visualization_crud.py` ✓ | **FILL** |
| 8 | `test_ownership.py` | owner-bound mutation (§3) | entity `owner_slug` ✓ | `test_visualization_ownership.py` ✓ | **FILL** |
| 9 | `test_visibility.py` | 3-state visibility (§4) | entity `visibility` enum ✓ | `test_visualization_crud.py` (partial) | **FILL** (requires live-server seed — see note) |
| 10 | `test_janitor.py` | cron/bounded-prune (§8) | `pinned_cron.py` ✓ | `test_crud_lib_pinned_cron.py` ✓ | **FILL** |
| 11 | `test_admin.py` | admin moderation + audit (§7) | `admin.py` router ✓ | none for audit-row | **FILL** (audit-row assertion overlaps W3's janitor-audit work; coordinate) |
| 12 | `test_sessions.py` | sessions register/login/logout (§6) | `sessions.py` router ✓ | none | **FILL** (live-server; timing test C6.3 is heavy — see note) |
| 13 | `test_rate_limit.py` | RateLimit headers (RFC 9239, inv 24) | RateLimit middleware (CA1 §1 W4) ✓ | none | **FILL** |
| 14 | `test_url_shape.py` | URL no-secrets / grep guards (§1) | grep scripts `scripts/conformance/` | none | **FILL** (subprocess-grep form; cheap) |

**Net: all 14 are FILL, zero RETIRE.** Every skeleton has a landed backing utility or entity; 9 of 14 already have a passing proxy suite proving the behaviour. There is **no skeleton whose subject was abandoned** — so "retire" (strike the matrix row) is not honest for any of them; the honest move is to FILL. Spot-check of the four mandated (test_etag, test_idempotency, test_slug_format + test_identity): all four have a backing `api/lib/crud/` module or the entity, and three have a green proxy suite — **FILL confirmed** for each.

**Two honest sub-paths for FILL** (W4 chooses per skeleton, both acceptable):
- **(a) Lift the proxy assertions** into the named conformance path (e.g. `test_etag.py` imports + exercises the same `etag.py` cases the proxy does), so the matrix's cited path runs real assertions. Preferred for the 9 with proxies.
- **(b) Re-point the matrix** `Run` cell at the proxy suite that already proves it (e.g. C-row for ETag points at `test_crud_lib_etag.py::…`), and delete the empty skeleton. Acceptable ONLY if the matrix cell is rewritten to cite a path that actually runs — never leaving the skeleton cited.

**The FAIL condition (anti-cheat)**: a conformance test that is un-skipped but whose body is still `test_placeholder()` (asserts nothing) — OR a `CONFORMANCE-MATRIX.md` row still citing `api/tests/conformance/test_X.py::test_Y` where `test_Y` does not exist (the matrix cites methods like `test_identity.py::test_no_hash_in_url`, `test_slug_format.py::test_slug_shape` — **none of these methods exist today**; only `test_placeholder` does). The binding check:

```
# C-gate: zero skip-stubs cited as evidence, zero placeholder bodies in conformance
grep -rl "pytest.mark.skip" api/tests/conformance/                      → MUST be empty (or only honestly-skipped @requires_mongo)
grep -rn "def test_placeholder" api/tests/conformance/                  → MUST be empty
# every matrix-cited conformance method resolves to a real, collected test:
uv run pytest api/tests/conformance/ --collect-only -q                  → every collected node-id matches a CONFORMANCE-MATRIX Run cell;
                                                                          no matrix Run cell points at a non-collected node-id
uv run pytest api/tests/conformance/ -q                                 → green (with live Mongo provisioned; else the @requires_mongo
                                                                          subset skips HONESTLY, never the whole file via a blanket skip)
```

Note (the live-Mongo dependency, CA1 §2.2): several conformance subjects (visibility list-filtering, sessions, soft-delete grace, janitor tick) need a live server + Mongo to assert end-to-end. The proxy unit suites prove the *utility* behaviour Mongo-free; the *endpoint* conformance needs `MONGO_TEST_URI` in CI. W4's fill MUST NOT hide a vacuous proof behind `@requires_mongo` on a body that would assert nothing anyway — the `@requires_mongo` skip is honest only when the test body, run with Mongo, makes real assertions.

---

## §5 — FlaggedListResponse disposition (binding)

**Genuinely stale (wrong shape), not merely mis-typed.** Evidence:
- Frontend `types.ts:201-206`: `FlaggedListResponse { items: FlaggedEntryInfo[]; total; page; pages }` — the **retired offset shape**. `FlaggedEntryInfo` (`types.ts:191-199`) carries `snapshot_hash` (`:192`) + `user_slug` (`:196`) — pre-converged names.
- Backend wire (`admin.py:574-587`): cursor envelope `{items, next_cursor, has_more}` with items `{slug, owner_slug, …}`. The declared type and the runtime payload disagree on BOTH the envelope (offset vs cursor) AND the item identity field (`snapshot_hash` vs `slug`). This is a genuine type-truth gap, not a cosmetic mismatch.

**Correct end-state**: `FlaggedListResponse` reshaped to the cursor envelope `{ items: FlaggedVisualization[]; next_cursor: string | null; has_more: boolean }`, where `FlaggedVisualization { slug; flag_count; flags; image_slug; owner_slug; tier; created_at }` (lift `AdminFlaggedPanel.vue:30-38`'s local interface into `types.ts` as the canonical shape, delete the local copy). Then `AdminFlaggedPanel.vue:53-60`'s cast disappears because the wrapper's declared return type now matches the runtime payload.

**Backend change required?** — **NO.** The runtime payload is already correct (hand-built `_json`, no `response_model`). The dead `FlaggedListResponse`/`FlaggedEntryInfo` Pydantic models (`admin.py:69-84`) bind to nothing; W4 MAY delete them for hygiene (they're unreferenced as response models) but invariant 20 does not require it — invariant 20 is `web/src`-scoped. **Only the frontend type + the cast change.** This is a frontend-only reconcile.

**The dead-duplicate hazard (decisive)**: `listFlaggedEntries` (`api.ts:691-700`) is a SECOND wrapper returning `Promise<FlaggedListResponse>`, hitting the same `/api/admin/flagged`, **consumed nowhere** (`git grep -n "listFlaggedEntries" web/src` → declared only). If W4 reconciles AdminFlaggedPanel + `listFlaggedVisualizations` but leaves `listFlaggedEntries`, the stale `FlaggedListResponse` symbol survives (kept alive by the dead wrapper) and the reconcile is incomplete. **W4 MUST delete the dead `listFlaggedEntries` duplicate.** G5 (`git grep -n "FlaggedListResponse" web/src` → zero) is the grep that forces this — it is the single strongest root-check in the whole gate.

---

## §6 — Verdict

**P4 disposition: ACCEPTED-WITH-STRENGTHENING.** Invariant 20's two greps (G1, G2) are NECESSARY but NOT SUFFICIENT — three concrete cheats pass them (type-alias, new-cast-spelling, dead-duplicate). The gate binds the root ONLY when augmented with G3 (anti-alias full-token grep), G4 (anti-new-cast full-vocabulary grep), G5 (`FlaggedListResponse` symbol → zero, foreclosing the dead `listFlaggedEntries` re-export), G6 (positive cursor-envelope shape), T1 (`vue-tsc -b --force` green WITH the cast removed — the keystone that forces the type reshape), T2 (`npm run build`), and the C-gate (zero `test_placeholder` bodies, zero matrix Run cells citing non-collected node-ids). The 14 conformance skeletons are **all FILL, zero RETIRE** — every subject has a landed backing utility/entity and 9 already have a green proxy suite; "retire" is dishonest for any of them.

**If the C.md §6 hard-gate adopts ONLY invariant 20's two greps, P4 FAILS the W4 plan as insufficient.** With G3–G6 + T1 + the C-gate added, P4 PASSES — the W4 plan then provably forces a root fix.

### Binding recommendations to fold at Wχ harden
1. Add G3, G4, G5, G6 to the invariant-20 testable gate in `C.md §2`/§6 (the current two greps are necessary, not sufficient).
2. Make T1 (`vue-tsc -b --force` with the cast removed) the keystone gate — it is the proof the rename is truthful, not cosmetic.
3. Correct the skeleton count **15 → 14** in `C.md §3`/§6 (the tree has 14; W0-baseline §2.3 already corrected it).
4. Record that the W4 reconcile MUST delete the dead-duplicate `listFlaggedEntries` wrapper (`api.ts:691`) and SHOULD delete the dead backend `FlaggedListResponse`/`FlaggedEntryInfo` models (`admin.py:69-84`) — both are unreferenced legacy that would otherwise keep the stale name alive.
5. The fill-or-retire gate is **all-FILL**; the C-gate (zero `test_placeholder`, every matrix Run cell collects) forecloses the empty-un-skip cheat.
