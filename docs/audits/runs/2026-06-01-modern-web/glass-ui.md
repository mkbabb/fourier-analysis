# Modern-Web Posture — `@mkbabb/glass-ui`

**Run:** 2026-06-01-modern-web · **Mode:** MODERN-WEB (read-only)
**Lens:** Chrome `modern-web-guidance` v0.0.170 (12 categories, on-disk corpus)
**Target:** `@mkbabb/glass-ui` v3.0.0 — `/Users/mkbabb/Programming/glass-ui`
**Frontend dir:** `src/` (components + styles + composables) + `demo/` (Vite SPA storybook)
**Stack:** Vue 3.5 SFCs · reka-ui 2.0 primitives (`@floating-ui/dom`+`vue` under the hood) · Tailwind CSS v4 (`@layer` + tokens) · `@mkbabb/keyframes.js` springs · vaul-vue drawer · embla carousel · vue-router (demo) · Vite 7 library build
**Highest leverage:** this is the **shared design layer** — every consumer (fourier, value.js, bbnf-buddy, keyframes demo) inherits its overlay, motion, and token primitives. A modern primitive adopted in `src/styles` or `src/components` propagates to ≥2 consumers, so adoptions that land **in glass-ui** are weighted above leaf fixes.

---

## Preamble — what the corpus actually rewards here

glass-ui is, for a glassmorphic system, **unusually modern already**. It uses `linear()` spring tokens (not JS tweens for CSS-able motion), a *named* `scroll-timeline` in one place, cascade `@layer`s, oklch + `color-mix()` tokens, `:has()`, container queries with `cqi` units, `dvh`, and a real glass-a11y bracket triad (`prefers-reduced-transparency` / `prefers-contrast` / `@supports not (backdrop-filter)`). So the drift is **not** "obsolete everywhere" — it concentrates in five seams: (1) **overlay positioning** is 100% JS (`@floating-ui` via reka) where CSS **anchor positioning** now exists; (2) **hover/state transforms** use the combined `transform` shorthand without the mandated base identity + individual props; (3) one **JS rAF scroll listener** (`useScrollProgress`) duplicates the scroll-driven-CSS pattern the repo already proved in `CardHeader`; (4) **top-layer enter/exit** rides Vue `<Transition>` classes instead of `@starting-style` + `transition-behavior: allow-discrete`; (5) **no View Transitions** despite an SPA router and a carousel/pager that morph state.

---

## (1) ALREADY-MODERN — do not regress

### css / css-layout
- **`linear()` physics springs as tokens** (`physics-based-easing`) — `src/styles/tokens.css:137-140` defines `--spring-smooth/-snappy/-bouncy/-gentle` as 48-stop `linear()` curves, consumed by every transition recipe in `transitions.css`. This is exactly the guide's prescription (springs in CSS, not JS, for compositor-thread motion). Strongest single modern signal in the repo.
- **Named `scroll-timeline` + `animation-range`** (`scroll-entry-exit-effects`, css §9) — `src/components/ui/card/CardHeader.vue:81-98` drives a 3-lane shrink off `scroll-timeline: --card-scroll` (`utilities.css:232`) with `animation-range: 0px 120px`, PRM-bracketed. Native scroll-driven animation done right.
- **oklch + `color-mix(in oklab/srgb)` tokens** (css §5, §8) — `tokens.css` has 12 oklch declarations; `color-mix` tints throughout (`drawer.css:24`, `glass.css`). Token tiers are layered (literal → semantic → component).
- **Cascade `@layer` discipline** (css §2) — `@layer components` wraps every recipe sheet (`transitions.css`, `hover-popover.css`, `glass.css`); `transitions.css:1-10` documents *why* (unlayered Vue `<Transition>` classes were silently outranking layered recipes). No BEM, no global `*` resets.
- **`:has()` for state-driven styling** (`child-state-based-styling`, css §3) — `ScrubberTimeline.vue:118` `.timeline-row:has(.glass-track:active) .timeline-caret`; `TableCell.vue:11` `[&:has([role=checkbox])]:pr-0`.
- **Container queries + `cqi` fluid units** (`size-aware-styling`, `fluid-scaling`) — `instrument-rail.css:35-47` (`container-type: inline-size`/`size`), `tokens.css:1077-1106` clamp on `cqi`.
- **`dvh` dynamic viewport units** (css §6) — `tokens.css:785`, `SelectContent.vue:46` `var(--reka-popper-available-height, 60dvh)`.

### accessibility / user-experience
- **Glass-a11y bracket triad** (css §5 forced-colors, accessibility §9/§10) — `glass.css:226` `@media (prefers-reduced-transparency: reduce)`, `:245` `@media (prefers-contrast: more)`, `:257` `@supports not (backdrop-filter)`. Glassmorphism with the three degraded paths the guidance demands.
- **`prefers-reduced-motion` everywhere** — 9 style sheets bracket motion; `transitions.css` PRM block *preserves fades, drops transform motion* (the guide's preferred case-by-case approach, not a blanket `0.01ms`).
- **`contain: layout style`** (css §9 perf) — `glass.css:110` on `.glass-card`, `utilities.css:231` `contain: layout style paint` to isolate the named timeline.
- **Native-pause for offscreen canvas** (`efficient-background-processing`) — `aurora/composables/useAurora.ts:246` composes `useIntersectionPause` so the Aurora rAF/WebGL loop halts off-screen (IO arm; see drift D6 for the `contentvisibilityautostatechange` refinement).
- **reka-ui for overlay semantics** (accessibility §11 modals) — Dialog/Popover/Tooltip/Select forward reka primitives, which carry focus management, inert-outside, and ARIA for free. (The *positioning engine* under them is the drift, not the semantics.)

---

## (2) DRIFT — obsolete / ad-hoc / heavy-dependency patterns a guide now modernizes

### css-layout — overlay positioning
- **D1 · `@floating-ui/dom` JS positioning for ALL overlays** — guide `resilient-context-menus-and-nested-dropdowns` + `position-aware-tooltips` (css-layout §5).
  `node_modules/reka-ui` depends on `@floating-ui/dom`+`@floating-ui/vue`; every glass-ui overlay (`tooltip/`, `popover/`, `dropdown-menu/`, `hover-card/`, `select/`, `combobox/`, `context-menu/`, `custom/hover-popover/`, `custom/icon-tooltip/`) inherits JS `computePosition` collision/flip math run on scroll/resize. The platform now does anchor-name/`position-area`/`position-try-fallbacks` declaratively on the compositor.
  *Impact:* perf (per-frame JS reflow during scroll on every open overlay) + dx. *Effort:* L (cuts across reka — best as a progressive-enhancement layer or a glass-ui-owned anchored variant, not a reka rewrite).
- **D2 · Hand-rolled tooltip arrow/side logic, no anchored container query** — `position-aware-tooltips`.
  `hover-popover.css` + `tooltip/TooltipContent.vue` style the panel but the side-flip/arrow-direction rests entirely on reka's JS. `container-type: anchored` + `@container anchored(fallback: flip-block)` would let the arrow react to a flip with zero JS (Chrome 143; progressive enhancement).
  *Impact:* perf/dx. *Effort:* M.

### user-experience — motion & transforms
- **D3 · Combined `transform:` on hover/state WITHOUT base identity + individual props** — `individual-transform-properties` (css §9 "individual transform properties, e.g. `translate` instead of `transform`").
  `dock.css:311,676,680,708` set `transform: scale(var(...))` on `:hover`/`:active`/`.is-active` with **no base `transform`/`scale: 1`** on the rest element. The guide marks the base identity **MANDATORY** to avoid the hover-only stacking-context/containing-block shift (which also breaks anchor positioning, tying back to D1). Same shape in the 9-site cartoon-lift recipe (`transform: translate(-1px,-1px)`, style-audit axis 2.1) and `cards.css:41`.
  *Impact:* ux (z-index/anchor jank on hover) + dx. *Effort:* S (add `scale: 1` / `translate: 0` base; migrate state rules to individual `scale:`/`translate:`).
- **D4 · `useScrollProgress` = JS rAF scroll listener for scroll-linked visuals** — `parallax-scroll-effects`, `scroll-entry-exit-effects`, css §9 ("use Scroll-Driven Animations instead of JS listeners").
  `src/composables/motion/useScrollProgress.ts` runs a `window.addEventListener('scroll')` → rAF → `getBoundingClientRect()` mapping to a 0..1 ref for "scroll-linked typography axes, parallax depth, progress indicators." The repo already proved the native form in `CardHeader` (`scroll-timeline`); this composable is the un-migrated twin. `animation-timeline: view()`/`scroll()` does it on the compositor.
  *Impact:* perf (main-thread scroll work + forced reflow per frame). *Effort:* M (keep the composable as the Firefox/`@supports` fallback; CSS-first for the rest).
- **D5 · Top-layer enter/exit via Vue `<Transition>` classes, not `@starting-style` + `allow-discrete`** — `animate-to-from-top-layer` (css §9).
  `transitions.css` `.dialog-scale-*` / `.dropdown-*` / `.pop-*` choreograph reka-portaled overlays through JS-toggled Vue transition classes. The native path (`@starting-style { … }` + `transition-behavior: allow-discrete` on `display`/`overlay`) animates top-layer dialogs/popovers with **zero** framework class toggling and survives reka's portal. Repo has **0** `@starting-style`, **0** `allow-discrete`.
  *Impact:* dx (less JS-coupled motion) + perf. *Effort:* M.
- **D6 · Aurora canvas pauses on `IntersectionObserver`, not `contentvisibilityautostatechange`** — `efficient-background-processing`.
  `useAurora.ts:246` pauses the WebGL/rAF loop via `useIntersectionPause` (IO). The guide explicitly says: use **IO for app logic**, but `contentvisibilityautostatechange` (paired with `content-visibility: auto`) for **rendering-heavy work** like canvas/WebGL, because it ties to the browser's own render lifecycle (pre-render margin) — strictly more correct for this exact case. This is a *refinement* (IO already works), not a regression.
  *Impact:* perf (battery, render-lifecycle accuracy). *Effort:* M.

### forms
- **D7 · No `:user-valid`/`:user-invalid`, no `field-sizing: content`** — css §5 "Theming browser-generated UI", forms `select-menu-interaction`, `style-parent-with-has`.
  Repo grep: **0** `:user-valid`/`:user-invalid`, **0** `field-sizing`. `input/`, `textarea/`, `number-field/` style validity via reka/class state, missing the native "don't flag required-empty on load" affordance and content-sizing textareas.
  *Impact:* ux/a11y (hostile default validation) + dx. *Effort:* S per control.

### performance — content-visibility coverage
- **D8 · No `content-visibility: auto` on the heavy demo story pages** — `defer-rendering-heavy-content`.
  `contain` is used on small surfaces, but the demo's long below-the-fold `StorySection`/`StoryPage` blocks (146 demo `.vue`, dense token ladders, swatch grids) get no `content-visibility: auto` + `contain-intrinsic-size`. Same gap would hit any consumer rendering a long glass-card feed.
  *Impact:* perf (LCP/INP on content-heavy pages). *Effort:* S (one utility class + `contain-intrinsic-size`).

---

## (3) OPPORTUNITIES — high-leverage modern adoptions (ranked by impact × 1/effort)

> "Lands in" = **glass-ui** when ≥2 consumers benefit (the shared-layer multiplier). Leaf-only items say **this repo (demo)**.

1. **Individual transform properties + base identity across the motion layer** (`individual-transform-properties`) — **glass-ui** (`dock.css`, `cards.css`, `utilities.css` hover/lift recipes + the to-be-minted `.hover-cartoon` from the style-audit). Add `scale: 1`/`translate: 0` base + migrate state rules to individual props. Removes hover-only stacking-context shifts, *and* is a hard prerequisite for safely adopting anchor positioning (#3). **S, ux+dx, every consumer.**
2. **CSS-first scroll-driven path for `useScrollProgress`** (`scroll-entry-exit-effects` / `parallax-scroll-effects`) — **glass-ui** (`src/composables/motion/`). Ship a `view()`/`scroll()` CSS recipe (mirror the proven `CardHeader` `scroll-timeline`), keep `useScrollProgress` as the `@supports`-gated Firefox fallback. Moves parallax/progress motion off the main thread for ≥2 consumers. **M, perf.**
3. **Anchor-positioned overlay variant (progressive enhancement)** (`resilient-context-menus-and-nested-dropdowns`, `position-aware-tooltips`) — **glass-ui** (tooltip/popover/dropdown/hover-card substrate). Behind `@supports (anchor-name: --x)`, drive flip/shift via `position-area` + `position-try-fallbacks` + `container-type: anchored` arrows; fall back to reka/`@floating-ui` where unsupported. Highest *eventual* leverage (every overlay, every consumer) but largest blast radius. **L, perf+dx.**
4. **Same-document View Transitions for the demo SPA + glass-carousel** (`same-document-transitions`, `group-element-transitions`) — **demo lands here, but `view-transition-name` tokens land in glass-ui.** Wrap `router.push` / pager / carousel slide swaps in `document.startViewTransition`; expose `view-transition-name` conventions from glass-ui so the carousel and any consumer's route morphs are consistent. **M, ux.**
5. **Native top-layer enter/exit (`@starting-style` + `transition-behavior: allow-discrete`)** (`animate-to-from-top-layer`) — **glass-ui** (`transitions.css` dialog/dropdown/pop recipes). Decouples overlay motion from Vue `<Transition>` class toggling; composes natively with reka's portal. **M, dx+perf.**
6. **`content-visibility: auto` + `contain-intrinsic-size` utility** (`defer-rendering-heavy-content`) — **glass-ui** (`utilities.css` `.deferred-section`), applied in **demo** story pages. One class; immediate LCP/INP win on long pages for every consumer. **S, perf.**
7. **`contentvisibilityautostatechange` for the Aurora/WebGL pause** (`efficient-background-processing`) — **glass-ui** (`useAurora.ts`). Swap (or add to) the IO arm for the render-lifecycle event the guide prescribes for canvas/WebGL. **M, perf.**
8. **`:user-valid`/`:user-invalid` + `field-sizing: content` on form primitives** (forms `select-menu-interaction`, css §5) — **glass-ui** (`input/`, `textarea/`, `number-field/`, `multi-select/`). Native non-hostile validity styling + content-sized textareas; removes JS validity-class plumbing for every consumer. **S, ux+a11y.**

---

## Top 8 modernizations (ranked)

| # | Title | Guide id | Impact | Effort | Lands in |
|---|---|---|---|---|---|
| 1 | Individual transform props + base identity on hover/state motion | `individual-transform-properties` | ux+dx | S | glass-ui |
| 2 | CSS scroll-driven path for `useScrollProgress` (fallback-gated) | `scroll-entry-exit-effects` | perf | M | glass-ui |
| 3 | Anchor-positioned overlay variant (PE over reka/@floating-ui) | `resilient-context-menus-and-nested-dropdowns` | perf+dx | L | glass-ui |
| 4 | Same-document View Transitions (router + glass-carousel) | `same-document-transitions` | ux | M | demo (+ glass-ui tokens) |
| 5 | Native top-layer enter/exit (`@starting-style`+`allow-discrete`) | `animate-to-from-top-layer` | dx+perf | M | glass-ui |
| 6 | `content-visibility: auto` + `contain-intrinsic-size` utility | `defer-rendering-heavy-content` | perf | S | glass-ui (used in demo) |
| 7 | `contentvisibilityautostatechange` pause for Aurora WebGL | `efficient-background-processing` | perf | M | glass-ui |
| 8 | `:user-valid`/`:user-invalid` + `field-sizing` on form primitives | `select-menu-interaction` | ux+a11y | S | glass-ui |

**Bottom line:** glass-ui is ahead of the curve on tokens, `linear()` springs, layers, and glass-a11y — the modern-web gap is concentrated in **overlay positioning (still 100% JS), transform discipline (combined shorthand on hover), and one un-migrated scroll listener**. Fixes #1, #6, #8 are S-effort and ship the most ux/perf per hour; #2/#5 extend patterns the repo has *already proven once*; #3 is the long-horizon, highest-ceiling play (anchor positioning across every overlay, every consumer).
