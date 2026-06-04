# J post-impl audit — SYNTHESIS (the path forward)

**Run:** `docs/audits/runs/2026-06-04-J-postimpl-audit/` · **6 dimension auditors** (A1 plan/waves · A2 W2 CORE code · A3 deploy chronic · A4 e2e/CI chronic · A5 prompt/precept coverage · A6 chronic/deferred/no-legacy)
**Subject:** fourier-tranche-J after this session's W2–W4 implementation · `origin/master` HEAD = `9d7c387` (NOT deployed; host stuck at `f2fe447`, 29 commits behind)
**Directive (binding):** "DEEPLY audit … devise a path forward: NO quick solutions, NO workarounds: idiomatic, gestalt … architectural transpositions for elegance, simplicity, performance … NO legacy code … fold ALL chronic + deferred items … recap ALL prompts … Tranche development only."

---

## §0 — The shape verdict (the question the brief poses)

**J STAYS OPEN. It does NOT close now, and it does NOT fold. The successor tranche is `K-deploy` (ordering ν′); the previously-booked WebMCP-K is RENAMED to `L-webmcp` to preserve chain honesty.**

The brief asked three shapes; here is the decision and the gestalt reasoning that picks it.

| Candidate shape | Verdict | Why |
|---|---|---|
| **(a) J closes now + new successor carries W5–W8 + chronics** | **REJECTED** | J cannot honestly close: CI is red (inv-27 unmet, no green run id over `9d7c387`), W5–W8 are all `planned`, the CORE has **zero frontend consumer** (inv-15 breach — A6-NL-1), and the deploy-of-record never landed (inv-28 unmet). Closing J now would be the exact inv-25 honesty shape H was opened to kill ("claim verified against a red surface"). Splitting W5–W8 into a successor would **fracture the data-model close** — W5/W6 are J's own diff-viewer/publish UI, the consumers that make the CORE non-phantom. |
| **(b) J stays open; a SEPARATE tranche carries ONLY the cross-repo infra chronics** | **ADOPTED (refined)** | The DEPLOY backlog + the inv-28 API-arm gate + the glass-ui-3.2.0 e2e dependency are **constellation-infra + cross-repo chronics of the F/H lineage**, not J-local data-model work (A1-F4, A3, A5-F1, A6-A3). Dropping a months-class deploy chronic into a data-model close is the anti-pattern the directive forbids. They earn their own **named tranche K-deploy** with acceptance shapes — NOT a quiet J residual. **BUT** (the refinement, see §1) the e2e/glass-dock gate is the literal blocker on J's *own* W6 inv-27 close gate, so the dock-VT ADOPTION-ASK is **folded into J now** (doc-only, today) while its *fix-landing* is gated on glass-ui 3.2.0 inside K-deploy's adoption wave. |
| **(c) Fold J entirely into the successor** | **REJECTED** | J's CORE is real, idiomatic, and 266/266 green locally (A2). Folding a substantially-built data-model tranche backward into an infra tranche would erase the W2 artefact lineage and conflate two unlike concerns (data-model integrity vs deploy/cross-repo). |

**The two-tranche resolution, stated once:**

- **J (ν is wrong — J is μ′; stays μ′)** completes its own data-model arc: close the CORE's inv-15 consumer gap (wire the 7 endpoints to a real UI), resolve the W2 model-integrity P1s (A2: palette-PATCH-outside-versions, crash-window, §11 prose), ship the WC/evidence/tail leaf waves, and reach a green CI run **once K-deploy lands the dock-VT fix that unblocks e2e**. J's close is *downstream* of K-deploy's e2e unblock.
- **K-deploy (ordering ν′)** is the new successor: land the 29-commit backlog to babb.dev with an observed-green health gate, build the inv-28 API-arm green-CI gate, kill the silent-rollback chronic with off-host observability, and carry the glass-ui-3.2.0 adoption wave (the dock-VT ASK + P5-inner-rounding + asideSide + useTextHighlight) that unblocks J.W6.
- **L-webmcp (further-out)** keeps the booked WebMCP feature graduation (Chromium-146-stable-gated), renamed from the stale "K" booking in `J.md §10` so the infra chronic and the feature graduation are never conflated.

**Dependency direction (the load-bearing insight):** K-deploy's glass-ui-3.2.0 adoption wave is a **hard upstream dependency of J's W6 close**. So although J is "older," **K-deploy executes the e2e unblock that J's inv-27 close gate consumes.** The two tranches run interleaved, not strictly sequential; the chain-honesty is: J cannot reach its green-run close gate until K-deploy (or the glass-ui maintainer it asks) lands the dock fix. This is named explicitly here so no future session reads "J open, K open" as a contradiction.

---

## §1 — The five convergent findings (where ≥3 auditors agree — the spine of the plan)

1. **J cannot close (4 auditors: A1-F2, A5-F2, A6, A4-5).** CI red on `9d7c387` (run `26913592291`, e2e ✗), W5–W8 `planned`, deploy unlanded. inv-27 + inv-28 both unmet over HEAD.

2. **The CORE is substrate-without-a-consumer (A6-NL-1, A6-NL-F, A1-F1).** *Verified this session:* `grep` of `web/src/lib/api.ts` for `remix|/forks|/provenance|/diff|/versions|publish|unpublish` = **0 hits**; the TS twins exist (`web/src/lib/types.ts:279-344`) but no client method or UI calls any of the 7 endpoints, and `web/src/stores/gallery.ts:219-235` still routes publish through the generic PATCH rather than the new `POST /:slug/publish` verb. This is a **binary inv-15 breach at HEAD** — the CORE is half-shipped until W5/W6 land the diff-viewer + publish UI. This is also the *deepest* elegance/simplicity transposition the directive demands: A1-F1 separately found the *within-viz version chain* is structurally degenerate (every viz holds exactly ONE version forever; depth always 0; `version_count` incremented nowhere) — so the CORE simultaneously over-builds a dead substrate AND under-wires the live one.

3. **The dock-VT e2e blocker is real, pre-existing, single-root-cause — and UN-LEDGERED (A1-F3, A4-1/2/3, A5-F2, A6-A4).** *Verified:* the `glass-ui-dock-vt-name` row is **absent** from `ADOPTION-ASKS.md §7` (which ends at `glass-ui-P5-inner-rounding`). A4 corrected the root cause: it is a **setup-local counter** (`dock.js:228 let n=0` inside `setup()`), not a module counter — every GlassDock instance independently mints `glass-dock-1`, so two co-mounted docks always collide; the fix is `useId()` (A4-1), not "fix the counter." A4-2 found the warning is **not cosmetic**: during the viz↔workspace `startViewTransition`, the browser drops the duplicate-named snapshot → **the dock geometry-morph silently fails in prod while editing.** One symptom = two defects (inv-27 red + a real visual regression).

4. **The deploy chronic is a verified close-blocker, not a booked footnote (A3 entire, A5-F1, A6-A3).** Host stuck at `f2fe447` (verified: `git log f2fe447..9d7c387` = 29 commits). A3 root-caused the gate failure to **backend lifespan startup-blocking** (`api/main.py:42` `await connect_db()` inside lifespan; `database.py:24-48` raises on timeout then builds ~30 indexes incl. the new J fork indexes at `:97-109` *before* `/api/health` answers) and **the 60s gate being too tight for a 29-commit cold WORKERS=1 start with no container HEALTHCHECK** (A3-F3/F4). A3 RULED OUT the inv-22 `/→404` half (nginx-direct, `fourier.conf:63`) and the J backend (empty prod DB → no-op migration runs post-gate) as the cause — correcting the session's own "or the frontend" hypothesis. The chronic is invisible because (A3-F1) the API arm has **no green-CI gate** and (A3-F2) a rollback **reaches no constellation-watched sink** — `grep` of `deploy-hook.sh` for any off-host notify = none. This is the F "2-month silent webhook" anti-pattern, structurally.

5. **The W2 CORE is sound but has two model-integrity P1s the version system must resolve (A2-1/2/3, A2-5).** PATCH mutates the `palette_slug` *atom* outside the version system → `set_hash` goes stale, cached immutable 1yr (A2-3, the deepest gap). The no-transaction remix leaves a crash-window where `/diff` reads `identical=True` over a real fork (A2-1), and the migration self-heal **permanently cements** `atom_diff=[]` over a crash-orphaned fork (A2-2). The §11 "crash leaves no lie" prose is stale — the step order was *forced* to viz-first by the compound `_id` and the safety proof was never re-derived (A2-5). These FOLD-into-J (they are J-local data-model integrity), not into K-deploy.

**The gestalt these five describe:** J built a correct, idiomatic atom-diff PATTERN and a correct publish in-place flip, then (a) over-built a phantom version chain no operation grows, (b) under-wired the live endpoints to zero UI, (c) left an atom (palette) mutable outside the version model, and (d) shipped onto a deploy chain that has not delivered in 29 commits and an e2e gate red since before J began. The path forward is not "add waves" — it is **transpose for elegance** (delete the phantom chain; wire the real one), **resolve integrity** (one decision on palette-PATCH), and **split the infra chronic into its own honest tranche** (K-deploy) so the data-model close is not held hostage to the deploy chain.

---

## §2 — J: the remaining-wave plan (the data-model close, refined by this audit)

J keeps its `W0–W8` skeleton (PROGRESS status board). The refinements below land at the named waves. **J's §7 close gate is unchanged in spirit (a green CI run id over HEAD covering e2e) but now has an explicit upstream dependency: K-deploy's dock-VT unblock.**

| Wave | Status | Refinement folded by this audit | Consumer (inv-15) |
|---|---|---|---|
| **W0′** (re-open hygiene) | re-affirm | Author ordering ν′ is **K-deploy's** job, not J's — J's μ′ stands. **Ledger the `glass-ui-dock-vt-name` ADOPTION-ASK NOW** in `§7` (A4-3/A6-A4, doc-only). Amend §11 prose to the forced viz-first order + name the version-less-fork window honestly (A2-5). | the audit ledger; the W6 green path |
| **W2-fix** (CORE integrity — NEW, folds A2) | FOLD-into-J | **FORCE-resolve palette-PATCH** (A2-3): one explicit decision — `palette_slug` becomes **remix-only** (dropped from `VisualizationUpdate`) OR a palette PATCH mints a version + bumps `version_count`. No "leave it" option. **+** `/diff` honor-or-reject the `to` param (A2-4). **+** stop the migration cementing `atom_diff=[]` over a real fork — recompute the delta from the two HEAD snapshots when `fork_of_hash` is set (A2-2). **+** the NIT batch (A2-6/7/8/9/10: `content_hash` divergence note, `fork_count` KeyError hardening `.get(…,0)`, None-safe sort, no-op-write prose reconcile, ForksPage twin). | the version-chain integrity invariant; the diff/versions/provenance readers |
| **W2-transpose** (DELETE the phantom chain — NEW, folds A1-F1) | FOLD-into-J | **DELETE** `VisualizationVersion.{parent_hash,depth,root_hash}` + `version_count` + `GET /versions` + the within-viz provenance `chain`, keeping ONLY the single per-viz atom snapshot `/diff`'s recorded-delta actually reads (KISS / NO-LEGACY — ship what has consumers, delete what doesn't). This is the directive's elegance transposition. *Alternative recorded-and-declined:* a real edit-creates-a-version operation that fills the chain is a CORE expansion, not the KISS line. | `/diff` (the only real reader); cross-viz `fork_of` lineage (correct, kept) |
| **W5** (WC design + UI consumers) | planned · **glass-ui-3.2.0-gated** | The 4 WC lenses on the CORE surfaces (gallery, **diff-viewer, publish/visibility UI**). **+ the inv-15 close-gate: wire the 7 endpoints to a real client + UI** (A6-NL-1) and **re-point `gallery.publish()` onto `POST /:slug/publish`**, retiring the PATCH-to-public path (A6-NL-F). **+** retire the `cartoon-card` dead-class shim (`style.css:98-108`, A6-L9 — if W5 slips a 4th time, KILL the shim standalone). **+** the §A empty-state void compose; configurator stays RIGHT (DEC-1). | the human + the agent (the CORE's reason to exist) |
| **W6** (EVIDENCE) | planned · **dock-VT-gated** | The remix-flow + publish-flow e2e + γ/δ measured deltas + axe — **as a GREEN CI run (inv-27)**, UNBLOCKED only by K-deploy's dock-VT fix. **+ consolidate the 5 divergent console-error filters** into one `web/e2e/_probes.ts` helper (A4-4, DRY/NO-LEGACY) **+ a kill-dated exact-string bridge + self-deleting satisfaction probe** for the dock warning (A4 fold Part B — a legitimate bridge: it changes the gate's knowledge of a TRACKED external defect engineered to expire, it does NOT mask product behavior; the repo already whitelists 401/404/412/429). **+** assert no live row carries `set_hash==''` post-backfill (A5-F3/A6-NL-A — closes the migration-sentinel smell). | the inv-27 green claim; the deploy unblock |
| **W7** (CSP/tail) | planned · glass-ui-3.2.0-gated | the ι tail (CSP propagation confirm + `fetchLater()` behind `sendBeacon` floor). Unchanged. | per-consumer CSP; analytics |
| **W8** (close) | planned | `FINAL.md` cites the green run id (post-W6, post-dock-fix) + the `/diff` + publish envelope parity verdicts + the chronic-resolution block + the inv-26 4th-island one-line re-confirm (A6-L11) then DROP it from every ledger. | the close reconciliation |

**Honest scoping note (A1-F5, A5-F4, A2-9):** W3/W4 are real and idiomatically scoped (scheduler.yield single live consumer + named non-target rationale is inv-15-correct, not theatre), but their MEASURED INP/CWV deltas are deferred to W6 and currently unmeasured — so even the leaf waves are evidence-incomplete at HEAD. The publish "re-publish-no-duplicate" requirement IS structurally honored (`visualizations.py:656-659`, only verb is `update_one $set` guarded by `target != current`, no `insert_one` anywhere on the publish path) — the runtime e2e proof of it is owed at W6.

---

## §3 — K-deploy: the new successor tranche (ordering ν′) — wave skeleton

**Letter: K-deploy.** **Ordering: ν′** (the chain is κ′=H → λ′=I → μ′=J → **ν′=K-deploy**; written into `CANONICAL-ORDERING §20` at K.W0). **CORE = the two highest-stakes chronics: the DEPLOY backlog/health-gate and the e2e/glass-dock inv-27 gate.** This is the tranche the directive's "fold ALL chronic items into a NEW tranche" demands for the infra/cross-repo class.

| Wave | Disposition | Contents | Consumer (inv-15) |
|---|---|---|---|
| **K.W0** — open + ordering ν′ + ledger | DEV | Write `CANONICAL-ORDERING §20 / ordering ν′`. Confirm the `glass-ui-dock-vt-name` row J.W0′ seeded (owner glass-ui, gate 3.2.0). Name the **single human dependency**: the host-only read-only GitHub PAT for the inv-28 API-arm gate (operator-owned). | the chronic ledger |
| **K.W1** — LAND the 29-commit backlog (observed, not blind) | SHIP | A3 Fold A. Pre-flight host tree clean + `image_blobs` external volume exists (A3-F6 latent traps). Manual **observed** bring-up of `9d7c387` capturing `docker compose logs backend` + `curl :8100/api/health`. If lifespan-index-blocking (A3-F3): move index creation **non-blocking-after-serving** OR add a real container `HEALTHCHECK` + `depends_on: condition: service_healthy` (A3-F4 — the idiomatic fix, NOT a blind longer poll). If still too tight, raise `GATE_RETRIES` ONLY paired with the HEALTHCHECK. | babb.dev (G/H/I/J finally LIVE) |
| **K.W2** — build the inv-28 API-arm green-CI gate | SHIP | A3 Fold B. `deploy-hook.sh` gains `green_ci_gate()` querying `commits/<sha>/status` BEFORE `git reset --hard`; **fails closed** (no PAT → refuse, the correct safe state). The current e2e-red `9d7c387` is the first SHA it blocks — making inv-27 hold for the *deploy*, not just the merge. | the deploy-of-record (inv-28 API half BUILT) |
| **K.W3** — kill the silent-rollback chronic | SHIP | A3 Fold C. The three terminal states (DEPLOY OK / ROLLBACK / no-green-ALERT) POST to a constellation-watched sink (ntfy/Discord/Slack webhook, host-only untracked `.env`, mirroring the HMAC-secret discipline). **Backport to `deploy/templates/deploy-hook.sh`** so every repo inherits it. A rollback must page, not whisper — the third silent-for-months failure must be impossible. | the operator / the constellation |
| **K.W4** — glass-ui-3.2.0 adoption wave (UNBLOCKS J.W6) | SHIP / BOOK | The bundled glass-ui-3.2.0 adoption: **dock-VT `useId()` fix** (the inv-27 unblock), **P5-inner-rounding**, **`Configurator asideSide`**, **`useTextHighlight`**, **glass-ui-a11y `inert`**. fourier executes the *adoption* (bump + consume) once glass-ui ships 3.2.0 (inv-16′, per-repo-green-CI-gated); the *upstream fix* is glass-ui-maintainer-owned (inv-16, fourier holds no lever). **Kill-date = the glass-ui-3.2.0 adoption commit.** | J.W6 e2e green; the P5 user defect |
| **K.W5** — operator entrypoint adoption | FOLD | Adopt `scripts/dev.sh` (conformance rewrite, already landed this session) + `scripts/deploy.sh` wrapper + the dev-deploy-standard as fourier's canonical operator entrypoint — **reconcile `deploy.sh`'s advisory health-gate to report the same truth the on-host gate enforces** (A3 Fold A). Ship the wrapper WITH the fixed spine it wraps (K.W1–W3), not before — until then it is inv-15 substrate-without-a-closed-consumer. | the operator |
| **K.W6** — value.js-J inv-16′ peers (cohort) | BOOK | The two ledgered peers (`valuejs-J-atomdiff`, `valuejs-J-publish`, `ADOPTION-ASKS §7`) — per-repo-green-CI-gated; the `/diff`-envelope + publish-envelope parity (against `J-diff-shape.md`) is the cross-repo close-gate. booked-not-executed is honest if value.js-J slips (inv-16). | the J↔value.js cohort parity |
| **K.W7** — dispatch.sh retirement (gated) | BOOK | Gated on ALL FOUR non-fourier repos adopting per-repo `deploy-hook.sh` + `hooks.json` arms (Ask 2/3; value.js/palette-api rsync→git is the critical-path fourth). Kill-date = the fourth migration's green acceptance; until then deletion 404s un-migrated arms. fourier holds no lever (inv-16). | the constellation deploy spine |
| **K.W8** — close | DEV | `FINAL.md`: babb.dev observed-green at `9d7c387+`; inv-28 API arm fails-closed-without-PAT; a rollback pages a watched sink; the dock-VT fix landed → J.W6 unblocked. 30-day stale-watch re-triggered. | the close reconciliation |

**Every K-deploy wave names a consumer (inv-15 satisfied).** The single human dependency (the read-only PAT) is named once (K.W0/K.W2) and the gate fails closed without it — the correct safe state, not a punt.

---

## §4 — CHRONIC LEDGER (terminal verdicts — zero perpetual punts)

| Chronic | Lineage | TERMINAL verdict |
|---|---|---|
| **CH-DEPLOY** — months-class babb.dev API deploy outage (host `f2fe447`, 29 commits G/H/I/J never deployed) | F "2-month webhook" → this session | **BOOK-with-kill-date into K-deploy (W1+W2+W3 shipped as waves, NOT a punt).** CLOSED when: (1) `9d7c387+` observed-green in prod (K.W1); (2) the API arm refuses a red-CI SHA, fails-closed-without-PAT (K.W2); (3) a rollback pages a watched sink (K.W3). Single named human dependency: host-only read-only PAT (operator). Root cause A3-confirmed = lifespan index-blocking + 60s-too-tight cold start; J backend RULED OUT; inv-22 RULED OUT. |
| **glass-dock-1 duplicate VT-name** — inv-27 e2e red (~13 specs) | pre-existing (prior master `26831216131` identical) | **FOLD-into-J (ledger NOW, J.W0′) + BOOK-with-kill-date in K.W4 (glass-ui 3.2.0).** Root cause A4-corrected: setup-local counter (`dock.js:228`), fix is `useId()`. Ledger the `glass-ui-dock-vt-name` ASK today (it is ABSENT from `§7` — verified); W6 consolidates the 5 console-filters into `_probes.ts` + a kill-dated exact-string bridge + self-deleting satisfaction probe. Suite green NOW via the bridge; real fix owned + kill-dated; bridge structurally incapable of perpetual punt. **Also fixes a real prod regression** (silent dock-morph failure, A4-2). |
| **inv-28 API-arm green-CI gate** "BOOKED-not-built" | named at H, carried to J | **BUILD in K.W2** (not a third book). Fails-closed without the named PAT. |
| **§11 "crash leaves no lie" overstatement** | W1 deep-audit P0 fold → W2 docstring | **BOOK-with-kill-date (J.W0′ prose amend + W2-fix).** Kill = a passing crash-window test (viz present, version absent) proving `/diff` recomputes-the-delta-or-404s rather than lying `identical=True`. No further "crash-safe" claims until that test exists. |
| **PATCH editing remix atoms outside the version model (`palette_slug`)** | shipped since fourier-B; newly load-bearing at J | **FORCE-resolve in J.W2-fix.** One decision: remix-only OR mint-a-version-on-PATCH. No third "leave it" option — the version-chain integrity invariant requires one of the two. |
| **Degenerate within-viz version substrate** (depth always 0, single-element chain) | NEW (A1-F1) | **FOLD-into-J (W2-transpose): DELETE** the unfilled chain fields/endpoints (KISS/NO-LEGACY), keep the single per-viz atom snapshot `/diff` reads. The directive's elegance transposition. |
| **CORE inv-15 (7 endpoints, 0 frontend consumer; gallery.publish bypasses the verb)** | NEW (A6-NL-1/F) | **FOLD-into-J (W5/W6) as a binding close-gate.** Wire the client + UI; re-point `gallery.publish()` onto `POST /:slug/publish`. The CORE is half-shipped until this lands. |
| **P5 inner-ConfiguratorLayer-rounding** (the literal user defect) | P5 → deep-audit → J | **BOOK-with-kill-date in K.W4** (glass-ui-owned, 3.2.0-gated). Verified by a visual-evidence satisfaction test; NOT satisfied until the inner sections round. fourier holds no lever (inv-16). |
| **glass-ui-a11y `inert`** | H.W1 | **BOOK-with-kill-date in K.W4** (un-fixme on the 3.2.0 `inert` release). Co-dated glass-ui cohort-health. |
| **cartoon-card dead-class shim** (`style.css:98-108`) | D.W4 artifact, carried B/C/D/J | **SHIP-as-wave J.W5 (retire).** If W5 slips a 4th time, KILL the shim standalone (chrome-only, revertible). A live NO-LEGACY item. |
| **valuejs-J-atomdiff + valuejs-J-publish** inv-16′ peers | J deep-audit fold | **BOOK-with-kill-date in K.W6** (kill = value.js-J close). Per-repo-green-CI-gated; the cross-repo parity is the cohort close-gate. inv-16 held. |
| **e2e/axe inv-27 green proof** (I→J carry) | I → J | **SHIP-at-J.W6**, UNBLOCKED by K.W4 dock fix. No further deferral — J's §7 close gate blocks on it. |
| **dispatch.sh retirement** + the 7 constellation adoption asks | D/E/F→G→H→J | **BOOK-GATED with triage in K.W7.** Deletion gated on all-4-migrate (mechanical, not a punt); Ask 3 (P1, 4th migration) + words-spa (P1 prod 404) + Ask 6 escalate; P3 hygiene stale-watch. Maintainer-owned (inv-16). |
| **VAL-9** (spring→LinearStop[] emitter) | G→H→I→J (3×) | **KILL (value.js-J.W0).** keyframes owns the emitter, glass-ui consumes it from there; lifting to value.js inverts a dependency for zero de-dup; ≥2-consumer gate structurally unmeetable. fourier disclaims. |
| **VAL-1** (OKLab aurora-LUT) | G→H→I→J (3×) | **BOOK-with-hard-kill-date (value.js-J.W0 re-check).** Ship IFF glass-ui `deriveAurora()` + 2nd consumer live, else KILL at close. fourier disclaims. |
| **CH-6** (value.js 6-tranche glass-ui-primitive carry) | value.js A→H (6×, worst chronic) | **FORCE-TERMINAL at value.js-J.W0** — each ask gets KILL-as-moot / RE-EXPRESS-as-inv-16′ / SHIP; no 7th carry. fourier names-to-flag only. |
| **C1 / CH-3 colour-lift** | fourier B→C→D→G (3×) | **KILLED (recorded, J.md §8).** `easings.ts` self-sufficient, no fourier consumer (inv-15); deadlock dissolves. Terminal. |
| **set_hash='' migration sentinel** | NEW (W2) | **FOLD-into-J (W6 assertion).** Acceptable transient (read-time recompute via `_head_set_hash`); W6 asserts no live row carries it post-backfill, closing the smell. NOT a prohibited fallback. |

**Zero perpetual punts:** every chronic above has a SHIP-wave, a KILL, a BOOK-with-kill-date, or a recorded DECLINE. No item carries forward without a terminal verb.

---

## §5 — PROMPT COVERAGE (recap ALL requests hitherto)

| Prompt / request (reconstructed) | Status | Evidence / disposition |
|---|---|---|
| **"Begin" — dev.sh-P0 + J.W2 now** (2026-06-03) | ADDRESSED | W2 CORE landed `7d95af6`; dev.sh/deploy.sh landed; `pytest api/` = 266. |
| **W3/W4 "land now, not 3.2.0-gated"** | ADDRESSED | `9d7c387`; scheduler.yield + content-visibility; honest single-consumer scoping (A1-F5). MEASURED deltas owed at W6. |
| **"publish two ways, private/public; re-publishing must NOT duplicate — flip in place"** | ADDRESSED (structurally) | `visualizations.py:656-659` only verb is `update_one $set` guarded by `target != current`; no `insert_one` on the publish path (A5-F4). Runtime e2e proof owed at J.W6. |
| **The atom-diff/remix/provenance CORE (WAVE-D)** | ADDRESSED-WITH-INTEGRITY-FOLDS | Sound + idiomatic (A2 SOUND-WITH-REFINEMENTS); P1 integrity gaps (palette-PATCH, crash-window, phantom chain) FOLD into J.W2-fix/W2-transpose. inv-15 consumer gap FOLDS to W5/W6. |
| **"deploy = babb.dev spine api.fourier.babb.dev"** | PARTIAL → FOLDED to K-deploy | Host 29 commits behind; health-gate fails. The BIG chronic; CH-DEPLOY → K.W1/W2/W3. No doc reads J's CORE as "in prod" until then. |
| **"gate on green CI incl e2e" (inv-27)** | HELD (red, not faked) → FOLDED | No green claim asserted over the red (PROGRESS = "CI-green pending push"). Blocked on dock-VT (K.W4 unblocks J.W6). |
| **"fourier = the instrumented-gate pilot for W6"** | BOOKED → J.W6 | The 5-filter consolidation + the kill-dated bridge (A4 fold). |
| **"J.W5–W7 after glass-ui 3.2.0"** | DEFERRED-BOOKED (honest gate) | Named release gate; re-checked at K.W4 / J.W5. Execute-or-re-affirm, no perpetual punt. |
| **Smell-test `set_hash=''` default** | ADDRESSED | Acceptable transient migration value w/ deterministic read-time recompute (A5-F3, A6-NL-A); W6 assertion closes the smell. NOT legacy/fallback. |
| **"DEEPLY audit … devise a path forward, NO workarounds, idiomatic/gestalt, NO legacy, fold ALL chronic+deferred, recap ALL prompts, tranche development only"** (this directive) | ADDRESSED (this synthesis) | §0 shape; §2 J refinements; §3 K-deploy skeleton; §4 terminal chronic ledger; §5 this table. Output is a tranche plan, no code. |
| **Prior-deep-audit A5 NITs** (A3 seed repo-qualified; value.js-J rows exist; P5 discrete row) | CLOSED | Verified: rows present in `ADOPTION-ASKS §7`; A3 seed `glass-ui:`-qualified (A5-F4). |

**Zero DROPPED / silently-unaddressed prompts.** Every request is ADDRESSED, HELD-honestly, or DEFERRED-BOOKED with a named gate.

---

## §6 — TOP RISKS (forward)

1. **Circular-looking but real dependency: J.W6 close gate ⟂ K.W4 dock fix ⟂ glass-ui 3.2.0 ship.** If glass-ui 3.2.0 never ships, J cannot reach a green-run close and the inv-28 SPA deploy stays correctly-skipped indefinitely. Mitigation: the K.W4 kill-date + the W6 self-deleting bridge make the suite green NOW (bridge) while the real fix is owned; but the *honest J close* still waits on the upstream. Name this in both FINAL.md files.
2. **The deploy chronic could recur a third time** if K.W3's off-host observability is not actually wired (the F/H lineage is two silent-for-months failures already). The HEALTHCHECK + service_healthy gate (K.W1) and the paging sink (K.W3) are the structural fix, not a longer poll.
3. **Palette-PATCH decision (J.W2-fix) is load-bearing for every cached `/diff`.** Choosing wrong (or "leave it") leaves a stale-`set_hash` row cached immutable 1yr asserting a false atom-identity. The decision must ship with a test proving a palette change is reflected in `/diff`.
4. **The phantom-chain DELETE (W2-transpose) must not break the cross-viz `fork_of` lineage** (which is correct and load-bearing). Scope the delete to the within-viz chain only; keep the `fork_breadcrumb`.
5. **inv-15 consumer gap is a binary close-blocker** — if W5/W6 land the UI but `gallery.publish()` still PATCHes, the publish verb stays substrate-without-its-intended-consumer. The re-point is part of the gate, not optional polish.
6. **K-deploy's single human dependency (the read-only PAT)** is unowned until provisioned; the gate fails-closed (safe) but the deploy-of-record stays manual until then. Name the operator explicitly at K.W0.

---

## §7 — One-paragraph executive answer

J does **not** close: its CI is red (inv-27 unmet over `9d7c387`), its CORE has zero frontend consumer (a binary inv-15 breach — 0 hits grepping `api.ts` for the 7 endpoints), its within-viz version chain is structurally degenerate (delete it — KISS), one remix atom (palette) is mutable outside the version system (force-resolve it), and its deploy-of-record never landed (host 29 commits behind, health-gate failing on a lifespan-index-blocking cold start). The path forward is two interleaved tranches: **J stays open** to complete the data-model arc (W2-fix integrity + W2-transpose elegance-delete + W5/W6 wire-the-UI + the e2e green), and a **new K-deploy tranche (ordering ν′)** carries the two highest-stakes chronics as its CORE — land the 29-commit backlog with an observed-green HEALTHCHECK gate, build the inv-28 API-arm green-CI gate (fails-closed without the named operator PAT), kill the silent-rollback chronic with off-host paging, and run the glass-ui-3.2.0 adoption wave (the dock-VT `useId()` ASK + P5 + asideSide + a11y) that **unblocks J.W6's inv-27 close**. The booked WebMCP-K is renamed **L-webmcp** to keep the chain honest. Every wave names a consumer; every chronic has a terminal verb; zero perpetual punts; output is a tranche plan, no code.

---

*Synthesis grounded in: the 6 dimension reports in this run dir; verified live this session — `git log f2fe447..9d7c387`=29; `grep api.ts`=0 endpoint hits; `gallery.ts:219-235` PATCH path; `ADOPTION-ASKS §7` (no dock-VT row); `CANONICAL-ORDERING §17/18/19` (κ′/λ′/μ′ → ν′ next); `J.md §10` (WebMCP-K → renamed L-webmcp).*
