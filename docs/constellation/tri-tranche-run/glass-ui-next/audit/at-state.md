# AT — state audit (what PLANNED vs what LANDED vs what is PLANNED-BUT-UNBUILT)

The deep read of glass-ui's AT tranche at HEAD of `at-dock-convergence`. AT was authored
as a 10-wave plan (W0, W0b, W1-W8) across three braided headlines — the blob primitives +
WebGL/color transposition (W2-W5), the dock perfection (W6/W7 slices), the AS-residual
correctness fold (W6) — shipping **3.3.0**. What actually executed on the branch is a
**single slice: the dock convergence** (three commits). The headline (blob/aurora/WebGL/
color) and the bulk of the correctness fold never left the spec.

This audit is falsifiable: every status row cites a file-at-HEAD or a commit. NO legacy
— UNBUILT items are folded forward as-spec'd, not re-litigated.

## §The canonical next letter

**AU.** `docs/tranches/` holds `… AR, AS, AT` (AT last); no `AU/` exists; the constellation
`CANONICAL-ORDERING.md` records the post-AT publisher as a forward leg. The new glass-ui
tranche that EXECUTES AT's unbuilt mass is **AU** (the AT-residual fold + the blob/color
headline carried whole). AT does NOT get a FINAL — it has no `FINAL.md` at HEAD, and its
PROGRESS still reads `PLANNED` for W2-W8. AT is **plan-authored, dock-slice-executed,
headline-unbuilt** — AU closes it.

## §What ACTUALLY landed (the dock convergence — three commits)

The `at-dock-convergence` branch executed only the dock waves, file-disjoint from the
blob graph exactly as W1b §0 promised. Evidence: `git log` + `git diff --stat
53a89f7~1..8e4cb9f`.

| Commit | Slice | What landed |
|---|---|---|
| `e906448` | AT.W6-dock-c | VT/FLIP timing-parity — `--dock-resize-spring` minted in `tokens.css §20`; BOTH the FLIP path (`dock.css --dock-motion-resize`) and native-VT path (`view-transition.css ::view-transition-group(.gl-dock-layer)`) consume it; `morphGeneration` concurrency guard in `GlassDock.vue`; `proof:dock-motion-parity` gate + `GlassDock.motion-parity.test.ts` |
| `f0b0ffb` | AT.W6-dock-b′ | touch-gate B′ — the keyframes-filed double-tap field defect REPRODUCED then fixed (dropped the activating-touch `preventDefault`/`stopPropagation`; rides native tap→click); `GlassDock.touch-gate.test.ts` (297 LOC, behavioural) |
| `8e4cb9f` | AT.W7-dock-a/b/c | overflow clean break (`overflow?: "grow"\|"wrap"\|"scroll"`, `wrap` boolean DELETED, `.dock-wrap`→`.dock-overflow-wrap`, `640px`→`--dock-overflow-bp`); token-only design refinements (press `0.92`→`var(--scale-press)`, glass icon-hover, `--dock-press-spring`); `proof:doc-consistency` ι doc-rot gate (caught `dock-group`/`sidebar`/`@lucide/vue` rot) |

**Note — the touch-gate is a deviation, not a planned slice.** W1b verdicted the dock
"functionally sound — no lens found a SHIPPED dock bug" (§0). `f0b0ffb` REFUTED that: the
keyframes field defect (the `project_dock_doubleclick.md` memory item) was real; the W0b
audit verdict was wrong. The fix landed under inv-ε (resolve-by-instrument). This is the
one place AT's own audit overclaimed — AU's audit should carry the lesson (a behavioural
mounted-dock test, not a prose a11y assertion).

## §State table — every wave/item

Status vocabulary: DONE (landed + evidenced at HEAD) · PARTIAL (some sub-slices landed,
others not) · UNBUILT (spec-only — no artifact at HEAD).

| Wave / item | Planned | Status | Evidence (file or commit) |
|---|---|---|---|
| **W0** — 6-lens deep audit | DEV | DONE | `audit/W0-L{1..6}-*.md` (6 files); `53a89f7` |
| **W0b** — 18-lens augment+harden | DEV | DONE | `audit/W0b-{A,B,C}{1..6}-*.md` (18 files); `a09c2b6` |
| **W1** — design slices (blob · dock · color-gates) | DEV (boundary) | DONE | `design/AT.W1-blob-primitives.md`, `AT.W1b-dock.md`, `AT.W1c-color-gates.md` |
| **W2** — `useWebGLCanvas` substrate + aurora refactor + `frostShader` delete + `/color` leaf + dither/LUT | IMPL | **UNBUILT** | no `glass/webgl/` substrate; `src/composables/glass/webgl/frostShader.ts` STILL PRESENT (W2 said DELETE); no `src/composables/color/` leaf; PROGRESS reads PLANNED |
| `proof:webgl-substrate-single` | W2 gate | **UNBUILT** | `scripts/proof-webgl-substrate-single.mjs` ABSENT |
| `proof:webgl-golden` (promote `profile-aurora.mjs`) | W2,W5 gate | **UNBUILT** | `scripts/proof-webgl-golden.mjs` ABSENT (`profile-aurora.mjs` un-promoted) |
| `proof:color-acyclic` · `proof:single-color-core` | W2/W6 gate | **UNBUILT** | both scripts ABSENT |
| **W3** — watercolor-dot (CSS/SVG) + internalized filter + `prng` leaf | IMPL | **UNBUILT** | no `/watercolor-dot` subpath; no `useWatercolorBlob`; no `prng` leaf |
| `proof:blob-value-free` (two-tier) | W3,W4 gate | **UNBUILT** | `scripts/proof-blob-value-free.mjs` ABSENT |
| **W4** — goo-blob (GAMMA shader) onto W2 + `ColorResolver` seam + demo story #2 | IMPL (headline) | **UNBUILT** | no `/goo-blob` subpath; no `ColorResolver`/`defaultBlobColorResolver`; value.js demo 1×1-canvas hack un-replaced |
| **W5** — shader-quality wave (fwidth AA · quadratic smin · rotated FBM · OKLCh linear-flip + `linearToSrgb` · exact Ottosson matrices · radians · hue-preserving gamut) | IMPL | **UNBUILT** | no `metaball-color.glsl-port.ts`; DEC-AT-7 GAMMA→LINEAR seam unrealized; no 8-assertion CPU-equivalence test |
| **W6 — correctness fold** | IMPL | **UNBUILT** | see sub-rows |
| `peerDependenciesMeta` fix + `proof:peer-optional` | W6 | **UNBUILT (RED@HEAD)** | `package.json:559` STILL the dead `optionalPeerDependencies` field; no `peerDependenciesMeta`; gate ABSENT |
| DataTable `useElementSize`→`useResizeObserver` + `proof:vueuse-free-root` | W6 (hard ordering edge) | **UNBUILT (RED@HEAD)** | `src/components/ui/data-table/DataTable.vue:3,78` STILL `useElementSize` from `@vueuse/core`; gate ABSENT |
| keyframes `[2.2.0,3.0.0]` `proof:package` axis | W6 | **UNBUILT** | no peer-matrix axis added |
| `supportsPostTask` WIRED (first real caller) | W6 | **UNBUILT** | `src/utils/platformSupport.ts:23` defines+exports it; still 0 real callers (the wire-up unrealized) |
| R4/R6 hardening (4 specs) | W6 | **UNBUILT** | no artifacts |
| **W6 — dock-hardening** | IMPL | **PARTIAL** | see sub-rows |
| `proof:dock-motion-parity` (`--dock-resize-spring` VT-fork reconcile) | W6-dock-c | **DONE** | `scripts/proof-dock-motion-parity.mjs`; `e906448` |
| dock a11y + state-machine contract test (tablist/tab/aria-selected, roving tabindex, focus-visible, keep-open) | W6-dock-b | **UNBUILT** | dock `__tests__/` has motion-parity/scroll-overflow/touch-gate/vt-names/instrument-strip — NO a11y+state contract test; the rail ARIA contract untested |
| `proof:strict-templates` (`checkUnknownProps:true` — the silent-no-op closer) | W6-dock-a (keystone) | **UNBUILT** | no `checkUnknownProps`/`strictTemplates` in ANY tsconfig; gate ABSENT — the "lands first" keystone never landed |
| touch-gate B′ (the double-tap field defect) | unplanned deviation | **DONE** | `f0b0ffb`; `GlassDock.touch-gate.test.ts` |
| **W7 — slipped ship + dock clean-break** | IMPL | **PARTIAL** | see sub-rows |
| dock overflow 3-prop→one enum (`wrap` deleted) | W7-dock-a | **DONE** | `GlassDock.vue:74,100`; `8e4cb9f`; `.dock-wrap`→`.dock-overflow-wrap` |
| dock press/hover/spring design refinements (token-only) | W7-dock-b | **DONE** | `tokens.css`/`dock.css`; `8e4cb9f` |
| the sliding rail-indicator (travelling pill) | W7-dock-b | **UNBUILT** | no `--dock-rail-indicator-*` travelling indicator landed (the per-button background un-retired) |
| reka-ui `Tabs` rail (`TabsRoot/List/Trigger/Content`, APG-Tabs canon) | W7 (DEC-AT-9) | **UNBUILT** | no reka Tabs in `src/components/custom/dock/`; the rail-role B2-vs-B4 resolution unrealized |
| ι doc-rot sweep + `proof:doc-consistency` | W7-dock-c | **DONE** | `scripts/proof-doc-consistency.mjs`; `8e4cb9f` |
| Fraunces `@font-face` + `proof:font-axes` (the slipped ship) | W7 | **UNBUILT (SLIPPED)** | `tokens.css:43 --font-stack-display:"Fraunces"` references it, but `typography.css` declares ZERO Fraunces `@font-face` (only Plus Jakarta + Fira Code faces); no woff file ships; `proof:font-axes` ABSENT — the display token is dangling |
| dead `ValueJs` UMD global removal | W7 | **UNBUILT** | not addressed |
| **W8** — close: overfitting audit (PROPS) + gates matrix + AT.FINAL + 3.3.0 publish | IMPL (LAST) | **UNBUILT** | no `FINAL.md`; no `inv-AT-color` close record; 3.3.0 NOT published |

## §Verdict — the three headlines, by status

1. **The blob primitives + WebGL/color transposition (W2-W5) — UNBUILT in totality.**
   The entire headline (the `useWebGLCanvas` substrate, the `frostShader` delete, the
   `/color` leaf, watercolor-dot, goo-blob on the GAMMA shader, the `ColorResolver` seam,
   the W5 shader-quality wave with the DEC-AT-7 GAMMA→LINEAR `linearToSrgb` seam) is
   spec-only. Zero src, zero gates. This is AU's load-bearing carry. The W0b SOTA reads
   (`W0b-A1..A6`) and the C-synthesis (`W0b-C1..C6`) are the binding design substrate —
   AU inherits them whole; no re-audit of the SOTA is owed.

2. **The dock perfection (W6/W7 dock slices) — PARTIAL.** Three commits landed the
   motion-parity reconcile (DONE), the overflow clean break (DONE), the token-only design
   refinements (DONE), the doc-rot gate (DONE), plus an UNPLANNED touch-gate fix (DONE,
   inv-ε). UNBUILT: the keystone `proof:strict-templates` (the silent-no-op closer that
   W1b §3 said "lands FIRST" — it never landed, so the W6/W7 clean breaks were NOT
   typecheck-guarded), the dock a11y+state contract test, the reka-ui `Tabs` rail (DEC-AT-9),
   the travelling rail-indicator. The atomic-template-pass (W1b §3) — rail ARIA +
   overflow + rail-indicator as ONE edit — was only PARTIALLY executed (overflow landed
   alone; the rail ARIA + indicator did not).

3. **The AS-residual correctness fold (W6 non-dock) — UNBUILT in totality, two items
   still RED@HEAD.** `peerDependenciesMeta` (every peer silently required —
   `package.json:559` dead `optionalPeerDependencies`), the DataTable `@vueuse` root leak
   (`DataTable.vue:3` `useElementSize`), the keyframes peer-matrix axis, `supportsPostTask`
   wiring, R4/R6 — none landed. The two RED@HEAD items (`proof:peer-optional`,
   `proof:vueuse-free-root`) are correctness debts that have now survived AS → AT — they
   are CHRONIC and must be the first non-headline AU wave.

## §Chronic vs deferred — for the AU fold

- **CHRONIC (survived ≥1 tranche boundary, RED at HEAD):** `peerDependenciesMeta`/the
  dead `optionalPeerDependencies` field (AS-residual → AT-unbuilt → AU); the DataTable
  `@vueuse` root-barrel leak (same lineage). Both verified RED at HEAD by direct file read.
  The DataTable→`useResizeObserver` swap is the ONE hard W6 ordering edge (W1c §5) and must
  precede `proof:vueuse-free-root` green.
- **DEFERRED-IN-AT (spec-complete, never executed):** the entire blob/WebGL/color headline
  (W2-W5); the dock a11y contract test + strict-templates + reka Tabs rail + rail-indicator;
  the Fraunces slipped ship; `supportsPostTask` wiring; the keyframes peer-matrix; R4/R6.
- **BOOK (named-forward, no bar yet — carry as BOOK, do NOT fold):** Drawer `:native`
  (strongest successor seed, ≥2 firm), dock magnification (`useDockMagnify` ready, 0 firm
  consumers), `/deck`, dark-ergonomics, expand-stagger, pane-VT directional slide,
  `overflow:"clip"` member, typed dock `tier` prop, aurora hue-steering. Per `AT.md
  §Folded ledger BOOK`.
- **KILL (do NOT resurrect):** P5 inner-rounding (user-ruled outer-only), the 4 shipped-DDR
  rows, shadcn-parity, VAL-9, P7, the shared in-shader OKLab path (aurora bakes per-nucleus,
  blob perturbs per-pixel — the shared primitive is the GLSL fn pair, NOT the shader),
  OffscreenCanvas+Worker (SOTA-confirmed wrong for small bg canvases), WebGPU aurora
  (pre-refuted). Per `AT.md §KILL`.

## §The DEC-AT-7 load-bearing seam (must survive into AU verbatim)

The single most important contract AU inherits: **color space is GAMMA at W4, LINEAR at
W5.** The W4 faithful lift paints gamma sRGB (HSV needed no OETF); W5's OKLCh transposition
flips `uBaseColor` to linear AND adds the mandatory `linearToSrgb()` output stage. Left
implicit, the blob ships visibly too-dark (linear default, no OETF) AND the
perceptual-uniformity claim voids (`W0b-A2`, `C6` must-fix #1). The `/color` leaf must
export BOTH `oklchToLinear` (aurora's bake) AND `oklchToGammaRgb` (the blob's gamma exit)
— "one core" binds the MATH SOURCE (value.js), not the return space (W1c §2). This is the
one design decision an AU executor cannot rediscover from the code — it must be carried
forward as a binding must-fix.

## §Cross-repo (inv-16) — name-forward, blocked on the publish

value.js K.W3 (delete the demo blob impls, import the published `/goo-blob` +
`/watercolor-dot`, supply its own `ColorResolver`) is BLOCKED until AU ships the 3.3.0
(now 3.3.0-or-later) publish. The 3.3.0 publish is the constellation unlock and the one
user-domain release leg — outward-facing, confirm-first. No cross-repo edit is owed by AU
until the publish lands.
