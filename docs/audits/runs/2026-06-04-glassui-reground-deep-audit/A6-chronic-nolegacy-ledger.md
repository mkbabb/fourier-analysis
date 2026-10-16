# A6 — Chronic + Deferred + NO-LEGACY Ledger, RE-GROUNDED against glass-ui 3.2.0 / value.js-L (KILL P5)

**Dimension**: A6 — the terminal chronic/deferred ledger + the no-legacy sweep of every change made this session, re-grounded against the SIBLINGS' ACTUAL STATE.
**Run**: `docs/audits/runs/2026-06-04-glassui-reground-deep-audit/`
**Verdict**: **The forward plan is built on a stale sibling-state model. Re-grounding collapses ~5 of the 6 carried glass-ui asks to ADOPT-NOW (the gates have DISSOLVED), KILLs P5 as a phantom, and reveals the entire value.js-J cohort is already DONE-in-value.js-L. K.W4 shrinks from a "wait-for-glass-ui-3.2.0 release" wave to a one-line `^3.1.0 → ^3.2.0` bump + consume. Two genuinely-open glass-ui asks remain (A-1, A-2) and one born-legacy artifact (the W6 console-filter bridge) must be killed-before-birth.**

---

## §0 — The re-grounding, in one table (every cross-repo ASK vs the sibling's REAL state)

Verified against `glass-ui@3.2.0` SOURCE (`package.json` version=`3.2.0`; CHANGELOG 3.1.1=AR.W2, 3.2.0=AS) and `value.js` tranches J/K/L (L CLOSED 2026-06-04).

| Carried ASK (fourier K/J docs) | Booked state in fourier docs | SIBLING REAL STATE (cited) | TERMINAL VERDICT |
|---|---|---|---|
| `glass-ui-dock-vt-name` | OPEN, "gated on glass-ui 3.2.0", UNBLOCKS J.W6 | **DONE** — `GlassDock.vue:137` `dockId = glass-dock-${useId()}`; `DockLayerGroup.vue:69` `useId()`; shipped **3.1.1/AR.W2** + a `proof:vt-names` static gate makes the class structurally impossible | **ADOPT-NOW** — kill the "future glass-ui release" gate |
| `glass-ui-P5-inner-rounding` | OPEN, "NOT satisfied until inner sections round", BOOK-on-adopt | **REJECTED BY USER + DONE-AS-DESIGN** — `ConfiguratorLayer.vue:98` comment: *"No per-section radius: rounding is owned at the container root clip … a per-section radius only deforms the hairline."* AR.W2 FINAL: b6d6cf4's per-section radius "was geometrically inert and deformed the divider; the fix removes it and lets the container's `rounded-panel overflow-hidden` clip own all rounding" | **KILL** — phantom finding; the container owns the rounding by design; remove from all 4 fourier locations |
| `Configurator asideSide` (A-3, DEC-2 lever) | OPEN, "does not exist at 3.1.0", [P0/keystone] | **DONE** — `Configurator.vue:85,101,162,165,172` full `asideSide?: ConfiguratorAsideSide` (`"left"\|"right"`), grid-column flip + border-side (NOT DOM reorder — exactly the a11y shape the ask demanded); AS.W… `AS/FINAL.md:110` | **ADOPT-NOW** — kill the gate; DEC-2 LEFT-move has its lever |
| `useTextHighlight` | OPEN, "glass-ui authors FIRST" | **DONE** — `src/composables/dom/useTextHighlight.ts` + `__tests__/useTextHighlight.test.ts`, exported via `dom/index.ts`; multi-instance-safe (AS.W…, `AS/FINAL.md:120`) | **ADOPT-NOW** — kill the gate |
| `glass-ui-a11y` (`inert` un-fixme, H.W1) | OPEN, both keystones `test.fixme`'d pending a glass-ui release | **DONE** — `ConfiguratorLayer.vue:144` `:inert="!internalOpen \|\| undefined"`; shipped **3.1.1/AR.W2** | **ADOPT-NOW** — bump + un-`fixme` the two H.W1 e2e keystones; kill the gate |
| `A-1` (Configurator inter-row divider-rule opt-in) | OPEN, net-new glass-ui ask, K.W4-carried | **ABSENT** — `ConfiguratorLayer.vue:100` still a flat `border-b border-border/40`; the twin-line groove is `instrument-rail`-only (`instrument-rail.css:74-114`). AS FINAL lists A-1 as **"AT"** (after-tranche, glass-ui's NEXT tranche — budget-gated: `index.css` at 99.5%, needs a conscious rebase) | **BOOK-with-kill-date** = the glass-ui AT/3.3.0 release; genuinely glass-ui-owned-open; fourier holds no lever (inv-16) |
| `A-2` (label/sub bound to typography ladder at component root) | OPEN, net-new glass-ui ask, K.W4-carried | **ABSENT** — `ConfiguratorLayer.vue:118/121` still magic literals `text-sm font-semibold` / `text-micro font-mono`; the `text-title`/`text-heading` ladder UTILITIES exist (`typography.css:270,279`) but ConfiguratorLayer does not consume them. AS FINAL lists A-2 as **"AT"** (a class swap, ≈0 net CSS, needs visual verification) | **BOOK-with-kill-date** = the glass-ui AT/3.3.0 release; genuinely glass-ui-owned-open |
| `valuejs-J-atomdiff` | OPEN, booked J.W0, kill = value.js-J close | **DONE** — `api/src/lib/crud/atomdiff.ts` + `services/palette/diff.ts` + `services/palette/forks.ts` + `services/palette/versions.ts` all present; value.js J/K/L all have FINAL.md (**L CLOSED 2026-06-04**) | **ADOPT-NOW / VERIFY-PARITY** — peer has shipped it; the only residual is the `/diff`-envelope parity probe against `J-diff-shape.md` |
| `valuejs-J-publish` (+ the crud-list P0) | OPEN, P1, the P0 visibility-leak filter MUST land with publish | **DONE** — `api/src/routes/palettes/publish.ts` (`POST /:slug/{publish,unpublish}` in-place flip); the **P0 IS FIXED**: `crud-list.ts:114` now sets `f.visibility = "public"` for anon/other-user browse (the leak the ask named is closed) | **ADOPT-NOW / VERIFY-PARITY** — peer shipped both the verb and the P0 fix; residual = publish-response-envelope parity probe |
| `dispatch.sh` retirement | BOOK-GATED on all-4-migrate, K.W7 | unchanged (gated on the non-fourier rsync→git migrations; value.js/palette-api the critical fourth) | **BOOK-with-kill-date** = the 4th migration's green acceptance; NOT a perpetual punt (mechanical gate, fourier holds no lever) |
| precepts value.js+glass-ui sync booking | BOOKED (dirty precepts submodules at I-close) | this session bumped fourier+speedtest+words+muster to `8ccf9f4`; value.js+glass-ui BOOKED because their precepts submodule was dirty | **BOOK-with-kill-date** = each sibling's next clean precepts commit; inv-16′ (never write a dirty sibling) |

**The headline**: of the 7 glass-ui asks, **5 are DONE-in-3.2.0 → ADOPT-NOW** (dock-VT, asideSide, useTextHighlight, inert) **+ 1 is KILL** (P5) **+ only 2 remain genuinely open** (A-1, A-2, both glass-ui "AT"-booked). Both value.js peers are **DONE-in-value.js-L**. **The K.W4 "glass-ui-3.2.0 adoption wave gated on a future release" is FALSE-FRAMED at root: 3.2.0 is published; the bump is `web/package.json:14` `^3.1.0 → ^3.2.0`, one line.**

---

## §1 — KILL P5 (the user's binding correction — executed across all 4 locations)

**The user**: *"inner rounding is rejected — the rounding is controlled by the container."* This is not a deferral; it is a **phantom-kill**. glass-ui's own source agrees verbatim (`ConfiguratorLayer.vue:98`) and AR.W2 already SHIPPED the removal of the per-section radius (it deformed the divider). **There is nothing for glass-ui to fix; P5 is not glass-ui-owned-open — it is closed-by-design.**

P5 must be struck from these exact fourier locations (each currently carries it as an OPEN/booked defect — every one is now WRONG):

| # | Location | Current text (the lie to remove) | Disposition |
|---|---|---|---|
| 1 | `docs/constellation/ADOPTION-ASKS.md:124` (`glass-ui-P5-inner-rounding` row) + `:148` (the §7 prose) | "round the INNER section dividers at the component ROOT … NOT satisfied until the inner sections round" | **STRIKE the row + prose**; record one terminal line: *KILLED 2026-06-04 — user-rejected; container clip owns rounding (glass-ui `ConfiguratorLayer.vue:98`, shipped AR.W2)* |
| 2 | `docs/tranches/J/design/J.WC-frontend-grand-audit.md` §F (the chronic table) + §G owner-matrix row "`ConfiguratorLayer` inner-rounding fix (P5)" | "BOOK → glass-ui (owner), SHIP-on-adopt at W5 … NOT marked satisfied until … inner sections round" | **STRIKE both rows**; the §F terminal-disposition becomes KILLED |
| 3 | `docs/tranches/J/design/WC-design-hierarchy.md:151` (the **P5** ask row) + `:153`/`:163`/`:174` (the carry-forward + "Adopt 3.2.0 (A-1,A-2,A-3,P5)" line) | "the inner sections round at the component root … before/after at W5" | **STRIKE the P5 row; drop P5 from the `(A-1,A-2,A-3,P5)` adopt-list** |
| 4 | `docs/tranches/K/K.md` §1/§3/§4(W4)/§7/§8 (every "P5-inner-rounding" mention) | "P5-inner-rounding satisfied by a visual-evidence test — NOT until the inner sections round" | **STRIKE from the W4 contents + the completion criterion + §8 named-forward** |
| 5 | `docs/tranches/J/J.md §8` + `docs/tranches/J/audit/constellation-adoption-2026-06-02.md §2.3` ("Known visual state — the P5 defect … OPEN, booked-not-shipped") | "the squared `ConfiguratorLayer` INNER-section rounding … NOT marked satisfied until the inner sections round" | **STRIKE the "Known visual state" row**; the `w2-workspace-configurator.png` capture is NO LONGER a defect-evidence anchor — it is a normal baseline |

**NO-LEGACY corollary**: the P5 strike also kills the standing "NO `!important` workaround" guard-rail wherever it exists **only** to protect P5 (`WC-design-hierarchy.md:173`, `ADOPTION-ASKS.md:124`). The guard-rail is correct policy in general; but the specific P5-rounding `!important` it forbids is now moot — there was never a real defect to mask.

---

## §2 — The glass-ui asks: collapse 4 gates to ADOPT-NOW

Each of these 4 was booked "gated on glass-ui 3.2.0 (absent today)". 3.2.0 is published; all 4 are in the SOURCE. The gate dissolves.

- **dock-VT (`glass-ui-dock-vt-name`)** — `ADOPTION-ASKS.md:125` claims "setup-local `let n` counter → every instance mints `glass-dock-1`". That is the 3.0/3.1.0 truth; **3.1.1 replaced it with `useId()`** (`GlassDock.vue:137`). The e2e chronic (A4) is therefore **already fixed upstream**. fourier's act is `^3.1.0 → ^3.2.0` + re-run e2e. **The `commits/<sha>/status` red on `9d7c387` will GO GREEN under 3.2.0** (the duplicate-VT console error vanishes). This is the single most load-bearing re-ground: **J.W6's inv-27 close is unblocked by a one-line bump, not a cross-repo wait.**
- **asideSide (A-3)** — DONE (`Configurator.vue:85`). DEC-2 (controls→LEFT) has its lever NOW. Drop the "[P0/keystone] gate" framing; it is an adopt-and-wire fourier-local task.
- **useTextHighlight** — DONE (`composables/dom/useTextHighlight.ts`). The diff-viewer / equation-var consumer can wire it on adopt.
- **inert (`glass-ui-a11y`)** — DONE (`ConfiguratorLayer.vue:144`, AR.W2). The two H.W1 e2e a11y keystones currently `test.fixme`'d (`ADOPTION-ASKS.md:117,133`) can be **un-`fixme`'d on the bump** — the `aria-hidden-focus` serious violation is gone upstream. This closes an H-era chronic by ADOPTION.

**Net**: K.W4's contents shrink to: (a) bump `^3.2.0`; (b) wire `asideSide` (DEC-2); (c) wire `useTextHighlight` (diff-viewer); (d) un-`fixme` the 2 a11y keystones; (e) re-run e2e green. **No "wait for glass-ui maintainer" remains for these five.** Only A-1/A-2 stay as genuine forward asks.

---

## §3 — The 2 genuinely-open glass-ui asks (A-1, A-2): BOOK, do not pretend-DONE

These are the only carried glass-ui asks that are NOT satisfied in 3.2.0 — and crucially **glass-ui itself has booked them as "AT" (after-tranche)** in `AS/FINAL.md:145-155`:

- **A-1** (inter-row machined-groove divider opt-in) — ABSENT; glass-ui FINAL: "AT … `index.css` is at 99.5% — a conscious budget rebase is the AT precondition." **BOOK-with-kill-date = glass-ui's AT/3.3.0 release.** fourier holds no lever (inv-16); the fourier-local fallback is the explicit `.chassis-divider` at real sub-section boundaries (already the WC-hierarchy R3 plan), NOT a hand-rolled hairline (NO-LEGACY).
- **A-2** (label/sub → typography-ladder at the component root) — ABSENT; glass-ui FINAL: "AT … a class swap … needs visual verification." **BOOK-with-kill-date = glass-ui's AT/3.3.0 release.** The fourier-local rung (setting the ladder utility on fourier's OWN headers) lands J.W5 without the ask; only the component-internal token-hook waits on A-2.

**Verdict**: K.W4's only remaining cross-repo-gated content is A-1 + A-2, and even those are now glass-ui-self-booked (so they are tracked in the sibling's own ledger, not a fourier-invented punt). Re-name the wave honestly: **"K.W4 — glass-ui 3.2.0 ADOPT-NOW bump (5 asks satisfied) + A-1/A-2 booked to glass-ui-AT."**

---

## §4 — The value.js-J peers (A2 surface): DONE-in-value.js-L

Both peers are no longer "asks the maintainer will execute" — value.js has executed them and **CLOSED L** (`value.js/docs/tranches/L/FINAL.md` "CLOSED 2026-06-04"; J/K/L all have FINAL.md):

- **`valuejs-J-atomdiff`** — `api/src/lib/crud/atomdiff.ts` exists; `forks.ts`/`versions.ts`/`diff.ts` present. **ADOPT-NOW / VERIFY-PARITY**: the residual is the cross-repo `/diff`-envelope parity probe against `J-diff-shape.md` (op vocab `added/removed/changed`) — a fourier close-gate, not a value.js ask.
- **`valuejs-J-publish`** — `api/src/routes/palettes/publish.ts` (`POST /:slug/{publish,unpublish}`, in-place flip). **The named [P0] is FIXED**: `crud-list.ts:114` `f.visibility = "public"` for anon/other browse — the private-palette leak the ask was conjoined to is closed. **ADOPT-NOW / VERIFY-PARITY**: residual = publish-response-envelope parity probe.

**Verdict**: K.W6 collapses from "two BOOK-with-kill-date peers" to **"two cross-repo PARITY-VERIFY probes"** — the kill-date (value.js-J close) has already passed. Re-book K.W6 as a verify-only wave; the asks are discharged at source.

---

## §5 — Deploy + e2e chronics (A4 surface) — terminal verdicts

- **CH-DEPLOY** (host stuck at `f2fe447`, 29 commits behind; G/H/I/J never deployed; health-gate silent-rollback) — **BOOK-with-kill-date = K.W1+W2+W3** (confirmed live this session via SSH). This is a REAL, root-caused chronic (lifespan index-blocking + 60s-too-tight cold WORKERS=1 + no container HEALTHCHECK + no off-host observability; J backend RULED OUT — prod viz=0 so the migration is a no-op; inv-22 RULED OUT). NOT a punt: it is the CORE of K-deploy with three observable acceptance gates. The kill is: `9d7c387+` observed-green in prod + the API-arm green-CI gate fails-closed + a rollback pages a watched sink.
- **e2e/glass-dock-1 chronic** (CI red, run 26913592291) — **DISSOLVED-TO-ADOPT-NOW.** The root cause (`glass-dock-1` duplicate `view-transition-name`) is **already fixed in glass-ui 3.1.1/3.2.0** (§2). The e2e unblock is the `^3.2.0` bump, NOT a future glass-ui wait. inv-28 SPA deploy was correctly skipped while CI is red; once the bump greens e2e, the SPA deploy un-blocks too. **Kill-date = the 3.2.0 bump commit.**

---

## §6 — W2-fix / W2-transpose / phantom-chain (the data-model folds) — terminal verdicts

These are **J-local** (the audit's clean scope-split — not K-deploy, not glass-ui). Re-confirmed against the shipped W2 code (`api/routers/visualizations.py`):

- **W2-transpose (DELETE the phantom within-viz version chain)** — **SHIP-as-J-wave (elegance-delete).** Verified the degeneracy: every viz holds exactly one depth-0 version forever; `version_count` is incremented nowhere; `GET /versions` returns a single-element chain always. `VisualizationVersion.{parent_hash,depth,root_hash}` + `version_count` + `GET /versions` + the within-viz `chain` are dead substrate (inv-15 binary breach — substrate-without-a-consumer). DELETE them; **keep** cross-viz `fork_of_hash` (`visualizations.py:579`, correct + load-bearing) + the single per-viz atom snapshot `/diff` reads. This is the directive's elegance transposition; the *recorded-and-declined* alternative (an edit-creates-a-version op that fills the chain) is a CORE expansion, not the KISS line.
- **W2-fix (palette-PATCH-outside-versions)** — **SHIP-as-J-wave (FORCE-resolve, no "leave it").** `palette_slug` is a remix atom mutated by a generic PATCH outside the version system → `set_hash` goes stale while `/diff` is cached immutable 1yr (A2-3). One decision: `palette_slug` becomes **remix-only** (dropped from `VisualizationUpdate`) OR a palette PATCH mints a version. Must ship with a test proving a palette change shows in `/diff`.
- **`/diff` `to`-param honor-or-reject** + **migration must stop cementing `atom_diff=[]` over a crash-orphaned fork** (recompute from the two HEAD snapshots when `fork_of_hash` set) — **SHIP-as-J-wave** (W2-fix integrity batch). Verified `migrate_visualization_forks` / `test_migrate_forks.py:73` asserts `atom_diff == []` — that assertion is the bug-cement; it must recompute for `fork_of_hash`-set rows.
- **§11 "crash leaves no lie" prose** — **BOOK-with-kill-date** = a passing crash-window test (viz present, version absent) proving `/diff` recomputes-or-404s rather than lying `identical=True`. The prose is stale (the step order was forced viz-first by the compound `_id`; the safety proof was never re-derived). No further "crash-safe" claim until that test exists.
- **inv-15 consumer gap (the 7 CORE endpoints have ZERO frontend caller)** — **SHIP-as-J-wave (W5/W6 wire-the-UI).** Verified: `grep web/src/lib/api.ts` for `remix\|forks\|provenance\|diff\|versions\|publish\|unpublish` = 0; `gallery.ts` still PATCHes publish (not `POST /:slug/publish`). This is a **binary inv-15 breach at HEAD** and the deepest no-legacy debt of the session — a half-shipped CORE. It blocks J's honest close.

---

## §7 — NO-LEGACY sweep of EVERY change made this session

Each session change inspected for workaround / legacy / phantom / born-legacy.

| Change | Verdict | Evidence / fix |
|---|---|---|
| **`set_hash` content-address default** (`visualizations.py:129` `_id=f"{viz_slug}:{set_hash}"`) | **CLEAN** — content-addressed `_id` is idiomatic for the no-transaction ordered-write model (`§11`); `_head_set_hash` recomputes when absent (`:480`), so a missing `set_hash` self-heals rather than corrupting. No legacy. | `visualizations.py:477-480` |
| **`atom_diff` carries the delta** (`AtomOp` list on the version) | **CLEAN-WITH-ONE-FOLD** — the PATTERN is sound; the ONE legacy risk is the migration cementing `atom_diff=[]` over a real fork (§6, folded to W2-fix). Fix: recompute from snapshots when `fork_of_hash` set. | `visualizations.py:823,881`; `test_migrate_forks.py:73` |
| **compound `_id` / version doc** | **CLEAN-BUT-the-chain-is-phantom** — the compound `_id` is fine; the *within-viz version CHAIN* it anchors is the degenerate substrate W2-transpose DELETEs (§6). The compound `_id` survives for the single snapshot; the chain fields do not. | `visualizations.py:129`; §6 W2-transpose |
| **no-transaction ordered idempotent writes** (`§11`) | **CLEAN** — the correct KISS divergence from value.js's replica-set transactions (standalone Mongo can't transact; J re-expressed remix as content-addressed ordered writes). The only residual is the stale "crash leaves no lie" prose (§6, booked to a test). | `design/J.W1-crud-remix.md §11` |
| **W6 console-filter bridge** (the `_probes.ts` + kill-dated exact-string allow-entry for the glass-dock duplicate-VT warning) | **KILL-BEFORE-BIRTH (born-legacy).** Verified it is NOT yet in the tree — `gallery.spec.ts:130` filters only favicon/404/ERR_CONNECTION_REFUSED/429, NOT the glass-dock string. Since 3.2.0 **already greens** the dock-VT (§2), the bridge would be born to mask a console error that no longer exists. **Do NOT build it.** The honest path is the `^3.2.0` bump; the e2e "no console errors" probe then passes on real silence, not a filtered allow-entry. Building the bridge now would be the exact NO-LEGACY violation the directive forbids. | `web/e2e/gallery.spec.ts:130-137`; §2 dock-VT DONE |
| **π baseline capture harness** (`web/e2e/visual-baseline.spec.ts`, 21 caps, occlusion gate) | **CLEAN** — a structural close-step harness, not a `proof:*` script (the grep-codification idiom is retired). Keep. One note: it should NOT pair its captures against the P5 "defect" anchor (§1.5) — `w2-workspace-configurator.png` is now a normal baseline, not a defect-evidence frame. | `web/e2e/visual-baseline.spec.ts` |
| **gap1 — gitignore `*.png` negation** (`!docs/**/*.png` at `.gitignore:81`) | **CLEAN** — necessary to let the π before/after evidence enter history (the blanket `*.png` was the real blocker). Scoped to `docs/**` + `assets/**`; not a blanket un-ignore. | `.gitignore:79-81` |
| **DEC-2 (controls→LEFT, supersedes DEC-1)** | **CLEAN + NOW-UNGATED** — DEC-2 was authored gated on `asideSide` "not existing at 3.1.0". `asideSide` IS in 3.2.0 (§2). DEC-2's lever exists; it is now a fourier-local wire-up (grid-column flip, NOT DOM reorder — the a11y shape glass-ui already implements). No legacy. | `Configurator.vue:162,165,172`; `WC-design-hierarchy.md:115-117` |
| **`scripts/deploy.sh`** (the booked "thin deploy.sh wrapper", booked-action #2) | **RE-GROUND DISCREPANCY** — `scripts/deploy.sh` **already exists** in-tree, yet `K.md §4 W5` + `constellation-adoption §1.3/§5(#2)` still book it as "not executed / wrapper to add". Reconcile: verify whether the existing `deploy.sh` is the conformant wrapper (then mark #2 DONE) or a pre-standard stub (then the booking stands as a conformance rewrite, like `dev.sh`). Do not carry a "to-build" booking for a file that exists. | `scripts/deploy.sh` present; `K.md:79`, `constellation-adoption §5` |
| **precepts sync to 8ccf9f4** (fourier+speedtest+words+muster bumped; value.js+glass-ui BOOKED) | **CLEAN** — inv-16′ honored (never write a dirty sibling); the two BOOKED bumps are correctly gated on each sibling's next clean precepts commit. NOT a perpetual punt — kill-date = sibling-clean. | commit `227c283`; `70cc791` |

---

## §8 — The terminal chronic ledger (zero perpetual punts)

| Chronic | Lineage | TERMINAL VERDICT |
|---|---|---|
| **P5 inner-rounding** | I→J→K | **KILL** — user-rejected; container clip owns rounding (DONE-as-design, AR.W2). Phantom. |
| **glass-dock-1 VT-name (e2e red)** | pre-J→J→K.W4 | **ADOPT-NOW** — fixed in glass-ui 3.1.1 (`useId()`); kill-date = the `^3.2.0` bump commit. |
| **glass-ui-a11y `inert`** | H.W1→J→K | **ADOPT-NOW** — fixed in glass-ui 3.1.1; un-`fixme` the 2 keystones on bump. |
| **asideSide / DEC-2 lever** | I→J→K | **ADOPT-NOW** — DONE in 3.2.0; wire fourier-local. |
| **useTextHighlight** | I→J→K | **ADOPT-NOW** — DONE in 3.2.0; wire diff-viewer. |
| **A-1 divider-rule** | J→K | **BOOK-with-kill-date** = glass-ui AT/3.3.0 (glass-ui-self-booked, `AS/FINAL.md:145`). |
| **A-2 label/sub ladder** | J→K | **BOOK-with-kill-date** = glass-ui AT/3.3.0 (glass-ui-self-booked, `AS/FINAL.md:153`). |
| **valuejs-J-atomdiff** | J→K.W6 | **VERIFY-PARITY** — DONE in value.js-L; residual = `/diff` envelope parity probe only. |
| **valuejs-J-publish + crud-list P0** | J→K.W6 | **VERIFY-PARITY** — DONE in value.js-L (P0 fixed at `crud-list.ts:114`); residual = publish-envelope parity probe. |
| **CH-DEPLOY (29-commit outage)** | F→G→H→I→J→K.W1-3 | **BOOK-with-kill-date** = observed-green prod + fail-closed API gate + paging rollback (real chronic, 3 acceptance gates). |
| **inv-28 API-arm green-CI gate** | H→J→K.W2 | **SHIP-as-wave** (BUILD in K.W2, not a 3rd book). |
| **inv-15 consumer gap (7 endpoints, 0 callers)** | J→W5/W6 | **SHIP-as-wave** (binary breach; J cannot close until wired). |
| **W2-transpose phantom version chain** | J→W2-transpose | **SHIP-as-wave (DELETE)** — KISS/NO-LEGACY elegance-delete. |
| **W2-fix palette-PATCH** | B→J→W2-fix | **SHIP-as-wave (FORCE-resolve)** — remix-only OR mint-version; no "leave it". |
| **§11 "crash leaves no lie" prose** | J→W0′/W2-fix | **BOOK-with-kill-date** = a passing crash-window test. |
| **W6 console-filter bridge** | (proposed) | **KILL-BEFORE-BIRTH** — born-legacy; 3.2.0 greens the dock; do not build. |
| **dispatch.sh retirement** | D→E→F→G→H→J→K.W7 | **BOOK-with-kill-date** = the 4th non-fourier migration's green acceptance. |
| **precepts value.js+glass-ui sync** | I→J | **BOOK-with-kill-date** = each sibling's next clean precepts commit (inv-16′). |
| **VAL-9** (`spring()→LinearStop[]`) | G→H→I→J | **KILL** — keyframes owns the emitter; ≥2-consumer gate structurally unmeetable. fourier disclaims. |
| **VAL-1** (OKLab aurora-LUT) | G→H→I→J | **BOOK-with-hard-kill-date** at value.js close (ship IFF `deriveAurora()` + 2nd consumer live — and `deriveAurora` IS now in glass-ui 3.2.0 CHANGELOG, so re-check the gate). fourier disclaims. |
| **C1 / CH-3 colour-lift** | B→C→D→G→J | **KILLED** (terminal; `easings.ts` self-sufficient). |
| **L-webmcp (WebMCP)** | J→L | **BOOK** — hard external gate Chromium 146 stable; renamed from stale "K" booking. Not a punt — a named feature successor. |

**Zero perpetual punts**: every row has KILL / ADOPT-NOW / VERIFY-PARITY / SHIP-as-wave / BOOK-with-kill-date / DECLINE-recorded. No row reads "carried forward, owner-watch" without a date or a verb.

---

## §9 — The one structural lesson for the forward tranche

The entire K.W4 wave + half the §7/§8 chronic ledger were authored against a **glass-ui 3.1.0 model that was already two releases stale** (3.1.1/AR + 3.2.0/AS shipped before the J post-impl audit ran). The audit's own §6.1 named the J↔K-deploy circular dependency as the #1 risk — but the dependency **was already broken upstream**: glass-ui 3.1.1 fixed the dock-VT, so J.W6's inv-27 close was never actually hostage to a future K.W4. **The forward tranche's first act must be to RE-READ the sibling's published version + CHANGELOG before authoring any "gated-on-a-future-release" ask** — this single discipline would have collapsed 5 asks to ADOPT-NOW at authoring time. Codify it: *no cross-repo ask is booked "gated on a future sibling release" without first grepping the sibling's published `package.json` version + CHANGELOG + latest tranche FINAL.* That is the structural fix for the staleness this whole re-grounding corrects.
