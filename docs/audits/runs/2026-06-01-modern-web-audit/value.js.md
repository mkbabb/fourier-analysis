# Modern-Web CONFORMANCE Audit — value.js (color.babb.dev frontend)

**Run:** 2026-06-01 · **Lens:** Chrome `modern-web-guidance` v0.0.170 (local corpus `/tmp/mwg`, no network)
**Stance:** READ-ONLY auditor. The target repo was not modified; this report is the only artifact written.
**Rigor:** Style-Audit grade — `file:line` on every finding, grep-verified, repeated patterns coalesced with counts, severity (P0/P1/P2/P3) + effort (S/M/L) + lands-in (this-repo | glass-ui) + inv-30 flag on every drift row.

---

## Preamble

| Field | Value |
|---|---|
| **Repo** | `mkbabb/value.js` — git HEAD `2fefe5e` (tranche-I W5 close) |
| **Frontend dir** | `demo/` — the color.babb.dev SPA. Shipping app `demo/color-picker/`; shared tree `demo/@/components/custom/**` + `demo/@/components/ui/**` (reka-ui re-export barrels) + `demo/@/styles/{style,utils,animations}.css`. `demo/hero-lab/` is a separate playground app — out of scope. |
| **Stack** | Vue 3.5 (`useTemplateRef`, reactive-props-destructure) · Vite · Tailwind v4 (`@theme`/`@source`) · reka-ui (shadcn-vue) for Dialog/Popover/Tooltip/Select/Slider/DropdownMenu/HoverCard · `@vueuse/core` · KaTeX + highlight.js · WebGL2 aurora + metaball canvases. |
| **Shared layer** | `@mkbabb/glass-ui` **v3.0.0** (`file:../glass-ui`, resolved in `node_modules`), consumed across the demo via `/dock` (15), `/search` (5), `/dom` (3), `/confirm-dialog` (3), `/tabs` (2), `/aurora`, `/forms`, `/dark`, `/controls`, `/configurator`, `/glass-carousel` + the root barrel (41). This is the high-leverage shared surface: anything ≥2 consumers want lands in glass-ui. |
| **Out of scope** | `api/` (palette-api backend), `src/` (value.js color library), `demo/hero-lab/`. |

**Headline.** This is a *mature, already-modern, high-discipline* frontend — a genuine showcase of several patterns the guidance flags as best-in-class: CSS scroll-driven animation (`scroll-timeline`/`animation-timeline`, **zero** `addEventListener('scroll')` in the demo), `content-visibility` for offscreen + cached views, `color-mix(in oklab/srgb)` with the space chosen deliberately (37 sites), `100dvh` (9 sites), `:has()` (13 sites), a tiered design-token cascade, a WebGL render loop that fences on reduced-motion, and a global `prefers-reduced-motion` carve-out that preserves overlay state-fades. The residual drift concentrates in **four themes**: (1) **overlay primitives routed entirely through a JS library** (reka-ui) where the platform top-layer + popover API + anchor positioning + customizable `<select>` now do the job natively — and where one whole bug-class (`useDialogOverlayGuards`) exists *only* because of the JS-portal model [inv-30]; (2) **remote-asset / CLS hygiene** (Google-Fonts third-party origin, no `font-size-adjust`, a swapped `<img>` with no `aspect-ratio`); (3) **forms semantics** (the admin sign-in form has no `autocomplete`/`id`/`name`/`required`; the color-search field is `type="text"` not `type="search"`; no `:user-invalid`/`aria-invalid` sync); and (4) a **complete absence of `@supports` feature-gates** (zero in the demo) — the inv-29 progressive-enhancement-floor is implicit-via-stack rather than explicit, which is *fine today* but means every modern-API adoption below MUST ship its own gate.

**inv-29 / inv-30 framing.** Because the demo already leans on Baseline-Widely-Available features (scroll-timeline, content-visibility, `:has()`, `color-mix`) without `@supports`, it is silently *correct* on its modern-engine targets but carries **no explicit floor** for the *Newly-available* / *limited-availability* APIs the opportunities below recommend (`base-select` Chrome-only, `interestfor` Chrome-only, anchor positioning unshipped). Every drift→modern recommendation here is therefore tagged with the floor it must retain. The inv-30 (platform-over-library) verdict is dominant in user-experience + forms: the reka-ui overlay stack is the single biggest "native-replaces-library" surface, and it backs ≥2 glass-ui consumers — so the replacement lands in **glass-ui**, not here.

---

## Per-category conformance

> Legend: **C** = conformant (do-not-regress) · **D** = drift · **O** = opportunity. Severity P0–P3, effort S/M/L, inv30 = native-replaces-library.

### 1. accessibility — *applicable*

**Conformant**
- **C-a11y-1 · Landmark structure + AT-hidden decorative canvas.** `<nav aria-label="Application navigation">` wraps the fixed dock; `<main class="pane-main" aria-label="Color tool panes">` wraps content; the aurora canvas is `aria-hidden="true"`. — `demo/color-picker/App.vue:5-26`
- **C-a11y-2 · Keyboard-reachable custom dropzone.** `role="button"` + dynamic `tabindex` + `@keydown.enter.space.prevent` + a state-aware `aria-label`. — `demo/@/components/custom/image-palette-extractor/ImageDropZone.vue:14-18`
- **C-a11y-3 · `aria-live` polite region for pagination.** `aria-live="polite" aria-atomic="true"` on the page-count readout. — `demo/@/components/custom/palette-browser/PaginationBar.vue:17`
- **C-a11y-4 · Rich `aria-label` coverage.** 69 `aria-label`, 42 `aria-hidden`, `aria-pressed`/`aria-disabled`/`aria-expanded`/`aria-haspopup`/`aria-controls` present across the custom tree. Icon-only triggers carry accessible names (e.g. `SearchFilterBar.vue:5,78`).

**Drift**
- **D-a11y-1 (P1, M, this-repo, inv30 no) · No `:user-invalid` / `aria-invalid` sync on the admin forms.** The token sign-in (`AdminAuthGate.vue`) and the tag/audit text inputs validate purely via JS (`tokenInput.trim()` gating the submit button) with no programmatic invalid state surfaced to AT, and no error-message wiring. — guide `accessible-error-announcement` (bridge `:user-invalid` ↔ `aria-invalid` + `aria-errormessage`). Sites: `demo/@/components/custom/palette-browser/AdminAuthGate.vue:6-21`, `AdminTagsPanel.vue:19,25`, `AdminAuditPanel.vue:7,13`. **Floor (inv-29):** ship the `:user-invalid` CSS + a `CSS.supports('selector(:user-invalid)')`-gated WeakMap fallback (the guide provides it verbatim).
- **D-a11y-2 (P2, S, glass-ui|this-repo, inv30 no) · No reduced-transparency / contrast / forced-colors carve-outs anywhere.** Grep for `prefers-reduced-transparency` / `prefers-contrast` / `forced-colors` returns **0** across the demo, yet the demo ships hand-rolled translucent glass surfaces (see D-css-3). A sticky pane header at `bg-card/60 backdrop-blur-md` collapses to a near-invisible wash under `prefers-reduced-transparency: reduce` and has no Windows-high-contrast (`forced-colors`) story. — guide `accessibility` index + `adapt-scrollbar-to-contrast-preferences`. Best fixed at the glass-tier level (the canonical glass tiers ship this matrix — see glass-ui gaps).
- **D-a11y-3 (P2, S, this-repo, inv30 no) · `<label>` without `for`/control association on Select/Slider labels.** Several `<label class="section-label">` elements are *visual* labels not bound to their control (the control is a reka-ui Select/Slider sibling, not a wrapped child), so the accessible name relies on `SelectTrigger`'s own `aria-label` rather than the visible label. — guide `accessibility` (associate `<label for>`). Sites: `demo/@/components/custom/mix/MixConfigBar.vue:51,69,89`. (Note: `SearchFilterBar.vue:22,34` *wrap* the control → implicit association is correct there.)

**Opportunity**
- **O-a11y-1 (P3, M, glass-ui) · `interestfor` + `popover="hint"` declarative tooltips** give WCAG-1.4.13 dismissible/hoverable/persistent + implicit `aria-describedby` for free, replacing the hand-rolled `useHoverPopover` timer (D-ux-1). — `interest-triggered-tooltips`. Lands in glass-ui.

### 2. built-in-ai — **N/A**

No `window.ai` / `Summarizer` / `Translator` / `LanguageModel` / `LanguageDetector` surface (grep = 0). A color tool with bundled per-color-space markdown docs has a *latent* fit for `summarizer`/`translator` on the doc panes, but nothing exists to audit — out of scope for conformance.

### 3. css — *applicable, strong*

**Conformant**
- **C-css-1 · `color-mix()` with deliberate color space (37 sites).** The slider touch-gate uses `color-mix(in srgb, var(--foreground) 50%, transparent)` *knowingly* (srgb is correct for a color tool), per-channel slider gradients are sampled in the picker's own space. — `demo/@/components/custom/color-picker/controls/ComponentSliders.vue:319,324`; guide `css` §gradients/`color-mix`.
- **C-css-2 · `:has()` content/parent-state styling (13 sites).** e.g. inline-math spacing `p div.inline-block:has(> .katex)`. — `demo/@/components/custom/markdown/Markdown.vue:216-222`; guides `content-based-styling`, `style-parent-with-has`.
- **C-css-3 · `100dvh` not `100vh` (9 sites).** Enforced in the layout token `--content-max-h: calc(100dvh - …)`. — `demo/@/styles/style.css:95`; guide `css` §dynamic-viewport-units.
- **C-css-4 · Tiered design tokens, zero `z-[NN]` literals, role-bearing radii/shadow/duration.** Three-tier cascade (Tailwind `@theme` → glass-ui contract → demo `:root` overrides) with explicit project-override comments. — `demo/@/styles/style.css:27-107`; guide `css` §design-tokens.
- **C-css-5 · `contain: layout style paint` to isolate the named scroll-timeline.** — `demo/@/components/custom/panes/PaneHeader.vue:31`; guide `css`/`overflow-clipping-control` spirit.

**Drift**
- **D-css-1 (P1, S, this-repo, inv30 no) · No `font-size-adjust` → font-swap CLS.** `display=swap` (correctly) avoids invisible text but swapping Fraunces/Fira-Code over the fallback shifts layout (different x-heights). Grep for `font-size-adjust` / `size-adjust` = **0**. — guide `visually-stable-font-fallbacks` (`font-size-adjust: from-font`). Sites: the `@theme` font aliases at `demo/@/styles/style.css:28-30` carry no matching adjust; `demo/@/styles/utils.css:4-7` `.fraunces`.
- **D-css-2 (P2, M, glass-ui, inv30 no) · `.dark` class-gated tokens instead of `color-scheme: light dark` + `light-dark()`.** Dark mode is a `.dark` class block (`style.css:179`) plus a before-paint script that *does* set `s.colorScheme` (partway there). But the token layer is class-gated, so browser-generated UI (scrollbars, native form controls, spellcheck underline) won't auto-adapt where the demo later adopts native controls. Grep for `light-dark(` = **0**. — guide `css` §dark-mode + `dark-mode` + `component-specific-light-dark-theme`. **Floor:** keep `.dark` as the explicit override escape hatch.
- **D-css-3 (P1, S, glass-ui, inv30 no) · Three dead glass-tier classes render as silent no-ops.** `.glass-subtle` (`GradientStopEditor.vue:109`, `GradientCodeEditor.vue:138`) and `.glass-elevated` (`MixResultDisplay.vue:31`) **do not exist** in glass-ui v3.0.0 (the ladder is `.glass-{wash,quiet,resting,floating,overlay}` + `.glass-{card,pill,btn}`). These surfaces therefore have **no background, border, backdrop-filter, or shadow** — and (compounding) no `@supports`/reduced-transparency fallback because there is no glass at all. — `css` §design-tokens + `accessibility`. Replacement: `.glass-quiet`/`.glass-wash` (subtle), `.glass-floating` (elevated).
- **D-css-4 (P2, S, glass-ui, inv30 no) · Hand-rolled glass header/bar surfaces without the fallback matrix.** `bg-card/60 backdrop-blur-md` (sticky pane header) and `bg-card/75 backdrop-blur-sm` reimplement a glass effect inline without `@supports not(backdrop-filter)` / `prefers-reduced-transparency`. — Sites: `demo/@/components/custom/panes/PaneHeader.vue:2`, `image-palette-extractor/ImageEyedropper.vue:3`, `ImagePaletteExtractor.vue:22`. Replacement: a canonical glass tier (`.glass-quiet`), or a glass-ui `.glass-bar` tier (gap G-4).

**Opportunity**
- **O-css-1 (P3, S, this-repo) · `text-wrap: balance`/`pretty` for headings & prose.** Grep for `text-wrap`/`text-balance`/`text-pretty` = 0; the display headings (`text-display-*`, `font-display` 48×) and markdown prose would benefit. — `improve-text-layout-and-legibility`. Baseline-widely-available, no floor needed.

### 4. css-layout — *applicable*

**Conformant**
- **C-layout-1 · Flex-column app shell with `min-height:0` flex-min-size idiom + grid pane container.** Deliberate, documented layout (no magic clearance rows). — `demo/@/styles/style.css:131-173`; `demo/color-picker/App.vue:28-71`.
- **C-layout-2 · `min-aspect-ratio` media query for ultra-wide tuning.** — `demo/@/styles/style.css:118`.

**Drift / Opportunity**
- **O-layout-1 (P2, M, this-repo) · No container queries — responsive logic is viewport-media-query only.** Grep for `@container`/`container-type`/`cqw` = 0. The two-pane → single-pane swap and the pane internals are all `lg:`/`@media` viewport-gated. A color tool with panes that can appear in either column is a textbook container-query fit (size-aware styling independent of viewport). — `size-aware-styling` / `calculate-with-intrinsic-sizes`. Baseline-widely-available; this is an adoption, not a fix. Floor not required.

### 5. forms — *applicable, weakest category*

**Conformant**
- **C-forms-1 · Real `<form>` + `<button type="submit">` + `@submit.prevent` for the sign-in flow** (not a div-with-click). — `demo/@/components/custom/palette-browser/AdminAuthGate.vue:6,13`; guide `autofill-sign-in-form` ("put sign-in in its own `<form>`").
- **C-forms-2 · `maxlength` on the flag-report textarea.** — `demo/@/components/custom/palette-browser/FlagReportDialog.vue:29`.
- **C-forms-3 · `<label for>` correctly bound on the flag-report radio set.** — `FlagReportDialog.vue:19`.

**Drift**
- **D-forms-1 (P1, S, this-repo, inv30 no) · Sign-in password input missing the mandatory autofill quartet.** The admin-token field has `type="password"` but **no** `autocomplete="current-password"`, **no** stable `id`, **no** `name`, **no** `required`. The guide marks all of these MANDATORY for a sign-in form (browser password-manager + autofill + missing-field prompt all depend on them). — guide `autofill-sign-in-form` §"current-password"/"required". Site: `demo/@/components/custom/palette-browser/AdminAuthGate.vue:7-12`. (It's a single-token admin gate, not a username/password pair, but `autocomplete="current-password"` + `required` still apply.)
- **D-forms-2 (P2, S, this-repo, inv30 no) · Color-search field is `type="text"`, should be `type="search"` + `inputmode`/`enterkeyhint`.** The "Find by Color" input takes hex/`hsl()` and submits on Enter, but is `type="text"` with no `inputmode` or `enterkeyhint="search"` (mobile keyboard gets no search affordance). Grep for `inputmode`/`enterkeyhint` = 0 across the demo. — guides `forms` index + `autofill-sign-in-form` §"right keyboard"/`enterkeyhint`. Site: `demo/@/components/custom/palette-browser/SearchFilterBar.vue:84-90`.
- **D-forms-3 (P1, M per consumer, glass-ui, inv30 YES) · reka-ui JS `<Select>` where customizable native `<select>` now applies.** Color-space / hue-method / easing / mix / generate selectors are JS comboboxes (6 `@components/ui/select` sites) that rebuild listbox semantics, top-layer rendering, and keyboard handling in userland. `appearance: base-select` + `::picker(select)` + `<selectedcontent>` hand all of that back to the browser ("z-index conflicts a thing of the past"). — guides `branded-select-styling`, `custom-select-picker-layouts`, `animated-select-picker`, `select-menu-interaction`. Sites: `demo/@/components/custom/color-picker/display/ColorSpaceSelector.vue:1-39`, `gradient/EasingSelector.vue`, `mix/MixConfigBar.vue`, `generate/GenerateControls.vue`. **Floor (inv-29) MANDATORY:** `base-select` is Chrome-135-only (no Firefox/Safari) — must ship behind `@supports(appearance: base-select)` with the reka path retained as the floor; NOT a rip-out. This is the canonical inv-30 platform-over-library row.

**Opportunity**
- **O-forms-1 (P3, S, this-repo) · `field-sizing: content` on the rename / tag inputs** so they auto-fit their content. — `form-fields-automatically-fit-contents`. Sites: `PaletteRenameInput.vue`, `AdminTagsPanel.vue`. Floor: progressive (Chrome-only) — gate with `@supports(field-sizing: content)`.

### 6. html — *applicable*

**Conformant**
- **C-html-1 · Valid lang + viewport + meta description.** `<html lang="en">`, `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, a descriptive `<meta name="description">`. — `demo/color-picker/index.html:2,5,7`.
- **C-html-2 · External links carry `rel="noopener noreferrer"` with `target="_blank"` (4 sites).** — `ProfileSection.vue:108,118`, `MobileMenuDropdown.vue:78,87`; guide `html`/`security` (reverse-tabnabbing).
- **C-html-3 · `<noscript>` font fallback + `@layer fouc-guard` no-FOUC guard.** — `demo/color-picker/index.html:20-33`.

**Drift**
- **D-html-1 (P2, S, this-repo, inv30 no) · Legacy `X-UA-Compatible` meta is dead weight.** `<meta http-equiv="X-UA-Compatible" content="IE=edge">` targets IE — long-EOL. — `demo/color-picker/index.html:5`. Cosmetic but it is exactly the "modern HTML" hygiene the `html` guide flags. (Note: this `http-equiv` is the only one present; there is **no** CSP `http-equiv` — see security.)
- **D-html-2 (P3, S, this-repo, inv30 no) · `contenteditable` code editor lacks `role`/accessible name.** The gradient CSS editor is a bare `<div contenteditable="true">` with no `role="textbox"`, `aria-label`, or `aria-multiline`. — `demo/@/components/custom/gradient/GradientCodeEditor.vue:134-144`; guide `html`/`accessibility`.

### 7. passkeys — **N/A**

No `navigator.credentials` / `PublicKeyCredential` / WebAuthn surface (grep = 0). The admin gate uses a bearer token, not credentials. Out of scope. *(Note: were the admin auth ever promoted to a real account system, `passkey-registration`/`passkey-authentication` would apply — booked as latent, not a finding.)*

### 8. performance — *applicable, strong*

**Conformant**
- **C-perf-1 · `content-visibility: auto` + `contain-intrinsic-size` for offscreen markdown sections.** — `demo/@/components/custom/markdown/Markdown.vue:78-79`; guide `defer-rendering-heavy-content`.
- **C-perf-2 · `content-visibility: hidden` to cache an inactive dialog tab's render state.** — `demo/@/components/custom/palette-browser/PaletteDialog/PaletteDialog.vue:297`; guide `faster-spa-view-transitions`.
- **C-perf-3 · Non-blocking font load (`media="print" onload="this.media='all'"`) + `preconnect` to both origins.** — `demo/color-picker/index.html:12-19`; guide `optimize-preload-priority` spirit.
- **C-perf-4 · Lazy dynamic import of glass-ui for a non-critical clipboard path.** `const { copyToClipboard } = await import("@mkbabb/glass-ui")`. — `demo/@/components/custom/gradient/GradientVisualizer.vue:110`; guide `conditional-async-dependencies`.
- **C-perf-5 · WebGL RAF fenced on reduced-motion (single-frame render).** — `demo/@/components/custom/goo-blob/composables/useMetaballRenderer.ts:86`.

**Drift**
- **D-perf-1 (P1, S, this-repo, inv30 no) · Render-path fonts on a third-party origin (Google Fonts).** Two `fonts.googleapis.com` stylesheet links + `fonts.gstatic.com` font fetches on the critical path. fourier's G-tranche already self-hosted (3→0 LCP third-party origins, prod Lighthouse 95/100/100); value.js still ships the remote dependency. — guide `performance` index (eliminate third-party LCP origins) + `optimize-preload-priority`. Site: `demo/color-picker/index.html:12-19`.
- **D-perf-2 (P2, S, this-repo, inv30 no) · Inactive "ghost" desktop pane uses `visibility:hidden; position:absolute` rather than `content-visibility:hidden`.** The pane is kept in the DOM and merely visually hidden, so the browser still runs layout for it. The dialog tab already uses the better technique (C-perf-2). — guide `faster-spa-view-transitions`. Site: `demo/color-picker/App.vue:236-241` (`.pane-wrapper--ghost`). **Low-confidence caveat:** the comment claims this preserves scroll-timeline state — verify `content-visibility:hidden` retains it (it caches rendering state by design, so it should).
- **D-perf-3 (P2, S, this-repo, inv30 no) · Swapped `<img>` without `decoding` (and see D-ux-2 for `aspect-ratio`).** The dropzone preview is the only `<img>`; it lacks `decoding="async"`. — `optimize-image-priority`. Site: `demo/@/components/custom/image-palette-extractor/ImageDropZone.vue:32-38`.

**Opportunity**
- **O-perf-1 (P3, M, this-repo) · `scheduler.postTask` / `requestIdleCallback` for non-urgent work.** 45 `setTimeout`/`setInterval` sites and 0 scheduler/`postTask`/`requestIdleCallback`. The custom-color-name API load (`onMounted`) and palette migration are background work that could yield via prioritized scheduling. — `schedule-tasks-by-priority` / `efficient-background-processing`. Low priority for a small SPA.

### 9. privacy — *applicable*

**Conformant**
- **C-priv-1 · No analytics / tracking / third-party beacons** beyond Google Fonts (grep for analytics/gtag/beacon = 0). `localStorage` (5 sites) is first-party preference storage only.
- **C-priv-2 · `rel="noreferrer"` on external links** also limits referrer leakage. — `ProfileSection.vue:108`.

**Drift**
- **D-priv-1 (P2, S, this-repo, inv30 no) · Google-Fonts origins leak IP/UA to a third party on first paint.** Same root as D-perf-1; called out separately because the privacy lens (no third-party request on load) is an independent reason to self-host. — guide `privacy` index. Site: `demo/color-picker/index.html:12-19`. Fixing D-perf-1 closes this.

### 10. security — *applicable*

**Conformant**
- **C-sec-1 · `rel="noopener noreferrer"` on all 4 `target="_blank"` links** (reverse-tabnabbing closed). — `ProfileSection.vue:108,118`, `MobileMenuDropdown.vue:78,87`.
- **C-sec-2 · `innerHTML` sinks fed only by trusted/escaped content.** The markdown highlighter and gradient editor write `innerHTML`, but: markdown is **build-time-bundled** `DocModule` docs (`Markdown.vue:30` — `() => Promise<{default}>` glob import, not user content), and the highlighter (`highlight.js`) HTML-escapes its output. — `security` index (XSS sinks). Not a finding, but adjacent (see D-sec-1).

**Drift**
- **D-sec-1 (P1, M, this-repo, inv30 no) · No Content-Security-Policy.** Grep for `Content-Security-Policy` / a `_headers` file = **0**; the only `http-equiv` is the legacy `X-UA-Compatible`. The app has multiple `innerHTML` sinks (`GradientCodeEditor.vue:95,122`, `useMarkdownHighlighting.ts:117`, `useCodeFormatting.ts:54,103`) and inline `<script>`/`<style>` in `index.html`. A CSP (delivered via the host `_headers` like fourier's CF Pages, or a build-time meta) is the defense-in-depth the security guide expects for any app with HTML injection sinks. — guide `security` index. **Note:** the deploy host is CF Pages (per the constellation), so a `demo/color-picker/public/_headers` `Content-Security-Policy` is the natural landing — mirrors fourier's `_headers` CSP work. Self-hosting fonts (D-perf-1) also *tightens* the CSP (drops two `font-src`/`style-src` allowances).
- **D-sec-2 (P3, S, this-repo, inv30 no) · contenteditable `innerHTML` round-trips user keystrokes through the highlighter.** `GradientCodeEditor.vue:95` re-renders `editorRef.innerHTML = highlight(code)` where `code` originates from user typing. highlight.js escapes, so this is safe *today*, but it is the kind of sink a CSP (D-sec-1) backstops; flagged for the pairing. — `security` index.

### 11. user-experience — *applicable, largest surface*

**Conformant (exemplary — do NOT regress)**
- **C-ux-1 · Scroll-driven CSS animation, zero JS scroll listeners.** The shrinking pane header is driven entirely by a named CSS `scroll-timeline: --pane-scroll block` + `animation-timeline: --pane-scroll` with `animation-range`, isolated by `contain`. Grep for `addEventListener('scroll')` / `useScroll` = **0**. — `demo/@/components/custom/panes/PaneHeader.vue:30-65`; guides `scroll-progress-indicator`, `shrinking-header-on-scroll`, `scroll-position-aware-elements`.
- **C-ux-2 · `prefers-reduced-motion` done right with an overlay carve-out.** A global guard neutralizes animations/transitions but a later equal-specificity block re-enables a 150 ms opacity fade on `[data-state=open|closed]` so reka-ui state changes still communicate. — `demo/@/styles/animations.css:32-60`; guide `physics-based-easing`/`dark-mode` (reduced-motion).
- **C-ux-3 · Light-dismiss / Escape / focus-trap delegated to a platform-grade library** (reka-ui Dialog top-layer focus mgmt) — no hand-rolled focus traps or `tabindex` juggling. — guide `light-dismiss-a-dialog` (the *caveat* is D-ux-2/D-ux-3 below).
- **C-ux-4 · Vue `<Transition>` with CSS-variable-driven directional pane slides composed from `--duration-*`/`--spring-*`/`--ease-*`.** — `demo/color-picker/App.vue:243-281`; guides `animate-element-entry-exit`, `directional-navigation-transitions`.

**Drift**
- **D-ux-1 (P1, M, glass-ui, inv30 YES) · Hand-rolled JS-positioned hover popover.** `useHoverPopover` computes `getBoundingClientRect()` and writes reactive `top`/`left` px on hover, with a manual 250 ms leave-timer and a `(hover:hover)` gate — a bespoke re-implementation of an anchored, light-dismissable tooltip. No viewport-flip, no platform hover/focus persistence. — guides `position-aware-tooltips` (CSS anchor positioning + `position-try-fallbacks`), `interest-triggered-tooltips` (`popover="hint"` + `interestfor` → WCAG-1.4.13 for free). Site: `demo/@/components/custom/palette-browser/composables/useHoverPopover.ts:20-35`. **Floor (inv-29):** anchor positioning is unshipped in all engines → the `@oddbird/css-anchor-positioning` + `interestfor` polyfills must be conditionally loaded; the current JS path is the floor until then.
- **D-ux-2 (P1, L, glass-ui, inv30 YES) · Teleport-guard workaround — a bug-class the native top layer deletes.** `useDialogOverlayGuards` exists *solely* because reka-ui teleports floating menus/popovers to the document root, so the Dialog's outside-click detection sees them as "outside" and would wrongly close. The fix is a string of `closest('[data-reka-popper-content-wrapper]')` / `.card-menu-panel` / `.floating-panel` probes. Native `popover`/`<dialog>` nest correctly in the **top layer** — a popover inside a dialog is not "outside" it, so this guard becomes unnecessary. — guides `declarative-dialog-popover-control`, `light-dismiss-a-dialog`, `platform-controls-dismiss-dialog`. Site: `demo/@/components/custom/palette-browser/PaletteDialog/composables/useDialogOverlayGuards.ts:13-45`. This is the structural keystone (best done in glass-ui — see O-ux-1).
- **D-ux-3 (P2, S, this-repo, inv30 no) · Swapped dropzone `<img>` has no `aspect-ratio` → CLS.** `w-full h-full object-contain` with no reserved aspect box; arbitrary-ratio user images reflow the 140px-min container as the preview loads. — guide `css` §aspect-ratio. Site: `demo/@/components/custom/image-palette-extractor/ImageDropZone.vue:32-38`.
- **D-ux-4 (P2, S, glass-ui|this-repo, inv30 no) · Scroll panes never style the standard scrollbar; one fully hides it.** 18 `overflow-y-auto` scroll panes (`.pane-scroll-fade`) use a fade mask but no `scrollbar-color`/`scrollbar-width: thin`; `PaletteControlsBar.vue:170` sets `scrollbar-width: none` (fully hidden) on the tab strip — risky if it's the only scroll affordance. — guides `customize-scrollbar-color-and-thickness`, `adapt-scrollbar-to-contrast-preferences`. **Floor (inv-29):** wrap WebKit `::-webkit-scrollbar` fallbacks in `@supports not (scrollbar-color: auto)`.
- **D-ux-5 (P3, S, this-repo, inv30 no) · 29 ad-hoc `hover:scale-*`/`active:scale-*` Tailwind literals where individual transform props + canon `--scale-*` tokens apply.** e.g. `PaletteCardSwatches.vue`, `EditDrawer.vue`. The `individual-transform-properties` guide also notes the MANDATORY identity-transform base to prevent stacking-context shifts on hover. (This is also style-audit U1: glass-ui should ship a `.hover-scale` companion to `.active-scale`.) — guide `individual-transform-properties`. Grep count: 29.

**Opportunity**
- **O-ux-1 (P0-priority/L, glass-ui) · A native top-layer overlay primitive in glass-ui (popover API + anchor positioning + `<dialog>`).** Single highest-leverage move: deletes `useHoverPopover.ts` (D-ux-1), `useDialogOverlayGuards.ts` (D-ux-2), and the per-component leave-timers. value.js + fourier + speedtest all consume glass-ui overlays → the fix amortizes across the constellation. — `declarative-dialog-popover-control`, `position-aware-tooltips`, `animate-to-from-top-layer`, `persistent-top-layer-ui`.
- **O-ux-2 (P3, S, this-repo) · `text-wrap: balance` on display headings + `prevent-text-wrapping` (`text-wrap: nowrap`) on badges/labels.** — `improve-text-layout-and-legibility`, `prevent-text-wrapping`.
- **O-ux-3 (P3, M, this-repo) · Same-document View Transitions for the pane swaps** (currently Vue `<Transition>`). `startViewTransition` would cross-fade the whole pane region with less bespoke transition CSS. Grep for `startViewTransition` = 0. — `same-document-transitions`. Floor: gate on `document.startViewTransition` support.

### 12. webmcp — **N/A**

No `navigator.modelContext` / `registerTool` / agentic-tool surface (grep = 0). *(Latent fit: an agentic "set color / generate palette / export CSS" tool surface via `agentic-javascript-tools` would be a genuinely novel adoption for a color tool — booked as a future idea, not a conformance finding.)*

---

## P0 / P1 severity-ranked table

| # | Sev | Finding | Guide id | Site (file:line) | Effort | Lands-in | inv30 |
|---|-----|---------|----------|------------------|--------|----------|-------|
| 1 | **P1** | reka-ui JS `<Select>` where native customizable `<select>` applies (6 sites) | `branded-select-styling` | `color-picker/display/ColorSpaceSelector.vue:1-39` | M×n | **glass-ui** | **yes** |
| 2 | **P1** | Hand-rolled JS-positioned hover popover (bespoke anchored tooltip) | `interest-triggered-tooltips` / `position-aware-tooltips` | `palette-browser/composables/useHoverPopover.ts:20-35` | M | **glass-ui** | **yes** |
| 3 | **P1** | Teleport-guard outside-click workaround — a top-layer bug-class | `declarative-dialog-popover-control` | `…/PaletteDialog/composables/useDialogOverlayGuards.ts:13-45` | L | **glass-ui** | **yes** |
| 4 | **P1** | Render-path fonts on third-party origin (Google Fonts) | `performance` index + `optimize-preload-priority` | `demo/color-picker/index.html:12-19` | S | this-repo | no |
| 5 | **P1** | No `font-size-adjust` → font-swap CLS | `visually-stable-font-fallbacks` | `demo/@/styles/style.css:28-30` | S | this-repo | no |
| 6 | **P1** | Three dead glass-tier classes render as silent no-ops (no surface + no fallback) | `css` §tokens + `accessibility` | `gradient/GradientCodeEditor.vue:138`, `mix/MixResultDisplay.vue:31` | S | glass-ui | no |
| 7 | **P1** | Sign-in password input missing `autocomplete=current-password`/`id`/`name`/`required` | `autofill-sign-in-form` | `palette-browser/AdminAuthGate.vue:7-12` | S | this-repo | no |
| 8 | **P1** | No Content-Security-Policy despite multiple `innerHTML` sinks + inline scripts | `security` index | `demo/color-picker/index.html` (no `_headers`) | M | this-repo | no |
| 9 | **P1** | No `:user-invalid`/`aria-invalid` sync on admin forms | `accessible-error-announcement` | `palette-browser/AdminAuthGate.vue:6-21` | M | this-repo | no |

*(No true P0: nothing is currently broken or an outright a11y failure — the app's modern features sit on Baseline-Widely-Available targets without `@supports` but those features ARE supported on the demo's engine targets. The P1s are high-value perf/ux/a11y/security improvements, three of them inv-30 platform-over-library replacements.)*

---

## glass-ui GAPS (adoptions that should land in glass-ui — ≥2 consumers)

These are the cross-consumer leverage points. value.js + fourier + speedtest all consume `@mkbabb/glass-ui` v3.0.0.

- **G-1 · Native top-layer overlay primitive (popover API + anchor positioning + `<dialog>`).** The keystone. Build/expose a glass-ui overlay layer on the platform top layer + CSS anchor positioning + the popover API so consumers stop hand-positioning (D-ux-1) and stop teleport-guarding (D-ux-2). Deletes `useHoverPopover.ts` + `useDialogOverlayGuards.ts` + per-component leave-timers across the constellation. **Floor (inv-29):** `@oddbird/popover-polyfill` + `@oddbird/css-anchor-positioning` + `interestfor` polyfills, conditionally loaded; reka path stays as the false-`@supports` floor. Guides: `declarative-dialog-popover-control`, `position-aware-tooltips`, `interest-triggered-tooltips`, `animate-to-from-top-layer`, `persistent-top-layer-ui`.
- **G-2 · Customizable native `<select>` wrapper (`appearance: base-select`).** A progressive-enhancement `<Select>` that renders a real `<select>` + `::picker(select)` + `<selectedcontent>` when supported and falls back to the reka path otherwise. Removes JS-combobox weight from value.js's 6 selector sites *and* every other consumer's selects. **Floor:** `@supports(appearance: base-select)` (Chrome-only today). Guides: `branded-select-styling`, `custom-select-picker-layouts`, `animated-select-picker`.
- **G-3 · `color-scheme: light dark` + `light-dark()` token contract.** Make the glass-ui token contract resolve via `light-dark()` so browser-generated UI auto-themes; keep `.dark` as the explicit override. Fixes D-css-2 across all consumers at once. Guides: `css` §dark-mode, `component-specific-light-dark-theme`, `design-token-reactivity`.
- **G-4 · Header/bar glass tier (`.glass-bar`) + custom standard scrollbar recipe.** (a) A sticky-header glass tier at `--z-header` weight that carries the `@supports`/reduced-transparency fallback matrix — closes D-css-4 (PaneHeader/ImageEyedropper) and the equivalent in fourier's chrome. (b) A shared `scrollbar-color`/`scrollbar-width:thin` scroll-surface recipe with the `@supports not(scrollbar-color: auto)` WebKit floor — closes D-ux-4's 18 scroll panes. Guides: `accessibility`, `customize-scrollbar-color-and-thickness`, `adapt-scrollbar-to-contrast-preferences`.
- **G-5 · `.hover-scale` utility companion to `.active-scale`** (built on individual transform props + `--scale-hover`, reduced-motion-safe, with the MANDATORY identity-transform base). Closes D-ux-5's 29 literal sites and the same `active:scale-95` pattern in fourier's visualizer. Guide: `individual-transform-properties`.

---

## Conformance scorecard

| Category | ✓ conformant | ✗ drift | + opportunity | Notes |
|---|---|---|---|---|
| accessibility | 4 | 3 | 1 | strong aria coverage; gap is forms-error-sync + reduced-transparency |
| built-in-ai | — | — | — | **N/A** (no AI surface) |
| css | 5 | 4 | 1 | strongest category; drift = font-adjust + dark-mode + dead glass classes |
| css-layout | 2 | 0 | 1 | clean layout; opportunity = container queries |
| forms | 3 | 3 | 1 | **weakest**; autofill + `type=search` + native-select |
| html | 3 | 2 | 0 | valid + noopener; legacy IE meta + contenteditable role |
| passkeys | — | — | — | **N/A** (token auth, no WebAuthn) |
| performance | 5 | 3 | 1 | strong; drift = google-fonts + ghost-pane + img decoding |
| privacy | 2 | 1 | 0 | clean; only google-fonts third-party leak |
| security | 2 | 2 | 0 | noopener + escaped sinks; gap = no CSP |
| user-experience | 4 | 5 | 3 | largest; overlay-library replacements dominate |
| webmcp | — | — | — | **N/A** (no agentic surface) |
| **Total** | **30** | **23** | **8** | 9 categories applicable, 3 N/A |

---

## Delta vs the prior analysis

This audit **CONFIRMS** the prior posture analysis (`2026-06-01-modern-web/value.js-color.md`) and style-audit (`2026-06-01-constellation-ui/color-valuejs.md`) on every headline, with per-category `file:line` rigor, and **EXPANDS** in five places:

**CONFIRMED (re-verified at current HEAD `2fefe5e`, glass-ui resolved v3.0.0):**
- The prior D1–D8 all reproduce. The overlay theme (D1 `useHoverPopover`, D2 `useDialogOverlayGuards`, D3 reka-`<Select>`) is the dominant drift and the inv-30 keystone → here mapped to D-ux-1/D-ux-2/D-forms-3 + the P1 table.
- Google-Fonts third-party origin (D4/D-perf-1/D-priv-1), no `font-size-adjust` (D5/D-css-1), swapped-`<img>` no `aspect-ratio` (D6/D-ux-3), `.dark` class vs `light-dark()` (D7/D-css-2), ghost-pane `visibility:hidden` vs `content-visibility:hidden` (D8/D-perf-2) — all reproduce.
- The style-audit's "dead glass-tier classes" (`.glass-subtle`/`.glass-elevated` at 3 sites) reproduce → here promoted to a **P1 css/a11y finding** (D-css-3) because the no-op means *no fallback matrix*, not just a missing tier. The 42-inline-`focus-visible:ring` vs 3 `.focus-ring`, and 29 `hover/active:scale-*` literals also reproduce (D-ux-5 + glass-ui gap G-5).

**EXPANDED / NEW (not in either prior doc):**
1. **Forms is the weakest category, with three concrete sign-in/search findings the prior posture grouped only loosely:** the admin password field has **no `autocomplete="current-password"`/`id`/`name`/`required`** (D-forms-1, guide-MANDATORY), and the color-search field is `type="text"` not `type="search"` with no `inputmode`/`enterkeyhint` (D-forms-2). New.
2. **No Content-Security-Policy** (D-sec-1) — verified by grep (no `_headers`, no CSP `http-equiv`) against an app with 5+ `innerHTML` sinks + inline scripts. The deploy host is CF Pages, so a `public/_headers` CSP mirrors fourier's done work. New security finding.
3. **Zero `@supports` in the entire demo** — the inv-29 floor is implicit-via-stack, not explicit. Every modern-API opportunity here is consequently tagged with the gate it must add. New framing.
4. **No `:user-invalid`/`aria-invalid` form-error sync** (D-a11y-1) and **no `prefers-reduced-transparency`/`prefers-contrast`/`forced-colors`** carve-outs (D-a11y-2) — new a11y findings.
5. **No container queries** (O-layout-1, grep=0) and **no View Transitions** (O-ux-3, grep=0) — the two-pane↔single-pane swap is a textbook container-query / `same-document-transitions` fit. New opportunities.

**CORRECTED:** nothing material. The prior analyses were accurate; the one nuance added is that the security `innerHTML` sinks are **not** an XSS finding (markdown is build-time-bundled trusted docs; highlight.js escapes) — so the security gap is the *missing CSP defense-in-depth* (D-sec-1), not an active injection vuln.
