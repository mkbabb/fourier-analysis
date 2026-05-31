# H — green-means-green + honesty-in-full + the WORKERS=1 transposition + constellation perfection

**Tranche letter**: H — fourier-analysis's CI-honesty + single-replica-elegance + constellation-perfection tranche; successor to G (which closed GREEN-labeled but, the re-audit found, while CI was RED).
**Predecessor close**: G — `docs/tranches/G/FINAL.md` at fourier `5e29ed0` (+ `b28c3fa`); deploy-repo (`mkbabb/deploy`) `a7b58ab`.
**Mode**: **direct** for the fourier-source threads (α/β/γ/δ — source-bounded, strongly-gated); **research-light** for α's e2e scope + inv-28 mechanism and **inv-16′-authorized + per-repo-green-CI-gated** for ε (cross-repo); ζ is host/operator-coordinated (inv-21 capture-before-mutate + receipts).
**Authored**: 2026-05-31 — from the user's directive "DEEPLY audit with 6 agents in parallel… devise a path forward… architectural transpositions for elegance, simplicity, and performance above all… NO legacy code… delineate chronic + deferred and fold them… recap ALL prompts… we should plan to perfect the above… NOT an implementation phase. Tranche development only." Substrate: the 6-lane H-audit `docs/audits/runs/2026-05-31-H-audit/` (HA1–HA6 + SYNTHESIS).
**Open**: TBD (after user authorises H.W0).

## §0 — Goal criterion and completion criterion (paired)

**Goal criterion.** Land **six threads** that (a) make "green" TRUE — repair the chronic-broken e2e gate so fourier CI is fully green, and install the invariants that forbid claiming otherwise (inv-27) and shipping otherwise (inv-28); (b) land the single highest-leverage elegance transposition (WORKERS=1, which also fixes an un-booked correctness bug); (c) finish the stack hardening + CSP; (d) make the contract + invariant claims honest (inv-26 completion, the "symmetric" name retired); (e) **perfect the constellation** under an authorized cross-repo sweep (inv-16′) — every repo's CI green or honestly booked; (f) apply the deploy-spine on the host + reconcile the live-vs-code drifts. H is the *honesty-in-full + single-replica-elegance* tranche: every thread either makes a claim true, removes a per-process replica, removes a third-party gap, or removes a red CI.

- **α — green-means-green** *(correctness/honesty; top priority)*: the `e2e (Playwright)` job has been RED since before F (a dual `input[type=file]` → strict-mode locator violation in `contour-extraction.spec.ts`; G's W1 checkout-fix UNMASKED it). Repair the locator (`.first()`/role-scope) + refresh the stale specs (some assert against the pre-asset UI). fourier CI must go **fully green — all three jobs**. Author **inv-27 (green-means-green)** and **inv-28 (verified-deploy-of-record)**: wire the deploy path (deploy-pages + the API webhook gate) to ship only a SHA whose same-SHA CI is green. Correct `G/FINAL.md`'s CI-green gate rows honestly.
- **β — WORKERS=1** *(the top transposition; inv-12 honesty)*: `api/Dockerfile` runs uvicorn `--workers 4` against a `replicas: 1` compose + the inv-12 "single-replica" invariant. The four in-process replicas break the two per-process subsystems: the rate limiter (the booked residual) AND `_suspended_cache` (`dependencies.py:27` — the UN-booked bug: a suspended account stays live on ¾ workers ≤60 s). `WORKERS=4→1` removes all three problems and adds nothing (compute_cache + idempotency are Mongo-backed; nginx is the real per-client governor). Then assess **T2** — converge the app rate-limiter toward nginx (app stays the inv-24 RFC-9239 *reporter*; nginx speaks problem+json on breach; budgets re-tightened relative to the edge). NO Redis, NO amputation.
- **γ — stack hardening + perf finish** *(perf/security)*: level frontend/mongo/nginx to the compose hardening floor with the per-image tmpfs/cap recipe (mongo can't `read_only` — stateful; nginx/frontend need NET_BIND_SERVICE + cache/run tmpfs); add a CSP via a CF `_headers` file (`font-src 'self'` / `default-src 'self'` — free now that G killed all third-party font origins); drop the phantom KaTeX `local()`-only `@font-face` overrides (`style.css:56-67`); guard the aware/naive datetime comparison edge (`softdelete.py:66` vs pre-G naive rows).
- **δ — contract honesty** *(inv-26 completion; name hygiene)*: consolidate/assess the 4th hand-type island (`web/src/lib/equation/types.ts`, 10 importers) into the honest single-source story; **document the NO-`response_model`-codegen-revival decision** (adding it makes the OpenAPI lie about the ETag/`_public_doc` bytes — G was right to delete the codegen; the boundary is hand-typed-canonical). Retire the misleading `F-Inv 22*` name "vhost-correctness-**symmetric**" (INVARIANTS §2.7 already retracts what the name asserts) → rename to fourier-vhost-correctness.
- **ε — constellation perfection** *(inv-16′ authorized cross-repo sweep)*: the CI reds are ONE cascade — the `163ca47` vendor-seam→`^published` migration the consumers never did. Fix in order **value.js** (`npm ci` ERESOLVE: vite@^8 vs unplugin-vue-markdown peer) → **keyframes.js** (`file:../value.js` seam) → **glass-ui** (lockfile `file:../keyframes.js` drift) — each green. Adopt CI (`deploy/templates/ci.yml`) into the **no-CI** repos (words, speedtest, csp-solver). Close the **API route gaps**: api.color `/health`/`/docs`/`/openapi.json` (unmounted), api.sudoku `/api/v1/solve` (router prefix `/v1`≠`/api/v1`, N4). Publish the **words** SPA (un-automated, like G's δ). Each is its own commit, booked to an `ADOPTION-ASKS` entry, **per-repo green-CI-gated (inv-27)**.
- **ζ — spine application + coordination + close** *(host/operator + doc)*: apply `render-hooks.sh` on the host so `/opt/deploy/hooks.json` stops carrying an inline plaintext HMAC (operator-gated — needs the host `secrets.env`; inv-21 dry-run + receipt); reconcile the **DNS tuple drift** (`scripts/dns-cf-sync.sh` says `fourier.pages.dev`, live is `fourier-682` — a blind re-run would regress live CNAMEs); record the **speedtest = friday.institute** model correction (retire the babb.dev category error across the docs); advance `dispatch.sh` retirement as the non-fourier repos adopt their per-repo hooks; re-trigger the 30-day stale-watch.

**Completion criterion (the evidence).** The close holds when:
- **α**: `gh run list --workflow ci.yml` shows the `CI` run on HEAD **GREEN on all three jobs** (web, api-tests, e2e), cited by run id; `inv-27` + `inv-28` in `INVARIANTS.md`; the deploy path demonstrably refuses a red-CI SHA (a dry-run or the gate config); `G/FINAL` CI rows corrected.
- **β**: `api/Dockerfile` runs `--workers 1` (or the WORKERS default is 1); a two-request probe across "workers" can no longer diverge; the `_suspended_cache` bug is closed (a suspended account is suspended everywhere immediately); the rate-limiter residual is dissolved or its nginx-convergence landed; inv-12 claim==reality.
- **γ**: `docker inspect` shows frontend/nginx at the floor (or the residual honestly scoped with the per-image rationale); a `_headers` CSP live (`curl -I` shows `content-security-policy`); the phantom face gone; the datetime edge guarded (a test over a naive-row delete).
- **δ**: inv-26 reconciled in `INVARIANTS.md` with the 4th-island disposition + the no-codegen decision recorded; the "symmetric" name retired.
- **ε**: value.js + keyframes.js + glass-ui CI **green** (run ids cited); words/speedtest/csp-solver carry a green CI; api.color 4-endpoint + api.sudoku `/api/v1/solve` live; words SPA live — each its own commit + ask entry, per-repo-green-CI-gated; OR the precise residual honestly booked with its owner.
- **ζ**: host `hooks.json` rendered from the wrapper (no inline literal — receipt); DNS tuple reconciled; the friday.institute correction in the docs; stale-watch re-triggered.
- Every "green" claim in the close cites a green run id covering EVERY job (inv-27); the deploy-of-record citations are green-CI-gated (inv-28).
- `PROGRESS.md` matches reality; `FINAL.md` cites every commit + gate + the green CI run ids.

The §6 hard-gate list is the binding ledger.

## §1 — Thesis

G corrected F's three overstatements at root and survives gate-falsification — but it closed labeled GREEN while its CI was RED on every commit (the `e2e` gate broken since before F, unmasked by G's own checkout fix), and the deploy path shipped that red build to prod. That is the same honesty class that birthed inv-25, now in the test + deploy-gate signal. Alongside, the "elegance/simplicity/performance above all; perfect the above; NO legacy" mandate makes first-class: the WORKERS=4→1 single-replica transposition (which also fixes an un-booked suspension bug), the hardening + CSP completion, the contract-honesty reconciliation, and — the user's explicit new demand — **perfecting the whole constellation** (its CI is broadly red from one un-propagated dependency migration).

H is the **honesty-in-full** tranche: it makes "green" mean green and installs the invariants that keep it so; it removes the four in-process replicas that contradict the single-replica invariant; it finishes the hardening; and — under an authorized, ledgered cross-repo sweep — it brings the constellation's CI from red to green. It refuses the anti-patterns it was born correcting: **no "green" claimed without a green run id; no deploy of a red-CI SHA; no silent cross-repo mutation; no manufactured infra (Redis) or schema that lies (response_model).**

## §2 — Invariants

H inherits all prior invariants (`docs/tranches/INVARIANTS.md`, inv-1…26 + the named C/F/G additions) unchanged. H adds **three by name**:

- **inv-27 — green-means-green**: a claim that "tests/CI pass" (in a close, a wave receipt, or a status) MUST cite a green CI run id covering EVERY job in the workflow, or it must enumerate and book each red job as a named residual. Local gates passing ≠ CI passing. Rationale: G claimed "CI green" while `e2e` was red on every commit (HA1/HA3/HA6) — the inv-25 honesty shape applied to test signal. Testable gate: every "green" in `H/FINAL.md` cites a run id whose every job is green.
- **inv-28 — verified-deploy-of-record**: the automated deploy path (the `deploy-pages` SPA workflow + the API webhook → deploy-hook chain) ships only a SHA whose **same-SHA CI run is green**. Composes with inv-25 (automated AND verified). Rationale: deploy-pages/webhook shipped G to prod while same-SHA CI failed (HA3/HA5). Testable gate: the deploy path has a green-CI precondition (a `workflow_run`-gated deploy, or a deploy-hook CI-status check), demonstrated to refuse a red SHA.
- **inv-16′ — authorized-cross-repo-sweep**: cross-repo writes (beyond `fourier-analysis/** + deploy/**`) are permitted ONLY under an explicit, user-authorized, NAMED, ledgered sweep — each its own commit, booked to an `ADOPTION-ASKS` entry, gated on that repo's own green CI (inv-27). The honesty refinement of inv-16: it preserved "no SILENT cross-repo mutation"; inv-16′ keeps that while making the user-owned constellation perfectable. Rationale: HA2 — the user owns all `mkbabb/*` and wants the constellation perfected; the asks have rotted OPEN since F.

## §3 — Wave schedule (provisional — hardened at Wχ)

| Wave | Title | Thread | Agents | Closes on | Status |
|---|---|---|---|---|---|
| W0 | Open + audit intake + cheapest (phantom KaTeX face + datetime guard) | — / γ | 1 | G close re-confirmed (survives §0 falsification per HA1/HA3); HA1–HA6+SYNTHESIS committed; the 2 one-line γ items land | planned |
| Wα | Research-light (2 lanes): e2e suite scope + inv-28 deploy-gate mechanism | α | 2 | which specs are stale vs real + the file-input locator fix; how the deploy path reads same-SHA CI status (workflow_run vs gh-API check) | planned |
| Wχ | Challenge (3 probes): WORKERS=1 blast radius + rate-limiter→nginx convergence + inv-16′ sweep scope | β / ε | 3 | ratify no-other-per-process-state; the converge-vs-keep limiter decision; the bounded cross-repo sweep list | planned |
| W1 | H.α e2e repair → fourier CI fully green + inv-27 | α | 1-2 | all 3 CI jobs green (run id); inv-27 authored; FINAL rows corrected | provisional |
| W2 | H.α inv-28 verified-deploy-of-record | α | 1 | deploy path green-CI-gated; demonstrated to refuse a red SHA | provisional |
| W3 | H.β WORKERS=1 + suspended-cache fix + rate-limit convergence | β | 1-2 | `--workers 1`; suspension immediate; inv-12 claim==reality | provisional |
| W4 | H.γ stack hardening + CSP + cleanup | γ | 1-2 | frontend/nginx floor; `_headers` CSP live; phantom face + datetime edge gone | provisional |
| W5 | H.δ contract honesty + name hygiene | δ | 1 | inv-26 reconciled (4th island + no-codegen); "symmetric" retired | provisional |
| W6 | H.ε constellation CI cascade (value.js→keyframes→glass-ui) | ε | 1-2 | the three consumer repos CI green (inv-16′; run ids) | provisional |
| W7 | H.ε no-CI repos + API route gaps + words SPA | ε | 1-2 | words/speedtest/csp-solver CI; api.color + sudoku routes; words SPA live | provisional |
| W8 | H.ζ spine application + DNS + friday.institute + coordination | ζ | 1 | render-hooks on host (receipt); DNS tuple; model correction; stale-watch | provisional |
| W9 | Close + stale-watch | — | 1 | reconcile PROGRESS; `FINAL.md` (green run ids, inv-28 citations); CANONICAL-ORDERING → ordering κ′ | provisional |

Hard ceiling 4 agents/wave. Research-light gate (W0→Wα→Wχ) governs α/β/ε. α (W1/W2) is the spine and precedes inv-28's gate (you cannot gate on green until green exists). β (W3) ∥ γ (W4) ∥ δ (W5) are source-disjoint. ε (W6/W7) is the inv-16′ sweep, sequenced after the fourier-side templates/patterns are proven green. ζ (W8) host/doc. 12 wave slots; granularity expands as needed.

## §4 — Phases

**Phase 0 — research + challenge (W0–Wχ).** e2e scope + inv-28 mechanism; WORKERS=1 blast radius + limiter-convergence + the inv-16′ sweep list.
**Phase I — green-means-green (W1–W2).** CI green + inv-27 + inv-28.
**Phase II — the transposition (W3).** WORKERS=1.
**Phase III — hardening + honesty (W4–W5).**
**Phase IV — constellation perfection (W6–W7).** The inv-16′ sweep.
**Phase V — spine + coordination + close (W8–W9).**

## §5 — Critical files and ownership

| Surface | Files | Wave |
|---|---|---|
| H.α e2e + CI | `web/tests/**` (the Playwright specs), `web/src/components/**` (the dual file-input), `.github/workflows/{ci.yml,deploy-pages.yml}` | W1-W2 |
| H.β WORKERS=1 | `api/Dockerfile`; `api/services/rate_limiter.py`; `api/dependencies.py` (`_suspended_cache`); `nginx/fourier.conf` (the convergence) | W3 |
| H.γ hardening | `docker-compose.prod.yml`; `web/public/_headers` (new CSP); `web/src/style.css`; `api/.../softdelete.py` | W4 |
| H.δ contract | `web/src/lib/{types.ts, equation/types.ts}`; `docs/tranches/INVARIANTS.md` | W5 |
| H.ε constellation | **value.js / keyframes.js / glass-ui / words / speedtest / csp-solver** (inv-16′ sweep) + `deploy/templates/ci.yml`; `docs/constellation/ADOPTION-ASKS.md` | W6-W7 |
| H.ζ spine | host `/opt/deploy/` (render-hooks); `scripts/dns-cf-sync.sh`; the docs (friday.institute) | W8 |

## §6 — Hard gates (completion criterion)

- **inv-27 green-means-green**: fourier CI run on HEAD GREEN on all 3 jobs (run id cited); every "green" claim cites a covering run id.
- **inv-28 verified-deploy-of-record**: the deploy path refuses a red-CI SHA (demonstrated).
- **H.α**: e2e suite green (no strict-mode locator violation; stale specs refreshed); `G/FINAL` CI rows corrected.
- **H.β**: `--workers 1`; `_suspended_cache` suspension immediate; rate-limit residual dissolved/converged; inv-12 claim==reality.
- **H.γ**: frontend/nginx hardened (inspect); `_headers` CSP live; phantom face + datetime edge gone.
- **H.δ**: inv-26 reconciled (4th island + no-codegen recorded); "symmetric" name retired.
- **H.ε**: value.js/keyframes.js/glass-ui CI green (run ids); no-CI repos carry green CI; api.color 4-endpoint + sudoku `/api/v1/solve` live; words SPA live — each an inv-16′ commit + ask entry; OR booked with owner.
- **H.ζ**: host `hooks.json` rendered (receipt, no inline literal); DNS tuple reconciled; friday.institute correction recorded; stale-watch re-triggered.
- pytest green; vue-tsc + build green; T7 12/12 — all as part of a GREEN CI run, not local-only.

## §7 — Cross-tranche debt + explicit deferrals

**Folded into H:** the e2e chronic-broken gate (H.α); DNS tuple drift (H.ζ); WORKERS=4 + the suspended-cache bug (H.β); the hardening floor + CSP (H.γ); the 4th hand-type island (H.δ); the phantom face + datetime edge (H.γ); render-hooks host application (H.ζ); the constellation CI cascade + no-CI repos + API gaps + words (H.ε, inv-16′).
**Cross-repo (inv-16′ sweep / ASK; re-stale-watched in ζ):** the 7 adoption asks; api.color; sudoku /solve; words; dispatcher retirement (gated); the value.js-J cluster (E4–E7) on its own driver.
**STAYS-OUT, re-affirmed (6-gate, structurally cross-repo — do NOT silently re-defer):** C1 colour-lift (value.js publish-bound); C5/C6 glass-ui. inv-16′ does not force these — they are gated on the OWNING repo's tranche, not a CI sweep.
**Declined (recorded, not deferred):** `response_model=` codegen revival (makes the schema lie about the ETag/projection bytes — HA5); Redis for rate-limiting (WORKERS=1 + nginx is the gestalt); amputating the app rate-limiter (it is the inv-24 emitter).

## §8 — Brittleness window (provisional)

H plans NO brittleness window. Each wave is reversible at its boundary: α (CI/specs — compile/run-checked; deploy-gate is config, revertible); β (WORKERS=1 is one env var; health-gated auto-rollback); γ (hardening per-image, health-gated; CSP additive, `_headers` revertible); δ (docs + type consolidation, compile-checked); ε (each cross-repo commit is its own PR, per-repo-green-CI-gated, revertible independently); ζ (host render-hooks is inv-21 dry-run + receipt; DNS is read-confirm-before-write). No host-disruptive op beyond a documented single-window with receipts.

## §9 — Cross-repo coordination (inv-16′)

inv-16′ governs ε: every cross-repo edit is an explicit, user-authorized, named, ledgered sweep — its own commit, booked to `ADOPTION-ASKS.md`, gated on that repo's own green CI (inv-27). The C1/C5/C6 carries + the value.js-J cluster remain owner-driven (not swept). The host render-hooks application + dispatcher retirement remain operator-coordinated (inv-21).

## §X — Congruence

The 6 HA lanes + SYNTHESIS are the binding substrate. G is closed; H corrects G's CI-green overstatement + the deploy-gate defect (α) — those are H scope, not a re-open of G's landed work (δ/β.2/inv-26-partial all stand). The transpositions (HA5) ride β/γ; the chronic/deferred ledger (HA4) folds per §7; the prompt/precept recap (HA6) yields inv-27 + the green-means-green precept + the friday.institute correction. inv-16′ (HA2) makes "perfect the constellation" honest.

End of H.md.
