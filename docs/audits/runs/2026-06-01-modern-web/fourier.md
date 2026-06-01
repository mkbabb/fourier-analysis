# Modern-Web Posture Audit — fourier (web/)

**Date:** 2026-06-01
**Lens:** Chrome modern-web-guidance v0.0.170 (`/tmp/mwg/.../guides`, 12 categories)
**Mode:** READ-ONLY analysis.

## Preamble

- **Repo:** fourier-analysis (FOCUS repo)
- **Frontend dir:** `/Users/mkbabb/Programming/fourier-analysis/web`
- **Stack:** Vue 3.5 (`<script setup>` SFCs) + Vite 7 + vue-router 4 + Pinia 2 + Tailwind v4 (`@tailwindcss/postcss`), TypeScript 5.8, Canvas 2D epicycle renderer, KaTeX 0.16 typeset paper, Playwright e2e.
- **Shared layer:** `@mkbabb/glass-ui@^2.0.0` (reka-ui-backed primitives: Dialog, Tooltip/HoverCard, Collapsible, Switch, Toaster, InfiniteScroll). Also `@mkbabb/latex-paper@^0.2.1` (supplies `useVirtualSectionWindow` — the paper's windowed render), `@mkbabb/value.js`, `@mkbabb/keyframes.js`, `@mkbabb/pencil-boil`.
- **Surfaces:** `/paper` (windowed KaTeX reader + virtual-section TOC), `/visualize` + `/w/:slug` + `/v/:slug` (canvas epicycles, image upload/contour editor, fullscreen viewer), `/gallery` (infinite grid + featured carousel + marquee + admin), `/equation` (live series convergence), `/morph`.

**Overall:** This is a *strong* modern-web posture. Overlays/tooltips/modals are delegated to the shared reka-ui layer (real focus-trap + `aria-modal`), fonts/KaTeX are self-hosted (zero third-party origins claim — one avatar exception, below), the bundle is split by load-cadence via `manualChunks`, the paper uses a windowed render, dark mode is flash-free, `prefers-reduced-motion` is honored in 9 files, the carousel uses CSS scroll-snap, and styling leans on `color-mix`/`dvh`/logical tokens. The drift is concentrated and high-value: one **hand-rolled focus-trap** that duplicates the native/`glass-ui` modal it sits next to, **paper figures with no intrinsic dimensions + PNG-only** (CLS + bytes in a windowed scroll), **no `content-visibility`** anywhere (the single biggest unrealized perf lever for a 97-page windowed paper and an off-screen 60fps canvas), **no View Transitions** on tab/workspace navigation, and a few JS-measured scroll affordances that CSS now does natively.

---

## (1) ALREADY-MODERN — keep, don't regress

### html / user-experience — native overlays via shared layer
- **Modal dialogs delegate to the native-semantics primitive.** `ExportModal.vue:46` and `GalleryCardModal.vue:73` use glass-ui `<Dialog>`/`<DialogContent>` (reka-ui `DismissableLayer` + `FocusScope`) — role=dialog, `aria-modal`, focus-trap, Esc, backdrop dismiss, all for free. Matches `html` §4 intent. (guide: `declarative-dialog-popover-control`, `html`)
- **Tooltips/hover-cards delegate to the shared primitive** with collision padding + side-offset — `ui/tooltip/Tooltip.vue:30`, `AppHeader.vue` HoverCard. No hand-rolled positioning. (guide: `position-aware-tooltips`)

### performance — loading & code-split
- **Self-hosted fonts, preloaded, zero third-party render-blocking origins.** `index.html:11-19` preloads the 3 critical CM Serif faces; KaTeX CSS is bundler-imported same-origin (`main.ts:5`). (guide: `performance` Web Fonts / Third-Party)
- **Bundle split by load-cadence** via `vite.config.ts` `manualChunks` (vendor-vue / -ui / -math / -paper / -keyframes) plus route-level `() => import()` lazy chunks in `router/index.ts`. (guide: `performance` JS Code-Splitting)
- **`module` script (deferred by default), no render-blocking JS in `<head>`** except the tiny synchronous dark-mode init (correct — must run pre-paint). (guide: `performance` CRP)
- **Windowed paper render** — `PaperView.vue:77` `useVirtualSectionWindow` mounts only an overscan window of the 97-page paper; far-jump navigation teleports behind an overlay then corrects. (guide-adjacent: `defer-rendering-heavy-content`)
- **Below-fold images lazy-loaded** — `loading="lazy"` on `GalleryCard.vue:101`, `GalleryDraftsSection.vue:80`, `PaperArticleWindow.vue:67`. (guide: `performance` Image Optimization)

### css / css-layout — modern primitives
- **`color-mix()` everywhere for tints** instead of preprocessor color math; `in srgb`/transparent mixes are intentional and in-gamut. (guide: `css` §8.3)
- **Dynamic viewport units** — `h-dvh` app shell (`App.vue`), `100dvw`/`100dvh` in `style.css`/`PaperView.vue`. (guide: `css-layout` §1.2)
- **CSS scroll-snap carousel** — `GalleryFeaturedCarousel.vue:67` `scroll-snap-type: x mandatory` + `scroll-snap-align` + a `mask-image` edge fade. No JS carousel engine. (guide: `carousel-slide-effects` substrate)
- **`:has()` for child-state styling** — `GlassTimeline.vue:103` `.timeline-row:has(.glass-slider[data-held])`. (guide: `css` §3, child-state-based-styling)
- **`:focus-visible` rings with `outline-offset`**, not `:focus`, declared globally for scoped-component classes — `style.css:136-143`. (guide: `css` §4, accessibility §5)
- **CSS containment carousel marquee** with `prefers-reduced-motion` + hover-pause — `GalleryMarquee.vue:95-123` (`will-change: transform`, transform-only keyframes). (guide: `css` §9 Performance)

### accessibility
- **Per-route `<title>` + meta description update** in `router/index.ts` `afterEach`. (guide: `accessibility` §4 SPA transitions)
- **ARIA-button-on-non-button done correctly** where native isn't used — `GalleryCard.vue:68-78` role+tabindex+Enter/Space+aria-label; light-AA contrast carry for `--viz-amber` (`style.css:113-127`). (guide: `accessibility` §2/§5)
- **Real focus management** — modals delegate; `FullscreenViewer` saves/restores trigger focus (the *trap mechanism* is the drift, below — but focus return is correct).

---

## (2) DRIFT — obsolete / ad-hoc / heavy patterns a guide now modernizes

### a11y / dx — hand-rolled focus-trap duplicating a native overlay
- **`FullscreenViewer.vue:30-101`** hand-rolls a Tab/Shift-Tab focus-trap (`FOCUSABLE` selector query, `onTrapKeydown` wrap-around, manual Esc, manual focus save/restore, `Teleport to body`) — ~70 lines reimplementing exactly what `<dialog>.showModal()` (native top-layer focus-trap + `::backdrop` + Esc) or the glass-ui `<Dialog>` already used in `ExportModal`/`GalleryCardModal` give for free. The component even comments "(no new dep)" — but the dep is already present and used two files over.
  - **guide:** `declarative-dialog-popover-control` / `html` §4
  - **impact:** a11y · **effort:** M · **modern:** native `<dialog closedby="any">` (top-layer, real inertness of the background — the manual trap does *not* `inert` the background, so AT virtual-cursor can still escape) or reuse glass-ui `<Dialog>`.

### perf — no `content-visibility` anywhere (the biggest unrealized lever)
- **No `content-visibility` / `contain-intrinsic-size` in the entire `src/` tree** (grep: 0 hits). Two surfaces want it badly:
  - **Paper windowed sections** (`PaperArticleWindow.vue:46-85`): the JS window already unmounts far sections, but the *in-window* overscan sections (`overscanAfterPx: 720`, warm-ahead 3) are fully laid-out + KaTeX-painted while below the fold. `content-visibility: auto` + `contain-intrinsic-size` on `.paper-window-section` lets the browser skip paint/layout for the not-yet-scrolled-to warm sections.
  - **guide:** `defer-rendering-heavy-content` · **impact:** perf · **effort:** S
- **Off-screen canvas keeps animating at 60fps.** `stores/animation.ts:42-56` rAF loop + `BasisCanvas.vue:418` render watcher run whenever `playing`, regardless of whether the canvas is scrolled off-screen or behind the fullscreen layer / another tab-panel. rAF pauses on *tab* hide but not on *scroll* off-screen.
  - **site:** `stores/animation.ts:42` / `BasisCanvas.vue:418`
  - **guide:** `efficient-background-processing` (`contentvisibilityautostatechange`) · **impact:** perf · **effort:** M
- **SPA tab-panels destroyed/recreated on every route switch** (router lazy chunks, no keep-alive, no cached view). Returning to `/visualize` re-mounts the whole canvas tree.
  - **site:** `App.vue` `<RouterView>` / `router/index.ts`
  - **guide:** `faster-spa-view-transitions` (`content-visibility: hidden` cached inactive views) · **impact:** perf/ux · **effort:** M

### perf / ux — images missing dimensions + modern formats
- **Paper figure `<img>` has no `width`/`height`/`aspect-ratio`, only `max-height:400px`, and is PNG-only** — `PaperArticleWindow.vue:61-68`. In a windowed scroll where sections mount/unmount, an un-dimensioned image is a CLS generator (the very scroll-correction loop in `useScrollNavigation.ts` exists partly to fight layout instability). The source PDFs are rasterized to PNG; no AVIF/WebP `<picture>`.
  - **guide:** `performance` Image Optimization / `css-layout` §1.2 (`aspect-ratio`) / `deliver-optimized-decorative-images`
  - **impact:** perf (CLS + bytes) · **effort:** M · **modern:** `<picture>` AVIF→WebP→PNG + `width`/`height` (or `aspect-ratio`) so the windowed scroll reserves space.
- **Gallery thumbnails lazy-loaded but un-dimensioned** — `GalleryCard.vue:97-103` relies on the `aspect-[4/3]` frame (good) but the `<img>` itself has no `width`/`height` and is served at one resolution (no `srcset`/`sizes`); 4:3 frame saves it from CLS but mobile downloads desktop-sized thumbs.
  - **guide:** `performance` (`srcset`/`sizes`) · **impact:** perf · **effort:** M
- **No `fetchpriority` anywhere** (grep: 0). The `/visualize` route's hero is the canvas (no LCP image), and `/paper`'s LCP is the H1 text — so this is *low* urgency here, but the gallery's first featured card / first grid row are LCP candidates that currently inherit default priority.
  - **guide:** `optimize-image-priority` · **impact:** perf · **effort:** S

### ux — no View Transitions on navigation
- **Tab switches use a bespoke CSS keyframe** (`style.css:83-90` `[data-state="active"][role="tabpanel"]` `translateX(8px)` slide-in) and route changes have no transition at all. The View Transitions API would give a single declarative cross-fade/directional morph across the whole `<RouterView>` swap, and could share the canvas element across `/w/`↔`/v/` (same component, different slug) for a morph instead of a remount-flash.
  - **site:** `App.vue` RouterView / `style.css:83`
  - **guide:** `directional-navigation-transitions` / `same-document-transitions` · **impact:** ux · **effort:** M

### dx / ux — JS measuring what CSS scroll-state now does
- **`PaperView.vue:147-217` IntersectionObserver toggles the mobile floating TOC** based on whether the inline TOC nav is intersecting. This "show a floating widget once the user scrolls past X" is exactly the `scroll-position-aware-elements` pattern (container scroll-state queries) — though IO is still a legitimate choice; flag as *opportunity-grade* drift only.
  - **guide:** `scroll-position-aware-elements` · **impact:** dx · **effort:** M
- **`CollapsibleSection.vue:17-30` uses a `setTimeout(250)` + `getBoundingClientRect` + `scrollIntoView`** to nudge a just-opened accordion into view — a hand-timed coupling to the animation duration. Brittle (magic 250 must track the CSS `0.2s`). The open/close animation itself is already native glass-ui (good); only the scroll-nudge is ad-hoc.
  - **site:** `CollapsibleSection.vue:20`
  - **guide:** `css` §9 / `defer-rendering-heavy-content` · **impact:** dx · **effort:** S

### privacy / perf — one third-party origin contradicting the "zero origins" posture
- **`AppHeader.vue:71` loads the GitHub avatar from `avatars.githubusercontent.com`** — a third-party origin (an extra DNS+TLS handshake, a privacy beacon to GitHub, and it breaks the otherwise-clean "zero third-party origins" claim in `index.html`). It is inside a HoverCard so it's not render-critical, but it should be self-hosted/proxied.
  - **guide:** `performance` Third-Party / `privacy` · **impact:** privacy/perf · **effort:** S

---

## (3) OPPORTUNITIES — high-leverage modern adoptions

| # | Opportunity | Guide | Lands in | Why |
|---|---|---|---|---|
| A | `content-visibility: auto` + `contain-intrinsic-size` on `.paper-window-section` (and any in-window warm-ahead section) | `defer-rendering-heavy-content` | **this repo** | Skips paint/layout/KaTeX work for warm-but-offscreen paper sections; complements the existing JS window at near-zero cost/risk. |
| B | Pause the canvas rAF when off-screen via `contentvisibilityautostatechange` (or IO) | `efficient-background-processing` | **this repo** (gate in `animation.ts`) | A 60fps epicycle loop burning CPU/GPU/battery while scrolled away or behind the fullscreen layer is pure waste. |
| C | Retire the `FullscreenViewer` hand-trap → native `<dialog closedby="any">` or glass-ui `<Dialog>` | `declarative-dialog-popover-control` | **this repo** (consume glass-ui) | Deletes ~70 lines, gains true background `inert`, fixes the AT-escape gap, unifies on the modal pattern already used twice elsewhere. |
| D | `<picture>` AVIF→WebP + intrinsic dims for paper figures & gallery thumbs; add a small thumbnail-transcode step | `performance` Image / `deliver-optimized-decorative-images` | **this repo** (frontend) + API (transcode) | Cuts figure/thumb bytes substantially and removes the windowed-scroll CLS the figure currently injects. |
| E | View Transitions across `<RouterView>` + shared-element morph for `/w/`↔`/v/` (same canvas component) | `directional-navigation-transitions` / `same-document-transitions` | **glass-ui** (a `<RouterTransition>` / `useViewTransition` helper — ≥2 constellation consumers route between SPA views) | One declarative API replaces the bespoke tab-slide keyframe and eliminates the remount-flash; highest leverage if it lands in the shared layer. |
| F | `content-visibility: hidden` cached inactive tab-panels / views (LRU-bounded — the app has a small fixed view set) | `faster-spa-view-transitions` | **this repo** | Instant return to `/visualize` without rebuilding the canvas/contour tree. |
| G | Self-host (or proxy) the GitHub avatar | `performance` Third-Party / `privacy` | **this repo** | Restores the genuine "zero third-party origins" posture; removes a privacy beacon. |
| H | Promote the manual `.featured-scroll` carousel's static cards to scroll-driven slide effects (scale/fade on enter/center/exit) | `carousel-slide-effects` | **glass-ui** (the carousel/scroller is a candidate shared primitive) | The scroll-snap scaffolding is already there; adding `animation-timeline: view()` makes it expressive with zero JS — shareable across consumers. |

---

## Top 8 Modernizations (ranked by impact × 1/effort)

| Rank | Title | Guide id | Impact | Effort | Lands in |
|---|---|---|---|---|---|
| 1 | `content-visibility: auto` + `contain-intrinsic-size` on paper window sections | `defer-rendering-heavy-content` | perf | S | this repo |
| 2 | Self-host the GitHub avatar (restore zero-3p-origins) | `performance` / `privacy` | privacy/perf | S | this repo |
| 3 | Retire `FullscreenViewer` hand-trap → native `<dialog>` / glass-ui `<Dialog>` | `declarative-dialog-popover-control` | a11y/dx | M | this repo |
| 4 | Pause off-screen canvas rAF via `contentvisibilityautostatechange` | `efficient-background-processing` | perf | M | this repo |
| 5 | Paper figures: `<picture>` AVIF/WebP + intrinsic dims (kill CLS) | `performance` image opt | perf | M | this repo (+API) |
| 6 | View Transitions across RouterView + shared-element `/w/`↔`/v/` | `directional-navigation-transitions` | ux | M | **glass-ui** |
| 7 | Cache inactive views with `content-visibility: hidden` (LRU) | `faster-spa-view-transitions` | perf/ux | M | this repo |
| 8 | Gallery thumbnails: `srcset`/`sizes` (+ optional `fetchpriority` on first row) | `optimize-image-priority` | perf | M | this repo (+API) |
