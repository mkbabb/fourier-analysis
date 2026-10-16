# A3 — fourier PLAN + ALL CHANGES HEREIN, re-grounded against glass-ui-3.2.0 / value.js-L reality

**Dimension:** A3 — the J + K-deploy plans (`docs/tranches/{J,K}/*`), the J-postimpl audit, the control-pane audit, DEC-2, the π capture, the precepts sync — re-verified against the SIBLINGS' ACTUAL state.
**Verdict:** the fourier plan's data-model arc (J) and infra arc (K-deploy) are sound, but **the entire "gated on a future glass-ui 3.2.0 release" scaffolding is FALSE and collapses into ADOPT-NOW.** glass-ui 3.2.0 is published; the dock-VT fix shipped in 3.1.1; P5's "inner rounding" both is REJECTED by the user AND was already resolved upstream as container-owned rounding; value.js-J's cohort CORE is EXECUTED+GREEN and value.js-L is CLOSED. K.W4 is not a wave-of-asks-pending-a-release — it is a one-line dependency bump (`^3.1.0` → `^3.2.0`) that immediately unblocks J.W6, DEC-2, and the control-pane lens. The session's own changes are mostly sound; three carry stale gate-prose that must be struck.

---

## §1 — The two corrections: VERIFIED in sibling source (both are true)

**Correction 1 — glass-ui 3.2.0 is OUT, and most "3.2.0-gated" fourier bookings are already satisfied.** Verified:
- `glass-ui/package.json` version = **3.2.0** (not 3.1.0). Tranches AQ → **AR (3.1.1)** → **AS (3.2.0)**, both CLOSED (`glass-ui/docs/tranches/AR/FINAL.md`, `AS/FINAL.md`).
- **dock-VT fix shipped in 3.1.1 (AR.W2)**, NOT a future 3.2.0 item: `GlassDock.vue:137` `const dockId = \`glass-dock-${useId()}\``; `DockLayerGroup.vue:69` `const vtId = useId()`; a dedicated unit guard `dock/__tests__/GlassDock.vt-names.test.ts` mounts two docks and asserts distinct ids; a `proof:vt-names` static gate (`scripts/proof-vt-names.mjs`) makes the module-counter class structurally impossible. CHANGELOG 3.1.1: "the module-level counter restarted per module-graph copy … `dockId` is now minted from `useId()`."
- `asideSide` shipped: `Configurator.vue:85` `asideSide?: ConfiguratorAsideSide`, `:101` default `"right"`, `:162/165/172` the LEFT grid-column flip + `lg:border-r` mirror.
- `useTextHighlight` shipped (CHANGELOG 3.2.0, multi-instance-safe; test at `src/composables/__tests__/useTextHighlight.test.ts`).
- `inert` un-fixme shipped (3.1.1: `ConfiguratorLayer.vue:144` `:inert="!internalOpen || undefined"`, closes the `aria-hidden-focus` violation).
- keyframes peer **widened** to `^2.2.0 || ^3.0.0` (3.2.0 CHANGELOG) — so fourier's `^2.2.0` pin is peer-compatible with the bump; NO forced keyframes major.

**Correction 2 — P5 inner-rounding is REJECTED, and was already container-owned upstream.** Doubly confirmed:
- The user's rule ("inner rounding is rejected — the rounding is controlled by the container") is *byte-for-byte* glass-ui's own AR.W2 decision: `ConfiguratorLayer.vue:98` — "No per-section radius: **rounding is owned at the container root clip** (Configurator.vue rounded-panel + overflow-hidden); flush sections keep straight `border-b` dividers — a per-section radius only deforms the hairline." CHANGELOG 3.1.1 repeats it: "the per-section `rounded-panel` that deformed the inner `border-b` dividers is removed — **rounding is owned by the container clip**."
- So P5 is a PHANTOM finding twice over: (a) the user rejects the premise; (b) upstream already shipped the container-owns-rounding design. **There is nothing for glass-ui to "fix" and nothing for fourier to "adopt-to-satisfy."**

---

## §2 — Does K-deploy's "K.W4 glass-ui-3.2.0 GATED" framing collapse into ADOPT-NOW? YES.

Every "gated on a future glass-ui 3.2.0" clause in the fourier plan is now stale. The gate has **dissolved**: glass-ui 3.2.0 is published; fourier is pinned at `^3.1.0` (lockfile resolves 3.1.0, so it does NOT yet carry the 3.1.1 dock-VT fix). The CI red (run `26913592291`, `9d7c387`) is **real on fourier's pinned 3.1.0** — but the unblock is no longer "wait for glass-ui to ship," it is **`@mkbabb/glass-ui@^3.2.0` — an ADOPT-NOW dependency bump.** This re-shapes K.W4 from a SHIP/BOOK wave-of-asks into a near-trivial bump+consume, and it pulls J.W6 off the critical path of an external release.

The collapse cascades to three things K-deploy and J both gated on a release that already happened:
1. **J.W6 inv-27 close** — was "downstream of K.W4 downstream of glass-ui 3.2.0 ship" (SYNTHESIS §6 risk #1, "if glass-ui 3.2.0 never ships, J cannot reach a green-run close"). Now: bump to `^3.2.0`, re-run e2e, the dock collision is gone. The circular-looking dependency the plan called the #1 forward risk is **dissolved** — the upstream shipped. Even the W6 "self-deleting satisfaction probe + kill-dated exact-string bridge" (ADOPTION-ASKS §8) is now mostly moot: there is no defect to bridge once the bump lands; the probe should fire green and delete the allow-entry in the same adopt commit (its designed terminal behavior, now reachable immediately).
2. **DEC-2 controls→LEFT** (`J.md:174`, `WC-design-hierarchy.md` A-3/R4) — gated on "`asideSide` … does not exist at 3.1.0." It exists at 3.2.0. ADOPT-NOW unblocks the LEFT authoring rail + the §A void-fix.
3. **The control-pane lens** (`WC-design-hierarchy.md` §3) — A-3 (asideSide) is DONE-in-sibling; P5 is PHANTOM-KILL. A-1 (inter-row divider-rule) and A-2 (label/sub→ladder token-hook) are the ONLY genuinely-still-open glass-ui asks (verified below).

---

## §3 — The control-pane glass-ui asks, re-grounded one-by-one against 3.2.0 source

| Ask | Plan claim | 3.2.0 reality | Re-grounded disposition |
|---|---|---|---|
| **A-3 asideSide** | "does not exist at 3.1.0 (confirmed); DEC-2 has no lever" | `Configurator.vue:85,101,162,165,172` — SHIPS | **DONE-in-sibling → ADOPT-NOW.** Kill the K.W4 gate; DEC-2 lands J.W5 on the bump. |
| **P5 inner-rounding** | "NOT satisfied until the inner sections round; gated on a glass-ui release" | `ConfiguratorLayer.vue:98` container owns rounding (3.1.1); user REJECTS inner rounding | **PHANTOM-KILL.** Strike from §7, the grand-audit :265, WC-hierarchy §3/P5-row, K.W4, the J/K chronic ledgers, DELTA.md "P5-defect" seed caption. Do NOT re-book. |
| **A-1 inter-row divider-rule** | "`.configurator-layer` emits no divider; `.configurator-row` emits only gap/padding (grep); the auto-groove `data-divider-rule` lives only on `.instrument-rail`" | `ConfiguratorLayer.vue:100` emits `border-b border-border/40 last:border-b-0` — a **flat** hairline, NOT the twin-line `data-divider-rule` groove; `ConfiguratorRow.vue` still gap/padding only | **STILL-OPEN (genuine glass-ui ask).** 3.2.0 did NOT add the machined-groove opt-in. Keep as an inv-16′ ask — but re-anchor it to the NEXT glass-ui release, not 3.2.0. |
| **A-2 label/sub→ladder token-hook** | "`ConfiguratorLayer` `label`/`sub` bound to the `text-title`/`text-heading` ladder at the component root" | `ConfiguratorLayer.vue:118` `<span class="text-sm font-semibold text-foreground">` + sub span — STILL hard literals, NOT bound to the ladder | **STILL-OPEN (genuine glass-ui ask).** Unchanged by 3.2.0. Keep as inv-16′ ask, re-anchored to the next release. |
| **dock-VT useId()** | "3.2.0-gated; fourier adopts once glass-ui ships 3.2.0" | shipped in **3.1.1** (`GlassDock.vue:137`) | **DONE-in-sibling → ADOPT-NOW.** The unblock is the bump, not a wait. |
| **useTextHighlight / inert** | bundled "3.2.0 adoption" | both SHIP (3.2.0 / 3.1.1) | **DONE-in-sibling → ADOPT-NOW** (consume opportunistically; neither blocks a close). |

Net: of the six "glass-ui-3.2.0 adoption" items K.W4 bundled, **four are DONE-in-sibling (ADOPT-NOW via the bump)**, **one is PHANTOM-KILL (P5)**, and **two are genuinely still-open** (A-1, A-2) and must be re-anchored to the *next* glass-ui release — they were mis-attributed to 3.2.0.

---

## §4 — The cross-repo arms (K.W6) re-grounded: value.js already closed them

The plan books `valuejs-J-atomdiff` + `valuejs-J-publish` as "BOOK-with-kill-date, per-repo-green-CI-gated, kill = value.js-J close" (K.md §6/§8, SYNTHESIS §4, ADOPTION-ASKS §7). Re-grounded against value.js:
- **value.js-J cohort CORE is EXECUTED + GREEN** (`value.js/docs/tranches/J/FINAL.md`: "the cohort CORE is EXECUTED + GREEN … closes paired with fourier-J"); **value.js-L is CLOSED 2026-06-04** (`value.js/docs/tranches/L/FINAL.md`).
- `api/src/lib/crud/atomdiff.ts` SHIPS — canonically named, binds to `J-diff-shape.md §2.5`, op vocab `"added" | "removed" | "changed"` (`:25`), `before`/`after` presence rules (`:30-31`), no `moved` op (KISS, `:16-17`) — **isomorphic to fourier's `api/lib/crud/atomdiff.py` by construction**, both binding to the doc, not to each other.
- `api/src/routes/palettes/publish.ts` SHIPS — `POST /:slug/{publish,unpublish}` in-place visibility flip (J.W1c), the anti-duplication guarantee.

So K.W6 is NOT "book a peer ask pending value.js-J close." Both peers are **DONE-in-sibling.** The only residual is the **cross-repo `/diff` + publish envelope PARITY confirmation** — and that is a *fourier-local read* (assert fourier's envelope against `J-diff-shape.md`, then a one-shot conformance probe comparing the two live `/diff` bodies), NOT a cross-repo write-ask. Re-ground K.W6 from "BOOK inv-16′ peers" to "VERIFY parity (fourier-local), peers already shipped."

---

## §5 — Is the J wave plan still sound + correctly sequenced? Mostly YES; one re-sequence.

- **W2-fix (palette-PATCH FORCE-resolve, /diff `to`-param, stop migration cementing `atom_diff=[]`)** — SOUND, J-local data-model integrity, correctly NOT in K-deploy. No glass-ui dependency. Keep.
- **W2-transpose (DELETE the structurally-phantom within-viz version chain)** — SOUND and the strongest elegance transposition in the plan: the audit verified every viz holds exactly one depth-0 version forever, `version_count` incremented nowhere, so `{parent_hash,depth,root_hash}` + `GET /versions` + `version_count` are dead substrate (inv-15 / NO-LEGACY). Keep cross-viz `fork_of` (real, load-bearing). Risk #4 (don't break `fork_of`) is correctly named. Keep — this is the directive's "delete what has no consumer."
- **W5 (the 5 WC lenses + the inv-15 consumer wire-up)** — SOUND, but its glass-ui gates dissolve. With 3.2.0 adopted, the H1-H10 fourier-local hierarchy work, DEC-2 LEFT, and the asideSide/inert/useTextHighlight consumption ALL land in one J.W5 pass instead of half-waiting on K.W4. A-1/A-2 are the only deferred bits (re-anchored to the next glass-ui release).
- **W6 (evidence as a GREEN CI run)** — SOUND; now reachable immediately after the bump (no external-release wait). The dock-VT bridge degenerates to a fire-once-and-delete probe.
- **W7 (CSP/tail)** — unchanged, fine.

**Re-sequence:** the plan threads J.W5/W6 *through* K.W4 (the e2e unblock). With the bump being ADOPT-NOW, the cleaner shape is a **single early "adopt glass-ui 3.2.0" move** (the bump + lockfile + e2e re-green) that fronts BOTH J and K-deploy — it is the literal first domino, and it converts three "gated/blocked/booked" waves into "now." See §8.

---

## §6 — Is the inv-15 consumer gap (7 endpoints, 0 callers) the true critical path? YES.

Verified by the post-impl audit (grep `web/src/lib/api.ts` for the 7 endpoints = 0 hits; `gallery.ts:219-235` still PATCHes publish). This is the **binary inv-15 breach** and the genuine close-blocker for J — independent of any glass-ui release. It outranks the glass-ui adoption on the critical path: even with 3.2.0 adopted and e2e green, J cannot honestly close while the CORE is substrate-without-a-consumer. The plan correctly makes wiring the 7 endpoints + re-pointing `gallery.publish()` onto `POST /:slug/publish` a *binding* close-gate (SYNTHESIS §2 W5, §4). **Confirmed: the inv-15 wire-up is THE critical path; the glass-ui bump is the unblocker beneath it, not above it.**

---

## §7 — Do any session changes read as a workaround / mis-step? Audited.

| Change | Verdict | Reasoning |
|---|---|---|
| **W3 honest single-consumer scoping** (scheduler.yield, named non-targets) | SOUND, not a mis-step | inv-15-correct: a single live consumer + a named-non-target rationale is honest scoping, not theatre. MEASURED INP/CWV deltas correctly owed at W6 (the only debt). |
| **compound `_id` for VisualizationVersion** | SOUND-with-a-known-cost | The compound `_id` *forced* the remix step-order to viz-first (A2-5), and the §11 "crash leaves no lie" proof was never re-derived — a real P1 already folded to W2-fix. Not a workaround; a correctly-booked integrity debt. |
| **`set_hash=''` migration default** | SOUND, NOT a fallback | Acceptable transient with deterministic read-time recompute via `_head_set_hash`; W6 asserts no live row carries it post-backfill. The user flagged it; the audit cleared it. Keep with the W6 assertion. |
| **π harness** (`web/e2e/visual-baseline.spec.ts`, 21 caps, occlusion gate) | SOUND, genuinely useful | Real before-baseline + an occlusion (horizontal-overflow) gate that is green is a legitimate regression guard, and the per-page "intended vs unintended" column is the right discipline. One correction: the DELTA.md seed caption "`before/_seed-workspace-configurator.png` — the pre-existing P5-defect" must be re-captioned — P5 is PHANTOM-KILLED; that capture is now a *baseline of correct container-owned rounding*, not a defect. |
| **gap1** (negate `*.png` for `docs/**`) | SOUND | The blanket `*.png` ignore genuinely blocked π evidence; `!docs/**/*.png` (`.gitignore:81`) is the minimal correct negation. Keep. |
| **precepts sync to 8ccf9f4** | SOUND, with one honesty note | Submodule HEAD verified at `8ccf9f4`. The every-page before/after π edict is real and the harness honors it. value.js+glass-ui correctly BOOKED (dirty precepts submodule — inv-16′ never writes a dirty sibling). No mis-step. |
| **DEC-2 controls→LEFT** | SOUND, and now UNBLOCKED | Correctly user-ratified, supersedes DEC-1, a visual grid-column flip (not a DOM reorder, zero a11y cost). The only change: its "gated on K.W4" tag is stale — asideSide ships at 3.2.0, so DEC-2 lands J.W5 on the bump. |
| **K-deploy authoring (the deploy + e2e successor)** | SOUND scope-split, stale gate-prose | The infra/cross-repo split (deploy chronic out of the data-model close) is correct and directive-aligned. But §0/§4/§6/§8 carry the false "glass-ui 3.2.0 absent today, verified" / "gated on a future release" prose throughout — those must be struck and replaced with "3.2.0 published; adopt-now." |

**No change is a workaround in the prohibited sense.** The defects are stale *gate-prose* (3.2.0-absent claims) and one mis-caption (P5 seed), not bad engineering.

---

## §8 — The re-grounded fourier wave shape (proposed)

The single highest-leverage move is to **front-load the glass-ui 3.2.0 adoption as wave 0** of the forward work — it is now ADOPT-NOW and it unblocks J.W6, DEC-2, and the control-pane lens in one bump. Proposed shape (still tranche-dev only; no implementation here):

1. **ADOPT-NOW-α — bump `@mkbabb/glass-ui` `^3.1.0` → `^3.2.0`** (+ lockfile; keyframes pin `^2.2.0` stays — peer-compatible). Re-run e2e: the dock-VT collision is gone (the fix is in 3.1.1). This is the first domino; it dissolves SYNTHESIS §6 risk #1, K.W4's gate, and DEC-2's gate simultaneously. Consume `inert`/`useTextHighlight`/`asideSide` opportunistically. **This collapses K.W4 from a SHIP/BOOK wave into this single bump.**
2. **J data-model arc (unchanged, glass-ui-independent):** W2-fix (palette-PATCH FORCE-resolve + /diff `to` + migration delta-recompute), W2-transpose (DELETE the phantom within-viz chain), then the **inv-15 consumer wire-up** (the true critical path — wire the 7 endpoints + re-point `gallery.publish()` onto the verb).
3. **J.W5 WC + DEC-2** — now fully unblocked by α: the H1-H10 fourier-local hierarchy + DEC-2 controls-LEFT (asideSide) + the void-fix, all in one pass. A-1 (inter-row groove) + A-2 (label/sub ladder hook) re-anchored as inv-16′ asks against the **NEXT** glass-ui release (NOT 3.2.0).
4. **J.W6 evidence** — green CI run (reachable immediately post-α); the dock bridge fires-once-and-self-deletes; MEASURED W3/W4 deltas; the cross-repo `/diff`+publish PARITY confirm (peers already shipped — fourier-local read against `J-diff-shape.md`).
5. **K-deploy CORE (the genuinely-still-open infra chronic):** the 29-commit deploy backlog land (observed-green HEALTHCHECK + `service_healthy`), the inv-28 API-arm green-CI gate (fails-closed), the silent-rollback paging sink (inv-31). **This is the REAL remaining chronic** — it is NOT glass-ui-gated and survives the re-grounding intact. The deploy chronic is the load-bearing forward work; the glass-ui "wave" was mostly already done.

**One terminal correction to K.md's own framing:** K-deploy's CORE is the deploy/e2e infra, and the e2e half is now "adopt 3.2.0" (a fourier-local bump), so K.W4 should be re-titled from "glass-ui-3.2.0 adoption wave (gated)" to "glass-ui 3.2.0 ADOPT (the bump) — DONE-able now" and shrunk to the bump + the two re-anchored asks (A-1, A-2). The deploy spine (W1-W3) is what earns K-deploy its own tranche; the e2e unblock is a one-liner.

---

## §9 — Terminal chronic verdicts (zero perpetual punts)

| Chronic | Prior plan disposition | Re-grounded TERMINAL verdict |
|---|---|---|
| `glass-ui-dock-vt-name` | BOOK-with-kill-date, gated on 3.2.0 | **ADOPT-NOW** — fixed in glass-ui 3.1.1 (`GlassDock.vue:137`); kill-date = the `^3.2.0` bump commit. Gate dissolved. |
| `glass-ui-P5-inner-rounding` | BOOK-with-kill-date, "not satisfied until inner sections round" | **PHANTOM-KILL** — user rejects inner rounding; glass-ui 3.1.1 made rounding container-owned by design. Strike from every ledger; do not re-book. |
| A-3 `asideSide` | glass-ui-ASK, K.W4, gated on 3.2.0 | **ADOPT-NOW** — ships at 3.2.0 (`Configurator.vue:85`). DEC-2 lands J.W5. |
| `useTextHighlight` / `inert` | bundled K.W4 asks | **ADOPT-NOW** — both shipped (3.2.0 / 3.1.1). Consume; neither blocks a close. |
| A-1 inter-row divider-rule | glass-ui-ASK, "3.2.0" | **BOOK-with-kill-date, re-anchored to the NEXT glass-ui release** — NOT in 3.2.0 (still flush `border-b`, `ConfiguratorLayer.vue:100`). Mis-attributed to 3.2.0; correct the anchor. |
| A-2 label/sub→ladder token-hook | glass-ui-ASK, "3.2.0" | **BOOK-with-kill-date, re-anchored to the NEXT glass-ui release** — NOT in 3.2.0 (still `text-sm font-semibold` literal, `ConfiguratorLayer.vue:118`). Correct the anchor. |
| `valuejs-J-atomdiff` / `valuejs-J-publish` | BOOK inv-16′ peers, kill = value.js-J close | **DONE-in-sibling** — value.js-J EXECUTED+GREEN, value.js-L CLOSED; `atomdiff.ts` + `publish.ts` shipped. Collapse to a fourier-local `/diff`+publish PARITY confirm. |
| CH-DEPLOY (29-commit babb.dev outage) | BOOK-with-kill-date → K.W1/W2/W3 | **UNCHANGED — SHIP-as-waves (the real forward chronic).** NOT glass-ui-gated; survives the re-grounding intact. The load-bearing infra work. |
| inv-28 API-arm green-CI gate | BUILD in K.W2 | **UNCHANGED — BUILD** (fails-closed without the operator PAT). Real, survives. |
| dispatch.sh retirement | BOOK-GATED, K.W7 | **UNCHANGED — BOOK-GATED** on the four migrations. Real, survives. |

---

## §10 — One-paragraph executive answer

glass-ui 3.2.0 is published, and the fourier plan's central scaffolding — "K.W4 glass-ui-3.2.0 adoption GATED on a future release," "P5 not satisfied until the inner sections round," "the value.js-J peers booked pending close" — is **uniformly stale**: the dock-VT fix shipped in 3.1.1 (`useId()`), `asideSide`/`useTextHighlight`/`inert` ship at 3.2.0, P5 is a user-REJECTED phantom that upstream already resolved as container-owned rounding, and the value.js peers are DONE-in-sibling (value.js-J GREEN, value.js-L CLOSED, `atomdiff.ts`+`publish.ts` shipped against `J-diff-shape.md`). So K.W4 collapses into a single ADOPT-NOW bump (`^3.1.0`→`^3.2.0`, keyframes pin stays peer-compatible) that immediately unblocks J.W6's inv-27 close, DEC-2's controls-LEFT, and the control-pane lens — dissolving the plan's named #1 forward risk. The genuinely-still-open glass-ui asks are only A-1 (inter-row twin-line groove) and A-2 (label/sub→ladder hook), both mis-attributed to 3.2.0 and to be re-anchored to the next release. The session's own changes are sound (W3 scoping, the π harness, the compound-`_id`/`set_hash=''` debts correctly booked, DEC-2, gap1, the precepts sync) — the only defects are stale gate-prose and the P5 seed mis-caption. The TRUE remaining critical path is two-layered and glass-ui-independent: the inv-15 consumer gap (7 endpoints, 0 callers) for J's honest close, and the months-class 29-commit babb.dev deploy chronic for K-deploy — that infra spine, not the glass-ui "wave," is the load-bearing forward work.
