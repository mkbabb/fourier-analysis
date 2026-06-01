# Modern-Web Posture Audit — keyframes.js

**Run:** 2026-06-01-modern-web · **Lens:** Chrome `modern-web-guidance` v0.0.170 (on-disk corpus, 12 categories)
**Analyst mode:** READ-ONLY (no edits to the target repo)

---

## Preamble

| Field | Value |
| :--- | :--- |
| **Repo** | `/Users/mkbabb/Programming/keyframes.js` (`@mkbabb/keyframes.js` v2.1.1) |
| **What it is** | A general-purpose JS animation engine + Vue 3 demo (keyframes.babb.dev). Parses standards-compliant CSS `@keyframes`, interpolates anything (DOM, objects, data); ships spring physics, scroll timelines, element morphing, WAAPI delegation. |
| **Stack** | TypeScript (ESM, `type: module`, node ≥22), Vue 3.5 (peer), Vite 8, Tailwind v4, reka-ui primitives, KaTeX/Monaco/Three in the demo. Core lib has zero runtime deps beyond `@mkbabb/parse-that` + `@mkbabb/value.js`. |
| **Shared layer** | `@mkbabb/glass-ui` **v3.0.0** (consumed `file:../glass-ui`); 6+ sibling consumers (bbnf-buddy, speedtest, value.js, fourier, glass-ui worktrees). Glass-ui owns the dialog/popover/glassmorphism/motion-token surface. |
| **Frontend dir** | `src/animation/` (core engine, 4.6k LoC) + `demo/` (Vue showcase app). |
| **Headline** | This is an unusually modern codebase. It already (a) emits native CSS `linear()` spring curves from its own solver — and glass-ui regenerates its `--spring-*` tokens from that helper; (b) delegates eligible animations to WAAPI for compositor-thread playback; (c) honors `prefers-reduced-motion` across every motion primitive; (d) ships a sophisticated Vite build (manualChunks for Monaco/Three, deferred lazy CSS, critical-CSS inline). The drift is concentrated in **two public APIs that reimplement platform features now native**: the JS `ScrollTimeline` (vs `animation-timeline: scroll()/view()`) and `ElementMorph`'s combined `transform` string (vs individual transform properties + View Transitions). |

---

## (1) ALREADY-MODERN — do not regress

Grouped by guidance category.

### user-experience / physics-based-easing
- **`springLinearStops()` emits native CSS `linear()`** — `src/animation/springLinearStops.ts:46-73`. Samples the second-order ODE solver and produces `linear(0, 0.234 4.17%, …, 1)` strings that honor overshoot (`ζ<1`) natively. This is exactly the guide's prescribed path (`physics-based-easing`: "Use a timing function from an external library … to convert a JS easing into the `linear()` syntax"). glass-ui's `--spring-smooth`/`--spring-snappy` tokens (`glass-ui/src/styles/tokens.css:113-137`) are regenerated from this helper — the ecosystem already bridges JS springs → compositor-cheap CSS easing.
- **`springTimingFunction()`** (`src/animation/springTimingFunction.ts:60`) gives the same solver as a pure `(t)=>number` for code paths that can't consume a `linear()` string — correct division of labor.

### user-experience / accessibility — reduced motion
- **`prefers-reduced-motion` honored at the primitive layer** — `src/animation/smooth.ts`, `numeric.ts`, `spring.ts` all gate motion on the media query (mirrored in glass-ui's `composables/motion/*`). The motion system degrades gracefully without per-component opt-in.

### performance — WAAPI / compositor offload
- **WAAPI delegation with a real eligibility gate** — `src/animation/waapi.ts:40-97`. `isWAAPIEligible()` checks for DOM targets, default renderer, uniform easing, no computed units, no color lerp; eligible animations run on the compositor via `Element.animate()` (`playWAAPI`, `waapi.ts:185`). Single source of truth, no silent fallback. This is the platform-native fast path for transform/opacity animation.

### performance — Critical Rendering Path & code-splitting
- **Critical-CSS inline + non-blocking font load** — `demo/app/index.html` self-hosts Fira Code via glass-ui, loads Instrument Serif with `media="print" onload="this.media='all'"` (the guide's exact "defer non-critical CSS" pattern), `preconnect`s to Google Fonts, and syncs dark mode before first paint to kill FOUC.
- **Aggressive route/vendor chunking** — `vite.config.ts:221,253-266`: `manualChunks` splits `vendor-monaco`/`vendor-three`/`vendor-prettier`/`vendor-highlight`/`html2canvas`; a `deferLazyCSSPlugin` + `criticalCSSPlugin` keep Monaco's CSS off the critical path. Matches `performance` §JavaScript Code-Splitting precisely.
- **LCP image is trivially small** — `assets/cube.png` is 6.5 KB; no heavy hero to prioritize.

### css / css-layout — modern selectors & layout
- **Container queries in use** — `demo/@/styles/utils.css`, `demo/@/components/custom/animation-controls/controls/AnimationVisualizer.vue`, and broadly across glass-ui (`instrument-rail.css`, `GlassDock.vue`, `MetricStack.vue`). Fluid, breakpoint-free scaling per `css-layout`.
- **`:has()` for child-state styling** — glass-ui `TableHead.vue`/`TableCell.vue`/`ScrubberTimeline.vue` — parent styling driven by child state without JS class juggling (`css` §3).

### user-experience — SPA scene caching
- **`Transition > KeepAlive > Suspense > async` nesting** — `demo/app/App.vue:113-119`. KeepAlive caches up to 3 resolved scenes so returning to Monaco/Three scenes doesn't re-evaluate lazy chunks — the spirit of `faster-spa-view-transitions` (preserve DOM state instead of rebuild).

---

## (2) DRIFT — obsolete / ad-hoc patterns a guide now modernizes

Grouped by category. Each row maps to a guide id with `file:line`.

### user-experience / scroll-driven animation
- **`ScrollTimeline` samples `window.scrollY` in JS** — `src/animation/timeline.ts:154-171` (public API, documented `README:366-382`). It computes progress as `scrollY / (innerHeight * threshold)`, then runs every consumer's `tick()` on rAF with a JS smoother. This is the canonical pattern that `scroll-progress-indicator` / `scroll-entry-exit-effects` / `scrollytelling` now do declaratively with `animation-timeline: scroll()` / `view()` — entirely off the main thread, no rAF, no scroll listener.
  - **Impact:** perf (every scroll-linked animation is main-thread; competes with INP). · **Effort:** L (it's a public class with a smoother/easing pipeline — modernization is additive, not a rip-out).
  - **Nuance:** the lib's value prop is *off-DOM* progress (animate non-DOM data on scroll), which native scroll-timelines can't do. So the drift is narrow: for the DOM-element case the README advertises, native is strictly better. See Opportunity O3.

- **`useScrollFade` — JS scroll listener + manual class toggle** — `demo/@/components/custom/animation-controls/composables/useScrollFade.ts:104` attaches a `scroll` listener and toggles `scroll-fade-top/bottom/both` classes to drive edge fade masks. A scroll-driven CSS animation (`animation-timeline: scroll(self)` with a `mask`/`opacity` keyframe) does this with zero JS and zero per-frame Vue reactivity.
  - **Impact:** perf/dx · **Effort:** M (the resize-observe half still needs JS; only the scroll half collapses to CSS).

### user-experience / individual-transform-properties
- **`ElementMorph` writes a combined `transform` string** — `src/animation/morph.ts:89,107`: `` `translate(${x}px,${y}px) scale(${sx},${sy})` ``. Per `individual-transform-properties`, writing the combined string clobbers any concurrent `transform`/`rotate` and forces the whole chain to be re-specified. Emitting `el.style.translate` + `el.style.scale` (individual properties, Baseline since 2022) lets a morph compose with an independent `rotate`/`transform` animation without conflict — directly relevant for a *composition* library.
  - **Impact:** dx/ux · **Effort:** S (two `style` writes instead of one string; guard with `@supports`).
- **Demo: `useSquareAnimations.ts:21`** writes `` `translate(${x},${y}) scale(${d})` `` to `el.style.transform` — same pattern, same fix.
  - **Impact:** dx · **Effort:** S.

### user-experience / same-document-transitions (View Transitions)
- **Scene swaps use a Vue class-transition, not View Transitions** — `demo/app/App.vue:113` `<Transition name="scene" mode="out-in">` cross-fades scenes via CSS classes. `switchScene` (`demo/app/useSceneRouter.ts:54-58`) just calls `router.push`. Wrapping the route update in `document.startViewTransition()` and assigning `view-transition-name` to the persistent target/dock would morph shared elements (the animation stage, the dock) across scenes instead of hard cross-fading — the exact `same-document-transitions` use case for an SPA.
  - **Impact:** ux · **Effort:** M (Vue Router has a `viewTransition` integration; the `mode="out-in"` plumbing partly conflicts and would simplify).
- **`ElementMorph` is a hand-rolled FLIP** — `src/animation/morph.ts` measures two `getBoundingClientRect()`s and interpolates position+scale. This is precisely what View Transitions automate (the browser captures before/after and morphs). For DOM-to-DOM morphs, `same-document-transitions` removes the manual measure/interp entirely.
  - **Impact:** dx · **Effort:** M (keep `ElementMorph` for non-DOM/offscreen rects; recommend VT for the DOM case in docs).

### performance / image optimization (low-leverage)
- **Dynamic gallery `<img>` lack `width`/`height`/`loading`** — `demo/@/components/custom/animation-controls/timeline/KeyframeTimeline.vue:107` and `demo/@/components/custom/asset-manager/AssetViewport.vue:59` render preview/asset images with no intrinsic dimensions and no `loading="lazy"`. Per `optimize-image-priority` + `performance` §Image, missing dimensions on dynamically-inserted images cause CLS; off-screen previews should lazy-load.
  - **Impact:** perf (CLS) · **Effort:** S. **Note:** these are in-app data-URL/blob previews, not the LCP and not above-the-fold on load → genuinely low-leverage; listed for completeness.

### user-experience / native overlays (lands in glass-ui — see Opportunities)
- **Dialogs/popovers/dropdowns are JS-driven (reka-ui), not native `<dialog>`/popover API** — `demo/@/components/custom/KeyboardShortcutsModal.vue` (`<Dialog>`), `SharePopover.vue` (`<PopoverContent>`), the `@mbabb` `<DropdownMenu>` in `App.vue`. reka-ui hand-rolls focus-trap, top-layer, and light-dismiss in JS where `<dialog>` + popover API + `closedby` + anchor-positioning now do it natively (`light-dismiss-a-dialog`, `platform-controls-dismiss-dialog`, `position-aware-tooltips`, `animate-to-from-top-layer`). This is **glass-ui's** surface, not keyframes.js's — booked as Opportunity O5.
  - **Impact:** a11y/dx · **Effort:** L (cross-repo, ≥2 consumers).

---

## (3) OPPORTUNITIES — high-leverage modern adoptions (ranked)

> "lands-in" = THIS repo (keyframes.js) vs **glass-ui** (shared layer — preferred when ≥2 consumers benefit).

- **O1 — Document & default the `linear()` spring path for DOM consumers.** keyframes.js already *has* `springLinearStops()`, but the README's spring examples drive springs via rAF (`SpringProgress`). For any DOM transform/opacity spring, the modern answer is: generate stops once, set `transition-timing-function: var(--spring)`, done — compositor-thread, no JS loop. Make this the documented default; keep the rAF solver for live-target/non-DOM cases. **Guide:** `physics-based-easing`. **Lands in:** keyframes.js (docs + a tiny `springCSS()` convenience). **Impact:** perf · **Effort:** S.

- **O2 — Emit individual transform properties from `ElementMorph` + the morph presets.** Swap the combined `transform` string (`morph.ts:89,107`) for `el.style.translate`/`el.style.scale` behind `@supports (translate:0)`. Lets a morph coexist with an independent `rotate`/`transform` animation — the core composition promise of the library. **Guide:** `individual-transform-properties`. **Lands in:** keyframes.js. **Impact:** dx/ux · **Effort:** S.

- **O3 — Add a native-`scroll()`/`view()` adapter alongside the JS `ScrollTimeline`.** Ship a thin helper that, for the DOM-element-on-scroll case, sets `animation-timeline: scroll()`/`view()` + emits the `@keyframes` (the lib already serializes `@keyframes` — `parsing/format.ts`). Keep the JS `ScrollTimeline` only for off-DOM/data-driven scroll progress (its true differentiator). Removes a main-thread rAF loop for the common case. **Guide:** `scroll-progress-indicator` / `scroll-entry-exit-effects`. **Lands in:** keyframes.js. **Impact:** perf · **Effort:** L.

- **O4 — View Transitions for demo scene swaps.** Wrap `switchScene` in `document.startViewTransition()` and tag the persistent stage/dock with `view-transition-name`; retire the bespoke `<Transition mode="out-in">` cross-fade. Smoother, shared-element scene morphs; less Vue transition plumbing. **Guide:** `same-document-transitions`. **Lands in:** keyframes.js (demo). **Impact:** ux · **Effort:** M.

- **O5 — Migrate glass-ui overlays to native `<dialog>` + popover API + anchor positioning.** The dialog/popover/dropdown/tooltip primitives are reka-ui (JS focus-trap, JS top-layer, JS positioning). Native `<dialog>` (focus-trap + top-layer + `::backdrop` for free), `popover`/`popovertarget`, `closedby` light-dismiss, and CSS anchor-positioning replace large swaths of that JS and improve a11y. With 6+ glass-ui consumers, this is the **highest cross-repo leverage**. **Guides:** `light-dismiss-a-dialog`, `platform-controls-dismiss-dialog`, `position-aware-tooltips`, `interest-triggered-tooltips`, `animate-to-from-top-layer`. **Lands in:** **glass-ui**. **Impact:** a11y/dx · **Effort:** L.

- **O6 — `@starting-style` + `transition-behavior: allow-discrete` for overlay enter/exit, sourced from the spring tokens.** Once overlays move toward native top-layer, animate them in/out with `@starting-style` and the existing `--spring-*` `linear()` tokens — no JS enter/leave hooks. Reuses keyframes.js's own spring output. **Guide:** `animate-to-from-top-layer`. **Lands in:** **glass-ui**. **Impact:** ux/dx · **Effort:** M.

- **O7 — Intrinsic-size animation for collapsibles (`interpolate-size`/`calc-size()`).** Any demo accordion/expanding panel that animates a JS-measured pixel height can animate to `height: auto` natively via `interpolate-size: allow-keywords` + `calc-size()`. **Guide:** `animate-to-intrinsic-sizes`. **Lands in:** glass-ui (if a shared collapsible exists) else keyframes.js demo. **Impact:** ux/dx · **Effort:** S–M (audit needed to confirm a JS-height collapsible exists).

- **O8 — Add `width`/`height` + `loading="lazy"` to gallery `<img>`.** `KeyframeTimeline.vue:107`, `AssetViewport.vue:59`. Eliminates CLS on dynamic preview insertion; defers off-screen asset thumbnails. **Guide:** `optimize-image-priority` / `performance`. **Lands in:** keyframes.js (demo). **Impact:** perf (CLS) · **Effort:** S.

---

## Top 8 modernizations (ranked by impact × 1/effort)

| # | Title | Guide id | Impact | Effort | Lands in |
| :-- | :--- | :--- | :--- | :--- | :--- |
| 1 | Default the native `linear()` spring path for DOM springs (helper already exists) | `physics-based-easing` | perf | S | keyframes.js |
| 2 | `ElementMorph`/demo → individual `translate`/`scale` props | `individual-transform-properties` | dx/ux | S | keyframes.js |
| 3 | `loading="lazy"` + intrinsic `width`/`height` on gallery `<img>` | `optimize-image-priority` | perf | S | keyframes.js |
| 4 | Migrate glass-ui overlays → native `<dialog>`/popover/anchor (6+ consumers) | `light-dismiss-a-dialog` | a11y/dx | L | **glass-ui** |
| 5 | View Transitions for demo scene swaps | `same-document-transitions` | ux | M | keyframes.js |
| 6 | Native `scroll()`/`view()` adapter beside JS `ScrollTimeline` | `scroll-progress-indicator` | perf | L | keyframes.js |
| 7 | `@starting-style` overlay enter/exit from `--spring-*` tokens | `animate-to-from-top-layer` | ux/dx | M | **glass-ui** |
| 8 | `interpolate-size`/`calc-size()` for collapsible height animation | `animate-to-intrinsic-sizes` | ux/dx | S–M | glass-ui / demo |

**Bottom line:** keyframes.js is near the modern frontier — it already does the hard part (native `linear()` spring emission, WAAPI delegation, reduced-motion, critical-CSS build). The two genuine library-level drifts are *combined transform strings* (S effort, immediate win) and the *JS ScrollTimeline reimplementing `animation-timeline`* (L, narrow by design). The single highest cross-repo lever is **glass-ui overlays → native top-layer/anchor-positioning** — and the spring tokens keyframes.js already feeds glass-ui make the enter/exit animation half nearly free.
