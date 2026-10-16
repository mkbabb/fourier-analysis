# glass-ui-next — precept + prompt recap (the AT-fold predicate)

The binding-precept + standing-ask recap the new glass-ui tranche MUST carry. It
answers two questions before a wave is authored: (1) which glass-ui precepts the
new tranche honors verbatim, and (2) what the constellation already asked of
glass-ui — with HONEST status — so nothing chronic re-rots and nothing shipped
re-ships. Authored under inv-16 (fourier owns `docs/constellation/`); every
sibling fact cites the sibling's own committed artefact, read-only.

Provenance read: `glass-ui/docs/precepts/instructions/README.md` ·
`glass-ui/docs/tranches/AT/{AT.md,PROGRESS.md,design/AT.W1b-dock.md,design/AT.W1c-color-gates.md}` ·
`glass-ui/docs/tranches/AT/audit/W0-L4-deferred-chronic-ledger.md` ·
`glass-ui/docs/tranches/AS/FINAL.md` · `HUB/docs/constellation/{CONSTELLATION.md,ADOPTION-ASKS.md,PRECEPTS-SYNC.md,DOCK-ANIMATION-CONVERGENCE.md}` ·
`keyframes.js/docs/tranches/B/asks/glass-ui-dock-convergence.md` · glass-ui HEAD `8e4cb9f`.

---

## §0 — The load-bearing finding: AT is HALF-DRIVEN + dirty (the reason this fold exists)

AT.md is unambiguous (§Format): "W2-W8 are IMPLEMENTATION, authored now as
binding specs, RUN only on explicit user authorization." `PROGRESS.md` top-line:
"AT is plan-first, awaiting impl authorization." Yet glass-ui HEAD carries THREE
IMPL commits past the plan boundary:

- `e906448` — AT.W6-dock-c VT/FLIP timing-parity spring + `isTransitioning` concurrency
- `f0b0ffb` — "AT.W6-dock-b — touch-gate B′ + behavioural touch test"
- `8e4cb9f` — AT.W7-dock-a/b/c — overflow clean break + token design refinements + ι doc-rot gate

These are the dock slices the 2026-06-04 `DOCK-ANIMATION-CONVERGENCE.md` campaign
drove (its §9 records them DONE on PR #1 `at-dock-convergence`). The tree is also
dirty (` m docs/precepts`). **AT was opened plan-only, then partially executed by
a cross-arm campaign — exactly the double-driven, dirty state the mandate warns
against.** Three consequences the new tranche MUST reconcile, not paper over:

1. **A slot-ID collision (a real defect in the record).** The AT PLAN names
   `W6-dock-b` = *the a11y + state-machine contract test* (`AT.W1b-dock.md:35`).
   The COMMIT `f0b0ffb` re-labels `W6-dock-b` = *the touch-gate B′ behavioural
   test*. Two distinct deliverables now share one slot ID. The touch-gate landed;
   the planned a11y/state-machine contract test did NOT. The new tranche must
   re-letter and execute the un-shipped a11y contract under its own ID — NOT
   inherit the collision.
2. **The dock's structural waves remain UNEXECUTED.** `proof:strict-templates`
   (W6-dock-a, the KEYSTONE that must land FIRST so clean breaks typecheck-fail),
   the reka-ui `Tabs` rail adoption (the `role=tablist` ARIA + roving tabindex),
   and the travelling rail-indicator are all still PLANNED. The campaign itself
   admits this (`DOCK-ANIMATION-CONVERGENCE.md §9`: "the structural rail refactor
   lands in AT's run"). So the dock is partly hardened, partly not — an honest
   in-between the new tranche inherits.
3. **The entire blob/WebGL/color headline (W2-W5) is UNTOUCHED.** `useWebGLCanvas`
   substrate, `frostShader` delete, the `/color` leaf, `/watercolor-dot`,
   `/goo-blob`, the OKLCh shader-quality wave, every color/correctness gate — all
   PLANNED, none run. This is the bulk of AT and the 3.3.0 publish surface.

**Mandate to the new tranche:** AT did not fail — it was correctly authored
forward, then a scoped campaign cherry-picked the dock-motion convergence out of
it. The new tranche RE-GROUNDS against HEAD `8e4cb9f` (the three landed dock
commits are FACT, not plan), folds the un-executed remainder, and is the honest
single owner of the 3.3.0 surface. It binds zero-deferral at open (P-Inv 28).

---

## §1 — The glass-ui precepts the new tranche MUST honor (verbatim, falsifiable)

These are glass-ui's own canonical precepts (`precepts/instructions/README.md`)
plus the constellation invariants binding glass-ui's arm. Each is a HARD gate the
new tranche carries, not a sentiment.

### P1 — No legacy code (`README.md:23`)

> "Delete dead code. Do not rename it, hide it behind a flag, or keep it as a
> compatibility alias."

The new tranche's clean breaks carry NO alias. The AT overflow collapse already
modeled this correctly — `8e4cb9f` DELETED the `.dock-wrap` class and the `wrap`
boolean with no alias (`rg "\.dock-wrap\b" src/ = 0`). Every remaining break holds
the same bar: `frostShader.ts` is DELETED (not deprecated); the demo's 1×1-canvas
`cssColorToRgb` probe is DELETED (replaced by the injected `ColorResolver`, which
THROWS on a no-resolver mount — the loud failure, not a silent gray default);
`DockTabButton` (0 consumers, confirmed) is RETIRED not kept. FALSIFIABLE: a grep
for any retired symbol's name outside its deletion commit returns 0.

### P2 — Architectural transposition is desirable (the user's standing directive)

The user's verbatim charge: "architectural transpositions in the sake of
elegance, simplicity, and performance are necessary + desirable." AT is BUILT on
this — the blob lift is "a forcing function for three transpositions" (AT.md §1):
ONE `useWebGLCanvas` substrate (aurora + goo-blob share; `frostShader` orphan
deleted; the missing `webglcontextrestored` + off-screen-pause gate absorbed —
strictly ADDITIVE on robustness), the `ColorResolver` injected seam replacing the
DOM-coupled hack, the OKLCh shader transposition. The new tranche carries these
transpositions IN FULL. NO workaround substitutes for a transposition: the C6
must-fix #4 is binding — the substrate must NOT bake aurora's quad/attrs/DPR
choices (a consumer-#2 usability assert co-gates it), or the "extraction" is a
disguised copy. FALSIFIABLE: each transposition is net-deletion-or-neutral at its
core, proved by a before/after LOC + a ≥2-consumer assert.

### P3 — Substrate with consumer + wire before retire (`README.md:28,33`)

> "New abstractions land with a runtime caller, test, benchmark, or other proof."
> "A primitive that is under-wired … is a WIRE candidate by default."

The binary-substrate invariant (≥2 DISTINCT consumer CONTEXTS, NOT 2 call-sites
in one demo — the J-inv-10 census-vs-convergence line) gates every new public
surface. The W0-L4 ledger already applied it ruthlessly: the blob headline ships
on value.js (the firm, A→F-aged producer-consumer) + a glass-ui demo story (the
`deriveAurora` precedent), with the honest caveat that muster's blob interest is
design-SURVEY not a committed app. `supportsPostTask` (0 in-repo callers) is
WIRE-or-DROP. The overfitting audit at close tallies PROPS not just components —
the dock proved prop-accretion hides under component-legitimacy. FALSIFIABLE: the
overfitting audit returns zero orphans; every new prop names ≥2 consumers.

### P4 — green-means-green (inv-27; CONSTELLATION §2.4)

> "Every 'done' cites that repo's own green CI run id covering every job. No
> cross-repo green claim."

This is the precept AT's half-driven state most stresses. The dock commits landed
on PR #1; the new tranche cannot inherit "the dock is done" from a campaign
record — it re-verifies on glass-ui's OWN green CI. The publish leg (3.3.0:
`changeset version` → tag → `release.yml`) is USER-DOMAIN, confirm-first —
identical to A/B/AS, and the AS.FINAL precept reinforcement binds: agents/
sub-drivers NEVER run an irreversible release step (`npm publish`, push of a
release tag, `gh release/workflow` dispatch — the boundary is irreversibility).
FALSIFIABLE: every wave close cites a green run id; no wave closes on a
campaign-record or a narration.

### P5 — inv-θ green-means-green for the GATE FLEET (AS.FINAL headline)

AS made the gate fleet a pure, sibling-portable function of source + tooling: one
`scripts/constellation.mjs` membership list, one `scripts/gates.mjs` manifest
tagged `{local,ci,release,sibling}` from which `proof:all` / the ci.yml matrix /
`release.{sh,yml}` are FILTERS (local == ci == release, structurally), and gate
output routes to a gitignored `.cache/gates/` so a gate run leaves `git status`
clean. EVERY new gate the tranche adds (`proof:webgl-substrate-single`,
`proof:webgl-golden`, `proof:color-acyclic`, `proof:single-color-core`,
`proof:blob-value-free`, `proof:peer-optional`, `proof:vueuse-free-root`,
`proof:strict-templates`, `proof:dock-motion-parity`, `proof:doc-consistency`,
`proof:font-axes`) is registered in `gates.mjs` with its tag, NOT hand-listed in
ci.yml — `gates:verify-ci` fails closed on drift. FALSIFIABLE: `git status` clean
after `proof:all`; `gates:verify-ci` green.

### P6 — fail-closed-green gates (no forbidden hard-gate forms)

Every gate is read against an artefact — build/lint/test output, a deletion
proof, a generated-code diff, an explicit doc reconciliation. The forbidden forms
are named: "API exists"; "grep found a source string for runtime behaviour";
"consumer will be wired later"; a silent `console.warn` + return in
library-owned code. The two-tier idiom is the house pattern: a SOURCE-graph gate
(comment-stripped transitive import walker) BENEATH a DIST-floor gate
(built-artifact grep). FALSIFIABLE: each RED gate (`proof:peer-optional`,
`proof:vueuse-free-root` are RED at HEAD) reddens on a deliberate inject and
greens only after the born-green fix lands BEFORE the gate.

### P7 — The dock-vocabulary convergence (the `<Role>Dock` precept)

The keyframes-authored, fourier-routed convergence (`glass-ui-dock-convergence.md`):
ONE role vocabulary (`ChromeDock`/`TransportDock`/`CanvasDock`/`ToolDock`),
documented ONCE in glass-ui's dock README (the source of truth), so a new
consumer picks a role rather than inventing a name; and ONE canonical `useDock*`
name per folded composable (`useDockPopupMutex`, `useDockPlacement`,
`useDockTouchGate`, …) so no consumer re-invents it. The convergence is FINISHED
when `grep -r "useExclusiveSelect\|usePopupMutex\|useDockLayers"` across the
constellation returns 0. **glass-ui owns the docs-convention half + the base
renames** (`useTouchGate→useDockTouchGate` co-located + aliased,
`DockTabButton` retire); the consumer renames are each consumer's arm (inv-16).
This is GENUINELY ABSENT at HEAD and is the new tranche's dock-docs deliverable —
see §2 ASK-7.

### inv-AT-color (the color answer the new tranche INHERITS as settled)

Tier-scoped: ONE runtime-JS color source (value.js, via the `/color` leaf); the
CSS token tier STAYS native (GUARDED against a future "finish the consolidation"
— compiling tokens through value.js would regress `light-dark()` re-resolution +
the token-first override precept + payload); the GLSL tier mirrors value.js on
the GPU; the published graph is a DAG because value.js's PUBLISHED lib never
imports glass-ui (the coupling is dev-only, REFUTED at HEAD). "One core" binds the
MATH SOURCE, not the return space — the leaf ships BOTH `oklchToLinear` (aurora's
bake) and `oklchToGammaRgb` (the blob seam's gamma exit, DEC-AT-7), both
value.js-backed; forcing one return space re-introduces the darkening defect.
This is a CLOSED design question — the new tranche executes the `/color` leaf, it
does not re-litigate the answer.

---

## §2 — The user's standing asks for glass-ui across the constellation (with STATUS)

Every cross-repo ask that names glass-ui, reconciled against HEAD `8e4cb9f` + the
sibling artefacts. Status vocabulary: SHIPPED (verified at HEAD/published) ·
DONE-IN-AT-RUN (landed on the half-driven dock arm) · OPEN-IN-NEW-TRANCHE (the
fold target) · BOOK-3.3.0 (self-booked, in this tranche) · BOOK-FORWARD (gated,
not this tranche) · KILLED.

| Ask | Origin | What glass-ui owes | Status |
|---|---|---|---|
| **ASK-1 dock-vt-name** (useId VT-name) | fourier J-postimpl A4; `glass-ui-dock-vt-name` row | `GlassDock` mints `glass-dock-${useId()}` so co-mounted docks don't collide | **SHIPPED 3.1.1** (`GlassDock.vue:144`, `DockLayerGroup.vue:69`; `proof:vt-names` makes the collision class structurally impossible). Present in 3.2.0. KILL the W6 console-filter bridge (born-legacy). |
| **ASK-2 VAL-9 `--spring-*` codegen** | value.js A→J chronic; `regen-spring-tokens.mjs` | the `spring()→LinearStop[]` emitter as a glass-ui home | **KILLED** (W0-L4 #42, terminal). keyframes OWNS the emitter privately; glass-ui's `--spring-*` REGENERATE via `regen-spring-tokens.mjs`. Lifting it adds a 3rd home — NO glass-ui lever. Do NOT re-open. |
| **ASK-3 a11y LabeledField** (`inert` on collapsed body) | fourier H.W1 e2e a11y keystones; `glass-ui-a11y` row | `inert` on the collapsed `ConfiguratorLayer` body (was `aria-hidden=true` + focusable children — axe `aria-hidden-focus` serious) | **SHIPPED 3.1.1** (`ConfiguratorLayer.vue:144` `:inert="!internalOpen \|\| undefined"`). The DDR `LabeledField` for/id binding (W0-L4 #22) is a SEPARATE, distinct a11y-verify BOOK — needs speedtest's specific failing site; the lighthouse A11y=100 SCORE binds when this is verified. **OPEN-IN-NEW-TRANCHE** (verify-or-book). |
| **ASK-4 asideSide (A-3)** | fourier control-pane audit; DEC-2 keystone | a `Configurator asideSide` prop (controls-LEFT) with no DOM reorder | **SHIPPED 3.2.0** (`Configurator.vue:85/101/162` + `asideWidth`/`scrollMode`/`density`). fourier consumes `aside-side="left"`. |
| **ASK-5 P5 inner-rounding** | fourier J→AS chronic | round the inner `ConfiguratorLayer` section dividers | **KILLED-AS-PHANTOM** (W0-L4 #5; user-ruled outer-only; `779fed7` reverted per-section radius as geometrically inert + divider-deforming; AS.FINAL:113-118 names fourier's ledger a misdiagnosis). NEVER re-book. |
| **ASK-6 VT-parity dock spring** (the dock-animation convergence headline) | keyframes C animation audit + AT.W1b-dock §W6-dock-c (independently reached) | `--dock-resize-spring: var(--spring-snappy)`, both VT + FLIP paths consume it; `proof:dock-motion-parity` | **DONE-IN-AT-RUN** (`e906448`, AT.W6-dock-c; `--vt-ease` retired; `morphGeneration` concurrency fix). Re-verify on glass-ui's OWN green CI (inv-27) — it landed on PR #1, not yet on a tranche-gated close. |
| **ASK-7 `<Role>Dock` vocabulary + dock-docs convention** | keyframes `glass-ui-dock-convergence.md` | the role-vocabulary docs note (ONE source of truth) + `useTouchGate→useDockTouchGate` rename+alias + `DockTabButton` retire + the canonical `useDock*` names | **OPEN-IN-NEW-TRANCHE.** Genuinely absent at HEAD. The glass-ui-owned half of the convergence. The base renames are clean-break-with-one-minor-alias (P1-bounded). |
| **ASK-8 touch-gate double-tap** | keyframes field report (`project_dock_doubleclick.md`); dock-convergence WAVE-1 residual | the collapsed-dock single-tap → expand+activate contract, fixed at the glass-ui root | **DONE-IN-AT-RUN** (`f0b0ffb`, shape B′). RESOLVED BY INSTRUMENT — the behavioural test REPRODUCED the double-tap (keyframes' field report was RIGHT; the AT audit's "no shipped bug" verdict was WRONG). Root cause: `preventDefault` on the activating tap swallowed the native tap→click. **Caveat for the new tranche: this commit re-used the `W6-dock-b` slot ID that the PLAN assigns to the a11y/state-machine contract test — see §0 (consequence 1) + §3 (item 1).** |
| **A-1 inter-row divider opt-in** | fourier control-pane audit | the `.instrument-rail` twin-line machined groove as a `Configurator` chassis opt-in | **BOOK-3.3.0** (glass-ui SELF-booked, `AS/FINAL.md:146-152`; genuinely absent at 3.2.0). The new tranche carries it (`index.css` is at 99.5% — a conscious budget rebase is the precondition). |
| **A-2 label/sub → ladder token** | fourier control-pane audit | bind `ConfiguratorLayer` `label`/`sub` typography to the glass-ui ladder at the component root (today magic literals `text-sm font-semibold`) | **BOOK-3.3.0** (glass-ui SELF-booked, `AS/FINAL.md:153-155`). Flag: restyles EVERY configurator label across all consumers → needs visual verification. |
| **Fraunces `@font-face` ship** | grand-audit / AS W0b; W0-L4 #7 | the slipped Plus-Jakarta-pattern `@font-face` for Fraunces (opsz+SOFT+WONK); `typography.css:150` WONK/SOFT axes are SILENTLY INERT today | **OPEN-IN-NEW-TRANCHE** (≥2 MET: words + value.js). Gate `proof:font-axes` (every axis `typography.css` references is carried by a shipped face). |
| **Drawer `:native` / `GlassNativeDrawer`** | muster + speedtest (≥2 FIRM); W0-L4 #8 | the `/native-drawer` subpath retiring the vaul-vue `activeSnapPoint` re-snap bug | **OPEN-IN-NEW-TRANCHE** (the strongest non-headline ≥2; lean fold). |
| **value.js K.W3 blob consumer rewrite** | AT cross-repo perimeter | nothing — value.js deletes its demo blob impls + imports the published `/goo-blob`+`/watercolor-dot` + supplies its OWN `ColorResolver` | **BOOK-FORWARD** (value.js's arm, inv-16; BLOCKED until the 3.3.0 publish). |

---

## §3 — Where AT took a shortcut the new tranche MUST transpose properly (no workarounds)

The mandate forbids quick solutions/workarounds. These are the places the
half-driven AT run, or the AT plan's own framing, left a shortcut the new tranche
must close with an idiomatic, gestalt fix — not paper over.

1. **The `W6-dock-b` slot-ID collision (§0 consequence 1 + §3 item 1) — a
   documentation-integrity shortcut.** The campaign re-used a planned slot ID for a
   different deliverable.
   The TRANSPOSITION: re-letter the dock waves under the new tranche's own
   numbering, record the touch-gate B′ as SHIPPED (it is — `f0b0ffb`), and author
   the a11y + state-machine contract test (the ORIGINAL `W6-dock-b`) under a fresh
   ID. Do NOT inherit the collision; do NOT silently drop the un-shipped a11y
   contract because its slot ID "looks taken."

2. **The dock is hardened MOTION-first, STRUCTURE-last — backwards from the
   plan's own ordering.** AT.W1b-dock §3 is explicit: `proof:strict-templates`
   (W6-dock-a) "Lands first so the W6/W7 clean breaks are safe" — it makes
   `<GlassDock bogus-prop>` a RED typecheck, closing the silent-no-op class
   library-wide. But the campaign landed the MOTION + overflow + token slices
   (W6-dock-c, W7-dock-a/b/c) WITHOUT the strict-templates keystone first. The
   clean breaks shipped UNGUARDED by the very gate designed to protect them. The
   TRANSPOSITION: land `proof:strict-templates` FIRST in the new tranche (its
   correct altitude — `checkUnknownProps:true` across all three tsconfigs, NOT a
   point-spec dock-prop guard), then RE-VERIFY the already-landed clean breaks
   typecheck-green under it. The booked point-spec binding-guard is SUPERSEDED by
   the library-wide one — do not ship the narrow version.

3. **The reka-ui `Tabs` rail is the idiomatic fix the campaign deferred.** The
   a11y contract (rail = `role="tablist"`, `role="tab"` + `aria-selected` NOT
   `aria-pressed`, `aria-controls`→`role="tabpanel"`, roving tabindex) is
   PRESCRIBED as "adopt reka-ui `TabsRoot/List/Trigger/Content`" (DEC-AT-9 +
   §2 rail-role resolution) — APG-Tabs canon, free roving tabindex, "no fourth
   boilerplate copy." The shortcut would be hand-rolling the ARIA on the existing
   rail. The TRANSPOSITION: adopt the reka-ui primitive (matches the dock's
   existing reka-ui idiom), with the travelling rail-indicator layered on top —
   the atomic `GlassDock.vue`/`DockLayerGroup.vue` edit set the plan reserves for
   ONE pass (§3, to avoid double-touch). This is UNEXECUTED — the new tranche owns it.

4. **`peerDependenciesMeta` is a dead-field shortcut at HEAD (RED gate).** The
   `optionalPeerDependencies` field is non-standard — NPM reads it as nothing — so
   every peer (value.js/keyframes/embla/tw-animate) is silently REQUIRED, and
   `CLAUDE.md:364` is false. The shortcut would be to write the gate and leave the
   field. The TRANSPOSITION (C6 must-fix #3, binding): FIX the field shape
   (`peerDependenciesMeta[x].optional`) BEFORE the gate, then `proof:peer-optional`
   asserts the derived fact (a peer is `optional:true` IFF its literal is absent
   from `dist/glass-ui.js`).

5. **The DataTable vueuse leak — the gate-gap is the real debt, not the leak.**
   `index.ts:104`→`DataTable.vue:3 useElementSize` reaches a vueuse symbol through
   the SOURCE root barrel (RED `proof:vueuse-free-root`). The build-split mitigates
   the bundle case, so the shortcut would be "it's mitigated, skip it." The
   TRANSPOSITION: swap to an in-house `useResizeObserver` (born-green) — the ONE
   hard W6 ordering edge (the swap MUST precede the gate going green) — AND add the
   static-import-graph gate that was MISSING (the actual debt). No `@vueuse/core`
   reachability from `dist/glass-ui.js`.

6. **The blob color-space seam (DEC-AT-7) is the implicit-default trap the plan
   names as the #1 must-fix.** Left implicit, the blob ships visibly too-dark
   (linear default, no OETF) AND the perceptual-uniformity claim voids. The
   shortcut is "let the shader default the space." The TRANSPOSITION: NAME the seam
   — GAMMA at W4 (the faithful lift, HSV needed no OETF), LINEAR at W5 (flip
   `uBaseColor` to linear AND add the mandatory `linearToSrgb()` output stage as
   D1's own gated change) — and each wave's gate asserts THAT wave's declared
   space. This is a contract, not a default.

7. **The matrix-source trap (DEC-AT-10).** Hardcode value.js's EXACT Ottosson
   constants (transposed for GLSL column-major), NOT the GM-Shaders/LYGIA
   convenience matrices (~1e-4 off — they would red-flag the 1e-6 CPU-equivalence
   gate on a non-bug). The shortcut is the convenient matrix; the transposition is
   the exact one, witnessed by the 8-assertion CPU-equivalence over the textually-
   parallel TS port (asymmetric witness `#3a7bd5` so transpose/source errors diverge).

8. **The dirty `docs/precepts` submodule is a USER-DOMAIN boundary, not a thing to
   fix in-flight.** HEAD carries ` m docs/precepts`. The shortcut is to bump or
   commit it inside the new tranche. The CORRECT path (W0-L4 #44, inv-16′): the
   submodule is in-flight precepts-authored content — forbidden to touch while
   dirty. The new tranche must NOT touch it; the precepts owner reconciles on the
   precepts repo's own clean flow, then the glass-ui pin advances. (The AS.FINAL
   "agents NEVER run irreversible release steps" precept reinforcement is authored
   there too.)

---

## §4 — inv-16 attestation

This recap is authored under `HUB/docs/constellation/tri-tranche-run/glass-ui-next/`
(fourier owns `docs/constellation/`). It edits NO glass-ui source, NO sibling
tree, NO host state, NO code. Every glass-ui fact cites glass-ui's own committed
artefact (file:line / commit SHA / FINAL.md), read-only at HEAD `8e4cb9f`. The
new tranche it predicates is glass-ui-internal — every cross-repo item is
NAME-FORWARD; glass-ui writes only glass-ui. The glass-ui/slides session executes
the tranche on glass-ui's own clean checkout, gated on glass-ui's own green CI
(inv-27); the 3.3.0 publish leg is user-domain, confirm-first.
