# H3 — A.W4 / A.W5 / A.W6 hardening review

**Agent**: hardening H3 (A.W4 scaling/KISS/correctness · A.W5 admin · A.W6 close).
**Mode**: READ-ONLY. No edits.
**Date**: 2026-05-18.
**Inputs**: `docs/tranches/A/A.md`; `docs/tranches/A/waves/{W4,W5}.md`; `docs/audits/runs/2026-05-18-fourier-tranche/{e-…,f-…}.md`; `api/services/{janitor,rate_limiter,image_storage}.py`; `api/routers/{compute,gallery,admin}.py`; `web/src/components/visualization/gallery/Admin*.vue`; `web/src/components/equation/{FrequencyGraph,ConvergencePlot}.vue`; `docs/precepts/instructions/tranche/{WAVE_SPEC,DOC_UPDATE_WAVE}.md`; `docker-compose*.yml`; `.env.example`.

---

## 1. W4 finding re-verification

| # | Claim | Cite | Verdict | Concrete fix |
|---|---|---|---|---|
| W4-1 | Janitor builds an unbounded pinned-id Python `set` then passes it as `{"$nin": [...]}` — grows past 16 MB BSON limit, defeats indexes | `api/services/janitor.py:34-53` (sets built by full-collection scan of `snapshots`/`gallery`); `:63` (`"contour_hash": {"$nin": list(pinned_contours)}`); `:74` (`"image_slug": {"$nin": list(pinned_images)}`); `:103` (eviction `$nin` repeats this) | **CONFIRMED** | Replace with a per-doc `pinned: bool` flag. Maintain it on snapshot create / gallery publish / gallery tier change / gallery delete / cascade. Janitor stale-query becomes `{"last_accessed_at": {"$lt": cutoff}, "pinned": False}` — bounded, index-friendly. Migration: one-shot backfill at deploy that walks snapshots+gallery and sets `pinned=true` on referenced contours/images. |
| W4-2 | Rate-limiter buckets are process-local, fail silently under >1 replica | `api/services/rate_limiter.py:51` (`self._buckets: OrderedDict[str, _BucketEntry]`); `:110-113` global `login_limiter`/`like_limiter`/`write_limiter`/`admin_limiter` instances created at import; FastAPI dependency `:124` checks per-process state only | **CONFIRMED** | See §5 below — W0 must pick (a) document single-replica in `docker-compose.prod.yml` + deploy note, (b) move bucket to a Mongo TTL collection, or (c) explicit no-op. |
| W4-2b | `_suspended_cache` is process-local | `api/dependencies.py:24` (`_suspended_cache: dict[str, float] = {}` module-level); `:163-189` read/write helpers; invoked from `admin.py:274,308,350,424,434,443` | **CONFIRMED** — bound to (W4-2) decision; admin actions on replica B do not invalidate the cache on replica A, so a suspended user remains authenticated on B until TTL (60 s) | Same options as (W4-2). The honest single-replica path acknowledges a 60-s suspension lag on a second replica is unsafe; if multi-replica is the W0 choice, this cache must move to Mongo or be deleted entirely. |
| W4-3 | Contour-hash collision: `store_contour_asset` hashes `sorted(xs)` and `sorted(ys)` *independently*, collapsing distinct curves with the same coordinate multisets | `api/services/image_storage.py:180` (`points_payload = json.dumps({"x": sorted(xs), "y": sorted(ys)}, sort_keys=True)`); `:181` (hash of that payload) | **CONFIRMED — correctness bug** | Hash the *ordered* coordinate pairs as walked: `json.dumps({"x": xs, "y": ys}, sort_keys=True)` (drop both `sorted()` calls). Equivalent and arguably KISS-er: `json.dumps([[x, y] for x, y in zip(xs, ys, strict=True)])`. Regression test in §2. |
| W4-4a | `web/src/lib/logo.ts` — zero consumers | `git grep` for `from .*lib/logo`, `generateEpicycleLogoPath`, etc. returns *only* the file's own `export function generateEpicycleLogoPath` at `web/src/lib/logo.ts:57` and its own type definitions. No `import` site anywhere in `web/src/**`. (The only other hits are the build artefact `web/tsconfig.tsbuildinfo` cache — not a consumer.) | **CONFIRMED — dead** | Delete `web/src/lib/logo.ts`. |
| W4-4b | `web/src/lib/math-worker.ts` — zero consumers, never instantiated, carries the misleading `y[i]=t` placeholder | `git grep` for `new Worker`, `math-worker`, `mathWorker` returns *only* a doc-comment reference at `web/src/lib/evaluators.ts:3` (`"Used by both the main thread (bases.ts) and the web worker (math-worker.ts)."`). No `new Worker(...)` instantiation. `tsbuildinfo` lists the file because TypeScript compiles it; not a runtime consumer. | **CONFIRMED — dead** | Delete `web/src/lib/math-worker.ts`. Also fix the now-orphan comment at `evaluators.ts:3` (a one-word edit). |
| W4-4c | `api/routers/compute.py` — tombstone, no import | File contents: a single comment line, `# Compute router removed — merged into api/routers/contours.py` (1 line, 65 bytes). `git grep -E "from .*compute|import .*compute|compute_router"` in `api/**/*.py` returns matches only against `api/services/computation.py` and `submit_compute_job` / `require_compute_limit`, never `api/routers/compute`. | **CONFIRMED — tombstone** | Delete `api/routers/compute.py`. |
| W4-5a | Gallery has two duplicate paginated endpoints (offset + cursor) sharing filter-build logic | `api/routers/gallery.py:79` `@gallery_router.get("")` offset list; `:121` `@gallery_router.get("/cursor")` cursor list; `:92-104` vs `:134-145` are textually-duplicated filter blocks | **CONFIRMED — partial nuance** | Consolidate on the cursor endpoint. **BUT** the offset endpoint is still called from `web/src/stores/gallery.ts:32` `fetchPage()`, which is invoked from admin actions (`setTier`, `deleteEntry`, `flagEntry`, etc. — `gallery.ts:137,149,189,207`). W4 must therefore (i) migrate those store call-sites to `resetAndFetch()`/cursor before deleting the endpoint, or (ii) document an admin-specific refresh path. The wave plan says "frontend uses only cursor" — *not quite true today*; the migration step needs explicit listing in W4.b. |
| W4-5b | `count_documents` runs on every gallery list, including the cursor endpoint (O(n) on large collections) | `api/routers/gallery.py:106` `total = await db.gallery.count_documents(query_filter)` (offset); `:180` `total = await db.gallery.count_documents(base_filter)` (cursor — yes, the cursor endpoint *also* does it) | **CONFIRMED** | Cursor endpoint: drop `count_documents` outright; the response `GalleryCursorResponse.total` field becomes optional and the frontend stops reading it. (Spot-check `web/src/stores/gallery.ts:69,93` — both read `result.total`; consumer is purely cosmetic, e.g. "12 saved", so a brief carry to display nothing while the cursor walks is acceptable.) |
| W4-6 | Literal Mongo password embedded in both compose files | `docker-compose.yml:14` `MONGO_URI=mongodb://fourier-admin:cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb@…`; `docker-compose.prod.yml:8` same string; `docker-compose.prod.yml:47` again inside `mongosh` healthcheck `-p cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb` | **CONFIRMED — three call sites, not two** | Replace each with `${MONGO_ADMIN_PASSWORD}` (compose substitution) or move full `MONGO_URI` to the env. `.env.example:5,8` already lists `MONGO_URI` with `<password>` placeholder — add an explicit `MONGO_ADMIN_PASSWORD=…` line and rewrite the URIs to interpolate it. Rotate the password during W4 (it has shipped publicly in the repo). |

---

## 2. Contour-hash regression test — concrete colliding pair

Under the buggy hash `sha256(json.dumps({"x": sorted(xs), "y": sorted(ys)}, sort_keys=True))` two **distinct** curves collide whenever the multisets of x's and y's match. The minimal pair that demonstrates this:

```python
# Curve A — straight line from (0,0) to (1,1) — positive-sloping diagonal.
xs_A, ys_A = [0.0, 1.0], [0.0, 1.0]

# Curve B — straight line from (0,1) to (1,0) — negative-sloping diagonal.
xs_B, ys_B = [0.0, 1.0], [1.0, 0.0]
```

- `sorted(xs_A) == sorted(xs_B) == [0.0, 1.0]`
- `sorted(ys_A) == sorted(ys_B) == [0.0, 1.0]`
- ∴ the old hash maps both curves to the *same* `contour_hash`, and whichever was stored first will be served for both.

After the fix (`json.dumps({"x": xs, "y": ys}, sort_keys=True)`, no sort), the two payloads differ — `[0.0, 1.0]` vs `[1.0, 0.0]` in `y` — and the hashes diverge.

**Regression-test skeleton** (`api/services/__tests__/test_contour_hash.py`):

```python
import pytest
from api.services.image_storage import store_contour_asset

@pytest.mark.asyncio
async def test_contour_hash_distinguishes_swapped_y(db_clean):
    a = await store_contour_asset([0.0, 1.0], [0.0, 1.0], "img-a", source="test")
    b = await store_contour_asset([0.0, 1.0], [1.0, 0.0], "img-b", source="test")
    assert a["contour_hash"] != b["contour_hash"], (
        "Distinct curves with identical coordinate multisets must produce distinct hashes "
        "(regression for image_storage.py:180 sorted-axes bug)."
    )
```

A non-trivial second pair, useful as a secondary case to prove this is not a 2-point edge artefact:

```python
# Triangle with vertices (0,0), (2,1), (1,2) vs (0,1), (2,0), (1,2).
# Both have sorted xs = [0,1,2] and sorted ys = [0,1,2]; vertex orderings differ.
xs_C, ys_C = [0.0, 2.0, 1.0], [0.0, 1.0, 2.0]
xs_D, ys_D = [0.0, 2.0, 1.0], [1.0, 0.0, 2.0]
```

Sub-gate evidence per A.md §6: capture test output showing the pair fails on the pre-W4 hash code (run the test against the unchanged file, capture the `AssertionError` traceback) and passes after — both outputs attached to W4 close.

---

## 3. A.W5 admin scope verification

| Claim | Cite | Verdict |
|---|---|---|
| Native `confirm()` sites in Admin*.vue: count + locations | `AdminFlaggedPanel.vue:52` (`if (!confirm("Delete this gallery entry?"))`); `AdminUserList.vue:77` (`if (!confirm(\`Delete user "${slug}" and all their entries?\`))`); `AdminUserList.vue:89` (`if (!confirm("Delete all users with 0 gallery entries?"))`) | **CONFIRMED — exactly 3 sites.** Replace all three with the glass-ui `Dialog` (or the available `./confirm-dialog` subpath export) plus appropriate destructive-action styling. |
| Native `<select>` sites in Admin*.vue | `AdminUserList.vue:124-131` (sort dropdown) — exactly 1 native `<select>`. `AdminFlaggedPanel.vue` has none. `GalleryAdminBanner.vue` has none. | **CONFIRMED — exactly 1 site.** Replace with glass-ui `Select`/`SelectItem`. |
| Zero `aria-*` / `role=` attributes in the three admin files | `git grep -nE "aria-\|role=" -- 'web/src/components/visualization/gallery/Admin*' 'web/src/components/visualization/gallery/GalleryAdminBanner.vue'` returns **nothing**. | **CONFIRMED — 0 aria-* / role= attributes across all three components.** Each icon-only action button (`AdminUserList.vue:170,178,185`, `AdminFlaggedPanel.vue:119,126`) carries only `title=` — that is *not* an accessible name in screen-reader semantics. Add `aria-label="Suspend user"` / `aria-label="Unsuspend"` / `aria-label="Delete user"` / `aria-label="Dismiss flags"` / `aria-label="Delete entry"`. The user-list rows should pick up `role="listitem"` inside a `role="list"` container, or be migrated to a semantic `<ul>/<li>`. |
| Audit-log backend endpoint `admin.py:542` | `api/routers/admin.py:542` `@admin_router.get("/audit", dependencies=[Depends(admin_required)])`; `list_audit` returns `AuditListResponse` (line 579); supports `page`, `limit`, `action`, `after`, `before`, `target` filters | **CONFIRMED — endpoint exists, paginated, filterable.** Janitor retains audit rows for 90 days (`janitor.py:176-179`). |
| Frontend types `AuditEntry`/`AuditListResponse` | `web/src/lib/types.ts:218-230` — both interfaces present. `AuditEntry` fields: `timestamp`, `action`, `target`, `ip_hash`. `AuditListResponse` fields: `items`, `total`, `page`, `pages`. | **CONFIRMED.** No API-client wrapper exists yet (`web/src/lib/api.ts` has no `listAudit`); W5.b must add it (the wave plan names this in §3.b file bounds). |
| Batch endpoints `batch_gallery`, `batch_users` | `api/routers/admin.py:362` `@admin_router.post("/gallery/batch")` (`batch_gallery`, actions: `delete`/`feature`/`unfeature`); `:400` `@admin_router.post("/users/batch")` (`batch_users`, actions: `delete`/`suspend`/`unsuspend`) | **CONFIRMED — endpoints exist; range cited (362-451) accurate.** |
| No frontend caller of the batch endpoints | `web/src/lib/api.ts:526` `batchGallery(token, action, hashes)` and `:537` `batchUsers(token, action, slugs)` *exist as API-client wrappers*. `grep -rn "batchGallery\|batchUsers" web/src --include="*.vue" --include="*.ts"` returns matches **only at those two declaration sites** — no component calls them. | **CONFIRMED — half-wired**, with a slight refinement: an API-client wrapper exists (extending the dead-half by one layer), but no Vue component invokes it. Note: the frontend type declares the response shape as `{ processed: number }` while the backend returns `{ ok: True, "affected": <int> }` (`admin.py:397,451`). The W5.c implementation must reconcile this — it is a contract bug latent in unused code. |
| `FrequencyGraph.vue` log-scale `log10(amplitude+1)` un-annotated, axis unlabeled | `FrequencyGraph.vue:39` (`return props.logScale ? Math.log10(max + 1) : max;`); `:48` (`const val = props.logScale ? Math.log10(amplitude + 1) : amplitude;`). The only occurrence of the word "Amplitude" in the file is *inside the tooltip popover*, line 192 — never on the canvas axis. | **CONFIRMED.** Fix: add a y-axis label that reflects mode (linear: `\|c_n\|`; log: `log₁₀(1 + \|c_n\|)`) and an explanatory tooltip on the mode toggle. |
| `ConvergencePlot.vue` off-by-one — original curve stops one sample short because backend integrates with `endpoint=False` | Backend: `api/routers/equations.py:61` `np.linspace(domain[0], domain[1], req.n_eval_points, endpoint=False)`. The same `x_eval` (open right) feeds `original_points` (`equations.py:115`). Frontend: `ConvergencePlot.vue:181-186` walks `for (let i = 0; i < ox.length; i++)` — i.e. it draws the points it was given, which terminate at `domain[1] − (b−a)/N`, one sample short of the period close. | **CONFIRMED.** Fix: simplest honest correction is to switch the backend to `endpoint=True` for the *visualisation* sample grid (`original_points` and `reconstructed_points`), keep `endpoint=False` for any *integration* that requires it. Alternatively, the frontend can prepend/append a wrap point: `(domain[1], original_points.y[0])`. Pick the backend fix — it matches the paper's convention (the paper plots closed periodic curves at `[a, b]` with the wrap point included; see `paper/fourier_paper.tex` §epicycle figures) and removes the need for client-side stitching. Verify by visual comparison: the gold reconstruction curve already runs through `nPts=500` and closes; the grey dashed `original` does not. |
| Math-worker placeholder dependency check | The only file that mentions `math-worker.ts` is a *doc comment* at `evaluators.ts:3`. No Vue component imports or instantiates the worker. ConvergencePlot computes harmonics inline (`ConvergencePlot.vue:134,138-146`); FrequencyGraph derives display state from `props.components`. | **CONFIRMED — no surface depends on `math-worker.ts`.** Its W4 deletion is safe; W5 has no math-honesty fix gated on it. |

---

## 4. W6 close ceremony — alignment with DOC_UPDATE_WAVE

`A.md` §3 names W6 inline ("`PROGRESS.md` reconciled; `FINAL.md` cites every commit + gate; DOC_UPDATE run; `CONSTELLATION.md` updated; CRUD carry handed to tranche B"). `DOC_UPDATE_WAVE.md` requires the close to update *whichever exists* of: `PROGRESS.md`, `waves/W<N>.md` (Status + supersede), parent wave table, `FINAL.md` (on close), `LESSONS-LEARNED.md` (only for reusable process incidents). The close check: "The next wave does not open until docs say the same thing as the worktree." A.W6 is closing the *tranche*, so the bar is higher than per-wave close.

### Required A.W6 artefacts (checklist)

| # | Artefact | Owner | Source of truth |
|---|---|---|---|
| 1 | `docs/tranches/A/PROGRESS.md` reconciled — every wave status set to `complete` / `complete_with_misses` / `superseded`, with close commit, evidence path, and miss list | W6 agent | `git log`, wave specs, gate artefacts |
| 2 | `docs/tranches/A/waves/W{1..5}.md` each updated with `Status: complete[_with_misses]` and a close-summary block | W6 agent | per-wave gates |
| 3 | `docs/tranches/A/A.md` §3 wave-table status column reconciled | W6 agent | step 1 + 2 |
| 4 | `docs/tranches/A/FINAL.md` created — citing every commit (open commit, per-wave commits, close commit), every gate artefact (test outputs, screenshots, deletion proofs), every miss, every retire entry, every cross-tranche emission | W6 agent | full tranche scope |
| 5 | `docs/tranches/A/FINAL.md §debt` — any silent deferral re-stated; per A.md §8, named destination is tranche B (CRUD/identity convergence) or tranche C (infra) | W6 agent | A.md §8 |
| 6 | `coordination/CONSTELLATION.md` updated — fourier moves from "consumer node, no own letter" to "letter A complete: <summary>"; chronic items C1 (lands at W1) and P12 (lands at W3) marked discharged with commits; P CR-2 confirmation cited; the emitted item "A→glass-ui press-scale unification" filed against the next glass-ui tranche | W6 agent | A.md §8, glass-ui constellation file |
| 7 | CRUD-carry handoff: `docs/tranches/B/B.md` open (or stub) + `docs/tranches/B/coordination/CRUD-CONSTELLATION.md` opened, with the contour-hash *correctness* fix retained as A.W4 (per A.md §8) and the rest of CRUD/identity/value.js convergence quoted as B.R{1..4} research wave inputs | W6 agent | A.md §8 |
| 8 | `docs/audits/runs/2026-05-18-fourier-tranche/` — research artefacts kept in place, dated, referenced from `A.md §7` recap | unchanged | already present |
| 9 | Build green at close: `vue-tsc -b --force` exit 0; `npm run build` succeeds; `uv run pytest` green; `uv run ruff check` clean; `uv run mypy` where wired (A.md §6) | W6 agent + CI | command output captured in `FINAL.md` |
| 10 | Working tree clean at close (A.md §6) | W6 agent | `git status` |

### W6 gap analysis vs DOC_UPDATE_WAVE

- **Compliant.** A.md §3 names every output DOC_UPDATE_WAVE requires (PROGRESS, waves, parent table, FINAL).
- **Top gap.** DOC_UPDATE_WAVE does not mention a *constellation* update — but A.md §3 explicitly requires `CONSTELLATION.md` updated. This is a tranche-level extension; W6 must follow A.md, not DOC_UPDATE_WAVE alone. The W6 inline spec in A.md §3 is the load-bearing document.
- **Secondary gap.** DOC_UPDATE_WAVE mentions `LESSONS-LEARNED.md` "only for reusable process incidents". A had at least one (the four-recurrence K-invariant-3 shadow-execution pattern, A.md §1) — if W6 wants to break the chain it should add a `LESSONS-LEARNED.md` entry naming the recurrence and the remedy (own-letter tranche). This is *recommended* not required.

---

## 5. Rate-limiter strategy — options for the W0 challenge

The plan (W4 §2) explicitly defers the rate-limiter strategy to the W0 challenge. The decision must be made *honestly* against invariant 12 — no superfluous cloud, no overengineering. Three viable options, ordered by recommendation:

### Option A (RECOMMENDED) — single-replica, documented honestly

- Keep `SlidingWindowLimiter` and `_suspended_cache` exactly as-written.
- Add a `# IMPORTANT` block at the head of `api/services/rate_limiter.py` and `api/dependencies.py:22` declaring the single-replica constraint and the failure mode under scale-out (2× rate budget, up-to-60-s suspension lag).
- Pin `docker-compose.prod.yml` to `deploy.replicas: 1` for the `backend` service, with a comment citing the constraint.
- Add `docs/tranches/A/audit/W4-deploy-note.md` documenting both constraints and the migration trigger ("when traffic warrants horizontal scale, do option B then").
- Invariant 12 satisfied: scaling gap acknowledged, no superfluous cloud, no in-memory cache pretending to be durable.
- **Cost**: zero LOC change to runtime; one comment block, one compose line, one deploy note.

### Option B — Mongo-TTL bucket collection

- Replace `_buckets` with a `rate_limit_buckets` collection: `{_id: hashed_key, ts: <list of monotonic timestamps>, expires_at: <datetime>}`.
- Mongo TTL index on `expires_at` auto-evicts.
- `check()` becomes one `find_one_and_update` with `$push`+`$pull` (window prune in the pipeline).
- `_suspended_cache` collapses entirely — replaced by reading `users.{status,status_changed_at}` directly with an in-memory single-request cache.
- **Cost**: ~80 LOC; one new collection; one TTL index migration; per-hit DB round-trip (mitigable with a request-scoped cache).
- Pick only if W0 evidence shows multi-replica deployment is imminent or already in place.

### Option C (rejected for A but kept on the table) — explicit no-op

- Delete the rate-limiter entirely; lean on nginx (`limit_req_zone`) at the edge.
- Honest about removing fairness inside the app.
- **Cost**: deletion + nginx tuning.
- Acceptable only if W0 establishes that nginx-edge rate-limiting *plus* per-endpoint compute caps already provide the required guarantee. fourier currently has compute-job throttling (`computation.py` semaphore) but no edge rate-limit, so option C requires an nginx config change.

### Recommended W0 adjudication

Option A. Evidence for the recommendation: prod compose already runs one backend replica (`docker-compose.prod.yml` carries no `replicas:` clause and the deploy note in repo memory describes a single host); the audit `e-…md §5` explicitly calls "single MongoDB, single nginx, in-process janitor" as KISS-aligned; horizontal scale is not on fourier's roadmap inside tranche A. Invariant 12 is satisfied by *documenting the constraint*, not by adding Redis. If traffic crosses the threshold, file an option-B follow-up against a future tranche — do not pre-build.

---

## 6. WAVE_SPEC compliance — W4.md / W5.md

WAVE_SPEC.md requires 9 sections: 1 Header, 2 State, 3 Scope, 4 File Bounds, 5 Agent Units, 6 Hard Gate, 7 Verification Artefacts, 8 Dependencies, 9 Archaeology.

| Section | W4.md | W5.md |
|---|---|---|
| 1 Header | ✓ (`# A.W4 — Scaling, KISS & correctness pass`) | ✓ (`# A.W5 — Admin parity & functionality close`) |
| 2 State (Opens-after / Agents / Hard-gate / Status) | ✓ all four lines present | ✓ all four lines present |
| 3 Scope (numbered, no "if time allows") | ✓ 6 numbered items, all concrete | ✓ 4 numbered items, all concrete; item 4 has nested sub-bullets — still concrete |
| 4 File Bounds (table + "Do NOT touch") | ✓ table + "Do NOT touch" line present | ✓ table + "Do NOT touch" line present |
| 5 Agent Units (Mechanism / Files / Sub-gate per unit) | ✓ three units (a/b/c), each with all three fields | ✓ four units (a/b/c/d), each with all three fields |
| 6 Hard Gate (numbered, evidence-backed, named commands) | ✓ 7 numbered conditions, each names artefact or command | ✓ 6 numbered conditions, each names browser evidence, screenshot, or build command |
| 7 Verification Artefacts | ✓ named outputs (test outputs, deletion proofs, deploy note) | ✓ named outputs (screenshots, a11y check) |
| 8 Dependencies (Depends on / Blocks) | ✓ present | ✓ present |
| 9 Archaeology | ✓ present (no prior attempt; guardrails cited) | ✓ present (audit-log substrate landed without consumer at W1) |

**Verdict**: both specs are WAVE_SPEC-compliant. Minor improvements possible but not required:

- W4.md hard-gate #6 ("No literal credential in any tracked file") names a `git grep` proof — clean.
- W4.md hard-gate #2 ("Rate-limiter: the W0-challenge decision is implemented and the constraint is documented in the deploy surface") is conditional on W0 — the W4 spec should *not* land until W0 closes. The dependency line ("Depends on W1; W0 challenge") names this correctly.
- W5.md hard-gate #2 ("a11y check") should name the *specific* tool / approach (axe-core, manual screen-reader pass, or a documented checklist) — currently "an a11y check passes" is slightly vague by gate-on-evidence standards (invariant 6). Recommend pinning it to a named approach in W5 before dispatch.
- Neither file violates the prohibitions (no stubs, no forward hooks, no hidden cross-wave conflicts, no grep-only runtime gates, no wave close without docs).

---

## 7. Cross-file ownership cross-check

A.md §5 says `api/services/image_storage.py` is touched at W4 (hash only) and again, structurally, by tranche B — sequential, no conflict. The W4 carve is exactly two lines (lines 180 + 181) plus the regression test. No other file lives at the W4/W5 boundary; W5 owns Vue admin + equation components, W4 owns api services + routers + Docker/env + two dead lib files. Confirmed clean.

---

## 8. Summary verdicts

- **W4 findings**: 6 of 6 re-confirmed at the cited line numbers. Refinements: (1) the compose-password literal exists at *three* sites, not two (the prod healthcheck `mongosh -p` is the third); (2) the offset-gallery-endpoint claim that "frontend uses only cursor" is *not quite true* — `gallery.ts:fetchPage()` still drives admin actions via the offset endpoint, so W4.b must consolidate those callers before dropping the endpoint, or document the deviation.
- **Contour-hash regression test pair**: `([0,1],[0,1])` vs `([0,1],[1,0])` — two-point diagonals with identical sorted axes, distinct curves. Hash collides under current code, diverges under fixed code.
- **W5 admin scope**: 3 `confirm()` sites, 1 `<select>`, 0 `aria-*` attributes, audit-log backend exists with frontend types but no API-client wrapper and no viewer, batch endpoints exist with API-client wrappers but no Vue caller and a latent response-shape contract mismatch. `FrequencyGraph` axis-label and `ConvergencePlot` `endpoint=False` claims both confirmed at the cited lines.
- **W6 gap**: A.md §3 is the load-bearing W6 spec — DOC_UPDATE_WAVE.md does not by itself require the `CONSTELLATION.md` update or the CRUD-carry handoff to tranche B. A.W6 must follow A.md §3, not DOC_UPDATE_WAVE alone. Recommend adding a `LESSONS-LEARNED.md` entry for the K-invariant-3 four-recurrence pattern (optional but high-value).
- **Rate-limiter recommendation for W0**: **Option A — single-replica documented honestly**, with `docker-compose.prod.yml` pinned to `replicas: 1` and an explicit deploy note at `docs/tranches/A/audit/W4-deploy-note.md`. Evidence: prod is already single-replica, the audit names this as KISS-aligned, invariant 12 is satisfied by documenting the constraint, no horizontal-scale workload is in scope for tranche A. Option B (Mongo TTL) is the *future* move when traffic warrants it — file as a B-or-C-tranche follow-up, do not pre-build.
