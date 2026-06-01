# H — progress log

Updated at every wave boundary. Reconciled against reality at W9 close.

## Goal of this log

Record what *actually happened* at each wave of fourier-tranche-H — the green-means-green + single-replica-elegance + constellation-perfection tranche — so the close can reconcile claim against artefact without archaeology. H is born correcting a CI-honesty gap (G closed GREEN-labeled while its CI was RED on every commit); its own close is bound by inv-27 (every "green" cites a green run id covering every job) and inv-28 (the deploy path ships only green-CI SHAs).

## Completion criterion

Every wave's row carries (a) a status word, (b) a close timestamp, (c) a notes cell naming the binding deliverable. At W9 close every row reconciles against `FINAL.md`'s gate table; `FINAL.md` cites a GREEN CI run id (all jobs) on HEAD and a green-CI-gated deploy-of-record (inv-27 + inv-28). The 30-day stale-watch re-triggers at W9.

## Status board

| Wave | Status | Closed at | Notes |
|---|---|---|---|
| W0 — Open + audit intake + cheapest γ | **closed** | 2026-05-31 | Open; live baseline reconciled (CI `26720618455`: web✅ api-tests✅ **e2e❌** — single red job after `b28c3fa`). **KaTeX phantom-face fix LANDED** (`style.css:56–67` removed — a real cascade-shadow bug, not dead code: `local()`-only faces declared after katex.min.css degraded regular glyphs to serif; vue-tsc+build green). **Datetime edge = already-guarded, honest no-op** (`tz_aware=True` client @ `database.py:28` + explicit guard @ `softdelete.py:64–65` since B.W3; zero unguarded compares in `api/`); the regression-test-that-proves-it folds to W4/γ per inv-27. Findings → `waves/W0-Wchi-findings.md` |
| Wα — Research-light (2 lanes) | **closed** | 2026-05-31 | **α-e2e**: the single red `e2e` job has **4 independent breakage classes**, not just the locator (audit undercounted: 16 bare file-inputs, not ~51) — (A) dual-file-input strict-mode → `data-testid` + `getByTestId` (NOT `.first()`, which targets the wrong input); (B) stale 'Drop an image' text [crud]; (C) stale gallery selectors (.bouncy-btn→UnderlineTabs, overlay→CanvasControlsDock); (D) stale paper pg 97→110 (+ DFT page drift). settings-persistence wholly `.skip()`'d. **inv-28**: SPA→`workflow_run` gate (re-add web/** filter, pin head_sha); API→fail-closed gh-status no-op block in deploy-hook.sh + host PAT booked to ζ; W1 must green CI first |
| Wχ — Challenge (3 probes) | **closed** | 2026-05-31 | **P1 RATIFIED**: WORKERS=1 complete + regression-free (4 module sites + 1 bg subsystem; only rate_limiter + `_suspended_cache` diverge; **bonus**: janitor loop ×4 → 4× audit rows; all else Mongo-backed/correctly-per-process). **P2 KEEP-APP-ENFORCER**: converge DECLINED (nginx problem+json would duplicate the errors.py envelope → drift vs inv-26); W3 lands only the dead-`api_upload`-zone delete + caveat refresh. **P3**: cascade confirmed (value.js unplugin^32+seams→keyframes seam→glass-ui lockfile); **`colors`≠api.color** (api.color/sudoku/csp-solver absent locally → deferred-booked); speedtest=friday.institute. Findings → `waves/W0-Wchi-findings.md` |
| W1 — H.α e2e repair → CI green + inv-27 | **CLOSED GREEN** | 2026-06-01 | **CI run `26773946417` (HEAD `8058c44`) GREEN on ALL 3 jobs** (web + api-tests + e2e) — the inv-27 evidence; fourier CI is actually green for the first time (the e2e gate was broken since before F). Fixed 4 breakage classes + **3 buried app bugs** the dead gate hid (dropdown-never-positioned via a Tooltip-wrapped Reka anchor; mobile configurator-stage 0px; TOC leaf no-scroll) + a11y roles; dead `paperTextEnhancer.ts` DELETED (inv-15/20). `write_limiter` env-driven (`WRITE_RATE_LIMIT`). **CI widened `pytest api/tests/`→`pytest api/`** (inv-27: no test off-path) + janitor tests migrated to real Mongo → `pytest api/`=225/0. **The green-means-green loop bit twice (the discipline working):** the FIRST push (`3431f5d`, run `26772569595`) was RED on e2e only — CI caught two local↔CI gaps the dead gate had buried: the off-path janitor breakage (fixed) and a BLOB_DIR upload-500 (`_blob_dir()` mkdir of `/data/blobs`, not writable on the runner; the harness never defaulted BLOB_DIR — fixed in `8058c44`). inv-27 authored; `G/FINAL` §2 caveat + §6 correction. glass-ui collapsed-`ConfiguratorLayer` `aria-hidden-focus` keystones fixme'd+booked (ADOPTION-ASKS glass-ui-a11y) |
| W2 — H.α inv-28 verified-deploy-of-record | authored (commit held for green CI) | 2026-06-01 | **SPA arm LANDED**: `deploy-pages.yml` rewired `push`→`workflow_run [CI] completed`, gated `if conclusion==success && head_branch==master && event==push` (web/** filter re-imposed via a same-SHA diff job; checkout pinned to `workflow_run.head_sha`). A red CI → no ship (mechanical refusal — demonstrable on the next cycle). inv-28 + inv-16′ authored (INVARIANTS §1 + §2.10, incl. the precepts-`invariant 28` namespace-partition). **API arm → ζ** (host-coupled: a fail-closed `commits/<sha>/status` gate needs a host-only read-only PAT; lands with the PAT in W8, inv-21). Commit HELD until the `3431f5d` CI run is GREEN (the bootstrap green the workflow_run gate references) |
| W3 — H.β WORKERS=1 | landed | 2026-06-01 | `Dockerfile` WORKERS=4→1 (single-replica inv-12 — collapses the rate_limiter, `_suspended_cache`, and janitor-loop per-process divergences to one authoritative process; no Redis); orphan `api_upload` nginx zone DELETED; `rate_limiter.py` caveat→post-WORKERS=1 truth + **T2 converge DECLINED** (nginx-on-breach would duplicate the `errors.py` envelope/drift inv-26 + can't emit the RFC-9239 trio; app stays sole inv-24 emitter+enforcer). conformance 5/5 |
| W4 — H.γ hardening + CSP + cleanup | landed | 2026-06-01 | `docker-compose.prod.yml` frontend+nginx levelled to the FULL floor (`read_only`+tmpfs[/var/cache/nginx,/var/run,/tmp]+`cap_drop:ALL`+`cap_add:NET_BIND_SERVICE`; mongo stays — stateful); `web/public/_headers` CSP verified against the built app (2 justified widenings: the inline dark-mode IIFE + avatar/API img origins); softdelete naive-row regression test **with a negative control** (9 passed). (KaTeX phantom face landed W0; the datetime guard was already-satisfied W0 — this is the proving test the γ gate names.) |
| W5 — H.δ contract honesty | landed | 2026-06-01 | 4th-island (`web/src/lib/equation/types.ts`) = **KEEP-AS-IS** — assessed vs `api/models/equations.py` (no drift; a distinct equation-compute domain, not a duplicate of G's collapsed boundary); inv-26 reconciled (INVARIANTS §2.9 — hand-typed-canonical per-domain + the NO-`response_model`-codegen decision recorded DECLINED-with-rationale); `F-Inv 22*` "symmetric" name RETIRED (§1 row + §2.4 → fourier-vhost-correctness) |
| W6 — H.ε constellation CI cascade | **closed — BOOKED** | 2026-06-01 | inv-16′ recon: all 5 siblings MID-FLIGHT (value.js in-sync; keyframes +19, glass-ui +111, words +11, speedtest +563 unpushed — a fix-push would publish the backlog). **User chose "book all" (2026-06-01)** → touched NO sibling repo. The exact file-verified cascade fixes (`cascade-vjs` unplugin^32+seams; `cascade-kf` seam→^3+lockfile; `cascade-gui` lockfile-only) booked to ADOPTION-ASKS §4 + `waves/W6-W7-epsilon-booking.md`. inv-16′ enabled, named, ledgered — not compelled |
| W7 — H.ε no-CI repos + API gaps + words SPA | **closed — BOOKED** | 2026-06-01 | Same book-all: `words-spa` (deploy-pages δ-model, the 404 outage), speedtest CI (Ask 1; **friday.institute** not babb.dev), api.color (inv-22-color) + api.sudoku `/api/v1/solve` (Ask 6 — both repos ABSENT locally → verify-then-fix), glass-ui-a11y (H.W1) — all precise fixes booked with owners. fourier write surface = `fourier-analysis/docs/**` only (inv-16 held) |
| W8 — H.ζ spine application + DNS + coordination | provisional | — | apply `render-hooks.sh` on host (receipt, no inline literal); reconcile DNS tuple (`fourier.pages.dev`→`fourier-682`); record friday.institute correction; dispatcher retirement; stale-watch |
| W9 — Close | provisional | — | reconcile PROGRESS; `FINAL.md` (GREEN CI run ids + inv-28-gated deploy citations); CANONICAL-ORDERING → ordering κ′ |

## Log

### 2026-05-31 — tranche authored (6-lane H-audit + SYNTHESIS)

**WHAT.** After G's close + the constellation-status request, the user directed: "DEEPLY audit with 6 agents in parallel… devise a path forward… architectural transpositions for elegance, simplicity, performance above all… NO legacy code… delineate chronic + deferred and fold them… recap ALL prompts… we should plan to perfect the above… NOT an implementation phase." (+ the correction: speedtest is `speedtest.friday.institute`, not babb.dev — "handle that regardless".)

Six parallel READ-ONLY Agent lanes ran (HA1–HA6 + SYNTHESIS at `docs/audits/runs/2026-05-31-H-audit/`).

**Verdict (HA1/HA3):** G's close SURVIVES gate-falsification on its load-bearing claims (δ live, β.2 per-client, inv-25 SPA, read_only sound, γ clean) — but carries **one material overstatement + one structural defect**:
1. **"CI green" is FALSE** — the `CI` workflow has been `failure` on every G commit incl. the W9 close; G cited only the cheap jobs. The `e2e (Playwright)` job is RED (a dual `input[type=file]` → strict-mode locator violation, broken since before F; G's W1 checkout-fix unmasked it — G did NOT cause it).
2. **deploy-of-record decoupled from CI** — deploy-pages/webhook shipped G to prod while same-SHA CI failed ("automated ≠ verified").

**Transpositions (HA5):** WORKERS=4→1 (TOP — closes inv-12 gap + fixes the un-booked `_suspended_cache` bug + dissolves the rate-limit residual; no Redis); rate-limiter→nginx convergence (keep the app as the inv-24 RFC-9239 reporter); DECLINE the response_model codegen revival (it makes the schema lie). Stack hardening + CSP completion.

**Constellation (HA2):** the CI reds are ONE cascade (the `163ca47` vendor-seam→`^published` migration the consumers never did: value.js→keyframes→glass-ui). speedtest = `friday.institute` (scope correction). words = genuine outage. render-hooks not applied on host; dispatch.sh still live. **inv-16′** proposed to enable an authorized cross-repo sweep.

**Chronic/deferred (HA4):** 24 OPEN of 30; fold e2e (the ≥4-close chronic), DNS drift, WORKERS=1, hardening, CSP, 4th island, render-hooks; cross-repo sweep for the constellation; STAYS-OUT re-affirm C1/C5/C6.

**Precepts (HA6):** 67-prompt ledger; "Lighthouse-in-dev" DISCHARGED by G.W5 but the lip-service migrated to "CI green"; NEW precept **inv-27 (green-means-green)**.

**Shape:** 6 threads (α green-means-green, β WORKERS=1, γ hardening+CSP, δ contract honesty, ε constellation perfection, ζ spine+coordination); 12 wave slots; 3 new invariants (inv-27 green-means-green, inv-28 verified-deploy-of-record, inv-16′ authorized-cross-repo-sweep).

### 2026-05-31 — Phase 0 closed (W0 open + Wα research-light + Wχ challenge)

**WHAT.** User authorised execution ("Begin and continue the current tranche … in totality … idiomatic, gestalt"). Opened H; ran a 5-lane READ-ONLY research workflow (`wf_0f450d3c-a24`) — 2 Wα lanes + 3 Wχ probes. Binding record at `waves/W0-Wchi-findings.md`.

**Live baseline.** CI `26720618455` (HEAD `f2fe447`): `web`✅ `api-tests`✅ `e2e`❌ — the post-`b28c3fa` state has a *single* red job (e2e). Confirms the audit's headline; sharpens H.α.

**W0 γ items, honest.** (1) KaTeX phantom-face removal LANDED — a *real* cascade-shadow bug (the `local()`-only faces, declared after `katex.min.css`, won the regular-weight cascade and degraded glyphs to serif on ~all visitors), vue-tsc+build green. (2) Datetime edge **already guarded** (tz_aware client + B.W3 explicit guard; zero unguarded compares) — inv-27 forbids manufacturing an already-present fix; the proving regression-test folds to W4.

**Wχ ratifications.** WORKERS=1 = complete+regression-free (P1, + the bonus janitor-×4 find). Rate-limiter convergence DECLINED, keep-app-enforcer (P2) — W3 lands only the dead-zone delete + caveat refresh. Cascade scope confirmed with corrections (P3): `colors`≠api.color (absent locally → deferred); speedtest=friday.institute.

**Schedule hardened** (post-Wχ): W1 e2e (4 classes) → W2 inv-28 (SPA workflow_run + API gate-A no-op + host PAT→ζ) → W3∥W4∥W5 source-disjoint → W6 ε cascade (guarded) → W7 ε no-CI+words (api.color/sudoku deferred) → W8 ζ → W9 close.

### Next action

**W1 (H.α, TOP)**: add `data-testid="image-file-input"` to `ImageUpload.vue`; repair all 4 e2e breakage classes (locator retarget + stale-selector refresh + growth-tolerant paper assertion + settings-persistence rewrite-or-delete); make `e2e` actually green locally (`scripts/e2e.sh`) then via CI; author **inv-27**; correct `G/FINAL` CI rows. Then W2 (inv-28).
