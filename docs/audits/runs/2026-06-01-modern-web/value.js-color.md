# Modern-Web Posture Audit — value.js-color (color.babb.dev)

**Run:** 2026-06-01 · **Lens:** Chrome `modern-web-guidance` v0.0.170 (local corpus, no network)
**Auditor stance:** READ-ONLY (no edits to the target repo; this report is the only artifact written).

---

## Preamble

| Field | Value |
|---|---|
| **Repo** | `mkbabb/value.js` (`/Users/mkbabb/Programming/value.js`) |
| **Frontend dir** | `demo/` — the color.babb.dev SPA (Vue 3.5 color toolkit demo). Sub-apps: `demo/color-picker/` (the shipping app), `demo/hero-lab/` (a WebGL/Canvas hero playground), `demo/@/` (the shared component/composable tree). |
| **Stack** | Vue 3.5 (reactive-props-destructure, `useTemplateRef`) · Vite 8 · Tailwind v4 (`@theme` tokens) · reka-ui 2 (shadcn-vue) for Dialog/Popover/Tooltip/Select/Slider · `@vueuse/core` · KaTeX + highlight.js (markdown) · WebGL2 metaball + aurora canvases. |
| **Shared layer** | `@mkbabb/glass-ui` **v3.0.0** (`file:../glass-ui`), consumed across **41+ subpath imports** (`/dom`, `/aurora`, `/dock`, `/search`, `/forms`, `/glass`, `/confirm`, `/configurator`, `/tabs`, `/dark`, `/controls`). This is unambiguously the high-leverage shared surface: anything ≥2 consumers want should land in glass-ui, not here. |
| **Out of scope** | the `palette-api` backend (`api/`), the `src/` value.js color library. Frontend only. |

**Headline.** This is a *mature, already-modern* frontend. It is a genuine showcase of several patterns the guidance recommends as best-in-class: CSS scroll-driven animations (`scroll-timeline`/`animation-timeline`), `content-visibility` for offscreen/cached views, `color-mix(in oklab/srgb)` throughout, `100dvh`, a global `prefers-reduced-motion` carve-out, `:has()` (13 sites), a tiered design-token architecture, and WebGL render loops that fence on reduced-motion. The drift that remains is concentrated in **two themes**: (1) the cost of routing **all** overlay UI (Dialog/Popover/Tooltip/Select) through a JS library (reka-ui) where the platform's **top-layer + popover API + anchor positioning + customizable `<select>`** now do the same job natively — and where one whole bug-class (`useDialogOverlayGuards`'s teleport-detection) exists *only* because of the JS-portal model; and (2) some **remote-asset / CLS hygiene** gaps (Google-Fonts third-party origin; no `font-size-adjust`; missing `aspect-ratio` on a swapped `<img>`). The biggest wins are shared-layer (glass-ui) adoptions because the same overlay primitives back ≥2 consumers (value.js, fourier, speedtest).

---

## (1) ALREADY-MODERN — patterns to NOT regress

Grouped by guidance category. Each cites the guide it satisfies + a `file:line` exemplar.

### user-experience
- **Scroll-driven CSS animation (no JS scroll listener).** `scroll-progress-indicator` / `shrinking-header-on-scroll` / `scroll-entry-exit-effects`. The shrinking pane header is driven *entirely* by named CSS `scroll-timeline: --pane-scroll block` + `animation-timeline: --pane-scroll` with `animation-range`, isolated via `contain: layout style paint`. No `addEventListener('scroll')` anywhere in the demo. **Exemplary.** — `demo/@/components/custom/panes/PaneHeader.vue:32,43,49,59`
- **`prefers-reduced-motion` carve-out done right.** `physics-based-easing` / `dark-mode` accessibility note: a global guard neutralizes CSS animations/transitions but *re-enables* a 150 ms opacity fade on `[data-state=open|closed]` so reka-ui state changes still communicate; WebGL RAF loops fence on reduced-motion in their composables. — `demo/@/styles/animations.css:32-60`, `demo/@/components/custom/goo-blob/composables/useMetaballRenderer.ts`
- **Light-dismiss / Escape / focus-trap delegated to the platform-grade library.** `light-dismiss-a-dialog`. No hand-rolled focus traps or `tabindex` juggling exist — reka-ui Dialog handles top-layer focus management. (The *caveat* is in §2: the JS-portal model forces a teleport-guard workaround.)

### performance
- **`content-visibility` for offscreen + cached views.** `defer-rendering-heavy-content` + `faster-spa-view-transitions`. `content-visibility: auto` + `contain-intrinsic-size: auto 200px` on long markdown content; `content-visibility: hidden` to cache an inactive dialog tab's render state. — `demo/@/components/custom/markdown/Markdown.vue:78-79`, `demo/@/components/custom/palette-browser/PaletteDialog/PaletteDialog.vue:297`
- **Non-blocking font load + no-FOUC + no-FOUT-dark guard.** `optimize-preload-priority` spirit. `preconnect` to both font origins; `media="print" onload="this.media='all'"` swap; `<noscript>` fallback; inline `@layer fouc-guard` + a dark-mode-before-paint script. — `demo/color-picker/index.html:12-55`

### css
- **`color-mix()` in `oklab`/`srgb` with the space chosen deliberately.** css §8 "Gradients and `color-mix()`" — *"DON'T use `in srgb` unless ... you are building a color picker that needs to interpolate in srgb."* The slider touch-gate uses `color-mix(in srgb, …)` knowingly, and the per-channel slider gradients are sampled in the picker's *own* color space (11 explicit JS-computed stops via `toCSSColorString`) rather than leaning on browser gradient interpolation — the correct approach for a color tool. — `demo/@/components/custom/color-picker/controls/ComponentSliders.vue:319,324`, `demo/@/components/custom/color-picker/composables/useSliderGradients.ts:31-41`
- **Tiered design tokens, no inline magic values, logical token names.** css §5 "Design Tokens and Theming." Three-tier token cascade (Tailwind → glass-ui contract → demo `:root` overrides), zero numeric `z-[NN]` literals, role-bearing radii/shadow/duration tokens. — `demo/@/styles/style.css`, catalogued in `demo/DESIGN.md`
- **`:has()` for content/parent-state styling (13 sites).** `content-based-styling` / `style-parent-with-has`. — across the custom tree
- **`100dvh` not `100vh`.** css §6 (dynamic viewport units). Explicitly enforced as an anti-pattern guard in DESIGN.md §"Idioms NOT used". — `--content-max-h: calc(100dvh - …)` in `style.css`

### accessibility / html
- **Landmark roles + AT-hidden decorative canvas + keyboard-reachable dropzone.** The aurora canvas is `aria-hidden`; `<nav>`/`<main>` landmarks; the image dropzone is `role="button"` + `tabindex` + `@keydown.enter.space`. — `demo/color-picker/App.vue:5-26`, `demo/@/components/custom/image-palette-extractor/ImageDropZone.vue:2-18`

---

## (2) DRIFT — obsolete / ad-hoc / heavy-dependency patterns a guide now modernizes

Grouped by category. Impact ∈ {perf, ux, a11y, security, dx, privacy}; effort ∈ {S, M, L}.

### user-experience — overlay primitives (the dominant theme)

- **D1 · Hand-rolled JS-positioned hover popover.** `useHoverPopover.ts` computes `getBoundingClientRect()` and writes reactive `top`/`left` px on hover, with a manual 250 ms leave-timer and a `(hover: hover)` gate — a bespoke re-implementation of an anchored, light-dismissable tooltip/popover.
  - **Guide:** `position-aware-tooltips` (CSS anchor positioning + `position-try-fallbacks` + anchored container queries) / `interest-triggered-tooltips` (`popover="hint"` + `interestfor` — gives WCAG 1.4.13 dismissible/hoverable/persistent for free, no manual timer).
  - **Site:** `demo/@/components/custom/palette-browser/composables/useHoverPopover.ts:20-35`
  - **Impact:** ux + a11y (manual timer + JS positioning lacks viewport-flip and the platform's hover/focus persistence). **Effort:** M.

- **D2 · Teleport-guard workaround for outside-click — a bug-class that the native top layer deletes.** `useDialogOverlayGuards` exists *solely* because reka-ui teleports floating menus/popovers to the document root, so the Dialog's own outside-click detection sees them as "outside" and would wrongly close. The fix is a string of `closest('[data-reka-popper-content-wrapper]')` / `.card-menu-panel` / `.floating-panel` probes.
  - **Guide:** `declarative-dialog-popover-control` + `light-dismiss-a-dialog` + `platform-controls-dismiss-dialog`. Native `popover`/`<dialog>` nest correctly in the **top layer**; a popover inside a dialog is *not* "outside" it, so light-dismiss just works and this guard becomes unnecessary.
  - **Site:** `demo/@/components/custom/palette-browser/PaletteDialog/composables/useDialogOverlayGuards.ts:1-40`
  - **Impact:** dx (brittle markup-coupled selectors) + ux (edge-case mis-dismissals). **Effort:** L (touches the whole overlay stack; best done in glass-ui — see O1).

- **D3 · reka-ui `<Select>` (JS combobox) where the customizable native `<select>` now applies.** Color-space / easing / mix / generate selectors are JS comboboxes that rebuild listbox semantics, top-layer rendering, and keyboard handling in userland.
  - **Guide:** `branded-select-styling` (`appearance: base-select` + `::picker(select)` + `<selectedcontent>` — browser keeps focus mgmt, top-layer, a11y, native form integration; "z-index conflicts a thing of the past").
  - **Sites:** `demo/@/components/custom/color-picker/display/ColorSpaceSelector.vue:1-40`, `demo/@/components/custom/gradient/EasingSelector.vue`, `demo/@/components/custom/mix/MixConfigBar.vue`, `demo/@/components/custom/generate/GenerateControls.vue`
  - **Impact:** dx + perf (less JS) + a11y (native is more robust than re-implemented). **Effort:** M per consumer (progressive-enhancement; needs `@supports(appearance: base-select)` + the reka path as fallback). *Note: Safari lacks `base-select` today — this is a progressive-enhancement layer, not a removal.*

### performance / privacy — remote assets & CLS hygiene

- **D4 · Render-path fonts loaded from a third-party origin (Google Fonts).** Two `fonts.googleapis.com` stylesheet links + `fonts.gstatic.com` font fetches on the critical path. fourier's own G-tranche already *self-hosted* fonts (3→0 LCP third-party origins, prod Lighthouse 95/100/100) — value.js still ships the remote dependency.
  - **Guide:** performance index (eliminate third-party LCP origins) + `optimize-preload-priority`; privacy index (no third-party request leaking IP/UA on first paint).
  - **Site:** `demo/color-picker/index.html:12-19`
  - **Impact:** perf (extra DNS+TLS+round-trip on the LCP path) + privacy (third-party request on load). **Effort:** S (self-host Fraunces + Fira Code as `woff2`, `<link rel=preload as=font crossorigin>` + `@font-face`; mirrors fourier's done work).

- **D5 · No `font-size-adjust` → font-swap CLS.** The `display=swap` strategy (correctly) avoids invisible text, but swapping Fraunces/Fira Code in over the fallback shifts layout because x-heights differ. No `font-size-adjust: from-font`.
  - **Guide:** `visually-stable-font-fallbacks` (`font-size-adjust: from-font`).
  - **Site:** `demo/color-picker/index.html:14-15` (no matching adjust in `style.css`).
  - **Impact:** perf/ux (CLS on font swap). **Effort:** S.

- **D6 · Swapped `<img>` without `aspect-ratio` (CLS) and no `decoding`.** The dropzone preview `<img>` is swapped in via `<Transition>` with `w-full h-full object-contain` but no reserved aspect box; user-supplied images of arbitrary ratio reflow the 140px-min container.
  - **Guide:** css §6 (`aspect-ratio` to reserve space, prevent CLS); `optimize-image-priority` (decoding/loading hints — minor here as it's an object-URL preview, so `fetchpriority` is N/A).
  - **Site:** `demo/@/components/custom/image-palette-extractor/ImageDropZone.vue:32-38`
  - **Impact:** perf/ux (CLS as preview loads). **Effort:** S.

### user-experience — theming & SPA view caching

- **D7 · Class-toggled dark mode instead of `color-scheme` + `light-dark()`.** Dark mode is a `.dark` class + a before-paint script. The guidance's preferred path is `color-scheme: light dark` on `:root` so *browser-generated UI* (scrollbars, form controls, spellcheck) adapts automatically, with `light-dark()` tokens resolving late. (The before-paint script *does* already set `s.colorScheme` — so the system is partway there; the token layer is still class-gated.)
  - **Guide:** css §5 "Dark mode" + `dark-mode` + `component-specific-light-dark-theme`.
  - **Site:** `demo/@/styles/style.css:179` (`.dark { … }`), `demo/color-picker/index.html:37-55`
  - **Impact:** ux/a11y (native UI in form-heavy admin panels won't auto-theme). **Effort:** M (token migration; keep `.dark` as the explicit-override escape hatch).

- **D8 · Inactive desktop pane uses `visibility: hidden; position: absolute` rather than `content-visibility: hidden`.** The "ghost pane" is kept in the DOM and merely visually hidden — so the browser still runs layout for it. The SPA-view-transitions guide's headline technique is `content-visibility: hidden`, which caches the render state *and* skips layout/paint (the dialog tab already does this — see ALREADY-MODERN). The reason given is "preserve scroll-timeline state"; worth verifying `content-visibility: hidden` retains that (it caches rendering state by design).
  - **Guide:** `faster-spa-view-transitions`.
  - **Site:** `demo/color-picker/App.vue:236-241` (`.pane-wrapper--ghost`)
  - **Impact:** perf (avoidable layout for the hidden pane). **Effort:** S (one rule) — but **verify** scroll-timeline survival first; low-confidence.

---

## (3) OPPORTUNITIES — high-leverage modern adoptions

Each says **lands-in: glass-ui** (shared, ≥2 consumers) or **this repo**. Prefer glass-ui.

- **O1 · A native top-layer overlay primitive in glass-ui (popover API + anchor positioning + `<dialog>`).** Build/expose a glass-ui overlay layer on the platform's top layer + CSS anchor positioning + the popover API, so consumers stop hand-positioning (D1) and stop teleport-guarding (D2). This is the single highest-leverage move: it deletes `useHoverPopover.ts`, `useDialogOverlayGuards.ts`, and the per-component leave-timers — and **value.js, fourier, and speedtest all consume glass-ui overlays**, so the fix amortizes across the constellation.
  - **Guides:** `position-aware-tooltips`, `interest-triggered-tooltips`, `declarative-dialog-popover-control`, `light-dismiss-a-dialog`, `animate-to-from-top-layer`.
  - **Impact:** dx + a11y + perf (removes code + a JS dependency surface). **Effort:** L. **Lands-in:** glass-ui.

- **O2 · `interestfor` + `popover="hint"` tooltips in glass-ui (with polyfill gate).** A declarative tooltip primitive: trigger gets `interestfor`, target gets `popover="hint"` — platform gives WCAG-1.4.13 dismissible/hoverable/persistent + implicit `aria-describedby` + anchor for free; polyfill (`@oddbird/popover-polyfill` + interestfor polyfill) gated on feature detection. Replaces D1 and the reka-ui `Tooltip` re-export.
  - **Guide:** `interest-triggered-tooltips`. **Impact:** a11y + dx. **Effort:** M. **Lands-in:** glass-ui.

- **O3 · Self-host Fraunces + Fira Code (mirror fourier's G-tranche).** Drop the two Google-Fonts origins; preload `woff2` + `@font-face` + `font-size-adjust: from-font`. Fixes D4 + D5 in one stroke; fourier already proved the recipe (0 third-party LCP origins, 95/100/100). Could ship as a glass-ui font-bundle if fourier/speedtest want the same faces.
  - **Guides:** performance index, `visually-stable-font-fallbacks`. **Impact:** perf + privacy. **Effort:** S. **Lands-in:** this repo (or glass-ui font module if shared).

- **O4 · Customizable native `<select>` wrapper in glass-ui (`appearance: base-select`).** A progressive-enhancement `<Select>` that renders a real `<select>` + `::picker(select)` when supported and falls back to the reka path otherwise — removes JS combobox weight from the 5+ selector sites (D3) and from every other glass-ui consumer's selects.
  - **Guide:** `branded-select-styling`, `custom-select-picker-layouts`. **Impact:** perf + a11y + dx. **Effort:** M. **Lands-in:** glass-ui.

- **O5 · `color-scheme: light dark` + `light-dark()` token layer in glass-ui.** Make the glass-ui token contract resolve via `light-dark()` so browser-generated UI auto-themes, keeping `.dark` as the explicit override. Fixes D7 across all consumers at once.
  - **Guide:** css §5, `component-specific-light-dark-theme`, `design-token-reactivity`. **Impact:** ux/a11y. **Effort:** M. **Lands-in:** glass-ui.

- **O6 · `content-visibility: hidden` for the ghost pane + an LRU note.** Swap D8's `visibility:hidden` for `content-visibility:hidden` (verify scroll-timeline survival). With only ~5 panes the RAM trade-off is safe (guide's "DO" case); document the eviction caveat in DESIGN.md so it isn't copied into a future many-view surface.
  - **Guide:** `faster-spa-view-transitions`. **Impact:** perf. **Effort:** S. **Lands-in:** this repo.

- **O7 · Custom standard scrollbar properties on scroll panes.** 18 scroll panes; one uses `scrollbar-width: none` (with a mask). Adopt `scrollbar-color`/`scrollbar-width: thin` (thumb ≥3:1 vs track) + `@supports not (scrollbar-color: auto)` WebKit fallback so the cartoon language extends to the scrollbar, and never fully hide a scrollbar that's the only scroll affordance.
  - **Guides:** `customize-scrollbar-color-and-thickness`, `adapt-scrollbar-to-contrast-preferences`. **Impact:** ux/a11y. **Effort:** S. **Lands-in:** glass-ui (shared scroll-surface recipe).

---

## Top 8 modernizations (ranked by impact × 1/effort)

| # | Title | Guide id | Impact | Effort | Lands-in |
|---|---|---|---|---|---|
| 1 | Self-host fonts + `font-size-adjust` (kill Google-Fonts origin) | `visually-stable-font-fallbacks` + performance | perf+privacy | S | this repo |
| 2 | `content-visibility:hidden` for inactive ghost pane | `faster-spa-view-transitions` | perf | S | this repo |
| 3 | Native top-layer overlay primitive (popover+anchor+dialog) | `declarative-dialog-popover-control` | dx+a11y+perf | L | glass-ui |
| 4 | `interestfor` + `popover="hint"` tooltips (replace useHoverPopover) | `interest-triggered-tooltips` | a11y+ux | M | glass-ui |
| 5 | Custom standard scrollbar (`scrollbar-color`/`-width`) | `customize-scrollbar-color-and-thickness` | ux+a11y | S | glass-ui |
| 6 | Customizable native `<select>` wrapper (`base-select`) | `branded-select-styling` | perf+a11y+dx | M | glass-ui |
| 7 | `aspect-ratio` on swapped dropzone `<img>` (CLS) | css §6 (aspect-ratio) | perf+ux | S | this repo |
| 8 | `color-scheme: light dark` + `light-dark()` token layer | css §5 dark-mode | ux+a11y | M | glass-ui |

**Sequencing note.** #1, #2, #5, #7 are S-effort and land now. #3 is the structural keystone (it subsumes D1+D2 and unblocks #4) — schedule it in glass-ui first; #4/#6/#8 are then thin adoptions on top. Because glass-ui v3.0.0 backs value.js + fourier + speedtest, every glass-ui-landed item (#3–#6, #8) pays out ≥2×.
