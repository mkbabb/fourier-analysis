# Modern-Web Posture Audit — `words` (floridify-frontend)

**Lens:** Chrome `modern-web-guidance` v0.0.170 (12 categories)
**Date:** 2026-06-01
**Repo:** `/Users/mkbabb/Programming/words`
**Frontend dir:** `/Users/mkbabb/Programming/words/frontend`

## Preamble — Stack

- **Framework:** Vue 3.5 (`<script setup>`, Composition API), Vue Router 4, Pinia 3 (+ persisted state).
- **Build:** Vite 8, Tailwind v4 (`@tailwindcss/vite`), SCSS, TypeScript 6 (`vue-tsc`).
- **Shared layer:** `@mkbabb/glass-ui ^2.0.0` (Dialog, Toaster, HoverCard, TooltipProvider, ConfirmDialog, `useGlobalDark`) + `@mkbabb/keyframes.js ^2.1.1` + `@mkbabb/latex-paper`. **Note:** glass-ui is declared but NOT present in `node_modules` at audit time (`node_modules/@mkbabb/` is empty); analysis of glass-ui internals is inferred from the consumer surface and the built `dist/` CSS, which shows `--ease-spring-smooth: var(--spring-smooth)` resolving to `linear(0 …)` physics curves.
- **Other deps of note:** `@tanstack/vue-virtual` (present, but the long-list path uses a *hand-rolled* virtualizer), `reka-ui` (HoverCard/Dialog primitives), `embla-carousel`, `katex`, `highlight.js`, `sonner`/`vue-sonner`, `@clerk/vue` (auth — sign-in/up delegated to Clerk SDK, out of scope for forms).
- **Surfaces audited:** search bar (scroll-reactive shrink), definition display + media carousel, long sectioned word lists (virtual windowing), inline word-lookup pill/popover, modals (9 glass-ui `Dialog` consumers), PWA shell, iOS gesture layer.

The repo is, on balance, **already quite modern**: physics-based `linear()` easing tokens, `prefers-reduced-motion` guards, `dvh`/`svh` units, `color-scheme`-aware dark mode via glass-ui, self-hosted Fira Code, non-render-blocking font CSS, native `<dialog>` (via glass-ui) for all modals. The drift is concentrated in three hand-rolled patterns the platform now does natively: **JS-scroll-driven header shrink**, the **inline-lookup tooltip/popover**, and **JS-state-machine image lazy-loading without intrinsic dimensions**.

---

## (1) ALREADY-MODERN — keep these, don't regress

### performance / css (animation)
- **Physics-based `linear()` easing tokens** — `--ease-spring-snappy` / `--ease-spring-smooth` (→ `--spring-snappy`/`--spring-smooth`, `linear(0 …)` in `dist/assets/index-DwGR8Nc1.css:1`) used throughout transitions (`src/assets/transitions.css:91,98-99,103-104`, `SearchControls.vue:238-245`, `WordListUploadModal.vue:227-228`). This is exactly `physics-based-easing` — spring/bounce via `linear()`, not naive `cubic-bezier`. **(guide: `physics-based-easing`)**
- **`prefers-reduced-motion` honored per-animation** — `src/assets/transitions.css:80-86,113-118,174-177` and `src/assets/index.css:103-119` disable shimmer/confetti/slide/dock animations under reduced motion (scoped to named classes, not a global `*` reset on the project keyframes). Matches `css` §9 accessibility guidance. **(guide: `css`, `accessibility`)**
- **Individual transform properties / compositor-friendly animation** — confetti/cards animate `transform`+`opacity` only (`src/assets/transitions.css:91-111,141-161`), `will-change` scoped narrowly (`DefinitionDisplay.vue:408`, `Sidebar.vue:38`) rather than globally. Matches `individual-transform-properties` and `css` §9 performance. **(guide: `individual-transform-properties`)**

### html / accessibility (native overlays)
- **Native `<dialog>` for all modals via glass-ui** — 9 consumers import glass-ui `Dialog`/`DialogContent` (`src/components/custom/Modal.vue:21`, ConfirmDialog, WordDetail/Review/Edit/Create modals). Escape + backdrop + focus handling delegated to the native element; no hand-rolled focus traps. Matches `accessibility` §11 / `html` §4. **(guide: `accessibility` §11)**
- **`color-scheme`-aware dark mode + FOUC guard** — `useGlobalDark()` (`src/App.vue:28`) drives `<html>.dark`; an inline pre-paint script reads persisted theme to prevent dark-mode FOUC (`index.html:40-48`); `<meta name="theme-color">` split by `prefers-color-scheme` (`index.html:36-37`). Matches `css` §5 dark mode + `dark-mode`. **(guide: `dark-mode`)**

### performance (CRP / fonts)
- **Non-render-blocking web fonts + self-hosting** — `preconnect` to font origins, `<link rel="preload" as="style" … onload="this.rel='stylesheet'">` for Fraunces, `<noscript>` fallback; Fira Code self-hosted via glass-ui (`index.html:57-63`). Matches `performance` "Web Fonts Optimization" + CRP. **(guide: `performance`)**

### css-layout / css (units)
- **Dynamic viewport units** — `dvh`/`svh` used for modal max-height and sticky panels (`Modal.vue:66`, `Home.vue:31`, `scroll.ts:114,141`, `SearchControls.vue:4`). Matches `css` §6 "use `dvh`/`dvw`". **(guide: `css`)**

### user-experience (search semantics)
- **Search input carries a role + accessible name** — `role="searchbox"` + `aria-label="Search for a word"` on the `<textarea>` (`SearchInput.vue:7-8`). Reasonable baseline (see Drift for the `<search>`/`enterkeyhint` gaps). **(guide: `forms`)**

---

## (2) DRIFT — obsolete / ad-hoc patterns a guide now modernizes

### performance / css — JS scroll-listener driving header animation
- **Search-bar shrink/fade/scale computed in JS from a `window` scroll listener.** `Home.vue:174` `useScroll(window)` → `scrollProgress` (`Home.vue:180-188`) → passed into `SearchBar`, then `src/components/custom/search/utils/scroll.ts:101-149` (`calculateContainerStyle`) computes `transform: scale(...)`, `opacity`, and an interpolated `maxWidth` as inline styles every scroll frame; `calculateIconOpacity` (`scroll.ts:53-90`) does the same for the icon. This is the canonical case the platform now does declaratively with **CSS scroll-driven animations** (`animation-timeline: scroll(block root)` + `animation-range`), keeping the work on the compositor thread instead of the main thread.
  - **guide:** `shrinking-header-on-scroll` (also `css` §9, `performance` INP)
  - **site:** `src/views/Home.vue:174` + `src/components/custom/search/utils/scroll.ts:101`
  - **modern:** `animation-timeline: scroll()` + `animation-range`, with `@supports` feature-detect fallback (Firefox lacks support) and the existing `prefers-reduced-motion` guard.
  - **impact:** perf (main-thread scroll work + per-frame inline style writes → INP/jank risk) · **effort:** M

### user-experience / accessibility / html — hand-rolled tooltip + popover
- **Inline word-lookup pill + mini-definition popover is fully hand-built.** `src/composables/useInlineWordLookup.ts` wires `selectionchange`/`dblclick`/`mousedown` document listeners (`:150-161`), computes anchor position from `getBoundingClientRect` (`:40-46,108-116`), teleports to `body`, and manages click-outside dismissal + a 200ms dismiss timer manually (`:82-93,144-148`). The platform now provides the Popover API (`popover="hint"`/`auto`) with built-in light-dismiss, Esc handling, and (via `interestfor`) automatic `aria-describedby`/`aria-details` wiring, plus **anchor positioning** for the tether — replacing the manual positioning, the global listeners, and the WCAG-1.4.13 hover/dismiss/persist bookkeeping.
  - **guide:** `interest-triggered-tooltips`, `position-aware-tooltips`, `declarative-dialog-popover-control`
  - **site:** `src/composables/useInlineWordLookup.ts:40` (positioning) + `:150` (document listeners)
  - **modern:** `popover` attribute + CSS anchor positioning (`anchor-name`/`position-anchor` + `anchor()` + `position-try`), polyfilled where needed.
  - **impact:** a11y (manual ARIA/dismiss wiring is brittle; native gives WCAG 1.4.13 for free) · **effort:** M

### performance / html — image lazy-load reimplemented in JS, no intrinsic dimensions
- **Carousel images use a `shouldLoad`/`loaded` JS state machine with a hidden `@load` proxy `<img>`, and none of the `<img>` tags carry `width`/`height`/`loading`/`decoding`/`fetchpriority`.** `src/components/custom/definition/components/media/CarouselSlide.vue:44-114` gates rendering on JS props and renders an offscreen `opacity-0` image purely to fire `@load`. Native `loading="lazy"` + explicit `width`/`height` (or `aspect-ratio`) removes the entire state machine and prevents CLS; `decoding="async"` avoids main-thread decode stalls. Other `<img>`s (`ReviewModal.vue:40`, `ReviewSessionComplete.vue:18`, `ErrorState.vue:7`, `EmptyState.vue:7`, `Admin.vue:54`, `YoshiAvatar.vue:8`) also omit dimensions.
  - **guide:** `optimize-image-priority`, `performance` "Modern Image & Media Optimization", `html` §3
  - **site:** `src/components/custom/definition/components/media/CarouselSlide.vue:54` (and `:75`, `:106`)
  - **modern:** native `loading="lazy"` + `width`/`height` + `decoding="async"`; drop the JS `shouldLoad`/hidden-proxy machinery; `fetchpriority="low"` for offscreen carousel slides.
  - **impact:** perf (CLS from missing dimensions; removable JS) · **effort:** S

### forms / html — search field missing autofill/input semantics + `<search>` landmark
- **The search `<textarea>` has no `inputmode`/`enterkeyhint`, isn't wrapped in `<search>`/`<form method="GET">`, and the app has zero `autocomplete`/`inputmode`/`enterkeyhint`/`:user-valid` usage repo-wide** (grep across `src` returns none; Login/Signup are delegated to the Clerk SDK so are exempt). For the primary search surface, `<search>` removes the need for `role`, and `enterkeyhint="search"` improves the on-screen keyboard.
  - **guide:** `forms` §1-3, `html` §1 (`<search>`), `accessibility` §7
  - **site:** `src/components/custom/search/components/SearchInput.vue:1-37`
  - **impact:** ux (mobile keyboard affordance; landmark semantics) · **effort:** S

### performance — hand-rolled virtual windowing where `content-visibility` may suffice; `@tanstack/vue-virtual` already installed but unused on this path
- **`src/composables/virtual/useVirtualSectionWindow.ts` is a bespoke scroll-listener + rAF + ResizeObserver virtualizer** (`:243-262` scroll binding, `:158-164` rAF recalc, `:108-118` `getBoundingClientRect` offset reads) "transposed from glass-ui" (`:23-26`). For sectioned definition lists that are long but not unbounded, `content-visibility: auto` + `contain-intrinsic-size` defers offscreen layout/paint *without* maintaining a manual render window, measured-height cache, and spacer math. Where true windowing is required, `@tanstack/vue-virtual` (already a dependency) is the maintained primitive. This is a "heavy hand-rolled mechanism the platform now covers" note, not a correctness bug.
  - **guide:** `defer-rendering-heavy-content`, `interactions-in-complex-layouts`
  - **site:** `src/composables/virtual/useVirtualSectionWindow.ts:243`
  - **impact:** dx (sizeable custom code to maintain; `getBoundingClientRect` reads on scroll risk layout thrash) · **effort:** L

### css / accessibility — `WordDetailModal` saves+restores `window.scrollY` manually
- **`WordDetailModal.vue:190,195` snapshots `window.scrollY` and `setTimeout(() => window.scrollTo(...), 320)`** to restore scroll after the modal closes — a workaround for body-scroll-lock. With a native `<dialog>` (which the modal stack already uses elsewhere), the top-layer + inert backdrop avoids the need to hand-restore document scroll.
  - **guide:** `accessibility` §11, `html` §4
  - **site:** `src/components/custom/wordlist/modals/WordDetailModal.vue:190`
  - **impact:** ux (magic-number `320ms` restore is fragile) · **effort:** S

---

## (3) OPPORTUNITIES — high-leverage modern adoptions

### A. Convert the scroll-reactive search header to CSS scroll-driven animation — **lands in: this repo**
Replace `useScroll(window)` + `scroll.ts` style computation with `animation-timeline: scroll(block root)` + `animation-range`, gated by `@supports ((animation-timeline: scroll()) and (animation-range: 0% 100%))`, keeping the JS path only as the Firefox fallback. Removes per-frame main-thread style writes on the most-scrolled surface.
- **guide:** `shrinking-header-on-scroll` · **impact:** perf/INP · **effort:** M

### B. Re-home the inline-lookup tooltip onto Popover API + anchor positioning in **glass-ui** — **lands in: glass-ui**
The pill/popover tether + light-dismiss + ARIA wiring is generic UI plumbing that ≥2 consumers (words, and any other glass-ui app needing tethered popovers/tooltips) would benefit from. A glass-ui `<Popover anchor>` / interest-invoker primitive (native `popover` + `anchor-name`/`position-anchor` + polyfill) would let words delete `useInlineWordLookup`'s manual listeners and `getBoundingClientRect` positioning. Highest cross-repo leverage.
- **guide:** `position-aware-tooltips`, `interest-triggered-tooltips` · **impact:** a11y+dx · **effort:** M

### C. Native image loading hygiene across all `<img>` — **lands in: this repo**
Add `width`/`height` (or `aspect-ratio`), `loading="lazy"`, `decoding="async"` to every `<img>`; delete the `CarouselSlide` JS lazy-load state machine; `fetchpriority="low"` on offscreen carousel slides. Smallest effort, direct CLS + code-removal win.
- **guide:** `optimize-image-priority`, `performance` images · **impact:** perf/CLS · **effort:** S

### D. SPA View Transitions for route + definition navigation — **lands in: this repo (optionally a glass-ui router helper)**
There is no `startViewTransition` anywhere (grep: 0 hits) despite the app being a single-component-per-route SPA (`router/index.ts` maps Home/Search/Definition/Thesaurus/Wordlist all to `Home.vue`). Wrapping route/content swaps in `document.startViewTransition()` with directional `types` (`:active-view-transition-type()`) gives morphing word→definition transitions and reinforces forward/back spatial mapping, replacing the ad-hoc Vue `<Transition>` crossfades.
- **guide:** `directional-navigation-transitions`, `same-document-transitions` · **impact:** ux · **effort:** M

### E. `content-visibility: auto` + `contain-intrinsic-size` on offscreen definition sections — **lands in: this repo**
For the sectioned definition/word lists below the fold, apply `content-visibility: auto` with a derived `contain-intrinsic-size` (per `css` §9, prefer `lh`/`ch`-derived sizes). For lists that genuinely need windowing, migrate the bespoke `useVirtualSectionWindow` onto the already-installed `@tanstack/vue-virtual`. Cuts custom virtualization maintenance and offscreen layout cost.
- **guide:** `defer-rendering-heavy-content` · **impact:** perf · **effort:** L

### F. Search field native semantics — **lands in: this repo**
Wrap the search input in `<search>` and add `enterkeyhint="search"` + `inputmode="search"`; drop the now-redundant `role="searchbox"`. Tiny change, better mobile keyboard + landmark.
- **guide:** `forms`, `html` §1 · **impact:** ux/a11y · **effort:** S

---

## Top 8 Modernizations (ranked by impact × 1/effort)

| # | Title | Guide id | Impact | Effort | Lands in |
|---|-------|----------|--------|--------|----------|
| 1 | Native image hygiene: `width`/`height` + `loading=lazy` + `decoding`; delete CarouselSlide JS lazy-load | `optimize-image-priority` | perf/CLS | S | this repo |
| 2 | Search field `<search>` + `enterkeyhint`/`inputmode`, drop redundant role | `forms` | ux/a11y | S | this repo |
| 3 | Inline-lookup tooltip → Popover API + anchor positioning primitive | `interest-triggered-tooltips` | a11y/dx | M | glass-ui |
| 4 | Scroll-reactive search header → CSS scroll-driven animation | `shrinking-header-on-scroll` | perf/INP | M | this repo |
| 5 | `WordDetailModal` scrollY save/restore → rely on native dialog top-layer | `accessibility` §11 | ux | S | this repo |
| 6 | SPA View Transitions for route/definition navigation | `directional-navigation-transitions` | ux | M | this repo |
| 7 | `content-visibility: auto` on offscreen definition sections | `defer-rendering-heavy-content` | perf | M | this repo |
| 8 | Retire bespoke `useVirtualSectionWindow` for `@tanstack/vue-virtual` / `content-visibility` | `defer-rendering-heavy-content` | dx | L | this repo |

---

## Summary

`words` is a modern Vue 3 codebase that already adopts the hard-won platform wins — physics-based `linear()` easing, native `<dialog>` modals, `prefers-reduced-motion`, `dvh`/`svh`, `color-scheme` dark mode, non-render-blocking self-hosted fonts. The remaining drift is concentrated in three hand-rolled mechanisms the platform now does natively: a **JS-`window.scroll` header-shrink** (→ scroll-driven CSS animation), a **hand-built selection→pill→popover tooltip** with manual `getBoundingClientRect` positioning and document listeners (→ Popover API + anchor positioning, best re-homed in glass-ui for cross-repo leverage), and a **JS-state-machine image lazy-loader with no intrinsic dimensions** (→ native `loading=lazy` + `width`/`height`, the lowest-effort/highest-CLS win). The single highest-leverage move is #3 (the tooltip primitive in glass-ui); the cheapest immediate wins are #1, #2, and #5.
