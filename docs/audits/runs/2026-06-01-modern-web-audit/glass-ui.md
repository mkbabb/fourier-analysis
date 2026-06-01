# Modern-Web Conformance Audit — `@mkbabb/glass-ui`

**Run:** 2026-06-01-modern-web-audit · **Mode:** CONFORMANCE (read-only; auditor writes only this file)
**Lens:** Chrome `modern-web-guidance` v0.0.170 — 12 categories, on-disk corpus at `/tmp/mwg/package/skills/modern-web-guidance/guides/`
**Invariant lens:** inv-29 progressive-enhancement-floor · inv-30 platform-over-library
**Target:** `@mkbabb/glass-ui` v3.0.0 — `/Users/mkbabb/Programming/glass-ui`
**Frontend dir:** `src/` (224 `ui/*.vue` + 56 `custom/*.vue` + 20 `styles/*.css` + composables) + `demo/` (146-file Vite SPA storybook)
**Stack:** Vue 3.5 SFCs · reka-ui 2.0 overlay primitives (`@floating-ui/dom`+`vue` engine) · Tailwind CSS v4 (`@layer` + token cascade) · `linear()` spring tokens · vaul-vue drawer · embla/`scroll-snap` carousel · vue-router (demo) · Vite 7 library build

---

## Preamble — what the corpus rewards, and where glass-ui sits

This is the **PROPER** audit (every category, every applicable guide, `file:line`, severity-ranked) — it confirms and *deepens* the two prior analyses (`2026-06-01-modern-web/glass-ui.md` posture + `2026-06-01-constellation-ui/glass-ui-self.md` canon self-audit) rather than restating them.

glass-ui is, for a glassmorphic system, **unusually modern already** and that is verified by grep, not asserted: `linear()` springs as tokens (`tokens.css:137-140`), a *named* `scroll-timeline` driving real scroll-driven animation (`utilities.css:232` + `CardHeader.vue:81-99`), the three-bracket glass-a11y degrade triad (`glass.css:226/245` + the `@supports not (backdrop-filter)` arm), 22 container-query sites, `:has()`, oklch + `color-mix()` token tiers, `dvh`. The modern-web gap is therefore **not** "obsolete everywhere" — it is **concentrated and systemic in five seams**, each of which is a *platform-replaces-library* (inv-30) or a *the-repo-already-proved-this-once-and-didn't-finish* story:

1. **Transform discipline** — every hover/active/state transform in the motion layer uses the **combined `transform: scale()/translate()` shorthand WITHOUT the MANDATORY base identity** (`scale: 1`/`translate: 0`). Verified at **52** `transform: scale|translate` sites in `src/styles/`; the base rules carry `transition: ... transform ...` but **no base transform**. This is the single most systemic and lowest-effort drift, and it is a **hard prerequisite** for #2 (the hover-only stacking-context shift the guide warns of also breaks anchor positioning).
2. **Overlay positioning is 100% JS** — every overlay (`tooltip/`, `popover/`, `dropdown-menu/`, `hover-card/`, `select/`, `combobox/`, `context-menu/`, `dialog/`, plus `custom/hover-popover/`, `custom/icon-tooltip/`) inherits reka-ui's `@floating-ui/dom` `computePosition` collision/flip math run on scroll/resize. CSS anchor positioning (`anchor-name`/`position-area`/`position-try-fallbacks`) now does this declaratively on the compositor. Repo grep: **0** `anchor-name`, **0** `position-area`, **0** `position-try`.
3. **One un-migrated JS scroll listener** — `useScrollProgress.ts` is a `window.addEventListener('scroll')` → rAF → `getBoundingClientRect()` 0..1 mapper, the exact twin of the native `scroll-timeline` the repo *already proved* in `CardHeader`. Repo grep: **8** `scroll-timeline`/`animation-timeline` sites (the proven native path) coexisting with this one un-migrated JS path.
4. **Top-layer enter/exit rides Vue `<Transition>` classes**, not `@starting-style` + `transition-behavior: allow-discrete`. Repo grep: **0** `@starting-style`, **0** `allow-discrete`, **0** `transition-behavior` — against `.dialog-scale-*`/`.pop-*`/`.dropdown-*` JS-toggled class choreography in `transitions.css`.
5. **Forms expose hostile native defaults** — **0** `:user-valid`/`:user-invalid`, **0** `field-sizing` in the entire repo; `Textarea.vue` is fixed `min-h-20`.

Plus two repo-wide adoption gaps verified zero: **0** `content-visibility`/`contain-intrinsic-size` (no deferred rendering on the 15.7k-LOC demo story tree) and **0** View Transitions despite an SPA router + a `scroll-snap` carousel.

**N/A categories (one line each):** **built-in-ai** (0 `window.ai`/summarizer/translator — a UI library, not an AI surface; N/A), **passkeys** (0 `navigator.credentials`/`publicKey` — no auth surface; N/A), **webmcp** (0 agentic tool surface; N/A), **privacy** (no analytics/tracking/storage in the library layer; N/A), **security** (library ships no CSP/headers/network — the demo `index.html` has none either, but that is a host concern, not a library API; effectively N/A for the design layer). These five are correctly out of scope for a design system; they are noted so the scorecard is honest.

---

## (1) accessibility

**CONFORMANT**
- `prefers-reduced-motion: reduce` bracketed in **9** stylesheets (`glass.css`, `transitions.css:209+`, `dock.css`, `animations.css`, `CardHeader.vue:139`, …). The `transitions.css` PRM block **preserves fades, drops transform motion** — the guide's preferred case-by-case approach, not a blanket `0.01ms` kill. (`accessible-error-announcement` category; css §9.2 Accessibility.)
- Glass-a11y degrade triad: `glass.css:226` `@media (prefers-reduced-transparency: reduce)`, `glass.css:245` `@media (prefers-contrast: more)`, plus the `@supports not (backdrop-filter)` opaque fallback. Glassmorphism with all three guidance-mandated degraded paths.
- Overlay semantics inherited from reka-ui (`DialogContent.vue:5-11` imports reka `DialogContent`) — focus management, `inert`-outside, ARIA roles for free. (The *positioning engine and the non-native top-layer* are the drift, §css-layout/§ux below — not the semantics.)

**DRIFT**
- **A11Y-1 (P2) · Partial-glass surfaces silently drop the a11y triad** — `child-state-based-styling`/css §5 forced-colors. **7 sites** rebuild a thin glass surface by hand (`background: var(--surface-tint-6)` + `backdrop-filter: var(--glass-blur-*)`) on a sub-element *without* the `.glass-*` class, so they miss the `prefers-reduced-transparency`/`prefers-contrast`/`@supports not(backdrop-filter)` brackets: `ui/slider/Slider.vue:237,255,331`, `custom/timeline/ContinuousTimeline.vue:446`, `custom/timeline/ScrubberTimeline.vue`, `custom/timeline/SegmentedTimeline.vue`, `ui/drawer/DrawerOverlay.vue`, `custom/expandable-container/ExpandableContainer.vue`. `grep -c prefers-reduced-transparency` on `Slider.vue`/`ContinuousTimeline.vue` = 0. **Effort S** (per site) / **M** (as a shared composable) · **lands-in glass-ui** · inv30 **no** (it is a11y-resilience, not a platform-replaces-library). *This is the glass-ui gap "partial-glass a11y bracket" below.*

**OPPORTUNITY**
- **`hidden="until-found"`** for the demo's collapsible disclosures (`search-hidden-content`) — find-in-page reaches deferred content. Pairs with the content-visibility opportunity (§performance). **lands-in glass-ui** (utility) used in **demo**.

---

## (2) css

**CONFORMANT**
- Cascade `@layer components` wraps every recipe sheet (`transitions.css:1-10` documents *why* — unlayered Vue `<Transition>` classes were outranking layered recipes). No BEM, no `*` reset. (css §2 The Cascade.)
- oklch + `color-mix(in srgb/oklab)` token tiers (literal → semantic → component); dark cascade via `@variant dark (&:where(.dark, .dark *))` (`theme.css:361`). (css §5 Tokens & Theming, §8 Gradients & color-mix.)
- `linear()` physics springs as tokens — `tokens.css:137-140` `--spring-{smooth,snappy,bouncy,gentle}` are 48-stop `linear()` curves consumed by every transition recipe; `--ease-spring: var(--spring-snappy)` (`tokens.css:159`). (`physics-based-easing` — springs in CSS, compositor-thread, not JS tweens. Strongest single modern signal in the repo.)
- `:has()` state-driven styling (3 sites, e.g. `ScrubberTimeline.vue` timeline-caret on `:active`). (css §3 `child-state-based-styling`/`style-parent-with-has`.)
- `contain: layout style paint` to isolate the named timeline (`utilities.css:231`) and on `.glass-card`. (css §9 Performance.)

**DRIFT**
- **CSS-1 (P1) · Combined `transform:` shorthand on hover/active/state WITHOUT the MANDATORY base identity — 52 sites** — `individual-transform-properties` (the guide marks the base identity **MANDATORY**; without `scale: 1`/`translate: 0` the hover creates a *new stacking context & containing block only on hover*, causing z-index jank AND breaking anchor positioning). Representative verified sites, all lacking a base transform on the rest element:
  - `dock.css:311,676,680,708,824,967,972` — `.dock-icon-button:hover/:active/.is-active { transform: scale(var(...)) }`; the base `.dock-icon-button` rule (`dock.css:645-668`) sets `transition: ... transform ...` but **no base `scale`/`transform`**.
  - `utilities.css:548,812,816` — `scale-on-hover` utility (`:548` `transform: scale(var(--scale-hover))`) and `.interactive-item` (`:812`/`:816` hover/active scale) — neither has `scale: 1` base.
  - `utilities.css:466-481` — `.hover-lift{,-md,-lg}` set `transform: translateY(...)` only on `:hover`; the `:where(...)` base (`:466`) has `transition-property: transform` but **no base `translate`/`transform`**.
  - `utilities.css:497-507` — `.shadow-cartoon-*` set `transform: translateY(-1px/-2px)` (static, not state, but still combined shorthand where `translate:` is the modern idiom).
  - `cards.css:41` — `transform: translate(var(--lift-sm), var(--lift-sm))` (the cartoon diagonal lift).
  - `utilities.css:115,143,313,317` — press/badge scale states, same pattern.
  **Modern replacement:** add `scale: 1`/`translate: 0` identity to each base rule; migrate state rules to individual `scale:`/`translate:`. **Effort S** · **lands-in glass-ui** · inv30 **yes** (the individual-transform property *is* the native platform feature; combined shorthand is the legacy path). **inv-29:** individual transform props are **Baseline since 2022** (Safari 14.1, FF 72) — so this is a safe rip-forward, NOT a PE-gate; the floor is automatic.
- **CSS-2 (P3) · No `text-wrap: balance`/`pretty`** — css §7 Typography. Repo grep: **0** `text-wrap` across all 20 stylesheets, despite a typography-heavy design system with `.text-display-*`/`.text-title` clamps in `typography.css`. Headings/prose would benefit from `text-wrap: balance` (headings) + `pretty` (body, no orphans). **Effort S** · **lands-in glass-ui** (`typography.css` recipes) · inv30 **no**. **inv-29:** `balance`/`pretty` degrade to normal wrap automatically — no gate needed.

**OPPORTUNITY**
- **`highlight-text-ranges`** (css `highlight-text-ranges` — the lone css-category guide id) for the demo's search-result highlighting in `demo/stories/data/search.vue` (458 LOC) via the CSS Custom Highlight API (`::highlight()`) instead of wrapping `<mark>`s. **lands-in glass-ui** (a `useHighlight` composable) if ≥2 consumers do search. inv30 **yes** (native highlight API replaces DOM-mutation libraries).

---

## (3) css-layout

**CONFORMANT**
- Container queries + `cqi` fluid units — **22** `container-type`/`@container` sites (`instrument-rail.css:35-47` `container-type: inline-size/size`; `tokens.css` `cqi` clamps). (`size-aware-styling`/`fluid-scaling`.)
- `dvh` dynamic viewport units (`SelectContent.vue` `var(--reka-popper-available-height, 60dvh)`; `tokens.css`). (css-layout intrinsic sizing.)

**DRIFT**
- **LAYOUT-1 (P1) · `@floating-ui/dom` JS positioning for ALL overlays** — `resilient-context-menus-and-nested-dropdowns` + `position-aware-tooltips`. reka-ui depends on `@floating-ui/dom`+`@floating-ui/vue`; **every** glass-ui overlay (`tooltip/`, `popover/`, `dropdown-menu/`, `hover-card/`, `select/`, `combobox/`, `context-menu/`, `dialog/DialogContent.vue:5-11`, `custom/hover-popover/`, `custom/icon-tooltip/`) inherits per-frame JS `computePosition` collision/flip math on scroll/resize. The platform now does `anchor-name`/`position-area`/`position-try-fallbacks` declaratively on the compositor. Repo grep: **0** `anchor-name`/`position-area`/`position-try`. **Effort L** · **lands-in glass-ui** · inv30 **yes** (anchor positioning is the canonical native-replaces-`@floating-ui` case). **inv-29:** anchor positioning is Chrome-only (FF/Safari unsupported) — this MUST ship behind `@supports (anchor-name: --x)` with reka/`@floating-ui` retained as the **floor**, NOT a rip-out. This is the largest-ceiling, largest-blast-radius play.
- **LAYOUT-2 (P2) · Hand-rolled tooltip arrow/side, no anchored container query** — `position-aware-tooltips`. `hover-popover.css` + `tooltip/TooltipContent.vue` style the panel but side-flip/arrow-direction rests on reka's JS. `container-type: anchored` + `@container anchored(fallback: flip-block)` would flip the arrow with **zero JS** (Chrome 143). **Effort M** · **lands-in glass-ui** · inv30 **yes**. **inv-29:** `container-type: anchored` is Chrome 143-only — gate behind `@supports (container-type: anchored)`; the JS arrow logic remains the floor. (Note: the empty `css-layout.md` index means these guides live under `user-experience` — cited there too.)

**OPPORTUNITY**
- **`anchor-positioning-tab-underline`** (user-experience) for the underline-tabs (`custom/tabs/UnderlineTabs.vue`) — an anchor-positioned moving underline replaces JS measurement. **lands-in glass-ui** · inv30 **yes** · PE-gated.

---

## (4) forms

**CONFORMANT**
- Form controls forward reka-ui primitives (`number-field/`, `multi-select/`, `combobox/`, `tags-input/`) — keyboard, ARIA, composition handled. (Baseline semantics correct.)

**DRIFT**
- **FORMS-1 (P1) · No `:user-valid`/`:user-invalid` — hostile premature validation** — `validate-input-after-interaction`/`required-field-feedback`. Repo grep: **0** `:user-valid`, **0** `:user-invalid`, **0** `aria-invalid`-driven CSS in `input/`, `textarea/`, `number-field/`. Validity is styled (where at all) via reka/class state, so a `required` empty field flags red on load. The guide marks HTML5-constraint + `:user-invalid` deferral **MANDATORY**. **Effort S** (per control) · **lands-in glass-ui** · inv30 **yes** (native `:user-invalid` replaces JS validity-class plumbing). **inv-29:** `:user-valid`/`:user-invalid` are **Baseline** — safe to adopt directly; floor is automatic.
- **FORMS-2 (P2) · No `field-sizing: content`** — `form-fields-automatically-fit-contents`. Repo grep: **0** `field-sizing`. `Textarea.vue:24` is `class="input-pill min-h-20 py-2"` — fixed min-height, no content auto-grow; consumers reach for JS autosize. `field-sizing: content` + `min/max-inline-size` does it natively. **Effort S** · **lands-in glass-ui** (`textarea/`, `input/`, `select/`) · inv30 **yes** (native field-sizing replaces JS autosize libs). **inv-29:** `field-sizing` is Chrome/Edge-only — gate behind `@supports (field-sizing: content)`; fixed `min-h-20` is the floor.

**OPPORTUNITY**
- **`autofill-sign-in-form`/`autofill-address-form`** autocomplete-token discipline — if any consumer ships real forms, glass-ui's form primitives should expose `autocomplete`/`inputmode` pass-through conventions. **lands-in glass-ui** (prop forwarding) · inv30 **no**.

---

## (5) html

**CONFORMANT**
- Reka-ui Dialog/Popover wrappers carry correct roles/ARIA (`DialogContent.vue` reka import). Semantic `<section>`/`<main>`/`<nav>` in demo shell (`AppShell.vue:68` `<main>`).

**DRIFT**
- **HTML-1 (P2) · Overlays are framework-portaled, not native `<dialog>`/`popover`** — `declarative-dialog-popover-control`/`platform-controls-dismiss-dialog`/`light-dismiss-a-dialog`. Repo grep: **0** `<dialog`, **0** `popover=`, **0** `showModal()`, **0** `command=`/`commandfor=`. Every modal/menu is a reka `DialogPortal`/`Popper` with JS focus-trap + JS light-dismiss + JS scrim. Native `<dialog>`/`[popover]` give top-layer, `::backdrop`, light-dismiss, and focus management from the platform. **Effort L** (reka-coupled) · **lands-in glass-ui** · inv30 **yes** (native top-layer replaces the framework portal). **inv-29:** `popover`/`<dialog>` are Baseline 2025/widely-available — but the rip would mean re-homing reka; pragmatic path is the **enter/exit half** (UX-2 below) first, leaving reka's semantics as the floor.

**OPPORTUNITY**
- **`declarative-button-actions`** (`command`/`commandfor` invoker commands) for demo buttons that toggle overlays — zero-JS open/close. **lands-in glass-ui** (Button could forward `command`/`commandfor`) · inv30 **yes** · Baseline-gated.

---

## (6) performance

**CONFORMANT**
- Aurora WebGL/rAF loop pauses off-screen via `useIntersectionPause` (`useAurora.ts:246`) — already a real off-screen-pause arm. (`efficient-background-processing`, IO arm.)
- `contain: layout style paint` isolates the named scroll-timeline (`utilities.css:231`).
- Named `scroll-timeline` + `animation-range` (`CardHeader.vue:81-99`, `utilities.css:232`) keeps the card-shrink off the main thread. (`scroll-entry-exit-effects` done natively.)

**DRIFT**
- **PERF-1 (P1) · No `content-visibility: auto` + `contain-intrinsic-size` on the heavy demo tree** — `defer-rendering-heavy-content`. Repo grep: **0** `content-visibility`, **0** `contain-intrinsic-size` across `src/` and `demo/`. The demo story tree is **15,736 LOC** of `.vue` (`search.vue` 458, `instrument-chassis.vue` 345, `card.vue` 340, `metric-badge.vue` 305, dense `TokenLadder`/`ToneSwatch` grids) — long, self-contained, below-the-fold `StorySection` blocks (`StorySection.vue`) get no deferral. Same gap hits any consumer rendering a long glass-card feed. **Effort S** (one utility class + intrinsic-size) · **lands-in glass-ui** (`utilities.css` `.deferred-section`) used in **demo** · inv30 **no**. **inv-29:** `content-visibility: auto` degrades to "render normally" where unsupported — pure win, no gate.
- **PERF-2 (P2) · Aurora pauses on `IntersectionObserver`, not `contentvisibilityautostatechange`** — `efficient-background-processing` is explicit: **IO for app logic, `contentvisibilityautostatechange` for rendering-heavy work (canvas/WebGL)** because it ties to the browser's render lifecycle (pre-render margin). `useAurora.ts:246` uses the IO arm; the guide marks the render-lifecycle event strictly more correct *for this exact canvas/WebGL case*. **Effort M** · **lands-in glass-ui** (`useAurora.ts`) · inv30 **no** (refinement of an already-working pause, not platform-replaces-library). **inv-29:** keep IO as the floor; add the CV event behind `content-visibility: auto` feature-detect.
- **PERF-3 (P2) · `useScrollProgress` is a JS rAF scroll listener** — `parallax-scroll-effects`/`scroll-entry-exit-effects`/`scroll-progress-indicator`. `useScrollProgress.ts:35-67` runs `window.addEventListener('scroll', schedule)` → `requestAnimationFrame` → `getBoundingClientRect()` mapping to a 0..1 ref (drives "scroll-linked typography axes, parallax depth, progress indicators" per its own docstring). Forced reflow + main-thread work per frame. The repo **already proved the native form** in `CardHeader` (`scroll-timeline`); this composable is the un-migrated twin. Consumed by `demo/stories/composables/use-scroll-progress.vue` + `demo/stories/motion/scroll-type.vue`. `animation-timeline: view()`/`scroll()` does it on the compositor. **Effort M** · **lands-in glass-ui** (`src/composables/motion/`) · inv30 **yes** (Scroll-Driven Animations is the native-replaces-JS-listener case). **inv-29:** ship the CSS `view()`/`scroll()` recipe behind `@supports (animation-timeline: scroll())`, keep `useScrollProgress` as the Firefox/Safari floor — NOT a rip-out.

**OPPORTUNITY**
- **`faster-spa-view-transitions`** + **`detect-initial-visibility-state`** for the demo router — preserve DOM state of visited stories with `content-visibility: hidden` instead of destroy/rebuild on every `router.push`. **lands-in demo** · inv30 **no**.

---

## (7) privacy — N/A

The library layer ships no analytics, tracking, fingerprinting, or storage APIs (0 hits). The privacy guides (`batch-analytics-events`, `deprioritize-background-fetches`, etc. live under performance; the privacy category index is empty). A design system has no privacy surface. **N/A.**

---

## (8) security — N/A (for the library; one host note)

The library ships no network, CSP, headers, or credential code. The demo `index.html` has **0** CSP/`integrity=`/`rel="noopener"`/`crossorigin` (grep confirmed) — but a CSP and SRI are a **host/deploy** concern (the consuming app's CDN/server), not a design-system API. Booked as a host note, not a library finding. **N/A for the design layer.**

---

## (9) user-experience

This is where the bulk of applicable guides live (the css-layout/html indexes are thin; their guides resolve here).

**CONFORMANT**
- `physics-based-easing` — `linear()` springs as tokens (`tokens.css:137-140`). ✓
- `scroll-entry-exit-effects` — native `scroll-timeline` in `CardHeader.vue:81-99`. ✓
- `child-state-based-styling`/`style-parent-with-has` — `:has()` at `ScrubberTimeline.vue`, `TableCell.vue`. ✓
- `size-aware-styling`/`fluid-scaling` — 22 container-query sites. ✓
- `carousel-snap-highlights` (partial) — `GlassCarousel.vue:61` emits `[scroll-snap-type:...]` natively (scroll-snap, not a JS carousel for the snap axis). ✓

**DRIFT**
- **UX-1 (P1) · Individual transform properties** — see CSS-1 (the css and user-experience categories share `individual-transform-properties`). 52 sites, base-identity MANDATORY violation. **Effort S · lands-in glass-ui · inv30 yes.**
- **UX-2 (P1) · Top-layer enter/exit via Vue `<Transition>` classes, not `@starting-style` + `transition-behavior: allow-discrete`** — `animate-to-from-top-layer`/`animate-element-entry-exit`. `transitions.css:43-94` choreographs reka-portaled overlays through JS-toggled `.dialog-scale-enter-*`/`.pop-enter-*`/`.dropdown-enter-*` Vue transition classes. Repo grep: **0** `@starting-style`, **0** `allow-discrete`, **0** `transition-behavior`. The native path (`@starting-style { … }` + `transition-behavior: allow-discrete` on `display`/`overlay`, animate `::backdrop`) animates top-layer dialogs/popovers with **zero** framework class toggling and survives reka's portal. **Effort M** · **lands-in glass-ui** (`transitions.css`) · inv30 **yes** (native top-layer transition replaces the Vue `<Transition>` JS-class engine). **inv-29:** `@starting-style`+`allow-discrete` are Baseline-newly-available — add behind `@supports (transition-behavior: allow-discrete)`, keep the Vue transition classes as the floor.
- **UX-3 (P2) · `useScrollProgress` JS listener** — see PERF-3 (`parallax-scroll-effects`/`scroll-progress-indicator`). **Effort M · lands-in glass-ui · inv30 yes · PE-gated floor.**
- **UX-4 (P2) · Partial-glass surfaces** — see A11Y-1 (`child-state-based-styling`). 7 sites. **Effort S/M · lands-in glass-ui · inv30 no.**
- **UX-5 (P3) · Hand-rolled cartoon diagonal-lift recipe, 9 demo sites** — `individual-transform-properties` + `reduce-style-repetition`. The flagship "sticker" interaction `hover:-translate-x-px hover:-translate-y-px` + `shadow-cartoon → shadow-cartoon-hover` is reinvented at **9** demo call sites (`compositions/empty-states.vue:99`, `compositions/dashboard.vue:115`, `aurora/PresetPickerRow.vue:46`, `compositions/hero.vue:177`, `foundations/{intro:65,icons:84,shadows:60}.vue`, `primitives/buttons.vue:134,151`) with no canonical class — the existing `.hover-lift*` does *vertical* `translateY`, not the *diagonal* `-x/-y` cartoon lift. **Effort S** · **lands-in glass-ui** (mint `.hover-cartoon` next to `.hover-lift` at `utilities.css:466`, authored with individual `translate:` + base identity so it fixes UX-1 by construction) · inv30 **no**. *This is the glass-ui gap "`.hover-cartoon` utility" below and the strongest self-canon signal.*

**OPPORTUNITY (high-leverage native adoptions)**
- **`same-document-transitions`/`group-element-transitions`** — wrap demo `router.push` (`useStoryNavigation.ts:64-93`) and the `AppShell.vue:69` `RouterView` swap in `document.startViewTransition`; expose `view-transition-name` conventions from glass-ui so the carousel slide swaps and any consumer's route morphs are consistent. Repo grep: **0** `view-transition`/`startViewTransition`. **Effort M** · **lands-in demo** (+ `view-transition-name` tokens land in glass-ui) · inv30 **no** · **inv-29:** `startViewTransition` is feature-detected (`if (document.startViewTransition)`) by construction — instant cross-engine floor.
- **`carousel-slide-effects`** — `GlassCarousel` already uses `scroll-snap`; layer scroll-driven enter/center/exit slide effects via `animation-timeline: view()` (fade/scale per slide on the compositor). **lands-in glass-ui** · inv30 **yes** (scroll-driven CSS replaces any JS slide-effect rAF) · PE-gated.
- **`animate-to-intrinsic-sizes`** (`calc-size()`/`interpolate-size`) for accordion/collapsible (`ui/accordion/`, `ui/collapsible/`) — animate to `height: auto` natively instead of JS max-height. **lands-in glass-ui** · inv30 **yes** · gate behind `@supports (interpolate-size: allow-keywords)`.

---

## (10) webmcp — N/A

No agentic tool surface (0 `webmcp`/tool-call hits). A presentational design system exposes no MCP tools. **N/A.**

---

## (11) built-in-ai — N/A

No `window.ai`/summarizer/translator/language-model usage (0 hits). N/A for a UI library. **N/A.**

---

## (12) passkeys — N/A

No `navigator.credentials`/`publicKey`/auth surface (0 hits). N/A for a design system. **N/A.**

---

## P0 / P1 severity-ranked table

| Sev | Finding | Guide id | Site(s) (file:line) | Effort | Lands-in | inv30 |
|---|---|---|---|---|---|---|
| **P1** | Combined `transform:` shorthand on hover/state, no MANDATORY base identity (52 sites) | `individual-transform-properties` | `dock.css:311,676,680,708,824,967,972`; `utilities.css:466-481,548,812,816`; `cards.css:41` | S | glass-ui | **yes** |
| **P1** | `@floating-ui/dom` JS positioning for ALL overlays | `resilient-context-menus-and-nested-dropdowns` | `dialog/DialogContent.vue:5-11` + all `ui/{tooltip,popover,dropdown-menu,hover-card,select,combobox,context-menu}/` + `custom/{hover-popover,icon-tooltip}/` | L | glass-ui | **yes** |
| **P1** | Top-layer enter/exit via Vue `<Transition>` classes, not `@starting-style`+`allow-discrete` | `animate-to-from-top-layer` | `transitions.css:43-94` (0 `@starting-style`/`allow-discrete`) | M | glass-ui | **yes** |
| **P1** | No `:user-valid`/`:user-invalid` — hostile premature validation | `validate-input-after-interaction` | `ui/{input,textarea,number-field}/` (0 hits) | S | glass-ui | **yes** |
| **P1** | No `content-visibility: auto` on 15.7k-LOC demo story tree | `defer-rendering-heavy-content` | `demo/stories/**` + `StorySection.vue` (0 hits) | S | glass-ui (used in demo) | no |
| **P1** | `useScrollProgress` JS rAF scroll listener (native `scroll-timeline` already proven in repo) | `scroll-progress-indicator` / `parallax-scroll-effects` | `composables/motion/useScrollProgress.ts:35-67` | M | glass-ui | **yes** |

*(No P0: nothing is outright broken or a hard a11y fail — the glass-a11y triad and PRM brackets hold. The P1s are systemic perf/ux/dx drift across the shared layer, each multiplied by every consumer.)*

---

## glass-ui GAPS — adoptions that should land in glass-ui for ≥2 consumers (the cross-consumer lever)

1. **Base transform identity + individual-transform migration across the motion layer** (`individual-transform-properties`) — add `scale: 1`/`translate: 0` to every hover/state base rule (`dock.css` `.dock-icon-button`, `utilities.css` `.hover-lift*`/`scale-on-hover`/`.interactive-item`, `cards.css`) and migrate state rules to individual props. **Removes hover-only stacking-context shifts for every consumer AND is the hard prerequisite for the anchor-positioning play (#3).** S effort, Baseline (no gate). *Highest ux/perf-per-hour.*
2. **`.hover-cartoon` / `.lift-cartoon` utility (9 demo sites reinvent it)** — mint at `utilities.css:466` next to `.hover-lift`, authored with individual `translate:` + base identity so it discharges gap #1 by construction; `--shadow-cartoon-hover` already exists at `tokens.css:440`. The library reinventing its flagship sticker interaction 9× is the strongest self-canon signal.
3. **Anchor-positioned overlay variant (PE over reka/`@floating-ui`)** (`resilient-context-menus-and-nested-dropdowns`, `position-aware-tooltips`) — behind `@supports (anchor-name: --x)`, drive flip/shift via `position-area` + `position-try-fallbacks` + `container-type: anchored` arrows; fall back to reka/`@floating-ui` where unsupported (inv-29 floor). Every overlay × every consumer. Largest ceiling, largest blast radius, L effort.
4. **Native top-layer enter/exit recipe (`@starting-style` + `transition-behavior: allow-discrete`)** (`animate-to-from-top-layer`) in `transitions.css` — decouples overlay motion from Vue `<Transition>` class toggling, composes with reka's portal. Behind `@supports (transition-behavior: allow-discrete)`, Vue transitions as floor. M effort.
5. **CSS scroll-driven path for `useScrollProgress`** (`scroll-progress-indicator`) — ship a `view()`/`scroll()` CSS recipe (mirror the proven `CardHeader` `scroll-timeline`), keep the composable as the `@supports`-gated Firefox/Safari floor. Moves parallax/progress off the main thread for ≥2 consumers. M effort.
6. **Partial-glass a11y bracket composable** (`child-state-based-styling`) — a `.glass-track` class (or a shared `@media` block any `--glass-blur-*` consumer can include) so the 7 sub-element glass surfaces inherit the `prefers-reduced-transparency`/`prefers-contrast`/`@supports not(backdrop-filter)` degraded path. S/M effort.
7. **`content-visibility: auto` + `contain-intrinsic-size` utility** (`defer-rendering-heavy-content`) — one `.deferred-section` utility in `utilities.css`, applied in demo story pages; immediate LCP/INP win on long pages for every consumer. S effort, no gate.
8. **`:user-valid`/`:user-invalid` + `field-sizing: content` on form primitives** (`validate-input-after-interaction`, `form-fields-automatically-fit-contents`) — native non-hostile validity + content-sized textareas; removes JS validity-class + JS autosize plumbing for `input/`, `textarea/`, `number-field/`, `multi-select/`. S effort (`:user-valid` Baseline; `field-sizing` PE-gated).
9. **`view-transition-name` token conventions** (`same-document-transitions`) — so the carousel slide swaps and any consumer's route morphs use a consistent naming scheme. M effort, feature-detected floor.

---

## Conformance scorecard (per category: ✓conformant · ✗drift · +opportunity)

| Category | ✓ Conformant | ✗ Drift | + Opportunity | Notes |
|---|---|---|---|---|
| accessibility | 3 | 1 | 1 | PRM + glass triad strong; partial-glass drops it (7 sites) |
| css | 5 | 2 | 1 | layers/oklch/springs/`:has()` exemplary; transform-shorthand (52) + no text-wrap |
| css-layout | 2 | 2 | 1 | container queries strong; overlays 100% JS (no anchor positioning) |
| forms | 1 | 2 | 1 | reka semantics ok; 0 `:user-valid`, 0 `field-sizing` |
| html | 2 | 1 | 1 | reka roles ok; overlays framework-portaled not native top-layer |
| performance | 3 | 3 | 1 | named scroll-timeline + IO pause; 0 content-visibility, JS scroll listener, IO-not-CV-event |
| privacy | — | — | — | N/A (no privacy surface) |
| security | — | — | — | N/A for library (host CSP note only) |
| user-experience | 5 | 5 | 3 | springs/scroll-timeline/`:has()`/CQ/snap; transforms, top-layer, scroll, partial-glass, cartoon-9 |
| webmcp | — | — | — | N/A |
| built-in-ai | — | — | — | N/A |
| passkeys | — | — | — | N/A |
| **Total (applicable)** | **21** | **16** | **9** | 7 categories applicable; 5 N/A |

*(Drift rows coalesce repeated patterns into one finding with a count — the 52-site transform-shorthand pattern is ONE drift, the 9-site cartoon-lift is ONE, the 7-site partial-glass is ONE. The same finding appears in both `css` and `user-experience` where the guide id is shared, by category; the de-duplicated drift count is **10 distinct findings** / **6 P1**.)*

---

## Delta vs the prior analyses

**CONFIRMS** (verified by grep at `file:line`, not just restated) the entire prior posture analysis: D1 overlay-positioning-JS, D3 transform-shorthand, D4 `useScrollProgress`, D5 top-layer-via-Vue-Transition, D6 Aurora-IO-not-CV, D7 forms, D8 content-visibility — all re-verified. Confirms the self-audit's `.hover-cartoon` 9-site gap and the partial-glass 7-site a11y gap.

**EXPANDS:**
- The transform-shorthand drift is **larger and more systemic than the prior "dock.css + cards.css" framing**: it is **52 `transform: scale|translate` sites in `src/styles/`**, and the violation is precisely the **missing base identity on rules that already declare `transition: transform`** (`.dock-icon-button` base `dock.css:645-668`; `.hover-lift` base `utilities.css:466`; `scale-on-hover`/`.interactive-item` `utilities.css:548,805-816`) — promoted from P2 to **P1** because it is also the prerequisite gate for anchor positioning.
- Added **two repo-wide zeros the prior pass didn't surface**: **0 `text-wrap`** (css §7, P3) across all 20 stylesheets, and the **native-`<dialog>`/`popover` gap** (HTML-1, 0 `<dialog>`/`popover=`/`command=`) as a distinct html-category finding beyond the positioning engine.
- Quantified the content-visibility target: the demo story tree is **15,736 LOC** of `.vue` with concrete heavy files (`search.vue` 458, `instrument-chassis.vue` 345, `card.vue` 340).
- Sharpened the **inv-29/inv-30 verdict on every finding**: anchor positioning / `container-type: anchored` / `field-sizing` / scroll-driven CSS are Chrome-or-partial → **MUST be `@supports`-gated with the library path as the floor (NO rip-out)**; whereas individual-transform-props and `:user-valid` are **Baseline** → safe direct adoption. This PE-floor framing was implicit before; it is now explicit per row.

**CORRECTS:** nothing material — the prior analyses were accurate. One refinement: the prior pass labeled the overlay positioning "best as a progressive-enhancement layer"; this audit makes the inv-29 floor a **hard requirement** (reka/`@floating-ui` stays as the FF/Safari floor, never removed) and separates it from the **native-top-layer-transition** half (UX-2), which is the more tractable, higher-ROI first step than a full anchor-positioning rewrite.

**Bottom line:** glass-ui is ahead of the curve on tokens, `linear()` springs, layers, scroll-timeline, and glass-a11y. The modern-web gap is concentrated in **transform discipline (52-site base-identity violation, P1, S-effort, the keystone), overlay positioning (still 100% JS), top-layer enter/exit (Vue classes not `@starting-style`), forms (0 native validity), and deferred rendering (0 content-visibility)**. The keystone fix is the base-transform-identity sweep: it is S-effort, Baseline-safe, ships the most ux/perf per hour, lands in glass-ui for every consumer, AND unblocks the anchor-positioning ceiling.
