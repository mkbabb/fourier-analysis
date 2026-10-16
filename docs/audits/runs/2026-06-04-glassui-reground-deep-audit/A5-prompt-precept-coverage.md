# A5 — PROMPT & PRECEPT COVERAGE (glass-ui re-ground deep audit)

**Auditor**: A5 (prompt/precept coverage — recap ALL requests hitherto).
**Run**: `docs/audits/runs/2026-06-04-glassui-reground-deep-audit/`.
**fourier HEAD**: `2a251e6` (origin/master = `9d7c387` + 5 unpushed doc commits: `91d1b5a` K-deploy author, `227c283` precepts-sync, `70cc791` DEC-2+gap1, `57624fa` π-capture, `2a251e6` control-pane audit).
**glass-ui HEAD**: `06b35d9` — `package.json` version **3.2.0** (verified `node -p`), shipped (AS.W6 cut + AS.W6 post-publish 13-agent verify `932d2ee`).
**Method**: reconstruct EVERY user prompt across the whole H→I→J→K arc INCLUDING this session's corrections; re-ground each cross-repo ASK against glass-ui's ACTUAL 3.2.0 source + AR/AS tranche docs + CHANGELOG; verify the two new corrections (3.2.0-already-shipped; P5-rejected); confirm DEC-2 + publish-no-duplicate are reflected; cross-check the π-edict precept.

**Verdict**: **SOUND-CORE, STALE-GATE.** Every reconstructed prompt is ADDRESSED or honestly DEFERRED-BOOKED; **zero DROPPED requests**. BUT the two corrections are both HARD-CONFIRMED against sibling reality and they invalidate the live framing in TWO places: (1) every "gated on a FUTURE glass-ui 3.2.0 release" claim is STALE — 3.2.0 already shipped (and the dock-VT fix shipped a release *earlier*, in **3.1.1**); the gate has dissolved into an **ADOPT-NOW `npm install` + `^3.1.0→^3.2.0` bump**; (2) **P5 is a PHANTOM** — glass-ui's own AS.FINAL.md:113-119 already calls fourier's "not satisfied until inner sections round" ledger a **misdiagnosis** ("rounding is owned at the container-root clip"), and the user has now KILLED it. The fourier docs do not yet reflect either; they still read 3.2.0 as unreleased and P5 as an open glass-ui ask. This is not a misrepresentation that was written carelessly — it is a gate that went stale *while authored correctly*, exactly the F/H "broken-for-months-and-nobody-re-checked" failure mode, now applied to a cross-repo book instead of a deploy. The fix is a doc-sweep at K.W0 (re-ground the gate), not new work.

---

## Part 1 — The two corrections, re-grounded against sibling reality (the load-bearing verifications)

### Correction 1 — glass-ui shipped 3.2.0; the gate has DISSOLVED into ADOPT-NOW

**CONFIRMED, and STRONGER than the brief states.** Verified against `/Users/mkbabb/Programming/glass-ui` source + CHANGELOG + AR/AS tranche docs:

| fourier ASK (gated on "future glass-ui 3.2.0") | Actual state in glass-ui | Evidence | Verdict |
|---|---|---|---|
| `glass-ui-dock-vt-name` (`useId()` dock VT-name) | **SHIPPED IN 3.1.1** (AR.W2), not even 3.2.0 — a release EARLIER than gated | `GlassDock.vue:137` `const dockId = \`glass-dock-${useId()}\``; `DockLayerGroup.vue:69` `const vtId = useId()`; `CHANGELOG.md` §3.1.1 "Fixes the GlassDock `view-transition-name` collision … `dockId` is now minted from `useId()`"; `proof:vt-names` static gate (`AR/audit/W2-vt-names-gate.md`) | **ADOPT-NOW + KILL GATE** |
| `asideSide` (A-3, controls-LEFT / DEC-2 lever) | **SHIPPED IN 3.2.0** | `Configurator.vue:85` `asideSide?: ConfiguratorAsideSide`, `:101` `asideSide: "right"` default, `:162/165/172` grid-column + border-side flip; `AS/FINAL.md:110` "asideSide (A-3, P0/keystone)" | **ADOPT-NOW + KILL GATE** |
| `useTextHighlight` | **SHIPPED IN 3.2.0** | `src/composables/dom/useTextHighlight.ts` + `__tests__/useTextHighlight.test.ts`; `CHANGELOG.md` §3.2.0 "`useTextHighlight` … now multi-instance safe"; `AS/FINAL.md:120` "(R4) multi-instance multiplexing" | **ADOPT-NOW + KILL GATE** |
| `glass-ui-a11y` (`inert` on collapsed ConfiguratorLayer) | **SHIPPED IN 3.1.1** | `ConfiguratorLayer.vue:144` `:inert="!internalOpen || undefined"`, `:139` comment "inert pulls the collapsed subtree from tab order + a11y tree"; `CHANGELOG.md` §3.1.1 "`ConfiguratorLayer` applies `inert` to its collapsed body" | **ADOPT-NOW + KILL GATE** |

**THE STALE-GATE MECHANISM (why the gate did not auto-dissolve).** fourier `web/package.json:14` still pins `"@mkbabb/glass-ui": "^3.1.0"`, AND `web/node_modules/@mkbabb/glass-ui/package.json` is installed at **3.1.0** (verified `node -p`) — the OLD dock.js with the setup-local counter is what fourier's e2e actually runs against. This is exactly why the prior control-pane audit (`SYNTHESIS.md:37`) read "glass-ui is **3.1.0** — neither the P5 inner-rounding fix nor an `asideSide` prop ship → both are genuine K.W4 asks": it inspected `node_modules`, which is a stale lockfile snapshot, NOT the registry. The fix is mechanical: **`npm install @mkbabb/glass-ui@^3.2.0` + regen lockfile** dissolves the dock-VT e2e red, the asideSide gate, the useTextHighlight gate, and the inert gate in ONE bump. glass-ui's own `AS/FINAL.md:126-127` already names fourier's exact arm: "fourier `K.W4` (bump `^3.1.0→^3.2.0`, regen lock, un-`test.fixme` the two a11y keystones, retire the dock-vt-name console bridge, wire `asideSide`/`useTextHighlight` into `J.W5`)".

**IMPLICATION (propagate).** The K.md §0/§4/§7 framing of K.W4 as "fourier executes the adoption ONCE glass-ui ships 3.2.0 (inv-16′, per-repo-green-CI-gated)" and the binding "circular-looking-but-real" J↔K interleaving (K.md §0:19 — "J cannot reach its green-run close until K-deploy (or the glass-ui maintainer it asks) lands the dock fix") are BOTH now FALSE-as-written: glass-ui ALREADY landed the dock fix (3.1.1). The dependency is no longer "wait for an upstream maintainer" — it is "run `npm install`." The interleaving risk K.md §0 names as "the #1 forward risk" has **collapsed to zero external dependency**. This must be re-grounded at K.W0: the dock-VT row is ADOPT-NOW, not gated; J.W6's inv-27 close is unblocked the moment fourier bumps. The W6 "kill-dated exact-string console-filter bridge + self-deleting satisfaction probe" (`ADOPTION-ASKS.md:162`; `J.md:230`) is now **unnecessary** — there is nothing to bridge; the bump makes the warning gone. Booking a bridge for a defect already fixed upstream is itself a small NO-LEGACY violation to fold (DELETE the bridge plan, do the bump).

### Correction 2 — P5 inner-rounding is REJECTED (the container controls the rounding)

**CONFIRMED — and glass-ui INDEPENDENTLY reached the same verdict BEFORE the user's correction.** The user: *"inner rounding is rejected — the rounding is controlled by the container."* glass-ui shipped exactly that and explicitly flagged fourier's ledger as wrong:

- `ConfiguratorLayer.vue:98`: *"No per-section radius: rounding is owned at the container root clip (Configurator.vue rounded-panel + overflow-hidden); flush sections keep straight border-b dividers — a per-section radius only deforms the hairline on a transparent border-only element."*
- `AS/FINAL.md:113-119`: *"**P5 — close-as-designed.** Rounding is owned at the container-root clip … `779fed7` deliberately reverted the per-section `rounded-panel` (b6d6cf4) after adversarial verification found it geometrically inert and divider-deforming. **The fourier ledger's 'not satisfied until inner sections round' is a misdiagnosis**; the user CANON ('rounded at the root') IS satisfied."*

So P5 is a PHANTOM finding on two independent grounds — the user's design ruling AND glass-ui's adversarial verification (geometrically inert + divider-deforming). The container's `overflow-hidden` + `rounded-panel` clip owns the inner corners by design; there is nothing for glass-ui to "fix" and nothing for fourier to "adopt." **KILL P5 across all fourier docs**, do not re-book.

**Where P5 lives today (the KILL surface — 6 sites):**
1. `ADOPTION-ASKS.md:124` (the §4 table row `glass-ui-P5-inner-rounding`) — KILL the row.
2. `ADOPTION-ASKS.md:148,160,174` (the §7 J-era prose + the K.W4 bundle + the control-pane confirm) — strike P5 from the bundle.
3. `J.md:179` (§F chronic disposition "P5 inner-rounding → BOOK → glass-ui, SHIP-on-adopt at W5") — KILL.
4. `J.WC-frontend-grand-audit.md:265,285,308` (the §F:265 terminal disposition + §G owner matrix + §H wave-fold) — KILL.
5. `K.md:33,51,60,78,124,143` (K.W4 contents + completion criterion + §8 "Named-forward P5 inner-ConfiguratorLayer-rounding BOOK-with-kill-date") — KILL.
6. `control-pane-hierarchy/SYNTHESIS.md:50` (the A-row "P5 known; confirmed, not re-booked") + `DELTA.md:30-32` (the `_seed-workspace-configurator.png` "pre-existing P5-defect" seed) — record P5 as KILLED-PHANTOM, keep the capture as a now-resolved before-shot.

---

## Part 2 — The full prompt arc (EVERY request hitherto, re-grounded)

The 2026-06-02 deep-audit A5 (`2026-06-02-J-deep-audit/A5-prompt-coverage.md`) baselined P1–P8; the 2026-06-04 J-postimpl A5 added S1–S10 + the pre-Begin manifest prompts. I carry that ledger forward and re-verify against THIS session's corrections. No prior status is silently downgraded; only the glass-ui-gated rows change disposition.

### 2a — Prior-arc prompts (P1–P8, carried, re-verified)

| Prompt | Carried status | Status NOW | Evidence / change |
|---|---|---|---|
| P1 H-totality | ADDRESSED | ADDRESSED (unchanged) | `H/FINAL.md`; CI `26773946417` |
| P2 recap tranche/siblings/deploy/CRUD | ADDRESSED | ADDRESSED — codified in `CONSTELLATION.md §1` (8-repo roster) | `CONSTELLATION.md` |
| P3 left→right + squared-borders + 6-agent UI audit | ADDRESSED (Qs); P5 was the squared FIX | **ADDRESSED — and the squared-borders FIX is now RESOLVED-AS-PHANTOM** (P5 KILL, Correction 2) | the "squared inner sections" the user flagged are the *intended* flush dividers under a container clip; glass-ui `779fed7` + `ConfiguratorLayer.vue:98` |
| P4 redeploy workflows/agents | ADDRESSED | ADDRESSED (unchanged) | `2026-06-01-modern-web*/` |
| P5 "fully rounded by default, at the root" | DEFERRED-BOOKED (inner-section defect) | **RESOLVED — PHANTOM-KILL** (Correction 2): "rounded at the root" IS satisfied (the container clip); the inner-section "defect" was a misdiagnosis, now user-rejected | `AS/FINAL.md:113-119`; `ConfiguratorLayer.vue:98`; KILL the 6 doc sites |
| P6 modern-web-guidance fold | ADDRESSED (NIT closed) | ADDRESSED (unchanged) | `J.md:5` repo-qualified A3 seed |
| P7 constellation precept-audit (6 agents) | ADDRESSED | ADDRESSED (unchanged) | `2026-06-01-modern-web-audit/` |
| P8a value.js-J ADOPTION-ASKS booking | ADDRESSED (rows exist) | ADDRESSED (unchanged) | `ADOPTION-ASKS.md:122-123` |
| P8b publish two-ways / no-duplicate | ADDRESSED + SHIPPED | ADDRESSED + SHIPPED (re-confirmed, Part 3) | `visualizations.py:656-659` `$set` only |

### 2b — This-session "Begin" arc (S1–S10, carried) + the NEW corrections (C1–C6)

| # | Request | Status | Evidence | Disposition / change |
|---|---|---|---|---|
| S1 | "Begin / execute J in full" | PARTIAL-by-design | W0–W4 executed (`7d95af6`, `9d7c387`); W5–W8 gated | unchanged |
| S2 | "dev.sh-P0 + J.W2 now" | ADDRESSED | `scripts/dev.sh` (conformance), `pytest api/`=266 | unchanged |
| S3 | "W5–W7 after glass-ui 3.2.0" | **was DEFERRED-BOOKED → now ADOPT-NOW** | glass-ui 3.2.0 SHIPPED (Correction 1) | **the gate has DISSOLVED** — W5/W6/W7 are no longer "after a future release"; they are after an `npm install`. Re-ground at K.W0. |
| S4 | "you are the W6 pilot" (instrumented gate) | DEFERRED-BOOKED to W6 | `J.md` W6 row | unchanged |
| S5 | "deploy = babb.dev spine" | PARTIAL — DID NOT LAND | host `f2fe447`, 29 behind; health-gate fail→rollback | FOLDED into K-deploy W1-W3 (the deploy chronic; verified still stuck via this brief's SSH) |
| S6 | "gate on green CI incl. e2e" | HELD (RED-gated) → **about to clear** | CI red `26913592291` on dock-VT — but the cause is FIXED upstream (3.1.1) | the bump turns the gate green; no false green was ever asserted |
| S7 | push/deploy authorization | ADDRESSED | `9d7c387` pushed | unchanged |
| S8 | e2e→W6 (book dock-VT to glass-ui 3.2.0, NO `!important`) | was DEFERRED-BOOKED → **ADOPT-NOW** | dock fix shipped 3.1.1 (`GlassDock.vue:137`) | the book is SATISFIED upstream; the W6 console-bridge is now UNNECESSARY (DELETE-the-bridge fold) |
| S9 | SSH-diagnose | ADDRESSED | brief's root-cause; K-deploy A3 | unchanged |
| S10 | re-issued deep-audit (2026-06-04 J-postimpl) | ADDRESSED (the audit) | `2026-06-04-J-postimpl-audit/` | superseded by THIS run |
| **C1** | "ensure the constellation is synced" (precepts) | **ADDRESSED** | `docs/precepts` submodule → `8ccf9f4` (`git submodule status`); `227c283` sync commit; fourier+speedtest+words+muster bumped; value.js+glass-ui BOOKED (dirty precepts submodule) | `PRECEPTS-SYNC.md` ledger |
| **C2** | "fix gap1 + capture indefatigably" (the *.png gitignore blocked π evidence) | **ADDRESSED** | `.gitignore:77-81` — blanket `*.png` + `!assets/**/*.png` + `!docs/**/*.png` (gap1, 2026-06-04); `web/e2e/visual-baseline.spec.ts` harness; 21 caps (7 pages × 3 viewports), occlusion gate green; `J/audit/screenshots/{before/,DELTA.md}` | `70cc791` + `57624fa` |
| **C3** | "controls → LEFT (DEC-2, supersedes DEC-1's keep-RIGHT)" | **ADDRESSED + the lever is NOW ADOPT-NOW** | `J.md:174` DEC-2 banner ("controls on the LEFT — left is better and more idiomatic", user-ratified, SUPERSEDES DEC-1); `J.md:56` W5 row; `control-pane SYNTHESIS:49` A-3. The mechanism (`Configurator asideSide`) was booked as a future glass-ui ask — **it SHIPPED in 3.2.0** (`Configurator.vue:85`), so DEC-2 is executable on the bump | DEC-2 is correctly reflected; its gate dissolved (Correction 1) |
| **C4** | "ensure control-pane hierarchy + 4 design agents (title demarcation, spacing, horizontal lines, every page)" | **ADDRESSED** | `2026-06-04-control-pane-hierarchy/{D1-D4,SYNTHESIS}.md` → `J/design/WC-design-hierarchy.md`; H1-H10 fourier-local (J.W5) + A-1/A-2/A-3 glass-ui asks. NOTE: A-3 SHIPPED (3.2.0); A-1 (inter-row divider-rule) + A-2 (label/sub token-hook) are STILL net-new — re-ground at K.W0 (see Part 4) | `2a251e6` |
| **C5** | "P5 rejected — rounding controlled by the container" | **ADDRESSED-AS-KILL** (this audit) | Correction 2; KILL the 6 doc sites | PHANTOM-KILL |
| **C6** | "consider glass-ui/value.js tranches + re-audit" | **ADDRESSED** (this run) | glass-ui AQ→AR→AS read; 3.2.0 confirmed; value.js-J/K/L peers re-grounded (Part 4) | the audit IS the deliverable |

**No DROPPED request found.** Every prompt resolves to ADDRESSED, ADOPT-NOW (the dissolved gates), PHANTOM-KILL (P5), FOLD-into-K (deploy), or DEFERRED-BOOKED-with-a-NAMED-gate. The pre-Begin manifest/abs-path prompts (carried from the prior A5) remain ADDRESSED (`CONSTELLATION.md:9` abs-path convention; this report uses absolute paths throughout).

---

## Part 3 — Re-confirm the three load-bearing user rulings are reflected

| Ruling | Reflected? | Evidence |
|---|---|---|
| **publish re-publish-no-duplicate** ("flip the flag in place, do NOT duplicate") | **YES — SHIPPED, structurally honored** | `visualizations.py:656-659` the ONLY write verb is `$set` on `{slug}` guarded by `if target != current`; no `insert_one` on the publish path (the remix `insert_one` is a categorically separate handler). Re-publishing an already-public row is a 200 no-op. The dead `visibility_illegal_transition` guard's first live caller (`:651`). **BUT inv-15 consumer gap**: `gallery.ts:219-226` `publish()` STILL routes through PATCH `{visibility:"public"}`, NOT the new `POST /:slug/publish` verb — the 7 CORE endpoints have ZERO frontend caller (`grep api.ts` = 0 hits). The backend honors the ruling; the UI does not yet consume the verb. That wire-up is J.W5 (not K). |
| **DEC-2 controls→LEFT** (supersedes DEC-1 keep-RIGHT) | **YES** | `J.md:174` binding DEC-2 banner; `J.md:56` W5 ("DEC-2: the configurator aside moves LEFT"); `control-pane SYNTHESIS:49`. The prior J-postimpl A5 still cited DEC-1 ("configurator stays RIGHT", `J-postimpl SYNTHESIS.md:56`) — that line is now STALE and must read DEC-2 (a doc-reconcile fold). The lever (`asideSide`) SHIPPED in 3.2.0, so DEC-2 is executable. |
| **P5 rejected** (container controls rounding) | **NOT YET reflected — this audit KILLs it** | the 6 doc sites in Part 1 still carry P5 as an OPEN glass-ui-owned BOOK; KILL them per Correction 2. glass-ui already agrees (`AS/FINAL.md:113-119` "misdiagnosis"). |

---

## Part 4 — Cross-repo ASKs re-grounded against the SIBLING'S ACTUAL STATE

| ASK | Sibling actual state | Disposition |
|---|---|---|
| `glass-ui-dock-vt-name` | **DONE in 3.1.1** (`GlassDock.vue:137`; `proof:vt-names` gate) | **ADOPT-NOW** — `npm install ^3.2.0`; KILL the gate; DELETE the W6 console-bridge |
| `glass-ui` asideSide (A-3 / DEC-2) | **DONE in 3.2.0** (`Configurator.vue:85`) | **ADOPT-NOW** — bump + set `aside-side="left"` at J.W5; KILL the gate |
| `glass-ui` useTextHighlight | **DONE in 3.2.0** (`useTextHighlight.ts`) | **ADOPT-NOW** — bump + consume; KILL the gate |
| `glass-ui-a11y` inert | **DONE in 3.1.1** (`ConfiguratorLayer.vue:144`) | **ADOPT-NOW** — bump; un-`test.fixme` the a11y keystones; KILL the gate |
| `glass-ui-P5-inner-rounding` | **PHANTOM** — close-as-designed, glass-ui calls fourier's ledger a misdiagnosis (`AS/FINAL.md:113`) + user rejected | **PHANTOM-KILL** — remove from all 6 sites; do not re-book |
| control-pane **A-1** (inter-row divider-rule opt-in) | **ABSENT** — glass-ui `AS/FINAL.md:139-144` name-forwards the two control-pane polish asks to a glass-ui successor **AT**, NOT 3.2.0; "fail the ≥1-release-boundary test … lack a ≥2-consumer witness; NOT cohort blockers" | **BOOK-with-kill-date** (gate = glass-ui AT; fourier H1-H10 consume the shipping 3.1.0/3.2.0 primitives meanwhile — net code decrease, not blocked) |
| control-pane **A-2** (label/sub token-hook at component root) | **ABSENT** — same AT name-forward | **BOOK-with-kill-date** (gate = glass-ui AT) |
| `valuejs-J-atomdiff` (W6 peer) | value.js-J/K/L tranche docs exist; per-repo-green-CI-gated; inv-16 held (fourier holds no lever) | **DEFERRED-BOOKED** (unchanged; cohort paired-close) |
| `valuejs-J-publish` (W6 peer + the `listPalettes` public-filter P0) | same | **DEFERRED-BOOKED** (unchanged) |
| dispatch.sh retirement | gated on 4 non-fourier migrations | **BOOK-GATED** (unchanged; K.W7) |

**The net re-grounding (the headline for K.W0):** of the FIVE glass-ui asks K.W4 bundled, **FOUR are ADOPT-NOW** (dock-VT, asideSide, useTextHighlight, inert — all shipped in 3.1.1/3.2.0) and **ONE is PHANTOM-KILL** (P5). Only the TWO control-pane net-new asks (A-1, A-2) remain genuinely BOOKED — and glass-ui has already named where (the AT successor). So K.W4 is no longer "wait for a release" — it is a **one-commit `npm install` + consume + un-fixme**, plus two correctly-booked-forward control-pane polish asks. The whole "circular J↔K interleaving #1 risk" framing dissolves.

---

## Part 5 — Precept cross-check (the 8ccf9f4 π-edict + goal/completion-criterion-paired)

| Precept | Verdict | Evidence |
|---|---|---|
| **π-edict: every-page paired before/after, scripted, occlusion gate** (`SPEC.md:234-250`, the 8ccf9f4 edict) | **HELD** | `web/e2e/visual-baseline.spec.ts` harness; 21 caps (7 pages × 3 viewports); `DELTA.md` pairs before/after per page; occlusion gate green (`DELTA.md:10` "occlusion … green"); `57624fa` capture commit. The harness re-runs identically at open/close (`SPEC.md:242`). |
| **goal/completion-criterion-paired** (`SPEC.md:62-64`, items 3+8) | **HELD** | `K.md §3` explicitly pairs Goal criterion + Completion criterion (the evidence); `J.md` likewise. Both must hold for a clean close. |
| **the 7 read-only audit lanes** | **N/A in fourier precepts** | `grep` of `docs/precepts/**` for "read-only audit lane" = 0 hits — the lanes are an orchestration-protocol concept (CONSTELLATION.md §5 Mode posture), not a codified precept file; the brief's "7 read-only audit lanes" is the multi-agent audit posture this very run executes (6 dimension auditors, doc-only, write-own-repo). HELD as practice. |
| **precepts submodule synced** (C1) | **HELD** | `docs/precepts` at `8ccf9f4` (the π-edict SHA); `git submodule status` confirms; the SPEC.md π-block is present. |

**No precept VIOLATED by this session.** The π-edict is honored (the capture harness is the gate). The one item to fold: the π `_seed-workspace-configurator.png` is captioned a "pre-existing P5-defect" (`DELTA.md:30`) — re-caption it a now-resolved (close-as-designed) before-shot per Correction 2, so the DELTA does not perpetuate the phantom.

---

## Part 6 — Folds (disposition-named)

| Item | Disposition | Rationale |
|---|---|---|
| The "gated on FUTURE glass-ui 3.2.0" framing (K.md §0/§4/§7, ADOPTION-ASKS §7, J.md:230) | **ADOPT-NOW + re-ground at K.W0** | 3.2.0 SHIPPED; dock-VT in 3.1.1. The gate is `npm install`, not an upstream wait. Re-write the J↔K "circular #1 risk" as "resolved-on-bump." |
| P5 inner-rounding (6 doc sites) | **PHANTOM-KILL** | User-rejected + glass-ui calls it a misdiagnosis. Container clip owns the corners by design. Remove, don't re-book. |
| The W6 dock-VT console-bridge + self-deleting probe (`ADOPTION-ASKS.md:162`, `J.md:230`) | **KILL (NO-LEGACY)** | A bridge for a defect already fixed upstream is dead-on-arrival; the bump deletes the warning. Booking a self-deleting probe for a satisfied gate is a phantom. |
| DEC-1 residue in J-postimpl SYNTHESIS.md:56 ("configurator stays RIGHT") | **FOLD (doc-reconcile)** | DEC-2 supersedes; the line is stale. |
| K.W4 as a 5-ask "wait-for-release" wave | **FOLD → re-cut as ADOPT-NOW bump wave** | 4 of 5 asks shipped, 1 is phantom. K.W4 becomes: bump+install, wire asideSide/useTextHighlight (J.W5), un-fixme a11y, KILL P5, BOOK A-1/A-2 forward to glass-ui AT. |
| control-pane A-1 + A-2 | **BOOK-with-kill-date (gate = glass-ui AT)** | glass-ui name-forwarded them (`AS/FINAL.md:139-144`); genuinely net-new; fourier H1-H10 are not blocked on them. |
| inv-15 consumer gap (gallery.publish still PATCHes; 7 endpoints zero frontend caller) | **FOLD-into-J.W5** (NOT K) | J-local data-model wire-up; re-point `gallery.publish()` onto `POST /:slug/publish`; the binary inv-15 breach until then. |
| The babb.dev deploy chronic (host 29 behind) | **FOLD-into-K-deploy W1-W3** (unchanged) | First-class wave; not a footnote; the real K-deploy CORE now that the e2e blocker is a trivial bump. |

---

## Part 7 — Chronics (TERMINAL verdicts — zero perpetual punts)

| Chronic | History | Terminal verdict |
|---|---|---|
| **glass-ui-3.2.0 adoption gate** (every "gated on future release" claim) | I→J→K, booked as a future wait | **ADOPT-NOW** — 3.2.0 shipped; bump `^3.1.0→^3.2.0` + `npm install` at K.W4 dissolves dock-VT/asideSide/useTextHighlight/inert in one commit. KILL the gate. The kill-date is the bump commit (a single, available action, not an external wait). |
| **P5 inner-`ConfiguratorLayer`-rounding** | P5→I→J→K, carried 3 tranches as "not satisfied until inner sections round" | **PHANTOM-KILL** (terminal) — user-rejected ("container controls the rounding") + glass-ui adversarially verified the per-section radius is geometrically inert + divider-deforming (`AS/FINAL.md:113-119`, `779fed7`). The user CANON "rounded at the root" IS satisfied by the container clip. Remove from all 6 sites; never re-book. The carried-3-tranches life of this ask is itself the lesson: a cross-repo "defect" must be re-grounded against the sibling's actual close, not carried on inertia. |
| **dock-VT e2e red** (CI red since before J) | F/H lineage → J→K | **RESOLVED-ON-BUMP** (terminal) — fixed in glass-ui 3.1.1 (`useId()`); fourier's red is purely the stale 3.1.0 `node_modules`. The bump is the close. The W6 bridge is KILLED (unnecessary). |
| **babb.dev deploy-of-record (host 29 behind, health-gate fail→rollback)** | F "2-month webhook" lineage → G/H/I/J never deployed | **FOLD-into-K-deploy W1-W3** (unchanged terminal verdict) — land observed-green, build the inv-28 API-arm gate, page-on-rollback. The ONE real forward chronic; the e2e half that shared K-deploy's billing has collapsed to a bump. |
| **inv-28 API-arm green-CI gate "BOOKED-not-built"** | H→J→K | **BUILD at K.W2** (terminal; needs the named host-only read-only PAT — fails-closed without it, the correct safe state). Not a third book. |
| **inv-15 CORE consumer gap** (7 endpoints zero caller) | J | **SHIP-as-wave at J.W5** (terminal) — wire the diff-viewer/publish UI; re-point gallery.publish. Binary breach until then; the bump (which unblocks e2e) is the precondition for the W6 green proof. |

---

## The one honesty flag (carried forward, sharpened)

The prior A5's flag stands — **no doc may read J's CORE as "live on babb.dev" until the 29-commit jump lands** (host still at `f2fe447`). I ADD a second, symmetric flag born of this re-ground: **no doc may continue to read glass-ui 3.2.0 as "an unreleased future gate" or P5 as "an open glass-ui ask."** Both are now FALSE-against-reality. The danger is not a careless future "shipped" claim (the prior flag) but a careless future "still-gated" claim — a tranche that keeps waiting for a release that already shipped is the exact F/H "broken-for-months-and-nobody-re-checked" failure, here transposed onto a cross-repo book. The structural fix is the K.W0 re-ground sweep: every "gated on glass-ui 3.2.0" string is re-verified against `glass-ui/package.json` + the AS tranche at tranche-open, and a stale gate is an inv-27/inv-16′ honesty defect to close, exactly as A4 closed the un-ledgered dock-VT row. The lesson generalizes to a precept candidate: **a cross-repo ASK carries a re-ground-at-open obligation against the sibling's actual HEAD — a book is not a fact until re-verified.**
