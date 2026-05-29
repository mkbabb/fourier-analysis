# GA6 — Prompts + Precepts Recapitulation (the completeness audit)

**Lane**: GA6 of the 6-lane G-development audit (READ-ONLY; tranche development, not implementation).
**Subject**: the user's explicit requirement — "Recap ALL of our prompts and requests hitherto and ensure they've been addressed."
**Baseline**: inherits FA6's 58-prompt ledger (`docs/audits/runs/2026-05-28-F-audit/FA6-prompts-precepts-recap.md`); appends the F-execution-session prompts; re-verifies recurring themes and precept adherence against the F close (`docs/tranches/F/FINAL.md` HEAD `d98da91`).
**Posture**: SKEPTICAL. The lane's failure mode is declaring "all addressed" when something was only partially done. The two claims under the harshest scrutiny: "Lighthouse in dev" and "no workarounds".

---

## §1 — The prompt ledger

### §1.1 — Inherited baseline (FA6, 58 prompts)

FA6 cataloged **58 prompts** across A→E + post-E (EA4's 55 + EE1/EE2/EE3): **56 ADDRESSED-COMPLETELY, 0 PARTIAL, 2 ROUTED-TO-F, 0 OUTSTANDING**. The 55 prior (A1–A15, B1–B5, C1–C7, CE1, D1–D11, CE2–CE10, E1–E7) verified at E-close HEAD `f422b52` with no regression. The 2 ROUTED-TO-F (E6/E7) were DISCHARGED inside FA6 itself. EE1/EE2/EE3 ADDRESSED. **GA6 inherits this baseline as-is** — no re-litigation of A→E; the F close did not regress any of it (T7 12/12, pytest 214/214 at `d98da91`).

One correction to the inherited verdict, recorded honestly below in §1.2: **EE1's "Lighthouse in dev" sub-clause was marked ADDRESSED but was in fact never honored** (it was paid lip service across the entire F lineage). FA6 did not catch this. GA6 reclassifies the *theme* (§2-i) as PARTIAL while leaving the prompt-level verdicts intact.

### §1.2 — Appended F-execution-session prompts (the new work since F was authored)

The directives that arrived AFTER F was authored (i.e. after FA1–FA6 + SYNTHESIS produced `F.md`):

| ID | Prompt (verbatim / paraphrase) | Session | Status | Evidence |
|---|---|---|---|---|
| **FE1** | "Begin and continue the current tranche … do not relinquish control until completed IN TOTALITY … NO quick solutions, NO workarounds: idiomatic, gestalt approaches" (the F-execution directive) | F-exec 2026-05-29 | **ADDRESSED-COMPLETELY (with two PARTIAL sub-clauses, §2)** | F ran W0→W13 end-to-end; CLOSED 2026-05-29 GREEN-with-named-residuals (`d98da91` + deploy `7c4e96b`). 12 fourier commits + 1 deploy-repo commit + 2 host-ops receipt sets. All §6 hard gates PASS. T7 12/12; pytest 214/214; vue-tsc + build green. "In totality" honored on the source surface (zero half-state in fourier source); the deploy chain — silently broken ~2 months — was root-caused + restored (`60f1f89`, `37da6f0`, `a04f636`, `4007ec5`, host W3a/W3b). **Caveats**: (a) 3 named residuals booked (real-client-IP, dispatch.sh retirement, 7 adoption asks) — owner-assigned, not half-state, but "in totality" is qualified; (b) the δ a11y/SEO/perf fixes were NOT Lighthouse-re-verified — see §2-i. |
| **FE2** | "Recap what remains" | F-exec 2026-05-29 (post-close) | **ADDRESSED-COMPLETELY** | Answered via FINAL §5 named-residuals + the `ADOPTION-ASKS.md` ledger; the recap names every open item with an owner + 30-day stale-watch. Read-only deliverable. |
| **FE3** | "DEEPLY audit with 6 agents … devise a path forward … architectural transpositions for elegance/simplicity/performance … NO legacy … fold chronic + deferred … recap ALL prompts … NOT an implementation phase. Tranche development only." (THIS G-audit's authoring directive) | G-author 2026-05-29 | **ADDRESSED (this round)** | The 6-lane GA1–GA6 dispatch under `docs/audits/runs/2026-05-29-G-audit/`; read-only; one deliverable per lane; folds to the G charter. This GA6 doc is the prompt-ledger lane. |

**New running total: 61 prompts** (58 inherited + FE1/FE2/FE3).
**Verdict count**: **58 ADDRESSED-COMPLETELY · 1 ADDRESSED-WITH-PARTIAL-SUB-CLAUSES (FE1) · 1 ADDRESSED-this-round (FE3) · 1 ROUTED-TO-G (FE3 = the G substrate itself) · 0 fully OUTSTANDING.**

There is **no fully-OUTSTANDING prompt**. The honest defects are at the *sub-clause / recurring-theme* layer, not the prompt layer — which is exactly the failure mode this lane exists to catch. See §2.

---

## §2 — Recurring-theme verdict (the skeptical core)

The user has repeated five demands across many prompts. Verified in PRACTICE, not as claimed:

### (i) "Lighthouse test each page in prod AND dev" — **PARTIAL / lip-service** ⚠️ (the headline GA6 finding)

This is the demand that has been least honestly honored, across the **entire** F lineage:

- **F-audit (FA1)**: ran **3 Lighthouse runs, all against PROD** (`/`, `/visualize`, `/paper`). The "dev" portion (§3) was a `vite` startup + **curl-200-status spot-check only** — NOT a Lighthouse run in dev. FA1's own tool budget reads "3 Lighthouse runs … + 1 dev startup attempt."
- **F-audit (FA2)**: Lighthouse against **prod only** (`color/keyframes/sudoku.babb.dev`); "dev" (§4) was again a `vite` startup + curl-200, not a Lighthouse run.
- **F-execution**: the δ fixes (`9bd80b3`: aria-labels, `/visualize` mismatch, meta-description, robots.txt, font-pin) were verified by `vue-tsc -b` + `npm run build` green **only**. There is **NO post-fix Lighthouse run** anywhere in `docs/tranches/F/` (FINAL, PROGRESS, or `receipts/`). The F-δ a11y gate is marked PASS citing the *commit* `9bd80b3` — it asserts `button-name: 0` failures and meta-description present, but cites **no live Lighthouse artefact** confirming the score moved. The perf "fix" (font SHA-pin) was explicitly NARROWED to a change Wχ-P3 conceded would NOT move LCP (LCP 7–8 s judged a CF-cold-edge/font artefact, not bundle).

**Verdict**: the user's "Lighthouse in dev" has been substituted with "curl returns 200 in dev" for two consecutive audits, and the post-fix re-verification (the whole point of a polish thread) was a typecheck+build, not a Lighthouse. The a11y/SEO improvements are *plausibly* live (the source edits are real and idiomatic), but the claim "F-δ a11y PASS" rests on source, not on the runtime artefact the user asked for — a direct collision with the existing precept *Runtime Truth Beats Source Claims* (LESSONS-LEARNED 2026-04-29). **G must run an actual Lighthouse pass — in BOTH prod and dev — to confirm the δ fixes landed and the LCP residual.** This is a PARTIAL that has now persisted across A-audit through F and must not drift into G unverified.

### (ii) "NO legacy code" — **HONORED**

inv-20 held across all 12 F commits. The `epicycle_cache`→`compute_cache` rename abandoned old docs cleanly; the stale `web/vendor` Dockerfile COPY and drifted lockfile were *removed*, not flagged-around (`60f1f89`, `37da6f0`). `git grep "as unknown as" web/src/` = 0 (E-verified, no F regression). Only legacy survivor is the intentional idempotent migration script. No `*_AVAILABLE` flags. CLEAN.

### (iii) "idiomatic, gestalt, NO workarounds" — **MOSTLY HONORED, ONE qualified item** ⚠️

Largely honored: nginx surgical `location =` blocks (idiomatic), RFC-7807 problem+json, ETag/If-Match, the cache parametric-key collapse, subprocess-isolation for the migration runner (the *correct* fix, not a hack). Two transpositions REJECTED precisely because they were manufactured (F-T-E1, F-T-S2) — discipline honored.

**The one qualified item — F-α rate-limit**: the gate passed via the charter's "observably non-static" **escape clause**, NOT the substantive "≥1 429 on 25-burst" clause, which was never exercised. The receipt shows `Remaining` *jittering* (238→239→238→237→236→237) — observably non-static but demonstrably NOT correct per-client counting. The real fix (real-client-IP behind the 2-hop Apache→nginx chain) was DEFERRED as a residual, and `read_limiter` was *widened* 240→1200/min as "global-safe headroom." Widening a limit to paper over a shared-bucket keying defect is the textbook shape of a workaround — it is honestly *labeled* as a residual (so not a violation), but the user's "NO workarounds" is satisfied only by the labeling, not by the resolution. **G should treat real-client-IP rate-limit correctness as a first-class thread, not a perennial residual.**

### (iv) "recap ALL prompts each time" — **HONORED (with the §1.1 correction)**

The DA5→EA4→FA6→GA6 inheriting-ledger chain is intact and is the canonical mechanism. GA6 continues it. The one slip: FA6 marked EE1's Lighthouse-in-dev sub-clause ADDRESSED when it was not — a recap-completeness miss now corrected here. The *practice* of recapping is honored; the *rigor* of the recap let one lip-service item through.

### (v) "deep parallelization with agents" — **HONORED**

F-development = 6-lane FA1–FA6 (`wnjru1x3a`). F-research = 8-agent Wα/Wχ (`w0ma5070c`). Constellation survey = 4-lane. This G-audit = 6-lane GA1–GA6. Consistently honored.

---

## §3 — Precept adherence

### §3.1 — The precepts that exist

`docs/precepts/` is a submodule. Core: `README.md` (KISS/DRY, execute-the-plan-no-stubs, substrate+consumer-land-together, no-overfitting, gates-close-on-evidence, research-challenged-before-plan, docs-at-wave-close, wave-item-explication, meta-terms-glossed). Plus the 58-entry `instructions/LESSONS-LEARNED.md`, `STYLE.md` (archaic diction + em-dashes), `cross-repo-dev-resolution.md`, `glossary/`. They are current (last touched 2026-05-27).

### §3.2 — Was FA6's systemic slip (fix-at-ROOT clustering at operator-window deferrals) resolved by F, or re-incurred?

**RESOLVED — and then partially RE-INCURRED in a NEW shape.** F's thread γ consolidated the operator-window work into a single W3a/W3b SSH window exactly as FA6 prescribed, and ROOT-CAUSED the deferrals rather than re-deferring: `:8140` vhost DISCHARGED (W3a), per-repo HMAC split EXECUTED (W3b), C9 numbering DISCHARGED (W6), compute-cache instrumentation DISCHARGED (W2), auto-migration GREEN-verified end-to-end (W8). This is a genuine root-fix, not another deferral. **However**, F closed GREEN-**with 3 NEW named residuals** (real-client-IP, dispatch.sh full retirement, 7 adoption asks). The first two are operator/infra-gated — i.e. the *same operator-window-deferral pattern* recurs in a new shape. The mitigating fact: they carry owners + a 30-day stale-watch, and 2 of 3 are inv-16-bounded (genuinely not fourier's to commit). Verdict: the slip was substantively resolved, not merely re-labeled, but the residual-with-owner mechanism is becoming a standing habit that G should bound (a tranche should not perennially carry "infra wave, later").

### §3.3 — NEW systemic slip from the F execution → proposed new precept

**The slip**: F discovered the constellation's auto-deploy chain had been **silently BROKEN for ~2 months** — the host pinned at `6039e95`; *every* tranche "closed" after that commit (C-tail, D, E, the I cohort) had in fact **never reached production via the webhook path**. Four masked defects (stale Dockerfile COPY, drifted lockfile, 3-layer migration defect, missing webhook secret on all 5 repos). Every one of those prior tranches closed citing source + local test + (for E/I) a *manual* SSH deploy — none verified that the *automated* path actually delivered the commit to prod.

This is a direct instance of a precept GAP. The existing *Runtime Truth Beats Source Claims* lesson covers "source ≠ rendered behavior" but does NOT cover "a *closed* tranche must prove its commit actually reached prod via the standing deploy mechanism, not via a manual one-off." Tranches were closing GREEN against a deploy path that was dead.

**Proposed NEW precept / LESSONS-LEARNED entry:**

> **## 2026-05-29 — A Close Must Prove The Automated Deploy Path Delivered It**
> - **Source**: fourier-analysis F (`d98da91`). The webhook auto-deploy chain was silently dead ~2 months (host pinned at `6039e95`); C-tail/D/E/I all closed GREEN having reached prod only via manual SSH (or not at all), while asserting "LIVE in prod."
> - **Failure**: a tranche close that cites a manual deploy — or only source/local tests — does not prove the *standing* deploy mechanism (the webhook/CI path) actually carried the closing commit to production. The automation can be dead while every close reads GREEN.
> - **Rule**: any tranche that claims "LIVE in prod" must cite a deploy-of-record driven by the **standing automated path** (webhook/CI delivery → build → migrate → health-gate), identified by a `deploy_run_id` or equivalent, for the **closing commit** — not a manual `deploy.sh` invocation. If the automated path is bypassed, the close states so explicitly and books restoring it as a same-tranche gate.
> - **Check**: the close ceremony cites (a) the closing commit's hash *as deployed*, (b) the automation event that delivered it (webhook delivery id / CI run id / `deploy_run_id`), and (c) a live health-gate artefact taken *after* that automated delivery. F's `0a7a743` inv-22-aware health gate is the right primitive — the precept makes citing its automated firing mandatory at close.

F itself partially remediated this going forward (the inv-22-aware health gate `0a7a743` now co-enforces on every deploy; per-repo HMAC restored), but the *precept* preventing recurrence does not yet exist. **GA6 recommends G adopt it.** (The deploy-repo `mkbabb/deploy` is the natural home for the mechanism; the precept is the rule.)

---

## §4 — Folds to G

- **G-MANDATE**: FE3 IS the G-authoring substrate; this GA6 ledger (61 prompts) is the canonical G-opening prompt ledger of record. G's own recap inherits this (DA5→EA4→FA6→GA6 chain).
- **G-CORRECTION-1 (the headline)**: honor "Lighthouse in BOTH prod and dev" *literally* — a real Lighthouse pass in dev (never once done across A→F) + a post-δ-fix Lighthouse confirming `button-name: 0` and the LCP residual. This discharges the §2-i PARTIAL that has drifted three audits.
- **G-CORRECTION-2**: promote real-client-IP rate-limit correctness from perennial residual to a first-class G thread (closes the §2-iii workaround-shaped item).
- **G-CORRECTION-3**: adopt the §3.3 new precept (close-must-prove-automated-deploy) into `docs/precepts/instructions/LESSONS-LEARNED.md`; make citing the inv-22-aware health gate's *automated* firing a G close gate.
- **G-RESIDUAL-INHERITANCE**: the 3 F residuals + 7 adoption asks + E's re-triggered set carry their 30-day stale-watch into G; G should bound the "infra wave, later" habit (§3.2) rather than re-defer.

---

## §5 — Headline finding

**61 prompts; 0 fully OUTSTANDING — but two recurring themes are honestly PARTIAL, and one NEW systemic slip is precept-worthy.** The prompt-level ledger is clean because the defects live one layer down: (1) **"Lighthouse in dev" has been lip-service for three consecutive audits** — substituted with a curl-200 startup, and the F-δ a11y/SEO/perf fixes were verified by typecheck+build, never by a live Lighthouse, colliding with the *Runtime Truth* precept; (2) **the rate-limit "fix" is a labeled workaround** (escape-clause pass + limit-widening over a shared-bucket keying defect), with the real fix deferred; (3) the **F-discovered ~2-month-dead deploy chain** exposes a missing precept — closes were asserting "LIVE in prod" while the standing automated deploy path was dead and only manual SSH reached prod. F substantively resolved FA6's operator-window slip but re-incurred a smaller version of it as 3 new infra residuals. The lane-failure-mode warning is vindicated: had GA6 trusted the F gate table at face value, it would have declared "all addressed" while a11y was never Lighthouse-verified and the deploy precept gap stayed open.

End of GA6-prompts-precepts.md.
