# Modern-Web CONFORMANCE Audit (PROPER) — `words` (floridify-frontend)

**Lens:** Chrome `modern-web-guidance` v0.0.170 — all 12 categories, every applicable guide
**Invariant lens:** inv-29 (progressive-enhancement-floor) · inv-30 (platform-over-library)
**Date:** 2026-06-01
**Repo:** `/Users/mkbabb/Programming/words`
**Frontend dir:** `/Users/mkbabb/Programming/words/frontend` (321 src files; 148 SFC/CSS)
**Baselines confirmed/expanded:** `docs/audits/runs/2026-06-01-modern-web/words.md` (posture) + `…/2026-06-01-constellation-ui/words.md` (glass-ui canon). This is the rigorous, per-category, file:line, severity-ranked version.

---

## Preamble — Stack & method

Vue 3.5 (`<script setup>`), Vue Router 4, Pinia 3 (+persisted), Vite 8, Tailwind v4 (`@tailwindcss/vite`), SCSS, TS 6 (`vue-tsc`). Shared layer: `@mkbabb/glass-ui ^2.0.0` (Dialog, Toaster, HoverCard, Tooltip, DropdownMenu, Popover, Card, `cn`, `useGlobalDark`, `useScrollTracker`) + `@mkbabb/keyframes.js` + `@mkbabb/latex-paper`. Auth delegated to `@clerk/vue` (sign-in/up are Clerk SDK surfaces — out of forms scope, in security scope). `@tanstack/vue-virtual` and `embla-carousel` are installed; the long-list path uses a **hand-rolled** virtualizer instead.

Every claim below is grep-verified. Repo-wide zero-hit confirmations (the spine of the drift findings):

| Modern API | grep result |
|---|---|
| `popover` attribute (native) | **0** (only reka `PopoverContent` + an event named `show-popover`) |
| `anchor-name` / `position-anchor` / `anchor()` | **0** |
| `animation-timeline` / `scroll()` / `view-timeline` / `animation-range` | **0** |
| `document.startViewTransition` / `view-transition-name` | **0** |
| `content-visibility` / `contain-intrinsic-size` | **0** |
| `loading="lazy"` / `decoding` / `fetchpriority` | **0** (across 9 `<img>`) |
| `width`/`height`/`aspect-ratio` on `<img>` | **0** |
| `<search>` landmark / `<main>` / `<header>` / `<footer>` | **0** / **0** / **0** / **0** |
| `enterkeyhint` / `inputmode` / `:user-valid` / `:user-invalid` | **0** |
| `<form>` element (anywhere) | **0** |
| `:has()` / `@container` / `light-dark()` / `field-sizing` | **0** / **0** / **0** / **0** |
| `text-wrap: balance` / `pretty` | **0** |
| `inert` attribute | **0** |

The codebase is genuinely modern in the hard-won areas (physics `linear()` easing, native `<dialog>` via glass-ui, `prefers-reduced-motion`, `dvh`/`svh`, `color-scheme` dark mode, non-render-blocking self-hosted fonts, **sanitized** `v-html`). The drift is concentrated and structural: a **landmark-less DOM** (no `<main>`, no skip link), three **hand-rolled mechanisms the platform now does natively** (JS scroll-driven header, selection→pill→popover tooltip, JS image lazy-loader with no intrinsic dims), and **zero progressive-enhancement adoption of the 2024–2025 platform layer** (popover, anchor positioning, scroll-driven animations, view transitions, `content-visibility`).

---

## (1) accessibility

**CONFORMANT**
- `useGlobalDark()` drives `<html>.dark`; pre-paint FOUC guard reads persisted theme (`index.html:40-48`); `lang="en"` set (`index.html:2`); split `theme-color` by scheme (`index.html:36-37`). (§4, §9)
- SPA title updates per route (`router/index.ts:74-88`) — satisfies "update document title on page transitions." (§4)
- `prefers-reduced-motion` honored in 7 files incl. core animation sheets (`assets/index.css:103`, `assets/transitions.css:80,113,174`). (§10)
- `v-html` is **sanitized**: `formatExampleHTML`/`formatExampleUsage` escape via `escapeHTML` before interpolation (`utils/formatting.ts:8-14,27-36,108-115`); KaTeX paths go through latex-paper `renderTitle`. No raw user HTML reaches a sink. (§6 / security §1.2)
- Icon-only controls largely carry `aria-label` (e.g. `CarouselSlide.vue:11`). Centralized `role="alert"`+`aria-live="polite"` toaster region (`NotificationToast.vue:11-12`). (§8)

**DRIFT**
- **No `<main>` landmark, no skip link, no `<header>`/`<footer>` anywhere.** The entire app shell is `<div>`-based (`App.vue:3-13`, `Home.vue:6-24`); only 2 `<nav>` (`ProgressiveSidebar.vue:7`, `WordlistProgressiveSidebar.vue:60`) and 1 `<aside>` (`Sidebar.vue:4`). Screen-reader users cannot jump to main content; keyboard users cannot bypass the search header + sidebar. **guide `accessibility` §1 · P1 · effort S · this repo.** Wrap the route outlet in `<main id="content" tabindex="-1">` + a `.visually-hidden` skip link in `App.vue`.
- **Heading hierarchy skips / fake-heading risk.** `<h1>` appears in only 4 files (`Admin.vue:10`, `NotFound.vue:3`, `WordListView.vue:17`, `AnimatedText.vue:3`); the primary Home/Definition view has **no `<h1>`** — the word title is a `<button class="text-title">` (`WordDetailModal.vue:25`) / styled `<div>`, not a heading. 34 `<h3>` vs 10 `<h2>` suggests levels chosen for size, not structure. **guide `accessibility` §1 (no fake headings) · P2 · M · this repo.**
- **Bare `outline-none` without a focus-visible replacement** on 3 interactive controls: `WordDetailModal.vue:16` (DialogClose), `WordDetailModal.vue:26` (word button), `LoadingProgress.vue:59`. Most other sites correctly pair `outline-none` + `focus-visible:ring-*` (24 focus-visible sites). **guide `accessibility` §5 / `css` §4 · P2 · S · this repo.**
- **`viewport` disables zoom** — `user-scalable=no` (`index.html:16`) blocks pinch-zoom; WCAG 1.4.4 / `html` §1 "DON'T disable page zooming." Intentional for the iOS-PWA feel, but it is a documented a11y fail. **guide `html` §1, `accessibility` §9 (200% zoom) · P1 · S · this repo.**

**OPPORTUNITY**
- `accessible-error-announcement` — Admin's only native input (`Admin.vue:111`) and the inline editors have no `aria-describedby`/live-region error wiring; adopt the centralized polite/assertive announcer pattern if validation grows. (§8)

---

## (2) built-in-ai

**N/A as a drift surface, but a real OPPORTUNITY.** App has its own server-side AI (`src/api/ai/{synthesize,generate,suggestions}.ts`); zero use of on-device `Summarizer`/`LanguageModel`/`navigator.modelContext` (grep: 0). For a dictionary, the **Summarizer API** (`built-in-ai/summarizer`, `type: 'tldr'|'key-points'`) is a natural progressive enhancement: a local, private, offline TL;DR of a long definition, gated on `Summarizer.availability()` with the server path as the floor (inv-29). **guide `summarizer` · opportunity · M · this repo.** Not drift — purely additive.

---

## (3) css

**CONFORMANT**
- Physics `linear()` easing tokens (`--ease-spring-*` → `linear(0 …)`) used throughout (86 sites; `transitions.css`, `SearchControls.vue:238`). Matches `physics-based-easing`. (§9)
- Compositor-friendly animation: confetti/cards animate `transform`+`opacity`; `will-change` scoped narrowly (`DefinitionDisplay.vue:408`, `Sidebar.vue:38`, `SearchBarDropdowns.vue:106`). (§9 performance)
- `scrollbar-width`/`scrollbar-color` themed (`SearchHistoryContent.vue:136,145-146`) — matches §5 "theming browser-generated UI."
- Unitless `line-height`, logical `padding-inline`/`padding-block` in `SearchInput.vue:157-159`. (§1, §7)

**DRIFT**
- **`prefers-reduced-motion` block uses a global `*` reset** — `SearchBar.vue:341-346` does `* { animation-duration: 0.01ms !important }`. The `css` guide §2 explicitly says **"DO NOT use global resets (styles on `*`)"**; it also can't reach the JS-driven scroll transforms (see perf). **guide `css` §2 · P2 · S · this repo.** Scope to named animation classes (as `transitions.css` already does correctly).
- **No `:has()` anywhere (0 sites)** despite parent-from-child-state styling done in JS** — e.g. `isActive` hover-state propagation in `useInlineWordLookup.ts:66`, dropdown-open container styling. `css` §3 "prefer `:has()` over managing classes in JS." **guide `css` §3 (`style-parent-with-has`) · P3 · M · this repo (inv-30: native `:has()` replaces JS class bookkeeping).**
- **No `text-wrap: balance`/`pretty` (0 sites)** on headings or definition prose. Word titles (`WordHeader.vue`, `WordListView.vue:17 text-title`) and long definition `<p>` blocks (`ContentBlockRenderer.vue`) are prime candidates. **guide `css` §7 / `improve-text-layout-and-legibility` · P3 · S · this repo.**
- **No `forced-colors` / `prefers-contrast` / `prefers-reduced-transparency` brackets (0 sites)** — the hand-rolled glass surfaces (`index.css` `.dialog-surface`/`.popover-surface`, `backdrop-blur-xl`) have no Forced-Colors or reduced-transparency fallback (canon glass tiers ship all three; words reimplements without them — confirmed in the glass-ui audit Axis 7). **guide `css` §5 (Forced Colors) · P2 · M · this repo (or adopt `.glass-*`).**

**OPPORTUNITY**
- `field-sizing: content` on the search `<textarea>` (`SearchInput.vue`) replaces the entire JS `resizeTextarea()` reflow machine (`:80-105`) with one CSS line. **guide `css` §5 · S · this repo (inv-30).**

---

## (4) css-layout

**CONFORMANT**
- Dynamic viewport units `dvh`/`svh`/`dvw` (21 sites: `Home.vue:24,31`, `scroll.ts:114,141`, modal max-heights). Matches §7. (§1)
- Flexbox/Grid used idiomatically with `gap`, `min-w-0` on flex children (`Home.vue:38`). (§2)

**DRIFT**
- **No `aspect-ratio` on any media (0 sites).** Every `<img>` (carousel, avatar, review) lacks reserved space → CLS. css-layout §1.2 "use `aspect-ratio` to reserve space for media." **guide `css-layout` §1.2 · P1 · S · this repo.** (Coupled with the perf image finding.)
- **No `@container` queries (0 sites)** despite container-driven components (sidebar collapse, definition card density toggled by viewport media queries). css-layout §4. **guide `css-layout` §4 · P3 · M · this repo.**
- **Anchor positioning unused (0 sites)** — the inline-lookup tether (`useInlineWordLookup.ts:108-116`) is exactly the css-layout §5 "float above the page, stay tethered across stacking contexts" case. **guide `css-layout` §5 · P1 · M · glass-ui (inv-30).** (See user-experience for the full tooltip finding.)

---

## (5) forms

**CONFORMANT**
- Search `<textarea>` carries `aria-label="Search for a word"` + `role="searchbox"` (`SearchInput.vue:7-8`) — a reasonable accessible-name baseline.

**DRIFT**
- **No `<form>` element, no `<search>` landmark, no `inputmode`/`enterkeyhint` anywhere (all 0).** The primary search is a bare `<textarea role="searchbox">` (`SearchInput.vue:2-37`) not wrapped in `<search><form method="GET">`. forms §1/§3 + html §1: `<search>` removes the need for `role`, `enterkeyhint="search"` + `inputmode="search"` improve the mobile keyboard. **guide `forms` §1,§3 + `html` §1 · P2 · S · this repo.** Drop the redundant `role="searchbox"`.
- **Native text inputs lack `autocomplete`** — `Admin.vue:111` and the sidebar/wordlist search fields (`SidebarWordListView.vue:10`, `SynonymListEditable.vue:71`) are bare `<input>` with no `autocomplete`/`inputmode`. forms §3. **guide `forms` §3 · P3 · S · this repo.** (Clerk owns the credential forms — exempt.)
- **No `:user-valid`/`:user-invalid` styling (0 sites)** for the inline editors that do client validation (slug, wordlist target). `css` §5 / forms §4 — use post-interaction pseudo-classes, not `:invalid`. **guide `forms` §4 · P3 · S · this repo.**

**OPPORTUNITY**
- `animated-select-picker` / `branded-select-styling` — if any `<select>` exists it could adopt `appearance: base-select` + `::picker(select)`; low priority (mostly reka primitives). 

---

## (6) html

**CONFORMANT**
- `<!DOCTYPE html>` + `lang="en"` + viewport meta present (`index.html:1-2,16`).
- Native `<dialog>` for all modals via glass-ui `Dialog`/`DialogContent` (20+ consumers: `Modal.vue`, `WordDetailModal.vue`, `EditWordNotesModal.vue`, etc.) — Escape/backdrop/focus delegated to the native top-layer element. (§4)
- `style` attribute used to pass **state** to CSS via custom properties (`SearchInput.vue:9-13` `--search-min-h` etc.) — exactly §9 "pass state to CSS via custom properties." (§9)

**DRIFT**
- **`title="…"` used as a tooltip on ~10 controls** — `SidebarWordListItem.vue:99`, `SidebarLookupView.vue:11,28,41,64,80`, `WordlistTargetForm.vue:85`, `CreateWordListModal.vue:42`. html §5 + accessibility §3 explicitly: **"DON'T use `title` to create tooltip effects"** / "DON'T use `title` as a naming mechanism." **guide `html` §5, `accessibility` §3 · P2 · S · this repo.** Replace with a real accessible name (`aria-label`) or the Popover-API hint (see ux).
- **`<img>` tags omit `width`/`height`/`loading`/`decoding`** (all 9; `CarouselSlide.vue:54,75,106`, `ReviewModal.vue`, `YoshiAvatar.vue`, `Admin.vue:54`, `ErrorState.vue`, `EmptyState.vue`). html §3 mandates `width`/`height` (CLS) + `loading="lazy"` off-screen. **guide `html` §3 · P1 · S · this repo.** (Full finding under performance.)
- **`inert` unused (0)** — `WordDetailModal` hand-restores `window.scrollY` (`:190,195`) instead of relying on the dialog top-layer + inert background. html §6. **guide `html` §6 · P2 · S · this repo.**

---

## (7) passkeys

**N/A.** Authentication is fully delegated to `@clerk/vue` (`main.ts`, `stores/auth.ts`, `views/Login.vue`, `Signup.vue`). No `navigator.credentials`/`PublicKeyCredential` in-repo (grep: 0). Passkey support, if desired, is a Clerk configuration concern, not a frontend-code adoption — out of scope for this target.

---

## (8) performance

**CONFORMANT**
- Non-render-blocking fonts: `preconnect` + `<link rel=preload as=style … onload=…>` for Fraunces + `<noscript>` fallback; Fira Code self-hosted via glass-ui (`index.html:57-63`). Matches "Web Fonts Optimization" + CRP.
- Compositor-only animations + scoped `will-change` (see css). INP-friendly.

**DRIFT**
- **JS `window.scroll` listener drives the search-header shrink/fade/scale every frame.** `Home.vue:174` `useScroll(window)` → `scrollProgress` (`:180-188`) → `SearchBar`/`scroll.ts:101-149` computes `transform: scale()`, `opacity`, interpolated `maxWidth` as inline styles per scroll frame; `calculateIconOpacity` (`scroll.ts:53-90`) likewise. This is the canonical `shrinking-header-on-scroll` case — the platform does it declaratively with `animation-timeline: scroll(block root)` + `animation-range` on the compositor thread. **guide `shrinking-header-on-scroll` (+`scroll-progress-indicator`) · P1 · M · this repo · inv-30 yes.** **inv-29:** ship behind `@supports ((animation-timeline: scroll()) and (animation-range: 0% 100%))`, keep the JS path as the Firefox floor (do NOT rip out). **Note:** the JS scroll transforms have **no `prefers-reduced-motion` gate** (`Home.vue:174-188` is unconditional; `SearchBar.vue:341` only suppresses CSS *transitions* via a `*` reset) — a current a11y regression the CSS migration would fix.
- **Image lazy-load reimplemented in JS with a hidden proxy `<img>`.** `CarouselSlide.vue:44-114` gates render on `shouldLoad`/`loaded` props and renders an offscreen `opacity-0` `<img>` purely to fire `@load` (`:106-112`); `ImageCarousel.vue:126-205` maintains a `loadingImages` Set + adjacency window. Native `loading="lazy"` + `width`/`height` (or `aspect-ratio`) + `decoding="async"` removes the entire state machine and prevents CLS; `fetchpriority="low"` for off-screen slides. **guide `optimize-image-priority` + perf "Modern Image & Media" · P1 · S · this repo · inv-30 yes.**
- **Bespoke virtual windowing** — `composables/virtual/useVirtualSectionWindow.ts` is a hand-rolled scroll-listener + rAF + ResizeObserver + `getBoundingClientRect`-on-scroll virtualizer ("transposed from glass-ui"). For long-but-bounded sectioned lists, `content-visibility: auto` + `contain-intrinsic-size` defers off-screen layout/paint without a manual render window; where true windowing is needed, `@tanstack/vue-virtual` is **already installed** but unused on this path. **guide `defer-rendering-heavy-content` · P2 · L · this repo · inv-30 yes.** `getBoundingClientRect` reads on scroll risk layout thrash.
- **No `content-visibility` (0 sites)** on off-screen definition sections / sidebar lists. Lowest-risk perf win (degrades to no-op on unsupported engines — inv-29 free). **guide `defer-rendering-heavy-content` · P2 · M · this repo.**
- **No `fetchpriority="high"` on the LCP candidate** — the definition/word hero has no priority hint; carousel images compete at default priority. **guide `optimize-image-priority` · P2 · S · this repo.**

**OPPORTUNITY**
- `faster-spa-view-transitions` / `same-document-transitions` — see user-experience.

---

## (9) privacy

**CONFORMANT (light surface)**
- Engagement counters stored in `localStorage` only (`App.vue:41-57`) — local, not beaconed; data-minimization-aligned.

**DRIFT / OPPORTUNITY**
- **No `Clear-Site-Data` on logout** (privacy §2) — logout clears Pinia/Clerk session but does not emit `Clear-Site-Data` to purge browser-side residue. This is a backend/header concern (api repo) but the frontend logout flow (`stores/auth.ts`) is the trigger point. **guide `privacy` §2 · P3 · S · this repo+backend.**
- **No PEPC `<permission>` element** for the PWA notification permission prompt (`PWANotificationPrompt.vue`) — currently an imperative prompt; privacy §2 recommends the declarative `<permission>` mediator with an imperative fallback (inv-29). **guide `privacy` §2 · P3 · M · this repo.**
- Otherwise privacy posture is sound: no third-party trackers in `src`, no speculative data collection observed.

---

## (10) security

**CONFORMANT**
- **All `v-html` sinks are sanitized or trusted** — `formatting.ts` escapes inputs before building HTML (`:8-14,27-36,108-115`); `ContentBlockRenderer.vue:12` and `FancyF.vue:98` render KaTeX/static strings via latex-paper. No `innerHTML`/`outerHTML`/`document.write`/`eval`/`new Function` in `src` (grep: 0). Matches security §1.2 "avoid dangerous DOM sinks." This is the single most important security finding and it's **green**.
- No `target="_blank"` (0) → no reverse-tabnabbing surface.
- No inline `onclick` handlers in markup (Vue `@click`), aligning with CSP-friendliness (security §1).

**DRIFT / OPPORTUNITY**
- **`v-html` on model/AI-derived text without a Sanitizer pass.** `WordSuggestionDisplay.vue:59` (`formatExampleUsage(suggestion.example_usage)`) and `ExampleListEditable.vue:40` render server/AI-sourced strings; they ARE escaped first, but security §1.2 recommends `setHTML`/Sanitizer API for untrusted HTML as defense-in-depth. The current regex-escape is correct but brittle (a future template edit that forgets to escape re-opens XSS). **guide `security` §1.2 · P2 · S · this repo.** Centralize through a `sanitize()`/Sanitizer-API helper.
- **CSP / Trusted Types are header concerns** (nginx.conf / api repo, not `src`) — out of this frontend audit's file scope, but flagged: the SPA loads Fraunces + Clerk from cross-origin (`index.html:57-59`), so a `script-src`/`style-src` CSP and SRI on those would close security §3.2/SRI. **guide `security` §3 · P2 · M · backend/infra.**

---

## (11) user-experience

**CONFORMANT**
- `physics-based-easing` (`linear()` springs) — exemplary (86 sites).
- `individual-transform-properties` + `prefers-reduced-motion` per-animation (`transitions.css`).
- `dark-mode` via `color-scheme` + FOUC guard.

**DRIFT**
- **Hand-built selection→pill→popover tooltip.** `useInlineWordLookup.ts` wires `selectionchange`/`dblclick`/`mousedown` document listeners (`:150-161`), computes anchor from `getBoundingClientRect` (`:40-46,108-116`), teleports to `body`, manages click-outside + a 200ms dismiss timer (`:82-93,144-148`). The platform now gives this for free: Popover API (`popover="hint"` + `interestfor`) handles light-dismiss, Esc, hover/persist (WCAG 1.4.13), and auto-wires `aria-describedby`/`aria-details`; CSS anchor positioning handles the tether. **guide `interest-triggered-tooltips` + `position-aware-tooltips` + `declarative-dialog-popover-control` · P1 · M · glass-ui · inv-30 yes.** **inv-29:** mandatory `@oddbird/popover-polyfill` + `@oddbird/css-anchor-positioning` polyfills (Safari lacks `popover="hint"`; Firefox/Safari lack anchor positioning) with explicit `anchor-name`/`position-anchor` — keep the JS path as the polyfilled floor. Highest cross-repo leverage → glass-ui.
- **`title`-attribute tooltips** (~10 sites, see html §5) are the degenerate version of the same pattern — same fix.
- **No View Transitions (0 sites)** despite a single-component-per-route SPA (`router/index.ts` maps Home/Search/Definition/Thesaurus/Wordlist all to `Home.vue`). Wrapping route/definition swaps in `document.startViewTransition({update, types:[dir]})` with `:active-view-transition-type()` gives morphing word→definition transitions and forward/back spatial mapping, replacing ad-hoc Vue `<Transition>` crossfades. **guide `same-document-transitions` + `directional-navigation-transitions` + `faster-spa-view-transitions` · P2 · M · this repo (or a glass-ui router helper) · inv-30 partial.** **inv-29:** `if (!document.startViewTransition) updateDOM()` floor + `prefers-reduced-motion` `::view-transition-group(*){animation:none}`.
- **Embla carousel where CSS scroll-snap may suffice.** `ImageCarousel.vue` uses `embla-carousel-vue` (`:12 loop`, `:14 dragFree`) + a JS loading window. CSS `scroll-snap-type` + `scroll-snap-align` + `carousel-slide-effects`/`carousel-snap-highlights` (scroll-driven) cover the common case natively; Embla narrows to its residual differentiator (loop/free-drag). **guide `carousel-slide-effects` · P3 · M · this repo · inv-30 partial.** (Lower confidence — loop mode is a legit Embla residual.)
- **`useScrollTracker` (glass-ui) is a JS scroll listener for the TOC active-section** (`ProgressiveSidebar.vue:60,92`). The "which section am I in" highlight is a `scroll-driven` / `scroll-position-aware-elements` candidate. **guide `scroll-position-aware-elements` · P3 · M · glass-ui · inv-30 yes.**

**OPPORTUNITY**
- `scroll-progress-indicator` — a reading-progress bar for long definitions, pure CSS scroll-timeline (decorative → no fallback needed per inv-29). · S · this repo.
- `light-dismiss-a-dialog` / `closedby="any"` — the `<dialog>` modals could drop any remaining JS backdrop handlers for the native `closedby="any"` attribute. · S · this repo.

---

## (12) webmcp

**N/A as drift; OPPORTUNITY.** No `navigator.modelContext` (0). WebMCP is Chromium early-preview (flagged). A dictionary's "look up word / add to wordlist / synthesize definition" actions are clean atomic-tool candidates via the **declarative** `<form toolname=…>` API — but this is blocked on there being a `<form>` at all (see forms §1) and on WebMCP shipping. Defer. **guide `webmcp` · opportunity · L · this repo (after forms landmark fix).**

---

## P0 / P1 severity-ranked table

| Sev | Finding | Guide id | Site | Lands-in | inv30 |
|---|---|---|---|---|---|
| **P1** | No `<main>` landmark / no skip link / no `<header>` — landmark-less DOM | `accessibility` §1 | `App.vue:3-13`, `Home.vue:6-24` | this repo | no |
| **P1** | `user-scalable=no` disables pinch-zoom (WCAG 1.4.4) | `html` §1 / `accessibility` §9 | `index.html:16` | this repo | no |
| **P1** | JS `window.scroll` drives header shrink per-frame; no reduced-motion gate | `shrinking-header-on-scroll` | `Home.vue:174-188`, `scroll.ts:101-149` | this repo | **yes** |
| **P1** | `<img>` lazy-load reimplemented in JS; 0 `width`/`height`/`loading`/`decoding` (CLS) | `optimize-image-priority` | `CarouselSlide.vue:54,75,106`, `ImageCarousel.vue:126` | this repo | **yes** |
| **P1** | No `aspect-ratio` on any media (CLS) | `css-layout` §1.2 | all 9 `<img>` | this repo | no |
| **P1** | Hand-built selection→pill→popover tooltip (listeners + getBoundingClientRect) | `interest-triggered-tooltips`, `position-aware-tooltips` | `useInlineWordLookup.ts:40,108,150` | **glass-ui** | **yes** |
| P2 | Heading hierarchy skips / word-title is a `<button>` not `<h1>` | `accessibility` §1 | (no `<h1>` on Home) | this repo | no |
| P2 | `title="…"` used as tooltip (~10 sites) | `html` §5 / `accessibility` §3 | `SidebarLookupView.vue:11,28,41,64,80` +5 | this repo | no |
| P2 | No `<search>`/`<form>`; no `enterkeyhint`/`inputmode` on search | `forms` §1,§3 / `html` §1 | `SearchInput.vue:2-37` | this repo | no |
| P2 | No View Transitions in a per-route SPA | `same-document-transitions`, `directional-navigation-transitions` | `router/index.ts`, `Home.vue` | this repo | partial |
| P2 | Bespoke virtualizer; `@tanstack/vue-virtual` installed-unused; `content-visibility` absent | `defer-rendering-heavy-content` | `useVirtualSectionWindow.ts` | this repo | **yes** |
| P2 | Hand-rolled glass surfaces lack forced-colors / reduced-transparency fallback | `css` §5 | `index.css:156-208` | this repo / glass-ui | no |
| P2 | `prefers-reduced-motion` global `*` reset (anti-pattern) | `css` §2 | `SearchBar.vue:341-346` | this repo | no |
| P2 | `WordDetailModal` hand-restores `window.scrollY` instead of dialog top-layer/`inert` | `html` §4,§6 | `WordDetailModal.vue:190,195` | this repo | no |
| P2 | Bare `outline-none` without focus-visible (3 controls) | `accessibility` §5 / `css` §4 | `WordDetailModal.vue:16,26`, `LoadingProgress.vue:59` | this repo | no |
| P2 | `v-html` on AI text without Sanitizer-API (escape-only, brittle) | `security` §1.2 | `WordSuggestionDisplay.vue:59`, `ExampleListEditable.vue:40` | this repo | no |
| P2 | No CSP/SRI on cross-origin Fraunces+Clerk | `security` §3 | `index.html:57-59`, nginx | backend/infra | no |

---

## glass-ui GAPS (adoptions that should land in glass-ui for ≥2 consumers)

- **GU-1 — Popover/anchor tooltip primitive (`interest-triggered-tooltips` + `position-aware-tooltips`).** The tether + light-dismiss + WCAG-1.4.13 + ARIA wiring in `useInlineWordLookup.ts` is generic plumbing ≥2 glass-ui consumers need (words + any tethered-tooltip app). A glass-ui `<Popover anchor>` / interest-invoker primitive (native `popover="hint"` + `interestfor` + `anchor-name`/`position-anchor` + the two oddbird polyfills, inv-29 floor built in) lets words delete the whole composable. **Highest cross-repo leverage.**
- **GU-2 — Scroll-driven primitives (`shrinking-header-on-scroll`, `scroll-progress-indicator`, `scroll-position-aware-elements`).** The JS scroll mechanics recur across glass-ui consumers: words' header shrink (`scroll.ts`), the TOC active-section highlight (glass-ui's own `useScrollTracker`), reading progress. A glass-ui CSS-scroll-timeline helper (+`@supports` floor) replaces all the per-app `useScroll`/`addEventListener('scroll')` reimplementations. inv-30 across the constellation.
- **GU-3 — Native-image primitive / `<GlassImage>` (`optimize-image-priority`).** Every consumer hand-writes `<img>` without `width`/`height`/`loading`/`decoding`. A glass-ui image wrapper that enforces intrinsic dims + `loading`/`decoding`/`fetchpriority` defaults (and could host the lazy/blur-up) removes the JS lazy-load state machines in ≥2 apps. inv-30.
- **GU-4 — `content-visibility`/virtualization convergence (`defer-rendering-heavy-content`).** words' `useVirtualSectionWindow` is "transposed from glass-ui" — so the bespoke virtualizer ALREADY lives in glass-ui. Re-home it onto `content-visibility: auto` + `@tanstack/vue-virtual` once, in glass-ui, so every consumer benefits and the per-app fork dies.
- **GU-5 — Forced-colors/reduced-transparency-resilient glass tiers.** words reimplements glass (`index.css` `.dialog-surface`/`.popover-surface`) WITHOUT the canon's `@supports not (backdrop-filter)` / `prefers-reduced-transparency` / `prefers-contrast` brackets that `.glass-*` already ships. The gap is adoption, not absence — but glass-ui should expose the tiers prominently enough that consumers stop reinventing them. (Cross-refs constellation-ui Axis 7 + U3.)

---

## Conformance scorecard

| Category | ✓ conformant | ✗ drift | + opportunity | N/A |
|---|---|---|---|---|
| accessibility | 5 | 4 | 1 | |
| built-in-ai | 0 | 0 | 1 | (no native AI; additive only) |
| css | 4 | 4 | 1 | |
| css-layout | 2 | 3 | 0 | |
| forms | 1 | 3 | 1 | |
| html | 3 | 3 | 0 | |
| passkeys | 0 | 0 | 0 | ✅ N/A (Clerk-delegated) |
| performance | 2 | 5 | 1 | |
| privacy | 1 | 2 | 1 | |
| security | 3 | 2 | 1 | |
| user-experience | 3 | 5 | 2 | |
| webmcp | 0 | 0 | 1 | (Chromium preview; defer) |
| **Total** | **24** | **31** | **10** | 2 |

---

## Delta vs the prior analysis

**CONFIRMS** (all three prior-posture drift headlines re-verified at file:line, severity-assigned):
- JS-scroll header shrink → scroll-driven CSS (now **P1**, and newly: it has **no `prefers-reduced-motion` gate** — a live a11y regression the migration fixes).
- Hand-built tooltip → Popover + anchor positioning (now **P1**, glass-ui, inv-30; the prior "highest-leverage" verdict stands and is now GU-1).
- JS image lazy-loader + missing intrinsic dims → native (now **P1**; expanded to include `ImageCarousel.vue`'s second loading window + the `aspect-ratio`/css-layout coupling).
- Prior conformant list (physics easing, native `<dialog>`, reduced-motion, `dvh`/`svh`, `color-scheme`, non-blocking fonts) all re-verified.

**EXPANDS** (new findings the posture scan did not surface, now first-class):
- **Landmark-less DOM (P1)** — no `<main>`, no skip link, no `<header>`/`<footer>`; only 2 `<nav>` + 1 `<aside>`. The biggest new a11y finding.
- **`user-scalable=no` zoom-disable (P1)** — WCAG 1.4.4 fail.
- **No `aspect-ratio` anywhere (P1, css-layout)** — distinct CLS axis from the image-loading finding.
- **`title`-attribute tooltips (~10 sites, P2)** — the html §5 anti-pattern, same root as the tooltip rehome.
- **`prefers-reduced-motion` global `*` reset (P2)** — `css` §2 anti-pattern in `SearchBar.vue:341`.
- **Security is GREEN on DOM sinks** — the posture scan didn't audit `v-html`; this audit confirms all 6 sites are escaped/trusted (P2 only for the brittleness/Sanitizer-API hardening + cross-origin CSP/SRI).
- **View Transitions, `content-visibility`, `field-sizing`, `:has()`, `text-wrap`, built-in-AI Summarizer, WebMCp** — each enumerated per-category with inv-29/inv-30 framing.

**CORRECTS** (refinements vs the prior framing):
- The glass-ui-audit's claim that `useVirtualSectionWindow` is "transposed from glass-ui" is the key correction lever: the bespoke virtualizer is **not** a words-only fork — it lives in glass-ui — so the fix is GU-4 (re-home onto `content-visibility`/`@tanstack` once in the library), not a per-app rewrite. This upgrades the prior "this repo, effort L" to "glass-ui, fixes all consumers."
- The prior scan treated the tooltip rehome as the lone glass-ui gap; this audit identifies **five** glass-ui adoption gaps (GU-1…GU-5), three of which (popover, scroll-driven, native-image) are cross-consumer platform-over-library (inv-30) wins.
