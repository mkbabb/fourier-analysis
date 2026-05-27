# CA1 — Tranche B: plan vs landed reality

**Lane**: CA1 (tranche-C DEVELOPMENT phase, planning audit — read-only, no source edits).
**Date**: 2026-05-27. **Scope**: the original B plan (`B.md` + `waves/W1..W5.md`) vs the 13 execution commits `b0a85d8 → fc5b3b0` (atop the two B-development authoring commits `f8db2c6`, `eea7473`), ground-truthed against live code at HEAD `fc5b3b0`. The FINAL.md / PROGRESS.md close claims are treated as **claims to verify, not facts**.

---

## §1 — Wave-by-wave plan-vs-reality table

| Wave | Promised (from the plan) | Landed (commits / code, file:line evidence) | Disposition | Residual / divergence detail |
|---|---|---|---|---|
| **W0** — open · research dispatch | predecessor fourier-A confirmed closed; value.js cohort-peer state recorded; dispatch readiness | `b0a85d8` — PROGRESS records A closed (`A/FINAL.md`, `c7cfd82`), value.js-C RETIRED, `src/palette/`+`api/src/crud/` absent. Docs-only. | **LANDED-AS-PLANNED** | none |
| **Wα** — research wave (six read-only lanes) | six deliverables under `research/`; per-lane headline finding | `193ad57` — `research/R1`–`R6` (1,318 L) landed; consolidated 17-item drift ledger in PROGRESS. Re-chartered as ground-truth crosswalk over the existing `R-*-spec` corpus (honest, recorded). | **LANDED-DIVERGED** (benign) | Re-charter from "fresh research" → "ground-truth verification of the aspirational corpus". Recorded transparently in PROGRESS (2026-05-26 Wα entry); value-adding, not a skip. |
| **Wχ** — challenge wave (3+1 probes) | `audit/challenge.md` with P1/P2/P3+P4 adversarial probes | `ba02e66` — `challenge-P1..P4.md` + `challenge.md`. P1 ACCEPTED, P2 NARROWED, P3-A ACCEPTED/P3-B NARROWED, P4 ACCEPTED. | **LANDED-AS-PLANNED** | none |
| **W1** — CRUD-contract ratification | contract ratified (fourier-only); slug word-list extracted if warranted; no framework | `4626d4c` + `8b8298a` — CRUD-CONTRACT ratified fourier-unilateral; slug counts 120→**128**; MATRIX→187 rows; **14 conformance pytest skeletons + 5 grep scripts** landed. | **LANDED-DIVERGED** | The 14 conformance tests are **skip-skeletons** (`pytestmark = pytest.mark.skip`, body `test_placeholder()`) — paper-binding only, never empirically bound at W3/W4/W5 (see §2.1). slug-words live **in-repo** at `api/lib/crud/slug_words.json`, NOT the planned `docs/precepts/data/slug-words.json` (named residual — invariant-16 "in-repo first"). |
| **W2** — UX coherence (Configurator + a11y + render budget) | Configurator chassis adoption; ExportModal→Dialog; Coefficients dedup; EditorTools rationalised; render-path memoize; z-token + a11y discharges; axe-core e2e | `ca58321` + `1b8b32f` — all surface work landed (21 files; `CoefficientsSpectrum.vue`, `useViewTransform` memoize, `EditorToolsPanel` retired, `ExportModal`→`Dialog`). `@axe-core/playwright` added; `visualization-ux.spec.ts` authored. | **PARTIAL** | Live axe keystone run + e2e upload-bootstrap **deferred to W4.d** at W2 close (`1b8b32f`). The Invariant-19 regression-guard landed as a `fixme` red-baseline, not a passing guard. Render-path canvas regression introduced here (0 px canvas) — caught + fixed only at W4 (`71b2bd2`). |
| **W2-tracking** — value.js palette facility | track value.js-C.W1/W2 | closed orphaned-terminal; value.js-C RETIRED | **LANDED-AS-PLANNED** (orphaned) | terminal orphan, as designed |
| **W3** — visualization entity + migration + `api/lib/crud/` | one `visualizations` collection; full CRUD+soft-delete; backfill verified (inv 17); `api/lib/crud/` ≤525 LOC framework-free, all 6 helpers consumed; slug-words data | `52bdcf5` (+`5eb4421`/`93a566b`) — `visualization.py` model + `visualizations.py` router (6 endpoints); `snapshots.py` **DELETED**; `gallery.py` carved to public-visibility alias (`gallery.py:1-14`); `api/lib/crud/` = **exactly 525 LOC** (8 files); `migrate_visualization.py` (504 L) + seeded integration test. | **LANDED-AS-PLANNED** (with caveats →§2.2) | All 6 helper modules genuinely consumed by `visualizations.py:35`. LOC bound met exactly. Migration count-parity proven only on a **seeded fixture** (live DB empty); migration test is Mongo-gated (`@requires_mongo`) → skips with no live Mongo. |
| **W4** — convergence wiring | stores/api/router/draftStorage re-pointed; admin re-pointed; slug URLs; migrated callers consume helpers; `colors.ts` gut held (orphan) | `7315ba6` (+`71b2bd2`) — `api.ts`/`gallery.ts`/`workspace.ts`/`draftStorage.ts`/`router` re-pointed; If-Match 8 sites; `admin.py` 4 crud imports / 57 helper sites; RateLimit middleware; `colors.ts`/`easings.ts` byte-identical (held). Lifecycle e2e `visualization-crud.spec.ts` passes. | **LANDED-DIVERGED** | `colors.ts`/`easings.ts` gut **not done** (orphan-verdict fallback — named residual, honest). Frontend re-point left **4 `snapshot_hash` DTO-name residuals** + a stale `FlaggedListResponse` type worked around with `as unknown as` (see §3). |
| **W5** — close | PROGRESS reconciled; FINAL authored; coordination updated; orphan bookkeeping discharged | `fc5b3b0` — `FINAL.md` + PROGRESS + CRUD-CONSTELLATION reconciled; named successors recorded. | **LANDED-AS-PLANNED** | one residual mis-named "reconciliation" that is unbuilt work (the `FlaggedListResponse` type) — §4. |

**Tally**: **5 LANDED-AS-PLANNED** (W0, Wχ, W2-tracking, W3, W5) · **3 LANDED-DIVERGED** (Wα benign, W1, W4) · **1 PARTIAL** (W2) · **0 fully-RESIDUAL waves** (every divergence carries a named successor). Residual *items* are catalogued in §3.

---

## §2 — Divergences and partials

### §2.1 — The conformance matrix is paper-bound, never empirically bound (W1; affects the close)

The plan's two-step binding path (B.md §7): W1 paper-binds (every row has a Run command), **W3/W4/W5 empirically bind** (94 fourier rows → PASS). **The empirical binding never happened.**

- All **15** files under `api/tests/conformance/` carry `pytestmark = pytest.mark.skip(reason="conformance skeleton — implemented at B.W3")` with a single `test_placeholder()` body (`test_identity.py:9-13`). `grep -rl skip api/tests/conformance/` → 15/15.
- The W3 plan promised "94 fourier rows transition to PASS"; in reality the conformance directory still has **0 real assertions**. The empirical binding was satisfied *indirectly* by the parallel `test_visualization_*.py` + `test_crud_lib_*.py` suites (which do test the behaviour), but the **named matrix rows** the contract's §10 close-rule points at remain skip-skeletons.
- **FINAL.md §3 claims "14 conformance skeletons land the paper-binding"** — true and honestly stated. But the matrix's own §10 "every fourier row reads PASS" close-rule is satisfied by *proxy* suites, not by the cited test paths. C should treat the 187-row matrix as **~5% empirically bound at the cited path** (the proxy suites cover the behaviour; the matrix's own cells do not run).

**Spot-check of 5 named test paths** (exist + pass?): `api/tests/conformance/{test_identity,test_etag,test_ownership,test_soft_delete,test_slug_format}.py` — **all 5 exist, all 5 SKIP** (never pass). The behaviour is proven elsewhere (`test_visualization_ownership.py`, `test_visualization_soft_delete.py`, `test_crud_lib_etag.py`, `test_crud_lib_slugs.py`).

### §2.2 — Migration count-parity proven only on a seed; Mongo-gated (W3)

`test_migrate_integration.py` **does** prove count-parity, honestly: `assert report.visualizations_after == report.gallery_before + report.orphan_snapshots_before` (`:124`), `report.snapshots_before == 5` (`:118`), idempotent re-run `second.written == 0` (`:183`), dangling-hash abort + naive→aware coercion + zombie-orphan `was_public` all asserted. **But**: every test is `@requires_mongo` (`:105,170,194,226`) → `pytest.mark.skipif` when no live Mongo (`conftest.py:51-53`); and the parity is over a **seeded 5-snapshot fixture**, because the live dev DB source collections are empty (Wχ P2 — honestly recorded). So the proof is real but **conditional on a live Mongo in CI**; in a Mongo-less run the load-bearing migration proof silently skips. This is disclosed in `audit/migration-counts.md` and FINAL §0(c) — **not overstated**, but C must ensure CI provisions Mongo or the proof is vacuous.

### §2.3 — FINAL helper-adoption counts are approximate (W3/W4)

FINAL §3 states "errors 24× · etag 6× · slugs 5× · cursors 4× · idempotency 4× · softdelete 3×". Ground-truth call-site counts in `visualizations.py`: **errors 23** (call sites; 24 incl. the docstring mention), etag 6 ✓, slugs 5 ✓ (4 `validate_slug` + 1 `slug_with_retry`), **cursors 3** call sites (+`cursors.SORT_KEYS` reference = the claimed 4), **idempotency 1** call site (`replay_or_record` at `:164`; the `IdempotencyStore` class is used 3× more in setup `:52,58` → the "4" is generous accounting), softdelete 3 ✓. **All 6 modules are genuinely consumed** — the headline "all 6 consumed" is TRUE. The per-module multiplicities are loose but immaterial; no consumption claim is fabricated.

### §2.4 — W2 axe + e2e deferral chain (PARTIAL)

W2 promised the Invariant-18 axe measurement and discharge of a11y gaps. The *surface* work landed, but the **live axe keystone run and e2e bootstrap were pushed W2 → W4.d**, and at W4 the residual axe-keystone failures were declared "transient dock-collapse-animation artifacts" and pushed again to a named successor (FINAL §6 "e2e axe-keystone settle-wait"). The Invariant-18 *harness* is in place; the *green measurement* is not. This is a two-hop deferral, each hop named — honest, but C inherits an unproven a11y gate.

---

## §3 — Verified residuals (concrete, file:line — feeds CA2's inventory)

1. **4 `snapshot_hash` DTO-field-name residuals on user paths** (legacy-name smell). The W4-frontend-A report flagged "4 residual `snapshot_hash` sites — slug-valued DTO field names, not identity logic." Precise locations where the **visualization slug is stuffed into a field literally named `snapshot_hash`**:
   - `web/src/stores/gallery.ts:37` — `snapshot_hash: v.slug` (slug mirrored into the legacy slot)
   - `web/src/stores/gallery.ts:29` — `return e.snapshot_hash` (key getter reads the slug-slot)
   - `web/src/stores/workspace.ts:33` — interface field `snapshot_hash: string`
   - `web/src/stores/workspace.ts:364` — `return { slug: data.slug, snapshot_hash: data.slug }`
   These are **real legacy-name smell**: the value is a 4-word slug but the field is named for the retired 64-char content hash, purely so downstream gallery cards (`GalleryCard.vue`, `GalleryGrid.vue`, etc. — 12+ consumer sites all keyed on `entry.snapshot_hash`) keep compiling. C should rename the DTO field `snapshot_hash → slug` and update the ~16 component consumer sites. **Verdict: fold into C.**

2. **Stale `FlaggedListResponse` type + `as unknown as` cast** (W4-C worked around, not fixed):
   - **Stale type**: `web/src/lib/types.ts:201-206` — `FlaggedListResponse { items: FlaggedEntryInfo[]; total; page; pages }` — the **retired offset-pagination shape**. `FlaggedEntryInfo` (`:191-199`) itself still carries `snapshot_hash` + `user_slug` (pre-converged names).
   - **Wrapper still declared with the stale type**: `web/src/lib/api.ts:577,582,694,698` — `listFlaggedVisualizations` returns `Promise<FlaggedListResponse>`.
   - **The cast**: `web/src/components/visualization/gallery/AdminFlaggedPanel.vue:53-60` — `(await api.listFlaggedVisualizations(...)) as unknown as { items; next_cursor; has_more }`. The SFC models the **real cursor-envelope** runtime shape locally and force-casts past the stale wrapper type. Comment at `:25-29` admits it explicitly.
   **Verdict: a genuine type-truth gap** — the declared API type lies about the runtime payload; vue-tsc passes only because of the double-cast. C should reshape `FlaggedListResponse` to the cursor envelope `{items, next_cursor, has_more}` and delete the cast.

3. **slug-words data in the wrong home**: `api/lib/crud/slug_words.json` (present, 7,148 B) instead of the planned shared `docs/precepts/data/slug-words.json`. Named residual (invariant-16 "in-repo first"; destination "precepts-extraction-when-value.js-reengages"). Honest, low-priority.

4. **Conformance skeletons unfilled**: 15 skip-skeletons at `api/tests/conformance/*.py`. The matrix's cited test paths never empirically bind (§2.1). C should either fill them or re-point the matrix at the proxy suites.

5. **Stale `Snapshot`/`GalleryEntry` types retained**: `web/src/lib/types.ts:88-95` (`Snapshot`), `:115-127` (`GalleryEntry` with `snapshot_hash`+`user_slug`). These feed the gallery components that still key on `snapshot_hash`. Same root as residual #1.

6. **`useWorkspaceLoader.ts` still references `snapshotHash` route param** (`:24-26,37`) and `store.loadSnapshot(imageSlug, snapshotHash)` — the router retired the `:snapshotHash` param (`router/index.ts:26`) but this composable still reads it. Possible dead branch; C should verify it is reachable.

7. **Live-DB-empty means migration unexercised in prod-like data**: the cutover (`rename → _legacy`) is documented in the script docstring but never run against real data (dev DB empty). C/deploy inherits the first real execution.

---

## §4 — Close-claim verification (FINAL.md)

| FINAL claim | Holds? | Note |
|---|---|---|
| §0(a) contract ratified fourier-side; matrix names a real test artefact per assertion | **PARTIAL** | Contract ratified ✓. "Real test artefact" = skip-skeletons at the cited paths; behaviour proven by proxy suites, not the named rows (§2.1). **Mild overstatement.** |
| §0(b) one `visualizations` collection; no surviving snapshot/gallery identity on user paths; CRUD+soft-delete proven | **HOLDS (with nuance)** | `snapshots.py` deleted ✓; `gallery.py` is a public alias ✓. But **4 `snapshot_hash` DTO-name sites survive on user paths** (§3.1) — they are slug-valued, so the *identity scheme* is gone, but the *name* is not. FINAL §4 narrowed the grep to `visualizations.py`+`main.py` (→0), which **dodges the frontend DTO residuals**. Honest at the collection level; the grep scope is chosen to pass. |
| §0(c) migration verified, no loss | **HOLDS conditionally** | Count-parity proven on seed; Mongo-gated; live DB empty (§2.2). Disclosed honestly. |
| §0(d) `colors.ts` byte-identical (orphan fallback) | **HOLDS** | `git diff 52bdcf5..HEAD -- colors.ts easings.ts` empty ✓. |
| §0(e) no shared framework/codegen/coordinator (inv 16) | **HOLDS** | `api/lib/crud/*.py` has **no `APIRouter`/`FastAPI`/control inversion**; only `HTTPException`/`Request`/`Response`/`JSONResponse` value-imports + Pydantic models + a plain `IdempotencyStore` class with explicit `replay_or_record`. No `@app.`/`@router.` decorators, no `BaseCRUDRouter`. **Genuinely a called-from library.** 525 LOC exact. |
| §0(f) pytest green; vue-tsc green; value.js DEFERRED | **NOT RE-VERIFIED HERE** | Out of CA1 read-only scope to re-run; the green claim rests on a live-Mongo CI (else migration tests skip). |
| §3 "all 6 consumed by visualizations.py (errors 24× …)" | **HOLDS; counts loose** | All 6 consumed ✓; multiplicities approximate (§2.3). |
| §6 named successors | **HOLDS** | Every miss carries a named successor; nothing closed silent. The `FlaggedListResponse` carry is filed as "type reconciliation" — accurate but understates that it's a **type-truth bug masked by a cast**, not cosmetic. |

**Overstatements**: (1) §0(a) "real test artefact per assertion" — the cited conformance rows are skip-skeletons; (2) §0(b)/§4 the `snapshot_hash` deletion grep is **scope-limited to two backend files**, hiding the 4 frontend DTO-name + stale-type residuals; (3) §6 frames the `FlaggedListResponse` carry as reconciliation rather than a cast-masked type-truth gap. None are dishonest — all the underlying residuals are *recorded somewhere* in PROGRESS — but the FINAL headline reads cleaner than the tree is.

---

## §5 — Quality verdict on the B landing

**Idiomatic / gestalt — yes, substantially.** The `api/lib/crud/` module is the strongest artefact: framework-free, exactly at the 525 LOC ceiling, all six helpers genuinely called from the router, no control inversion — invariant 16 holds against adversarial check, not just on paper. The entity convergence is real: `snapshots.py` deleted, `gallery.py` reduced to a 90-line public alias, one collection, slug identity, soft-delete, ETag/If-Match, problem+json. The research-first lifecycle demonstrably paid (caught the already-retired `$nin`, the absent `compute.py`, the 128-not-120 slug counts, the naive/aware tz landmine, the 0 px canvas regression).

**But expediency left a frontend legacy-name smell band.** The convergence stopped at the API boundary. The frontend was re-pointed by **mirroring the slug into a field still named `snapshot_hash`** (4 sites) so ~16 gallery-component consumers and a stale `FlaggedListResponse`/`FlaggedEntryInfo`/`Snapshot`/`GalleryEntry` type cluster keep compiling — and the type-truth gap was papered over with an `as unknown as` double-cast in `AdminFlaggedPanel.vue` rather than fixing the shared type. This is exactly the "legacy-name compatibility shim" the no-fallback discipline forbids; it survived because vue-tsc is satisfied by the cast and the close-grep was scoped to backend files. It is honest (recorded in PROGRESS + FINAL §6) but it is unfinished convergence, not clean convergence.

**Net**: B is a **clean backend landing with a deferred-but-named frontend cleanup tail**. No silent legacy; one cast-masked type lie; conformance matrix bound by proxy not by its cited rows. The smells are bounded, located (§3), and all addressable in C. **C must: (1) rename `snapshot_hash`→`slug` across the gallery DTO + ~16 consumers; (2) reshape `FlaggedListResponse` to the cursor envelope and delete the `AdminFlaggedPanel` cast; (3) fill or re-point the 15 conformance skeletons; (4) ensure CI provisions Mongo so the migration proof is non-vacuous.**
