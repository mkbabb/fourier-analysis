# glass-ui Tranche AU — CHARTER

The canonical next glass-ui tranche letter is **AU** (`docs/tranches/` holds
`… AR, AS, AT`; no `AU/` exists at HEAD `8e4cb9f`; AT carries no `FINAL.md` and
its `PROGRESS.md` still reads PLANNED for W2-W8). This is the spec the
glass-ui/slides session formalizes into `glass-ui/docs/tranches/AU/` as its W0 —
the AT-residual fold authored as binding waves, NOT an implementation phase. AU
closes AT in totality and drives glass-ui to its **3.3.0** publish, the
constellation's root dependency.

Authored under inv-16 (fourier owns `docs/constellation/`): this CHARTER edits no
glass-ui source, no sibling tree. Every glass-ui fact cites glass-ui's own
committed artefact, read-only at HEAD `8e4cb9f`. The four audit siblings are the
binding substrate — `audit/{at-state,deferred-lineage,precept-prompt-recap,
slides-coupling}.md`; AU inherits the W0b SOTA reads and the C-synthesis whole
(no re-audit of the SOTA is owed).

---

## §1 — Thesis

**Complete AT in totality.** AT was authored as a 10-wave plan across three
braided headlines and executed exactly ONE slice — the dock convergence (three
commits, `e906448`/`f0b0ffb`/`8e4cb9f`). The blob/aurora/WebGL/color
transposition (W2-W5), the AS-residual correctness fold (W6 non-dock), the
slipped Fraunces ship (W7), and the close (W8) never left the spec. AU executes
that authored-but-unrun mass, folds the deferred lineage whose triggers have
since fired, lands the slides-F-blocking + 3.3.0-publish priority items first,
and ships the 3.3.0 publish that unblocks the constellation.

AU is built on the user's standing directive — **architectural transposition for
elegance, simplicity, performance is necessary + desirable; no workarounds, no
legacy.** The three AT transpositions carry IN FULL:

1. **ONE `useWebGLCanvas` substrate** — aurora + goo-blob share it; the
   zero-consumer `frostShader.ts` orphan is DELETED (present at HEAD,
   `src/composables/glass/webgl/frostShader.ts`). The off-screen-pause gate is
   PRESENT, not missing — aurora already composes `useIntersectionPause` as the
   single owner of off-screen pause (`useAurora.ts:246`); the substrate WIRES that
   existing gate (inherits aurora's consumer). Only the `webglcontextrestored`
   handler is genuinely absent (`grep -rn webglcontextrestored src/components/custom/aurora/
   = 0`) and is absorbed strictly-additively. The substrate must NOT bake aurora's
   quad/attrs/DPR — a consumer-#2 usability assert co-gates it (W0b-C6 must-fix #4),
   or the extraction is a disguised copy.
2. **The injected `ColorResolver` seam** — replaces the demo's DOM-coupled
   1×1-canvas `cssColorToRgb` probe; THROWS by name (`defaultBlobColorResolver`)
   on a no-resolver mount (the loud failure, not a silent gray default).
3. **The OKLCh shader transposition** — the W5 shader-quality wave on the W4
   GAMMA shader, carrying the DEC-AT-7 color-space seam (§5 below).

The two non-dock correctness debts (`peerDependenciesMeta`, the DataTable
`@vueuse` root leak) are CHRONIC — RED at HEAD, survived AS → AT — and are AU's
first non-headline wave. NO item is re-litigated; UNBUILT specs fold forward
as-authored.

---

## §2 — Context (post-AT landed state)

HEAD `8e4cb9f`, branch `at-dock-convergence`, version **3.2.0** (unpublished
delta). What AT landed (FACT, not plan):

- **The dock convergence — PARTIAL.** VT/FLIP timing-parity (`e906448`,
  `--dock-resize-spring`, `proof:dock-motion-parity`); the touch-gate B′
  double-tap fix (`f0b0ffb`, unplanned deviation, inv-ε — keyframes' field report
  was RIGHT, the W0b "no shipped bug" verdict was WRONG); the overflow clean break
  + token design refinements + `proof:doc-consistency` (`8e4cb9f`).
- **A slot-ID collision in the record.** The commit `f0b0ffb` re-labeled
  `W6-dock-b` (the PLAN's a11y + state-machine contract test) as the touch-gate
  B′. Two deliverables share one slot ID; the a11y contract did NOT land. AU
  re-letters under its own numbering — it does NOT inherit the collision.
- **The keystone never landed.** `proof:strict-templates` (W6-dock-a) was
  specified to "land FIRST so the clean breaks typecheck-fail" — it did not. The
  W6/W7 clean breaks shipped UNGUARDED by the very gate designed to protect them.
- **Everything else is UNBUILT** — verified ABSENT at HEAD: no `/goo-blob`, no
  `/watercolor-dot`, no `useWebGLCanvas` substrate, no `/color` leaf,
  `frostShader.ts` still present, `package.json:559 "optionalPeerDependencies"`
  still the dead field, `DataTable.vue:3 useElementSize` still leaking,
  `typography.css` carries ZERO Fraunces `@font-face` (the `tokens.css:43`
  display token is dangling — WONK/SOFT axes silently inert).

The submodule is in-flight (` m docs/precepts`) — USER-DOMAIN, forbidden to
touch (§4, inv-16′). AU re-grounds against this HEAD; the three landed dock
commits are facts to re-verify on glass-ui's own green CI (inv-27), not inherited
from a campaign record.

---

## §3 — The wave table (the path forward)

Folds AT's unbuilt waves + the deferred lineage (`deferred-lineage.md §9`) + the
slides-F priority items (`slides-coupling.md §1`) into ordered waves. The
slides-F-blocking + 3.3.0-publish items land FIRST. Each wave names a falsifiable
HARD gate. W0 (the formalization) and the design waves are DEV; the IMPL waves
RUN only on explicit user authorization (AT's own format, carried).

| Wave | Headline | Type | HARD gate (falsifiable) |
|---|---|---|---|
| **AU.W0** | Formalize this CHARTER into `tranches/AU/`; re-ground against `8e4cb9f` (the three dock commits as FACT); re-letter the slot-ID collision; decompose the un-auditable "3 a11y asks" bundle (`deferred-lineage #29`) against speedtest's audit; bind zero-deferral at open (P-Inv 28) | DEV | `AU.md` + `PROGRESS.md` exist; every folded item carries a disposition; the `W6-dock-b` collision re-lettered with the touch-gate recorded SHIPPED + the a11y contract assigned a fresh ID |
| **AU.W1** | Design slices — re-issue AT.W1's blob-primitives / dock / color-gates design as-authored against HEAD (no re-audit; the W0b SOTA + C-synthesis bind) | DEV (boundary) | the three design files exist; each cites its AT.W1 origin + its HEAD delta |
| **AU.W2** | **The dock opacity-lockstep fold [slides-F P0 HEADLINE].** Swap `.dock-layer{,-item-host}` opacity from `--dock-motion-fast` (0.2s) to `--dock-motion-resize` (0.3s); extend the matched `visibility` delay; file-disjoint from blob/WebGL/color | IMPL | a playwright timing probe (NOT a screenshot): dock items + container settle within ONE frame of each other; reddens on a re-injected desync |
| **AU.W3** | **The keystone + the correctness fold [3.3.0-publish-blocking].** `proof:strict-templates` FIRST (`checkUnknownProps:true` across all three tsconfigs — library-wide, NOT a point-spec dock guard; supersedes the booked narrow version), then RE-VERIFY the already-landed clean breaks typecheck-green under it. Then: `peerDependenciesMeta` field-shape fix + `proof:peer-optional`; DataTable `useElementSize`→in-house `useResizeObserver` (the ONE hard ordering edge — the swap precedes the gate green) + `proof:vueuse-free-root`; `supportsPostTask` WIRED into the `usePrioritizedTask` guard (or dropped); the keyframes `[2.2.0,3.0.0]` peer-matrix `proof:package` axis | IMPL | `proof:strict-templates` green + `<GlassDock bogus-prop>` is a RED typecheck; `proof:peer-optional` (peer optional IFF its literal absent from `dist/glass-ui.js`) green; `proof:vueuse-free-root` (no `@vueuse/core` reachable from `dist/glass-ui.js`) green; both born-RED gates redden on a deliberate inject |
| **AU.W4** | **Fraunces `@font-face` ship + `proof:font-axes` [slipped, lowest-risk highest-impact].** Mirror the Plus-Jakarta self-host pattern; ship the opsz+SOFT+WONK woff2; retire the dangling display token's inert axes | IMPL | `proof:font-axes`: every axis `typography.css` references is carried by a shipped `@font-face`; the WONK/SOFT axes are no longer silently inert |
| **AU.W5** | **`/color` runtime-JS leaf** (DEC-AT-7) — hoist `oklchToLinear` (aurora's bake) + `oklchToGammaRgb` (the blob's gamma exit), both value.js-backed; CSS token tier STAYS native (guarded) | IMPL | `proof:color-acyclic` + `proof:single-color-core` green; the published graph is a DAG (value.js's published lib never imports glass-ui) |
| **AU.W6** | **`useWebGLCanvas` substrate + aurora refactor** (DEC-AT-1) — extract the shared substrate; refactor aurora onto it; DELETE `frostShader.ts` (P1); absorb the genuinely-missing `webglcontextrestored` handler + carry forward aurora's existing `useIntersectionPause` off-screen gate | IMPL | `proof:webgl-substrate-single` (pixel AND scheduling parity) green; consumer-#2-usability assert (substrate does NOT bake aurora's quad/DPR); `proof:frostShader-deleted` = `test ! -f src/composables/glass/webgl/frostShader.ts` AND no module resolves `glass/webgl/frostShader` (a name-grep `rg frostShader src/ = 0` is born-GREEN at HEAD — the orphan body cites the literal zero times, nothing imports it — so the grep-of-name form is REJECTED for this gate) |
| **AU.W7** | **The blob trio [the user-ruled headline].** `/watercolor-dot` (CSS/SVG + internalized filter + `prng` leaf); `/goo-blob` (the GAMMA metaball shader on W6's substrate) + the `ColorResolver` seam + demo story #2; the W5 shader-quality wave (fwidth AA · Quilez quadratic smin · rotated-octave FBM · OKLCh linear-flip + `linearToSrgb` OETF · exact Ottosson matrices · radians · hue-preserving gamut) | IMPL (headline) | `proof:blob-value-free` (two-tier: source-graph + dist; throw names `defaultBlobColorResolver`) green; `proof:webgl-golden` (zero-perturb identity); the 8-assertion CPU-equivalence over the TS port (1e-6, asymmetric witness `#3a7bd5`); ≥2 by value.js + the demo story |
| **AU.W8** | **The AU dock-design headline** (the C5-named successor; prerequisite LANDED) — `proof:strict-templates`-guarded reka-ui `Tabs` rail (`TabsRoot/List/Trigger/Content`, APG-Tabs canon, roving tabindex, `aria-selected` NOT `aria-pressed`) + the travelling rail-indicator (per-button bg retired) + the dock a11y + state-machine contract test (the ORIGINAL `W6-dock-b`, under its fresh ID) + spring-fidelity unification; ONE atomic `GlassDock.vue`/`DockLayerGroup.vue` edit (no double-touch) | IMPL | the dock a11y/state contract test green (tablist/tab/aria-selected, roving tabindex, focus-visible, keep-open); the rail-aria break is AU's own minor-fix version call, kept out of the additive surface |
| **AU.W9** | **The control-pane + dark-ergonomics + lean folds.** A-1 `ConfiguratorLayer` inter-row divider-rule opt-in + A-2 label/sub → `text-title`/`text-heading` ladder (both glass-ui-self-booked to 3.3.0); `useGlobalDark({ initialValue })` + the FOUC parse-time `darkModeSyncScript()` primitive (the dark-ergonomics pair); the control-size vocabulary (Button `icon-sm` + `Select size` together, IFF the coherent size-prop wave opens — else BOOK); Drawer `:native`/`/native-drawer` (the strongest non-headline ≥2 — muster + speedtest — IFF scope admits a 2nd substrate wave, else BOOK with the named trigger) | IMPL | each folded item names ≥2 consumers; A-2 visually verified (it restyles every configurator label); the size-prop wave's ≥2 is cross-control coherence + the public-CVA escape |
| **AU.W10** | **Close** — the overfitting audit (PROPS, not just components — the dock proved prop-accretion hides under component-legitimacy); the gates matrix (every new gate registered in `gates.mjs` with its tag, `gates:verify-ci` green); `AU.FINAL` + the `inv-AT-color` close record; the 3.3.0 changeset; drive to the publish | IMPL (LAST) | the overfitting audit returns zero orphans; `git status` clean after `proof:all`; `gates:verify-ci` green; `FINAL.md` cites a green run id per wave; the 3.3.0 changeset staged |

**Cross-repo (inv-16) — name-forward only.** value.js K.W3 (delete the demo blob
impls, import the published `/goo-blob` + `/watercolor-dot`, supply its own
`ColorResolver`) is BLOCKED until AU publishes 3.3.0. No glass-ui write is owed —
the publish is the unlock.

**BOOK (carried, not folded — trigger named):** dock magnification
(`useDockMagnify`, 0 firm consumers), expand-stagger, pane-VT directional slide,
`overflow:"clip"` member, typed dock `tier?` prop, `DockSelectTrigger clampLabel`,
`TooltipContent variant="mono"`, MetricBadge icon slot, `useRAFLoop demandPark`,
`--spring-crisp`, the inline-edit primitive (convergence-gated, depth ~6), the CSS
levers (`@scope`/`@function`/`interestfor`/`interpolate-size`/relative-color), the
platform-Baseline-gated pilots (GlassDialogNative, HoverPopover `:native`,
GlassNativeSelect). Per `deferred-lineage §9`.

**KILL (do NOT resurrect):** P5 inner-rounding (user-ruled outer-only), the 4
shipped-DDR rows, shadcn-parity (REJECT — overfitting class), VAL-9, P7, the
shared in-shader OKLab path (correctly different shaders — the shared primitive is
the GLSL fn pair, the `/color` leaf, NOT the shader), OffscreenCanvas+Worker /
WebGPU aurora (SOTA-confirmed wrong / pre-refuted).

---

## §4 — Invariants

AU continues glass-ui's canonical precepts (`precept-prompt-recap §1`) verbatim as
HARD gates, not sentiments:

- **inv P1 — no legacy code.** Every clean break carries NO alias. `frostShader.ts`
  is DELETED (not deprecated — `proof:frostShader-deleted` asserts file-absence +
  an import-graph check, NOT a name-grep, which is born-GREEN at HEAD); the
  1×1-canvas probe is DELETED (replaced by the throwing `ColorResolver`); any
  retired symbol greps to 0 outside its deletion commit. The AT overflow collapse
  already modeled this (`rg "\.dock-wrap\b" = 0`).
- **inv P2 — architectural transposition desirable.** Each of the three
  transpositions (§1) is net-deletion-or-neutral at its core, proved by a
  before/after LOC + a ≥2-consumer assert. NO workaround substitutes for a
  transposition; the substrate must not bake consumer-#1's choices.
- **inv P3 — substrate with consumer; wire before retire.** The ≥2-DISTINCT-
  consumer-CONTEXT bar (J-inv-10: convergence, not census) gates every new public
  surface. The blob headline ships on value.js + the demo story — muster's blob
  interest is design-SURVEY, NOT a committed app; do NOT claim it as a firm 2nd.
  `supportsPostTask` is WIRE-or-DROP. The overfitting audit tallies PROPS.
- **inv-27 — green-means-green (the binding inv this CHARTER underscores).** Every
  "done" cites glass-ui's OWN green CI run id covering every job. AU cannot inherit
  "the dock is done" from the convergence campaign record — it RE-VERIFIES the
  three landed dock commits on a tranche-gated close. No wave closes on a
  campaign-record or a narration.
- **inv-θ — green-means-green for the GATE FLEET.** Every new gate the AU waves
  define — `proof:dock-opacity-lockstep` (W2), `proof:strict-templates` ·
  `proof:peer-optional` · `proof:vueuse-free-root` · `proof:supportsPostTask-wired`
  (W3), `proof:font-axes` (W4), `proof:color-acyclic` · `proof:single-color-core`
  (W5), `proof:webgl-substrate-single` · `proof:webgl-golden` ·
  `proof:frostShader-deleted` (W6), `proof:blob-value-free` · `proof:no-value-default`
  · `proof:blob-color-equivalence` · `proof:blob-space-gamma` (W7),
  `proof:dock-a11y-contract` · `proof:dock-vocabulary` (W8), `proof:au-w9-consumers`
  (W9), plus the DEV meta-gates (`au-w0-reground`, `au-w1-design`, `au-final`) — is
  registered in `gates.mjs` with its `{local,ci,release,sibling}` tag, NOT
  hand-listed in ci.yml. The canonical complete fleet is the AU.W10 §Scope-2 matrix.
  `git status` clean after `proof:all`; `gates:verify-ci` fails closed on drift.
- **inv P6 — fail-closed-green gates.** No forbidden hard-gate form ("API exists";
  "grep found a source string for runtime behaviour"; "consumer wired later"; a
  silent `console.warn` + return in library code). The two-tier idiom is house: a
  SOURCE-graph gate beneath a DIST-floor gate. Each born-RED gate reddens on a
  deliberate inject, greens only after the born-green fix lands BEFORE the gate.
- **inv-AT-color — SETTLED, not re-litigated.** Tier-scoped: ONE runtime-JS color
  source (value.js, via the `/color` leaf); the CSS token tier STAYS native
  (guarded against a future "finish the consolidation"); the GLSL tier mirrors
  value.js on the GPU; the published graph is a DAG. "One core" binds the MATH
  SOURCE, not the return space. AU EXECUTES the leaf; it does not re-decide the
  answer.
- **inv-ε — resolve by instrument.** AT's touch-gate proved the lesson: a
  behavioural mounted-dock test, not a prose a11y assertion. AU's dock a11y
  contract (AU.W8) is a behavioural vitest, not a narrated claim.
- **The dock vocabulary (the `<Role>Dock` precept).** ONE role vocabulary
  (`ChromeDock`/`TransportDock`/`CanvasDock`/`ToolDock`) documented ONCE in
  glass-ui's dock README (the source of truth) + ONE canonical `useDock*` name per
  folded composable. glass-ui owns the docs-convention half + the base renames
  (`useTouchGate→useDockTouchGate` co-located + aliased; `DockTabButton` retire,
  0 consumers — the deletion surface is `src/components/custom/dock/DockTabButton.vue`,
  its export at `src/components/custom/dock/index.ts:5`, and the `dock.css:877/947`
  comment refs); consumer renames are each consumer's arm (inv-16). NOTE the honest
  caveat (`slides-coupling §1, §5 #1`): no `<Role>Dock` COMPONENT exists on-branch —
  the base IS `GlassDock` + `DockIconButton` + the `#collapsed` slot; a role-typed
  surface is a NET-NEW contract — ship the docs convention + the base renames,
  treat a role-typed component as BOOK until a 2nd consumer appears — the named
  candidate is keyframes D.W5, which adopts the AU.W8 role-vocabulary as local
  renames (`ChromeDock`/`TransportDock`) now and circles back to this wave only IF
  a role-typed base ships AND keyframes is its 2nd consumer (the reciprocal
  cross-session edge; otherwise the base stays BOOK). slides binds the same base
  (`GlassDock`+`DockIconButton`+`#collapsed`), no role-typed component.

**USER-DOMAIN boundaries (inv-16 / inv-16′):** the dirty `docs/precepts` submodule
is NOT touched in-flight — the precepts owner reconciles on the precepts repo's
clean flow, then the glass-ui pin advances. The 3.3.0 publish leg (`changeset
version` → tag → `release.yml`) is confirm-first; agents/sub-drivers NEVER run an
irreversible release step (`npm publish`, a release-tag push, `gh
release/workflow` dispatch — the boundary is irreversibility).

---

## §5 — The slides-F coupling + priority ordering

The glass-ui/slides session runs BOTH AU and slides-F. slides writes ZERO glass-ui
(inv-16); AU is the SUPPLY side of slides-F's `FG.W-*` demand. The coupling
(`slides-coupling.md`) sets AU's wave ordering:

- **The version hinge.** Four of slides-F's five glass-ui consumptions unlock only
  after AU **publishes a new minor** (the SemVer is AU's to own; F's narration says
  "3.3.0"). slides then bumps `^3.2.0 → ^<new>`. **The 3.3.0 publish is the central
  HINGE.** This is why the publish-blocking correctness fold (AU.W3) lands before
  the headline (AU.W5-W7).
- **The P0 headline — the dock opacity-lockstep fix (AU.W2 FIRST).** slides' "not
  iOS-smooth" report (V02) — the single most valuable glass-ui item for perceived
  quality. The VT-curve half SHIPPED (AT.W6-dock-c, `view-transition.css:61`); the
  **opacity-desync half is un-fixed on-branch** (`dock.css:418`/`:436` still
  `--dock-motion-fast` 0.2s while the container morphs at `--dock-motion-resize`
  0.3s — the 100ms-apart settle). This is AT-OWNED territory, file-disjoint from
  blob/WebGL/color — it ships in glass-ui's dock files; slides only bumps the pin.
  Gate: a playwright timing probe, items + container settle ≤1 frame.
- **The publish-gated consumptions (post-AU.W3 publish).** `FG.W-dialog`
  (`DialogContent showClose?: boolean = true`, retires slides' F-01 close-hide
  hack — MEDIUM clobber, DialogContent NOT co-edited with dock chrome);
  `FG.W-deck` (the `/deck` subpath lift — the 5th carry; AU resolves the
  ≥2-consumer gate decisively, ratify slides' `_fixture/` deck as #2 OR a glass-ui
  demo `<Deck>` story — do NOT carry a 6th time); `FG.W-card-badge` (Card
  `surface="cartoon"` dark-arm + Badge `variant="accent"`, each needs a confirmed
  #2). These are F-demand specs AU folds into AU.W9 / the close as the publish
  surface admits.
- **The one immediately-schedulable edge — `FG.W-motion`.** `useCountup` +
  `v-reveal`/`slideReveal` to `composables/motion/` — file-disjoint from the
  ENTIRE dock/blob/WebGL/color graph, the one F edge not pin-gated. Schedulable in
  any AU wave; #2 = a motion demo story.
- **The keyframes spring leg is a FROZEN contract.** slides consumes keyframes
  `springLinearStops` + `springTimingFunction` only (not `SpringProgress`); pin
  `^3.0.0`, no bump implied. The two spring-helper signatures are a frozen contract
  for the duration of this run — but that is keyframes' surface, NOT glass-ui's;
  AU owes nothing here, only the RUN-BOARD records it.

**The priority ordering (the path forward, ordered):** AU.W2 (P0 dock
opacity-lockstep) → AU.W3 (the keystone + correctness fold, publish-blocking) →
AU.W4 (Fraunces, lean + slipped) → AU.W5-W7 (the `/color` leaf → substrate →
blob headline) → AU.W8 (the dock-design headline) → AU.W9 (control-pane +
dark-ergonomics + lean folds) → AU.W10 (close + 3.3.0 publish). `FG.W-motion` is
schedulable in parallel at any point (AT-disjoint).

---

## §6 — The publish note (the constellation root)

**glass-ui 3.3.0 is the constellation's ROOT dependency — everyone consumes it, so
it publishes first.** The publish is the central hinge of the tri-tranche run:

- value.js K.W3 is BLOCKED until 3.3.0 ships the `/goo-blob` + `/watercolor-dot`
  subpaths (inv-16 name-forward — value.js's arm, not AU's write).
- slides-F's four publish-gated consumptions (`FG.W-dialog/-deck/-card-badge` +
  the pin bump) unlock only on the 3.3.0 npm publish — the slides-deploy edge
  depends on the glass-ui PUBLISH edge, not the branch state.
- The new tranche DRIVES TO the publish: AU.W3 (the correctness fold) is the
  publish-quality gate; AU.W10 stages the 3.3.0 changeset and drives to the
  green-CI close. The outward publish leg is USER-DOMAIN, confirm-first
  (identical to A/B/AS/C) — AU stages it; the publish owner finalizes the SemVer
  tier and runs the irreversible step.

The 3.3.0 publish is the one constellation unlock AU owns. Everything downstream —
value.js's blob rewrite, slides' four consumptions, the cascade-gui lockfile regen
— waits on it. AU's success condition is the green-CI 3.3.0 surface, staged for
the confirm-first publish.

---

## §7 — inv-16 attestation

This CHARTER is authored under
`HUB/docs/constellation/tri-tranche-run/glass-ui-next/` (fourier owns
`docs/constellation/`). It edits NO glass-ui source, NO sibling tree, NO host
state, NO code. Every glass-ui fact cites glass-ui's own committed artefact (the
four sibling audits, file:line, commit SHA), read-only at HEAD `8e4cb9f`. The
tranche it predicates is glass-ui-internal — every cross-repo item is
NAME-FORWARD; glass-ui writes only glass-ui. The glass-ui/slides session
formalizes this CHARTER into `glass-ui/docs/tranches/AU/` as its W0 and executes
AU on glass-ui's own clean checkout, gated on glass-ui's own green CI (inv-27);
the 3.3.0 publish leg is user-domain, confirm-first.
