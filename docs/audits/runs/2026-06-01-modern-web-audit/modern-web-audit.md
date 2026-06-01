# Modern-Web CONFORMANCE Audit — CONSOLIDATED (constellation MERGE)

**Run:** `2026-06-01-modern-web-audit` · **Date:** 2026-06-01 · **Mode:** MERGE (read-only across the 6 per-repo audits; the only artifact written is this file).
**Lens:** Chrome **modern-web-guidance v0.0.170** (on-disk corpus `/tmp/mwg/package/skills/modern-web-guidance/guides`, 12 categories).
**Invariant frame:** **inv-29 progressive-enhancement-floor** (every modern-API rec ships behind `@supports`/feature-gate with the prior path retained as the Safari/Firefox FLOOR — no rip-out) · **inv-30 platform-over-library** (flag every site a native platform capability should REPLACE a JS/library reimplementation).

---

## (1) Preamble

### Scope

Six constellation frontends, each audited Style-Audit-grade (per-category, `file:line`-cited, severity-ranked P0–P3, effort S/M/L, lands-in this-repo|glass-ui, inv-30 flag per drift row):

| Repo | Frontend | Stack | glass-ui ver | Source audit |
|---|---|---|---|---|
| **fourier** | `web/` (fourier.babb.dev) | Vue 3.5 + Vite 7 + Tailwind v4 + Canvas-2D epicycles + KaTeX | `^2.0.0` | `fourier.md` |
| **value.js** | `demo/` (color.babb.dev) | Vue 3.5 + Vite + Tailwind v4 + reka-ui + WebGL2 aurora/metaball | **v3.0.0** | `value.js.md` |
| **glass-ui** | `src/` + `demo/` (the SHARED design system) | Vue 3.5 + reka-ui 2.0 (`@floating-ui`) + Tailwind v4 + `linear()` springs | **self, v3.0.0** | `glass-ui.md` |
| **keyframes.js** | `src/animation/` core + `demo/` (keyframes.babb.dev) | TS ESM engine + Vue 3.5 demo | `3.0.0` devDep | `keyframes.md` |
| **words** | `frontend/` (floridify) | Vue 3.5 + Pinia 3 + Clerk auth + SCSS | `^2.0.0` | `words.md` |
| **speedtest** | `src/` (speedtest.friday.institute) | Vue 3.5 + Vite 8 + ECharts/maplibre + PWA + Workers edge | v2.1.0 | `speedtest.md` |

### The inv-29 / inv-30 lens

Both invariants are load-bearing in the merge. **inv-30** is the dominant axis — the single largest cross-repo theme (overlay positioning + native top-layer) is a platform-replaces-library deletion that lands ONCE in glass-ui and propagates to all consumers. **inv-29** is the guardrail: every native adoption named below that is Chrome-only or newly-Baseline (anchor positioning, `base-select`, `container-type: scroll-state`, View Transitions, Invoker Commands) ships behind `@supports` with the existing JS/reka path retained as the cross-engine FLOOR. Three repos (value.js, speedtest, glass-ui-demo) carry **zero `@supports` gates today** — fine while they adopt no engine-forked API, but it means every recommendation must author its own gate.

### Relationship to prior work

This audit is the rigorous, `file:line`, severity-ranked successor to two prior passes, both of which it **CONFIRMS on every headline** and **EXPANDS** with new findings:
- the **posture analysis** (`docs/audits/runs/2026-06-01-modern-web/*.md`, top-N scan);
- the **constellation-ui style-audit** (`docs/audits/runs/2026-06-01-constellation-ui/style-audit.md`, the glass-ui design-canon source).

It is also the conformance input that **validates the tranche-I plan** (`docs/audits/runs/2026-06-01-modern-web/modern-web-tranche-plan.md`, the 9 waves α–ι, fourier-I, W0–W9). Section (6) below answers: does this rigorous audit confirm those waves?

---

## (2) CONFORMANCE SCORECARD MATRIX

At-a-glance constellation health. Rows = the 12 guide categories. Columns = the 6 repos. Cell = **`✓N`** conformant count · **`✗N`** drift count (P0/P1 count in parens) · **`+N`** opportunity count. `N/A` = category does not apply (correctly out of scope).

| Category | fourier | value.js | glass-ui | keyframes | words | speedtest |
|---|---|---|---|---|---|---|
| **accessibility** | ✓6 ✗3(P0) +1 | ✓4 ✗3 +1 | ✓3 ✗1 +1 | ✓4 ✗4(P1) +1 | ✓5 ✗4(P1) +1 | ✓7 ✗3 +1 |
| **built-in-ai** | N/A +1 | N/A | N/A | N/A | N/A +1 | N/A |
| **css** | ✓5 ✗2 +1 | ✓5 ✗4(P1) +1 | ✓5 ✗2(P1) +1 | ✓4 ✗2 +1 | ✓4 ✗4 +1 | ✓4 ✗0 +1 |
| **css-layout** | ✓3 ✗1(P1) +1 | ✓2 ✗0 +1 | ✓2 ✗2(P1) +1 | ✓4 ✗1(P1) +0 | ✓2 ✗3(P1) +0 | ✓2 ✗0 +1 |
| **forms** | ✓3 ✗3(P0) +1 | ✓3 ✗3(P1) +1 | ✓1 ✗2(P1) +1 | ✓2 ✗2 +0 | ✓1 ✗3 +1 | ✓5 ✗4(P1×3) +1 |
| **html** | ✓4 ✗1(P1) +1 | ✓3 ✗2 +0 | ✓2 ✗1 +1 | ✓4 ✗3(P1) +1 | ✓3 ✗3(P1) +0 | ✓4 ✗1 +1 |
| **passkeys** | N/A +1 | N/A | N/A | N/A | N/A | N/A |
| **performance** | ✓6 ✗4(P1×3) +1 | ✓5 ✗3(P1) +1 | ✓3 ✗3(P1×2) +1 | ✓6 ✗3(P1) +3 | ✓2 ✗5(P1×3) +1 | ✓7 ✗4(P1) +3 |
| **privacy** | ✓2 ✗1 +1 | ✓2 ✗1 +0 | N/A | ✓2 ✗1 +0 | ✓1 ✗2 +1 | ✓3 ✗0 +3 |
| **security** | ✓3 ✗2 +0 | ✓2 ✗2(P1) +0 | N/A | ✓3 ✗3(P1) +1 | ✓3 ✗2 +1 | ✓3 ✗1(P1) +2 |
| **user-experience** | ✓5 ✗4(P1) +2 | ✓4 ✗5(P1×2) +3 | ✓5 ✗5(P1×2) +3 | ✓4 ✗3(P1) +2 | ✓3 ✗5(P1) +2 | ✓4 ✗3 +1 |
| **webmcp** | N/A +1 | N/A | N/A | N/A | N/A +1 | N/A |
| **TOTALS** | ✓37 ✗21 +12 (3 N/A) | ✓30 ✗23 +8 (3 N/A) | ✓21 ✗16 +9 (5 N/A) | ✓33 ✗22 +9 (3 N/A) | ✓24 ✗31 +10 (2 N/A) | ✓39 ✗16 +14 (3 N/A) |

### Scorecard headline (constellation-wide)

**Strongest categories** (high conformant, low/zero drift everywhere): **css** (every repo strong — `color-mix`/`linear()`-springs/oklch/`:has()`/`dvh`/layers are universal; speedtest and fourier carry zero/near-zero CSS drift), **css-layout** (container queries genuinely adopted at the leaders — speedtest meter, glass-ui 22 sites, keyframes; speedtest is a model surface with 0 drift), and **privacy** (clean across the board — no third-party trackers; the only recurring leak is Google-Fonts on value.js/keyframes). **built-in-ai / passkeys / webmcp** are correctly N/A everywhere (no AI/credential/agent surfaces).

**Weakest categories** (drift dense and repeated across repos): **forms** (the least-adopted category constellation-wide — no `<form>` element in words/speedtest/value.js-login, `type="text"` everywhere, zero `inputmode`/`enterkeyhint`/`autocomplete`, JS comboboxes vs `base-select`, zero `:user-valid`); **user-experience** (the largest drift surface in 4 of 6 repos — the overlay-library + scroll-listener + View-Transitions + transform-discipline cluster); and **performance** (zero `content-visibility` in 5 of 6 repos, off-screen canvas/WebGL not paused on the render-lifecycle event, JS image-lazy-loaders, missing `fetchpriority`). **accessibility** is mid-pack but carries the only two true **P0**s (fourier orphaned form labels) and recurring landmark/skip-link gaps (keyframes, words have landmark-less DOMs).

---

## (3) Findings RE-GROUPED by severity, then category, across all repos

Severity-first (P0 → P1 → high-value P2). Each row: severity · category · repo · `file:line` · guide id · fix · effort · lands-in · inv30.

### P0 — true conformance failures

| Sev | Cat | Repo | Site (`file:line`) | Guide id | Fix | Eff | Lands-in | inv30 |
|---|---|---|---|---|---|---|---|---|
| **P0** | a11y/forms | fourier | `FunctionInput.vue:97,114,126`; `MorphPhaseConfig.vue:8,35`; `HarmonicLevelGrid.vue:7,30` | `accessibility`§2 / `forms`§2 | Associate `<label>`↔input via `for`/`id` (or wrap, as `SliderControl.vue:66` does). FunctionInput Expression/Domain have NEITHER label-assoc NOR `aria-label` — the only genuine WCAG name-missing fail in the constellation | S | this repo | no |

*(This is the single P0 across all six audits — one underlying defect, booked under both `accessibility` and `forms`. No other repo surfaced a hard a11y/broken-functionality failure.)*

### P1 — high-value (grouped by category)

**accessibility (landmarks / zoom / focus)**

| Sev | Repo | Site | Guide id | Fix | Eff | Lands-in | inv30 |
|---|---|---|---|---|---|---|---|
| P1 | keyframes | `EditorShell.vue:2`, `TopDock.vue`, all `demo/**` (grep `<main\|<nav\|<header` = **0**) | `accessibility`§1 / `html`§1 | Wrap regions in `<header>`/`<nav>`/`<main>`; landmark-less DOM | S | this repo | no |
| P1 | words | `App.vue:3-13`, `Home.vue:6-24` (no `<main>`, no skip link) | `accessibility`§1 | `<main id="content" tabindex="-1">` + visually-hidden skip link | S | this repo | no |
| P1 | words | `index.html:16` (`user-scalable=no`) | `html`§1 / `accessibility`§9 | Remove zoom-disable (WCAG 1.4.4 fail; speedtest already fixed this — `index.html:22-25`) | S | this repo | no |

**css-layout (container queries / aspect-ratio)**

| Sev | Repo | Site | Guide id | Fix | Eff | Lands-in | inv30 |
|---|---|---|---|---|---|---|---|
| P1 | fourier | `VisualizationView.vue:328` `:deep()` stage hack; tree-wide (grep `@container` = 0) | `css-layout` container-queries | `container-type: inline-size` on the Configurator stage — the NATIVE fix for the style-audit G2 collapse | M | this repo (+glass-ui G2) | no |
| P1 | words | all 9 `<img>` (grep `aspect-ratio` = 0) | `css-layout`§1.2 | `aspect-ratio` to reserve media space (CLS) | S | this repo | no |
| P1 | words | `useInlineWordLookup.ts:108-116` (grep `anchor-name` = 0) | `css-layout`§5 | CSS anchor positioning for the tooltip tether (see UX overlay cluster) | M | glass-ui | **yes** |

**forms (the densest P1 cluster — speedtest + value.js + glass-ui)**

| Sev | Repo | Site | Guide id | Fix | Eff | Lands-in | inv30 |
|---|---|---|---|---|---|---|---|
| P1 | speedtest | `SurveyWizard.vue`, `AdminLoginView.vue:63-75` (grep `<form` = 0) | `forms`§1/§7 | Wrap survey/login in `<form @submit.prevent>` + real `type=submit` | M | this repo | no |
| P1 | speedtest | `SurveyField.vue:27` (binds literal `"text"`) | `forms`§3 | `:type="field.type"` — email/tel never get native type/keyboard | S | this repo | no |
| P1 | speedtest | `SurveyField.vue:24-43` (grep `inputmode`/`enterkeyhint` = 0) | `forms`§2/§3/§11 | Thread `autocomplete`/`name`/`inputmode`/`enterkeyhint` to primitives | M | this repo | no |
| P1 | value.js | `AdminAuthGate.vue:7-12` | `autofill-sign-in-form` | Sign-in field missing MANDATORY `autocomplete=current-password`/`id`/`name`/`required` | S | this repo | no |
| P1 | value.js | `ColorSpaceSelector.vue:1-39` + 5 more reka `<Select>` | `branded-select-styling` | `appearance: base-select` + `::picker(select)` (PE; reka floor) | M×n | **glass-ui** | **yes** |
| P1 | value.js | `AdminAuthGate.vue:6-21`, `AdminTagsPanel.vue:19,25` | `accessible-error-announcement` | `:user-invalid`↔`aria-invalid` sync | M | this repo | no |
| P1 | glass-ui | `ui/{input,textarea,number-field}/` (grep `:user-valid` = 0) | `validate-input-after-interaction` | Native `:user-valid`/`:user-invalid` (Baseline — direct adopt) | S | glass-ui | **yes** |

**html (native overlays — the inv-30 keystone surfaces)**

| Sev | Repo | Site | Guide id | Fix | Eff | Lands-in | inv30 |
|---|---|---|---|---|---|---|---|
| P1 | fourier | `FullscreenViewer.vue:104`; `EditorControlsDock.vue:101`; `CanvasControlsDock.vue:43` | `declarative-dialog-popover-control` / `html`§4 | Two JS-reimplemented native overlays → `<dialog>`/glass-ui `<Dialog>` + popover/Invoker (gate Invoker — Baseline 2025-12-12) | M | this repo | **yes** |
| P1 | keyframes | `KeyboardShortcutsModal.vue:2`, `SharePopover.vue:2`, `App.vue:17` | `light-dismiss-a-dialog` / `html`§4 | reka-ui overlays → native `<dialog>`+popover (reka = `@supports`-false floor) | M | **glass-ui** | **yes** |
| P1 | words | `WordDetailModal.vue:190,195` (hand-restores scrollY) | `html`§4/§6 | Rely on dialog top-layer + `inert` background | S | this repo | no |

**performance (content-visibility / off-screen work / scroll / images)**

| Sev | Repo | Site | Guide id | Fix | Eff | Lands-in | inv30 |
|---|---|---|---|---|---|---|---|
| P1 | fourier | `PaperArticleWindow.vue:46-85` (grep `content-visibility` = 0) | `defer-rendering-heavy-content` | `content-visibility: auto` + `contain-intrinsic-size` on warm-offscreen paper sections — **the single biggest unrealized lever** | S | this repo | no |
| P1 | fourier | `animation.ts:39-57` / `BasisCanvas.vue` | `efficient-background-processing` | Pause off-screen 60fps canvas on `contentvisibilityautostatechange` (IO floor) | M | this repo | no |
| P1 | fourier | `router/index.ts` / `App.vue:25-27` | `faster-spa-view-transitions` | `content-visibility: hidden` view cache (no `<KeepAlive>` today) | M | this repo | no |
| P1 | speedtest | `AdminSessionsTable.vue:119-178`, `ChartsView.vue:47-96` | `defer-rendering-heavy-content` / `interactions-in-complex-layouts` | `content-visibility: auto` on admin rows + chart cards — INP-under-load is the product's defining axis | S | this repo | no |
| P1 | glass-ui | `demo/stories/**` + `StorySection.vue` (15.7k LOC, grep = 0) | `defer-rendering-heavy-content` | `.deferred-section` utility (lands once, used in demo + every consumer) | S | glass-ui | no |
| P1 | glass-ui | `useScrollProgress.ts:35-67` (JS rAF scroll listener) | `scroll-progress-indicator` | CSS `view()`/`scroll()` recipe (repo already proved it in `CardHeader`); keep composable as FF/Safari floor | M | glass-ui | **yes** |
| P1 | words | `Home.vue:174-188`, `scroll.ts:101-149` (per-frame `useScroll`) | `shrinking-header-on-scroll` | `animation-timeline: scroll()` — **also fixes a live a11y regression** (JS transforms have NO reduced-motion gate) | M | this repo | **yes** |
| P1 | words | `CarouselSlide.vue:54,75,106`, `ImageCarousel.vue:126` (JS lazy-loader, 0 `loading`/`width`) | `optimize-image-priority` | Native `loading=lazy`+`width`/`height`+`decoding`; delete the JS state machine | S | this repo | **yes** |
| P1 | value.js | `index.html:12-19` (Google Fonts on critical path) | `performance` / `optimize-preload-priority` | Self-host fonts (mirror fourier G: 3→0 LCP origins) | S | this repo | no |
| P1 | value.js | `style.css:28-30` (grep `font-size-adjust` = 0) | `visually-stable-font-fallbacks` | `font-size-adjust: from-font` to kill font-swap CLS | S | this repo | no |

**css / user-experience (transform discipline — the foundation prerequisite)**

| Sev | Repo | Site | Guide id | Fix | Eff | Lands-in | inv30 |
|---|---|---|---|---|---|---|---|
| P1 | glass-ui | `dock.css:311,676,680,708,824,967,972`; `utilities.css:466-481,548,812,816`; `cards.css:41` (**52 sites**) | `individual-transform-properties` | Add `scale:1`/`translate:0` base identity + migrate state rules to individual props. **Baseline — safe rip-forward, no gate.** Hard prerequisite for anchor positioning | S | glass-ui | **yes** |
| P1 | keyframes | `morph.ts:89,107`; `useSquareAnimations.ts:21` | `individual-transform-properties` | `ElementMorph` writes a COMBINED `transform` string — clobbers concurrent transforms, breaking the composition promise. Emit `el.style.translate`/`.scale` | S | this repo | **yes** |
| P1 | value.js | `GradientCodeEditor.vue:138`, `MixResultDisplay.vue:31` (3 sites) | `css`§tokens / `accessibility` | Dead glass-tier classes (`.glass-subtle`/`.glass-elevated` don't exist in v3.0.0) → no surface AND no a11y fallback. Adopt `.glass-quiet`/`.glass-floating` | S | glass-ui | no |

**user-experience (overlay-library + View-Transitions cluster — the dominant inv-30 surface)**

| Sev | Repo | Site | Guide id | Fix | Eff | Lands-in | inv30 |
|---|---|---|---|---|---|---|---|
| P1 | glass-ui | `dialog/DialogContent.vue:5-11` + all `ui/{tooltip,popover,dropdown-menu,hover-card,select,combobox,context-menu}/` (grep `anchor-name` = 0) | `resilient-context-menus-and-nested-dropdowns` / `position-aware-tooltips` | `@floating-ui/dom` JS positioning for ALL overlays → CSS anchor positioning (`@supports (anchor-name)`, reka floor). Largest ceiling + blast radius | L | glass-ui | **yes** |
| P1 | glass-ui | `transitions.css:43-94` (grep `@starting-style`/`allow-discrete` = 0) | `animate-to-from-top-layer` | Top-layer enter/exit via Vue `<Transition>` classes → `@starting-style` + `transition-behavior: allow-discrete` (from `--spring-*` tokens) | M | glass-ui | **yes** |
| P1 | value.js | `useHoverPopover.ts:20-35` (JS `getBoundingClientRect` → reactive top/left) | `interest-triggered-tooltips` / `position-aware-tooltips` | Bespoke anchored tooltip → `popover="hint"`+`interestfor`+anchor positioning | M | glass-ui | **yes** |
| P1 | value.js | `useDialogOverlayGuards.ts:13-45` | `declarative-dialog-popover-control` | Teleport-guard outside-click workaround — a bug-class the native top-layer DELETES (a popover inside a dialog is no longer "outside" it) | L | glass-ui | **yes** |
| P1 | words | `useInlineWordLookup.ts:40,108,150` (selection→pill→popover, doc listeners + getBoundingClientRect + 200ms timer) | `interest-triggered-tooltips` / `position-aware-tooltips` | Popover API (`popover="hint"`+`interestfor`) + anchor positioning + free `aria-describedby` | M | glass-ui | **yes** |
| P1 | fourier | `style.css:83-90` (`tab-slide-in`) / `App.vue` RouterView (grep `view-transition` = 0) | `directional-navigation-transitions` / `same-document-transitions` | View Transitions across `<RouterView>` + shared-element morph `/w/`↔`/v/` (gate; keyframe = floor) | M | **glass-ui** | **yes** |

### High-value P2 (recurring across repos — abbreviated)

| Cat | Repos (sites) | Guide id | Fix | inv30 |
|---|---|---|---|---|
| security | value.js (`index.html` no `_headers`), keyframes (`public/` absent), speedtest (`_headers:39-42` missing HSTS+Permissions-Policy) | `security`§1.1/§1.4/§3 | Ship/extend CSP `_headers` (mirror fourier H.γ) — speedtest is P1 (uses geolocation) | no |
| security | keyframes (`AssetViewport.vue:153-156`) | `security`§1.2 | `sanitizeSVG` is a `<script>`-only regex strip — XSS gap on uploaded SVG (render via `<img src=blob:>` or Sanitizer API) | partial |
| html/a11y | speedtest (`AppSettingsButton.vue:5`), words (~10 `title=` tooltips: `SidebarLookupView.vue:11,28,41,64,80`+5) | `html`§5 / `accessibility`§3 | `title` as tooltip is the anti-pattern — use `aria-label` + IconTooltip | no |
| performance | speedtest (`ChartsView.vue:47`), value.js (`App.vue:236-241` ghost-pane) | `faster-spa-view-transitions` | `content-visibility: hidden` to cache inactive tab/pane (not `v-if` rebuild / `visibility:hidden`) | no |
| performance | speedtest (`useFunnelAbandon.ts:60,93`, `client.ts:149,154`) | `batch-analytics-events` | Exit beacons use plain `fetch` (no `keepalive`/`fetchLater`) — can drop | no |
| performance | words (`useVirtualSectionWindow.ts`), fourier (`scheduler.yield` opp) | `defer-rendering-heavy-content` | Bespoke virtualizer; `@tanstack/vue-virtual` installed-unused; `content-visibility` absent | **yes** |
| css | fourier (6 sites), value.js (18 panes), glass-ui (7 partial-glass), words (`index.css:156-208`) | `adapt-scrollbar-to-contrast-preferences` / `css`§5 | `scrollbar-color` + forced-colors/reduced-transparency brackets on hand-rolled glass | no |
| accessibility | fourier (grep `aria-expanded` = 0 on bespoke popovers), words (`outline-none` no focus-visible ×3) | `forms`§7 / `accessibility`§5 | Expose disclosure state; pair focus-visible ring | no |
| user-experience | value.js (`useHoverPopover` View-Transitions opp), keyframes (`App.vue:113` scene swaps), speedtest (`useCompletionChoreography.ts:254-308` FLIP + `useRouteTransition.ts:141-201`) | `same-document-transitions` | Vue `<Transition>`/hand-rolled FLIP → `startViewTransition` (speedtest #13+#14 collapse to ONE adoption) | **yes** |

---

## (4) glass-ui GAPS — DEDUPLICATED with summed cross-repo demand

The cross-consumer lever: any adoption that lands in `glass-ui/src` propagates to all consumers at once. Below, the modern-web glass-ui gaps from all six audits, deduplicated, ranked by summed cross-repo call-site demand, with the **style-audit cross-reference** noting where the two audits name the same gap.

| Rank | Gap | Apps citing (modern-web) | Summed demand | Style-audit cross-ref | inv30 |
|---|---|---|---|---|---|
| **1** | **Native top-layer overlay substrate** — popover API + CSS anchor positioning + `<dialog>` top-layer. Replaces `@floating-ui` JS positioning for tooltip/popover/dropdown/hover-card/context-menu/select; deletes per-consumer hand-rolled popovers (value.js `useHoverPopover`+`useDialogOverlayGuards`, words `useInlineWordLookup`, speedtest `MapTooltip`, fourier `FullscreenViewer`/dock popovers) | glass-ui(all overlays), value.js(O1+D-ux-1/2), words(GU-1), speedtest(GA, ≥9 sites), keyframes(gap1/2), fourier(#7) | **≥9 in speedtest alone + every consumer's every overlay** — the single highest blast-radius item, named independently by 4 of 6 reports as "single highest-leverage" | NOT in style-audit (style-audit is a design-canon lens, not platform) — this is a modern-web-only gap | **yes** |
| **2** | **Transform-identity base + `.hover-scale`/`.active-scale` + individual transform props** — add `scale:1`/`translate:0` base identity (52-site glass-ui violation), mint `.hover-scale` companion to `.active-scale`, standardize `--scale-press-btn`(0.97)/`--scale-press`(0.96), mint `.hover-cartoon` (reinvented 9×) | glass-ui(CSS-1/UX-1, 52 sites + 9 cartoon), value.js(D-ux-5, 29 sites + G-5) | **~69 sites across 5 apps** (the largest demand) | **SAME GAP** — style-audit gap-#3 (`.hover-scale`, ~69) + gap-#8 (`.hover-cartoon`, 9) + union U-press-scale. The two audits CONVERGE here: one motion-layer rewrite satisfies both `individual-transform-properties` AND the largest style-audit demand AND unblocks gap #1 | **yes** |
| **3** | **content-visibility / defer-rendering utility** — `.deferred-section` (`content-visibility: auto` + `contain-intrinsic-size`) lands once, applied per-repo; pause Aurora WebGL on `contentvisibilityautostatechange` (refines the IO arm) | glass-ui(PERF-1/PERF-2, 15.7k LOC demo), fourier(#3/#4), speedtest(#9), words(GU-4), value.js(D-perf-2) | **#1-ranked in 3 of 6 reports**; near-zero risk, one utility class | NOT a style-audit gap (perf lens) — modern-web-only | no (auto degrades) |
| **4** | **View-Transitions helper + `view-transition-name` token contract** — `useViewTransition`/`<RouterTransition>` gated on `document.startViewTransition`; retires speedtest's two FLIP engines, keyframes `ElementMorph` (DOM case), fourier `/w/`↔`/v/` remount-flash, all bespoke `<Transition mode=out-in>` direction machines | glass-ui(opp), fourier(#6+GU-1), speedtest(GB), keyframes(UX-3), words(view-transitions), value.js(O-ux-3) | **named by every report**; speedtest = large net code deletion (retires 2 state machines) | **SAME GAP** as style-audit union **U-tab-panel** (tab-panel entry animation carried locally in fourier/value.js/words) — the panel-enter half lands with the VT helper | **yes** (native VT replaces ElementMorph) |
| **5** | **`@starting-style` + `transition-behavior: allow-discrete` top-layer enter/exit** — decouples overlay motion from Vue `<Transition>` classes, sourced from `--spring-*` `linear()` tokens, survives reka's portal | glass-ui(UX-2), keyframes(O6/gap3) | 2 apps + every overlay consumer | NOT a style-audit gap (motion-platform lens) | **yes** |
| **6** | **CSS scroll-driven recipe for `useScrollProgress`** — `view()`/`scroll()` recipe (mirror proven `CardHeader`), keep composable as `@supports`-false floor; retires JS scroll-listeners (words header-shrink, keyframes `useScrollFade`/`ScrollTimeline`, fourier IO-floating-TOC) | glass-ui(PERF-3/UX-3), words(GU-2), keyframes(PERF-2/3), fourier(#11-adjacent) | 4 apps' scroll mechanics | NOT a style-audit gap (perf lens) | **yes** |
| **7** | **Native `<select>` wrapper (`appearance: base-select`) + `:user-valid`/`field-sizing` form primitives** | value.js(G-2, 5 comboboxes), glass-ui(FORMS-1/2), words(forms) | value.js 5 + every consumer's selects/inputs | partial (style-audit touches Tabs variants, not selects) | **yes** |
| **8** | **Partial-glass a11y bracket + dead-tier shim + glass-bar tier + contrast-scrollbar** — `.glass-track`/shared `@supports`+PRT+PRC bracket for hand-composed `--glass-blur-*` sub-elements; `.glass-bar` header tier; dead-tier deprecation shim | glass-ui(A11Y-1, 7 sites), value.js(D-css-3/4, G-4), words(GU-5), fourier(#5 scrollbar) | **~18 partial-glass + ~16 dead-tier across 4 apps** | **SAME GAP** — style-audit gap-#1 (dead-tier, ~16) + gap-#2 (partial-glass `.glass-track`, ~18) + gap-#5 (inline-pill) | no (a11y-resilience) |

**Cross-audit convergence note (the key finding for tranche planning):** the two audits **name the same gap at three seams** — (a) gap #2 here = style-audit gap-#3/#8/U-press-scale (transform/scale, ~69 sites); (b) gap #4 here = style-audit U-tab-panel (panel-enter); (c) gap #8 here = style-audit gap-#1/#2/#5 (dead-tier + partial-glass + inline-pill). Gaps #1, #3, #5, #6, #7 are **modern-web-only** (platform/perf lenses the design-canon style-audit does not cover). The convergence at gap #2 is the planning keystone: it is the largest demand in BOTH audits AND a hard prerequisite for the overlay keystone (gap #1) — combined `transform` hover shifts the containing block and breaks `anchor()`.

---

## (5) inv-30 platform-over-library ledger

Every native-replaces-library finding across the constellation. The deletions, with the **residual-differentiator** note where the library survives narrowed (not deprecated).

| # | Native capability | Replaces (library/JS) | Repos · sites | Lands-in | Residual differentiator (what survives) |
|---|---|---|---|---|---|
| 1 | **CSS anchor positioning** (`anchor-name`/`position-area`/`position-try`) + **popover API** + **`<dialog>` top-layer** | `@floating-ui/dom` `computePosition` (via reka-ui); per-consumer hand-rolled positioners | glass-ui (all overlays); value.js `useHoverPopover.ts:20-35`; words `useInlineWordLookup.ts:108-116`; speedtest `MapTooltip.vue:2-58`; keyframes `SharePopover.vue:14`; fourier `EditorControlsDock.vue:101` | **glass-ui** | reka-ui SEMANTICS (roles/ARIA/keyboard/focus-scope) are KEPT and inherited; only the POSITIONING ENGINE + non-native top-layer are replaced. reka = `@supports (anchor-name)`-false FLOOR for Safari/Firefox — never ripped out |
| 2 | **Native top-layer** (`<dialog>.showModal()` inert-background) | hand-rolled focus-trap + outside-click guards | fourier `FullscreenViewer.vue:30-101`; value.js `useDialogOverlayGuards.ts:13-45`; keyframes reka focus-trap | glass-ui + fourier | The `useDialogOverlayGuards` bug-class DELETES entirely (a popover inside a dialog is no longer "outside" it) — pure win, no residual |
| 3 | **Individual transform properties** (`scale:`/`translate:` + base identity) | combined `transform: scale()/translate()` shorthand | glass-ui (52 sites: `dock.css`/`utilities.css`/`cards.css`); keyframes `morph.ts:89,107`; value.js (29 `hover:scale-*`) | glass-ui + keyframes | Baseline 2022 — full rip-forward, NO gate. keyframes `ElementMorph` keeps its `MorphRect` non-DOM overload |
| 4 | **View Transitions** (`document.startViewTransition` + `view-transition-name`) | hand-rolled FLIP engines + Vue `<Transition>` direction-machines | speedtest `useCompletionChoreography.ts:254-308` + `useRouteTransition.ts:141-201`; keyframes `ElementMorph` (DOM case) + `App.vue:113` scene swaps; fourier `/w/`↔`/v/` remount + `tab-slide-in`; words/value.js route/pane swaps | glass-ui + all | keyframes `ElementMorph` keeps the **offscreen/non-DOM rect** case (`MorphRect`, native VT can't see arbitrary rects); Vue `<Transition>` = floor when `startViewTransition` absent |
| 5 | **CSS scroll-driven animation** (`animation-timeline: scroll()/view()`) | JS `addEventListener('scroll')` + rAF + `getBoundingClientRect` | glass-ui `useScrollProgress.ts:35-67`; words `Home.vue:174-188`/`scroll.ts`; keyframes `timeline.ts:154-171` (`ScrollTimeline`) + `useScrollFade.ts:104`; fourier IO-floating-TOC `PaperView.vue:207-217` | glass-ui + words + keyframes + fourier | keyframes `ScrollTimeline` keeps **off-DOM/non-element data** scroll-progress + injectable `getScrollY` + `SmoothProgress`; fourier mobile-TOC IO is a LEGITIMATE cross-engine floor (`container-type: scroll-state` is Chrome-only) |
| 6 | **Customizable native `<select>`** (`appearance: base-select` + `::picker(select)` + `<selectedcontent>`) | reka-ui JS comboboxes | value.js 6 sites (`ColorSpaceSelector.vue:1-39` + 4); every glass-ui consumer's selects | glass-ui + value.js | reka `<Select>` = `@supports (appearance: base-select)`-false FLOOR (Chrome-135-only today) — PE layer, NOT a rip-out |
| 7 | **Native `loading=lazy`/`decoding`/intrinsic dims** | JS image-lazy-load state machines (hidden proxy `<img>`) | words `CarouselSlide.vue:44-114` + `ImageCarousel.vue:126-205` | this-repo (per leaf) | Embla loop/free-drag is a legit residual; native covers the common scroll-snap case |
| 8 | **`field-sizing: content` / `:has()` / `interpolate-size`** | JS textarea-autosize (`resizeTextarea`); JS class-bookkeeping; JS max-height accordion | words `SearchInput.vue:80-105`; glass-ui `Textarea.vue:24`; words `useInlineWordLookup.ts:66` | glass-ui + this-repo | `field-sizing` Chrome-only → gated; `:has()` Baseline → direct |

**Ledger summary:** the inv-30 surface is dominated by ledger items **1–5** — and items 1, 2, 3 are all the SAME glass-ui motion/overlay seam (transform discipline unblocks anchor positioning unblocks top-layer-delete). The constellation's largest modern-web debt is a single glass-ui-rooted rewrite that fans out to every consumer. Every replacement is **additive/narrowing** (keep the library's true differentiator), **never a blind rip-out** — inv-29 floors are attached to every Chrome-only/newly-Baseline item.

---

## tranche-I plan validation

**Verdict: the tranche-I plan (fourier-I, 9 waves α–ι, W0–W9) is CONFIRMED. This rigorous audit validates the wave roster, the leverage-driven sequencing, the W-mapping, and the highest-ROI first move. No new wave is required; two waves EXPAND in scope and one re-rank is warranted.**

### Waves CONFIRMED (1:1 with this audit's findings)

| Wave | Plan thesis | This audit's confirming evidence | Status |
|---|---|---|---|
| **α** transform-identity + scale utility | glass-ui `.hover-scale`/`.active-scale` + base identity (~69 sites) | glass-ui CSS-1/UX-1 (**52** `transform` sites, `dock.css`/`utilities.css`/`cards.css`) + value.js D-ux-5 (29) + keyframes UX-1 (`morph.ts`). Both audits converge (this audit gap #2 = style-audit gap-#3). **Baseline — no gate.** | **CONFIRMED** |
| **β** native overlay substrate (KEYSTONE) | popover + anchor positioning + top layer | glass-ui LAYOUT-1/HTML-1 (0 `anchor-name`), value.js D-ux-1/D-ux-2 (`useHoverPopover`/`useDialogOverlayGuards`), words GU-1, speedtest GA (≥9 sites), keyframes gap1/2, fourier #7. This audit's gap #1 (named by 4 of 6) + inv-30 ledger #1/#2 | **CONFIRMED** |
| **γ** content-visibility sweep | `.deferred-section` + canvas pause | fourier #3/#4/#5 (0 `content-visibility`, the #1 lever), speedtest #9, glass-ui PERF-1/PERF-2, words GU-4, value.js D-perf-2. #1-ranked in 3 reports | **CONFIRMED** |
| **δ** scroll-driven CSS | retire JS scroll listeners | glass-ui PERF-3, words P1 header-shrink (+ the **new** reduced-motion regression it fixes), keyframes PERF-2/3, fourier IO-TOC. inv-30 ledger #5 | **CONFIRMED** |
| **ε** View Transitions | retire 3 FLIP engines | speedtest #13+#14 (collapse to ONE adoption), keyframes UX-2/3, fourier #6, words/value.js. inv-30 ledger #4 | **CONFIRMED** |
| **ζ** `@starting-style` top-layer | decouple motion from Vue | glass-ui UX-2 (0 `@starting-style`/`allow-discrete`), keyframes O6. This audit gap #5 | **CONFIRMED** |
| **η** forms / native-select | `base-select` + `:user-valid` + `<search>` | value.js D-forms-3 (5 comboboxes), glass-ui FORMS-1/2, words forms, **speedtest forms cluster** (see EXPAND). This audit gap #7 | **CONFIRMED + EXPANDED** |
| **θ** image/asset/privacy | fonts + figures + avatar | words P1 image, value.js #1 fonts + D-css-1 font-size-adjust, fourier avatar, keyframes/speedtest images. inv-30 ledger #7 | **CONFIRMED** |
| **ι** CSP/analytics/INP tail | CSP propagation + fetchLater + scheduler | **EXPANDED** — see below | **CONFIRMED + EXPANDED + RE-RANK** |

### Waves EXPANDED (the plan's scope is wider than it booked)

1. **η (forms) is bigger than planned — the densest P1 cluster constellation-wide is now speedtest, not value.js.** The plan allocated η to glass-ui-`<Select>` + value.js(5 comboboxes) + words(`<search>`). This audit surfaces a **full speedtest forms cluster the plan did not allocate**: survey/admin have **no `<form>`** (`SurveyWizard.vue`, `AdminLoginView.vue:63-75`), all inputs hard-code `type="text"` (`SurveyField.vue:27`), and there is zero `autocomplete`/`name`/`inputmode`/`enterkeyhint`/`<nav aria-label="Progress">` (`SurveyField.vue:24-43`) — **four P1 forms findings, all speedtest-this-repo**. The plan's per-repo allocation table marks speedtest "—" under η; it should read ✓. The forms-weakest-category verdict (already in the plan thesis §1.7) is reinforced, but speedtest must be added as an η consumer.

2. **ι (security) is bigger than planned — add HSTS + Permissions-Policy to speedtest, promote it to P1.** The plan's ι covers CSP propagation to non-fourier SPAs. This audit adds: speedtest is **missing HSTS + Permissions-Policy** despite using geolocation (`_headers:39-42`, **P1**); keyframes has **no `_headers` at all** (P1); value.js has **no CSP** despite `innerHTML` sinks (P1); plus the keyframes `sanitizeSVG` XSS gap (`AssetViewport.vue:153-156`, a `<script>`-only regex strip — a concrete security finding, not in the plan). ι is thicker than "thin + booked."

### The one RE-RANK (within ι)

The plan ranks `scheduler.yield()`/`fetchLater` at backlog rank 15 (trailing). This audit's speedtest pass **elevates `scheduler.yield()` to a P1** because INP-under-measurement-load is speedtest's *defining product constraint* (grep `scheduler.yield` = 0; only `requestIdleCallback`). Recommendation: keep ι trailing as a *wave* (the dependency order holds — it is independent), but within ι, `scheduler.yield()` in glass-ui's `useRAFLoop` (ledger GE) ranks above CSP-propagation for speedtest specifically. This is a within-wave priority note, not a wave re-sequence.

### Highest-ROI first move (Wave α) — RE-CONFIRMED

The plan's §5 single-highest-ROI verdict is **Wave α** (mint `.hover-scale`/`.active-scale` in glass-ui with base `scale:1`/`translate:0` identity using individual transform props). This audit **re-confirms it independently and emphatically**:
- It is the **largest summed demand in BOTH audits** — gap #2 here (~69 sites, glass-ui 52 + value.js 29) = style-audit gap-#3/#8.
- It is **Baseline (2022) — the only foundation wave with no `@supports` gate** (every other glass-ui-rooted wave is gated), so it is the lowest-risk, highest-clarity, S-effort first commit.
- It is the **hard prerequisite for Wave β** (the keystone): a hover-only combined `transform` creates a containing-block shift that breaks `anchor()`. This dependency is verified by glass-ui's own audit (CSS-1 "hard prerequisite for #2").
- It pays out three ways from one S-effort glass-ui change: closes the largest design-canon demand, satisfies `individual-transform-properties`, unblocks the anchor-positioning keystone.

### Wave sequencing — CONFIRMED

The dependency chain **α → β → {γ ∥ δ} → ε → ζ** holds against the findings: α (transforms, Baseline) is the prerequisite for β (anchor positioning, gated); γ and δ are independent and parallelizable from W0 (γ is `content-visibility:auto` which degrades to no-op — zero risk; δ mirrors the proven `CardHeader` recipe); ε (View Transitions) benefits from α (individual transforms compose with VT) and β (top-layer overlays survive VT); ζ (`@starting-style`) requires β's native top-layer to animate. η/θ/ι trail correctly (independent, leaf-heavy). The leverage principle — **6 of 9 waves root in glass-ui, glass-ui-rooted ranks highest** — is the correct spine and is validated by the inv-30 ledger (items 1–6 all land in glass-ui).

### W-mapping — HOLDS (with the two EXPAND annotations)

The W0–W9 mapping holds: W0 charter + ordering λ′; W1 γ fourier-local (its #1, S-effort — confirmed as the correct fourier first move); W2 α; W3 β; W4 δ; W5 ε; W6 ζ+η; W7 θ; W8 ι; W9 close. Two annotations: **W6's η arm must add speedtest as a consumer** (the forms cluster); **W8's ι arm is P1-weighted, not "thin"** (HSTS/Permissions-Policy/per-SPA-CSP/SVG-sanitizer are concrete P1/P2 security findings). The H.ε BOOK-ALL posture (authored-now / executed-on-clean-checkout for cross-repo arms, since all siblings are mid-flight) remains the correct governance under inv-16′.

### Did the audit surface anything the plan MISSED?

No new *wave* is required — every P0/P1 finding maps to an existing wave. The plan's only gaps are **scope under-allocation** (speedtest-forms under η; security-thickness under ι), addressed above as EXPANDs. The one finding that has **no clean wave home** is the fourier **P0 orphaned form labels** (`FunctionInput.vue:97`) — it is pure semantics (not a platform swap, not glass-ui-rooted), S-effort, fourier-local. It should be booked as a **W1 fourier-local rider** (alongside the γ content-visibility work) since both are fourier-this-repo and W1 is already the fourier-local execution wave — it is the constellation's only true P0 and deserves to land first.

---

*Source per-repo audits (all `file:line`-cited herein): `fourier.md`, `value.js.md`, `glass-ui.md`, `keyframes.md`, `words.md`, `speedtest.md` — all in `docs/audits/runs/2026-06-01-modern-web-audit/`.*
