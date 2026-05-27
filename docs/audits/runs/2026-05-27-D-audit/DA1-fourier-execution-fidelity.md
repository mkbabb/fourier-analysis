# DA1 — fourier A/B/C execution-fidelity + NO-legacy-code audit

**Lane**: DA1 (tranche-D DEVELOPMENT phase — read-only; one audit doc, no source touched).
**Date**: 2026-05-27. **Tree**: HEAD `1e47115` (C close commit, `docs(C.W6): close tranche C`).
**Scope**: the C close claims (`docs/tranches/C/FINAL.md`, `PROGRESS.md`, `waves/W1..W6.md`) treated as **claims to verify, not facts**, ground-truthed against the live tree and the C commits `9003cba..1e47115`. Focus per the charter: the NO-legacy / NO-workaround precept on every C change; gate honesty; architectural-transposition opportunities; new residuals for D. Format mirrors `docs/audits/runs/2026-05-27-C-audit/CA1-b-plan-reality.md`.

C commit ledger re-derived (`git log --oneline 9003cba..HEAD`): `fce1808`(W0) · `8b111a8`(Wα) · `f2b9b1a`+`45684e7`(Wχ) · `e6a6b95`(W3) · `f91a656`(W4) · `49cb714`(W1) · `817cfcc`(W5) · `95601d4`(docs) · `4905682`(W2) · `27c883b`+`1e47115`(W6). Matches FINAL §2 exactly. 9 execution + 3 doc commits.

---

## §1 — NO-legacy / NO-workaround check, wave by wave

### §1.1 — W4 (slug-identity completeness, `f91a656`): clean on the frontend, **scope-limited grep masks a live backend `snapshot_hash` band**

The frontend half of the γ thread genuinely landed. Re-running the load-bearing greps at HEAD:

```
$ git grep -nE "snapshot_hash|snapshotHash" web/src       → ZERO
$ git grep -n "FlaggedListResponse" -- web                → ZERO
$ git grep -nE "listFlaggedEntries|dismissFlags" -- web    → ZERO
```

All three pass. `web/src/stores/gallery.ts:22` now keys on `e.slug` (not the old `snapshot_hash` slot); `types.ts:115` `GalleryEntry` carries `slug`; `AdminFlaggedPanel.vue` no longer casts. **The frontend rename is real, not re-masked** — `vue-tsc -b --force` exits 0 (re-run, §2). This is honest convergence on the frontend, fixing exactly the B residual CA1 §3 flagged.

**BUT the FINAL §0(a) / §3 / §9 wording "discharged at the ROOT" is frontend-only.** W4's gate G1 grep is `git grep … web/src` by construction — it can never see the backend. The backend still speaks `snapshot_hash` as a **live, written field name** across three collections:

- **`flags` collection is LIVE and `snapshot_hash`-keyed** — `api/routers/admin.py:218,357,468,530,606` read/delete/aggregate on `{"snapshot_hash": …}`, and `api/services/database.py:125-126` create a **unique `(snapshot_hash, reporter_slug)` index** + a plain `snapshot_hash` index. The value stored is actually the visualization's `content_hash` (`admin.py:218` `db.flags.delete_many({"snapshot_hash": content_hash})`). **This is the exact legacy-name-behind-a-value pattern invariant 20 forbids** — a `content_hash` value wearing the retired `snapshot_hash` name — surviving on the backend after W4 fixed its frontend twin. admin.py's own comments (`:6, :348, :515, :595`) acknowledge it ("the `flags` collection's surviving `snapshot_hash` key"), so it is *documented*, not silent — but it is unfinished convergence, not clean.
- **`snapshots` collection indexes created on a DEAD collection** — `database.py:68-69` create two unique `snapshot_hash` indexes on `_db.snapshots`, but the `snapshots.py` router was **deleted at B.W3** and no live code reads/writes `db.snapshots` (only `migrate_visualization.py` + the migration test). `init_db` provisions indexes for a retired collection on every boot.
- **Models still carry `snapshot_hash` fields** — `api/models/gallery.py:41,70` (`GalleryEntryResponse`, a flag model), `api/models/admin.py:70`, `api/models/assets.py:51`. `git grep -nc "snapshot_hash" -- api/` → 11 sites in `migrate_visualization.py`, 9 in `admin.py`, 5 each in `database.py`/`models/gallery.py`/conformance, etc.

**Verdict**: W4 is a clean *frontend* landing. The "ROOT" claim is overstated — the root of the identity model (the Mongo collections + their indexes + the moderation path) still carries `snapshot_hash`. The grep scope (`web/src`) was, as in B (CA1 §4), chosen so the gate passes. **Fold the backend `snapshot_hash`→`content_hash`/identity rename into D.**

The two dead duplicates (`listFlaggedEntries`, `dismissFlags`) are genuinely gone (grep → 0). `FlaggedListResponse` is genuinely deleted and the cast removed — no new alias introduced in its place. The 14 conformance skeletons are honestly filled: `git grep test_placeholder api/tests/conformance/` → ZERO; `git grep pytestmark api/tests/conformance/` → ZERO; 112 real `assert` statements across the 14 files (`test_admin.py` 15, `test_soft_delete.py` 11, … `test_url_shape.py` 1). No skip-skeleton survives. **This part of the close is fully honest.**

### §1.2 — W5 (image-blob migration, `817cfcc`): clean cutover, no dual-read, one stale docstring

The deletion proof holds:

```
$ git grep -n "Binary(content)" api/services/image_storage.py   → ZERO
$ git grep -n "Binary(" -- api    → only api/tests/test_migrate_image_blobs.py:82,86,179 (fixture seeding of legacy docs — correct)
```

`image_bytes` (`image_storage.py:189-199`) reads **only** from `storage_uri` — there is **no `blob` fallback branch** (no dual-read; invariant 3 honoured). The C9 dedup-hit fix is real and idiomatic: `image_storage.py:98-121` reads the primary through the shim and writes the regenerated thumbnail back **as a file + `thumbnail_uri`, never an inline `Binary`** (line 104 comment is accurate). The C1 janitor delete-coupling is present: `janitor.py:422-428` unlinks `slug` + `slug.thumb` in the same cascade as the Mongo delete (`missing_ok=True`, best-effort) — invariant 18 reclaimability preserved. C10 (`dependencies.py:96-98`) projects `storage_uri` not the retired `blob`.

**One residual W5 left**: the module docstring `api/services/image_storage.py:1` still reads `"""Asset-based image and contour storage (MongoDB documents with Binary blobs)."""` — stale after the relocation. A one-line doc-truth gap, not load-bearing. Fold into D cleanup.

**No new cast / alias / fallback / band-aid introduced by W5.** This is the strongest C wave.

### §1.3 — W3 (janitor audit + `--reload` fix, `e6a6b95`): clean; one imprecise FINAL phrasing

Janitor audit rows verify: `git grep "janitor:" api/services/janitor.py` → 11 `_log_janitor_audit` calls, each `janitor:<sweep>` on the existing `admin_audit` 4-field shape (`janitor.py:59-92`) — no schema bloat, `AuditEntry` unchanged. Confirmed against the FINAL §4 "11 destructive ops" claim.

The `--reload` narrowing is genuine but the FINAL phrasing is loose. Actual diff (`git show e6a6b95 -- scripts/dev.sh api/Dockerfile`):
- `scripts/dev.sh:76`: `--reload-dir api --reload-dir src` → `--reload-dir api` (the `src` watch **dropped** — FINAL accurate here).
- `api/Dockerfile:16`: bare `--reload` (watches CWD = everything incl. `src/`) → `--reload --reload-dir api` (**narrowed**, never literally had `--reload-dir src`).

FINAL §4 "the `--reload-dir src` watch dropped (`dev.sh:76` + `api/Dockerfile:16`)" is precise for dev.sh, slightly imprecise for the Dockerfile (which had bare `--reload`, not a literal `src` watch). The **root fix is real** — `src/` is no longer watched in either path, so the in-flight `asyncio.to_thread` compute (`computation.py`) is no longer killed on a `src/` recompile. Prod `Dockerfile:33` has no `--reload` and is byte-identical (verified). No legacy introduced.

### §1.4 — W1 (deploy-hook, `49cb714`): clean repo-local stratum

```
$ ls scripts/deploy.sh                  → does not exist (deletion proof holds)
$ ls scripts/deploy-hook.sh             → present (tracked)
$ git grep -nE '[:/]8091' -- ':!docs/*' ':!*.lock' ':!**/*.json'   → ZERO
```

The scoped `8091` grep is honest: the unscoped grep surfaces `8091` only as incidental SHA/URL substrings in `uv.lock` and JSON path assets (e.g. `web/src/assets/fourier-paths/equation.json` coordinate data) — never a port reference. `deploy-hook.sh` carries the flock + `${HTTP_PORT:-8100}` gate + rebuild-on-rollback. **No legacy / workaround in the repo-local stratum.** The shared `/opt/deploy/dispatch.sh` rewrite is a named host residual (§4), correctly not claimed proven.

### §1.5 — W2 (verified-TLS, `4905682`): repo-local clean; **prod.yml is a known-latent legacy the user now wants resolved**

`scripts/gen-mongo-certs.sh` exists (CA + leaf, 4 SANs); `docs/tranches/C/infra/tls.md` records `CN=fourier-internal-ca`. The `.env.example` 4th-site reconcile landed (`:21` now uses `tlsCAFile`, host `fridayinstitute.net`).

But `docker-compose.prod.yml` is **deliberately untouched** and still carries the insecure TLS posture at **two sites**:
- `docker-compose.prod.yml:8` — `…?authSource=admin&tls=true&tlsAllowInvalidCertificates=true`
- `docker-compose.prod.yml:58` — `"--tls", "--tlsAllowInvalidCertificates"` (the mongo healthcheck)

The FINAL §6 names this as a host-pending residual ("the invariant-19 gate is met only after the coordinated host cutover; prod.yml is not yet clean and is not claimed to be") — **honest**. The charter asks directly whether this is *"a LATENT legacy/incoherence the user would want resolved now that SSH is available."* **Yes.** C's own "provisioning-then-flags spine (inversion forbidden)" rationale was correct *while the host had no SAN-correct cert*; with SSH access available for D, the cert can be provisioned (`gen-mongo-certs.sh` is already proven) and the prod.yml flags retired in the same coordinated step. **This is the single highest-value α host residual to discharge in D** — it is the only place a `tlsAllowInvalidCertificates` legacy survives anywhere in the tree, and it weakens the live prod MongoDB trust posture.

---

## §2 — Gate honesty: re-running the load-bearing gates

| FINAL gate | Re-run result | Honest? |
|---|---|---|
| `uv run pytest api/tests/` 129/83/0 | **129 passed, 83 skipped, 0 failed** (0.88s) | **HOLDS** — exact match. Caveat (inherited from B, CA1 §2.2): the 83 skips are `@requires_mongo`; the migration + dedup-regression + conformance-behaviour proofs only run with a live Mongo. In a Mongo-less CI those load-bearing proofs **silently skip**. The "212 passed against transient Mongo" claim is not re-verifiable here without provisioning Mongo; the 129/83 number is the honest no-Mongo floor. |
| `vue-tsc -b --force` exit 0 | **exit 0** | **HOLDS** — green WITH the AdminFlaggedPanel cast removed (the T1 keystone). Genuine reshape. |
| `npm run build` exit 0 | **exit 0** (built 6.18s) | **HOLDS** (build warns on >500 kB chunks — `index` 867 kB / `PaperView` 471 kB — a perf note, see §3.4, not a gate failure). |
| G1 `snapshot_hash\|snapshotHash` → 0 web/src | **ZERO** | HOLDS *as scoped*; **scope hides a live backend band** (§1.1). |
| G2 `as unknown as` → 0 | **TWO survive**: `web/src/lib/equation/api.ts:36,53` | **PARTIAL / imprecise.** Both casts pre-date C (present at `9003cba` and `fc5b3b0`, introduced by `b5b4bc7`), are NOT on the identity path — they widen a request body to `Record<string, unknown>` for the generic `eqFetch` helper in the equation view. The FINAL §0(a) bare phrasing "the `as unknown as` cast removed" is **scoped to the AdminFlaggedPanel identity cast** (which W4 genuinely removed) but reads as a tree-wide zero it is not. Minor; a D candidate (§3.4). |
| G5 `FlaggedListResponse` → 0 | **ZERO** | HOLDS. |
| `Binary(content)` → 0 in image_storage.py | **ZERO** | HOLDS (test fixtures excepted, correctly). |
| All 14 conformance skeletons filled | **ZERO `test_placeholder`, ZERO `pytestmark` skip, 112 asserts** | HOLDS. |

**Gate-honesty verdict**: the close is substantially honest — every gate the FINAL names passes when re-run, and every host-pending remainder is named in §6. The two gaps are both **scope-limited greps reading cleaner than the tree**: (1) G1 `web/src`-only hides the live backend `snapshot_hash` band (the material one); (2) G2 reads as tree-wide when it means the identity cast only. Neither is a *silent* miss (the backend band is acknowledged in admin.py comments; the equation casts are out of γ scope) — but both let the FINAL headline "discharged at the ROOT" / "`as unknown as` removed" read stronger than the tree warrants. This is the same pattern CA1 §4 caught in B, inverted: B left the frontend dirty under a backend-scoped grep; C left the backend dirty under a frontend-scoped grep.

---

## §3 — Architectural-transposition opportunities (the charter explicitly wants these)

Concrete accidental complexity an elegant transposition would remove, file:line.

### §3.1 — The `gallery` collection + `_entry_from_doc` are dead legacy substrate (HIGH value)

The convergence onto `visualizations` is real on the live read path: `api/routers/gallery.py:43 list_public_gallery` reads `db.visualizations` and renders via `_public_doc` (`:38`). But a whole legacy stratum survived B *and* C untouched:

- **`_entry_from_doc` (`gallery.py:32-35`) is DEAD.** Its docstring (`gallery.py:11-14, :33`) claims *"`api/routers/admin.py` consumes it for moderation over the legacy `gallery` collection."* **False** — `git grep -nE "_entry_from_doc|import gallery" api/routers/admin.py` → not referenced. admin.py operates **entirely on `db.visualizations`** (admin.py:121,174,180,…,602 — zero `db.gallery` reads). `_entry_from_doc` is the only consumer of `GalleryEntryResponse` (`models/gallery.py:37`), so both are dead.
- **The `gallery` collection has no live writer.** `git grep -nE "gallery\.(insert|update|replace)" api/` → only `test_migrate_integration.py`. The only live `db.gallery` touches are (a) `database.py:82-93` creating **9 indexes** (incl. a **unique `snapshot_hash` index** and a `user_slug` index — both retired names) on every boot, and (b) the janitor cascade-*deleting* from it (`janitor.py:239,407`). It is pure rollback substrate whose "B.W5 close ceremony" sunset (per the gallery.py docstring) **never happened**.

**Transposition**: drop the `gallery` collection, its 9 `init_db` indexes (`database.py:82-93`), the dead `_entry_from_doc` + `GalleryEntryResponse`, and the janitor's two gallery-cascade branches. Net: less boot-time index churn, one fewer collection, the retired `snapshot_hash`/`user_slug` index names gone, ~40 LOC of dead router/model removed. Pairs naturally with the §1.1 backend `snapshot_hash` rename.

### §3.2 — `init_db` provisions indexes for the retired `snapshots` collection (MEDIUM)

`database.py:67-69` create two unique `snapshot_hash` indexes on `_db.snapshots` — a collection whose router was deleted at B.W3 and which no live code reads (§1.1). The migration script reads `db.snapshots` once (one-shot, host-residual run). **Transposition**: delete `database.py:67-69`; gate any residual `snapshots` read behind the migration script only. Removes the last live `snapshot_hash` *index* creation and a dead-collection provision.

### §3.3 — The `image_bytes` shim layer is thin and correct, but the indirection through `dict` is the accidental-complexity seam (LOW-MEDIUM)

`image_storage.py:189-199 image_bytes(asset: dict)` resolves `storage_uri` → file. It is genuinely small (no dual-read), so this is **not** a band-aid. The accidental complexity is that the *whole* asset model is an untyped Mongo `dict` threaded through `dependencies.py:104`, `routers/images.py:178`, and `image_storage.py:106,207` — every consumer does `asset.get("storage_uri")` / `doc["image_slug"]` against a shapeless dict, and the C10 bug (the projection starving the shim, `dependencies.py:91-98`) was *caused* by exactly this untypedness (a `{"blob": 1}` projection that no type system would have caught). **Transposition for D**: lift the image asset to a Pydantic model (mirroring the `api/lib/crud` discipline) so the projection→field-presence coupling is a typed contract, not a runtime `KeyError` waiting in a broad `except`. This is the kind of "fix-at-ROOT, idiomatic" move the precepts want — it would have prevented C9 and C10 structurally rather than by comment.

### §3.4 — Frontend bundle is unsplit; two benign casts; the `user_slug`/`owner_slug` view-model seam (LOW)

- `npm run build` warns the main chunk is **867 kB** (`index`) + **471 kB** (`PaperView`) — no `manualChunks` / dynamic-import code-splitting. A perf transposition (route-level `import()` for the PaperView + equation surfaces) is "performance desirable" per the precepts.
- `equation/api.ts:36,53` `as unknown as Record<string, unknown>` — widen-for-generic-fetch. Tidy by typing `eqFetch`'s body param as `object` / a `JsonBody` constraint so the cast disappears (§2 G2).
- A small naming seam: the backend wire field is `owner_slug` (`api.ts:31`, `types.ts:200`), but the gallery view-model renames it to `user_slug` at `stores/gallery.ts:31` (`user_slug: v.owner_slug`) and `types.ts:119` `GalleryEntry.user_slug`. Unlike the `snapshot_hash` smell, both hold slug values and `user_slug` is a *legitimate* backend name for the **user/session** identity (`SessionResponse.user_slug`, `AdminUserList`). So this is a benign view-model rename, not a legacy smell — but it is an avoidable inconsistency (two names for the visualization owner). Optional D tidy: settle the gallery view-model on `owner_slug` to match the wire.

### §3.5 — admin.py is the heavy router (651 LOC) (LOW, observational)

`api/routers/admin.py` is 651 LOC vs `visualizations.py` 375 / `images.py` 265. It does stats aggregation, tier, soft/hard delete, bulk-by-owner, the flag stream, and per-flag dismissal. It already consumes `api/lib/crud` helpers (soft_delete etc.), so it is not framework-dead-weight — but it is the one router where a moderation-domain extraction (the flag stream + flag-dismissal cluster, `admin.py:218,357,468,530,606`) could carve cleanly, *and* it is exactly the cluster carrying the backend `snapshot_hash` legacy (§1.1). D should treat "rename `snapshot_hash` on the flags path" and "carve the moderation surface" as one transposition.

---

## §4 — New residuals introduced/left by C (fold into D)

1. **Backend `snapshot_hash` legacy band** (§1.1) — `flags` collection field + unique index (`database.py:125-126`, admin.py 9 sites), dead `snapshots` indexes (`database.py:68-69`), `models/{gallery,admin,assets}.py` fields. The backend twin of the frontend smell W4 fixed; the "ROOT" claim does not cover it. **Highest-value D item for the γ thread.**
2. **prod.yml `tlsAllowInvalidCertificates`** (§1.5) — `docker-compose.prod.yml:8,58`. Named host residual; now actionable with SSH. The only insecure-TLS legacy in the tree. **Highest-value α host residual.** `gen-mongo-certs.sh` + the `tls.md §9` diff are proven and ready.
3. **Dead `gallery` collection + `_entry_from_doc` + `GalleryEntryResponse` + 9 indexes** (§3.1) — never sunset despite the B.W5-close-ceremony promise in the gallery.py docstring.
4. **The migration runs are unexercised against real data** — both `migrate_visualization.py` (B) and `migrate_image_blobs.py` (C.W5) have only ever run against seeded fixtures (live dev DB empty, per Wχ-P2). The first prod execution of *both* is inherited by D/deploy. Count-parity proofs are real but conditional on a live Mongo.
5. **Mongo-less CI silently skips the load-bearing proofs** (§2) — 83 `@requires_mongo` skips include the migration count-parity, the C9 dedup regression, and the conformance behaviour. D should provision Mongo in CI or these proofs are vacuous (CA1 §2.2 raised this for B; C did not close it).
6. **Stale `image_storage.py:1` docstring** ("Binary blobs") (§1.2) — one-line doc-truth gap post-relocation.
7. **Named-but-deferred carries from FINAL §6 that D inherits**: the shared `/opt/deploy/dispatch.sh` rewrite (4 sibling repos); the precepts-submodule promotion of `tls.md`/`blob-backend-dr.md`/`deploy.md`; the `--reload` background queue; the δ `sampleToSVGPath` consume (value.js v0.10.0 still has no such export — `easings.ts:9-16` imports `timingFunctions`/`easeInOutSine` only; the local `generateCurveSVGPath` at `easings.ts:89` is the un-lifted candidate); the multi-replica/rate-limiter deferral; the C4.5/C4.6 visibility-transition guard struck from the matrix.
8. **Frontend bundle unsplit (867 kB)** (§3.4) — perf transposition candidate.

---

## §5 — Verdict

C is a **substantially honest `complete_with_host_residuals` close** whose repo-landable claims survive re-running every gate. The strongest waves — W5 (storage cutover: no dual-read, C9/C1/C10 all real and idiomatic) and the conformance fill (zero placeholders, 112 real asserts) — are clean fix-at-ROOT work with no new legacy. W1/W3 are clean repo-local. The discipline (research-first + Wχ probes catching the inv-18-defeating janitor orphan) demonstrably paid.

The single material gap is the same one CA1 caught in B, **inverted and re-committed**: the slug-identity convergence is gated by a **scope-limited grep** (`web/src`) that lets the FINAL claim "discharged at the ROOT" while the *backend* root — the `flags` collection field + unique index, the dead `snapshots` indexes, the `gallery` substrate, the models — still speaks `snapshot_hash` (a `content_hash` value under the retired name). It is acknowledged in admin.py comments (not silent) but it is unfinished convergence. C fixed the frontend half of B's residual and left a symmetric backend half. The secondary gap is the prod.yml `tlsAllowInvalidCertificates` (honestly named, now actionable with SSH). Neither is a silent miss; both let the headline read cleaner than the tree.
