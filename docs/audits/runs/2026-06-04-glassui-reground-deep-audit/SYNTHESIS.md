# SYNTHESIS — the glass-ui-3.2.0 re-ground deep audit (the forward path)

**Authored** 2026-06-04, from 6 dimension auditors (A1 glass-ui-3.2.0 state · A2 value.js J/K/L cohort · A3 fourier plan + this-session changes · A4 deploy+e2e chronics · A5 prompt/precept coverage · A6 chronic/no-legacy ledger), each grounded against the SIBLINGS' ACTUAL HEADS, not the books.

**The user directive (binding)**: *"DEEPLY audit our original plan and waves thereof, alongside all changes made herein. Devise a path forward: NO quick solutions, NO workarounds: idiomatic, gestalt. Architectural transpositions for elegance, simplicity, performance are necessary and desirable. NO legacy code. Delineate any chronically deferred items and fold them into this new tranche. Recap ALL of our prompts and requests hitherto and ensure they've been addressed. This is NOT an implementation phase. Tranche development only."*

Plus the two load-bearing corrections that reframe everything: **(C1)** glass-ui shipped 3.2.0; **(C2)** P5 inner-rounding is REJECTED (the container owns the radius).

---

## §0 — The verdict, stated once

**Both corrections are HARD-CONFIRMED against sibling source. The plan's entire "gated on a future glass-ui 3.2.0 release" scaffolding is FALSE and collapses to ADOPT-NOW.** Ground truth, verified this session:

| Claim | Booked as | ACTUAL (verified) |
|---|---|---|
| glass-ui version | "3.1.0; 3.2.0 absent today, verified" (K.md:74) | **3.2.0** — HEAD `06b35d9`, npm `latest=3.2.0`, installable today |
| dock-VT useId fix | "gated on a future glass-ui 3.2.0 ship" | shipped **3.1.1** (`GlassDock.vue:137 glass-dock-${useId()}`, `DockLayerGroup.vue:69`) |
| `asideSide` (DEC-2 lever) | "does not exist at 3.1.0" | shipped **3.2.0** (`Configurator.vue:85/101/162`, default `right`, grid-column flip, no DOM reorder) |
| `useTextHighlight` | "gated; on `/motion-core`" | shipped **3.2.0** on `/dom` (`composables/dom/useTextHighlight.ts`, multi-instance-safe + `supported` flag) |
| a11y `inert` | "gated" | shipped **3.1.1** (`ConfiguratorLayer.vue:144 :inert`) |
| P5 inner-rounding | "NOT satisfied until inner sections round" | **PHANTOM** — `ConfiguratorLayer.vue:98` + `AS/FINAL.md:113-118` call fourier's ledger a "misdiagnosis"; the container-root clip owns the radius BY DESIGN (commit `779fed7` reverted per-section radius as geometrically inert + divider-deforming) |
| A-1 inter-row divider-rule | "gated on 3.2.0" | genuinely **ABSENT** (still flat `border-b` at `ConfiguratorLayer.vue:100`); glass-ui SELF-BOOKED it to its **AT** successor (`AS/FINAL.md:146-152`) |
| A-2 label/sub ladder hook | "gated on 3.2.0" | genuinely **ABSENT** (literal `text-sm font-semibold` at `ConfiguratorLayer.vue:118`); glass-ui SELF-BOOKED it to **AT** (`AS/FINAL.md:153-155`) |
| value.js peers (atomdiff + publish) | "OPEN — booked J.W0" (`ADOPTION-ASKS:122-123`) | **DONE-in-sibling** — `atomdiff.ts`, `publish.ts`, `crud-list.ts:114` public filter all shipped; value.js **L CLOSED 2026-06-04** (`66dcd68`) |
| keyframes.js | "absent — at 2.2.0" (value.js K) | shipped **3.0.0** (`c66e6f3`); glass-ui 3.2.0 widened peer to `^2.2.0\|\|^3.0.0` |
| CH-DEPLOY (29-commit outage) | K.W1-W3 CORE | **UNCHANGED, REAL** — host at `f2fe447`; `grep` of deploy-hook/Dockerfile/compose for `green_ci_gate\|HEALTHCHECK\|service_healthy` = **0 hits** |
| inv-15 consumer gap | binding J close-gate | **REAL** — `web/src/lib/api.ts` grep for the 7 verbs = **0**; `gallery.ts:226` still `PATCH {visibility:'public'}` |

**The shape decision** (the directive's "devise the SHAPE"): **NO new tranche of substance is needed; J and K-deploy REFINE — but the sequencing inverts.** The audits converge on a single architectural correction: **the glass-ui-3.2.0 adopt is NOT a K-deploy-sequenced future wait — it is a one-line `^3.1.0`→`^3.2.0` bump that belongs at the FRONT of the chain, because it is the hard PREDECESSOR of three things at once**: (1) J's W6 green-run close, (2) the inv-28 API-arm gate being able to PASS instead of correctly-refusing a red SHA, and (3) DEC-2 + the control-pane lens. The current K.md order (land W1 → bump W4) is internally contradictory: **W1 lands a CI-red SHA `9d7c387` that the inv-28 green_ci_gate W2 builds in the same tranche would refuse.** The correction: **bump FIRST → green → land.**

So the forward path is a **re-grounding + re-sequencing of the EXISTING J and K-deploy charters, ratified at a single W0 doc-reground sweep** — not a net-new letter. The chain stays `… μ′=J (open) → ν′=K-deploy`. What changes is the internal wave order and ~14 stale gate-prose sites + 9 ledger flips, none of which is implementation.

---

## §1 — The path forward (NO workarounds, idiomatic, gestalt)

The directive forbids quick fixes; the elegant move here is precisely the idiomatic one. Five architectural corrections, in dependency order:

### §1.1 — The bump is the keystone, and it goes FIRST (the re-sequence)

**Re-cut K.W4 ("glass-ui-3.2.0 adoption wave, gated") into the new FRONT wave of the executable chain.** It is a pure fourier-local `^3.1.0`→`^3.2.0` + `npm install` + lock-regen against an ALREADY-PUBLISHED peer — NOT a wait on a maintainer (inv-16 is irrelevant; the upstream lever was pulled and released). This single action:

- **greens fourier CI at the SOURCE** (the dock-VT `glass-dock-1` collision is structurally impossible in `>=3.1.1` via app-scoped `useId()` + the `proof:vt-names` static gate) — no bridge, no allow-entry, no console-filter;
- **un-`test.fixme`s** the two a11y keystones (`visualization-crud.spec.ts:630`, `visualization-ux.spec.ts:110`) — they flip to live asserting tests, and the restored dock geometry-morph now actually runs;
- **enables DEC-2 controls-LEFT** as a zero-a11y-cost grid-column flip (`aside-side="left"`), deleting the 3 `grid-template-columns` overrides at `VisualizationView.vue:322/326/329`;
- **wires `useTextHighlight`** (from `/dom`, not the doc-drifted `/motion-core`) for the E2 equation-hover + G6 diff-viewer consumers;
- makes the inv-28 API-arm gate (K.W2) able to **PASS** the deploy SHA instead of correctly-refusing a red one.

This is the gestalt: one bump dissolves the e2e chronic, the a11y carry, the DEC-2 gate, the control-pane lens's A-3 lever, and the deploy gate's red-SHA contradiction — five "separate" forward items collapse into one already-available action.

### §1.2 — KILL P5 everywhere; KILL the born-legacy bridge (NO-LEGACY)

**P5 is a PHANTOM-KILL twice over** — user-rejected AND already container-owned upstream, which glass-ui's own FINAL calls fourier's "misdiagnosis." Strike it from all ~8 booking sites (`ADOPTION-ASKS §7:124/148/160/174`, `J.WC-frontend-grand-audit.md:265`, `WC-design-hierarchy.md:151/153/163/174`, `K.md:51/60/78`, `J.md §8`, the control-pane SYNTHESIS A-row, `constellation-adoption-2026-06-02.md §2.3`). Re-caption the π `_seed-workspace-configurator.png` (`DELTA.md:30-32`) from "the pre-existing P5-defect" to a baseline of CORRECT container-owned rounding. **Never re-book.** The 3-tranche inertia (I→J→K) is the lesson: a book is not a fact until re-verified against the sibling's actual close.

**KILL the W6 console-filter bridge BEFORE BIRTH.** It was authored-only (never built — `_probes.ts` absent, 0 grep hits) to keep the suite green WHILE the upstream was owned. The upstream shipped; building the bridge now masks a console error that no longer exists — the exact NO-LEGACY violation the directive forbids when the real fix is one bump away. The honest path is the bump; the e2e probe then passes on real silence. (Keep the legitimate 5-filter→`_probes.ts` DRY consolidation as a pure helper — but no dock-VT allow-entry, no self-deleting probe; the "satisfaction probe" collapses to a plain green assertion.)

### §1.3 — The inv-15 consumer gap is the TRUE J critical path (glass-ui-independent)

Even with 3.2.0 adopted and e2e green, **J cannot honestly close while the CORE is substrate-without-a-consumer** — `api.ts` has 0 callers for the 7 endpoints (remix/forks/provenance/diff/versions/publish/unpublish) and `gallery.ts:226` still PATCHes `{visibility:'public'}` instead of `POST /:slug/publish`. The bump is the UNBLOCKER BENEATH this gap, not above it. **Wire the diff-viewer + publish UI + re-point `gallery.publish()` onto the verb (J.W5/W6)** is the binding inv-15 close-gate — a binary breach until it lands. This outranks the bump on the critical path; the bump is its precondition (the W6 green proof).

Pair it with the two glass-ui-independent J data-model transpositions the session already authored, which survive intact:
- **W2-transpose (SHIP-as-wave, the strongest elegance-delete)**: DELETE the within-viz version chain (`{parent_hash,depth,root_hash}`, `version_count` incremented nowhere, `GET /versions`) — every viz holds one depth-0 version forever, dead substrate (inv-15/NO-LEGACY). Keep cross-viz `fork_of` (real).
- **W2-fix (SHIP-as-wave)**: palette-PATCH FORCE-resolve (remix-only OR mint-version-on-PATCH, no "leave it") + `/diff` to-param + migration delta-recompute, with a test proving a palette change shows in `/diff`.

### §1.4 — K-deploy is the REAL load-bearing chronic; its spine is glass-ui-independent

The deploy chronic does NOT dissolve with the 3.2.0 news. Re-verified unchanged: host 29 commits behind `f2fe447`; no `green_ci_gate`/`HEALTHCHECK`/`service_healthy` exist (grep=0); H2 (lifespan `await connect_db` blocks startup then builds ~30 indexes before `/api/health` answers) + H3 (60s gate too tight for cold WORKERS=1) stand; inv-22 + J-backend RULED OUT (prod viz=0 → migration is a no-op). **The deploy SPINE (land-behind-HEALTHCHECK + fail-closed inv-28 gate + page-on-rollback) is what earns K-deploy its tranche** — the e2e half collapsed to a bump beside it. This is the idiomatic structural fix: a health-condition-gated wait (`depends_on: condition: service_healthy`), NOT a blind longer poll.

### §1.5 — Re-ground the cohort + CONSTELLATION (every head moved)

value.js owes the cohort NOTHING further: the inv-16′ peers are EXECUTED+GREEN in value.js J, folded into K, hardened through L (CLOSED `66dcd68`); the `/diff` conformance probe binds `J-diff-shape.md §3/§4`. **Flip the two MISLEADING-OPEN ledger rows to DONE-in-sibling** (the inv-27 honesty gap, same class A4 closed for the dock row); collapse K.W6 from "BOOK inv-16′ peers" to a **fourier-local /diff + publish envelope PARITY confirm**. The `CONSTELLATION.md §1 roster + §3 "wait for glass-ui" cohort model are OBSOLETE** (every cohort head moved); re-ground to reality at W0 (the doc self-mandates this: §5 "reconcile against reality whenever a member's head moves"). value.js's still-open K continuation + dirty precepts submodule are value.js's arm (inv-16) — booked, not fourier debts.

---

## §2 — The re-sequenced wave skeleton (J refines + K-deploy re-sequences; ratified at one W0)

This is NOT a new letter. The chain stays `μ′=J (open) → ν′=K-deploy`. The skeleton below is the RE-GROUNDED internal order both charters adopt at a single doc-reground W0. The load-bearing change: **the glass-ui bump moves to the FRONT of the executable chain** (it was K.W4-gated; it becomes the predecessor of everything).

| Wave | Tranche | Disposition | Contents |
|---|---|---|---|
| **W0 — RE-GROUND** (DEV) | both | DEV | Ratify ordering ν′ (already written, §20). Sweep the ~14 stale gate-prose sites: rewrite "3.2.0 absent today" → "3.2.0 shipped, ADOPT-NOW"; rewrite the J↔K "circular #1 risk" → "resolved-on-bump, zero external dependency." Flip the 9 ledger rows (§4). KILL P5 (8 sites). Re-ground CONSTELLATION §1/§3 to reality. Reconcile DEC-1 residue → DEC-2; correct the `useTextHighlight` `/motion-core`→`/dom` drift; reconcile `scripts/deploy.sh` (exists in-tree — DONE vs pre-standard-stub, not a to-build punt). Author the precept candidate IFF load-bearing (a cross-repo ASK carries a re-ground-at-open obligation against the sibling's actual HEAD). |
| **W1 — THE BUMP** (was K.W4) | K-deploy, feeds J | SHIP-as-wave | `^3.1.0`→`^3.2.0` + `npm install` + lock-regen. Verify CI greens at the source (cite a green run id, inv-27 — NOT a blind bump; the un-`fixme`'d keystones + restored dock morph may surface latent app faults). Single-copy lock check (keyframes `^2.2.0` vs glass-ui peer-widen; value.js aurora externalization). **KILL the console-bridge before birth.** Consume `inert` (un-fixme), `useTextHighlight` (from `/dom`), set up `asideSide`. **Unblocks J.W6, DEC-2, the control-pane lens, AND the inv-28 gate's pass-condition.** |
| **W2-fix + W2-transpose** (J-local) | J | SHIP-as-wave | The palette-PATCH FORCE-resolve + `/diff` to-param + migration delta-recompute (integrity); DELETE the structurally-phantom within-viz version chain, keep cross-viz `fork_of` (elegance/NO-LEGACY). Glass-ui-independent. |
| **J.W5 — WIRE THE UI** (J-local) | J | SHIP-as-wave | The inv-15 consumer gap close: wire the 7 endpoints into `api.ts`, build the diff-viewer + publish UI, re-point `gallery.publish()` onto `POST /:slug/publish`. Land DEC-2 controls-LEFT (`aside-side="left"`, delete the 3 grid overrides). Set the typography-ladder utility on fourier's OWN headers (the A-2 consumer side, fourier-local). The TRUE J critical path; binary inv-15 breach until then. |
| **J.W6 — e2e GREEN** (J-local close-gate) | J | SHIP-as-wave | The covering green run on a green SHA (now possible — the bump greened CI + wired the consumers). J's honest close gate. |
| **K.W1-W3 — DEPLOY SPINE** | K-deploy | SHIP-as-waves | UNCHANGED, the REAL load-bearing chronic. W1 land the 29-commit backlog observed-green behind a real container HEALTHCHECK + `service_healthy` gate (now landing a GREEN SHA, post-bump). W2 BUILD the inv-28 API-arm `green_ci_gate()` (fails-closed without the operator PAT — the correct safe state). W3 page-on-rollback to a constellation-watched sink + backport to `deploy/templates/`. Host SSH unreachable from this sandbox; rely on the session's documented `f2fe447` verification. |
| **K.W5 — OPERATOR** | K-deploy | SHIP-as-wave | Adopt `scripts/dev.sh` + reconcile the existing `scripts/deploy.sh` (verify conformant vs rewrite); the advisory health-gate reports the same truth the on-host gate enforces. Shipped WITH the spine it wraps. |
| **K.W6 — COHORT PARITY** | K-deploy | SHIP-as-wave (was BOOK) | Collapsed from "BOOK inv-16′ peers" to a fourier-local `/diff` + publish envelope PARITY confirm against `J-diff-shape.md` (peers DONE-in-value.js-L). fourier owes only its OWN Python probe + the paired parity computation. |
| **A-1 / A-2** | glass-ui ask | BOOK-with-kill-date | Genuinely ABSENT at 3.2.0; glass-ui SELF-BOOKED both to its AT successor (`AS/FINAL.md:146-155`). Kill-date = the glass-ui AT/3.3.0 release. fourier holds no lever (inv-16); rides rhythm + explicit `.chassis-divider` + fourier-local ladder meanwhile (no hand-rolled hairline). |
| **K.W7 — dispatch.sh retirement** | K-deploy | BOOK-with-kill-date | UNCHANGED. Kill-date = the 4th non-fourier migration's green acceptance (value.js/palette-api rsync→git critical-path). fourier holds no lever (inv-16). |
| **W8 — CLOSE** (both) | both | DEV | J FINAL (consumers wired, e2e green, parity verdict) + K-deploy FINAL (observed-green prod, fail-closed gate, page-on-rollback). 30-day stale-watch. |
| **L-webmcp** | further-out | BOOK | UNCHANGED. Chromium-146-stable hard external gate. Named successor, not a punt. |

---

## §3 — The re-grounded ASK ledger (each ASK → its verdict)

| Ask | Actual state | Verdict |
|---|---|---|
| glass-ui-dock-vt-name (useId; the e2e/inv-27 unblock) | DONE-in-sibling (3.1.1) | **ADOPT-NOW** — bump greens CI at source; KILL the gate + the console-bridge. Kill-date = the bump commit. |
| Configurator `asideSide` (A-3 / DEC-2 controls-LEFT lever) | DONE-in-sibling (3.2.0) | **ADOPT-NOW** — `aside-side="left"`; delete the 3 grid overrides (`VisualizationView.vue:322/326/329`). |
| `useTextHighlight` (E2 hover + G6 diff-viewer) | DONE-in-sibling (3.2.0, on `/dom`) | **ADOPT-NOW** — import from `/dom` (fix the `/motion-core` doc drift); multi-instance-safe + `supported` flag (inv-29 floor). |
| glass-ui-a11y `inert` (collapsed ConfiguratorLayer) | DONE-in-sibling (3.1.1) | **ADOPT-NOW** — un-`test.fixme` the 2 a11y keystones; they flip to live asserts. |
| glass-ui-P5-inner-rounding | PHANTOM | **KILLED** — user-rejected + container-owned BY DESIGN; glass-ui calls fourier's ledger a "misdiagnosis." Strike 8 sites; re-caption the π seed; never re-book. |
| A-1 inter-row divider-rule | ABSENT | **BOOK-with-kill-date** = glass-ui AT/3.3.0 (glass-ui SELF-BOOKED, `AS/FINAL.md:146`). Non-blocking; fourier rides rhythm + `.chassis-divider`. |
| A-2 label/sub→ladder token hook | ABSENT | **BOOK-with-kill-date** = glass-ui AT/3.3.0 (glass-ui SELF-BOOKED, `AS/FINAL.md:153`). Non-blocking; fourier sets the ladder on its own headers. |
| valuejs-J-atomdiff | DONE-in-sibling (value.js L) | **DONE-in-sibling** — flip the OPEN row; residual = fourier-local /diff envelope PARITY confirm. |
| valuejs-J-publish (+ the [P0] crud-list public filter) | DONE-in-sibling (value.js L; `crud-list.ts:114`) | **DONE-in-sibling** — flip the OPEN row; residual = fourier-local publish envelope PARITY confirm. |
| keyframes-3.0.0 gate (value.js K.W4/W5) | DONE-in-sibling (3.0.0) | **ADOPT-NOW / DISSOLVED** — value.js's arm (inv-16); fourier just stops reasoning about a keyframes wait. |
| VAL-1 OKLab aurora-LUT | first gate now met (`deriveAurora` ships 3.2.0) | **BOOK-with-hard-kill-date** — value.js re-checks the 2nd-consumer condition at its close (value.js-owned; fourier disclaims). |
| CH-DEPLOY (29-commit outage) | PARTIAL/REAL | **SHIP-as-waves** (K.W1-W3) — the REAL load-bearing chronic; glass-ui-independent. |
| inv-28 API-arm green-CI gate | ABSENT (grep=0) | **SHIP-as-wave** (BUILD in K.W2; fails-closed without the operator PAT — not a 3rd book). |
| inv-15 consumer gap (7 endpoints, 0 callers) | REAL breach | **SHIP-as-binding-close-gate** (J.W5/W6) — the TRUE J critical path; outranks the bump. |
| dispatch.sh retirement | PARTIAL | **BOOK-with-kill-date** = 4th migration's green acceptance (inv-16; no lever). |
| precepts value.js+glass-ui sync to 8ccf9f4 | PARTIAL (siblings dirty) | **BOOK-with-kill-date** = each sibling's next clean precepts commit (inv-16′; never write a dirty sibling). |

---

## §4 — The terminal chronic ledger (zero perpetual punts)

| Chronic | Terminal verdict |
|---|---|
| glass-ui-P5-inner-rounding (I→J→K) | **KILLED-AS-PHANTOM** — container-root clip owns the radius BY DESIGN (`Configurator.vue:130`, `779fed7` reverted per-section radius as inert); user-rejected; glass-ui calls the ledger a misdiagnosis (`AS/FINAL.md:113-118`). Struck from 8 sites; never re-book. |
| glass-dock-1 VT-name e2e red (pre-J→J→K) | **ADOPT-NOW** — fixed glass-ui 3.1.1 (`useId()` + `proof:vt-names` gate makes the class impossible). Kill-date = the `^3.2.0` bump commit. No bridge, no allow-entry. |
| glass-ui-a11y `inert` (H.W1→J→K) | **ADOPT-NOW** — fixed glass-ui 3.1.1; un-`fixme` the 2 keystones on the bump. Terminal. |
| asideSide/DEC-2 lever (I→J→K) | **ADOPT-NOW** — DONE glass-ui 3.2.0; wire fourier-local at J.W5. |
| useTextHighlight (I→J→K) | **ADOPT-NOW** — DONE glass-ui 3.2.0 (`/dom`); wire the diff-viewer. |
| A-1 divider-rule (J→K) | **BOOK-with-kill-date** = glass-ui AT/3.3.0 (glass-ui SELF-BOOKED). |
| A-2 label/sub ladder (J→K) | **BOOK-with-kill-date** = glass-ui AT/3.3.0 (glass-ui SELF-BOOKED). |
| valuejs-J-atomdiff (J→K.W6) | **DONE-in-sibling** (value.js L); residual = /diff envelope parity probe. Flip the OPEN row. |
| valuejs-J-publish + crud-list P0 (J→K.W6) | **DONE-in-sibling** (value.js L; P0 fixed `crud-list.ts:114`); residual = publish-envelope parity probe. Flip the OPEN row. |
| CH-DEPLOY (F→G→H→I→J→K.W1-3) | **SHIP-as-waves** — host 29 behind; land observed-green behind HEALTHCHECK+`service_healthy`, fail-closed inv-28 gate, page-on-rollback. The ONE real remaining infra chronic. Re-sequenced AFTER the bump (lands a GREEN SHA). |
| inv-28 API-arm green-CI gate (H→J→K.W2) | **SHIP-as-wave** (BUILD, not a 3rd book; fails-closed without the operator PAT). |
| inv-15 consumer gap, 7 endpoints 0 callers (J→W5/W6) | **SHIP-as-binding-close-gate** — J cannot close until wired. The deepest session no-legacy debt. |
| W2-transpose phantom version chain (J) | **SHIP-as-wave (DELETE)** — degenerate substrate; KISS/NO-LEGACY; keep cross-viz `fork_of`. |
| W2-fix palette-PATCH (B→J) | **SHIP-as-wave (FORCE-resolve)** — remix-only OR mint-version; no "leave it." |
| W6 console-filter bridge (proposed) | **KILL-BEFORE-BIRTH** — born-legacy; 3.2.0 greens the dock; building it masks a non-existent error. |
| keyframes-3.0.0 gate (value.js K) | **DISSOLVED** — keyframes 3.0.0 published; glass-ui peer-widened. value.js's arm; no fourier debt. |
| VAL-1 OKLab aurora-LUT (G→H→I→J) | **BOOK-with-hard-kill-date** — `deriveAurora` ships 3.2.0 (1st gate met); value.js re-checks 2nd-consumer at close. fourier disclaims. |
| VAL-9 spring()→LinearStop[] (G→H→I→J) | **KILLED** — keyframes owns the emitter; ≥2-consumer gate unmeetable. fourier disclaims. |
| C1/CH-3 colour-lift (B→…→J) | **KILLED** — `easings.ts` self-sufficient. |
| dispatch.sh retirement (D→…→K.W7) | **BOOK-with-kill-date** = 4th non-fourier migration's green acceptance. |
| precepts value.js+glass-ui sync (I→J) | **BOOK-with-kill-date** = each sibling's next clean precepts commit (inv-16′). |
| §11 crash-leaves-no-lie prose (J) | **BOOK-with-kill-date** = a passing crash-window test (the step-order is forced viz-first by the compound `_id`; the safety proof was never re-derived). |
| L-webmcp WebMCP (J→L) | **BOOK** — Chromium-146-stable hard external gate; named successor not a punt. |

---

## §5 — Prompt coverage (recap ALL requests; ZERO dropped)

| Prompt / request | Status |
|---|---|
| "publish two ways, private/public; re-publishing must NOT duplicate — flip the flag in place" | ADDRESSED-backend (`visualizations.py:656-659` $set-only, the dead `visibility_illegal_transition` guard's first live caller) — UNCONSUMED in UI (`gallery.ts:226` still PATCHes); folds into the inv-15 J.W5 wire-up. |
| "atom-diff / remix / provenance; fourier INHERITS value.js's fork/version/provenance" | ADDRESSED (J.W2 CORE shipped — canonical_digest §12, atomdiff PATTERN, fork fields, remix §11, forks/provenance/diff/versions) — consumer-gap open (J.W5). |
| DEC-2 (controls→LEFT, superseding DEC-1 keep-RIGHT) | ADDRESSED (J.md:174 banner) — gate DISSOLVED (asideSide ships 3.2.0); lands J.W5. Reconcile the DEC-1 residue (`J-postimpl SYNTHESIS.md:56`). |
| The π every-page before/after edict (precepts 8ccf9f4) | ADDRESSED (capture harness `visual-baseline.spec.ts`, 21 caps, occlusion gate green, DELTA.md) — value.js+glass-ui precepts BOOKED dirty (inv-16′). |
| gap1 (the `*.png` gitignore blocked π evidence) | ADDRESSED (`.gitignore:77-81` negates `docs/**/*.png`; P5 capture archived → re-caption post-KILL). |
| The control-pane hierarchy audit (5 idioms/3 rhythms/4 dividers → one primitive) | ADDRESSED (WC-design-hierarchy.md: H1-H10 fourier-local J.W5; A-1/A-2/A-3 asks) — A-3 ADOPT-NOW, A-1/A-2 BOOK-to-AT, P5 KILLED. |
| "glass-ui is just partially completed — and it has ALREADY SHIPPED 3.2.0" (C1) | CONFIRMED + PROPAGATED — every "gated on 3.2.0" claim flipped to ADOPT-NOW; gate dissolved; ~14 prose sites swept at W0. |
| "P5 inner rounding is rejected — controlled by the container" (C2) | CONFIRMED + PROPAGATED — KILLED across 8 sites; corroborated by glass-ui's own AS/FINAL "misdiagnosis." |
| "DEEPLY audit our plan + all changes herein; path forward; NO workarounds; idiomatic/gestalt; NO legacy; fold ALL chronic+deferred; recap ALL prompts; tranche-dev only" | ADDRESSED — this synthesis: J refines + K-deploy re-sequences (bump-first), 9 ledger flips, P5 + bridge KILLED, 23 chronics terminal-verdicted, this coverage table. Tranche-dev only; no code. |

---

## §6 — Top risks

1. **The re-sequence is the load-bearing correction, not an option.** The current K.md order lands a CI-red SHA (W1) that the inv-28 gate it builds (W2) would refuse — an internal contradiction. The bump MUST go first. If a session executes K.md as-written, it deadlocks.
2. **The bump may surface NEW e2e reds.** Greening the dock-VT restores the dock geometry-morph AND un-`fixme`s the 2 a11y keystones — both now actually assert and could expose latent app-owned faults. The bump wave must cite a green run id (inv-27), not blind-bump.
3. **Single-copy lock drift on the bump** — keyframes 3.0.0 + glass-ui's peer-widen (`^2.2.0||^3.0.0`) + value.js's aurora externalization (47.7→16.8 KiB) need a single-copy lock check at install.
4. **The deploy spine is host-coupled and SSH-unreachable from this sandbox** — K.W1-W3 rely on the session's documented `f2fe447` verification; the operator PAT (inv-28) is a single named human dependency that fails-closed correctly.
5. **The inv-15 consumer gap, not the bump, is J's binary close-gate** — a session that bumps + greens e2e but skips wiring the 7 endpoints would close J on substrate-without-a-consumer (the exact inv-25 honesty shape H was opened to kill).
6. **3-tranche P5 inertia is the meta-risk** — re-book it once and the phantom returns. The precept candidate (re-ground-at-open against the sibling's actual HEAD) is the structural guard; author it IFF load-bearing.
