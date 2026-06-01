# Modern-Web Posture — `speedtest` (speedtest.friday.institute)

**Run:** 2026-06-01 · **Lens:** Chrome modern-web-guidance v0.0.170 (offline corpus)
**Analyst:** read-only modernization pass. No edits to the target repo.

## Preamble

| Field | Value |
| :--- | :--- |
| Repo | `/Users/mkbabb/Programming/speedtest` |
| Frontend dir | `src/` (Vue 3.5 SFCs, ~50 `.vue` + composables) |
| Stack | Vue 3.5.34 + Vite 8 + Tailwind v4 + Pinia 3 + vue-router 5; reka-ui / vaul-vue / vue-sonner primitives; ECharts 6 + maplibre-gl 5 for the dashboard; `@mkbabb/keyframes.js` for physics motion; canvas2d meter renderer; PWA via vite-plugin-pwa |
| Shared layer | **`@mkbabb/glass-ui` v2.1.0** (the design substrate — owns dialog/sheet/popover/hover-card/tooltip primitives, the `--spring-*` `linear()` easing tokens, the `scroll-timeline: --card-scroll` host, `scroll-fade-bottom`, `useRAFLoop`/`SmoothProgress` motion, the `@font-face` corpus) |

**Headline:** This frontend is already an exceptionally modern, heavily-audited surface. Prior tranches (the `AG.W-PERF.L3`, `AC.W6b`, `AM-W1-α`, `W5-L1`, `AI.W1-α` markers in-source) have already landed font-display:optional + async non-render-blocking CSS, inlined above-the-fold shell CSS to fight CLS, `fetchpriority="high"` on the LCP candidate, IntersectionObserver-gated route-chunk prefetch, CSS-native scroll-driven `<CardHeader shrink>`, physics `linear()` easing tokens, and broad `prefers-reduced-motion` coverage. The drift surface is therefore small and concentrated in **four** places, three of which are best fixed in **glass-ui** (the shared layer) so every consumer benefits. The single highest-leverage native adoption is the **View Transitions API**, which would retire a hand-rolled FLIP morph engine and the per-route `<Transition mode="out-in">` pane-slide vocabulary.

---

## (1) ALREADY-MODERN — patterns to preserve (do not regress)

Grouped by guidance category.

### performance
- **`optimize-image-priority`** — LCP candidate carries `fetchpriority="high"` + `decoding="async"`, declared as a real `<img>` in the route bundle (not JS-mounted). `src/components/dashboard/MapSkeleton.vue:40-46`.
- **`performance` (Web Fonts / CRP)** — render-blocking `index-*.css` is kept font-free; the ~102 KB woff2 corpus is a separate glass-ui subpath loaded via async `<link>` (`media="print"`→onload flip), `font-display: optional` on the LCP-critical family with Capsize-calibrated metric-neutral fallbacks (zero CLS). `index.html:40-176`, `src/fonts/loadFonts.ts`.
- **`performance` (CRP / CLS)** — genuine above-the-fold shell CSS is inlined in `<head>` (literal values, no token dependency) so first paint renders at HTML-parse time before the 207 KB design-system sheet arrives; the inlined `#app > div` geometry reserves the layout box to kill the previously-logged mobile CLS 0.279. `index.html:102-153`.
- **`improve-next-page-load-performance` / `defer-rendering-heavy-content`** — heavy route chunks (Charts, Map, Admin overview) are prefetched via an IntersectionObserver with a 200 px `rootMargin` (`useViewportReady`), not eagerly bundled. `src/views/ChartsView.vue:178`, `src/views/AdminOverviewView.vue:39,182`, `src/components/dashboard/warmMapChunk.ts`.
- **`break-up-long-tasks` / `efficient-background-processing`** — the meter renderer runs a single `useRAFLoop` tick (glass-ui), gating active visuals on one boolean and idling a breathing oscillator rather than polling; the speedtest measurement engine runs in a Web Worker (`src/speedtest/worker.ts`) off the main thread. `src/components/speedtest/composables/useMeterRenderer.ts:172-285`.
- **`batch-analytics-events`** (partial) — Cloudflare Web Analytics beacon is cookieless, `defer`-injected, and token-gated (no beacon when token absent). `index.html:203-215`.
- **JS code-splitting** — `defineAsyncComponent` carves the reka-ui dialog primitives out of the entry chunk onto the `cellular: true` branch only. `src/components/CellularWarningDialog.vue:46-50`.

### user-experience / css
- **`physics-based-easing`** — motion rides glass-ui's `--spring-bouncy` / `--spring-snappy` / `--spring-smooth` / `--ease-apple-spring` `linear()` easing tokens plus `keyframes.js` `SmoothProgress`/`ElementMorph` for canvas + FLIP; no bespoke `cubic-bezier` hand-tuning at the consumer. `src/components/speedtest/ResultStack.vue:375-385`, `src/components/speedtest/MeterColumn.vue:285-296`.
- **scroll-driven animations (CSS-native)** — the shrinking survey header is glass-ui's `<CardHeader shrink>` driven entirely by `scroll-timeline: --card-scroll block` + the `scroll-fade-bottom` utility (`@mkbabb/glass-ui/dist/styles/utilities.css:205-232`). No JS scroll listener. `src/components/survey/SurveyWizard.vue:50-68`. (This is the modern pattern the `parallax-scroll-effects`/`scrollytelling` guides advocate — already adopted upstream.)
- **`declarative-dialog-popover-control` / `light-dismiss-a-dialog`** — overlays use glass-ui `Dialog`/`Sheet`/`Popover`/`HoverCard` (reka-ui) primitives with proper `update:open` / `v-model:open`, focus management, and Esc/light-dismiss handled by the primitive — not a hand-rolled focus trap. `src/components/CellularWarningDialog.vue:2-41`, `src/components/dashboard/ResultDetailSheet.vue:25-26`, `src/components/AppSettingsButton.vue:3-9`.
- **`interest-triggered-tooltips`** — dock affordances use glass-ui `IconTooltip` (hover/focus/long-press). `src/components/Dock.vue:180-242`, `src/components/survey/AddressAutocomplete.vue:30-42`.
- **`individual-transform-properties` / containment** — `contain: paint` / `contain: layout paint` + `will-change` are applied surgically (only on the animating element, on hover/active), not globally. `src/components/speedtest/MeterColumn.vue:459-466`, `src/components/dashboard/MapSkeleton.vue:126`.

### accessibility
- **`meta-viewport`** — pinch-zoom-disable directive removed (WCAG 1.4.4); `shrink-to-fit=no` retained as a11y-neutral. `index.html:22-25`.
- **`prefers-reduced-motion`** — broad PRM coverage across the motion surface (Aurora policy, completion choreography, phase transition, result stack, badge). `src/composables/useAuroraPolicy.ts`, `src/components/speedtest/composables/usePhaseTransition.ts`, +8 more.

---

## (2) DRIFT — obsolete / ad-hoc / heavy patterns a guide now modernizes

### user-experience
1. **Hand-rolled FLIP morph instead of the View Transitions API.** The completion choreography reads `source.getBoundingClientRect()` + a deferred-rAF `target.getBoundingClientRect()`, then drives an `ElementMorph` with a `BOUNCY_SPRING` over `--duration-slow`, with a `morphResolved`/`activePlayToken` state machine to dodge a ~40 ms eviction race. This is exactly the cross-element morph `same-document-transitions` makes declarative with a shared `view-transition-name`.
   - **Guide:** `same-document-transitions` · **Site:** `src/components/speedtest/composables/useCompletionChoreography.ts:254-308` · **Impact:** dx (deletes a fragile rAF/token state machine) + ux · **Effort:** L

2. **Per-route `<Transition mode="out-in">` pane-slide vocabulary instead of SPA View Transitions.** `useRouteTransition` hand-derives forward/back direction (`journeyIndex`, `previousRouteName` mutated in `router.afterEach`) feeding named CSS transitions (`pane-slide` / `pane-slide-back` / `fade`). The Navigation/View-Transitions route pattern computes direction and morphs persisting elements (the chassis, the meter) natively, and can preserve scroll/structural state.
   - **Guide:** `directional-navigation-transitions` (+ `same-document-transitions`) · **Site:** `src/composables/useRouteTransition.ts:141-201`, `src/App.vue:95-121` · **Impact:** ux + dx · **Effort:** L

3. **Map tooltip positioned via a phantom anchor span + `translate3d`, not the Popover API + CSS anchor positioning.** `MapTooltip` renders a `pointer-events-none` zero-size `<span>` it slides with `transform: translate3d(x,y,0)` and tethers a glass-ui `HoverCard` to it. The modern path is a `popover` element anchored with `position-area` / `position-try-fallbacks` (no phantom DOM node, no manual transform bookkeeping, automatic viewport flipping with arrow correctness).
   - **Guide:** `position-aware-tooltips` · **Site:** `src/components/dashboard/MapTooltip.vue:2-58` · **Impact:** ux + dx · **Effort:** M (lands best in **glass-ui** — see Opportunities)

### accessibility
4. **Native `title="Settings"` tooltip on the settings trigger while the rest of the dock uses `IconTooltip`.** The browser `title` attribute has inconsistent timing, no touch support, and is not reliably announced — and it diverges from the dock's own `IconTooltip` convention used everywhere else.
   - **Guide:** `interest-triggered-tooltips` · **Site:** `src/components/AppSettingsButton.vue:5` · **Impact:** a11y + ux · **Effort:** S

### performance
5. **No `content-visibility` on the data-dense admin/dashboard surfaces.** The admin sessions table (`InfiniteScroll` + `DataTable`, hundreds of rows, `--table-density: 0.75`) and the Charts view (ECharts series + distribution + time-series) carry no `content-visibility: auto` on below-the-fold row blocks/cards, so the browser lays out and paints all rows. `interactions-in-complex-layouts` + `defer-rendering-heavy-content` target exactly this for INP under scroll/filter load.
   - **Guide:** `defer-rendering-heavy-content` · **Site:** `src/components/admin/AdminSessionsTable.vue:118-122`, `src/views/ChartsView.vue` · **Impact:** perf (INP/render) · **Effort:** S–M

6. **LCP `<img>` lacks intrinsic `width`/`height`.** The MapSkeleton LCP `<img>` is CSS-sized to fill its container and omits the native `width`/`height` attributes. It is full-bleed (low CLS risk), but the guide is unambiguous that explicit dimensions let the browser reserve space pre-layout.
   - **Guide:** `optimize-image-priority` / `performance` (Modern Image) · **Site:** `src/components/dashboard/MapSkeleton.vue:40-46` · **Impact:** perf (CLS, minor) · **Effort:** S

7. **Analytics/telemetry sent as individual `fetch`/beacon calls, not batched via `fetchLater()`.** Survey funnel-abandon (`tryMarkAbandoned`) and the per-event Cloudflare beacon are point sends. `batch-analytics-events` recommends `fetchLater({ activateAfter })` to debounce + batch into a single reliably-flushed beacon (survives page exit) — relevant because a speedtest fires a burst of phase/measurement telemetry under main-thread load.
   - **Guide:** `batch-analytics-events` · **Site:** `src/components/survey/composables/useSurveyStepTracker.ts:41`, `src/components/survey/composables/useFunnelAbandon.ts`, `index.html:203-215` · **Impact:** perf + privacy (fewer beacons) · **Effort:** M

---

## (3) OPPORTUNITIES — high-leverage modern adoptions

> Convention: prefer **glass-ui** when ≥2 consumers benefit (the speedtest dashboard + the fourier web companion both consume glass-ui overlays/motion).

### A. Native Popover API + CSS anchor positioning for tooltips/popovers → **glass-ui**
glass-ui owns `HoverCard`/`Popover`/`IconTooltip`/`Tooltip` (reka-ui, JS floating positioning) consumed by ≥9 sites in speedtest alone, plus fourier. Rebuilding these on the `popover` attribute + `position-area`/`position-try-fallbacks` + `@container anchored()` removes the JS positioning runtime, gets free top-layer rendering, native light-dismiss, and arrow-flip correctness. Fixes DRIFT #3 and #4 at the substrate. **Guide:** `position-aware-tooltips`, `interest-triggered-tooltips`, `declarative-dialog-popover-control`. **Impact:** dx + ux + perf. **Effort:** L. **Lands in:** glass-ui.

### B. View Transitions API for SPA route + completion morph → THIS repo (consumes glass-ui named elements)
Adopt `document.startViewTransition` for the `speedtest → survey → thankyou` journey and assign `view-transition-name` to the persisting chassis + meter. This retires the `useRouteTransition` direction machine (DRIFT #2) AND the `useCompletionChoreography` FLIP engine (DRIFT #1) — a large net code deletion for a more robust, interruption-safe transition. **Guide:** `same-document-transitions`, `directional-navigation-transitions`. **Impact:** ux + dx. **Effort:** L. **Lands in:** this repo (pattern), with a thin glass-ui helper if shared.

### C. `content-visibility` on dashboard tables + chart cards → THIS repo
Add `content-visibility: auto; contain-intrinsic-size` to off-screen admin table row blocks and chart cards; optionally `content-visibility: hidden` on inactive dashboard tabs for instant tab-switch (`faster-spa-view-transitions`). Directly improves INP under filter/scroll on the operator console. **Guide:** `defer-rendering-heavy-content`, `interactions-in-complex-layouts`. **Impact:** perf. **Effort:** S. **Lands in:** this repo.

### D. `scheduler.yield()` / `scheduler.postTask()` for measurement-time UI work → glass-ui (motion) + this repo
The speedtest's defining constraint is INP *under measurement load*. Where main-thread UI work coexists with the rAF meter loop and worker telemetry, route discretionary continuations through `scheduler.yield()` (front-of-queue) and prioritize via `scheduler.postTask()`. Best centralized in glass-ui's motion/`useRAFLoop` layer so all consumers inherit it. **Guide:** `break-up-long-tasks`, `schedule-tasks-by-priority`. **Impact:** perf (INP). **Effort:** M. **Lands in:** glass-ui (helper) + this repo (call sites).

### E. `fetchLater()` analytics batching → glass-ui util or this repo
A small `trackEvent`/`fetchLater` batcher for funnel + phase telemetry. **Guide:** `batch-analytics-events`. **Impact:** perf + privacy. **Effort:** M. **Lands in:** this repo (or a shared util if fourier reuses it).

---

## Top 8 modernizations (ranked by impact × 1/effort)

| Rank | Title | Guide id | Impact | Effort | Lands in |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `content-visibility` on admin tables + chart cards (INP) | `defer-rendering-heavy-content` | perf | S | this repo |
| 2 | Replace `title="Settings"` with `IconTooltip` | `interest-triggered-tooltips` | a11y | S | this repo |
| 3 | Add intrinsic `width`/`height` to LCP `<img>` | `optimize-image-priority` | perf | S | this repo |
| 4 | Native Popover + anchor positioning for tooltips/popovers | `position-aware-tooltips` | dx/ux/perf | M→L | **glass-ui** |
| 5 | `scheduler.yield/postTask` for measurement-time UI work | `break-up-long-tasks` | perf | M | glass-ui + this repo |
| 6 | `fetchLater()` analytics batching | `batch-analytics-events` | perf/privacy | M | this repo |
| 7 | View Transitions for completion morph (retire FLIP engine) | `same-document-transitions` | dx/ux | L | this repo |
| 8 | View Transitions for SPA route direction (retire `pane-slide` machine) | `directional-navigation-transitions` | ux/dx | L | this repo |
