# AU — the folded deferred ledger (every glass-ui deferral, dispositioned)

The terminal disposition for EVERY glass-ui deferral the `deferred-lineage.md`
lineage carries (#1-63), each tagged with its AU-tranche disposition. Zero
un-dispositioned punts. Disposition vocabulary:

- **FOLD-Wn** — folds + executes in AU at the named wave (clears the ≥2-distinct-consumer
  bar, OR is correctness/hygiene, OR is the user-ruled headline).
- **BOOK** — named-forward with a CONCRETE graduation trigger (glass-ui holds the
  lever, the gate is not met at HEAD). Carried, NOT folded.
- **KILL** — terminal; no glass-ui lever or ratified dead. Exit the ledger.
- **OUT** — cross-repo / submodule; glass-ui writes only glass-ui (inv-16).
  Name-forward, the owning arm executes.

Every FOLD cites its AU wave (AU.W0-W10, per the CHARTER §3 wave table); every BOOK
cites its trigger; every KILL cites its terminal reason; every OUT cites its owning
arm. This is the input the AU wave specs (`../waves/AU.W*.md`) draw their backlog from
— 1:1 with the 63 numbered rows from `deferred-lineage.md §1-§8`, plus the 8
standing asks from `precept-prompt-recap.md §2` (reconciled here in §9), ordered by
the CHARTER's path forward.

## §1 — The AT-unrun headline + correctness + slipped-ship (deferred-lineage §1)

| # | Item | Disposition | Wave / trigger / reason |
|---|---|---|---|
| 1 | goo-blob primitive (`/goo-blob` + `useMetaballRenderer` + GLSL + OKLCh path) | **FOLD-W7** | The user-ruled headline. Onto the AU.W6 substrate, GAMMA lift (DEC-AT-7), injected `ColorResolver`. Gate: `proof:blob-value-free` + `proof:no-value-default` + ≥2 (value.js + demo story). |
| 2 | watercolor-dot primitive (`/watercolor-dot` + `useWatercolorBlob` + SVG filter + `prng` leaf) | **FOLD-W7** | Sibling of #1, shared injected-color seam, zero-wiring internalized filter (DEC-AT-3). |
| 3 | `useWebGLCanvas` substrate (aurora + goo-blob share; `frostShader.ts` deleted; restore+pause absorbed) | **FOLD-W6** | The forcing transposition. Gate: `proof:webgl-substrate-single` (pixel + scheduling parity) + consumer-#2 usability assert (C6 #4 — do NOT bake aurora's quad/DPR). |
| 4 | `/color` runtime-JS leaf (`oklchToLinear` + `oklchToGammaRgb`, value.js-backed) | **FOLD-W5** | DEC-AT-7 / inv-AT-color. Gate: `proof:color-acyclic` + `proof:single-color-core`. CSS token tier STAYS native (guarded). |
| 5 | The shader-quality wave (fwidth AA · Quilez smin · rotated FBM · OKLCh linear-flip + `linearToSrgb()` · exact Ottosson matrices · hue-preserving gamut) | **FOLD-W7** | Rides #1 (the headline wave's LINEAR shader-quality stage). The OETF correctness is the headline bug. Gate: 8-assertion CPU-equivalence (asymmetric `#3a7bd5`, 1e-6) + `proof:webgl-golden`. |
| 6 | DataTable vueuse root-barrel leak (CHRONIC, RED@HEAD) | **FOLD-W3** | Swap `useElementSize`→in-house `useResizeObserver` (the ONE hard ordering edge) + `proof:vueuse-free-root` (the real debt is the absent gate). |
| 7 | `supportsPostTask` thin witness (0 callers) | **FOLD-W3** | WIRE into `usePrioritizedTask` guard (DRY) OR DROP. Gate: `proof:supportsPostTask-wired` (≥1 real caller or deleted). |
| 8 | `peerDependenciesMeta` undefined + dead `optionalPeerDependencies` (CHRONIC, RED@HEAD) | **FOLD-W3** | Fix field shape + DELETE the dead field (P1), then `proof:peer-optional` (optional IFF absent from `dist/glass-ui.js`). |
| 9 | `proof:strict-templates` binding-guard (the silent-no-op closer) | **FOLD-W3** | The KEYSTONE — lands FIRST WITHIN W3. Library-wide `checkUnknownProps:true` across all three tsconfigs (NOT a point-spec guard). Re-verify the AT clean breaks under it. |
| 10 | Fraunces `@font-face` (opsz+SOFT+WONK woff2) + `proof:font-axes` | **FOLD-W4** | The ONE slipped SHIP. ≥2 MET (words + value.js). Mirror the Plus-Jakarta pattern; gate: every referenced axis carried by a shipped face. |

## §2 — The AU dock-design successor (deferred-lineage §2)

| # | Item | Disposition | Wave / trigger / reason |
|---|---|---|---|
| 11 | rail traveling-indicator + APG-tabs ARIA (reka-ui Tabs) | **FOLD-W8** | The atomic structural pass (the AU dock-design headline). reka-ui `TabsRoot/List/Trigger/Content`; per-button bg RETIRED for the travelling indicator. The rail-aria break = AU's own SemVer call (recorded AU.W10). |
| 12 | spring-fidelity unification + micro-feedback + `will-change` | **FOLD-W8** | Rides the ≥2-consumed dock. AU.W8 ADDS spring-fidelity unification + `will-change` hygiene + glass icon-hover. NOTE: `--scale-press-dock` 0.92→0.96 is **DONE-IN-AT-RUN** (`8e4cb9f`, AT.W7-dock-b — `tokens.css:1004 = var(--scale-press) = 0.96`, already canonical at HEAD); it is NOT an AU.W8 deliverable — it ships to slides via the AU.W10 publish (published 3.2.0 still carries 0.92), not via AU.W8 work. The press scale is already on `var(--scale-press)`; AU.W8 does NOT re-canonize it. |
| 13 | `useDockMagnify` (proximity magnification) | **BOOK** | C4/C5 sided with B3: the dock IS ≥2-consumed but MAGNIFY is backed by nothing but the demo. Trigger: ≥2 dock consumers ask. |
| 14 | stagger the expand | **BOOK** | Delight, single-lens, 0 consumer. Trigger: its own ≥2. |
| 15 | pane VT participants + directional slide (`DockLayerGroup`) | **BOOK** | Thin consumer set; B3 flags slide-vs-size-morph fight. Trigger: a 2nd consumer + visual proof. |
| 16 | `overflow:"clip"` enum member + typed dock `tier?` prop | **BOOK** | 0 consumers; `strictTemplates` does NOT catch `data-tier` typos so the seam is real, but the bar is unmet. Trigger: ≥2. |

## §3 — The W-ASK control-size + 1-consumer backlog (deferred-lineage §3)

| # | Item | Disposition | Wave / trigger / reason |
|---|---|---|---|
| 17 | Button `size="icon-sm"` | **FOLD-W9** | Folds as ONE size-vocabulary pass with #20 (≥2 = cross-control coherence + the public CVA surface). Additive, no risk. FOLD-IF the coherent size-prop wave opens (else BOOK). |
| 18 | `DockSelectTrigger clampLabel` | **BOOK** | 1 consumer (value.js). Trigger: a 2nd dock-select clamp consumer. |
| 19 | `TooltipContent variant="mono"` | **BOOK** | 1 consumer. Trigger: a 2nd mono-tooltip consumer. |
| 20 | `Select size` | **FOLD-W9** | Pairs with #17 as ONE size-prop pass. The only clean ≥2 path for the W-ASKS. FOLD-IF the size-prop wave opens (else BOOK). |
| 21 | `useGlobalDark({ initialValue })` | **FOLD-W9** | ≥1 firm (speedtest) + pairs with #22 (the FOUC primitive). Additive option arg. |
| 22 | FOUC parse-time `darkModeSyncScript()` primitive | **FOLD-W9** | Pairs with #21. ≥2 (speedtest + words `light-dark()`). String-emitting `<head>` helper on `/dark`. |
| 23 | GlassDock `overflow` vs `wrap` contract clarification | **KILL (DONE)** | The clean break SHIPPED AT.W7 (`8e4cb9f`, `rg .dock-wrap = 0`). Stop tracking; bbnf-lang playground migrates `:wrap` at adoption (consumer-domain). |
| 24 | MetricBadge icon slot | **BOOK** | 1 consumer (speedtest). Trigger: a 2nd icon-badge consumer. |
| 25 | LabeledField for/id binding (a11y) | **FOLD-W3-IF** | DECOMPOSED at AU.W0 against speedtest's audit. Concrete failing site → FOLD-W3; no concrete site → BOOK. |
| 26 | `useRAFLoop` demandPark | **BOOK** | 1 consumer. Trigger: a 2nd rAF consumer OR speedtest's perf wave confirms the shape. |
| 27 | `--spring-crisp` token (ζ≈0.80) | **BOOK** | CHRONIC depth ≥4; 0 witnessed ≥2. Regenerates via `regen-spring-tokens.mjs` if it lands. Trigger: a witnessed ≥2. |
| 28 | CompletionSeal / GoldHeadline / CheckDraw | **BOOK** | CHRONIC; token/keyframe substrate is reusable but the COMPONENT stays demo-gated until a 2nd consumer (J inv 10). |
| 29 | "3 a11y asks" (DDR-AS-RC-2 bundle) | **FOLD-W0 (decompose) → W3** | An un-auditable bundle. AU.W0 MUST decompose it against speedtest's audit; any real WCAG gap → FOLD-W3; else the decomposed sites BOOK. Zero bundle labels survive W0. |

## §4 — The fourier control-pane asks (deferred-lineage §4)

| # | Item | Disposition | Wave / trigger / reason |
|---|---|---|---|
| 30 | A-1 `ConfiguratorLayer`/`ConfiguratorRow` inter-row divider-rule opt-in | **FOLD-W9** | glass-ui self-booked to 3.3.0. The machined twin-line groove on the Configurator chassis. Precondition: `index.css` budget rebase (named). |
| 31 | A-2 `ConfiguratorLayer` `label`/`sub` → the typography ladder at root | **FOLD-W9** | glass-ui self-booked. Bind label/sub to the ladder; restyles every pane title → paired-π visual verification. |

## §5 — The chronic convergence-watches (deferred-lineage §5)

| # | Item | Disposition | Wave / trigger / reason |
|---|---|---|---|
| 32 | Drawer `:native` / `GlassNativeDrawer` / `/native-drawer` | **FOLD-W9** | The STRONGEST non-headline ≥2 (muster `MobileInstrumentSheet` + speedtest mobile sheet, both FIRM); retires the vaul-vue `activeSnapPoint` bug. AT held it for blast-radius; AU folds IFF scope admits the 2nd substrate wave (else BOOK), file-disjoint. |
| 33 | inline-edit primitive | **BOOK** | CHRONIC depth ~6, but 3 DIVERGENT consumers. Promote on contract-CONVERGENCE, NOT census (the carry is legitimate). Trigger: the 3 converge. |
| 34 | dock panel-host variant | **BOOK** | 1 consumer (bbnf-buddy); the vertical-overflow bug already fixed. Trigger: ≥2 tall-vertical-pane consumers. |
| 35 | LabeledSlider numeric-readout | **BOOK** | CHRONIC depth ~5, 2-divergent. Trigger: a 3rd consumer OR the 2 converge. |
| 36 | shadcn parity (calendar / date-picker / pagination) | **KILL (REJECT)** | 0 consumers; building parity on spec is the overfitting class the precepts forbid. RE-OPEN trigger: an actual consumer (a fresh item). |

## §6 — The platform-Baseline-gated pilots + CSS levers (deferred-lineage §6)

| # | Item | Disposition | Wave / trigger / reason |
|---|---|---|---|
| 37 | G3 cross-document VT (`@view-transition{navigation:auto}` + directional vocab) | **BOOK (split)** | `navigation:auto` is consumer-owned app-shell (REFUTED as a glass-ui wave); the library half (opt-in `--vt-*` directional vocab) ships on ≥2 opt-in consumers. |
| 38 | G5 `@scope` + `:state()` (retire `:deep()`) | **BOOK (paid-diff-only)** | 5 `:deep(` sites, 0 `@scope`; authoring-DRY-not-payload. Ship opportunistically on an SFC touch that already pays the diff. |
| 39 | G6 CSS `@function` | **BOOK** | Limited/Chromium-only. Trigger: Baseline→Newly + a real cross-engine authoring-DRY site. |
| 40 | G8 `interestfor` action-previews | **BOOK** | Limited/experimental. Trigger: Baseline Widely + a Configurator/dock destructive-action-preview 2nd consumer. |
| 41 | `text-box-trim` | **FOLD-W4-IF** | Baseline-2025, typography-adjacent, 0 consumers. FOLD into #10's Fraunces touch IFF that SFC touch already pays the diff; else BOOK. |
| 42 | `interpolate-size` / `calc-size(auto)` | **BOOK (paid-diff-only)** | Newly-Baseline; the 0fr↔1fr hack is the fallback. Migrate with `@supports` when the SFC is touched + a consumer witnessed. |
| 43 | relative-color `oklch(from …)` | **BOOK (paid-diff-only)** | Token recipe for dock-hover/accent/scrim tints; deletes a canvas-2d probe. Opportunistic-SFC-touch trigger. |
| 44 | GlassDialogNative pilot | **BOOK** | `dialog-native/GlassDialogNative.vue` exists, 0 barrel/exports (clean). Trigger: Baseline Widely (`<dialog>` `commandfor`). |
| 45 | HoverPopover `:native` opt-in | **BOOK** | `HoverPopover.vue:133` default-false. Graduates with G8 at Baseline Widely. |
| 46 | G7 `GlassNativeSelect` | **BOOK (demo-gated)** | Limited Baseline; muster declined in AQ → no ≥2. Trigger: Baseline Widely → default. |

## §7 — The terminal KILLs (deferred-lineage §7 — do not re-mint)

| # | Item | Disposition | Reason |
|---|---|---|---|
| 47 | P5 OUTER-ONLY inner-rounding | **KILL** | User RULED (2026-06-04): outer-only canonical, AS.W7 right. KILLED-AS-PHANTOM ("NEVER re-book"). No glass-ui lever. |
| 48 | DDR dock dark rung + fg-on-aurora | **KILL (shipped)** | `--glass-opacity-dock:0.42` SHIPPED AS.W5 (`tokens.css:620`); `--dock-fg-on-aurora` consumed at `dock.css:732/736/1048/1049`. |
| 49 | DDR AnimatedDigit | **KILL (already public)** | `animated-digit/AnimatedDigit.vue` ships; no glass-ui gap. |
| 50 | DDR ContinuousTimeline marker-opt-out | **KILL (shipped)** | `GlassTimeline.vue:54,60` opt-out + `data-current` shipped. Verify prop name at speedtest adoption. |
| 51 | DockIconButton 44px coarse floor (S-2) | **KILL (shipped)** | `dock.css:1170-1185` (the `@media (pointer:coarse)` block; the `min-block/inline-size: var(--dock-touch-target)` floor at `:1184-1185`) landed AS.W5. The chronic is CLOSED. |
| 52 | value.js VAL-9 (`spring()→LinearStop[]` emitter) | **KILL** | value.js J FINAL — keyframes owns the emitter privately; lifting adds a 3rd home; glass-ui's `--spring-*` regenerate. No glass-ui lever. |
| 53 | P7 Mascot / monogram-pose | **KILL** | Constellation DEC-3 (user-ratified). Disparate shapes; no glass-ui mascot primitive. |
| 54 | shared in-shader OKLab path (fold aurora+blob into one shader) | **KILL** | Aurora bakes per-nucleus, blob perturbs per-pixel — correctly different shaders. The shared primitive is the GLSL fn pair (the `/color` leaf, #4), NOT the shader. |
| 55 | OffscreenCanvas+Worker / WebGPU aurora / webgpu unification | **KILL (pre-refuted)** | SOTA-confirmed WRONG for small background canvases. |

## §8 — OUT (USER-DOMAIN — inv-16 name-forwards; deferred-lineage §8)

| # | Item | Disposition | Owner / trigger |
|---|---|---|---|
| 56 | value.js VAL-1 / `deriveAurora` ≥2 kill-gate | **OUT** | value.js. DISCHARGED on glass-ui's side (producer SHIPPED AS.W7). The ≥2 binds when value.js K.W4 wires the 2nd live consumer. NOT an AU item. |
| 57 | value.js K.W3 blob consumer rewrite + `ColorResolver` supply | **OUT** | value.js. UNBLOCKS on AU.W10's 3.3.0 publish (the constellation unlock — the single hinge). value.js's arm. |
| 58 | value.js K.W2.5 `development`-key strip | **OUT** | value.js. glass-ui already stripped its 68 keys (AS.W2b); value.js's K.W2.5 is its own arm. |
| 59 | `docs/precepts` submodule pin re-sync + the π visual-evidence precept pin | **OUT** | precepts repo / user. Submodule in-flight, dirty — forbidden to touch (`precept-prompt-recap.md §3.8`). The pin advances on the precepts repo's clean flow. AU touches it NOT. |
| 60 | bbnf-lang/playground dist-alias fossil | **OUT** | playground maintainer. `vite.config.ts:24` hard alias; local-RED, CI-GREEN (`proof:resolution` working as designed). Trigger: maintainer removes the alias. |
| 61 | deploy-standardization Asks 1-7 + inv-22-color | **OUT** | each repo's maintainer. The CF-Pages convergence Ask 5 names keyframes.js + value.js; glass-ui is not a listed arm. Recorded for cohort completeness. |
| 62 | cascade lockfile cohort (`cascade-gui`) | **OUT (opportunistic)** | glass-ui's leg (lockfile regen so `@mkbabb/*` resolve from registry). Pure lockfile drift; folds opportunistically when AU touches the lockfile (AU.W3's peer-field reshape or the AU.W10 publish). |
| 63 | M-CI / M-DEPLOY / M-MEASURE spine | **OUT** | each repo's maintainer. glass-ui's only leg (the 3.2.0 CI-publish) DISCHARGED. The rest is each arm (inv-16). |

## §9 — The standing asks (precept-prompt-recap §2), reconciled to AU waves

The cross-repo asks naming glass-ui, mapped to AU waves (1:1 with the recap's
status column):

| Ask | Disposition | Wave / note |
|---|---|---|
| ASK-1 dock-vt-name | **KILL (SHIPPED 3.1.1)** | `GlassDock.vue:144`; KILL the W6 console-filter bridge (born-legacy). |
| ASK-2 VAL-9 codegen | **KILL** (#52) | keyframes owns the emitter; no glass-ui lever. |
| ASK-3 a11y LabeledField (`inert`) | **SHIPPED 3.1.1**; the DDR for/id binding (#25) | **FOLD-W3-IF** — verify-or-book at AU.W0 decompose. |
| ASK-4 asideSide (A-3) | **KILL (SHIPPED 3.2.0)** | `Configurator.vue:85`. |
| ASK-5 P5 inner-rounding | **KILL** (#47) | User-ruled phantom. NEVER re-book. |
| ASK-6 VT-parity dock spring | **DONE-IN-AT-RUN** (`e906448`) | Re-verify on AU's OWN green CI at the W10 close (inv-27). |
| ASK-7 `<Role>Dock` vocabulary + dock-docs | **FOLD-W8** | The docs-convention half + `useDock*` renames + `DockTabButton` retire (deletion surface: `src/components/custom/dock/DockTabButton.vue`, its export at `dock/index.ts:5`, the `dock.css:877/947` comment refs). `<Role>Dock` COMPONENT is BOOK (no 2nd consumer; slides binds `GlassDock`+`DockIconButton`+`#collapsed`, no role-typed component). The named candidate 2nd consumer is keyframes D.W5 — the reciprocal cross-session edge (it circles back to AU.W8 only IF a role-typed base ships AND keyframes is its 2nd consumer; else the base stays BOOK). |
| ASK-8 touch-gate double-tap | **DONE-IN-AT-RUN** (`f0b0ffb`) | The a11y/state contract test (the COLLIDED slot) is **FOLD-W8** under a fresh AU ID. |

## §10 — The roll-up (what AU folds, books, kills, names-out)

**FOLD (executes in AU, per the CHARTER §3 wave table):** the slides-P0 dock
opacity-lockstep (W2); the keystone + correctness fold (#6-9, W3 — strict-templates
lands FIRST WITHIN W3); Fraunces (#10, W4); the `/color` leaf (#4, W5); the
`useWebGLCanvas` substrate + `frostShader` delete (#3, W6); the blob trio + the
shader-quality LINEAR stage (#1/#2/#5, W7 — the user-ruled headline); the AU
dock-design headline (#11-12 + ASK-7, W8); the control-pane (#30-31) + dark-ergonomics
(#21-22) + Drawer `:native` (#32) + size-vocabulary (#17+#20) + slides-supply
(showClose/`/deck`/Card-Badge/motion), W9; the decomposed a11y (#25/#29, W0→W3). **One
3.3.0 publish at W10 (the constellation root, the single hinge — value.js K.W3 + slides'
four consumptions both unlock on it).**

**BOOK (gated, carried):** the dock-magnify/stagger/slide/clip/tier residuals
(#13-16); the 1-consumer W-ASKS (#18/#19/#24/#26); the DDR residuals (#27-28); the
convergence-watches (#33-35); the CSS levers (#37-43); the platform-gated pilots
(#40, #44-46). **Each carries a CONCRETE trigger — zero perpetual punts.**

**KILL (exit the ledger):** P5 (#47, user-ruled), the 4 shipped-DDR rows (#48-51),
VAL-9 (#52), P7 (#53), the shared-shader path (#54), OffscreenCanvas/WebGPU (#55),
shadcn-parity (#36, REJECT), the overflow/wrap clarification (#23, DONE).

**OUT (inv-16 name-forwards):** VAL-1 kill-gate (#56), value.js K.W3/K.W2.5 (#57-58),
the precepts pin (#59), the playground fossil (#60), the deploy/cascade/M-spine cohort
(#61-63).

**Disposition completeness: 63/63 numbered rows (from `deferred-lineage.md §1-§8`)
+ 8 standing asks (from `precept-prompt-recap.md §2`, reconciled in §9)
dispositioned = 71 total. Zero un-dispositioned punts (P-Inv 28 — zero-deferral at
open).**

## §11 — Adversarial guards (the traps the fold must not spring)

Carried verbatim from `deferred-lineage.md §10` — the AU executor must NOT:

- **Re-defer the blob trio as "AT's."** It is AU's PRIMARY backlog (#1-5, FOLD-W5-W7).
  The version is the tell: still 3.2.0, no `/goo-blob` export. AT's plan reads as if
  it shipped; HEAD says only the dock landed.
- **Re-ship the 4 DONE DDR rows (#48-51).** All HEAD-verified shipped at AS or earlier.
  A naive read of the DDR-AS-RC-2 bundle label re-mints them — KILL, do not fold.
- **Claim muster as the blob's firm 2nd.** muster's blob interest is design-SURVEY,
  NOT a committed app. AU ships on value.js + the demo story; the injected seam is the
  proof it is not overfit (the honest record).
- **Ship the W-ASKS as 4 isolated 1-consumer patches.** The size-vocabulary wave
  (#17+#20 together) is the ONLY ≥2 path. The others (#18/#19) stay BOOK.
- **Re-list #23 as BOOK.** The overflow/`wrap` clean break is DONE (`8e4cb9f`); the
  residual is bbnf-lang's adoption (consumer-domain). KILL-as-DONE.
- **Re-open VAL-1 (#56) as a glass-ui item.** The only glass-ui lever (ship the
  producer) is SPENT. OUT.
- **Mis-cite the dock-DESIGN split as overfitting-driven.** The dock IS ≥2-consumed (4
  repos); AU exists because the rail-aria break contaminates AT's additive-3.3.0 — NOT
  because the dock failed the bar (C5-6).
- **Inherit the `W6-dock-b` slot collision.** The touch-gate took the a11y test's slot
  (`f0b0ffb`). AU re-letters: touch-gate SHIPPED, the a11y/state contract is a FRESH AU
  ID (FOLD-W8). Do NOT silently drop the un-shipped a11y contract.
