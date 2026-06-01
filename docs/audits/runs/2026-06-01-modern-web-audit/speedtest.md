# Modern-Web CONFORMANCE Audit — `speedtest` (speedtest.friday.institute)

**Run:** 2026-06-01-modern-web-audit · **Lens:** Chrome modern-web-guidance v0.0.170 (offline corpus at `/tmp/mwg`)
**Mode:** READ-ONLY conformance audit (Style-Audit-grade) — per-category, `file:line`-cited, severity-ranked. No edits to the target.
**Invariant frame:** inv-29 (progressive-enhancement floor — every modern-API adoption must @supports-gate with the prior path as floor; flag rip-out risk) · inv-30 (platform-over-library — flag every site where a native capability should REPLACE a JS/library reimplementation).

## Preamble

| Field | Value |
| :--- | :--- |
| Repo | `/Users/mkbabb/Programming/speedtest` |
| Frontend dir | `src/` — 48 `.vue` SFCs + composables + `styles/` (consumer token/cascade) + `src/assets/styles/pane-slide.css` |
| Stack | Vue 3.5.34 · Vite 8 · Tailwind v4 · Pinia 3 · vue-router 5 · reka-ui / vaul-vue / vue-sonner primitives · ECharts 6 + maplibre-gl 5 (dashboard) · `@mkbabb/keyframes.js` physics motion · canvas2d meter renderer · PWA (vite-plugin-pwa) |
| Shared layer | **`@mkbabb/glass-ui` v2.1.0** — the design substrate; owns dialog/sheet/popover/hover-card/tooltip/select/command/data-table/infinite-scroll primitives, `--spring-*` `linear()` easing tokens, the `scroll-timeline: --card-scroll` host (`<CardHeader shrink>`), `scroll-fade-bottom`, `useRAFLoop`/`SmoothProgress` motion, `InstrumentChassis`, the self-hosted `@font-face` corpus |
| Host | Cloudflare Pages (`public/_headers` is the document header surface) + a Workers edge (`workers/speedtest-edge`) fronting only the speedtest garbage/upload API |

**Headline.** speedtest is an exceptionally modern, heavily self-audited surface — the conformant column is long and load-bearing (font-display:optional + async non-render-blocking CSS, inlined above-the-fold shell to kill CLS 0.279, `fetchpriority="high"` LCP `<img>`, IO-gated route-chunk prefetch, **native CSS scroll-driven** `<CardHeader shrink>`, physics `linear()` easing, container queries on the result meter, a correct CSP, safe `createElement`/`textContent` chart tooltips, 24 SFCs with `prefers-reduced-motion` brackets). The drift surface is **narrow and concentrated**, and it splits cleanly into two buckets the prior posture analysis already located: (1) a small set of **native-replaces-library** opportunities (View Transitions retiring two hand-rolled motion engines; native Popover + anchor positioning retiring the JS floating runtime in glass-ui; `content-visibility` for INP on the data-dense console) and (2) a genuinely-new-to-this-audit **forms cluster** the prior pass under-weighted: the survey is **not wrapped in a `<form>`**, every text input hard-codes `type="text"` and carries **no `autocomplete` / `inputmode` / `enterkeyhint` / `name`**, and the multi-step wizard lacks a semantic `<nav aria-label="Progress">` tracker. That forms cluster is the highest-density P1 finding and lands entirely in THIS repo.

The defining axis remains **INP under measurement load**, and the two perf levers that directly serve it — `content-visibility` on the admin/charts surfaces and `scheduler.yield()` in the measurement-time UI path — are both still unadopted (`grep content-visibility → 0`, `grep scheduler.yield → 0`).

**inv-29 posture note.** This repo currently has **zero `@supports` gates** (`grep @supports src/ styles/ → 0`). That is fine *today* (it adopts no engine-forked modern API yet), but it is the central constraint on every recommendation below: View Transitions, native Popover, anchor positioning, and `content-visibility: hidden` all need a Safari/Firefox floor. Several recommendations are therefore "land in glass-ui behind a feature gate" rather than "adopt at the consumer," precisely so the floor is authored once.

---

## (1) accessibility

**Conformant**
- Single `<main>` landmark for the whole SPA (`src/App.vue:58`) — satisfies axe `landmark-one-main`; route content slots inside it.
- `<html lang="en">` (`index.html:13`); unique, identity-bearing `<title>` (`index.html:229`); SR-only `<h1>` on the dial route matching the visible wordmark (`src/views/SpeedtestView.vue:14`).
- `meta-viewport` is a11y-correct: pinch-zoom-disable directive removed (WCAG 1.4.4), only `shrink-to-fit=no` retained (`index.html:22-25`) — documented as axe `meta-viewport` critical-fix.
- Live regions used correctly and sparingly: `role="status" aria-live="polite"` on the map empty-hint (`src/components/dashboard/MapEmptyHint.vue:54-55`); `role="alert"` on admin error surfaces (`src/views/AdminSettingsView.vue:25`, `src/views/AdminDataView.vue:47,54`) — matches the Live-Region Urgency table (alert=critical, polite=standard).
- ARIA radiogroup semantics on the chip-based radio/checkbox fields (`src/components/survey/SurveyField.vue:68-69,86-87`); combobox semantics on the address autocomplete (`src/components/survey/AddressAutocomplete.vue:11-13` — `role="combobox"`, `:aria-expanded`).
- Decorative SVG/icons carry `aria-hidden="true"` (`src/components/dashboard/MapSkeleton.vue:44`, lucide icons throughout); LCP `<img alt="">` correctly empty-alt'd (`src/components/dashboard/MapSkeleton.vue:43`).
- 24 SFCs carry `@media (prefers-reduced-motion: reduce)` brackets (`grep -rln prefers-reduced-motion src/`); motion defaults are PRM-bracketed across Aurora, completion choreography, phase transitions.

**Drift**
1. **Native `title="Settings"` tooltip on the settings trigger** while the rest of the dock uses glass-ui `IconTooltip`. The `title` attribute has inconsistent timing, no touch support, is not reliably announced, and the guide explicitly says *"Don't use `title` or `placeholder` as a naming mechanism."* It also diverges from the dock's own convention (`AddressAutocomplete.vue:30` uses `IconTooltip`).
   - Site: `src/components/AppSettingsButton.vue:5` · Pattern: `<DockIconButton aria-label="Settings" title="Settings">` · Modern: drop `title`; the `aria-label` already names it, and an `IconTooltip` wrap supplies the visible affordance · Guide: `interest-triggered-tooltips` + accessibility §3 · **P2 · S · this-repo · inv30 no**
2. **No skip-link to `<main>`.** The dock and route chrome repeat across views; a keyboard user has no `<a href="#content" class="skip-link">` bypass, and `<main>` (`App.vue:58`) is not focus-targetable (`id`/`tabindex="-1"` absent). Accessibility §1 requires a skip link "prior to repeated content … Make sure the target is focusable."
   - Site: `src/App.vue:58` (main without `id`/`tabindex`) · Modern: add a visually-hidden skip link + `<main id="content" tabindex="-1">` · Guide: accessibility §1 · **P2 · S · this-repo · inv30 no**
3. **SPA title is static across route changes.** `<title>` is the single literal `speedtest.friday.institute` (`index.html:229`); the router never updates it per view (no `document.title` write — `grep document.title → 0`). Accessibility §4: *"Update document title on Page Transitions in SPAs."*
   - Site: `src/router/index.ts` (no `afterEach` title write) · Modern: `router.afterEach` sets `document.title` per route meta · Guide: accessibility §4 · **P2 · S · this-repo · inv30 no**

**Opportunity**
- `prefers-contrast: more` for the low-contrast accent surfaces (muted-foreground secondary text, subtle hairlines, the map skeleton's slate caption rgbas). `grep prefers-contrast → 0`. Guide `adapt-scrollbar-to-contrast-preferences` + accessibility §9 ("reach for `prefers-contrast: more` when the design uses low-contrast accents"). **P3 · M · glass-ui** (the muted-foreground + hairline tokens live upstream; see glass-ui gaps).

---

## (2) forms

This is the **densest drift cluster** and the largest delta vs the prior analysis (which treated forms only via the tooltip lens). The survey is a real multi-step data-collection flow yet adopts almost none of the native forms platform.

**Conformant**
- Uses real reka-ui form primitives via glass-ui (`Input`, `Textarea`, `Select`/`SelectTrigger`/`SelectValue`, `ToggleChip`) — not `<div>`-as-control (`src/components/survey/SurveyField.vue:24-107`). Satisfies forms §1 "don't use generic `<div>`/`<span>` for form controls."
- `<LabeledField>` provides programmatic label association (`SurveyField.vue:22`); non-color state cues via chips + text (forms §2).
- Admin token field correctly uses `autocomplete="off"` + `-webkit-text-security:disc` masking (`src/views/AdminLoginView.vue:67-68`) — a deliberate non-`type=password` token field that still masks.
- Address field uses a single combined input with combobox autocomplete (`AddressAutocomplete.vue`), matching forms §9 "use a single field for names / single field for complex address."
- Selection-control matrix honored: connection-type (5 options) is a `<select>` (`src/config/survey.ts` connectionType), flow choice is radiogroup chips.

**Drift**
4. **No `<form>` element wraps the survey or the admin login.** `grep -rn "<form" src/ → 0`. The survey collects identity + address + provider and submits via a JS `emit`/`api.submitSurvey` path (`SurveyWizard.vue:265`); the admin login submits via `@keyup.enter`/`@click` (`AdminLoginView.vue:71-72`). Forms §1: *"DO use the `<form>` element to wrap interactive controls."* §7: *"DON'T block page submission if JS fails; ensure server-side fallback."* No `<form>` means no native submit semantics, no Enter-to-submit on the survey, no `:user-invalid` constraint styling, no implicit submit button.
   - Sites: `src/components/survey/SurveyWizard.vue` (no `<form>`), `src/views/AdminLoginView.vue:63-75` (bare `<div>` + Enter handler) · Modern: wrap each step body / the login in a `<form @submit.prevent>` with a real `type="submit"` button · Guide: `forms` §1, §7 · **P1 · M · this-repo · inv30 no**
5. **Every text input hard-codes `type="text"` — email/tel never get their native type.** `SurveyField.vue:27` renders `type="text"` for the entire `isTextLike` set (`["text","number","email","tel","readonly"]`, `:143-145`); the comment at `:23` literally reads *"Text / Email / Tel / Readonly"* but the binding is the constant string `"text"`. So an email field gets no `inputmode="email"` keyboard, no `type="email"` constraint, no autofill heuristic. Forms §3: *"DO use `type` + `inputmode` to optimize on-screen keyboards"*; §8 autofill.
   - Site: `src/components/survey/SurveyField.vue:27` · Modern: `:type="field.type"` (or a text/email/tel map) · Guide: `forms` §3, `autofill-sign-up-form` · **P1 · S · this-repo · inv30 no**
6. **No `autocomplete` / `name` / `inputmode` / `enterkeyhint` on any survey input.** `grep inputmode src/ → 0`, `grep enterkeyhint src/ → 0`; the only `autocomplete` is the admin token's `"off"`. The "Name" field (`src/config/survey.ts:32-37`, type `text`) wants `autocomplete="name"`; the address wants `autocomplete="street-address"`; without `name` attributes (`SurveyField.vue:24-33` binds only `:id`) browser autofill and `FormData` serialization both fail. Forms §2 (`name` for submission), §3 (autocomplete/inputmode), §11 (`enterkeyhint="next"/"previous"` for multi-page).
   - Site: `src/components/survey/SurveyField.vue:24-33` (Input) + `:36-43` (Textarea) · Modern: thread `field.autocomplete` / `field.inputmode` / `name` from `SurveyFieldConfig` to the primitive · Guide: `forms` §2/§3/§11, `autofill-address-form`, `autofill-sign-up-form` · **P1 · M · this-repo · inv30 no**
7. **Multi-step wizard has no semantic progress nav.** The survey is a textbook multi-page form; forms §11 wants `<nav aria-label="Progress"><ol>` with `aria-current="step"`. The wizard tracks `progressStepNumber`/`progressSteps` (`SurveyWizard.vue:33-34`) and renders a `SurveyResultDock` progress visual, but there is no `<nav aria-label="Progress">` landmark or `aria-current="step"` for AT users (`grep aria-current → 0` in survey).
   - Site: `src/components/survey/SurveyResultDock.vue` / `SurveyWizard.vue:31-35` · Modern: wrap the step indicator in `<nav aria-label="Progress"><ol>` with `aria-current="step"` · Guide: `forms` §11 + accessibility §1 · **P2 · S · this-repo · inv30 no**

**Opportunity**
- Native constraint validation (`required`, `pattern`, `:user-invalid` CSS) once a `<form>` exists — the survey currently does manual `validation.ts` error objects rendered to `<p class="text-destructive">` (`SurveyField.vue:118`); the native path (`:invalid:user-invalid` styling + `setCustomValidity`) is non-intrusive and complements (not replaces) the JS validation. Guide `forms` §4. **P2 · M · this-repo.**

---

## (3) html

**Conformant**
- `<!doctype html>` (`index.html:1`), `lang` (`:13`), correct `<meta name="viewport">` (`:22-25`), single identity `<title>` (`:229`).
- Module bootstrap script is `type="module"` (deferred by default) (`index.html:157`); CF Analytics injector uses `s.defer = true` (`index.html:212`); the Google Maps shim is a tiny inline callback, not blocking head JS (`:193-201`).
- Native overlay primitives (dialog/sheet/popover/hover-card) are reka-ui via glass-ui with correct `v-model:open` / `update:open` and primitive-owned Esc/light-dismiss (`CellularWarningDialog.vue`, `SurveyWizard.vue:187-210`, `AppSettingsButton.vue:3-9`) — no hand-rolled focus traps. Matches html §4 / accessibility §11 intent (delegated to the primitive).
- `<button>` for actions, `<a>`/router for navigation; lucide icon buttons carry `aria-label` (`AdminSessionsTable.vue:144`).

**Drift**
8. **Inline `<style>` shell uses `'unsafe-inline'`-requiring inline scripts.** Three inline `<script>` blocks (`index.html:157,193,203`) force `script-src 'unsafe-inline'` in the CSP (acknowledged in `public/_headers:20-23`). html §1 / security prefer external or nonce'd scripts. This is a *justified* drift on static Pages (no per-request nonce pipeline), but it is a real CSP-strictness ceiling — flagged so it is not mistaken for conformance.
   - Site: `index.html:157,193,203` + `public/_headers:40` · Modern: move the Maps shim + CF injector to a hashed/external module; keep the Vue bootstrap as `type=module` (no `unsafe-inline` needed for module scripts) · Guide: html §1 + security §3.2 · **P3 · M · this-repo · inv30 no**

**Opportunity**
- `<search>` landmark for the IP-lookup / sessions IP-filter controls (`AdminSessionsTable.vue:102-108`, `IPLookupManager.vue`) — html §1 "use `<search>` to enclose search and filtering mechanisms (eliminates `role=search`)." **P3 · S · this-repo.**

---

## (4) css

**Conformant**
- No `@import` in the render-blocking critical CSS (the inline shell is literal, `index.html:102-153`); CSS is Tailwind v4 `@theme`/`@utility`/`@apply` driven through glass-ui — the architectural model css.md advocates.
- Surgical containment: `contain: paint` / `contain: layout paint` + `will-change` applied only on the animating element on hover/active, not globally (`MeterColumn.vue:459-466`, `MapSkeleton.vue:126`).
- Physics `linear()` easing tokens (`--spring-bouncy`/`-snappy`/`-smooth`) consumed, no raw `cubic-bezier` hand-tuning at the consumer (verified in the constellation-ui style audit: 0 raw `linear()`/`cubic-bezier` literals).
- `100dvh`/`100cqw`/`clamp()` modern units throughout (`index.html:118`, `SpeedtestResults.vue:813`).

**Drift**
- None material at the CSS-architecture layer. The style-audit-grade token drifts (slate basemap rgbas in `MapSkeleton.vue`/`MapEmptyHint.vue`, `--meter-background-color` light/dark fork vs `--surface-tint-12`, raw `180ms` at `ResultsTable.vue:250`, bare `ease-out` at `ResultStack.vue:359`) are catalogued in the constellation-ui run and are token-canon drifts, not modern-platform drifts — out of this lens's scope. Noted here for cross-reference; not re-counted.

**Opportunity**
- `color-scheme` CSS property paired with the dark cascade. The app theme-forks via a `.dark` class cascade (App.vue toast comment `:172`) but never declares `color-scheme: light dark` (`grep color-scheme → 0`), so UA-rendered surfaces (scrollbars, form controls, `<select>` native popup) don't auto-match. css.md / accessibility §9: *"pair `prefers-color-scheme` with the `color-scheme` CSS property."* **P2 · S · this-repo (or glass-ui `:root`).**

---

## (5) css-layout

**Conformant**
- Container queries are genuinely adopted on the result meter: `container-type: inline-size` on `.metric-col` + a `@container (min-width: 28rem)` headline query + `45cqi`/`100cqw` fluid sizing (`src/components/speedtest/SpeedtestResults.vue:494-514,1100,813`). This is exactly the `size-aware-styling` / `fluid-scaling` modern pattern.
- Flexbox/grid intrinsic sizing (`min-h-0`, `flex-1`, `minmax(0,1fr)` dial track) throughout App.vue chassis composition (`App.vue:483-509`); CSS logical/responsive layout, no table-for-layout.

**Drift**
- None. css-layout is a model surface.

**Opportunity**
- Broaden container queries beyond the meter: the survey field grid (`SurveyStep.vue:7` `grid-cols-1 sm:grid-cols-2`) and the admin StatsCards still branch on viewport `sm:` breakpoints rather than container width. `size-aware-styling` would make the field grid self-aware when the wizard card widens (32rem → 53rem ladder, `SurveyWizard.vue:411,425`). **P3 · M · this-repo.**

---

## (6) performance

**Conformant** (the strongest category)
- LCP `<img>` carries `fetchpriority="high"` + `decoding="async"`, declared as real HTML in the route bundle (not JS-mounted), with a data-URL SVG (zero round-trip) (`src/components/dashboard/MapSkeleton.vue:40-46`). Matches `optimize-image-priority` precisely.
- Render-blocking CSS kept font-free; ~102 KB woff2 corpus is an async `<link>` (`media=print`→onload flip), `font-display: optional` on the LCP family with Capsize metric-neutral fallbacks → zero CLS (`index.html:40-176`, `src/fonts/loadFonts.ts`). Matches performance CRP/Web-Fonts.
- Above-the-fold shell CSS inlined in `<head>` with literal values, reserving `#app > div` geometry to kill the logged mobile CLS 0.279 (`index.html:102-153`). Matches CRP "inline critical CSS."
- Heavy route chunks (Charts, Map, Admin) prefetched via IntersectionObserver with 200px `rootMargin` (`useViewportReady`), not eagerly bundled (`ChartsView.vue:178,186`, `warmMapChunk.ts`). Matches `improve-next-page-load-performance` / `defer-rendering-heavy-content`.
- Measurement engine runs in a Web Worker off the main thread (`src/speedtest/worker.ts`); meter renderer runs a single `useRAFLoop` tick gated on one boolean (`useMeterRenderer.ts:172-285`). Matches `break-up-long-tasks` / `efficient-background-processing`.
- Aurora WebGL mount deferred behind `requestIdleCallback` post-first-paint with a CSS-gradient placeholder (no CLS) and `defineAsyncComponent` carving keyframes out of the entry chunk (`App.vue:211-213,316-325`). `keyframes.js` is a dynamic-only leaf.
- CF Analytics beacon is cookieless, `defer`-injected, token-gated (`index.html:203-215`).

**Drift**
9. **No `content-visibility` anywhere on the data-dense console.** `grep -rn content-visibility src/ styles/ → 0`. The admin sessions table (`InfiniteScroll` + `DataTable`, hundreds of rows, `--table-density: 0.75`, `AdminSessionsTable.vue:119-178`) and the Charts view cards lay out + paint every row/card off-screen. `interactions-in-complex-layouts` + `defer-rendering-heavy-content` target exactly this for INP under scroll/filter — the app's defining axis.
   - Site: `src/components/admin/AdminSessionsTable.vue:119-178`, `src/views/ChartsView.vue:47-96` · Modern: `content-visibility: auto; contain-intrinsic-size` on off-screen row blocks / chart cards · Guide: `defer-rendering-heavy-content`, `interactions-in-complex-layouts` · **P1 · S · this-repo · inv30 no** (no engine fork — `content-visibility: auto` degrades to "always rendered" where unsupported, so the floor is automatic; the only inv-29 care is `content-visibility: hidden` for tab-swap which needs an `@supports` gate)
10. **Tab content destroyed + rebuilt on every chart-tab switch.** `ChartsView.vue:47` swaps tab panels with `v-if="activeChartTab === 'timeseries'"` (and `:96`), so the inactive ECharts instances are torn down and re-instantiated on each switch — re-paying mount + chart-init cost. `faster-spa-view-transitions` advocates `content-visibility: hidden` (preserve DOM/structural state, skip rendering) for instant tab-switch.
    - Site: `src/views/ChartsView.vue:47-96` · Modern: keep panels mounted with `content-visibility: hidden` on the inactive tab (behind `@supports`) · Guide: `faster-spa-view-transitions` · **P2 · M · this-repo · inv30 no**
11. **Exit-time analytics use plain `fetch` (no `keepalive`/`fetchLater`).** Funnel-abandon fires on `visibilitychange:hidden` via a `setTimeout` → `tryMarkAbandoned` → `api.submitSurvey` (`useFunnelAbandon.ts:60,93,102`), and the API client's `fetch` (`src/api/client.ts:149,154`) sets no `keepalive`, so an abandon beacon racing page-exit can be dropped. `batch-analytics-events` / `full-session-analytics` recommend `fetchLater({ activateAfter })` (debounced, survives page exit) — directly relevant because a speedtest fires a burst of phase/measurement telemetry under main-thread load.
    - Site: `src/components/survey/composables/useFunnelAbandon.ts:60,93`, `src/api/client.ts:149,154`, `index.html:203-215` · Modern: `fetchLater()` (or at minimum `fetch(..., {keepalive:true})` / `navigator.sendBeacon` floor) · Guide: `batch-analytics-events`, `full-session-analytics` · **P2 · M · this-repo · inv30 no** (inv-29: `fetchLater` is Chromium-origin-trial; floor = `sendBeacon`/`keepalive`)
12. **LCP `<img>` lacks intrinsic `width`/`height`.** The MapSkeleton LCP `<img>` is CSS-sized to fill its container and omits `width`/`height` (`MapSkeleton.vue:40-47` — only `class`, `:src`, `alt`, `aria-hidden`, `decoding`, `fetchpriority`). Full-bleed → low CLS risk, but `optimize-image-priority`/performance is unambiguous that explicit dimensions let the browser reserve space pre-layout.
    - Site: `src/components/dashboard/MapSkeleton.vue:40-47` · Modern: add intrinsic `width`/`height` (with `aspect-ratio` if fluid) · Guide: `optimize-image-priority` · **P3 · S · this-repo · inv30 no**

**Opportunity**
- `scheduler.yield()` / `scheduler.postTask()` for measurement-time UI continuations. `grep scheduler.yield → 0` (only `requestIdleCallback` is used, `App.vue:320`, `useIPInfo.ts:94`). The defining constraint is INP *under measurement load*; discretionary UI work coexisting with the rAF meter loop + worker telemetry should route through `scheduler.yield()` (front-of-queue) and prioritize via `scheduler.postTask()`. Best centralized in glass-ui's `useRAFLoop`/motion layer. Guide `break-up-long-tasks`, `schedule-tasks-by-priority`. **P1 · M · glass-ui (helper) + this-repo (call sites)** (inv-29: floor = `setTimeout`-wrapped Promise, per the guide's own polyfill).
- Speculation Rules for next-page navigation. The IO chunk-prefetch (`useViewportReady`) prefetches the JS *chunk* but not the *document*; `improve-next-page-load-performance` adds `<script type="speculationrules">` prerender for the dashboard/admin links. `grep speculationrules → 0`. **P3 · M · this-repo.**
- Next-gen image negotiation (`image-set()` / AVIF/WebP `srcset`) — currently zero (`grep image-set/srcset/.avif/.webp → 0`); the only raster is the data-URL SVG. Low value here (SVG basemap is already optimal) — noted N/A-adjacent. **P3.**

---

## (7) user-experience

**Conformant**
- **Native CSS scroll-driven animation** — the shrinking survey header is glass-ui's `<CardHeader shrink>` driven by `scroll-timeline: --card-scroll block` + `scroll-fade-bottom` (`node_modules/@mkbabb/glass-ui/dist/styles/utilities.css:215-232`, consumed at `SurveyWizard.vue:50-68`). No JS scroll listener. This is the `scrollytelling`/`parallax-scroll-effects` modern pattern, already adopted upstream.
- Declarative dialog/popover control with primitive-owned light-dismiss + focus (`CellularWarningDialog.vue`, `ResultDetailSheet.vue:25-26`, `AppSettingsButton.vue:3-9`) — `declarative-dialog-popover-control` / `light-dismiss-a-dialog`.
- Interest-triggered tooltips via `IconTooltip` (hover/focus/long-press) (`Dock.vue`, `AddressAutocomplete.vue:30`) — `interest-triggered-tooltips` (except the one `title` drift, finding #1).
- Physics easing + FLIP morph for canvas/completion (`ResultStack.vue:375-385`, `MeterColumn.vue:285-296`) — `physics-based-easing`.

**Drift**
13. **Hand-rolled FLIP morph instead of View Transitions.** The completion choreography reads `source.getBoundingClientRect()` + deferred-rAF `target.getBoundingClientRect()`, drives an `ElementMorph` over `--duration-slow`, with a `morphResolved`/`activePlayToken` state machine to dodge a ~40ms eviction race. This is exactly the cross-element morph `same-document-transitions` makes declarative via a shared `view-transition-name`. `grep startViewTransition → 0`.
    - Site: `src/components/speedtest/composables/useCompletionChoreography.ts:254-308` · Modern: `document.startViewTransition()` + `view-transition-name` on source/target · Guide: `same-document-transitions` · **P2 · L · this-repo · inv30 YES** (native VT replaces the keyframes.js `ElementMorph` reimplementation; inv-29 floor = the existing FLIP behind `@supports not (view-transition-name: x)`)
14. **Per-route `<Transition mode="out-in">` pane-slide machine instead of SPA View Transitions.** `useRouteTransition` hand-derives forward/back direction (`journeyIndex`, `previousRouteName` mutated in `router.afterEach`) feeding named CSS transitions (`pane-slide`/`-back`/`fade`), wired at `App.vue:96,132`. The View-Transitions route pattern computes direction and morphs persisting elements (the chassis, the meter) natively, preserving structural state.
    - Site: `src/composables/useRouteTransition.ts:141-201`, `src/App.vue:96,132` · Modern: `document.startViewTransition` on route change + `view-transition-name` on persisting chassis/meter · Guide: `directional-navigation-transitions` (+ `cross-document-transitions` for the MPA-ish admin split) · **P2 · L · this-repo · inv30 YES** (native VT replaces the JS direction-machine; inv-29 floor = retain `pane-slide` for non-VT engines)
15. **Map tooltip positioned via a phantom anchor span + `translate3d`, not Popover + anchor positioning.** `MapTooltip` renders a `pointer-events-none` zero-size `<span>` it slides with `transform: translate3d(x,y,0)` (`anchorStyle`, `:56-58`) and tethers a glass-ui `HoverCard` to it. The modern path is a `popover` element anchored with `position-area`/`position-try-fallbacks` (no phantom DOM, no manual transform bookkeeping, automatic viewport flipping). `grep position-area/anchor-name → 0`.
    - Site: `src/components/dashboard/MapTooltip.vue:2-58` · Modern: native `popover` + CSS anchor positioning · Guide: `position-aware-tooltips`, `resilient-context-menus-and-nested-dropdowns` · **P2 · M · glass-ui · inv30 YES** (native anchor positioning replaces the JS-positioned HoverCard; inv-29 floor = the reka-ui JS floating path for Safari < 26 / Firefox)

**Opportunity**
- See glass-ui-gaps GA (Popover/anchor) + GB (View Transitions helper). The two VT findings (#13, #14) collapse together: one `startViewTransition` adoption retires *both* the FLIP engine and the direction-machine — a large net code deletion. **P2 · L.**

---

## (8) security

**Conformant** (notably strong for a static frontend)
- A real, scoped CSP ships in `public/_headers:40`: `default-src 'self'`; named-host `script-src`/`connect-src`/`img-src`/`frame-src`; `object-src 'none'`; `base-uri 'self'`; `frame-ancestors 'none'` (clickjacking lock). Plus `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` (`:41-42`). This is exactly security §1.4 + §3.2 + companion policies — and the in-file rationale documents every allowlist entry.
- **No dangerous DOM sinks in app code.** `grep innerHTML/outerHTML/document.write/v-html/setHTMLUnsafe src/` returns only test files + Vue-test `document.body.innerHTML=""` resets. The chart tooltip — the one place untrusted series data meets the DOM — is built with `document.createElement` + `textContent` (`src/components/dashboard/charts/tooltip.ts:39,54,64-69,80-84`), and a test asserts an `<img src=x onerror=…>` payload is escaped (`TimeSeriesChart.tooltip.test.ts:32-33`). Matches security §1.2 precisely.
- HTTPS-only host (Cloudflare Pages); admin token in a masked field (`AdminLoginView.vue:68`).

**Drift**
16. **Missing HSTS (`Strict-Transport-Security`) and `Permissions-Policy` headers.** `public/_headers` ships CSP + nosniff + Referrer-Policy but **not** `Strict-Transport-Security` nor `Permissions-Policy` (`grep -n Strict-Transport/Permissions-Policy public/_headers → absent`). security §1.1 wants HSTS; privacy/security companion policies want a `Permissions-Policy` lockdown (the app uses geolocation — `useGeolocation.ts:168` — so `geolocation=(self)` is the correct minimization, and camera/microphone/etc. should be `()`).
    - Site: `public/_headers:39-42` · Modern: add `Strict-Transport-Security: max-age=…; includeSubDomains` (ramp max-age) + `Permissions-Policy: geolocation=(self), camera=(), microphone=(), …` · Guide: security §1.1 + privacy §"Permissions Policy" · **P1 · S · this-repo · inv30 no**

**Opportunity**
- Report-only Trusted Types + CSP `report-uri`/`report-to` (security §2.2/§3.3) to ratchet toward Trusted-Types enforcement; the app is already textContent-clean, so this is a low-risk hardening. **P3 · M · this-repo.**
- `script-src` currently needs `'unsafe-inline'` (finding #8) — moving the two non-bootstrap inline scripts to hashed/external would let `'unsafe-inline'` drop, tightening the highest-leverage CSP directive. **P2 · M · this-repo.**

---

## (9) privacy

**Conformant**
- Cookieless analytics — CF Web Analytics is the only telemetry, cookieless + token-gated (no beacon when token absent) (`index.html:203-215`). Data-minimization-by-default (privacy §1).
- Permissions-aware geolocation: tracks `permissionState` via `navigator.permissions.query` and skips re-request when denied/fresh (`useGeolocation.ts:30,130`; `SurveyStep.vue:82-83`) — contextual, not speculative (privacy §2).
- Survey fields are mostly optional (`required: false` on name/address, `src/config/survey.ts:36,46`) — minimization.

**Drift**
- None at the code layer (the missing `Permissions-Policy` header is booked under security #16; it is the one header that double-counts as a privacy companion policy — not re-counted here).

**Opportunity**
- Inline transparency for the geolocation request — privacy §2 wants a "Why do we ask for this?" inline explanation *before* requesting a powerful permission; the address field auto-fires `requestLocation()` on step mount (`SurveyStep.vue:88-89`) without a visible rationale. **P2 · S · this-repo.**
- `Clear-Site-Data` header on admin logout (privacy §2 "use `Clear-Site-Data` when a user logs out") — the admin logout clears the bearer token + Pinia slabs (`resetAllPlugin`, `App.vue:181-186`) but does not emit `Clear-Site-Data` to purge browser storage. **P3 · S · this-repo (server/Pages function).**
- PEPC `<permission>` element for geolocation (privacy §2, Chromium-only) — strong inv-29 candidate (floor = the current `navigator.geolocation` flow). **P3 · M · this-repo.**

---

## (10) built-in-ai — N/A

No on-device AI surface (no Prompt/Writer/Translator/Summarizer API usage; `grep built-in-ai/LanguageModel/ai. → 0`). Not applicable to a speedtest/dashboard.

## (11) passkeys — N/A

Admin auth is a bearer-token field (`AdminLoginView.vue`), not a credential/passkey flow; the public surface is unauthenticated. WebAuthn/passkeys do not apply. (If admin auth ever graduates from a shared token, `passkeys` becomes relevant — booked as a future-only note, not a finding.)

## (12) webmcp — N/A

No agent-facing tool surface; the app exposes no WebMCP declarative/imperative tools (`grep webmcp/navigator.modelContext → 0`). Not applicable.

---

## P0/P1 Severity-Ranked Table

| # | Sev | Finding | Guide id | Site | inv30 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 9 | **P1** | No `content-visibility` on admin table + chart cards (INP under scroll/filter — the defining axis) | `defer-rendering-heavy-content` / `interactions-in-complex-layouts` | `AdminSessionsTable.vue:119-178`, `ChartsView.vue:47-96` | no |
| 4 | **P1** | Survey + admin login not wrapped in `<form>` (no native submit / fallback / `:user-invalid`) | `forms` §1/§7 | `SurveyWizard.vue`, `AdminLoginView.vue:63-75` | no |
| 5 | **P1** | All text inputs hard-code `type="text"` — email/tel/inputmode never applied | `forms` §3 / `autofill-sign-up-form` | `SurveyField.vue:27` | no |
| 6 | **P1** | No `autocomplete` / `name` / `inputmode` / `enterkeyhint` on any survey input | `forms` §2/§3/§11 / `autofill-address-form` | `SurveyField.vue:24-43` | no |
| 16 | **P1** | Missing HSTS + `Permissions-Policy` response headers (app uses geolocation) | security §1.1 / privacy | `public/_headers:39-42` | no |
| — | **P1** | `scheduler.yield()`/`postTask()` unadopted for measurement-time UI work (INP) | `break-up-long-tasks` / `schedule-tasks-by-priority` | glass-ui motion + call sites | no |

*(No P0: no broken-functionality or a11y-fail finding surfaced — the app is genuinely well-built. The forms cluster is the densest P1 group; `content-visibility` + `scheduler.yield` are the INP-axis P1s.)*

## glass-ui GAPS (adoptions that should land upstream — ≥2 consumers: speedtest dashboard + fourier web companion)

- **GA — Native Popover + CSS anchor positioning for the tooltip/popover family** (`position-aware-tooltips`, `interest-triggered-tooltips`, `resilient-context-menus-and-nested-dropdowns`). glass-ui owns `HoverCard`/`Popover`/`IconTooltip`/`Tooltip`/`DropdownMenu`/`ContextMenu` (reka-ui, JS floating) consumed by ≥9 sites in speedtest (`MapTooltip`, `AppSettingsButton`, `AddressAutocomplete`, `AdminSessionsTable` row-actions, etc.) plus fourier. Rebuilding on the `popover` attribute + `position-area`/`position-try-fallbacks` + anchor queries removes the JS positioning runtime, gets free top-layer rendering + native light-dismiss + arrow-flip correctness. **Fixes findings #1, #15 at the substrate.** inv-29: ship behind `@supports (anchor-name: --x)` with the reka JS floating path as the floor. inv-30 YES.
- **GB — A View-Transitions motion helper** (`same-document-transitions`, `directional-navigation-transitions`). A thin glass-ui `useViewTransition(name, fn)` wrapper + a `view-transition-name` token contract would let *both* speedtest (route + completion morph, findings #13/#14) and fourier (its own route panes) retire hand-rolled FLIP/`ElementMorph` and `pane-slide` direction-machines. inv-29: the helper no-ops to the prior `<Transition>` path when `document.startViewTransition` is absent. inv-30 YES (native VT replaces keyframes.js `ElementMorph`).
- **GC — `--scrollbar-*` + `prefers-contrast: more` + `color-scheme` token surface.** The muted-foreground secondary text, hairlines, and basemap-slate captions (constellation-ui G1) plus scrollbar theming want a single upstream high-contrast override channel + a `color-scheme: light dark` declaration on glass-ui's `:root`. Any consumer with a dark cascade hits the same gap. (Serves findings: css #color-scheme opp, accessibility prefers-contrast opp.)
- **GD — `<Toaster position>` prop / `--toast-viewport-inset-*` tokens** (carried from constellation-ui G3). glass-ui hardcodes the reka `<ToastViewport>` bottom-right; speedtest must `!important`-re-anchor it (`App.vue:556-562`). Architecturally shared across every inline-dock + toast app in the constellation.
- **GE — `scheduler.yield()` in `useRAFLoop`/motion layer.** Centralizing the yield/postTask scheduling (perf opportunity above) in glass-ui's motion substrate means every consumer's measurement/animation-adjacent UI work inherits front-of-queue yielding behind one polyfilled gate (inv-29 floor = `setTimeout`-Promise).

## Conformance Scorecard

| Category | ✓ conformant | ✗ drift | + opportunity | N/A |
| :--- | :---: | :---: | :---: | :---: |
| accessibility | 7 | 3 (#1,#2,#3) | 1 | |
| forms | 5 | 4 (#4,#5,#6,#7) | 1 | |
| html | 4 | 1 (#8) | 1 | |
| css | 4 | 0 | 1 | |
| css-layout | 2 | 0 | 1 | |
| performance | 7 | 4 (#9,#10,#11,#12) | 3 | |
| user-experience | 4 | 3 (#13,#14,#15) | 1 | |
| security | 3 | 1 (#16) | 2 | |
| privacy | 3 | 0 | 3 | |
| built-in-ai | — | — | — | ● |
| passkeys | — | — | — | ● |
| webmcp | — | — | — | ● |
| **Total** | **39** | **16** | **14** | **3 N/A** |

## Delta vs the Prior Analysis

**CONFIRMS** the prior modern-web posture (`2026-06-01-modern-web/speedtest.md`) on its core thesis and all 7 of its drift findings: the View-Transitions double-retirement (its DRIFT #1/#2 = my #13/#14), the MapTooltip phantom-anchor (its #3 = my #15), the `title="Settings"` tooltip (its #4 = my #1), the missing `content-visibility` (its #5 = my #9), the LCP `<img>` missing dimensions (its #6 = my #12), and the analytics-batching gap (its #7 = my #11). All seven verified at the exact cited `file:line`. CONFIRMS the constellation-ui style audit's verdict that this is an exemplary consumer (the token-canon drifts it found are out of *this* lens's scope and not re-counted as modern-platform drift).

**EXPANDS** in three material directions the prior pass under-weighted: (a) **a full forms cluster** — the prior analysis only touched forms via the tooltip; this audit finds the survey has **no `<form>` element, all-`type="text"` inputs, zero `autocomplete`/`inputmode`/`enterkeyhint`/`name`, and no `<nav aria-label="Progress">`** (findings #4–#7, the densest P1 group, all this-repo); (b) **security/privacy as first-class categories** — confirming the CSP + safe-sink conformance the prior pass didn't enumerate, and surfacing the **missing HSTS + Permissions-Policy headers** (#16, P1) the prior pass missed entirely; (c) **a11y depth** — the missing **skip-link** (#2) and **static SPA `<title>`** (#3) the prior pass didn't reach. Also adds the `color-scheme` (css) and tab-content-rebuild (`faster-spa-view-transitions`, #10) findings.

**CORRECTS** nothing in the prior analysis — every prior claim re-verified true. It re-frames two items: the prior pass scored the analytics gap as a single "fetchLater" item; this audit splits the *floor* (the API client's plain `fetch` lacks `keepalive`, `client.ts:149,154`) from the *batching* lever, and notes the `requestIdleCallback`-only scheduling (`scheduler.yield` truly absent) is the INP-axis P1, elevated above the prior pass's rank-5 placement because INP-under-load is the product's defining constraint.
