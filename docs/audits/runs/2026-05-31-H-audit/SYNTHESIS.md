# H-audit SYNTHESIS — the binding scope for tranche H

**Mode**: 6-lane parallel READ-ONLY audit (HA1–HA6), 2026-05-31, informing fourier-analysis **tranche H** (successor to G). Tranche DEVELOPMENT only — no implementation ran. **Substrate**: `HA1-g-execution.md`, `HA2-constellation-ci-deploy.md`, `HA3-invariants-gates.md`, `HA4-chronic-deferred.md`, `HA5-transpositions.md`, `HA6-prompts-precepts.md`. **Predecessor**: G closed GREEN-labeled at fourier `5e29ed0` (+ `b28c3fa`) + deploy `a7b58ab`.

## §0 — The verdict

G's close **survives falsification on its load-bearing claims** (HA1/HA3 independently reproduced pytest 132/83, vue-tsc+build, T7 12/12, δ live 3→0, inv-22 fourier-side, β.2 per-client, inv-25 SPA automated). δ is genuinely live and clean; β.2 is correct; backend read_only is sound; the γ excision broke nothing live. **But the audit caught ONE material overstatement and ONE structural defect that are the same honesty class that birthed inv-25** — and a set of completion/elegance transpositions the "perfect the above / elegance-simplicity-performance above all" mandate now makes first-class.

## §1 — The overstatement + the structural defect (H's spine)

1. **"CI green" is FALSE (HA1/HA3/HA6 — the headline).** `G/FINAL.md §2` marks pytest/vue-tsc/build/T7 ✅, reading as "CI green." Reality: the `CI` workflow has been **`failure` on every G commit — including the W9 close `5e29ed0` (run `26695317377`) and the post-close fix `b28c3fa` (`26719598467`, today)**. G verified the gates LOCALLY and cited only the cheap CI jobs (vue-tsc/build/no-Mongo-pytest); the `e2e (Playwright)` job fails wholesale, and `api-tests` couldn't even spawn pytest until `b28c3fa`. This is the exact shape that birthed inv-25 (claim "verified" against a red surface), now applied to test signal. → **inv-27 (green-means-green).**
2. **The deploy-of-record is decoupled from CI (HA3/HA5 — the deeper defect).** deploy-pages (SPA) and the webhook (API) ship a SHA **regardless of its CI status** — they only type-check; they run zero tests. G's cited SPA `deploy_run_id 26695021489` shipped `6868e8d` whose **same-SHA CI run `26695021490` FAILED**. The webhook shipped G to prod while CI was red — the H analog of F's silently-dead auto-deploy. "Automated" ≠ "verified." → **inv-28 (verified-deploy-of-record: the deploy path ships only a green-CI SHA).**

## §2 — The e2e root cause (the chronic broken gate — HA1/HA2/HA4/HA5 converge)

The `e2e (Playwright)` suite fails on a **deterministic strict-mode locator violation**: `input[type="file"]` resolves to **2 elements** (`ImageUpload.vue:122` + the later `VisualizationView.vue:201` `canvasFileInput`); `contour-extraction.spec.ts` uses a bare locator without `.first()`/role-scoping (51×). **G did NOT cause this** — both file inputs pre-date G; G's W1 submodule-checkout fix (`1174211`) merely UNMASKED a suite that, at F head, failed at the checkout step and never ran. This is a **chronic broken gate (D→E→F→G)** that every prior close disguised as the cosmetic "E2 cross-env matrix" deferral while the chromium suite itself was red. **Top-priority H fold**: scope the file-input locator + refresh the stale specs (some assert against the pre-asset UI; one is TODO'd for rewrite).

## §3 — The transpositions (elegance / simplicity / performance — the mandate)

- **T1 — `WORKERS=4` → `WORKERS=1` (TOP; HA5).** `api/Dockerfile:32` runs uvicorn `--workers 4` while `docker-compose.prod.yml` pins `replicas: 1` and inv-12 / A-Inv 12 is literally *"single-replica posture."* WORKERS=4 is four in-process replicas that contradict the named invariant and break the only two per-process subsystems: the rate limiter (the *booked* residual — "180/client" is really ~720) AND **`_suspended_cache` (`dependencies.py:27`) — an UN-booked correctness bug**: `mark_suspended_in_cache` marks 1 of 4 workers, so a suspended account stays live on ¾ of workers for ≤60 s. `compute_cache` + idempotency are Mongo-backed (cluster-safe). **WORKERS=1 removes three problems and adds nothing** — no Redis, no contrivance; nginx (30 r/s/client, per-client after β.2's real_ip) is the real governor. Closes the inv-12 claim↔reality gap.
- **T2 — rate-limiter → nginx convergence (after T1; HA5).** The app limiter CANNOT be fully amputated — it is the sole emitter of the RFC-9239 `RateLimit-*` headers + the problem+json 429 (inv-24). nginx already enforces per-client at the edge. The elegant end-state: nginx speaks problem+json on breach; the app limiter demotes to the RFC-9239 *reporter* with budgets honestly tighter than the edge. Assess at Wχ; secondary to T1.
- **T3 — inv-26 honest completion, NO codegen revival (HA5 over HA3).** Adding `response_model=` to the visualization routes would FIGHT the manual ETag + `_public_doc` projection (FastAPI ignores `response_model` when a raw `Response` is returned) → a schema that LIES about the bytes. **G correctly deleted the codegen; H does NOT reverse it.** inv-26's honest end-state is hand-typed-canonical: consolidate/assess the 4th hand-type island (`web/src/lib/equation/types.ts`, 10 importers) and relabel inv-26 honestly (the boundary is hand-verified, machine-verification declined-with-rationale).
- **T4 — stack hardening + CSP completion (HA1/HA4/HA5).** Backend is at the read_only floor; frontend/mongo/nginx are not (the known per-image tmpfs/cap recipe). And CSP is entirely absent — G's font self-hosting (0 third-party origins) makes `font-src 'self'` / a `_headers` CSP a FREE security win.

## §4 — The constellation (HA2 — "perfect the above")

- **The CI reds are ONE cascade, not 8 breakages.** The `163ca47` vendor-seam → `^published` migration the consumer repos never did: **value.js** (`npm ci` `ERESOLVE` — vite@^8 vs unplugin-vue-markdown peer `<=7`, the ROOT) → **keyframes.js** (`file:../value.js` sibling seam, absent in CI → TS2307) → **glass-ui** (lockfile still pins `file:../keyframes.js`). Fix order: value.js → keyframes → glass-ui. The published `@mkbabb/*` all exist on npm.
- **No-CI repos**: words, speedtest, csp-solver (only a `deploy.yml.disabled`) — the Ask-1 targets; `deploy/templates/ci.yml` is the lever.
- **API route gaps**: api.color (value.js) `/health`/`/docs`/`/openapi.json`→404 (routes unmounted); api.sudoku `/api/v1/solve`→404 (router mounted at `/v1` not `/api/v1` — a prefix mismatch, N4).
- **words.babb.dev** — genuine outage (404 everywhere); the webhook deploys only a backend, the SPA publish is un-automated (same family as G's δ-never-shipped).
- **speedtest = `speedtest.friday.institute` (SCOPE CORRECTION, HA2/HA6).** `speedtest.friday.institute`→200; `speedtest.babb.dev`→404 is EXPECTED. speedtest is a SEPARATE suite that retains a babb.dev *deploy webhook arm* (shared host/dispatcher) but serves a different domain. All prior "speedtest.babb.dev down / :8140 vhost teardown" framing (D/E/F/GA2/survey) is a **category error to be retired, not re-asserted.** "Handle speedtest regardless" = CI (Ask 1) + deploy-arm migration (Ask 2) + doc the model — all domain-agnostic.
- **Deploy spine — applied-vs-authored gap.** G's `render-hooks.sh` is NOT on the host: `/opt/deploy/hooks.json` still carries the **inline plaintext HMAC literal**. `dispatch.sh` is still live (4 non-fourier repos route through it). Operator-coordinated application.

## §5 — The inv-16 decision (HA2 — enabling "perfect the constellation")

inv-16 (fourier commits touch only `fourier-analysis/** + deploy/**`) protected ONE honesty property: **no SILENT cross-repo mutation.** The user owns ALL `mkbabb/*` repos and explicitly wants the constellation perfected. **Adopt inv-16′**: cross-repo writes are permitted ONLY under an explicit, user-authorized, NAMED, ledgered sweep — each its own commit, booked to an `ADOPTION-ASKS` entry, with the same per-repo green-CI gate (inv-27). This preserves the honesty inv-16 actually protected while making the asks (rotting OPEN since F) executable. fourier's own e2e/CI fixes need no such authorization (in-bounds).

## §6 — Chronic + deferred (HA4 — fold decision; 24 OPEN of 30)

**FOLD-INTO-H (fourier+deploy-actionable):** e2e repair (H1, the chronic ≥4-close gate) · DNS tuple drift (`dns-cf-sync.sh` says `fourier.pages.dev`, live is `fourier-682` — deferred 3 closes; a re-run regresses live CNAMEs) · WORKERS=1 · compose hardening floor · CSP · 4th hand-type island · phantom KaTeX `local()` face · aware/naive datetime edge (`softdelete.py:66`) · render-hooks host application (operator-gated). **CROSS-REPO (inv-16′ sweep / ASK):** the constellation CI cascade · the 7 adoption asks · api.color · sudoku /solve · words · value.js-J cluster (E4–E7). **STAYS-OUT, re-affirm with predicate (do NOT silently re-defer an 8th time):** C1 colour-lift (value.js publish-bound), C5/C6 glass-ui (6-gate, structurally cross-repo). The "Node20→24 Actions deprecation" is NOT an item (actions are @v4 / node 22).

## §7 — The H must-NOT list (scope ceiling)

1. NO Redis / shared-store for rate-limiting — WORKERS=1 + nginx is the gestalt (manufactured infra).
2. NO `response_model=` codegen revival — it makes the schema lie about the ETag/projection bytes (HA5).
3. NO amputating the app rate-limiter — it is the inv-24 RFC-9239 emitter; converge, don't delete.
4. NO SILENT cross-repo mutation — every cross-repo edit is an authorized, named, ledgered inv-16′ sweep with its own green-CI gate.
5. NO blind `read_only`/`cap_drop` on mongo/nginx without the per-image tmpfs/cap recipe + a staging/health verify.
6. NO re-asserting "speedtest.babb.dev" — it is `speedtest.friday.institute`; retire the category error.
7. NO "green" claim at any H close without a cited green run id covering EVERY job (inv-27, the thing H exists to install).
8. NO re-forking the deploy-hook (ζ-owned, converged in G); NO chasing manufactured perf.

## §8 — Proposed H threads (6) + 3 new invariants

- **H.α — green-means-green (the spine)**: repair the fourier e2e suite (file-input locator scope + stale-spec refresh) → fourier CI **fully green (all 3 jobs)**; author **inv-27**; wire **inv-28** (deploy-of-record gated on a green same-SHA CI run); correct G/FINAL's CI-green rows honestly.
- **H.β — WORKERS=1 (the top transposition)**: `WORKERS=4→1` — closes the inv-12 claim↔reality gap, fixes the `_suspended_cache` correctness bug, dissolves the rate-limiter per-process residual; assess the rate-limiter→nginx convergence (T2).
- **H.γ — stack hardening + perf finish**: compose hardening floor for frontend/mongo/nginx (per-image tmpfs/cap); CSP via a `_headers` file (free, 0 third-party origins); drop the phantom KaTeX `local()` faces; guard the aware/naive datetime edge.
- **H.δ — contract honesty**: inv-26 honest completion (consolidate the 4th hand-type island; document the NO-codegen-revival decision); retire the misleading `F-Inv 22*` "vhost-correctness-symmetric" name (§2.7 already retracts what the name asserts).
- **H.ε — constellation perfection (inv-16′ authorized sweep)**: the vendor-seam CI cascade (value.js→keyframes→glass-ui green); adopt CI into the no-CI repos (words/speedtest/csp-solver via the template); the api.color + sudoku-`/solve` route gaps; the words SPA publish. Each its own commit, booked to an ask, per-repo green-CI-gated.
- **H.ζ — spine application + coordination + close**: apply `render-hooks.sh` on the host (operator-gated, inv-21); reconcile the DNS tuple drift; record the friday.institute model correction; advance `dispatch.sh` retirement; re-trigger the stale-watch; the prompt-recap completion.

**Three new invariants**: **inv-27 — green-means-green** (a "tests/CI pass" claim cites a green run id covering EVERY job, or enumerates+books each red one). **inv-28 — verified-deploy-of-record** (the automated deploy path ships only a SHA whose same-SHA CI is green; composes with inv-25). **inv-16′ — authorized-cross-repo-sweep** (cross-repo writes only under an explicit, named, ledgered, per-repo-green-CI-gated sweep; the honesty refinement of inv-16).

End of SYNTHESIS.
