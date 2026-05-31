# HA6 — Prompts + Precepts Recapitulation (the completeness audit)

**Lane**: HA6 of the 6-lane H-development audit (STRICTLY READ-ONLY; tranche development, not implementation; ZERO mutations).
**Subject**: the user's standing requirement — "Recap ALL of our prompts and requests hitherto and ensure they've been addressed."
**Baseline**: inherits the GA6 ledger (`docs/audits/runs/2026-05-29-G-audit/GA6-prompts-precepts.md`, 61 prompts) — itself the FA6 chain (DA5→EA4→FA6→GA6). HA6 appends the G-execution-session prompts + this session's NEW directives, and — load-bearing — re-verifies the prior closes against **live runtime evidence** (`gh run`, host), not against the FINAL gate tables at face value.
**Posture**: SKEPTICAL, escalated. GA6's own headline was that a gate table can read GREEN while the artefact the user asked for was never produced ("Lighthouse in dev" lip-service three audits running). HA6 finds the *same class* of gap one layer over: **G's close asserts "vue-tsc + build green / pytest green / CI" while the repository's CI workflow has been RED on every push — including the G.W9 close commit — because the `e2e (Playwright)` job fails wholesale.** This births the candidate H precept: **green means green**.

---

## §1 — The prompt ledger (complete, ordered)

### §1.1 — Inherited baseline (GA6, 61 prompts) — carried as-is

GA6 cataloged **61 prompts** A→G-authoring: 58 inherited from FA6 (A1–A15, B1–B5, C1–C7, CE1, D1–D11, CE2–CE10, E1–E7, EE1–EE3) + FE1/FE2/FE3. Verdict at G-authoring: **58 ADDRESSED · 1 ADDRESSED-with-partial-sub-clauses (FE1) · 1 ADDRESSED-this-round (FE3) · 0 fully OUTSTANDING**, with the honest defects living at the recurring-theme layer (Lighthouse-in-dev PARTIAL; rate-limit labeled-workaround; the dead-deploy precept gap → inv-25). HA6 inherits this as-is; A→G-authoring is not re-litigated at the prompt level. **One correction carries forward**: GA6's "0 fully OUTSTANDING" was true at the *prompt* layer but the verification floor was source/local — and HA6 now shows the runtime (CI) was red. See §2.

### §1.2 — Appended: G-execution-session prompts (the work since G was authored)

| ID | Prompt (verbatim / paraphrase) | Session | Status | Evidence |
|---|---|---|---|---|
| **GE1** | "Begin and continue the current tranche… orchestration and deep parallelization… do not relinquish control until complete IN TOTALITY… NO quick solutions, NO workarounds: idiomatic, gestalt approaches" (the G-execution authorization) | G-exec 2026-05-30 | 🟡 **PARTIAL** — substantively addressed at the source layer, but the "in totality" + the implicit green-CI floor are **not** met: CI red at close | G ran W0→W9 in one session, closed GREEN-labeled (`5e29ed0`; deploy `a7b58ab`). All three F overstatements corrected at root: δ LIVE (inv-25; prod Lighthouse 95/100/100, GH run `26695021489`→CF `52f90604`), β.2 per-client IP (live spoof-proven), inv-22 honestly scoped. inv-26 one-contract-source; legacy excised; deploy spine completed. **BUT**: the `CI` workflow failed on the G.W9 close commit (`gh run 26695317377` = **failure**) and on *every* G push — the `e2e (Playwright)` job is red (entire `contour-extraction.spec.ts` suite ✘ across all images). FINAL.md §2 cites "pytest 132/83 ✅ / vue-tsc+build ✅ / T7 12/12 ✅" — each true in isolation — but **never cites the CI run id**, and CI-as-a-whole was never green. "NO workarounds" also still carries the WORKERS=4 residual (per-process buckets → effective ceiling ~4×180, not the claimed 180). |
| **GE2** | "Status on deploy + the constellation" (the post-G deploy/constellation status request) | post-G 2026-05-30/31 | 🟡 **PARTIAL** | Answered from G's deploy spine + GA2: API auto-deploy LIVE (webhook→deploy-hook, `DEPLOY OK e9faab6→9080ca2`); SPA now on the standing automated path (inv-25, `deploy-pages`). **BUT** the constellation-wide picture is unfavorable and was not fully surfaced: value.js CI is **also red** on its close commit (`mkbabb/value.js` runs `26620907499` `ci` + `26620907487` `Node.js CI` both **failure**); words/speedtest still have NO CI (survey §28); the deploy-dir/VCS divergence (3 locations, 2 VCS models) is unresolved; palette-api/color is still rsync-no-git. |
| **GE3** | "Status on CI for every repo / the value + fourier APIs" (the CI-coverage status request) | post-G 2026-05-30/31 | ❌ **OPEN** (H mandate) | The honest constellation CI picture: **fourier CI RED** (e2e Playwright fails — latest `gh run 26719598467` = failure, even *after* the post-G fix `b28c3fa`); **value.js CI RED** (both jobs); words/floridify + speedtest have **NO CI**; csp-solver deploy-CI is `.disabled` (survey §28). Only `fourier deploy-pages` and `api/tests`+`web` jobs are green in isolation. "CI green for every repo" is materially false — this is the headline of H's "perfect the above." |
| **GE4** | "speedtest is `speedtest.friday.institute`, not babb.dev — handle that regardless" (the scope correction) | post-G 2026-05-30/31 | ❌ **OPEN** (H mandate) + records a **category error** in all prior framing | Every prior tranche (D normalization through G/GA2) modeled `speedtest` as a **babb.dev constellation app** (port `:8140`, "speedtest.babb.dev" vhost, the CF-Pages reference recipe — D.W9, `project_tranche_d.md`, GA2 §lines 85/197). The user corrects: speedtest is a **SEPARATE suite at `speedtest.friday.institute`**, NOT a babb.dev app. Consequence: F's "dead `:8140` speedtest vhost teardown" and E's "dead :8140 speedtest vhost" and any "speedtest.babb.dev down" framing were a **category error** — they conflated two different things. "handle that regardless" = H must (a) record the correct model, (b) decide whether `speedtest.friday.institute` needs its own CI/deploy bring-up or is explicitly out-of-constellation. Nothing addressed yet. |
| **GE5** | "we should plan to perfect the above" (the perfection directive) | post-G 2026-05-30/31 | ❌ **OPEN** (H mandate — this IS H's spine) | Not yet planned. "the above" = the GE2/GE3/GE4 status set: the constellation CI reds (fourier e2e + value.js), the no-CI repos (words, speedtest), api.color/sudoku endpoint gaps (inv-22 partial), `words`, `speedtest.friday.institute`, inv-26-partial (4th equation-domain type island), and the WORKERS=4 honesty. This directive is the reason H exists. |
| **HE1** | "DEEPLY audit with 6 agents… recap ALL prompts… distill precepts… ensure nothing's unaddressed… tranche development only" (THIS H-authoring directive) | H-author 2026-05-31 | ✅ **ADDRESSED (this round)** | The 6-lane HA1–HA6 dispatch under `docs/audits/runs/2026-05-31-H-audit/`; read-only; this HA6 doc is the prompt-ledger + precept lane. Folds to the H charter. |

**New running total: 67 prompts** (61 inherited + GE1–GE5 + HE1).
**Verdict count (G-exec layer + new)**: GE1 🟡 · GE2 🟡 · GE3 ❌ · GE4 ❌ · GE5 ❌ · HE1 ✅.
**Net across all 67**: ~60 ✅ ADDRESSED · 3 🟡 PARTIAL (GE1, GE2, FE1-carried) · 3 ❌ OPEN (GE3, GE4, GE5) · the OPEN set IS the H spine.

The earlier audits' boast of "0 fully OUTSTANDING" no longer holds: **GE3/GE4/GE5 are genuinely open**, and they are open *because* the verification floor was raised — the user asked for a constellation-wide CI/deploy truth and a scope correction that prior closes had wrong.

---

## §2 — Recurring-theme verdict (the skeptical core)

### (i) "green means green" — a CI/tests-pass claim must cite a green run for EVERY job — **VIOLATED (the headline HA6 finding)** ⚠️

This is the NEW systemic gap, and it is the *same shape* as the dead-auto-deploy that birthed inv-25: a close asserts a healthy aggregate while a constituent is silently red.

- **The fact**: `gh run list` for fourier shows the `CI` workflow **`failure` on every push of the entire G tranche**, including the G.W9 close commit (`26695317377` failure) and the post-G "fix" commit `b28c3fa` (`26719598467` **failure**, 2026-05-31). Job breakdown of the latest run: `api/tests` ✓, `web (vue-tsc+build)` ✓, **`e2e (Playwright)` ✘** — the whole `e2e/contour-extraction.spec.ts:16` suite fails across every test image (chef/giraffe/golden-retriever/llama/sponge…), 3 retries each, exit 1.
- **The claim**: G/FINAL.md §2 hard-gate table lists "pytest 132/83 ✅", "vue-tsc + build ✅", "T7 12/12 ✅" — all individually true — but cites **no CI workflow run id**, and the workflow it would cite was red. PROGRESS.md W1 even notes "discharged a CI-red chronic (submodules:recursive)" — fixing one red cause while a *different* red (e2e) stayed unfixed and uncited. `b28c3fa`'s message "api-tests must sync --extra dev" shows post-close awareness that CI was broken — yet it still failed.
- **The honesty gap**: "the tests pass / build is green / CI" was asserted (or strongly implied by a GREEN close) while the canonical CI signal was red. Local `pytest`/`vue-tsc` passing ≠ the CI workflow passing — the e2e job exercises a path local gates never ran. This is precisely the lip-service pattern: a green-sounding aggregate over a red constituent.

**Verdict**: VIOLATED. G closed GREEN-labeled with CI red. This is the direct analogue of inv-25's birth condition. **Draft precept + invariant below (§3.3).**

### (ii) "Lighthouse test each page in prod AND dev" — **DISCHARGED by G** ✅ (the three-audit lip-service item, finally honored)

GA6's headline PARTIAL is **closed**. G.W5 ran real Lighthouse in BOTH surfaces with captured artefacts: dev **Perf 94 / A11y 100 / SEO 100** (`receipts/lh-dev-self-host.report.{html,json}`), prod **Perf 95 / A11y 100 / SEO 100** (`receipts/lh-prod-self-host.report.{html,json}`), network trace 0 third-party origins. The "prod AND dev" demand is literally honored for the first time across A→G. **NOTE the asymmetry**: G honored the Lighthouse demand it inherited, but in the same tranche let CI go red — the lip-service moved from one artefact to another. The lesson is general, hence §3.3.

### (iii) "NO legacy code" — **HONORED** ✅

G.γ excised `like_limiter`/`/like`, 6 dead `types.ts` exports, the `GalleryEntry`/`toGalleryEntry` vestige, 5× `datetime.utcnow`, the unused 65 KB `api-schema.d.ts` codegen + toolchain — all grep-proven zero-consumer. inv-20/inv-15 held. No `*_AVAILABLE` flags. CLEAN.

### (iv) "idiomatic, gestalt, NO workarounds" — **MOSTLY HONORED, two qualified items** ⚠️

- **β.2 rate-limit — the GA6 workaround RESOLVED at root.** G promoted real-client-IP from perennial residual to a first-class thread: nginx `real_ip` + `get_client_ip` (X-Real-IP) convergence, budget re-tightened 1200→180 per-client, spoof-proven live. The "widen-to-mask" anti-pattern G was born correcting was genuinely refused. ✅
- **BUT — WORKERS=4 honesty** (🟡): the in-memory limiter is **per-process**, so with 4 uvicorn workers the effective per-client ceiling is **~4×180 = 720/min**, not the 180 the close presents as the per-client budget. FINAL.md §4 books this honestly as a residual ("true single-bucket needs Redis or WORKERS=1") — so it is *labeled*, not hidden — but the headline "budget 180 per-client" is a 4× overstatement until a shared store lands. This is a smaller cousin of the F read_limiter=1200 widening: the number presented is not the number enforced. → H.
- **inv-26 partial** (🟡): β.1 collapsed the api↔web boundary to one source, but a **4th hand-type island** (`web/src/lib/equation/types.ts`, 10 importers) remains. FINAL.md §4 declares it "out of inv-26's named scope" — defensible (distinct equation domain, not a duplicate of the collapsed boundary) — but "single contract source" is true only for the boundary, not the codebase. → H should ratify or converge.

### (v) "recap ALL prompts each time" — **HONORED** ✅ (this doc continues the chain)

DA5→EA4→FA6→GA6→**HA6** ledger-inheritance intact. HA6 extends it and, per its skeptical mandate, re-verified prior closes against live `gh run`/host evidence rather than the FINAL tables — catching the CI-red gap GA6's source-floor recap could not.

### (vi) "deep parallelization with agents" — **HONORED** ✅

G-author = 6-lane GA1–GA6. G-exec = research-first W0→Wα→Wχ→implementation. This H-audit = 6-lane HA1–HA6. Consistent.

### (vii) "deploy-of-record automated" (inv-25) — **HONORED for fourier** ✅ / constellation-incomplete 🟡

fourier's API (webhook→deploy-hook) and SPA (`deploy-pages` GH Actions→CF) both cite automated `deploy_run_id`s (FINAL §2). inv-25 authored + in INVARIANTS. But it is fourier-scoped: words/speedtest have no CI/automated deploy, value.js/color deploy paths are not inv-25-attested — the constellation-wide deploy-of-record is incomplete (→ GE3/GE5, H).

---

## §3 — Precept distillation

### §3.1 — The durable precepts (the recurring demands, distilled)

These are the demands the user has repeated across the whole engagement; they are precepts whether or not they live in `docs/precepts/` yet:

1. **No quick solutions / no workarounds — idiomatic, gestalt, root-cause** (every authorization prompt). Adherence: strong; the β.2 root-fix is the model. Watch: residual-labeling can launder a workaround (read_limiter=1200 in F; WORKERS=4 honesty in G).
2. **NO legacy code** (inv-20/inv-15). Adherence: strong; G.γ exemplary.
3. **Architectural transpositions for elegance / simplicity / performance above all.** Adherence: strong; G's "every thread removes a source of truth / legacy / a third-party hop" is the cleanest expression yet.
4. **Delineate chronic + deferred and FOLD them** (don't perennially re-defer). Adherence: improving; G bounded the "infra wave, later" habit GA6 flagged, but still closed with owned residuals.
5. **Deep parallelization / agent orchestration as team lead.** Adherence: consistent.
6. **Do not relinquish control until complete IN TOTALITY.** Adherence: 🟡 — "in totality" is repeatedly qualified by named residuals + (now) a red CI the close did not surface.
7. **Lighthouse each page in prod AND dev.** Status: lip-service A→F, **DISCHARGED by G**. The cautionary precept: *Runtime Truth Beats Source Claims* (LESSONS-LEARNED 2026-04-29) — honored at last for Lighthouse.
8. **A close must prove the AUTOMATED deploy path delivered it** (inv-25, born from the ~2-month-dead webhook chain). Adherence: honored for fourier; constellation-incomplete.

### §3.2 — The lip-service pattern, generalized

GA6 found "Lighthouse in dev" was substituted with "curl returns 200." HA6 finds the identical substitution one layer over: **"CI green" substituted with "the individual gates I ran locally passed."** In both cases a *named, user-requested verification artefact* (a Lighthouse report; a green CI run) was replaced by a cheaper proxy, and the close read GREEN. inv-25 generalized this for *deploy*. The pattern clearly recurs for *test/CI signal* and deserves its own precept — otherwise H will discover the next instance of the same shape.

### §3.3 — The candidate NEW precept + invariant: **"green means green"**

**Proposed LESSONS-LEARNED entry:**

> **## 2026-05-31 — Green Means Green: A "Tests/CI Pass" Claim Cites A Green Run For EVERY Job**
> - **Source**: fourier-analysis G (`5e29ed0`). G closed GREEN-labeled asserting "pytest 132/83 / vue-tsc+build / T7 12/12" — each true locally — while the repository's `CI` GitHub Actions workflow was **`failure` on every push of the tranche**, including the close commit, because the `e2e (Playwright)` job failed wholesale. The close cited the constituent local gates, never the CI run id; the red e2e was uncited.
> - **Failure**: a green-sounding aggregate ("tests pass", "CI", a GREEN close) asserted over a red constituent job. Local `pytest`/`vue-tsc` passing is NOT the CI workflow passing — CI exercises paths (e2e, live-Mongo, build matrix) the local gates never run. The same honesty shape as the dead auto-deploy (inv-25): the canonical signal is red while the close reads green.
> - **Rule**: any close (or any "CI green / tests pass" claim) MUST cite a **green CI run id covering EVERY job** of the canonical workflow for the closing commit. If a job is red, the close states which, why, and books fixing it as a same-tranche gate — it does NOT substitute a passing subset of local gates for the workflow, and does NOT label a GREEN close while CI is red.
> - **Check**: the close ceremony cites (a) the closing commit's hash, (b) a `gh run` id whose conclusion is `success` with **no failed/skipped job that should run**, and (c) for each named gate (pytest, vue-tsc, build, e2e, conformance) the job within that run. A passing local invocation is necessary but NOT sufficient.

**Candidate invariant — inv-27 (green-means-green):** a tranche close MUST cite a CI run id that is `success` across all jobs (or explicitly enumerate + book each red job as a same-close gate). Testable gate: `gh run view <id>` for the close commit shows every job ✓. Natural co-enforcement: a `deploy-hook`/close-ceremony check that refuses GREEN if the latest `CI` conclusion ≠ success. This is to *test signal* what inv-25 is to *deploy signal* — and H is where it is first enforced (by making fourier CI actually green).

---

## §4 — The unaddressed / partial set (the H spine)

The precise list of requests NOT fully honored, in priority order. These seed H:

| # | Open/partial item | From | What "perfect" requires |
|---|---|---|---|
| **U1** | **fourier CI is RED** — `e2e (Playwright)` fails wholesale (`contour-extraction.spec.ts` whole suite ✘); latest `gh run 26719598467` = failure even after `b28c3fa`. | GE1/GE3/GE5; §2-i | Root-cause + fix the e2e job → a green CI run covering all 3 jobs; cite it (inv-27). Top priority. |
| **U2** | **Constellation CI reds + no-CI repos** — value.js CI red (both jobs, `26620907499`/`26620907487`); words/floridify + speedtest have NO CI; csp-solver deploy-CI `.disabled`. | GE2/GE3/GE5; survey §28 | The "CI green for every repo" the user asked for: bring value.js green; stand up CI for words; decide speedtest (see U4); enable csp deploy-CI. inv-16-bounded for non-fourier (ASK-coordinated). |
| **U3** | **api.color / api.sudoku endpoint gaps (inv-22 partial)** — `api.color.babb.dev` serves `/`→200 but `/health`/`/docs`/`/openapi.json`→404 (live, G.ζ); the "symmetric" reading is unmet off fourier. | GE2/GE3; INVARIANTS §2.7 | Value.js-owned (inv-16): an ADOPTION-ASK to bring color/sudoku APIs to the 4-endpoint contract, re-stale-watched; OR formally scope inv-22 to fourier-only and stop implying constellation symmetry. |
| **U4** | **speedtest scope correction — `speedtest.friday.institute`, NOT babb.dev** | GE4 | Record the corrected model (separate suite, not a babb.dev `:8140` app); retire the "speedtest.babb.dev"/":8140 vhost" framing as a category error; decide if friday.institute speedtest gets its own CI/deploy bring-up or is explicitly out-of-constellation. "handle that regardless." |
| **U5** | **`words` / floridify hardening + CI** | GE3/GE5; survey | words/floridify has no CI and minimal docker hardening (survey §30); ASK to lift it to the floor + add CI. |
| **U6** | **inv-26 partial — 4th equation-domain type island** (`web/src/lib/equation/types.ts`, 10 importers). | §2-iv; G FINAL §4 | Ratify as legitimately-distinct (document the boundary) OR converge — so "single contract source" is true codebase-wide, not boundary-only. |
| **U7** | **WORKERS=4 rate-bucket honesty** — per-process limiter → effective ~4×180, not 180. | §2-iv; G FINAL §4 | Either land a shared store (Redis) / WORKERS=1 for a true single bucket, OR re-present the budget honestly as per-process×N. The number presented must equal the number enforced. |
| **U8** | **inv-27 "green means green"** — not yet a precept/invariant. | §3.3 | Author it into `docs/precepts/instructions/LESSONS-LEARNED.md` + INVARIANTS; make a green CI run id a close gate; co-enforce in the deploy-hook/close ceremony. |
| **U9** | **Constellation deploy-dir / VCS divergence** — 3 locations, 2 VCS models; palette-api rsync-no-git. | GE2; survey §32 | The N1 ASK (palette-api rsync→git) + deploy-root canonicalization; inv-16 maintainer-owned, re-stale-watched. |

The first four (U1–U4) are the literal content of "perfect the above" + the speedtest correction and are H's binding core. U5–U9 are the fold-in chronics/honesty items.

---

## §5 — Scope correction (baked in, per GE4)

**Correct model**: `speedtest` is **`speedtest.friday.institute`** — a SEPARATE suite under the `friday.institute` domain, NOT a `babb.dev` constellation application.

**Prior framing that is now a recorded category error** (all to be superseded, none re-asserted in H):
- D normalization (D.W9, `project_tranche_d.md`): listed speedtest as a babb.dev constellation app and "the CF-Pages `wrangler pages deploy` template / reference recipe."
- E (`project_tranche_e.md`): "Dead :8140 speedtest vhost (operator; already 404)."
- F (`project_tranche_f.md`): "γ operator-window … speedtest `:8140` teardown."
- GA2 (`GA2-deploy-constellation.md` lines 85, 197) + survey (`SURVEY-FINDINGS.md`): grouped `speedtest` with words/value.js/csp under the babb.dev deploy matrix; flagged a committed `cfat_*` token (S2 — already WITHDRAWN by maintainer as non-sensitive).
- `project_infra_plan.md`: "8140 speedtest" port block.

**The error**: these conflated a `friday.institute` suite with the `babb.dev` constellation. Any "speedtest.babb.dev down" / ":8140 speedtest vhost" reasoning was therefore a **category error** — the `:8140` vhost teardown (if it existed) is unrelated to the live `speedtest.friday.institute` suite. H's mandate ("handle that regardless"): record this correct model, retire the babb.dev-speedtest framing, and treat `speedtest.friday.institute` on its own terms — its own CI/deploy posture decided explicitly, not assumed-into the constellation. (Note: the WITHDRAWN S2 token finding was about the babb.dev-framed speedtest repo; with the correction it is doubly moot — wrong target *and* non-sensitive.)

---

## §6 — Folds to H

- **H-MANDATE**: HE1 IS the H-authoring substrate; this HA6 ledger (67 prompts) is the canonical H-opening prompt ledger of record; H's own recap inherits this (DA5→EA4→FA6→GA6→HA6 chain).
- **H-CORRECTION-1 (the headline)**: make fourier CI actually **green** (fix the e2e job) and adopt inv-27 "green means green" — a close cites a green CI run id covering every job (§3.3, U1, U8). This discharges the §2-i VIOLATED.
- **H-CORRECTION-2**: surface + perfect the **constellation CI/deploy truth** (value.js red; words/speedtest no-CI; csp disabled) — the literal "status on CI for every repo" + "perfect the above" (U2, U5, GE3/GE5).
- **H-CORRECTION-3**: bake the **speedtest = friday.institute** scope correction (U4, §5); retire the babb.dev framing.
- **H-CORRECTION-4**: reconcile the **honesty residuals** — WORKERS=4 budget (U7), inv-26 4th island (U6), inv-22 color/sudoku gap (U3) — present each number as enforced, not aspirational.
- **H-RESIDUAL-INHERITANCE**: G's owned residuals (WORKERS=4, compose-hardening per-image, CSP font-src, inv-22 color, the 6 adoption asks + dispatcher-retirement) carry their 30-day stale-watch into H; H bounds rather than re-defers.

---

## §7 — Headline finding

**67 prompts; the prior "0 OUTSTANDING" boast no longer holds — GE3/GE4/GE5 are genuinely OPEN, and one prior close (G) was GREEN-labeled while CI was RED.** GA6 caught "Lighthouse in dev" as three-audit lip-service; G finally honored it — but in the very same tranche let the CI workflow stay red (the `e2e (Playwright)` job fails wholesale) and closed GREEN citing only the local gates, never the CI run id. That is the *same honesty shape* as the dead auto-deploy that birthed inv-25, now applied to test signal — hence the candidate **inv-27 "green means green"**: a "CI/tests pass" claim must cite a green run for EVERY job, or enumerate and book each red one. The user's NEW directives — "status on deploy + constellation," "status on CI for every repo," the speedtest=`friday.institute` correction ("handle that regardless"), and "perfect the above" — are the open spine of H: fix fourier's red e2e, surface and perfect the constellation CI/deploy truth (value.js red; words/speedtest no-CI), correct the speedtest category error, and reconcile the WORKERS=4 / inv-26 / inv-22-color honesty residuals so every presented number equals the enforced one. Had HA6 trusted G's FINAL gate table at face value (as GA6 warned), it would have declared "all green" while CI was red for the entire tranche.

End of HA6-prompts-precepts.md.
