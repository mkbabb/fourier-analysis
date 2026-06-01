# H — Phase 0 findings (W0 open + Wα research-light + Wχ challenge)

**Mode**: 5-lane READ-ONLY research workflow (`wf_0f450d3c-a24`, 2026-05-31), 2 Wα lanes + 3 Wχ probes. This is the binding research record the §3 schedule says is "hardened at Wχ." Substrate for the implementation waves W1–W9. No implementation ran in Phase 0.

**Live baseline reconciled at open.** fourier CI run `26720618455` (HEAD `f2fe447`): **`web` ✅ + `api-tests` ✅ + `e2e (Playwright)` ❌** — after the post-G fix `b28c3fa`, the *single* remaining red job is `e2e`. The audit's "CI red on every G commit" is confirmed; H.α is now surgical to one job.

## W0 — the two "cheapest γ" items, reconciled honestly

1. **Phantom KaTeX `local()` faces (`web/src/style.css:56–67`) — LANDED (real bug, not dead code).** `main.ts` imports `katex/dist/katex.min.css` (line 5) **before** `./style.css` (line 6). KaTeX's CSS declares the real `url()`-backed faces (`KaTeX_Main-*.woff2`, self-hosted same-origin since G.W5). The 12 removed rules declared the same families with `src: local(...)` only — no `url()` fallback, default `normal/400` descriptors. Declared *after* katex.min.css, they **won the cascade** for the regular weight and, since `local("KaTeX_*")` resolves on ~no visitor's OS, degraded those glyphs to the serif fallback. Removal restores the real faces. Verified: `vue-tsc -b` + `vite build` green post-edit.
2. **Aware/naive datetime edge (`softdelete.py:66`) — ALREADY GUARDED; honest no-op (no manufactured fix).** Surveyed all ~30 `api/` datetime sites. The edge is guarded **twice over**: (a) `database.py:28` constructs the Motor client `tz_aware=True`, so every datetime round-trips as aware UTC; (b) `softdelete.py:64–65` explicitly `replace(tzinfo=UTC)` before the line-66 compare (since B.W3 `52bdcf5`). `janitor.py:125`'s grace hard-delete is a server-side Mongo `$lt` query (no Python compare). **Zero unguarded Python-side naive/aware comparisons remain.** inv-27 forbids claiming a fix that already exists — the audit read a stale snapshot. A *regression test over a naive stored row* (proving the guard holds) is the honest γ contribution and is folded into **W4** (the γ gate names exactly "a test over a naive-row delete").

## Wα.1 — e2e scope (the audit was right in kind, wrong in magnitude/breadth)

`e2e` job (run `26720618455`): **23 failed / 18 did-not-run / 3 passed**. Bare `input[type=file]` count is **16 across active specs** (not ~51). **Four independent breakage classes — the locator fix is necessary but INSUFFICIENT:**

| Class | Specs | Fix |
|---|---|---|
| **(A) dual-file-input strict-mode** | contour-extraction (18,50,99,144), workspace-flow (15,38,59,103,154,185), visualization-ux (48), gallery (86) | Add `data-testid="image-file-input"` to `ImageUpload.vue`'s `<input>` (120–126); replace bare `page.locator('input[type="file"]')` → `page.getByTestId('image-file-input')`. **NOT `.first()`** — `.first()` resolves to the *VisualizationView canvas input* (the WRONG one); the panel input is the 2nd match. |
| **(B) stale "Drop an image" text** | visualization-crud (167–169) | Real copy is `'Drop or click to upload'`; also retarget its `.first()` input (171) → `getByTestId`. |
| **(C) stale gallery selectors** | gallery (8–10/26–27 tabs; 100–101 overlay) | `.bouncy-btn` Gallery/Drafts tabs → glass-ui `UnderlineTabs` (`getByRole('tab', {name})`); `.absolute.top-2.right-2.z-20.flex`/`.glass-btn` overlay → migrated into `CanvasControlsDock` (aria-label idiom). |
| **(D) stale paper page-count** | paper-performance (41/105 `pg 4/97`; 148/155 DFT page 59) | Paper grew 97→110. **Make growth-tolerant** (assert `/pg 4\/\d+/` + the page number, not the exact total) rather than re-hardcoding 110 (which would drift again); re-derive or content-anchor the DFT section jump. |
| **(skip) dead-stale** | settings-persistence (wholly `test.describe.skip()`) | Targets the removed `/api/sessions/{slug}` session API + `/s/` routes. Doesn't contribute to the red (skipped) but is dead. **W1 decides rewrite-for-asset-arch vs delete** (NO-legacy: do not leave a skipped dead block). |

Dispositions: contour-extraction/workspace-flow/visualization-ux = **real (locator-only)**; gallery/visualization-crud = **mixed**; paper-performance = **stale**; settings-persistence = **todo-rewrite**.

## Wα.2 — inv-28 deploy-gate mechanism

- **SPA arm (deploy-pages.yml) → `workflow_run` gate.** `on: workflow_run: workflows:[CI], types:[completed]`, deploy job `if: conclusion=='success' && head_branch=='master' && event=='push'`. Three forced details: (1) `workflow_run` drops `paths:` → re-add the `web/**` filter via a leading `changes` job (`dorny/paths-filter` or `git diff` on `head_sha`) the deploy `needs:`; (2) pin **every** ref to `${{ github.event.workflow_run.head_sha }}` (`actions/checkout` `ref:`), else it builds master-tip; (3) fork-PR secret safety preserved by the `head_branch=='master' && event=='push'` guard. Keep `workflow_dispatch`.
- **API arm (webhook → host deploy-hook.sh).** The host has **no `gh`, no token** today (confirmed across the deploy repo + `/opt/deploy/.env`). Two gates: **(A)** fail-closed `commits/<sha>/status` precondition inside `deploy-hook.sh` after `new` is computed, reading a host-only 0600 read-only PAT (reuses the `render-hooks.sh` host-secrets precedent); parameterized in the template, **no-op when the token var is empty** so other repos inherit cleanly. **(B)** a `workflow_run`-driven `deploy-api.yml` that re-emits the webhook only on CI-success (no host token, but requires disabling the native push-webhook to avoid double-fire + an HMAC GH secret). **Decision for H**: land **gate (A)'s parameterized no-op block** in `scripts/deploy-hook.sh` + `deploy/templates/deploy-hook.sh` (in-bounds source); **book the host PAT provisioning + activation to ζ/W8** (operator-coordinated, inv-21). inv-28's "demonstrated to refuse a red SHA" is satisfied on the SPA arm now.
- **Bootstrap**: neither arm can gate-on-green until a green master CI run exists → **W1 precedes W2**.

## Wχ.1 — WORKERS=1 blast radius: **RATIFIED (complete + regression-free)**

Exhaustive `api/` grep: **4 module-level mutable sites + 1 background subsystem.** Only **two** are true per-process divergences (both audit-named): `_suspended_cache` (`dependencies.py:27`, un-booked — suspend/un-suspend stays stale on 3/4 workers ≤60 s; self-heals at TTL, DB is source-of-truth) and the 5 `rate_limiter` singletons (`rate_limiter.py:152–160`, booked — ~4× budget leak). **Bonus find:** the janitor loop (`main.py:43`) runs ×4 → 4× duplicated `admin_audit` rows (redundancy, **not** corruption — all ops idempotent Mongo writes); WORKERS=1 collapses it to one clean loop. SAFE (not divergences): `_semaphore` (`computation.py:19`, correctly per-process — an `asyncio.Semaphore` only gates its own loop), `_idem_store` (DB-handle only), `_client/_db` (required per-worker Motor handles). `compute_cache` + `idempotency` confirmed Mongo-backed/cluster-safe. **Sole tradeoff**: single-core serving throughput — acceptable (async I/O-bound; CPU-bound compute is `to_thread`-offloaded + independently bounded; `replicas:1` invariant; nginx is the governor). **`WORKERS=4→1` closes both divergences + the janitor dup, no Redis, no shared store.**

## Wχ.2 — rate-limiter convergence: **KEEP-APP-ENFORCER (converge DECLINED)**

Converge-to-nginx-reporter is **rejected on elegance grounds** — it would: (1) make nginx speak `problem+json` on breach via a hand-written `error_page` body = a **second drifting copy** of the `errors.py:77` catalog envelope (the exact anti-pattern G's inv-26 deleted); (2) be unable to emit the honest RFC-9239 `RateLimit-*` trio (nginx has no per-window snapshot); (3) push 5 method-sensitive budgets into rate-only `limit_req` = *more* config. The "app tighter than edge, app = reporter" end-state the audit wants **already holds**, and **WORKERS=1 is what makes it honest** (the in-memory buckets become true single buckets). nginx stays the coarse spoof-proof DoS backstop (G.β.2 real_ip). **inv-24 (app = sole RFC-9239 emitter + sole `problem+json` 429) preserved untouched — non-negotiable.**

**W3 lands (small):** (1) **delete the orphan `api_upload` nginx zone** (`fourier.conf:18` — declared, never applied at any location: dead config); (2) refresh the stale ~4×-leak caveat comment (`rate_limiter.py:147–151`) now that WORKERS=1 closes it. **Book as deliberately-declined:** the nginx-problem+json convergence (recorded considered-and-rejected, so no future tranche re-litigates). **Do NOT** amputate the app limiter; **NO** Redis.

## Wχ.3 — inv-16′ sweep scope (with corrections)

The CI reds are **one cascade** from the un-propagated `163ca47`-style vendor-seam → `^published` migration. Verified from the actual files:

| Repo | State | Root cause | Fix (idiomatic, no workaround) | Order |
|---|---|---|---|---|
| **value.js** | red (ci + Node.js CI) | `npm ci` ERESOLVE: `unplugin-vue-markdown@29.2.0` vite peer caps at `^7`, root is `vite@^8.0.13`. + residual `file:../glass-ui`,`file:../keyframes.js` devDep seams | bump `unplugin-vue-markdown ^29.2.0→^32.0.0` (first w/ `^8.0.0-0` peer; 30/31 still cap at 7) + seams→`@mkbabb/glass-ui:^3.0.0`,`@mkbabb/keyframes.js:^2.1.1` + `npm install` lockfile regen | **1 (head)** |
| **keyframes.js** | red | lockfile drift (EUSAGE `@popperjs/core`) + `@mkbabb/glass-ui: file:../glass-ui` (L64) | seam→`^3.0.0` + `npm install` regen (clears EUSAGE + TS2307 once value types resolve from registry) | **2** |
| **glass-ui** | red | **pure lockfile drift** — package.json already `^published`, lockfile still `link:true → ../keyframes.js/../value.js` | `npm install` regen only (no package.json change) | **3** |
| **words** | SPA un-published (404 outage) | no CF-Pages/deploy-pages workflow; `frontend/` has no lockfile | add `deploy-pages.yml` + `scripts/pages-deploy.sh` (fourier δ model) + commit `frontend/package-lock.json`; separately guarded `glass-ui ^2→^3` bump | 4 |
| **speedtest** | **no CI** (deps registry-clean) | no `.github/workflows/` | add `ci.yml` gate (setup-node 24, npm ci, type-check/test/build). **Deploys to `speedtest.friday.institute`, NOT babb.dev.** | 5 (any time) |

**Corrections to the brief:** `~/Programming/colors` is a **2021 pure-TS color util** (`@mkbabb/colors@1.0.1`), **NOT** the api.color FastAPI service. **api.color / api.sudoku / csp-solver are ABSENT from the local clone set** → their route-mount fixes (api.color `/health`,`/docs`,`/openapi.json` unmounted; api.sudoku `/api/v1/solve` prefix `/v1`→`/api/v1`) are **verify-then-fix in their own repos**, booked **DEFERRED** (cannot be done blind). value.js/keyframes/glass-ui consume the **already-published** registry versions — the fixes are lockfile/peer regens, **no new publish required**.

**inv-16′ execution guardrails (team-lead):** each sibling repo is checked for a **clean working tree + no mid-tranche divergence** (worktrees `glass-ui-w234-V`, `keyframes-wt-H-W2-verify` exist — those repos may be in flight) BEFORE any edit; verified `npm ci`-green locally BEFORE push; each its own commit booked to an `ADOPTION-ASKS` entry, per-repo green-CI-gated (inv-27). **Anything dirty/mid-flight/absent stays booked with its owner** — inv-16′ enables, it does not compel.

## Hardened wave schedule (post-Wχ)

W1 (e2e repair — 4 classes, not just locator; + inv-27) → W2 (inv-28: SPA workflow_run gate LAND + API gate-A no-op block + host PAT booked to ζ) → **W3∥W4∥W5** source-disjoint (β WORKERS=1 + dead-zone delete + T2-decline; γ hardening + CSP + datetime regression-test; δ 4th-island + no-codegen + symmetric-name-retire) → W6 (ε cascade value.js→keyframes→glass-ui, guarded) → W7 (ε speedtest ci.yml + words SPA; api.color/sudoku deferred-booked) → W8 (ζ host render-hooks + DNS + friday.institute + API-gate host token + dispatcher + stale-watch) → W9 (close).
