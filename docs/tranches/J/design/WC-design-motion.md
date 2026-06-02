# J · WC — Motion & Micro-interactions refinement spec

> LENS: Motion & micro-interactions. SCOPE: refinement, not redesign. The app is
> stable, built on glass-ui 3.1.0. Every recommendation below cites a real
> file:line and the specific glass-ui primitive/composable to reach for. NO app
> src edits in this tranche — spec only.

---

## 0 · What's already right (the floor we build on)

The app already has the two hardest, most platform-native motion pieces wired —
and wired *correctly*, with PRM carves:

- **View Transitions route-morph** — `src/router/index.ts:131-147`. The
  `/w/`↔`/v/` viz swap is bracketed in `document.startViewTransition`, gated on
  `supportsViewTransitions()` AND not-reduced-motion, with the parked-promise +
  `requestAnimationFrame` release dance (`afterEach`, `:171-175`). The canvas
  surface carries `view-transition-name: viz-canvas-stage`
  (`VisualizationView.vue:313`). This is textbook.
- **Compositor-driven reading progress** — `PaperView.vue:313-314` binds the
  native `.scroll-progress` recipe (glass-ui scroll-driven CSS) to a `scroll()`
  timeline scoped to `.paper-scroll` via `--scroll-progress-scroller: nearest`
  (`:499`), with a feature-detected `rAF` floor that is the *sole* writer only
  when `scroll()` timelines are absent and not under PRM (`:157-187`). This is
  the dual-path-single-writer discipline done right.

So the platform layer is excellent. **The gap is everything glass-ui ships as a
JS motion composable: it is used at ZERO sites app-wide.** `grep` for
`useSpring`, `useStaggerReveal`, `useSpringPress`, `useSpringMount`,
`@mkbabb/glass-ui/motion` returns nothing in `src/`. Every entrance is a flat
appear or a one-off hand-rolled CSS keyframe; every press/hover is a bespoke
`transition` triplet. The library has a full iOS-spring + stagger toolkit
(`dist/composables/motion/`) and the app reaches for none of it.

That is the whole thesis of this spec: **the app is motion-*correct* on the
platform axes and motion-*absent* on the orchestration axis. There is no single
memorable reveal.** We add exactly one, plus three targeted spring upgrades, all
on existing surfaces.

---

## 1 · Aesthetic direction (motion grammar)

The app's identity is *academic-instrument*: Computer Modern Serif body,
Fraunces display, Fira Code mono, warm-cream paper substrate, cartoon-offset
shadows, the ℱ mark. The motion vocabulary must read like a **precision
instrument warming up** — deliberate, settling, never bouncy-toy. The Fourier
subject gives us the perfect metaphor:

> **"Convergence" is the motion signature.** A Fourier partial sum *settles*
> onto its target as harmonics accumulate. Every entrance in this app should
> visually *converge* — an underdamped spring settling onto rest — not slide or
> fade linearly. glass-ui's `useSpring` with the `smooth` preset
> (`response 0.5`, `ζ 0.86`) and `useSpringMount`'s presets are literally
> analytic-ODE settling. The metaphor and the engine are the same math.

Concretely:
- **Stagger = harmonic accumulation.** Sequenced reveals (cards, coefficient
  rows, control panels) cascade like terms being added to a series — one settles,
  then the next. `useStaggerReveal` at `staggerMs ≈ 55-70`.
- **Press/hover = damped response.** Replace the hand-rolled `scale()`
  transitions with `useSpringPress` so feedback overshoots ~5% and settles —
  the instrument-key feel.
- **Counters = convergence.** Numeric readouts (energy %, harmonic counts,
  coefficient magnitudes) *count up to* their value via `useAnimatedNumber` /
  `AnimatedDigit`, never snap. A converging energy figure is on-theme literally.

Keep the cartoon-offset shadow + warm palette exactly as-is. This is a motion
refinement; the surface look does not change.

---

## 2 · THE ONE MEMORABLE REVEAL (headline)

**Surface:** the Paper view masthead + first content settle, `PaperView.vue`
`<header>` at `:352-358` and the `<article>` shell at `:351`.

**Today:** the title `ℱourier Analysis` (`:354-357`) and the entire article
appear instantly on mount. The paper is the front door (`/` redirects to
`/paper` by default — `router/index.ts:33`) and it currently has *no* entrance
at all. The most-visited, most-identity-bearing surface is the one with zero
orchestration.

**The reveal — "the series converging onto the title":**

A single orchestrated, staggered page-load on first paint of the paper:

1. The article shell (`.paper-article`, `:351`) springs up from
   `translateY(12px)` + `opacity 0` → rest, via a `useSpringMount`-driven
   `position` ref bound to `transform`/`opacity` (preset `smooth`). ~0ms delay.
2. The masthead `<h1>` reveals as **two staggered beats**: the `ℱ`
   glyph (`<span class="fourier-f">`, `:356`) settles first (it is the brand
   atom), then `ourier Analysis` follows ~70ms later. Drive both off a single
   `useStaggerReveal({ staggerMs: 70 })` whose `revealed[i]` flag toggles a
   `opacity-100 translate-y-0` Tailwind class pair (the documented
   bind-flag-to-class pattern, `useStaggerReveal.d.ts`).
3. The desktop sidebar TOC items (`PaperSidebar.vue` link list) cascade in on
   the *same* stagger clock at `staggerMs: 45`, top-to-bottom — reading like the
   table of contents assembling itself. Register each `.sidebar-link` with the
   shared `useStaggerReveal.register(el, i)`.

**Why this is the memorable one:** it fires once, on the default landing
surface, it is *thematically literal* (a Fourier series converging onto its
title), and it uses the platform's settling physics rather than a generic fade.
A first-time visitor remembers "the title assembled itself."

**glass-ui levers:** `useSpringMount` (preset `smooth`) for the shell;
`useStaggerReveal` (one instance, two `staggerMs` consumers is fine — or two
instances) for masthead + TOC. Both `respectReducedMotion`/PRM-aware by default
(`useSpringMount.d.ts`, `useStaggerReveal` reveals immediately under native/PRM).

**PRM contract:** `useSpring`/`useSpringMount` snap to target under
`prefers-reduced-motion` (`respectReducedMotion` default `true`). The terminal
state (title visible, shell at rest) is therefore correct with zero motion. No
extra carve needed — the composables own it. This is strictly better than the
current `style.css:92-96` hand-rolled `@media (prefers-reduced-motion)
{ animation: none }` carve, which the app maintains per-keyframe.

**Implementation note:** mount-once guard — the paper scroll-restores from
session (`PaperView.vue:265-270`); the reveal must run on the *fresh* mount
only, before any `performScroll`, so it doesn't fight the restore. Seat the
spring at mount, then restore.

---

## 3 · TOP REFINEMENTS (each: surface → glass-ui lever)

### R1 — Gallery grid: staggered card reveal (replaces flat appear)
**Surface:** `GalleryInfiniteGrid` cards, rendered via `GalleryView.vue:289-303`;
card root `GalleryCard.vue:70-80`.
**Today:** cards mount instantly in a grid; only `[data-state=active][role=
tabpanel]` gets the global 0.18s `tab-slide-in` (`style.css:83-90`). New pages
from infinite-scroll pop in with no entrance.
**Lever:** `useStaggerReveal({ staggerMs: 55, rootMargin: "0px 0px -10%", once:
true })` inside `GalleryInfiniteGrid`. Register each `GalleryCard` root; bind
`revealed[i]` to a `translate-y-2 opacity-0` → `translate-y-0 opacity-100`
class pair. This is the harmonic-accumulation metaphor at the grid scale, and it
is *intersection-driven* so newly-scrolled-in pages cascade too. PRM/native:
`useStaggerReveal` reveals immediately, terminal state correct.
**Keep:** the existing `:hover` lift + `--ease-apple-spring` transition
(`GalleryCard.vue:194-209`) is good as the resting micro-interaction.

### R2 — Press feedback → spring physics (instrument-key feel)
**Surfaces:** `GalleryCard` like button (`GalleryCard.vue:271-294`, currently a
bespoke `like-bounce` keyframe at `:290`), the paper overlay back button
(`PaperView.vue:582-616`, hand-rolled `scale(1.05)`/`scale(0.95)`), the
canvas-overlay admin buttons (`GalleryCard.vue:249-257`).
**Today:** every press/hover is a hand-rolled `transform: scale()` +
`transition` triplet, and the like animation is a one-off `@keyframes
like-bounce` with its own PRM carve (`:296-300`).
**Lever:** `useSpringPress()` (`response 0.25`, `ζ 0.7` — overshoots ~5%, the
iOS tap canon). Spread `handlers` onto the button, bind
`:style="{ transform: \`scale(${1 - value * 0.05})\` }"`. One composable
replaces the keyframe + the manual `:active` scale + the PRM `@media` carve
(spring snaps under PRM natively). The like-bounce *celebration* (scale-to-1.3)
can stay as a CSS keyframe triggered on the `liked` toggle — that's a discrete
event, not press feedback — but the *press* itself should be spring-driven.
**Net:** removes ~3 hand-rolled scale recipes + 2 PRM carves, gains uniform
overshoot physics across all pressables.

### R3 — Converging counters (the theme, literalized)
**Surfaces:** the energy-captured `MetricBadge` in `EquationView.vue:292-297`
(`(displayEnergy * 100).toFixed(1)` — static snap on every recompute); the
effective-N / harmonic readouts in `FunctionInput`; coefficient magnitudes.
**Today:** numbers hard-snap to their new value when a recompute lands. A
spinner (`EquationView.vue:223,240`) covers the wait, then the figure jumps.
**Lever:** `useAnimatedNumber` (glass-ui `composables/motion/useAnimatedNumber`)
to drive a spring-settled `displayEnergy` → the badge counts *up to* the new
energy %. For per-digit drama on the headline energy figure, `AnimatedDigit`
(`@mkbabb/glass-ui/animated-digit`) — already a proven pattern in this repo at
`CoefficientsSpectrum.vue` (the only current consumer). A Fourier energy figure
*converging* on screen is the metaphor made literal and is genuinely delightful
on a recompute.
**Scope guard:** apply only to the headline energy %/effective-N. Do not animate
every coefficient cell — that's noise, not signal.

### R4 — Extend View Transitions to the tab-level nav (cheap, platform-native)
**Surface:** the top-nav tab swaps — `AppHeader.vue` `onTabSelect` (`:45-47`)
does a bare `router.push`. Today only viz↔viz morphs (`router/index.ts:20-26`
`isVizMorph`); paper→gallery→equation→morph remount with the 0.18s
`tab-slide-in` only.
**Lever:** widen the VT bracket. The current `isVizMorph` gate
(`router/index.ts:131-147`) is *intentionally* narrow to avoid morphing
unrelated frames — keep that conservatism, but add a **cross-fade** VT class for
the top-level tab set. Assign a stable `view-transition-name` to the
`<main>`/`RouterView` wrapper (`App.vue:26`) and let glass-ui's
`view-transition.css` `::view-transition-old/new` cross-fade own the LOOK. Gate
identically (supports + not-PRM). This turns five abrupt route swaps into one
coherent compositor cross-fade for ~5 lines, reusing the bracket already in the
router. **Verify** the new name doesn't collide with `viz-canvas-stage` and that
the two transitions are mutually exclusive (a viz→viz swap must not also
cross-fade the shell — scope the shell name off the viz routes).

### R5 — Sidebar follow + active-section: spring the scroll, not the snap
**Surface:** `useSidebarFollow` is already wired (`PaperView.vue:233-238`) and
the active TOC entry tracks scroll. The sidebar-link active state is a CSS color
swap.
**Lever (light touch):** when the active section changes, drive the active-link
*indicator* (or an underline/marker) with `useSpring` on its `translateY` so the
active marker *glides* between TOC entries rather than instant-recoloring —
the way a well-made docs sidebar feels alive. This is one `useSpring(targetY)`
bound to a single absolutely-positioned marker element; the existing
`useSidebarFollow` already computes the active element. Low risk, high polish,
and it reinforces the "settling" grammar on the most-used surface.
**Defer-if-tight:** R5 is the lowest-priority of the five; R1-R3 carry the
headline value.

---

## 4 · Performance + accessibility ledger

- **Compositor-only properties.** Every recommendation animates `transform` +
  `opacity` exclusively (spring `value` → `scale`/`translateY`; stagger flags →
  Tailwind `translate-*`/`opacity-*`). No layout-triggering props. The springs
  run off `@mkbabb/keyframes.js` analytic integration (one rAF, settles + stops
  — `useSpring.d.ts` `settleThreshold`), so they self-terminate; no idle rAF.
- **Reduced motion is free.** `useSpring`/`useSpringMount`/`useSpringPress` snap
  to target under PRM by default (`respectReducedMotion`); `useStaggerReveal`
  reveals immediately on native/PRM. Adopting these *removes* the per-keyframe
  `@media (prefers-reduced-motion)` carves the app hand-maintains today
  (`style.css:92-96`, `GalleryCard.vue:296-300`) — the composables own the
  carve. Net reduction in PRM surface area.
- **No new dependencies.** Everything above is already in `@mkbabb/glass-ui`
  (`dist/composables/motion/`, `dist/animated-digit.js`) and `@mkbabb/
  keyframes.js@^2.2` (already a direct dependency, `package.json`). Zero install.
- **Mount-once discipline.** The headline reveal (§2) and R1 stagger must fire
  on fresh mount only and not refire on the paper's session scroll-restore
  (`PaperView.vue:265-270`) or on infinite-scroll re-renders (`once: true` on the
  grid stagger handles the latter).

---

## 5 · Explicit non-goals (refinement discipline)

- **No Aurora.** glass-ui ships `@mkbabb/glass-ui/aurora` (WebGL background) and
  it is tempting, but the warm-paper academic substrate + `paper-texture`
  (`App.vue:24`) is the established identity. A WebGL aurora would fight it and
  add a ~16 KiB chunk. Out of scope.
- **No new keyframes where a spring fits.** Resist adding bespoke `@keyframes`;
  reach for the spring composables so the motion grammar stays uniform.
- **No surface/palette/typography change.** This is the motion lens only. The
  cartoon shadow, cream palette, CM-Serif/Fraunces/Fira-Code stack stay exactly
  as shipped.
- **Don't over-animate counters or coefficients** (R3 scope guard) — signal,
  not confetti.

---

## 6 · Priority order for implementation (the gate sequence)

1. **§2 headline reveal** (paper masthead convergence) — the one memorable
   moment; highest identity value.
2. **R1** gallery stagger — broad surface, same `useStaggerReveal` lever.
3. **R3** converging counters — cheap, on-theme, delightful, proven pattern in
   repo.
4. **R2** spring press — replaces hand-rolled recipes, reduces PRM surface.
5. **R4** tab-level VT cross-fade — ~5 lines, reuses the router bracket.
6. **R5** sidebar marker glide — polish; defer if tight.

Each lands behind the existing PRM/feature-detection floors the app already
honors. No regression to the View-Transitions route-morph or the compositor
scroll-progress bar — those stay exactly as-is.
