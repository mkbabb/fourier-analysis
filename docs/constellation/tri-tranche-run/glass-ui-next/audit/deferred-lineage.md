# glass-ui-next · audit — the deferred + chronically-deferred lineage (the FOLD)

The terminal disposition for EVERY open glass-ui deferral the full A_-series
(AB..AT) + single-letter (C..V) lineage carries, swept against HEAD source
(3.2.0, `8e4cb9f`) by grep `file:line`, the AT plan (`AT/AT.md`,
`AT/audit/W0-L4` 47-row ledger, `W0b-C4`/`C5`), the AS deferred ledgers
(`AS/audit/W0-L4`, `W0b-L4`, `W6-postpublish-verify`), and the constellation hub
(`ADOPTION-ASKS.md §3-10`). This is the deferred-fold the mandate demanded — the
input the glass-ui-next waves draw their backlog from.

**The load-bearing lineage finding (the frame everything else sits on):** AT is
**mid-flight, NOT closed.** It has NO `FINAL.md`. Its dock-CORRECTNESS slices
LANDED (`e906448` W6-dock-c, `f0b0ffb` W6-dock-b, `8e4cb9f` W7-dock-a/b/c) but
its **entire blob/color/correctness/slipped-ship headline is UNRUN** — HEAD is
still 3.2.0, no `/goo-blob`, no `/color`, no `proof:vueuse-free-root`, no Fraunces
face. So glass-ui-next is NOT a fresh successor over a clean AT close — it is the
**execution of AT's authored-but-unrun W2-W8 specs PLUS the AU dock-design
successor AT's own C5 split named PLUS the BOOK backlog whose triggers have since
fired.** Every "AT-WAVE" item below is therefore OPEN unless a commit landed it.

## §0 — Disposition vocabulary + the age rule

- **FOLD** — folds + executes in glass-ui-next NOW (clears the ≥2-distinct-consumer
  bar, OR is correctness/hygiene, OR is the user-ruled headline). Authored-but-unrun
  AT specs whose gate is met land here.
- **BOOK** — named-forward with a CONCRETE graduation trigger (≥2-consumer
  convergence, Baseline-Widely, or a sibling-arm landing). glass-ui holds the lever
  but the gate is not met at HEAD.
- **KILL** — terminal; no glass-ui lever or ratified dead. Stop tracking.
- **OUT (USER-DOMAIN)** — cross-repo / submodule; glass-ui writes only glass-ui
  (inv-16). Recorded, not absorbed; the owning arm executes.

**Age** = distinct tranches deferred. **Chronic = age ≥2.** "≥2 distinct consumer
CONTEXTS" = ≥2 distinct repos/surfaces, NOT 2 call-sites in one demo (J inv 10 —
convergence, not census).

## §1 — HEAD-verified state of the AT-unrun headline (the OPEN block)

These AT-WAVE items were AUTHORED as binding specs but the IMPL waves never ran.
Verified ABSENT at HEAD — they are the first-class glass-ui-next backlog, not new
defers.

| # | Item | Spec origin | HEAD reality (cite) | Disposition |
|---|---|---|---|---|
| 1 | **goo-blob primitive** (`/goo-blob` + `useMetaballRenderer` + `metaball.{vert,frag}.glsl`) + the OKLCh GLSL color path | AT.W4 (the user-ruled headline); value.js A→F ask (5+, chronic) | NO blob components in `src/components/custom`; `package.json` exports have no `./goo-blob`; still value.js-demo-local | **FOLD** — glass-ui-next headline. New subpath + the inv-K-3 injected `ColorResolver` seam (no value.js default baked). Gate: `proof:blob-value-free` (two-tier source-graph + dist; throw names `defaultBlobColorResolver`) + ≥2 (value.js + demo story). |
| 2 | **watercolor-dot primitive** (`/watercolor-dot` + `useWatercolorBlob` + internalized SVG filter + `prng` leaf) | AT.W3; value.js A→F (5+, chronic) | absent; value.js-demo-local | **FOLD** — sibling of #1, shared injected-color seam, zero-wiring filter. Gate: identical to #1. |
| 3 | **`useWebGLCanvas` substrate** (aurora + goo-blob share; `frostShader.ts` deleted; off-screen-pause + context-restore absorbed) | AT.W2 (DEC-AT-1) | not extracted; aurora carries its own bootstrap; `frostShader.ts` still a zero-consumer orphan | **FOLD** — the transposition the lift forces. Gate: `proof:webgl-substrate-single` (pixel AND scheduling parity) + consumer-#2-usability assert (do NOT bake aurora's quad/DPR — W0b-C6 #4). |
| 4 | **`/color` runtime-JS leaf** (`oklchToLinear` + `oklchToGammaRgb`, both value.js-backed) | AT.W2 (DEC-AT-7, inv-AT-color) | runtime color ~95% on value.js already; the leaf is not hoisted; the GAMMA-exit helper does not exist | **FOLD** — gate: `proof:color-acyclic` + `proof:single-color-core`. CSS token tier STAYS native (the guard against a future audit wrongly "finishing the consolidation"). |
| 5 | **The shader-quality wave** (`fwidth` AA · Quilez quadratic `smin` · rotated-octave FBM · OKLCh linear-flip + mandatory `linearToSrgb()` OETF · exact Ottosson matrices · hue-preserving gamut) | AT.W5 (DEC-AT-8/10) | n/a (no blob shader at HEAD) | **FOLD** — rides #1. The OETF correctness bug is the headline: left implicit the blob ships visibly too-dark AND the perceptual-uniformity claim voids. Gate: 8-assertion CPU-equivalence over a TS port + `proof:webgl-golden` zero-perturb identity. |
| 6 | **DataTable vueuse root-barrel leak** (Design-Axis-6) | AS.W6 HEAD finding ("AT, not 3.2.1"); AT.W6 | OPEN — `src/index.ts:104 export * from "./components/ui/data-table"` + `DataTable.vue:3 import { useElementSize } from "@vueuse/core"`. Pre-existing since v1.8.x; no gate enforces vueuse-free-root | **FOLD** — swap `useElementSize`→in-house `useResizeObserver` (the ONE hard ordering edge) + add `proof:vueuse-free-root` (the real debt is the absent gate; the leak is build-split-mitigated). |
| 7 | **`supportsPostTask` thin witness** (0 in-repo callers) | AS.W6 HEAD finding ("AT, not 3.2.1"); AT.W6 | OPEN — `platformSupport.ts:23` exported, re-exported `utils/index.ts:9`; `usePrioritizedTask` calls `getSchedulerPostTask()` directly; 0 call-sites of the public predicate | **FOLD** — wire it into the `usePrioritizedTask` guard (DRY) OR drop it. Trivial; rides the W6 correctness wave. |
| 8 | **`peerDependenciesMeta` undefined + dead `optionalPeerDependencies` field** | AT.W6 (W0b-C6 #3) | OPEN — `package.json:559 "optionalPeerDependencies"` (dead — npm ignores it) + NO `peerDependenciesMeta` ⇒ value.js/keyframes/embla/tw-animate ALL silently REQUIRED; CLAUDE.md's "optional" claim is false | **FOLD** — fix the field shape, then gate `proof:peer-optional` (peer P optional IFF its literal is absent from `dist/glass-ui.js`). |
| 9 | **`proof:strict-templates` binding-guard** (close the silent-no-op class library-wide) | AT.W6 (B6-1, DEC-AT-9); the AS.W7 silent-no-op dock bug seeded it | not present (`checkUnknownProps` off); `<GlassDock bogus-prop>` typechecks clean | **FOLD** — supersedes the booked point-spec guard. Gate at the right altitude, not one dock prop. |
| 10 | **Fraunces `@font-face`** (opsz+SOFT+WONK woff2) + `proof:font-axes` | grand-audit / AS.W0b (the ONE slipped SHIP); AT.W7 | OPEN — `typography.css:34-49` self-hosts Plus-Jakarta + Fira Code ONLY; Fraunces is a stack token (`tokens.css:43`) with NO face; `typography.css:150` WONK/SOFT axes are SILENTLY INERT (no face carries them) | **FOLD** — ≥2 MET (words A.W5-P1c live-blocked + value.js display face); slides DROPPED (DEC-8) but ≥2 holds. Mirror the Plus-Jakarta pattern; gate: every axis `typography.css` references is carried by a shipped face. Lowest-risk highest-impact WC lever. |

## §2 — The AU dock-design successor (the named-but-unwritten gestalt)

AT's C5 audit (`W0b-C5 §6.2`, C5-1) SPLIT the dock-DESIGN gestalt out to a
successor **AU**, recorded-not-planned, with AT's dock-CORRECTNESS as its
prerequisite. **The prerequisite LANDED** (`e906448`/`f0b0ffb`/`8e4cb9f` —
strict-templates is the one correctness item still open, #9 above). So AU's gating
condition is now met. AU's headline candidates (chronic dock-design backlog):

| # | Item | Origin / age | HEAD state | Disposition |
|---|---|---|---|---|
| 11 | **rail traveling-indicator + APG-tabs ARIA** (reka-ui `TabsRoot/List/Trigger/Content`) | AT.W0b B2/B4 (the rail-role conflict resolved at W1); DEC-AT-9 | dock rail is hand-rolled; no reka-ui Tabs adoption; rail-aria break is a consumer-visible change | **FOLD (AU headline)** — dock is ≥2-consumed (4 repos, B6 §5); the design rides that. The rail-aria break = AU's own version call (minor-fix vs major), kept OUT of AT's additive 3.3.0 (C5-4). |
| 12 | **spring-fidelity unification + micro-feedback + `will-change`** (press-scale canon, glass-hover) | AT.W0b B1/B3 | dock motion is functionally sound; B3 found the fidelity is non-uniform | **FOLD (AU)** — rides the ≥2-consumed dock. The convergent `--dock-resize-spring: var(--spring-snappy)` VT-parity spring already landed (AT.W6-dock-c). |
| 13 | **`useDockMagnify`** (proximity magnification, macOS-dock affordance) | AT.W0b B1 HEADLINE vs B3 KILL | `useDockMagnify` composable READY but 0 firm consumers | **BOOK → AU** — C4/C5 sided with B3: the dock IS ≥2-consumed but MAGNIFY specifically is backed by nothing but the demo. Ships in AU ONLY if ≥2 dock consumers ask. |
| 14 | **stagger the expand** | AT.W0b B1 §8 (B1 itself: "weakest of the four") | not present | **BOOK** — delight, single-lens, 0 consumer. AU candidate behind its own ≥2. |
| 15 | **pane VT participants + directional slide** (`DockLayerGroup`) | AT.W0b B2 D-LAYER-1 / B3 5.3 (BOOK) | thin consumer set; B3 flags slide-vs-size-morph fight | **BOOK** — needs a 2nd consumer + visual proof. AU candidate. |
| 16 | **`overflow:"clip"` enum member + typed dock `tier?` prop** | AT.W0b B5 / B6-9 | the overflow→one-enum clean break LANDED (W7-dock-a, `8e4cb9f`); `clip` member + typed `tier` are the honest-completion residuals | **BOOK** — 0 consumers; `strictTemplates` does NOT catch `data-tier` typos so the seam is real, but the bar is unmet. |

## §3 — The W-ASK control-size + 1-consumer backlog (the fold-path is coherence)

Each has ONE firm consumer (value.js). Individually substrate-without-2nd-consumer
→ BOOK. The ONLY clean fold is a coherent **control-size vocabulary** wave where
the ≥2 is cross-control coherence + the exported-public-API escape (a CVA variant
is public surface).

| # | Item | Origin / age | HEAD state | Disposition |
|---|---|---|---|---|
| 17 | **Button `size="icon-sm"`** | value.js W-ASKS; AS.W6 BOOK | `button/index.ts:36-41` has `default/sm/lg/icon`, no `icon-sm` | **FOLD-IF size-vocabulary wave opens** (with #20); else BOOK. Additive CVA, no risk. |
| 18 | **`DockSelectTrigger clampLabel`** | value.js W-ASKS; AS.W6 BOOK | absent | **BOOK** — 1 consumer (value.js). Trigger: a 2nd dock-select clamp consumer. |
| 19 | **`TooltipContent variant="mono"`** | value.js W-ASKS; AS.W6 BOOK | no `variant`/`mono` on tooltip | **BOOK** — 1 consumer. Trigger: a 2nd mono-tooltip consumer. |
| 20 | **`Select size`** | value.js W-ASKS; AS.W6 BOOK | no `size` on SelectTrigger | **FOLD-IF size-vocabulary wave opens** (pairs with #17 as ONE size-prop pass); else BOOK. |
| 21 | **`useGlobalDark({ initialValue })`** | speedtest dark-PRIMARY + T7; AS.W6 BOOK | `composables/dark/` has no `initialValue` | **FOLD** — ≥1 firm (speedtest) + pairs with #22 (the FOUC primitive). Additive option arg, no barrel change. |
| 22 | **FOUC parse-time `darkModeSyncScript()` primitive** | speedtest T7; AS.W6 BOOK | absent (`tokens.css` only mentions parse-time baking) | **FOLD** — pairs with #21. ≥2 (speedtest + words `light-dark()` site). String-emitting `<head>` helper on `/dark`. |
| 23 | **GlassDock `overflow` vs `wrap` contract clarification** | bbnf-lang playground; AS.W6 BOOK | the overflow→one-enum break LANDED (W7-dock-a); `wrap` boolean DELETED (0 consumers) | **DONE (folded in AT.W7)** — the clean break shipped (`8e4cb9f`, `rg .dock-wrap = 0`). Stop tracking; verify bbnf-lang playground migrates `:wrap` cleanly at adoption. |
| 24 | **MetricBadge icon slot** | speedtest; AR (DDR-AS-RC-2) | `metric-badge/` ships; no `icon` slot | **BOOK** — 1 consumer (speedtest). Trigger: a 2nd icon-badge consumer. |
| 25 | **LabeledField for/id binding (a11y)** | speedtest a11y; AR (DDR-AS-RC-2) | `labeled-field/` ships; binding present per family | **BOOK (a11y verify)** — trigger: speedtest's AU a11y audit names a concrete failing site → FOLD correctness; else BOOK. |
| 26 | **`useRAFLoop` demandPark** | speedtest; AR (DDR-AS-RC-2) | no `demandPark` | **BOOK** — 1 consumer. Trigger: a 2nd rAF consumer OR speedtest's perf wave confirms the API shape. |
| 27 | **`--spring-crisp` token (ζ≈0.80)** | speedtest; A1→AS (chronic, depth ≥4) | not in src (`grep spring-crisp = 0`) | **BOOK (default not-ship)** — 0 witnessed ≥2; regenerates via `regen-spring-tokens.mjs` if it lands. Trigger: a witnessed ≥2. |
| 28 | **CompletionSeal / GoldHeadline / CheckDraw** | A1→AS (chronic) | not in src | **BOOK (token-only if any)** — token/keyframe layer is the reusable substrate; the COMPONENT stays demo-gated until a 2nd consumer (J inv 10). |
| 29 | **"3 a11y asks" (DDR-AS-RC-2 bundle)** | speedtest; AR | un-enumerated bundle | **BOOK (decompose)** — a bundle label is not auditable. glass-ui-next.W0 MUST decompose against speedtest's AU audit before disposition; any real WCAG gap → FOLD. |

## §4 — The fourier control-pane asks (cross-repo, glass-ui-self-booked to 3.3.0)

The constellation hub's two SURVIVING glass-ui control-pane asks
(`ADOPTION-ASKS.md §9`, `§10`) — both genuinely ABSENT at 3.2.0, both
self-booked by glass-ui to its AT successor (`AS/FINAL.md:146-155`).

| # | Item | Origin / age | HEAD state | Disposition |
|---|---|---|---|---|
| 30 | **A-1 — `ConfiguratorLayer`/`ConfiguratorRow` inter-row divider-rule opt-in** (the machined twin-line groove) | fourier (control-pane audit 2026-06-04); ships only on `.instrument-rail` today | OPEN — `ConfiguratorLayer.vue:100` emits a flat `border-b`; `.configurator-row` emits only gap/padding; re-verified ABSENT at 3.2.0 | **FOLD** — glass-ui-self-booked to AT/3.3.0. Add the rail's sibling-rule groove to the Configurator chassis. Satisfaction: adjacent rows render the machined groove at every breakpoint. Non-blocking; fourier rides `.chassis-divider` meanwhile. |
| 31 | **A-2 — `ConfiguratorLayer` `label`/`sub` bound to the `text-title`/`text-heading` ladder at the component root** | fourier (control-pane audit 2026-06-04) | OPEN — title is a magic literal at every consumer site (`ConfiguratorLayer.vue:118 text-sm font-semibold`); no section-title token | **FOLD** — glass-ui-self-booked to AT/3.3.0. Bind label/sub typography to the ladder so one rung change restyles every pane title. |

## §5 — The chronic convergence-watches (carry is legitimate, not neglect)

| # | Item | Origin / age | HEAD state | Disposition |
|---|---|---|---|---|
| 32 | **Drawer `:native` / `GlassNativeDrawer` / `/native-drawer`** (+ `GlassDrawerSnapController`) | AN.W3 (vaul re-snap bug); AS.W6 BOOK; carried to AT | no native-drawer in src (`:native` only on HoverPopover) | **FOLD-CANDIDATE (the strongest non-headline)** — ≥2 FIRM (muster `MobileInstrumentSheet` + speedtest mobile sheet), retires the vaul-vue `activeSnapPoint` bug. AT held it out for blast-radius coherence; glass-ui-next folds IF scope admits a 2nd substrate wave, else BOOK with the named trigger. |
| 33 | **inline-edit primitive** | AN→…→AT (chronic, depth ~6) | 3 DIVERGENT consumers (numeric-click / string-dblclick / contenteditable) | **BOOK (convergence-gated)** — promote on contract-convergence, NOT census. The 6-tranche carry is legitimate (divergence, not neglect). |
| 34 | **dock panel-host variant** | AN→…→AT (chronic, depth ~6) | 1 consumer (bbnf-buddy `LeftToolsDock`); the vertical-overflow bug already fixed | **BOOK** — trigger: ≥2 tall-vertical-pane consumers. |
| 35 | **LabeledSlider numeric-readout** | AO→…→AT (chronic, depth ~5) | 2-divergent | **BOOK** — trigger: a 3rd consumer OR the 2 converge. |
| 36 | **shadcn parity (calendar / date-picker / pagination)** | AP→AR→AS→AT (chronic) | 0 consumers (pagination/virtual already retired L.W3) | **KILL (REJECT)** — 0 consumers; building parity on spec is exactly the overfitting class the precepts forbid. RE-OPEN trigger: an actual consumer (a fresh item). Stop carrying as a live watch. |

## §6 — The platform-Baseline-gated pilots + CSS levers (exogenous trigger)

All authoring-DRY-not-payload or Baseline-gated. Trigger is exogenous (Baseline
lift) or paid-diff-only (ship when an SFC touch already pays the cost).

| # | Item | Origin / age | Disposition |
|---|---|---|---|
| 37 | **G3 cross-document VT** (`@view-transition{navigation:auto}` + directional vocab) | AQ→AR→AS→AT (chronic, depth ~4) | **BOOK (split)** — `navigation:auto` is consumer-owned app-shell (REFUTED as a glass-ui wave); the library half (opt-in `--vt-*` directional vocab) ships. Trigger: ≥2 opt-in consumers. |
| 38 | **G5 `@scope` + `:state()`** (retire `:deep()`) | AR→AS→AT (chronic) | **BOOK (paid-diff-only)** — 5 `:deep(` sites, 0 `@scope`; authoring-DRY-not-payload. Ship opportunistically on an SFC touch that already pays the diff. |
| 39 | **G6 CSS `@function`** | AR→AS→AT (chronic) | **BOOK** — Limited/Chromium-only. Trigger: Baseline→Newly AND a real cross-engine authoring-DRY site. |
| 40 | **G8 `interestfor` action-previews** | AQ→AR→AS→AT (chronic, depth ~4) | **BOOK** — Limited/experimental. Trigger: Baseline Widely + a Configurator/dock destructive-action-preview 2nd consumer. |
| 41 | **`text-box-trim`** | AR→AS→AT (chronic) | **BOOK (watch fold into #10)** — Baseline-2025, typography-adjacent, 0 consumers. The Fraunces wave (#10) is the natural paid-diff companion — flag for the planner. |
| 42 | **`interpolate-size` / `calc-size(auto)`** | grand-audit / AS.W5 | **BOOK (paid-diff-only)** — Newly-Baseline; the 0fr↔1fr hack at `ConfiguratorLayer.vue` is the fallback. Migrate with `@supports` when the SFC is touched + a consumer is witnessed. |
| 43 | **relative-color `oklch(from …)`** | grand-audit / AS.W5 | **BOOK (paid-diff-only)** — token recipe for dock-hover/accent/scrim tints; deletes a canvas-2d probe. Opportunistic-SFC-touch trigger. |
| 44 | **GlassDialogNative pilot** | AQ→AR→AS→AT (chronic, depth ~4) | **BOOK** — `dialog-native/GlassDialogNative.vue` exists, 0 barrel/exports (clean, no leak). Trigger: Baseline Widely (`<dialog>` `commandfor`). |
| 45 | **HoverPopover `:native` opt-in** | AQ→AR→AS→AT (chronic, depth ~4) | **BOOK** — `HoverPopover.vue:133` default-false, reka-ui default. Graduates with G8 at Baseline Widely. |
| 46 | **G7 `GlassNativeSelect`** | AQ→AR→AS→AT (chronic, depth ~4) | **BOOK (demo-gated only)** — Limited Baseline; muster declined in AQ → no ≥2. Trigger: Baseline Widely → default. |

## §7 — The terminal KILLs (exit the ledger — do not re-mint)

| # | Item | Origin / age | Why terminal |
|---|---|---|---|
| 47 | **P5 OUTER-ONLY inner-rounding** (Configurator section dividers) | fourier J→AS→AT (chronic) | **KILL — user RULED (2026-06-04): outer-only canonical, AS.W7 right, fourier adjusts its side.** KILLED-AS-PHANTOM in `ADOPTION-ASKS.md §10` ("NEVER re-book" — the I→J→K inertia is the lesson). No glass-ui lever. |
| 48 | **DDR dock dark rung + fg-on-aurora** | speedtest; AR (chronic) | **KILL (shipped)** — `--glass-opacity-dock:0.42` SHIPPED AS.W5 (`tokens.css:620`); `--dock-fg-on-aurora` consumed at `dock.css:732/736/1048/1049`. |
| 49 | **DDR AnimatedDigit** | speedtest; AR | **KILL (already public)** — `animated-digit/AnimatedDigit.vue` ships; the DDR row is an ADOPTION ask, no glass-ui gap. |
| 50 | **DDR ContinuousTimeline marker-opt-out** | speedtest; AR | **KILL (shipped)** — `GlassTimeline.vue:54,60` opt-out + `data-current` stamping shipped. Verify the prop name at speedtest adoption. |
| 51 | **DockIconButton 44px coarse floor (S-2)** | AQ→AP→AR→AS (chronic, depth 4) | **KILL (shipped)** — `dock.css:1170-1185` (the `@media (pointer:coarse)` block; the `min-block/inline-size: var(--dock-touch-target)` floor at `:1184-1185`) landed AS.W5. The chronic is CLOSED. |
| 52 | **value.js VAL-9** (`spring()→LinearStop[]` emitter) | value.js A→J (chronic ×many) | **KILL (value.js J FINAL)** — keyframes owns the emitter privately; lifting adds a 3rd home; glass-ui's `--spring-*` regenerate via `regen-spring-tokens.mjs`. No glass-ui lever. |
| 53 | **P7 Mascot / monogram-pose** | bbnf+fourier+sudoku (chronic) | **KILL** — constellation DEC-3 (user-ratified). Disparate shapes (shared skin, not shape); no glass-ui mascot primitive. |
| 54 | **shared in-shader OKLab path** (fold aurora+blob into one shader) | AT.W0b architecture | **KILL** — aurora bakes per-nucleus, blob perturbs per-pixel; correctly different shaders. The shared primitive is the GLSL fn pair (the `/color` leaf, #4), NOT the shader. |
| 55 | **OffscreenCanvas+Worker / WebGPU aurora / webgpu unification** | grand-audit; AT.W0b SOTA | **KILL (pre-refuted)** — SOTA-confirmed WRONG for small background canvases. |

## §8 — OUT (USER-DOMAIN — inv-16 name-forwards; glass-ui writes only glass-ui)

| # | Item | Owner | Trigger / note |
|---|---|---|---|
| 56 | **value.js VAL-1 / `deriveAurora` ≥2 kill-gate** | value.js | **DISCHARGED on glass-ui's side** — the producer SHIPPED (AS.W7, `color.ts:182`). The ≥2 binds when value.js K.W4 wires the 2nd LIVE consumer; if K.W4 closes without it, value.js executes the VAL-1 KILL. NOT a glass-ui-next item. |
| 57 | **value.js K.W3 blob consumer rewrite + `ColorResolver` supply** | value.js | BLOCKED until glass-ui-next publishes the `/goo-blob` + `/watercolor-dot` subpaths (#1/#2). The 3.3.0 publish is the constellation unlock. |
| 58 | **value.js K.W2.5 `development`-key strip** (contract-v2 lockstep) | value.js | glass-ui already stripped its 68 keys (AS.W2b); value.js's K.W2.5 is its own arm. |
| 59 | **`docs/precepts` submodule pin re-sync + the π visual-evidence precept pin** | precepts repo / user | submodule in-flight; forbidden to touch while dirty. The "agents NEVER run irreversible release steps" precept is authored in the precepts repo's flow, then the glass-ui pin advances. |
| 60 | **bbnf-lang/playground dist-alias fossil** | playground maintainer | `vite.config.ts:24` hard alias; local-RED, CI-GREEN — `proof:resolution` working as designed. Trigger: maintainer removes the alias. |
| 61 | **The deploy-standardization Asks 1-7 + inv-22-color** (`ADOPTION-ASKS.md §3`) | each repo's maintainer | The CF-Pages convergence Ask 5 names keyframes.js + value.js; glass-ui is not a listed arm. OUT — recorded for cohort completeness. |
| 62 | **The cascade lockfile cohort** (`cascade-vjs`/`cascade-kf`/`cascade-gui`) | each repo's maintainer | `cascade-gui` (glass-ui's leg — lockfile regen so `@mkbabb/*` resolve from registry) booked H.W6, pure lockfile drift, no `package.json` change. Folds opportunistically when glass-ui-next touches the lockfile. |
| 63 | **M-CI / M-DEPLOY / M-MEASURE spine** | each repo's maintainer | glass-ui's only leg (the 3.2.0 CI-publish) DISCHARGED. The rest is each arm (inv-16). |

## §9 — The glass-ui-next roll-up (what this tranche actually folds)

**FOLD NOW — the headline + correctness + slipped-ship (the AT-unrun spec set):**
the blob trio + `useWebGLCanvas` substrate + `/color` leaf + shader-quality SOTA
(#1-5), the correctness fold (DataTable+`proof:vueuse-free-root`, `supportsPostTask`,
`peerDependenciesMeta`+`proof:peer-optional`, `proof:strict-templates` — #6-9), the
Fraunces ship + `proof:font-axes` (#10), the AU dock-design headline (rail
indicator + reka-ui Tabs + spring-fidelity — #11-12), the dark-ergonomics pair
(#21-22), and the two fourier control-pane asks glass-ui self-booked to 3.3.0
(#30-31). **The control-size vocabulary** (#17+#20) folds IFF a coherent size-prop
wave opens (then ≥2 by cross-control coherence).

**STRONGEST FOLD-CANDIDATE:** Drawer `:native` (#32) — the cleanest real ≥2 of any
non-headline item (muster + speedtest, both firm), retires a concrete vaul-vue bug.

**BOOK (gated):** the dock-magnify/stagger/slide/clip/tier residuals (#13-16, #23),
the 1-consumer W-ASKS (#18/#19/#24/#25/#26), the DDR residuals (#27-29), the CSS
levers (#37-39, #41-43), the platform-gated pilots (#40, #44-46), the
convergence-watches (#33-35).

**KILL (exit the ledger):** P5 (#47, user-ruled phantom), the 4 shipped-DDR rows
(#48-51), VAL-9 (#52), P7 (#53), the shared-shader path (#54), the
OffscreenCanvas/WebGPU set (#55), shadcn-parity (#36, REJECT).

**OUT (inv-16 name-forwards):** VAL-1 kill-gate (#56), value.js K.W3/K.W2.5
(#57-58), the precepts pin (#59), the playground fossil (#60), the
deploy/cascade/M-spine cohort (#61-63).

## §10 — Adversarial notes (the traps the fold must not spring)

- **AT is NOT closed — read its dock commits, not its plan, for "done."** The plan
  reads as if AT ships the blob headline; HEAD says only the dock-correctness slices
  landed. A naive read would re-defer the blob trio as "AT's" — it is glass-ui-next's
  PRIMARY backlog. The version is the tell: still 3.2.0, no `/goo-blob` export.

- **Four DDR rows are already DONE — do not re-ship (#48-51).** A naive read of the
  DDR-AS-RC-2 bundle label re-mints them. All HEAD-verified shipped at AS or earlier.

- **The blob headline's ≥2 is the contested claim — handle it honestly.** AS.W6
  ruled it "≥2 not clearly met"; AT inverted ONLY because the user RULED it the
  headline AND the inv-K-3 injected-resolver seam makes it substrate-shaped not
  value.js-coupled. The honest record: muster's blob interest is design-SURVEY
  (`R1-value-js-design-language.md`), NOT a committed app — so glass-ui-next ships on
  value.js + the demo story (the `deriveAurora` precedent), and the seam is the proof
  it is not overfit. Do NOT claim muster as a firm 2nd.

- **The W-ASKS are 1-consumer each — the size vocabulary is the ONLY fold path
  (#17-20).** Do not ship them as 4 isolated 1-consumer patches; that fails the
  overfitting bar. The coherence wave (Button `icon-sm` + `Select size` together) is
  the only ≥2.

- **`#23` overflow/`wrap` is DONE, not BOOK — verify before re-listing.** The clean
  break shipped at AT.W7 (`8e4cb9f`, `rg .dock-wrap = 0`). It is in §3 marked DONE
  only to prevent a re-mint; the residual is bbnf-lang's adoption (consumer-domain).

- **`#29` "3 a11y asks" is an un-auditable bundle.** It MUST be decomposed at
  glass-ui-next.W0 against speedtest's AU audit before any disposition.

- **VAL-1 is DISCHARGED on glass-ui's side (#56).** Do not re-open it as a glass-ui
  item; the only glass-ui lever (ship the producer) is spent.

- **The dock-DESIGN split is GESTALT-driven, NOT overfitting-driven (C5-6).** The
  dock IS ≥2-consumed (4 repos). AU exists because the rail-aria break contaminates
  AT's additive-3.3.0 and the blast-radius is the one thing the plan protects — NOT
  because the dock failed the bar. State this precisely so glass-ui-next doesn't
  mis-cite the reason.
