# Modern-Web CONFORMANCE Audit — fourier (`web/`)

**Date:** 2026-06-01
**Lens:** Chrome **modern-web-guidance v0.0.170** (`/tmp/mwg/package/skills/modern-web-guidance/guides`, 12 categories)
**Invariant frame:** **inv-29 progressive-enhancement-floor** (every modern-API rec ships behind `@supports`/feature-gate, prior path retained as the Safari/Firefox FLOOR — flag rip-out risk) · **inv-30 platform-over-library** (flag every site where a native platform capability should REPLACE a JS/library reimplementation).
**Mode:** READ-ONLY. The only file written is this report.
**Baselines confirmed/expanded/corrected:** `docs/audits/runs/2026-06-01-modern-web/fourier.md` (posture) + `docs/audits/runs/2026-06-01-constellation-ui/fourier.md` (glass-ui canon). This is the rigorous, per-category, `file:line`, severity-ranked version.

## Preamble

- **Frontend dir:** `/Users/mkbabb/Programming/fourier-analysis/web`, src at `web/src/`.
- **Stack:** Vue 3.5 `<script setup>` SFCs + Vite 7 + vue-router 4 + Pinia 2 + Tailwind v4 (`@tailwindcss/postcss`), TS 5.8, Canvas 2D epicycle renderer, KaTeX 0.16, Playwright e2e (`@axe-core/playwright` present).
- **Shared layer:** `@mkbabb/glass-ui@^2.0.0` (reka-ui primitives: Dialog, Tooltip/HoverCard, Collapsible, Switch, Checkbox, Badge, Button, Toaster, GlassDock, InfiniteScroll, UnderlineTabs) + `@mkbabb/latex-paper@^0.2.1` (`useVirtualSectionWindow`, `PaperSection`) + `value.js` + `keyframes.js` + `pencil-boil`.
- **Surfaces:** `/paper` (windowed KaTeX reader + virtual TOC), `/visualize` + `/w/:slug` + `/v/:slug` (canvas epicycles, image upload/contour editor, fullscreen viewer), `/gallery` (infinite grid + featured carousel + marquee + admin), `/equation` (live convergence), `/morph`.
- **New since the posture analysis:** a full **CSP `_headers`** ships at `web/public/_headers` (tranche H.γ) — the posture audit under-credited this. It is a tight, per-directive-rationalized policy. This audit folds it into the **security/privacy** sections and corrects the avatar finding accordingly.

**Verdict in one paragraph.** fourier is a genuinely strong modern-web posture whose drift is concentrated and *almost entirely opportunity-grade* — there is exactly one true a11y P0 (form `<label>`s are not programmatically associated with their inputs), one P0-adjacent a11y/inert gap (the hand-rolled `FullscreenViewer` trap does not `inert` the background), and the rest are P1/P2 performance and UX adoptions. The single biggest unrealized lever remains **zero `content-visibility`** in a tree built around a 97-page windowed paper and an always-on 60fps off-screen canvas. Every recommendation below is inv-29-gated (the existing path stays as the Safari/Firefox FLOOR) and the platform-over-library (inv-30) replacements are explicitly flagged.

---

## (1) accessibility

**Conformant**
- Per-route `<title>` + `<meta name=description>` update on `afterEach` — `router/index.ts:102-130` (SPA route-change announce substrate). Matches `accessibility` §4.
- ARIA-button-on-non-button done correctly where native `<button>` isn't used — `GalleryCard.vue:68-78` (`role="button"` + `tabindex="0"` + Enter/Space `.prevent` + `:aria-label`). `accessibility` §2/§5.
- `:focus-visible` rings (not `:focus`) with `outline-offset`, hoisted to the global layer so Vue scoped-hash classes still match — `style.css:136-143`; component-local rings at `ImageUpload.vue:199-201`, `AnimationControls.vue:183`. `accessibility` §5.
- `aria-live="polite"` + `role="status"` on async loaders/paginators — `AdminFlaggedPanel.vue:151`, `AdminUserList.vue:275,443`. `accessible-error-announcement`.
- `aria-label` (58 sites) / `aria-pressed` (16) used idiomatically on icon-only controls. Light-mode `--viz-amber` darkened to clear WCAG AA (≈4.6:1) — `style.css:113-127`.
- `prefers-reduced-motion` honored in **9** files (`style.css`, `ContourSettings`, `AnimationControls`, `GalleryMarquee`, `GalleryCard`, `CollapsibleSection`, `ConvergencePlot`, `DarkModeToggle`, `SvgFilters`).

**Drift**
- **[P0 · S · this-repo] Form labels are not programmatically associated with their inputs.** Every `<label>` is a bare visual label with no `for`, and the paired `<input>` has no `id` — `FunctionInput.vue:97/98` (Expression), `:114/115/126` (Domain start/end), `MorphPhaseConfig.vue:8/10` (Duration), `HarmonicLevelGrid.vue:7/8,30/31` (Low/High). A screen-reader user tabbing to the field hears no name (the `number`/`text` inputs in HarmonicLevelGrid do carry `aria-label`, but the visible `<label>` is still orphaned; the FunctionInput Expression/Domain fields have **neither** `for/id` **nor** `aria-label`). **Modern replacement:** add `for`/`id` pairing (or wrap input inside `<label>` as `SliderControl.vue:66` already does correctly). Guide: `accessibility` §2 / `forms` §2 ("always associate `<label>` with its input using `for` and `id`"). **inv-30:** no (pure semantics, not a library swap).
- **[P1 · M · this-repo] Hand-rolled focus-trap does not `inert` the background.** `FullscreenViewer.vue:30-101` queries a `FOCUSABLE` selector and wraps Tab/Shift-Tab manually, but never sets `inert` (grep: 0 `inert` in src) or `aria-hidden` on the background document — so an AT virtual cursor / screen-reader browse mode can still walk into the now-occluded page behind the overlay. Native `<dialog>.showModal()` (and the glass-ui `<Dialog>` used two files over) make the background inert for free. Guide: `accessibility` §3 (focus management) / `declarative-dialog-popover-control`. **inv-30: yes** (native top-layer replaces the hand-trap). **inv-29:** `<dialog>` is Baseline-wide; the glass-ui `<Dialog>` reuse needs no gate.
- **[P2 · S · this-repo] `aria-expanded` is absent on every disclosure/popover trigger** (grep: 0 `aria-expanded`). The magnet/view-options popovers (`EditorControlsDock.vue:101`, `CanvasControlsDock.vue:43`) and the `CollapsibleSection` trigger toggle visible content without exposing expanded state. (glass-ui's `CollapsibleTrigger` may emit it internally — verify; the bespoke popovers in EditorControlsDock/CanvasControlsDock do not.) Guide: `forms` §7 / `accessibility` §2.

**Opportunity**
- The `@axe-core/playwright` dep is installed — wire an axe pass into the e2e gate over `/equation` and `/morph` (the two surfaces with the orphaned labels) so the P0 above is regression-caught. Guide: `accessibility` §10 (testing).

---

## (2) built-in-ai

**N/A** — no on-device AI surface today (grep: 0 `Translator`/`Summarizer`/`LanguageModel`/`window.ai`). **Opportunity (P3):** the paper is English-only with a long mathematical prose body; the on-device **Translator** + **Language Detector** could offer a client-side translate of section prose behind a feature gate, and the **Summarizer** could generate per-section abstracts for the TOC. Strictly progressive (inv-29: gate on `'Translator' in self`, FLOOR = untranslated text). Guides: `translator`, `summarizer`, `language-detection`. Low priority — flagged for completeness, not recommended now.

---

## (3) css

**Conformant**
- `color-mix(in srgb, …)` for every tint instead of preprocessor color math — **171** occurrences across the tree (e.g. `style.css:29,33`, `FullscreenViewer.vue:199-200`). `css` §8.3.
- `:has()` for child-state styling — `GlassTimeline.vue:103` (`.timeline-row:has(.glass-slider[data-held])`). `css` §3 / `child-state-based-styling`.
- `mask-image` edge-fade on the featured carousel — `GalleryFeaturedCarousel.vue:68-75`. `soft-edge-content-fade`.
- Zero hand-rolled `cubic-bezier()` strings; all easing flows through `var(--ease-*)` tokens (constellation-ui A.W3.d hardening verified).
- `overscroll-behavior: contain` on every nested scroller — `PaperView.vue:408`, `PaperSidebar.vue:155-156`, `MobileFloatingToc.vue:303`, `PaperSearch.vue:111,300`. `css` §9.

**Drift**
- **[P2 · M · this-repo] Zero CSS logical properties** (grep: 0 `margin-inline`/`padding-block`/`inset-inline`). Spacing is all physical (`margin-left`, `padding-bottom`, `top`/`right`). The `forms` guide §5 and `css-layout` call for logical properties for RTL/i18n resilience. Low urgency (the app is LTR-only today) → P2. Guide: `css` §logical-properties / `forms` §5.
- **[P3 · S · glass-ui] `scrollbar-width: thin` used, but no `scrollbar-color` and no contrast adaptation** — `GalleryFeaturedCarousel.vue:66`, `EquationResult.vue:66`, `FrequencyGraph.vue:237`, `ConvergenceLegend.vue:52`, `HarmonicLevelGrid.vue:223`, `EquationPanel.vue:106`. The high-contrast-preference scrollbar treatment (`scrollbar-color` under `@media (prefers-contrast: more)`) is unadopted. Guide: `adapt-scrollbar-to-contrast-preferences` / `customize-scrollbar-color-and-thickness`. **inv-30:** no. Lands in glass-ui (a shared `.thin-scroller` utility — ≥2 consumers). **inv-29:** `scrollbar-color` degrades silently.

**Opportunity**
- **`text-wrap: balance`** on headings (grep: 0 `text-wrap`) and **`text-wrap: pretty`** on the paper prose body — both ship zero-risk improvements to the windowed KaTeX reader's heading line-breaks and prose rag. Guide: `improve-text-layout-and-legibility`. inv-29: ignored where unsupported (FLOOR = default wrapping).

---

## (4) css-layout

**Conformant**
- Dynamic viewport units throughout — `App.vue:23` (`h-dvh`), `style.css:21` (`100dvh`), `PaperView.vue:409,457`, `PaperSearch.vue:253`, `PaperSidebar.vue:145-152`, `AnimationControls.vue:135`. `css-layout` §1.2.
- `min()`/`clamp()` fluid sizing — `AnimationControls.vue:135` (`min(var(--animation-dock-max-width,960px), calc(100dvw - 1rem))`), `PaperArticleWindow.vue:112` (`clamp(3.5rem, 8vh, 5rem)`), `PaperSearch.vue:253` (`min(36rem, calc(100dvw - 2rem))`). `css-layout` intrinsic sizing.
- `env(safe-area-inset-bottom)` + `viewport-fit=cover` for notch-safe layout — `style.css:25`, `index.html:5`.

**Drift**
- **[P1 · M · this-repo] Zero container queries** (grep: 0 `@container`/`container-type`). The Configurator workspace, the equation side panel, and the gallery grid all reflow on viewport `@media` breakpoints rather than on their own container width. The Configurator priority-slice (constellation-ui Axis 4 / G2) — where the stage cell collapses and needs a `:deep()` flex hack — is exactly the kind of component-intrinsic reflow that `container-type: inline-size` + size queries express natively, decoupling the panel from the viewport. Guide: `css-layout` §container-queries / `size-aware-styling`. **inv-30:** no (CSS layout, not a JS lib). **inv-29:** `@container` is Baseline-wide; the `scroll-state` variant (used in §11 below) is the one needing a gate.

**Opportunity**
- `aspect-ratio` on the paper figure `<img>` (currently only `max-height:400px`) — see §9. Intrinsic-size CSS replaces the JS scroll-correction that fights the un-dimensioned figure's CLS.

---

## (5) forms

**Conformant**
- `autocomplete="off"` on the math-expression field (correct — it is not a profile field) — `FunctionInput.vue:109`; `spellcheck="false"` on the same. `forms` §3.
- AJAX submit pattern — Enter triggers compute via `@keydown.enter` (`FunctionInput.vue:101`), no full navigation. `forms` §7.
- `aria-label` on icon-only / orphaned-label inputs — `HarmonicLevelGrid.vue:23`, `UserSlugBar.vue:132`.

**Drift**
- **[P0 · S · this-repo] Orphaned `<label>`s** (same finding as §1, filed here against `forms` §2). `FunctionInput.vue:97,114`, `MorphPhaseConfig.vue:8,35`, `HarmonicLevelGrid.vue:7,30` — visible labels with no `for`/`id`. Guide: `forms` §2. **inv-30:** no.
- **[P2 · S · this-repo] Search inputs use `type="text"`, not `type="search"`, and carry no `inputmode`/`enterkeyhint`** — `PaperSearchInput.vue:37`, `PaperSearchModal.vue:52`, `GallerySearchBar.vue:48`. `type="search"` gives the native clear affordance + correct mobile keyboard; `enterkeyhint="search"` labels the Enter key. The login slug field `UserSlugBar.vue:128` likewise lacks `enterkeyhint="go"`. Guide: `forms` §3. **inv-30:** no.
- **[P2 · S · this-repo] No `<form>` element wraps the login control** — `UserSlugBar.vue:127-156` is a `<div>` of inputs+buttons with JS `@keydown` submit; no native submit semantics, no `autocomplete`. The slug is a username-equivalent → `autocomplete="username"` would enable browser save/fill. Guide: `forms` §1/§8. **inv-30:** no.

**Opportunity**
- The math-expression `<input>` (`FunctionInput.vue:98`) is the app's signature input; native constraint validation (`pattern`, `:user-invalid` styling) could surface "unparseable expression" non-intrusively instead of silent no-op. Guide: `forms` §4 (`:invalid:user-invalid`, `setCustomValidity`). inv-29: the JS evaluator stays as the FLOOR.

---

## (6) html

**Conformant**
- Modal dialogs delegate to the native-semantics glass-ui `<Dialog>` (reka-ui `DismissableLayer` + `FocusScope` → role=dialog, `aria-modal`, focus-trap, Esc, backdrop) — `ExportModal.vue`, `GalleryCardModal.vue`. `html` §4 / `declarative-dialog-popover-control`.
- `<script type="module">` (deferred-by-default), single pre-paint synchronous dark-mode IIFE in `<head>` (correct — must run before first paint) — `index.html:21-32,36`. `html` resource-priority.
- `lang="en"` on `<html>`, `<meta name=description>`, SVG favicon — `index.html:2,7,8`.
- Semantic `<main>` landmark + `<RouterView>` inside it — `App.vue:25-27`.

**Drift**
- **[P1 · M · this-repo] Two native-overlay primitives reimplemented in JS instead of `<dialog>`/`popover`.** (a) `FullscreenViewer.vue:104-145` is a `Teleport`+`Transition`+manual-trap layer that a native `<dialog closedby="any">` (top-layer, `::backdrop`, Esc, inert) replaces. (b) The magnet popover `EditorControlsDock.vue:101-120` and view-options popover `CanvasControlsDock.vue:43` are hand-positioned `<div>`s where the native `popover` attribute + `commandfor`/`command` invoker (or anchor-positioning) applies. Guide: `declarative-dialog-popover-control` / `html` §4. **inv-30: yes** (native top-layer / Invoker Commands replace the JS). **inv-29 (CRITICAL):** Invoker Commands only reached Baseline **2025-12-12** and Popover Baseline 2025-01-27 — a naive rip-out would break older Safari/Firefox; the guide mandates the `commandForElement`/`popover`-in-prototype feature-detect + conditional polyfill, with the current JS as the FLOOR. For the *modal*, prefer reusing the already-present glass-ui `<Dialog>` (no gate needed) over a raw `<dialog>`.

**Opportunity**
- `hidden="until-found"` on the collapsed `CollapsibleSection` body (`CollapsibleSection.vue:45-49`) would make collapsed content findable via browser Find-in-page while still deferred. Guide: `search-hidden-content` / `defer-rendering-heavy-content` §3.

---

## (7) passkeys

**N/A (correctly).** The auth model is a **slug-based magic-token** flow — `register()` mints a `user_slug` + bearer `token` (`auth.ts:43-58`), `login(slug)` re-derives the token (`auth.ts:52`), admin uses a separately-pasted token (`auth.ts:86-98`). There is **no password and no WebAuthn surface** (grep: 0 `navigator.credentials`/`WebAuthn`/`password` field). **Opportunity (P3):** if the slug ever becomes a recoverable identity, `passkey-conditional-create` could silently bind a passkey to the device so a returning user need not re-paste their slug. Strictly future work; flagged, not recommended. Guide: `passkeys`, `passkey-conditional-create`.

---

## (8) performance

**Conformant**
- Self-hosted fonts preloaded, zero third-party render-blocking origins for fonts/CSS — `index.html:12-19`, KaTeX bundler-imported same-origin `main.ts:5`. `performance` Web-Fonts/Third-Party.
- Bundle split by load-cadence via `vite.config.ts:48-62` `manualChunks` (vendor-vue / -ui / -math / -paper / -keyframes) + route-level `() => import()` (`router/index.ts:21-89`). `performance` JS-code-splitting.
- Windowed paper render — `useVirtualSectionWindow` mounts only an overscan window; far-jump teleports behind an overlay (`PaperView.vue` + `PaperArticleWindow.vue`). `defer-rendering-heavy-content`-adjacent.
- `loading="lazy"` on below-fold images — `PaperArticleWindow.vue:67`, `GalleryCard.vue:101`, `GalleryDraftsSection.vue:80`. `performance` image-opt.
- `ResizeObserver`/`IntersectionObserver` used (not scroll-listeners) for layout/visibility — `PaperView.vue:184,208`.
- rAF clock pauses on tab-hide (browser-default) — `animation.ts:43-57`.

**Drift**
- **[P1 · S · this-repo] Zero `content-visibility` anywhere** (grep: 0 in src) — the single biggest unrealized lever. The warm-but-offscreen in-window paper sections (`PaperArticleWindow.vue:46-85` `.paper-window-section`, warm-ahead overscan) are fully laid-out + KaTeX-painted below the fold. `content-visibility: auto` + `contain-intrinsic-size: auto none auto <Npx>` on `.paper-window-section` lets the browser skip their paint/layout. Guide: `defer-rendering-heavy-content`. **inv-30:** no. **inv-29:** Baseline since 2025-09-15; ignored on older engines (FLOOR = current full paint, the JS window still bounds the work) — pair with `contain-intrinsic-size` or off-screen sections collapse to 0px and jump the scrollbar.
- **[P1 · M · this-repo] Off-screen canvas keeps animating at 60fps.** `animation.ts:39-57` rAF + `BasisCanvas.vue` render watcher run whenever `playing`, regardless of scroll-offscreen or being behind the fullscreen layer / on an inactive route. rAF pauses on *tab* hide but **not** on *scroll* off-screen. Wire `contentvisibilityautostatechange` (`event.skipped` → `pause()`/stop rAF) on the canvas container. Guide: `efficient-background-processing`. **inv-30:** no (it's a native-event gate over existing JS). **inv-29:** gate on `'contentVisibility' in documentElement.style`; FLOOR = `IntersectionObserver(rootMargin:200px)` fallback (the guide ships this exact fallback) so Firefox<130/Safari<26 still pause.
- **[P1 · M · this-repo] SPA route views destroyed/recreated on every switch** — `router/index.ts` lazy chunks, no `<KeepAlive>`, no cached inactive view. Returning to `/visualize` re-mounts the whole canvas/contour tree. `content-visibility: hidden` (LRU-bounded — the app has a fixed 5-view set, well within the guide's "3-to-5 tab" safe zone) caches the rendering state. Guide: `faster-spa-view-transitions`. **inv-29:** `@supports not (content-visibility: hidden){ display:none }` FLOOR; the guide mandates the eviction/`display:none` fallback. **inv-30:** no.
- **[P2 · S · this-repo] No `fetchpriority` anywhere** (grep: 0). Low urgency — `/paper` LCP is H1 text, `/visualize` LCP is the canvas (no LCP image) — but the gallery's first featured card / first grid row are LCP candidates inheriting default priority. Guide: `optimize-image-priority`. **inv-30:** no.

**Opportunity**
- `scheduler.yield()` / `requestIdleCallback` to break up the KaTeX typeset burst on far-TOC-jump (the very jump the e2e test `paper:188` de-flaked) — keeps INP responsive during the teleport. Guide: `break-up-long-tasks` / `schedule-tasks-by-priority`.

---

## (9) privacy

**Conformant**
- `Referrer-Policy: strict-origin-when-cross-origin` set on the SPA — `web/public/_headers`. `privacy` (referrer minimization).
- No third-party telemetry/analytics/EventSource (grep: 0). `connect-src 'self' https://api.fourier.babb.dev` only — `_headers`. `privacy` (data minimization / third-party audit).

**Drift**
- **[P2 · S · this-repo] One third-party origin — the GitHub avatar — contradicts the "zero third-party origins" posture and is explicitly allow-listed in CSP.** `AppHeader.vue:71-72` loads `https://avatars.githubusercontent.com/u/2848617?v=4`; the CSP `img-src` had to widen to admit it (`_headers` `img-src … https://avatars.githubusercontent.com`). It is a privacy beacon to GitHub (DNS+TLS+request on every header render) inside the HoverCard. **CORRECTION vs posture audit:** the posture audit called this "zero third-party origins with one avatar exception" — in fact the exception is now *codified into the CSP*, so self-hosting the avatar lets you *also tighten the CSP* (drop the `avatars.githubusercontent.com` token), a privacy+security two-fer. Self-host/proxy the avatar (it is one static maintainer image). Guide: `privacy` (third-party) / `performance` (third-party). **inv-30:** no.

**Opportunity**
- A `Permissions-Policy` response header (e.g. `camera=(), microphone=(), geolocation=(), interest-cohort=()`) is absent from `_headers` — the app uses none of these, so locking them down is free defense-in-depth. Guide: `privacy` (Permissions Policy).

---

## (10) security

**Conformant (strong — under-credited by the posture audit)**
- **Full CSP** ships on the SPA — `web/public/_headers`: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://avatars.githubusercontent.com https://api.fourier.babb.dev; font-src 'self'; connect-src 'self' https://api.fourier.babb.dev; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`. Each directive is rationalized to a verified app resource in-file. `object-src 'none'` + `base-uri 'self'` + `frame-ancestors 'none'` close legacy injection/clickjacking vectors. `security` §CSP.
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (belt-and-braces with `frame-ancestors`) — `_headers`. `security`.
- No `eval`/`new Function`/wasm in the app (CSP deliberately omits `unsafe-eval`) — verified in-file rationale + grep.

**Drift**
- **[P2 · M · this-repo] CSP carries `script-src 'unsafe-inline'` and `style-src 'unsafe-inline'`.** The `script-src` looseness exists for the single pre-paint dark-mode IIFE in `index.html:21-32` — that one script could be replaced by a build-time **hash** (`'sha256-…'`) so `'unsafe-inline'` can be dropped from `script-src` (the file even notes "a per-build hash would drift" — but the IIFE is hand-maintained and *stable*, so a committed hash is viable and strictly safer). `style-src 'unsafe-inline'` is harder to remove (Vue scoped styles + KaTeX inline `style=""`), so that one is a justified residual. Guide: `security` §CSP (prefer nonce/hash over `unsafe-inline`). **inv-30:** no. **inv-29:** n/a (server header).
- **[P3 · S · this-repo] No `Strict-Transport-Security` (HSTS) header in `_headers`.** CF Pages serves HTTPS, but an explicit `Strict-Transport-Security: max-age=…; includeSubDomains` hardens against downgrade. Guide: `security` (transport). (May be set at the CF edge — verify; if so, mark conformant.)

---

## (11) user-experience

**Conformant**
- CSS scroll-snap carousel, no JS engine — `GalleryFeaturedCarousel.vue:67,89` (`scroll-snap-type: x mandatory` + `scroll-snap-align: start`) + `mask-image` fade. `carousel-slide-effects` substrate / `soft-edge-content-fade`.
- Tooltips/HoverCards delegate to the glass-ui primitive with collision padding + side-offset — `Tooltip.vue`, `AppHeader.vue` HoverCard, `TooltipProvider` in `App.vue:22`. `position-aware-tooltips` / `interest-triggered-tooltips`.
- Toaster delegated to the shared primitive — `App.vue:30`, consumed via `useToast` (`composables/useToast.ts`). `persistent-toast-notifications`.
- Containment marquee, reduced-motion-bracketed, hover-pause, transform-only keyframes — `GalleryMarquee.vue:95-123`. `css` §9 performance.
- Flash-free dark mode — pre-paint IIFE `index.html:21-32`; `MutationObserver` re-resolves viz colors on class change `App.vue:9-17`. `dark-mode`.

**Drift**
- **[P1 · M · glass-ui] No View Transitions on navigation** (grep: 0 `view-transition`/`startViewTransition`). Tab switches use a bespoke `@keyframes tab-slide-in` (`style.css:83-90`, `translateX(8px)`) and route changes have no transition. The View Transitions API gives one declarative cross-fade/directional morph across the `<RouterView>` swap, and can share the canvas element across `/w/:slug`↔`/v/:slug` (same `VisualizationView` component) for a morph instead of a remount-flash. Guide: `directional-navigation-transitions` / `same-document-transitions`. **Lands in glass-ui** (a `useViewTransition` / `<RouterTransition>` helper — ≥2 constellation consumers route between SPA views). **inv-30: yes** (native VT replaces the keyframe + the manual remount choreography). **inv-29:** VT is Baseline-newer; gate on `document.startViewTransition` (FLOOR = current keyframe/instant swap) — the existing `tab-slide-in` *is* the floor, keep it.
- **[P2 · M · this-repo] JS IntersectionObserver toggling the mobile floating TOC** is exactly the native scroll-state pattern. `PaperView.vue:207-217` runs an IO over `mobileNavRef` to set `mobileTocVisible`. `@container scroll-state(scrollable: top)` does this in pure CSS. Guide: `scroll-position-aware-elements`. **inv-30: yes** (CSS scroll-state replaces the IO). **inv-29 (CRITICAL):** `container-type: scroll-state` is **Chrome/Edge-only (133+), unsupported in Firefox AND Safari** — so this is a flag-only/keep-the-IO case: the IO is a *legitimate* cross-engine floor, the CSS would be a Chrome-only enhancement layered via `@supports (container-type: scroll-state)`. Do NOT rip out the IO. Mark opportunity-grade.
- **[P2 · S · this-repo] `setTimeout(250)` + `getBoundingClientRect` + `scrollIntoView` to nudge a just-opened accordion into view** — `CollapsibleSection.vue:17-30`. The magic `250` must track the CSS `0.2s` open animation (`:61`); brittle coupling. Replace the hand-timed nudge with a `transitionend`/`animationend` listener, or `scroll-margin` + `scrollIntoView` triggered off the Collapsible's own open event. Guide: `css` §9 / `scroll-target-on-load`. **inv-30:** no.
- **[P3 · S · this-repo] Local `@keyframes tab-slide-in` carry** — `style.css:83-90`, reduced-motion-bracketed (`:92-96`), documented "pending glass-ui's Tabs primitive." Small, a11y-correct carry; subsumed by the View Transitions item above if that lands. **Lands in glass-ui** (ship the panel-enter on `UnderlineTabs`).

**Opportunity**
- Promote the static featured-carousel cards to scroll-driven slide effects (scale/fade on enter/center/exit via `animation-timeline: view()`) — the scroll-snap scaffolding is already present (`GalleryFeaturedCarousel.vue`). Guide: `carousel-slide-effects` / `scroll-entry-exit-effects`. **Lands in glass-ui** (the scroller is a shared-primitive candidate). inv-29: `@supports (animation-timeline: view())`, FLOOR = static cards.
- `scrollbar`/back-to-top `scroll-position-aware-elements` for the long paper scroller (Chrome-gated, IO floor) — see §11 drift #2.

---

## (12) webmcp

**N/A** — no agent-tool surface (grep: 0 `navigator.modelContext`/`webmcp`/`window.mcp`). **Opportunity (P3):** the equation explorer and the epicycle visualizer are exactly the kind of parametric client tools that `agentic-javascript-tools` exposes to an in-browser agent ("compute the Fourier series of f(x) on [a,b]", "trace this contour"). Future-only; flagged, not recommended. Guide: `webmcp`, `agentic-javascript-tools`.

---

## P0 / P1 severity-ranked table

| # | Sev | Finding | Site | Guide id | Lands in | inv30 |
|---|-----|---------|------|----------|----------|-------|
| 1 | **P0** | Form `<label>`s not associated with inputs (no `for`/`id`; FunctionInput Expression/Domain have neither label-assoc nor aria-label) | `FunctionInput.vue:97,114,126`; `MorphPhaseConfig.vue:8,35`; `HarmonicLevelGrid.vue:7,30` | `accessibility` §2 / `forms` §2 | this repo | no |
| 2 | **P1** | Hand-rolled focus-trap does not `inert`/`aria-hidden` the background (AT-escape) → use native `<dialog>` / glass-ui `<Dialog>` | `FullscreenViewer.vue:30-101` | `declarative-dialog-popover-control` / `accessibility` §3 | this repo | **yes** |
| 3 | **P1** | Zero `content-visibility` on warm-offscreen paper window sections | `PaperArticleWindow.vue:46-85` | `defer-rendering-heavy-content` | this repo | no |
| 4 | **P1** | Off-screen canvas animates at 60fps; no `contentvisibilityautostatechange` pause | `animation.ts:39-57` / `BasisCanvas.vue` | `efficient-background-processing` | this repo | no |
| 5 | **P1** | SPA views destroyed/recreated; no `content-visibility:hidden` view cache | `router/index.ts` / `App.vue:25-27` | `faster-spa-view-transitions` | this repo | no |
| 6 | **P1** | No View Transitions on RouterView; bespoke `tab-slide-in` keyframe + remount-flash on `/w/`↔`/v/` | `style.css:83-90` / `App.vue` RouterView | `directional-navigation-transitions` / `same-document-transitions` | **glass-ui** | **yes** |
| 7 | **P1** | Two native overlays reimplemented in JS (fullscreen modal + magnet/view popovers) | `FullscreenViewer.vue:104`; `EditorControlsDock.vue:101`; `CanvasControlsDock.vue:43` | `declarative-dialog-popover-control` / `html` §4 | this repo | **yes** |
| 8 | **P1** | Zero container queries; viewport-`@media` reflow where component-intrinsic is wanted (Configurator stage `:deep()` hack) | `VisualizationView.vue:328`; tree-wide | `css-layout` container-queries / `size-aware-styling` | this repo (+ glass-ui G2) | no |

---

## glass-ui GAPS (adoptions that should land in glass-ui — ≥2 consumers)

1. **`useViewTransition` / `<RouterTransition>` helper.** View Transitions across `<RouterView>` + shared-element morph (`/w/`↔`/v/` same component) is cross-cutting to every constellation SPA that routes between views. Ship a `document.startViewTransition`-gated wrapper (FLOOR = current behavior) so each consumer drops its bespoke tab-slide keyframe. Guides: `directional-navigation-transitions`, `same-document-transitions`. (Replaces this repo's `style.css:83-90` + U2 from the constellation-ui audit.)
2. **Panel-enter animation on `UnderlineTabs`/`BouncyTabs`.** fourier carries `@keyframes tab-slide-in` + `[data-state="active"][role="tabpanel"]` locally (`style.css:79-96`) "pending glass-ui's Tabs primitive shipping this." Ship it (reduced-motion-bracketed) on the primitive; retire the consumer carry. (= constellation-ui Union U2.)
3. **Native-overlay primitives reuse — close the `FullscreenViewer` gap.** glass-ui already ships `<Dialog>` (used in `ExportModal`/`GalleryCardModal`); fourier hand-rolls a *second* full-screen modal because the existing Dialog isn't shaped for an edge-to-edge canvas host. A glass-ui `<FullscreenDialog>`/`size="fullscreen"` variant (inert background, `::backdrop`, Esc, focus-return for free) would let `FullscreenViewer` delete its ~70-line trap. Guide: `declarative-dialog-popover-control`.
4. **Scroll-driven carousel slide effects on the shared carousel/scroller.** The scroll-snap scaffolding (`GalleryFeaturedCarousel.vue`) is a shared-primitive candidate; ship `animation-timeline: view()` enter/center/exit effects gated by `@supports`. Guides: `carousel-slide-effects`, `scroll-entry-exit-effects`.
5. **`.thin-scroller` utility with contrast-adaptive `scrollbar-color`.** Six consumer sites hand-roll `scrollbar-width: thin` (+ `::-webkit-scrollbar`) with no `prefers-contrast` adaptation; a shared utility carries the `scrollbar-color` + high-contrast bracket once. Guide: `adapt-scrollbar-to-contrast-preferences`. (Also closes constellation-ui A1-adjacent literal drift.)
6. **Carried from constellation-ui (design-canon, re-affirmed here):** G1 `Configurator` inline `radius`/`tier` prop; **G2 `Configurator` stage-cell 0px collapse** (ties to the container-query item #8 above — the cleanest fix is `container-type: inline-size` on the stage so it sizes intrinsically); G3 `ConfiguratorLayer` header-actions slot.

---

## Conformance scorecard

| Category | ✓ conformant | ✗ drift | + opportunity | N/A |
|----------|:---:|:---:|:---:|:---:|
| accessibility | 6 | 3 (1 P0) | 1 | |
| built-in-ai | 0 | 0 | 1 | ✓ |
| css | 5 | 2 | 1 | |
| css-layout | 3 | 1 (P1) | 1 | |
| forms | 3 | 3 (1 P0) | 1 | |
| html | 4 | 1 (P1) | 1 | |
| passkeys | 0 | 0 | 1 | ✓ |
| performance | 6 | 4 (3 P1) | 1 | |
| privacy | 2 | 1 | 1 | |
| security | 3 | 2 | 0 | |
| user-experience | 5 | 4 (1 P1) | 2 | |
| webmcp | 0 | 0 | 1 | ✓ |
| **Total** | **37** | **21** | **12** | **3** |

Drift severity mix: **2 P0** (forms-a11y label association — counted once per category it lands in, one underlying defect), **8 P1**, the remainder P2/P3.

---

## Delta vs the prior analysis

**CONFIRMS** (the posture audit was right): the hand-rolled `FullscreenViewer` focus-trap; zero `content-visibility` as the biggest perf lever; the off-screen 60fps canvas; SPA view remount with no cache; no View Transitions; the paper-figure CLS/PNG-only; the un-`srcset`'d gallery thumbs; no `fetchpriority`; the GitHub-avatar third-party origin; the `CollapsibleSection` magic-250 nudge; the IO mobile-TOC as native-scroll-state-adjacent. The constellation-ui glass-ui gaps (G1/G2/G3, U1/U2) re-affirm here.

**EXPANDS** (this audit's new, `file:line`-cited findings beyond the posture pass):
- **A true P0 the posture audit missed:** form `<label>`s are not programmatically associated with inputs (`FunctionInput.vue:97/98`, `MorphPhaseConfig.vue:8`, `HarmonicLevelGrid.vue:7/30`) — and the FunctionInput Expression/Domain fields have *neither* `for/id` *nor* `aria-label`. This is the only genuine WCAG name-missing failure in the tree.
- **Forms category, newly enumerated:** search inputs are `type="text"` not `type="search"`; no `inputmode`/`enterkeyhint` anywhere; the login control has no `<form>`/`autocomplete="username"`.
- **css-layout:** zero container queries — and this is the *native* fix for the Configurator stage-collapse `:deep()` hack the constellation-ui audit booked as G2 (corrects the framing: G2 is best solved with `container-type: inline-size`, not just a flex prop).
- **css:** zero logical properties; `scrollbar-width:thin` with no contrast-adaptive `scrollbar-color`; `text-wrap: balance/pretty` unadopted.
- **html:** the magnet/view-options popovers (`EditorControlsDock.vue:101`, `CanvasControlsDock.vue:43`) are a *second* class of native-overlay reimplementation the posture audit didn't separate from the fullscreen modal.
- **a11y:** `aria-expanded` absent on bespoke disclosure/popover triggers.

**CORRECTS** the posture audit on two points:
1. **Security/CSP was under-credited.** A full, tightly-rationalized CSP + `nosniff` + `X-Frame-Options` + `frame-ancestors 'none'` + `object-src 'none'` ships at `web/public/_headers` (tranche H.γ). The posture audit's "zero third-party origins" framing missed that the avatar exception is now *codified into `img-src`* — so self-hosting the avatar is a privacy **and** CSP-tightening win, and the residual CSP drift is the `script-src 'unsafe-inline'` for the one dark-mode IIFE (hashable) — a more precise finding than "self-host the avatar" alone.
2. **The mobile-TOC IO and the magnet popovers are NOT clean rip-out candidates.** Their native replacements (`container-type: scroll-state`; Invoker Commands) are Chrome-only / very-recently-Baseline, so under **inv-29** the existing JS/IO is the correct cross-engine FLOOR and the native path is an `@supports`-gated enhancement — the posture audit's "JS measuring what CSS now does" framing needs this inv-29 guardrail to avoid a Safari/Firefox regression.
