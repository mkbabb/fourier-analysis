# Modern-Web Conformance Audit (PROPER) — keyframes.js

**Run:** `2026-06-01-modern-web-audit` · **Lens:** Chrome `modern-web-guidance` v0.0.170 (on-disk corpus, 12 categories)
**Mode:** READ-ONLY (no edits to the target; this report is the only artifact written)
**Invariant frame:** **inv-29** progressive-enhancement-floor (every modern-API rec ships behind `@supports`/feature-gate with the prior path retained — no Safari/Firefox rip-out) · **inv-30** platform-over-library (flag every site a native capability should REPLACE a JS/library reimplementation).

---

## Preamble

| Field | Value |
| :--- | :--- |
| **Repo** | `/Users/mkbabb/Programming/keyframes.js` (`@mkbabb/keyframes.js` v2.1.1) |
| **What it is** | A general-purpose JS animation engine (parses standards-compliant CSS `@keyframes`, interpolates DOM/objects/data, ships spring physics + scroll timelines + element morphing + WAAPI delegation) + a Vue 3 demo (keyframes.babb.dev). |
| **Stack** | TypeScript ESM (`type: module`, node ≥22), Vue 3.5 (peer), Vite 8, Tailwind v4, reka-ui primitives, Monaco/Three/KaTeX in the demo. Core lib runtime deps: only `@mkbabb/parse-that` + `@mkbabb/value.js`. |
| **Shared layer** | `@mkbabb/glass-ui@3.0.0` (`file:../glass-ui`, devDep) imported via 11 subpaths; 6+ sibling consumers. glass-ui owns dialog/popover/dropdown/tooltip/glassmorphism/motion-token surfaces. |
| **Frontend dir** | `src/animation/` (core engine, ~4.6k LoC, 20 files) + `demo/` (Vue showcase, 127 non-dist source files). |
| **The inv-30 verdict (headline)** | The library's **off-DOM core survives native subsumption**; only its **DOM-element convenience paths are platform-replaceable.** Native `animation-timeline: scroll()/view()` subsumes `ScrollTimeline` *only for the window/element-progress-on-scroll case*; View Transitions + individual transform properties subsume `ElementMorph` *only for the DOM-to-DOM FLIP case*. What native CANNOT touch — and what is therefore the library's true residual differentiator — is: (a) the second-order spring ODE solver (`spring.ts`) that emits `linear()` for *everyone else* (`springLinearStops.ts`); (b) the custom-renderer opt-out (`createDOMStyleRenderer` / `DEFAULT_RENDERER`, `renderer.ts:24-31`) that drives canvas/WebGL/arbitrary-data targets; (c) scroll/morph progress on **non-DOM** data; (d) the WAAPI-*ineligible* lanes it correctly keeps in JS (color perceptual-lerp, computed units — `waapi.ts:74-94`). The drift is narrow and additive, never a rip-out. |

This is an unusually modern codebase. It already does the hard parts native guidance prescribes: it **emits CSS `linear()` from its own spring solver** (`springLinearStops.ts:46-73` — exactly `physics-based-easing`'s "use a library to convert a JS easing into `linear()`"); **delegates eligible animations to WAAPI** for compositor playback behind a real eligibility gate (`waapi.ts:40-97`); **honors `prefers-reduced-motion`** at the primitive layer; ships a **critical-CSS-inline + deferred-font** build (`vite.config.ts:44-114`, `demo/app/index.html:16-21`). The conformance residue is concentrated and is enumerated exhaustively below, category by category.

---

## (1) accessibility

**CONFORMANT**
- Icon-only buttons carry `aria-label` broadly and correctly — `SharePopover.vue:5`, `KeyframeTimeline.vue:12,23,163`, `AssetLayer.vue:39,57`, `AnimationMenuBar.vue:32,95,129`, `App.vue:19`, `TopDock.vue:146,172`, `SpringSidebar.vue:18,35` (and `EasingTarget.vue:51` "Scrub progress"). Per `accessibility` §2 (interactive elements need accessible names) — done.
- `role="slider"` with full aria value-state on the spring drag target — `SpringTarget.vue:25` (+ 4 aria attrs). Custom widget given the correct role.
- The custom "advanced" disclosure is a **textbook** ARIA button-on-`div`: `role="button"` + `tabindex="0"` + `@keydown.enter`/`@keydown.space.prevent` — `AnimationControlsControls.vue:90-96`. Keyboard-operable (the `accessibility` §2 anti-pattern is a `div` with a click handler and *no* keyboard path — this is the correct mitigation, not drift; see inv-30 note in drift A11Y-2).
- `lang="en"` on `<html>` + correct viewport meta — `demo/app/index.html:2,6` (`html` §1).

**DRIFT**
- **A11Y-1 (P1·S·this-repo·inv30:no) — ZERO semantic landmarks in the entire demo.** Verified: `grep -c "<main|<nav|<header|<aside|<footer|<search"` across `demo/**/*.vue` → **0 matches**. The app is a wall of `<div>` (e.g. `EditorShell.vue:2` root `<div class="editor-shell">`, `EditorStartScreen.vue:2` root `<div>`, `TopDock.vue` nav-like dock). Per `accessibility` §1 + `html` §1, the page must wrap regions in `<header>`/`<nav>`/`<main>` so AT users can jump between them; the top dock (`TopDock.vue`) is a `<nav>`, the editor stage is `<main>`. **Floor:** none needed — landmarks degrade gracefully everywhere. Guide: `accessibility` / `html`.
- **A11Y-2 (P2·S·this-repo·inv30:partial) — sidebar `<label>`s are not associated with their controls.** `SpringSidebar.vue:8,25`, `EasingSidebar.vue:38,49,74`, `TimingFunctionPanel.vue:79,92`, `AssetPropertiesPanel.vue:7-98` (≥12 sites) render `<label class="…">response</label>` with **no `for`/`id`** linking to the adjacent `<Input>`/`<Slider>`. Verified: `grep "for="` in demo returns only `v-for` (zero `for=` attributes). Per `forms` §2 / `accessibility` §2, a visible label must be programmatically associated (`for`+`id`, wrapping `<label>`, or `aria-labelledby`). The sliders mostly carry their own `aria-label` (`SpringSidebar.vue:18,35`) so they are *named* — the gap is the visible `<label>` not being the name source and the text inputs (`AssetPropertiesPanel`) being unlabeled. **inv30 partial:** the platform `<label for>`/wrapping mechanism should replace the decorative-only `<label>`. Guide: `forms` / `accessibility`.
- **A11Y-3 (P2·S·this-repo·inv30:no) — `EditableLabel` rename `<input>` has no accessible name** — `EditableLabel.vue:7-16`: a bare `<input v-model>` with no `aria-label`/`<label>`. When a layer rename activates, a screen reader announces an unlabeled edit field. Add `aria-label="Rename"`. Guide: `forms` §2.
- **A11Y-4 (P3·S·this-repo·inv30:no) — heading hierarchy skip in the start screen** — `EditorStartScreen.vue:5,22,26`: `<h1>` → two sibling `<h2>`s is fine, but `KeyframeTimeline.vue` (`<h3>` at `:12` inside the shortcuts modal) and the demo's lack of a single page-level `<h1>` outside the start screen (which is conditionally rendered) means non-home views have **no `<h1>`**. Per `html` §1 (one `<h1>` per view). Low-leverage — flagged for completeness.

**OPPORTUNITY**
- Add a `.skip-link` to `<main id="content" tabindex="-1">` once landmarks land (A11Y-1) — `accessibility` §1 skip-link pattern. The dock is repeated chrome; a skip link is the canonical bypass.

---

## (2) built-in-ai

**N/A** — no Prompt API / Translator / Writer / Summarizer / on-device-AI surface in a CSS-animation tool. Category index is a stub. No findings.

---

## (3) css

**CONFORMANT**
- `@layer base { … }` used in `style.css:68`; project tokens deliberately placed **outside** `@layer` to win the cascade against glass-ui defaults (`style.css:14` comment) — exactly `css` §2 (cascade layers as explicit priority zones).
- `color-mix(in srgb, …)` for tints (`utils.css`, multiple) — `css` §8 (gradients & color-mix). The constellation-ui audit confirmed 0 raw hex in chrome surfaces.
- Logical properties present (`margin-inline`/`padding-block`/`inline-size`) at `utils.css` (2), `AnimationControlsGroup.vue` (3), `AnimationVisualizer.vue` (1) — `css` §1.
- `currentColor`/token discipline strong (per the constellation-ui style audit: 0 `transition: all` in glass-ui chrome, 90+ direct `--type-*` refs).

**DRIFT**
- **CSS-1 (P3·S·this-repo·inv30:no) — `transition: all`/`transition-all` at 4 chrome sites** — `utils.css:16` (`.tab-trigger-base`, literal `transition: all`), `KeyframeTimeline.vue:52,93` (`transition-all`), `SharePopover.vue:7` (`transition-all`). Per `css` §9 (Performance) + the constellation-ui audit (drift 2.1), `all` forces the style system to consider every animatable property and can animate unintended ones; enumerate the changed properties. **Floor:** none. Guide: `css`.
- **CSS-2 (P3·S·glass-ui·inv30:no) — `opacity: 0.5` / `opacity-50` for the disabled register, three vocabularies** — `utils.css:74,129` + `EditorStartScreen.vue:28` + menubar `data-[disabled]:opacity-50` (×3). Per `css` §5 (design tokens), this should read one token (`--opacity-disabled`). This is the constellation-ui "disabled-dim register" union candidate; the fix lands in glass-ui (`.disabled-base` utility). Guide: `css`.

**OPPORTUNITY**
- `interpolate-size: allow-keywords` + `calc-size()` for any JS-measured collapsible height (the inline keyframe editor `Transition name="kf-editor"` at `KeyframeTimeline.vue:144`, the controls-panel open/close). Animate to `height: auto` natively behind `@supports (interpolate-size: allow-keywords)`. Guide: `animate-to-intrinsic-sizes`. inv-29: gate it; the JS-height path is the floor.

---

## (4) css-layout

**CONFORMANT**
- **Container queries** in active use — `utils.css` + `AnimationVisualizer.vue` (verified `@container`/cq-unit hits) and broadly across glass-ui. `css-layout` §4 (fluid, breakpoint-free).
- `display: grid; place-items: center` + `100dvh`/`100dvw`/`100dvb` dynamic-viewport units — `EditorShell.vue:3`, `index.html:55-57` loading skeleton. `css-layout` §1.2 + §7 (viewport mechanics; dynamic viewport units are the modern correct choice).
- `grid-cols-[subgrid]` — `AnimationControlsControls.vue:97`. `css-layout` §3 (subgrid for grandchild track alignment) — correct, advanced usage.
- `aspect-ratio` reserved on media wrappers (per constellation-ui). `css-layout` §1.2.

**DRIFT**
- **LAYOUT-1 (P2·M·glass-ui·inv30:YES) — overlay tethering done by reka-ui JS, not CSS anchor positioning.** Every `PopoverContent`/`DropdownMenuContent`/`TooltipContent` passes `align`/`:side-offset` to reka-ui's JS positioner (`SharePopover.vue:14`, `App.vue:21`, `KeyframeTimeline.vue:103`). `css-layout` §5 + §1.1(6) prescribe native **anchor positioning** (`anchor-name`/`position-anchor` + `position-try`) for "float above the page and stay tethered to a trigger across stacking contexts." **inv30: YES** — native anchor positioning + `popover` should replace the JS positioner; reka-ui demotes to the `@supports not(anchor-name)` floor (Safari <17.5 / Firefox). Lands in **glass-ui** (≥6 consumers). Guides: `position-aware-tooltips`, `resilient-context-menus-and-nested-dropdowns`.

**OPPORTUNITY**
- Native masonry (`grid-auto-flow: dense` today → grid-lanes when Baseline) is N/A — no masonry surface found.

---

## (5) forms

**CONFORMANT**
- `<Input>` controls route through glass-ui `@mkbabb/glass-ui/forms` (`SharePopover.vue:53`, `KeyframeTimeline.vue:153`) — canonical, not raw `<div contenteditable>`.
- `@keydown.enter` submit on the share input (`SharePopover.vue:20`) — keyboard-operable.

**DRIFT** — (coalesced with accessibility)
- **FORMS-1 (P2·S·this-repo·inv30:no)** — visible `<label>`s not associated (see **A11Y-2**); bare rename `<input>` unlabeled (see **A11Y-3**). Per `forms` §1-2: every control needs `name` + an associated `<label>`. These are demo data-editor fields (not a `<form>` POST), so the GET/POST/`action` guidance is N/A; the label-association guidance is not.
- **FORMS-2 (P3·S·this-repo·inv30:no) — numeric `<input>`s lack `inputmode`/`type`.** `AssetPropertiesPanel.vue` x/y/width/height/rotation/font-size fields and `TimelineCaret.vue:14`/`EasingSidebar.vue` numeric inputs would benefit from `type="number"`/`inputmode="decimal"` so mobile shows the numeric keypad (`forms` selection matrix + autofill guides on `inputmode`). Verify per-field; low-leverage. Guide: `forms`.

**N/A** — no auth/sign-in/sign-up/address/payment form (the bulk of the `forms` autofill guides do not apply). No `<form action method>` mutation flow.

---

## (6) html

**CONFORMANT**
- `<!doctype html>` + `lang="en"` + viewport meta + `<title>` — `demo/app/index.html:1-7`. `html` §1.
- `<noscript>` fallback for the deferred Instrument-Serif stylesheet — `index.html:22-24`. `html` §3 + `performance` (graceful no-JS path).
- `<kbd>` for keyboard hints — `KeyboardShortcutsModal.vue:7,25-29`. `html` §1 (semantic elements over styled spans).
- `rel="noopener noreferrer"` on all `target="_blank"` links — verified `grep target=_blank` minus `noopener` → **0**. `App.vue:48,60,62`. `html`/`security`.

**DRIFT**
- **HTML-1 (P2·S·this-repo·inv30:no) — no landmark elements** (the `html` §1 mandate — duplicate of **A11Y-1**, booked once there).
- **HTML-2 (P3·S·this-repo·inv30:no) — legacy `<meta http-equiv="X-UA-Compatible" content="IE=edge">`** at `index.html:5` AND `playground/index.html:5`. Dead cruft (IE is EOL); the `html` §1 doctype already prevents quirks mode. Remove. Guide: `html`.
- **HTML-3 (P1·M·glass-ui·inv30:YES) — overlays are reka-ui JS, not native `<dialog>`/popover.** The `KeyboardShortcutsModal.vue:2` `<Dialog>`, `SharePopover.vue:2` `<Popover>`, and the `App.vue:17` `<DropdownMenu>` all resolve to reka-ui (confirmed: `glass-ui/src/components/ui/dialog/*.vue` import `DialogRoot`/`DialogPortal` from `reka-ui`; popover/dropdown likewise). `html` §4 (Native Overlays) prescribes `<dialog>` (focus-trap + top-layer + `::backdrop` for free) + the popover API + `closedby` light-dismiss. **inv30: YES** — native top-layer should replace the JS focus-trap/portal; reka-ui demotes to the `@supports`-false floor. Lands in **glass-ui**. Guides: `light-dismiss-a-dialog`, `platform-controls-dismiss-dialog`, `declarative-dialog-popover-control`, `animate-to-from-top-layer`.

**OPPORTUNITY**
- `<dialog closedby="any">` + `command`/`commandfor` invoker buttons for the shortcuts modal — zero-JS open/close (`declarative-dialog-popover-control`). Lands in glass-ui.

---

## (7) passkeys

**N/A** — no auth surface, no WebAuthn, no `navigator.credentials`. No findings.

---

## (8) performance

**CONFORMANT**
- **Critical-CSS inline + deferred non-critical CSS** — `criticalCSSPlugin()` injects `<style data-critical>` (`vite.config.ts:44-114`), `deferLazyCSSPlugin(["vendor-monaco"])` keeps Monaco CSS off the critical path (`vite.config.ts:15-43,266`). Exactly `performance` §CRP.
- **Non-blocking font load** — Instrument Serif via `media="print" onload="this.media='all'"` + `preconnect` to both Google Fonts origins (`index.html:10-21`). `performance` §CRP "defer non-critical CSS" pattern verbatim.
- **Aggressive code-splitting** — `manualChunks` splits Monaco/Three/etc.; heavy lazy chunks **excluded from `<link rel="modulepreload">`** (`vite.config.ts:244-266`) so the 3.7 MB Monaco isn't preloaded. `performance` §JS Code-Splitting.
- `type="module"` entry script (deferred by default) — `index.html:38`. `performance` §CRP.
- **WAAPI compositor offload** — `playWAAPI` runs eligible transform/opacity animations off-main-thread via `Element.animate()` (`waapi.ts:185-219`). The single biggest perf lever a JS animation engine can pull, and it's already pulled.
- FOUC-prevention dark-mode sync before first paint (`index.html:27-37`); instant loading skeleton (`index.html:50-81`).

**DRIFT**
- **PERF-1 (P2·S·this-repo·inv30:no) — dynamic `<img>` lack intrinsic `width`/`height` + `loading`.** `KeyframeTimeline.vue:107-111` (keyframe preview, `class="w-36 h-auto"` — no `width`/`height` attrs, no `loading`), `AssetViewport.vue:59-63` (asset `<img>`, no dims/loading). Per `performance` §CLS + `optimize-image-priority`: missing intrinsic dimensions on dynamically-inserted images cause CLS; off-screen previews should `loading="lazy"`. **Note:** these are in-app blob/data-URL previews, not the LCP and not above-the-fold — genuinely low-leverage, listed for completeness. The dock scene icons (`TopDock.vue:173,195,212`) ARE sized (`class="w-5 h-5"`) so are lower-risk but still lack `width`/`height` attrs + `alt`. Guide: `optimize-image-priority` / `performance`.
- **PERF-2 (P1·L·this-repo·inv30:YES) — `ScrollTimeline` samples `window.scrollY` on rAF (main-thread).** `timeline.ts:154-171` (`ScrollTimeline.sample()` = `getScrollY()/(viewportH*threshold)`), public API per `README:366-382`. Every scroll-linked consumer ticks on the main thread via a JS smoother, competing with INP. `performance` (scroll-driven animations run off the compositor) + the `scroll-progress-indicator` family do this with `animation-timeline: scroll()/view()` — zero rAF, zero scroll listener, off-main-thread. **inv30: YES, but NARROW** — native subsumes the *DOM-element-progress-on-window/element-scroll* case only. The class's true value (animate **non-DOM data**, injectable `getScrollY`/`getViewportHeight`, the `SmoothProgress` easing pipeline) is exactly what native scroll-timelines cannot do. So: add a native `scroll()`/`view()` adapter for the DOM case; keep `ScrollTimeline` as the off-DOM differentiator (= the floor + the residual). Guides: `scroll-progress-indicator`, `scroll-entry-exit-effects`, `shrinking-header-on-scroll`.
- **PERF-3 (P2·M·this-repo·inv30:YES-partial) — `useScrollFade`: JS `scroll` listener + manual class toggle.** `useScrollFade.ts:104` attaches a `scroll` listener (passive) and `:69-74` toggles `scroll-fade-{top,bottom,both}` classes to drive edge-fade masks. The fade-mask half is a scroll-driven CSS animation (`animation-timeline: scroll(self)` driving `mask`/`opacity`) — zero JS, zero per-frame Vue reactivity. **inv30 partial:** the scroll-position→fade half collapses to CSS; the `ResizeObserver` overflow-*detection* half (`:117-133`) legitimately stays JS. Guide: `scroll-entry-exit-effects`.

**OPPORTUNITY**
- **PERF-O1 — `content-visibility: auto` on off-screen heavy panels** (the asset layer list, keyframe timeline rows, cached-but-hidden KeepAlive scenes). `defer-rendering-heavy-content` + `interactions-in-complex-layouts` cut rendering cost on the dense editor. Lands in this-repo. Guide: `defer-rendering-heavy-content`.
- **PERF-O2 — `efficient-background-processing`**: pause the Three.js/cube rAF when its scene scrolls off-screen via `content-visibility` + an `IntersectionObserver` (or the WAAPI path's existing pause). The cube/Amiga scenes run continuous rAF. Guide: `efficient-background-processing`.
- **PERF-O3 — `fetchpriority`**: 0 usages found. The LCP is text (`EditorStartScreen` `<h1>`), so low-value, but the cube icon/avatar could demote with `fetchpriority="low"`. Guide: `optimize-image-priority`.

---

## (9) privacy

**CONFORMANT**
- No analytics/tracking/3rd-party-pixel found. Data minimization by construction — the app stores animation state in `localStorage` + URL hash, no PII, no account.
- No permission prompts (camera/geo/notifications) — nothing to gate.

**DRIFT** — none of consequence.
- **PRIV-1 (P3·S·this-repo·inv30:no)** — Google Fonts (`fonts.googleapis.com`/`fonts.gstatic.com`, `index.html:10-23`) is a third-party origin that sees the user's IP. The constellation already self-hosts Fira Code via glass-ui; **Instrument Serif remains Google-hosted** (`index.html:13-14` comment acknowledges this). Self-hosting it (as glass-ui did for Fira/KaTeX in tranche G) removes the third-party origin AND improves LCP. Privacy + perf double-win. Guide: `privacy` (data minimization / third-party origins). Lands in this-repo (or glass-ui font subsystem).

---

## (10) security

**CONFORMANT**
- HTTPS (CF Pages) — Secure Context satisfied (`security` §1.1).
- `rel="noopener noreferrer"` on all external links (`security` §1.5 reverse-tabnabbing) — verified 0 violations.
- `v-html` is sanitized at its one use site — `AssetViewport.vue:66` calls `sanitizeSVG()` (`:153-156`). The `KeyframesEditor.vue:260,431` `innerHTML` writes feed **trusted, locally-generated** highlighted-CSS strings (not user-network input).

**DRIFT**
- **SEC-1 (P1·M·this-repo·inv30:no) — no CSP, no security headers at the edge.** `public/_headers` does **not exist** (verified — only `public/_redirects` with the SPA fallback `/* /index.html 200`); `index.html` has **no** `<meta http-equiv="Content-Security-Policy">`. Per `security` Phase 1→3, a CF Pages `_headers` file should ship at minimum `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Content-Security-Policy-Report-Only` (Phase 2) tightening toward enforcement, and `X-Frame-Options: DENY`/`frame-ancestors 'none'` (clickjacking, §1.4). This is the constellation pattern glass-ui/fourier already adopted (tranche G `_headers`). **inv-29:** start report-only (the §When-to-apply retrofit path) so nothing breaks. Guide: `security`. Lands in this-repo (mirror the glass-ui `_headers`).
- **SEC-2 (P2·S·this-repo·inv30:partial) — `sanitizeSVG` is a regex strip, not a real sanitizer.** `AssetViewport.vue:153-156`: `svg.replace(/<script[\s\S]*?<\/script>/gi, "")` — strips `<script>` only, leaving `onload=`/`onerror=` event-handler attributes, `<foreignObject>`, `javascript:` hrefs, etc. For user-uploaded SVG `v-html`'d into the DOM (`:66`), this is an XSS gap (`security` §1.2 dangerous DOM sinks). **inv30 partial:** the platform answer is to render untrusted SVG via `<img src=blob:>` (no script execution) rather than inline `v-html`, OR use the Sanitizer API / a vetted library (DOMPurify). The regex is a placeholder ("basic XSS prevention" per its own comment). Guide: `security` §1.2. **Floor:** if inline SVG is required, gate the native Sanitizer API behind `@supports`/feature-detect with DOMPurify as the floor.
- **SEC-3 (P3·S·this-repo·inv30:no) — `X-UA-Compatible` meta is also a (benign) legacy header** (dup of HTML-2). No security value; remove.

**OPPORTUNITY**
- Trusted Types (`security` §3.3) once CSP lands — the `innerHTML` sinks in `KeyframesEditor.vue` would be flagged and could route through a Trusted Types policy. Highest-leverage XSS defense per the `security` index. Gate behind report-only first.

---

## (11) user-experience

**CONFORMANT**
- **`springLinearStops()` emits native CSS `linear()`** — `springLinearStops.ts:46-73` samples the 2nd-order ODE solver (`spring.ts`) and produces `linear(0, 0.234 4.17%, …, 1)` honoring overshoot (ζ<1) natively. This is `physics-based-easing`'s prescribed path verbatim ("use a library to convert a JS easing into `linear()`"); glass-ui's `--spring-*` tokens regenerate from this helper. **The reference implementation of the guide.**
- **`springTimingFunction()`** (`springTimingFunction.ts`) — the same solver as a pure `(t)=>number` for code paths that cannot consume a `linear()` string. Correct division of labor (the floor for the `@supports`-false / JS-target case).
- **`prefers-reduced-motion` at the primitive layer** — `numeric.ts`, `spring.ts`, `smooth.ts` all gate motion on the media query (verified). The demo adds 0 PRM brackets but inherits glass-ui's **global** `*:not([data-allow-motion])` PRM rule (per the constellation-ui audit) — covered by inheritance, not drift.
- **`Transition > KeepAlive > Suspense > async`** scene nesting (`App.vue:113-128`) preserves DOM state of up to 3 resolved scenes — the spirit of `faster-spa-view-transitions` (preserve structure, don't rebuild).

**DRIFT**
- **UX-1 (P1·S·this-repo·inv30:YES) — `ElementMorph` + demo write a COMBINED `transform` string.** `morph.ts:89,107` (`translate(${x}px,${y}px) scale(${sx},${sy})`) and `useSquareAnimations.ts:21` (`translate(${x},${y}) scale(${d})`). Per `individual-transform-properties` (Baseline 2022-08-05), the combined string clobbers any concurrent `transform`/`rotate` and forces the whole chain to be re-specified — fatal for a **composition** library. Emit `el.style.translate` + `el.style.scale` (individual props) so a morph composes with an independent `rotate` animation without conflict. The guide even mandates an *identity* base (`translate:0; rotate:0deg; scale:1`) to avoid stacking-context shifts. **inv30: YES** (native individual properties replace the string concat). **inv-29:** gate behind `@supports (translate: 0)`; the combined-string write is the floor (Safari <14.1). Guide: `individual-transform-properties`. Lands in this-repo. **Lowest-effort, highest-clarity win.**
- **UX-2 (P2·M·this-repo·inv30:YES-partial) — `ElementMorph` is a hand-rolled FLIP.** `morph.ts:26-110` measures two `getBoundingClientRect()`s and interpolates position+scale — precisely what View Transitions automate (the browser captures before/after and morphs). For DOM-to-DOM morphs, `same-document-transitions` removes the manual measure/interp. **inv30 partial:** native VT subsumes the DOM case; `ElementMorph` keeps its differentiator for **offscreen/non-DOM rects** (the `MorphRect` overload, `morph.ts:4-9` — you can morph between arbitrary rects native VT can't see). Recommend VT in docs for the DOM case; keep `ElementMorph` as the rect/floor path. Guide: `same-document-transitions`.
- **UX-3 (P2·M·this-repo·inv30:partial) — scene swaps use a Vue class-transition, not View Transitions.** `App.vue:113` `<Transition name="scene" mode="out-in">` + `.scene-enter/leave-*` CSS (`App.vue:406-423`) hard cross-fade scenes; `switchScene` (`App.vue:300-347`) just mutates router state. Wrapping the swap in `document.startViewTransition()` + tagging the persistent stage/dock with `view-transition-name` would **morph shared elements** (the animation stage, the dock) across scenes instead of cross-fading. Verified: 0 `startViewTransition`/`view-transition` usages in the repo. **inv-29:** the Vue `<Transition>` is the floor for non-VT browsers (Firefox <pre-recent); gate `startViewTransition` with a typeof check. Guide: `same-document-transitions` / `directional-navigation-transitions`. Lands in this-repo (demo).

**OPPORTUNITY**
- **UX-O1 — Document & default the `linear()` spring path for DOM consumers.** The helper exists (`springLinearStops.ts`) but the README's spring examples drive springs via rAF (`SpringProgress`). For any DOM transform/opacity spring the modern answer is: generate stops once → `transition-timing-function: var(--spring)` → done (compositor-thread, no loop). Add a tiny `springCSS()` convenience + make it the documented default; keep the rAF solver for live-target/non-DOM. Guide: `physics-based-easing`. Lands in this-repo.
- **UX-O2 — `@starting-style` + `transition-behavior: allow-discrete`** for overlay enter/exit, sourced from the existing `--spring-*` `linear()` tokens — animate top-layer overlays in/out with zero JS enter/leave hooks once HTML-3 lands. Reuses keyframes.js's own spring output. Guide: `animate-to-from-top-layer`. Lands in **glass-ui**.

---

## (12) webmcp

**N/A** — Early-Preview Chromium-only API behind a flag; no agent-tool surface in an animation tool. No findings. (Speculative future: the demo's animation-construction actions *could* be exposed as WebMCP tools — `navigator.modelContext.registerTool` for "create-keyframe"/"play-animation" — but this is greenfield, not drift.)

---

## P0 / P1 severity-ranked table

| # | Sev | Finding | Site | Guide id | Lands-in | inv30 |
| :-- | :-- | :--- | :--- | :--- | :--- | :--- |
| 1 | **P1** | No semantic landmarks anywhere in the demo (0 `<main>/<nav>/<header>`) | `EditorShell.vue:2`, `TopDock.vue`, +all | `accessibility` / `html` | this-repo | no |
| 2 | **P1** | `ElementMorph`/demo write a combined `transform` string (clobbers concurrent transforms — breaks the composition promise) | `morph.ts:89,107`; `useSquareAnimations.ts:21` | `individual-transform-properties` | this-repo | **yes** |
| 3 | **P1** | Overlays are reka-ui JS focus-trap/top-layer/positioner, not native `<dialog>`+popover+anchor | `KeyboardShortcutsModal.vue:2`, `SharePopover.vue:2`, `App.vue:17` | `light-dismiss-a-dialog`, `html`§4 | **glass-ui** | **yes** |
| 4 | **P1** | `ScrollTimeline` samples `window.scrollY` on main-thread rAF (DOM case is native) | `timeline.ts:154-171` | `scroll-progress-indicator` | this-repo | **yes** |
| 5 | **P1** | No CSP / security headers at the CF Pages edge (no `_headers`) | `public/` (absent), `index.html` | `security` §1.4/§3 | this-repo | no |
| 6 | P2 | `useScrollFade` JS scroll listener + class toggle (fade half → CSS scroll-timeline) | `useScrollFade.ts:104,69-74` | `scroll-entry-exit-effects` | this-repo | yes(½) |
| 7 | P2 | `ElementMorph` is a hand-rolled FLIP (DOM case → View Transitions) | `morph.ts:26-110` | `same-document-transitions` | this-repo | yes(½) |
| 8 | P2 | Scene swaps are a Vue class-transition, not View Transitions (no shared-element morph) | `App.vue:113,406-423` | `same-document-transitions` | this-repo | partial |
| 9 | P2 | Overlay tethering by reka-ui JS positioner, not CSS anchor positioning | `SharePopover.vue:14`, `App.vue:21` | `position-aware-tooltips` | **glass-ui** | **yes** |
| 10 | P2 | Visible `<label>`s not associated (`for`/`id`); rename `<input>` unlabeled | `SpringSidebar.vue:8,25`, `EditableLabel.vue:7` +10 | `forms`/`accessibility` | this-repo | partial |
| 11 | P2 | `sanitizeSVG` is a `<script>`-only regex strip (XSS gap on uploaded SVG) | `AssetViewport.vue:153-156,66` | `security` §1.2 | this-repo | partial |
| 12 | P2 | Dynamic `<img>` lack intrinsic `width`/`height`/`loading` (CLS) | `KeyframeTimeline.vue:107`, `AssetViewport.vue:59` | `optimize-image-priority` | this-repo | no |

(P3 polish, booked above: `transition: all` ×4 (CSS-1); `X-UA-Compatible` legacy meta ×2 (HTML-2/SEC-3); `opacity-50` disabled-register tri-vocabulary (CSS-2); numeric-input `inputmode` (FORMS-2); Google-Fonts third-party origin for Instrument Serif (PRIV-1); heading hierarchy (A11Y-4).)

---

## glass-ui gaps (adoptions that should land in glass-ui — ≥2 consumers)

1. **Native top-layer overlay primitives — `<dialog>` + popover API + `closedby` light-dismiss.** glass-ui's `Dialog`/`Popover`/`DropdownMenu`/`Tooltip` are reka-ui (verified: `dialog/*.vue` import `DialogRoot`/`DialogPortal` from `reka-ui`). Native `<dialog>` gives focus-trap + top-layer + `::backdrop` free; `popover`/`popovertarget` + `closedby` give declarative light-dismiss. **inv30 verdict:** native replaces the JS focus-trap/portal/light-dismiss; reka-ui demotes to the `@supports`-false **floor** (Safari <17.5, older Firefox) — NOT a rip-out. With 6+ consumers, the highest cross-repo lever. Guides: `light-dismiss-a-dialog`, `platform-controls-dismiss-dialog`, `declarative-dialog-popover-control`.
2. **CSS anchor positioning for overlay tethering.** Replace reka-ui's JS positioner (`align`/`side-offset`/flip) with `anchor-name`/`position-anchor`/`position-try` + anchor-position `@container`. Floor: reka-ui positioner behind `@supports not(anchor-name: --x)`. Guides: `position-aware-tooltips`, `resilient-context-menus-and-nested-dropdowns`.
3. **`@starting-style` + `transition-behavior: allow-discrete` overlay enter/exit, sourced from the `--spring-*` `linear()` tokens** (which keyframes.js already feeds glass-ui). Animate top-layer overlays in/out with zero JS enter/leave hooks once gap 1 lands. Guide: `animate-to-from-top-layer`.
4. **`.disabled-base` token-backed utility** (`opacity: var(--opacity-disabled); pointer-events:none`) to absorb the demo's `.is-disabled {opacity:.5}` + menubar `data-[disabled]:opacity-50` + bare `opacity-50` (the constellation-ui union candidate). One token, one meaning, ≥2 consumers express it three ways today. Guide: `css` §5.
5. **(carry-over from constellation-ui) `Menubar` component + tab-trigger `pill`/`underline` variants + `ribbon` button size** — structural gaps that force the demo to vendor a 15-file shadcn-vue menubar tree; orthogonal to modern-web but the same "should be in glass-ui" leverage.

---

## Conformance scorecard

| Category | ✓ conformant | ✗ drift | + opportunity | N/A |
| :--- | :-: | :-: | :-: | :-: |
| accessibility | 4 | 4 | 1 | |
| built-in-ai | — | — | — | ✓ |
| css | 4 | 2 | 1 | |
| css-layout | 4 | 1 | 0 | |
| forms | 2 | 2 | 0 | (auth N/A) |
| html | 4 | 3 | 1 | |
| passkeys | — | — | — | ✓ |
| performance | 6 | 3 | 3 | |
| privacy | 2 | 1 | 0 | |
| security | 3 | 3 | 1 | |
| user-experience | 4 | 3 | 2 | |
| webmcp | — | — | — | ✓ |
| **Total** | **33** | **22** | **9** | 3 cats |

(drift de-dup note: A11Y-1≡HTML-1 and A11Y-2≡FORMS-1 are the same physical defect booked under both governing categories; the P0/P1 table counts each once. Net distinct drift findings ≈ 19.)

---

## Delta vs the prior analysis

**CONFIRMS** (the prior posture analysis `2026-06-01-modern-web/keyframes.md` got the two headline library drifts right):
- The combined-transform-string drift (UX-1) and the JS-`ScrollTimeline`-vs-`animation-timeline` drift (PERF-2) are real, correctly scoped, and remain the two genuine *library-level* drifts. The "glass-ui overlays → native top-layer" cross-repo lever (HTML-3 / gap 1) is confirmed as the single highest-leverage item.
- The `linear()`-spring-emission, WAAPI-delegation, reduced-motion, critical-CSS-build conformant set is confirmed verbatim with file:line.

**EXPANDS** (this proper audit surfaces what the top-N posture scan did not):
- **Two P1s the prior analysis missed entirely:** (a) **zero semantic landmarks** in the whole demo (A11Y-1/HTML-1 — verified `grep` = 0) and (b) **no CSP/`_headers` at the edge** (SEC-1 — `public/_headers` confirmed absent). Neither appeared in either baseline.
- **The `sanitizeSVG` XSS gap** (SEC-2) — a `<script>`-only regex strip on `v-html`'d user SVG — was not in either baseline; it is a concrete security finding.
- **Label-association gaps** (A11Y-2/FORMS-1, ≥12 sites, verified 0 `for=` attributes) — a forms/a11y class the posture scan didn't enumerate.
- `useScrollFade` (PERF-3) is added as a *third* scroll-driven drift beside `ScrollTimeline` (the prior analysis listed it once under UX; here it's correctly split: fade-half → CSS, overflow-detection-half → stays JS).
- `content-visibility` opportunities (PERF-O1/O2), the Google-Fonts third-party origin (PRIV-1), and the `X-UA-Compatible` legacy meta (HTML-2) are new.

**CORRECTS / SHARPENS:**
- The prior analysis framed `ElementMorph`'s FLIP and the combined-string as two findings; this audit separates them cleanly (UX-1 = string-concat, Baseline-2022, S-effort, *always* applicable; UX-2 = FLIP→View-Transitions, M-effort, *DOM-case-only*) and adds the **inv-30 residual** for each: the `MorphRect` overload is the non-DOM differentiator native VT cannot subsume.
- The **inv-30 verdict is made explicit and load-bearing** (it was implicit in the prior "nuance" notes): native subsumes the DOM-element paths of `ScrollTimeline`/`ElementMorph`; the off-DOM solver + custom-renderer opt-out (`renderer.ts:24-31`) + WAAPI-ineligible JS lanes (`waapi.ts:74-94`) are the surviving core. The library should narrow to its differentiator, not be replaced.
- **inv-29 floors are now attached to every modern rec** (combined-string is the floor under individual-props; Vue `<Transition>` is the floor under VT; reka-ui is the `@supports`-false floor under native overlays; DOMPurify is the floor under the Sanitizer API) — none of these is a Safari/Firefox rip-out.
