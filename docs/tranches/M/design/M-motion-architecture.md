# M — Motion Architecture (the unified mathematical-motion CORE)

**Tranche**: M (ordering ξ′) · **Wave**: M.W9 (CORE) + M.W10 (scroll heroes) · **Authored**: 2026-06-16
**Companion**: `M-design-language.md` (glass/typography/colour) · **Charter**: `../M.md` §9 + §6 inv-34 + §10 motion asks
**Invariant**: inv-34 (motion-proportion floor) — every target is PRM-collapsing, INP-safe, proportion-bounded.

> The signature motion of a Fourier project is **the partial sum visibly converging onto its target** — and fourier computes every quantity that effect needs (`harmonicProgress`, `partial_sums`, the amplitude-sorted spectrum, the precomputed trail) while building it at **ZERO sites**. M collapses **eight hand-rolled rAF loops + two duplicated ping-pong clocks** into ONE three-layer architecture, makes `stores/animation.ts` a pure STATE atom, and ships the convergence-reveal as the brand's signature — all on keyframes.js 4.2's **light tier** (value.js-free, no bundle regression), PRM-honoured and INP-safe by construction.

**This doc is design-spec only.** No source is edited here. The cited symbols are verified against the real sibling sources (keyframes.js 4.2.0 `src/animation/index.ts`, glass-ui 4.0.0 `src/composables/motion/`, value.js 0.12.0 `src/easing.ts`); §0 records the corrections where the synth's assumed names differ from the shipped API.

---

## §0 — API-reality corrections (verified at source, inv-32)

The synth (`design-synth.json`) and `raw-findings.json` named several symbols. Re-verified against the local sibling checkouts; the corrections below are **load-bearing** — author against the *shipped* names, not the assumed ones.

| Assumed (synth / findings) | Shipped reality | Source | Note |
|---|---|---|---|
| keyframes `Animation` (ping-pong via `alternate:true`) — A8-05's proposal | **`RAFPlayback`** (the light managed driver) for the clock; `Animation` is the HEAVY engine behind `loadAnimationEngine()` | kf `src/animation/playback.ts:78`, `index.ts` (light barrel) | A8-05 proposed wrapping the *heavy* engine; the CORE uses the **light** `RAFPlayback` — value.js-free, no engine import. Ping-pong is fourier-owned fold math over the light clock, NOT an `alternate` engine flag. |
| `useViewTransition` (glass-ui composable) | **`startViewTransition` / `navigate` / `supportsViewTransitions`** (functions, `@mkbabb/glass-ui/motion-core`) | gu `src/composables/motion/useViewTransition.ts:127,205,85` | No `useViewTransition` *composable* exists; the export is the `startViewTransition(mutate, {types?, instantUnderReducedMotion?})` function + `navigate()` route convenience. The `view-transition.css` substrate (`.gl-list-item` group recipe) is real. |
| `useSpecular` (the §10 ask) | **`useSpecularTracking`** (`{ specularStyle, onPointerMove }`) | gu `src/composables/glass/useSpecularTracking.ts:44` | The pointer-anchored catch-light SHIPPED at 4.0 (rAF-coalesced, PRM-aware, ONE `getBoundingClientRect`/frame). The §10 `useSpecular` ask is **STRIKE-likely** — re-verify at M.W0; the canvas-anchored variant (synthetic rect) is the still-open net-new. |
| `useCountup` / `AnimatedDigit` | **shipped** — `useCountup` (`src/composables/motion/useCountup.ts`), `AnimatedDigit` (`./animated-digit`) | gu exports | E1-05's "convergence-as-counter" lands on these, not a hand-roll. |
| keyframes `DrawSVG` / `MotionPath` | **shipped but HEAVY** — both ride `loadAnimationEngine()` (value.js-bearing) | kf `index.ts` (HEAVY section), `src/animation/{draw-svg,motion-path}.ts` | E1-02 wants these for epicycle tracing; they are NOT light-tier — adopting them re-introduces the value.js edge. Prefer a light-tier canvas draw-on (§4) unless an SVG sweep is genuinely needed; book the trade explicitly. |
| `useStaggerReveal({ once })` GA-1 ask | **`once` already exists** (default `true`); the gap is the CSS `[data-scroll-reveal]` `view()` recipe re-firing on remount | gu `src/composables/motion/useStaggerReveal.ts:8` | The COMPOSABLE honours `once`; the **native CSS recipe** has no cross-remount latch — that is the real GA-1 net-new (§5, §10). |

**Verified light-tier surface (keyframes.js 4.2.0, value.js-free, static barrel):**
`RAFPlayback` · `SpringProgress` · `SmoothProgress` · `NumericAnimation` · `ElementMorph` · `Timeline`/`ScrollTimeline`/`ManualTimeline`/`createNativeTimeline` · `stagger` · `flip`/`flipShared` · `drag`/`Draggable`/`decay` · `Sequence` · `springLinearStops` · `springTimingFunction` · `resolveEasing`/`toEasing`. (`Animation`/`CSSKeyframesAnimation`/`AnimationGroup`/`animate`/`DrawSVG`/`MotionPath`/presets are HEAVY, behind `loadAnimationEngine()`.)

**Verified glass-ui 4.0.0 motion surface (`@mkbabb/glass-ui/motion-core` + CSS):**
`useRAFLoop` · `useIntersectionPause` · `useScrollProgress` · `useSpring` · `useStaggerReveal` · `useCountup` · `useNumericTransition` · `startViewTransition`/`navigate`/`supportsViewTransitions` · `useSpecularTracking` · `vReveal` directive · CSS recipes `scroll-driven.css` (`.scroll-progress`, `[data-scroll-reveal]`) + `view-transition.css` (`.gl-list-item`).

**Verified value.js 0.12.0 easing curves:** `easeInOutSine` · `easeInOutQuad` · `easeInOutCubic` · `easeInOutExpo` · `easeInOutCirc` (`src/easing.ts:110,123,234,246,259`). value.js owns the **curve authority** only; keyframes' `toEasing`/`resolveEasing` is the *boundary* that normalizes them.

---

## §1 — The three-layer architecture

One rule governs which layer owns a motion: **push it as low (as native) as it will go.** A target ascends a layer only when the layer below cannot express it.

```
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ LAYER 1 — CSS-FIRST (the compositor)                                       │
 │   native scroll-driven  ·  View-Transitions  ·  @keyframes / transition    │
 │   When: the motion is a function of SCROLL POSITION, a STATE-SWAP cross-    │
 │   fade, or a self-contained loop with no JS-computed per-frame value.       │
 │   Owns: .scroll-progress, [data-scroll-reveal], ::view-transition(*),       │
 │   .char-stagger, hover/transition micro-motion. Runs OFF the main thread.   │
 ├──────────────────────────────────────────────────────────────────────────┤
 │ LAYER 2 — glass-ui MOTION COMPOSABLES (the Vue reactive seam)              │
 │   useScrollProgress · useStaggerReveal · useSpring · useIntersectionPause  │
 │   · useCountup · useNumericTransition · useSpecularTracking · startView-   │
 │   Transition. When: Layer 1 needs a feature-detected JS FALLBACK, OR a      │
 │   reactive number/flag must drive Vue template state, OR a rAF loop needs   │
 │   viewport/visibility gating. These are the dual-path SINGLE WRITER: on a   │
 │   supporting engine they go inert and Layer 1 owns the axis.                │
 ├──────────────────────────────────────────────────────────────────────────┤
 │ LAYER 3 — keyframes.js 4.2 LIGHT PRIMITIVES (the imperative engine)        │
 │   RAFPlayback · SpringProgress · SmoothProgress · NumericAnimation ·       │
 │   Sequence · stagger · resolveEasing/toEasing. When: the motion drives a    │
 │   <canvas> (no DOM/CSS target), an ORCHESTRATED multi-phase sequence, or a  │
 │   physics spring whose value the canvas reads each frame. ONE rAF owner.    │
 └──────────────────────────────────────────────────────────────────────────┘
   value.js 0.12 — orthogonal CURVE/COLOUR authority. Owns easing curves
   (easeInOut*) consumed through keyframes' toEasing boundary, and per-frame
   colour interpolation. NEVER owns a clock or a DOM target.
```

**The layering rule, stated as a decision procedure:**

1. **Is it driven by scroll position?** → Layer 1 (`scroll()`/`view()` timeline), with Layer 2 (`useScrollProgress`/`useStaggerReveal`) as the feature-detected fallback ONLY.
2. **Is it a DOM state-swap (list reorder, route morph, layout change)?** → Layer 1 View-Transitions via Layer 2's `startViewTransition` wrapper (instant fallback + `finished` for focus routing).
3. **Is it a self-contained DOM loop / hover micro-motion?** → Layer 1 `@keyframes`/`transition` (PRM-gated in CSS), no JS.
4. **Does it animate a `<canvas>` (no CSS target)?** → Layer 3. The epicycle clock, the convergence playhead, the curve lerp, the hover-scale spring all live here because there is no DOM node to hand CSS.
5. **Is it an orchestrated multi-phase sequence (settle-out → morph → settle-in)?** → Layer 3 `Sequence` over `NumericAnimation`.
6. **Does a reactive Vue number/flag need to fall out?** → Layer 2 wraps the Layer-3 primitive (`useSpring` wraps `SpringProgress`; `useScrollProgress` wraps the timeline). Bind the ref; never re-roll the loop.

**Why fourier is canvas-heavy and thus Layer-3-heavy.** Most apps live in Layers 1–2. Fourier's signal surfaces are `<canvas>` (BasisCanvas epicycles, ConvergencePlot, FrequencyGraph) — there is no DOM node per epicycle to drive with CSS. So fourier's *distinctive* motion (the convergence-reveal, the playhead) is irreducibly Layer 3, and the discipline is: **ONE rAF owner per scene** (`RAFPlayback`), never a per-effect hand-rolled loop. The chrome (paper hero, section reveals, route morphs, reading progress, specular) is Layers 1–2 and must NOT descend to a hand-rolled rAF.

---

## §2 — The rAF inventory → retirement map

Every `requestAnimationFrame` animation call-site at HEAD, its replacement primitive, the layer, and the idiom. **inv-34 close-gate: zero rAF *animation* call-sites remain** (layout-sync measure loops EXEMPT + doc-marked). Citations are `file:line` at HEAD.

| # | Site (file:line) | What it does | Replacement | Layer | Idiom |
|---|---|---|---|---|---|
| 1 | `stores/animation.ts:51-82` (`startLoop`/`stopRAF`/`tick`) | The epicycle ping-pong clock — manual `rafId`, closure `startTime`, `cycle%2` fold, IO visibility gate, scrub-pause, speed-restart watch. **The MEMORY-flagged legacy** (comment at `:46-50` admits the prior keyframes graph was ripped out leaving this the sole driver). | **`RAFPlayback`** (the shared driver, §3) + **`useIntersectionPause`** (the gate). Store becomes a pure STATE atom (`t`, `playing`, `speed`, `easedT`). | 3 (+2 gate) | `playback.loop(now ⇒ …)` ping-pong fold; visibility parks the clock via `useIntersectionPause`, not a manual ref-count. |
| 2 | `equation/ConvergencePlot.vue:55-74` (`startLoop`/`stopLoop`) | A **verbatim duplicate** of #1's ping-pong clock — own `rafId`, `loopStartTime`, identical `cycle%2===0?frac:1-frac` math. Auto-plays on mount (`:324`), **no IO gate** (E5-08: burns CPU off-screen). | **`useFourierPlayhead`** (§3) — the ONE shared clock. The duplicate clock + the ungated off-screen loop both DELETED. | 3 (+2 gate) | Consume the shared playhead's `t`; `useIntersectionPause` on the plot container. |
| 3 | `equation/ConvergencePlot.vue:84-94` (`draw()` resize) | **Resizes the canvas every frame at 60fps** — unconditional `getBoundingClientRect()` + `canvas.width=…` per draw (E5-03). | Split resize off the draw path: a `ResizeObserver` writes the backing size; `draw()` only paints. (Mirror `BasisCanvas`'s `useCanvasSetup`.) | — (correctness, not motion) | One measure on resize, not per frame. Kills a hot-path layout read (inv-34 INP rule). |
| 4 | `equation/composables/useCurveTransition.ts:42-53` (`startTransition`) | A 500ms eased lerp of curve data on function-change — raw `rafId`, `performance.now()`, `easeInOutSine` called directly. | **`SmoothProgress`** (light) or `RAFPlayback.play(500, onTick, {respectReducedMotion:true})`. Easing via keyframes `toEasing(easeInOutSine)`. | 3 | A one-shot duration progress; PRM snap built into `RAFPlayback.play`'s `respectReducedMotion`. |
| 5 | `visualization/composables/useCanvasHover.ts:52-63` (`updateHoverScale`) | Hand-rolled exponential smoother `currentScale += diff*0.12` per frame toward `targetScale`. | **`SpringProgress`** (light) — `new SpringProgress({response, dampingFraction, respectReducedMotion:true})`, read `value` per frame; or **`useSpring`** (Layer 2) if a reactive ref is wanted. The magic `0.12` factor dies. | 3 (or 2) | `spring.target = hoverScale`; `playback.drive(spring, redraw)` — the driver auto-stops on settle. |
| 6 | `visualization/composables/useCanvasHover.ts:67-82` (`startShimmer`/`shimmerTick`) | A perpetual redraw loop while a label is hovered — re-paints the canvas every frame to re-sample the wall-clock shimmer. | Fold into the **single scene playhead** (when `playing`, the scene already redraws). The shimmer phase comes from the scene clock's `now`, not a private loop. When paused+hovered, ONE `RAFPlayback.loop` owned by the scene, not the hover composable. | 3 | No second rAF — the shimmer is a phase read off the shared clock (§4 shimmer rule). |
| 7 | `composables/useFourierMorph.ts:122-143` (`createTweenAnimation`) | Builds a **HEAVY** keyframes `Animation` (`useWAAPI:false`, `addFrame('0%',{v:'0px'})`) purely as a 0→1 progress ticker; three sequential `await new Promise()` phases (settle-out / morph / settle-in). | **`Sequence`** (light) over **`NumericAnimation`** — one master clock, three positioned entries; phases chain declaratively. value.js easing via `toEasing`. The heavy engine + the string-px hack DELETED. | 3 | `new Sequence().add(settleOut).add(morph).add(settleIn)` then `seek(masterClock)`; PRM via per-entry collapse. |
| 8 | `equation/lib/golden-shimmer.ts:11` + `epicycles.ts:280` | Two wall-clock oscillators `0.85+0.15*sin(now/200)` and `0.2+0.1*sin(now/300)` — **no PRM guard** (E1-03), re-sampled on every redraw even when `playing===false`. | Drive `now` from the **shared playhead clock**; gate amplitude to 0 under PRM (a single cached `matchMedia`). When paused, no redraw fires, so no pulse. | 3 (+ PRM gate) | A pure function of the scene clock's phase; PRM collapses the oscillation amplitude to its terminal mean. |
| 9 | `paper/PaperView.vue:159-185` (`writeProgress`/`onProgressScroll`) | A rAF-coalesced reading-progress writer behind a hand-rolled `CSS.supports('animation-timeline','scroll()')` gate. | **`.scroll-progress`** CSS recipe (Layer 1, already the primary) + **`useScrollProgress`** (Layer 2) as the feature-detected fallback. The hand-rolled `@supports` gate + manual rAF DELETED — the composable owns the dual-path decision. | 1 (+2 fallback) | Already dual-path-correct in spirit; adopt the shipped composable so the gate logic isn't fourier-local. |
| 10 | `router/index.ts:124-174` (`startViewTransition` + double-rAF) | Hand-rolled `document.startViewTransition` wrap + double-`requestAnimationFrame` release; ad-hoc `@supports(view-transition-name)` at `VisualizationView.vue:307-313`. | **`startViewTransition(mutate, {types})`** / **`navigate()`** (Layer 2) + the **`view-transition.css`** `.gl-list-item` substrate. The instant fallback + `finished` (focus routing) come for free. | 1 (+2 wrapper) | `await navigate(() => router.push(to), {types:['forward']}).finished` — no double-rAF, PRM instant-path. |
| 11 | `visualization/composables/usePointDrag.ts:1-67` | Bespoke pointer-capture state machine — no velocity, no fling, no spring settle (E3-08). | **`Draggable`** (light) — `drag()`/`Draggable` ride `SpringProgress` for fling+settle. (Optional polish, not inv-34-blocking; the drag is interaction, not autonomous motion.) | 3 | `new Draggable(el, {axis, onDrag})` with spring fling. |
| — | `paper/useScrollNavigation.ts:89,106,133-164,187` (teleport correction loop) | **EXEMPT.** A layout-stabilization loop that re-measures section offsets after a virtual-window teleport until stable (≤20 frames). This is **layout-sync, not animation** (E6-11). | **KEEP** as platform scroll. **Doc-mark** `// inv-34 EXEMPT: layout-sync measure loop, not a motion target` at each rAF site. | — | Category-error to migrate to a motion primitive; the charter §11.7 names this explicitly. |
| — | `paper/PaperView.vue:171` (`progressRaf` read) | Subsumed by #9's `useScrollProgress` adoption (the same scroll read). | Folds into #9. | 1/2 | — |

**Net effect:** sites 1–10 retire to the three-layer architecture (8 hand-rolled rAF loops + 2 ping-pong clocks → ONE `RAFPlayback`-backed playhead + composables); site 11 is optional polish; the teleport loop is the SOLE surviving rAF, doc-marked EXEMPT. **Net code DECREASES** (the magic constants, the duplicate clocks, the hand-rolled gates all delete).

---

## §3 — The `useFourierPlayhead` primitive

**The problem it solves:** the epicycle scene (`stores/animation.ts`) and the convergence plot (`ConvergencePlot.vue`) run **two identical hand-rolled ping-pong clocks** (#1, #2 above). The plot's clock is *ungated* — it burns CPU when scrolled off-screen (E5-08). The store's clock is the MEMORY-flagged legacy. M extracts ONE shared clock.

**Shape** — `web/src/composables/useFourierPlayhead.ts` (new; Layer 3 over the light `RAFPlayback`):

```ts
import { RAFPlayback } from "@mkbabb/keyframes.js";           // LIGHT — no value.js edge
import { useIntersectionPause } from "@mkbabb/glass-ui/motion-core";
import { toEasing } from "@mkbabb/keyframes.js";              // easing BOUNDARY
import { easeInOutSine } from "@mkbabb/value.js";             // CURVE authority

interface FourierPlayheadOptions {
  durationMs: MaybeRefOrGetter<number>;   // ms per full cycle (per-scene; epicycle 20s, plot 2–12s)
  speed?:     MaybeRefOrGetter<number>;   // playback rate multiplier
  pingPong?:  boolean;                    // true: forward↔reverse fold; false: loop 0→1
  easing?:    TimingFunction;             // applied to t → easedT; default toEasing(easeInOutSine)
  target:     MaybeRefOrGetter<Element | null>;  // the canvas/container for the IO gate
  onFrame?:   (t: number, easedT: number) => void;  // per-frame draw hook (canvas paint)
}

interface FourierPlayhead {
  t:        Readonly<Ref<number>>;   // raw phase in [0,1]
  easedT:   Readonly<Ref<number>>;   // eased phase — the value the renderer reads
  playing:  Readonly<Ref<boolean>>;  // user intent
  isPaused: Readonly<Ref<boolean>>;  // visibility-parked (from useIntersectionPause)
  play():   void;
  pause():  void;
  toggle(): void;
  seek(normalizedT: number): void;   // scrub
  reset():  void;
  dispose(): void;
}
```

**Contract:**

1. **ONE `RAFPlayback` per playhead instance.** The clock advances via `playback.loop(now ⇒ stillRunning)` (the self-rescheduling light driver, `playback.ts:228`). The ping-pong fold (`cycle%2===0 ? frac : 1-frac`) is fourier-owned math over the light clock — it is NOT a keyframes engine flag (§0 correction; the light tier has no `alternate`). `easedT = easing(t)` is computed once per frame; the renderer reads `easedT`, never re-eases.

2. **Visibility gating is delegated, not hand-rolled.** `useIntersectionPause(target, { pause: playback.stop, resume: rearm })` parks the *clock* (not the intent) when the target leaves the viewport or the document hides (`useIntersectionPause.ts:49`). This is the one place the I.γ off-screen-park semantics live — it now covers the convergence plot too (closing E5-08). `playing` stays the user-intent flag; `isPaused` is the derived visibility state. **On resume, phase is preserved** (the fold re-anchors `startTime` from the current `t`, exactly as `animation.ts:63` does today) — charter §11.7's "retain exact phase on resume" gate.

3. **PRM collapse.** Under `prefers-reduced-motion: reduce`, the playhead does **not** spin: it snaps to a representative terminal phase (`t=1`, the full series) and fires `onFrame` once. (`RAFPlayback.play` has `respectReducedMotion` built in at `playback.ts:175`; the `loop` path reads a single cached `matchMedia` and never arms.) The scene renders fully-converged, static. inv-34(a).

4. **Two consumers, one heartbeat.**
   - **Epicycle scene** (`stores/animation.ts`): the store **becomes a thin STATE atom** — it holds `t/playing/speed/easing/easedT/scrubbing` and exposes `play/pause/seek/…`, but the rAF body, the manual `visibleCanvases` ref-count, and the speed-restart watch all move into `useFourierPlayhead` (the IO gate replaces the ref-count). `BasisCanvas.vue` registers its container as the playhead target; `setCanvasVisible` is deleted (the composable observes directly).
   - **Convergence plot** (`ConvergencePlot.vue`): instantiates a *scoped* playhead with its own `durationMs` (the per-harmonic-count `animDuration`, `:38`) — a distinct cadence from the epicycle scene, so a *local* playhead is correct, but it is the SAME primitive (no second hand-rolled clock). Its `onFrame` calls `draw()`; the per-frame resize (#3) is split out.

5. **Scrub interop.** `seek(t)` sets the phase and (if playing) re-anchors the fold; `startScrub`/`endScrub` stop/rearm the `RAFPlayback`. No second pause path.

**What dies on adoption:** `animation.ts:51-82` (the loop), `:43-44,99-106` (`visibleCanvases`/`setCanvasVisible`), `:138-143` (speed-restart watch); `ConvergencePlot.vue:55-74` (the duplicate clock), `:323-326` ungated auto-play. The store shrinks to ~40 lines of pure state.

---

## §4 — The convergence-reveal signature

**The brand's one memorable motion.** A Fourier series is *defined* by partial sums converging onto a target; the J `WC-design-motion.md §2` named "the series converging onto the title" as THE reveal and noted the orchestration tier is used at zero sites. The renderers already compute the curve — `harmonicProgress(idx, total, globalEasedT)` (`equation/lib/harmonics.ts:59`) returns each harmonic's `[0,1]` accumulation weight; `partial_sums` per level ride the converged entity. M wires these into a **first-paint reveal** and books the canonical preset to glass-ui.

### §4.1 — The motion, defined

**Trigger:** every canvas/spectrum **first-paint** — the first time data arrives for a given visualization (BasisCanvas data-watcher `BasisCanvas.vue:378-394`; ConvergencePlot mount `:323`; spectrum render). NOT on every reactive tick (that is the steady playhead, §3).

**Three composed gestures, orchestrated by ONE `Sequence` (light, Layer 3):**

1. **Series settle (the partial sum onto target).** A spring-driven sweep of the *accumulation phase* `revealT: 0 → 1` over `~700–900ms`, fed into the existing `harmonicProgress(idx, total, revealT)` so harmonics light up in order: the DC term first, then `n=1, 2, …` each settling onto the target as `revealT` crosses its window. The renderer ALREADY reads this curve (`ConvergencePlot.vue:300-305`); the reveal simply drives `revealT` with a spring instead of holding it at the playhead value. Curve: `SpringProgress({response:0.45, dampingFraction:0.85, respectReducedMotion:true})` — a touch of overshoot reads as the Gibbs-ringing "settle," on-brand.

2. **Harmonic-accumulation stagger (spectrum bars rise in amplitude order).** `CoefficientsSpectrum.vue` / `FrequencyGraph.vue` bars rise from 0 → amplitude, staggered by amplitude rank (largest first). Use **`stagger`** (light, a pure delay generator — `index.ts`) to compute per-bar onset, each bar a `SmoothProgress` height tween; OR the CSS `[data-scroll-reveal]`-style per-element view recipe if the bars are DOM. Stagger step bounded (`≤ 40ms`/bar, capped total `≤ 600ms` — inv-34 proportion ceiling).

3. **Draw-on (the trace draws itself).** The epicycle trail / convergence curve paints progressively along arc-length rather than snapping. On `<canvas>` this is a light-tier param: drive `drawProgress: 0→1` with the same `Sequence` clock and stroke only `points.slice(0, floor(drawProgress*N))`. (DrawSVG/MotionPath are the SVG equivalents but are HEAVY — §0; prefer the canvas slice for the no-value.js-edge path. If FourierMorphSvg's `<path>` genuinely wants a stroke sweep, that single site may opt into the heavy engine, booked explicitly.)

**Orchestration:** ONE `Sequence` positions the three gestures (`series settle` at `0`, `stagger` at `+=100`, `draw-on` co-timed with settle), seeking a single master clock from one `RAFPlayback`. Total reveal ≤ ~900ms so it never delays first comprehension.

### §4.2 — PRM collapse-to-terminal

Under `prefers-reduced-motion: reduce`, the reveal **does not run**: the canvas paints its **terminal state in one frame** — full series, all bars at amplitude, full trail. Mechanism: `SpringProgress`/`SmoothProgress`/`NumericAnimation` all carry `respectReducedMotion` (snap to final, resolve next microtask — `playback.ts:175`, `spring.ts`); the `Sequence` collapses each entry. The information is identical (the converged figure); only the motion is conditional. inv-34(a) — and crucially NOT a hand-rolled `@media` carve (which inv-3 retires), but the primitive's own PRM gate.

### §4.3 — The glass-ui ask: `convergence-reveal` preset

Booked to `ADOPTION-ASKS.md` (§10 of the charter). The canonical "partial-sum settle" motion preset — a spring + orchestration descriptor with PRM-collapse-to-terminal — belongs in the shared motion layer because **fourier viz + equation want the identical accumulation curve**, and the grammar ("a series settling onto its target") generalizes to any progressive-accumulation reveal (value.js palette-ramp build, a metric-stack count-up cascade). fourier authors the consumer thin (drives `revealT` into its own `harmonicProgress`); glass-ui owns the preset's spring constants + the orchestration timing + the PRM contract. Until shipped, fourier composes it locally from `SpringProgress` + `Sequence` + `stagger` (all light, already pinned at M.W1).

---

## §5 — Scroll-driven heroes + View-Transitions (M.W10)

All chrome motion — reading-respecting, PRM-auto-disabled, off-main-thread. **Bump-gated** (glass-ui 4.0 recipes + composables). The home/landing host is the §4.1-charter user decision (graft on PaperView header [default] vs a real `/` route).

### §5.1 — The paper hero char-stagger entrance

**Target:** `PaperView.vue:352-358` — the masthead `<h1>` (`An Introduction to ℱourier Analysis`), today an inert `cm-serif text-4xl`, zero entrance (B6-02).

**Motion:** a **PRM-gated, ONCE-disciplined char-stagger** — per-glyph fade+rise cascade on mount only. Layer 1 owns the cascade via the shipped `.char-stagger > .char { animation-delay: calc(var(--char-index,0)*30ms) }` recipe (glass-ui `typography.css`); the **glyph-split + a11y labelling** is the gap. **Book `useCharStagger`/`SplitChars`** (§10): wraps glyphs in spans, sets `--char-index`, preserves the accessible name (`aria-label` on parent, `aria-hidden` on shards) + selection. Until it ships, fourier hand-rolls the split scoped to the hero title only, `once` (never on the virtual-window remount — keyed in a `Set<string>`), total ≤ 600ms. PRM → single fade, no cascade. Hero ambition bounded to `text-display-3/4` (B6 open Q 2 — restraint over poster-grade on a *reading* surface).

### §5.2 — Scroll-driven section reveals + the ONCE-discipline

**Target:** the paper section *headers* only (`.section-header--chapter`) — **not body paragraphs** (reading primacy: body must be legible the instant it scrolls in). Adopt `[data-scroll-reveal]` (`scroll-driven.css`) for a gentle fade+lift on the chapter title via the `view()` timeline (compositor, PRM-auto-off).

**The load-bearing hazard (E2-05, B6-03):** the paper has a **virtual/teleporting section window** — `useVirtualSectionWindow` mounts/unmounts sections (overscan 240/720px), `content-visibility:auto` defers them, and `useScrollNavigation` *teleports* far jumps. The native `[data-scroll-reveal]` `view()` recipe **re-fires every time a section re-enters the warm window** → flicker. The `useStaggerReveal` *composable* honours `once` (default `true`, `useStaggerReveal.ts:8`), but the **CSS recipe has no cross-remount latch** (§0).

**The fix:** **book `data-scroll-reveal` once-discipline** to glass-ui (§10) — a `[data-scroll-reveal="once"]` variant (or `useStaggerReveal({ once, key })`) that keys reveal-state by a stable section id in an external `Set`, so a remounted section reads as already-revealed and renders at end-state with **no** re-animation. Until it ships, fourier scopes the reveal header-only with a fourier-local `Set<string>` keyed by section id (a remounted section's header reads "already revealed"). The teleport stable-frame loop is EXEMPT (§2, doc-marked) and must never have a reveal hung off it.

### §5.3 — Reading progress

`.scroll-progress` (Layer 1, `scroll()` timeline) is **already the primary**; M deletes the hand-rolled `@supports` gate + manual rAF (#9) and adopts `useScrollProgress` as the sole feature-detected fallback. Optional: tint the bar by the active section hue via a `--scroll-progress-color` knob (booked, GA-3 in B6) — a one-liner once glass-ui exposes the var; today a consumer concern.

### §5.4 — Parallax math-lattice

**Hero-region ONLY** (B6 open Q 3 — confirm hero-only; a full-page parallax fights reading). A faint math lattice (sparse harmonic sine-wave SVG or `repeating-linear-gradient` grid at ~3–5% opacity) behind the hero band, parallaxed gently via a `scroll()`/`view()` timeline (Layer 1, compositor). Never under body text. PRM → static.

### §5.5 — View-Transitions

Adopt `startViewTransition(mutate, {types})` / `navigate()` (Layer 2) + the `view-transition.css` `.gl-list-item` substrate, retiring the router's hand-rolled wrap + double-rAF (#10) and `VisualizationView`'s ad-hoc `@supports`. Gallery row reorders / publish-state swaps tag each row `view-transition-class: gl-list-item; view-transition-name: row-<id>` (unique-per-state mandatory). Route morphs use `navigate(go, {types:['forward'|'back']})` — `instantUnderReducedMotion` is pinned true for navigation, and `await …finished` routes focus (the a11y mandatory). The W10 diff-viewer's row enter/leave composes the same group recipe.

---

## §6 — The proportion & PRM & INP floor (inv-34, made concrete)

inv-34 has three clauses; here each is operationalized with the current gaps and the binding rules.

### §6.1 — PRM (the three current gaps, from E5/E1)

Every animation collapses to its static terminal state under `prefers-reduced-motion: reduce` — via the **platform/glass-ui/keyframes PRM-aware primitive**, NOT a hand-rolled `@media` carve (that carve is dead-code under inv-3). The three open gaps M closes:

1. **The two canvas wall-clock oscillators (E1-03):** `golden-shimmer.ts:11` (`0.85+0.15*sin(now/200)`) and `epicycles.ts:280` (`0.2+0.1*sin(now/300)`) pulse forever, **no PRM guard**, and re-sample even when `playing===false`. → drive `now` from the shared playhead, gate amplitude to its terminal mean under PRM (one cached `matchMedia`), and the pause-state never redraws so the pulse stops.
2. **`ImageUpload.vue:159` rainbow-slide** (`animation: rainbow-slide 1.4s linear infinite`) — no PRM block (E5-05). → add the PRM media guard (or move to a glass-ui recipe that carries it).
3. **`ContourEditorCanvas.vue:324-330` golden-shimmer** hover animation — no PRM guard (E5-06). → same.

(The only existing PRM handling in the whole codebase is `GalleryMarquee.vue:129-133` — E3-16. After M, PRM is a property of the primitives, not a scattered per-site carve.) Every Layer-3 site inherits PRM from `respectReducedMotion` (`RAFPlayback.play`, `SpringProgress`, `SmoothProgress`, `NumericAnimation`); every Layer-1 site inherits it from the recipe's outer `@media (prefers-reduced-motion: no-preference)` gate.

### §6.2 — INP-safe (the hot-path rules)

The interaction-driven path must never block the main thread:

- **Compositor-only properties on animated targets.** Animate `transform` / `opacity` / `filter` — NEVER layout-triggering properties on a per-frame path. **`AnimationControls.vue:163-176` play-btn rainbow-drift** animates `background-position` on a `300% 300%` pseudo-element under a `backdrop-filter` parent (E5-10) — the compositor can't promote it; low-end mobile drops frames. → move to a compositor `filter`/`transform` drift (charter §4 M.W9 names this).
- **No per-frame `getBoundingClientRect()` on a hot path.** `ConvergencePlot.vue:84-94` resizes (a forced layout read) every frame (#3) → split to `ResizeObserver`. `useSpecularTracking` already does this correctly (ONE `getBoundingClientRect` per rAF-coalesced frame, `useSpecularTracking.ts` flush) — the pattern to mirror; the canvas-anchored-overlay ask (§10) must preserve it (a synthetic rect, not a per-frame measure).
- **Yield on heavy per-frame work.** Where a single frame's canvas work would block input, `useRAFLoop`'s `yieldToMain()` (`useRAFLoop.ts`, native `scheduler.yield()` fallback) is the INP lever. (Fourier's per-frame canvas work is bounded; flagged for the W11 INP measurement, not a blind adoption.)
- **Off-screen parking is mandatory, not optional.** Every autonomous loop is gated by `useIntersectionPause` (§3) — a loop running off-screen is an INP/battery defect (E5-08's ungated ConvergencePlot is the live instance).

### §6.3 — The proportion ceiling

The user's standing "audacious but not gaudy" directive, made numeric:

- **Hover/active scales bounded** (`useCanvasHover` target ≤ ~1.15×; the spring overshoot ≤ ~1.05× of target).
- **Stagger steps capped** (`≤ 40ms`/element, total reveal `≤ 600ms` for chrome, `≤ 900ms` for the convergence signature) so motion never delays comprehension.
- **Hero typographic ambition restrained** to `text-display-3/4` on the reading surface (not `display-mega`), per B6.
- **Reveal-once** — the convergence signature fires at *first-paint*, not on every reactive tick (the steady playhead is the only perpetual motion, and it parks off-screen).
- **One amber/one focal pop per pane** (composes with the design-language doc's accent rule) — motion draws the eye to ONE thing per surface, not many.

---

## §7 — Coverage map (charter §4 / §10 / §12 ⇄ this doc)

| Charter item | Section here |
|---|---|
| M.W9 — collapse 8 rAF loops + 2 clocks into ONE three-layer architecture | §1, §2 |
| M.W9 — `useFourierPlayhead` shared by epicycle canvas + ConvergencePlot | §3 |
| M.W9 — `animation.ts` → pure STATE atom over `RAFPlayback` + `useIntersectionPause` | §3 (contract 4) |
| M.W9 — convergence-reveal signature at every canvas first-paint | §4 |
| M.W9 — transpose useFourierMorph→Sequence/NumericAnimation, useCurveTransition→SmoothProgress, useCanvasHover→SpringProgress | §2 (#4,#5,#7) |
| M.W9 — scroll-driven + View-Transitions adopt glass-ui 4.0 recipes | §5 |
| M.W9 — ConvergencePlot per-frame resize fix | §2 (#3), §6.2 |
| M.W9 — close the 3 PRM gaps; unify easing on `resolveEasing`+spring twins; play-btn drift→compositor | §6.1, §6.2 |
| M.W10 — paper hero char-stagger (SplitChars ask), scroll reveals + once-discipline, reading-progress, parallax lattice | §5.1–§5.4 |
| §6 inv-34 (motion-proportion floor) | §6 (whole) |
| §10 asks — `convergence-reveal` preset, `useCharStagger`/`SplitChars`, `data-scroll-reveal` once-discipline, `useSpecular`(→`useSpecularTracking`, STRIKE-likely), `canvas-anchored-overlay` | §4.3, §5.1, §5.2, §0, §6.2 |
| §12 gate 11 — zero rAF animation call-sites; playhead shared; signature; VT/scroll adopted; PRM closed | §2, §3, §4, §5, §6 |
| paper teleport measure-loop EXEMPT (doc-marked) | §2 (last row), §5.2 |
```
