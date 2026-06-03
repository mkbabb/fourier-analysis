# J.WC — Frontend grand-audit fold (constellation 2026-06-02)

> **Scope**: REFINEMENT, additive. Seeds J's WC design wave (W5) + the CSP/tail
> wave (W7) with the grounded defects the constellation grand-audit surfaced for
> fourier. Consumes the MASTER-FINDINGS ledger
> (`value.js:docs/tranches/K/audit/visual-evidence-2026-06-02/grand-audit/MASTER-FINDINGS.md`
> §A fourier rows · §B owner matrix · §E themes 1/3/5) + the live capture
> `grand-audit/fourier-visualize-prod.png`. Repo-qualified seed, NOT copied.
> Every row cites a real `web/src/` file:line confirmed at HEAD (glass-ui
> `^3.1.0`, `web/package.json:14`) or the capture; each REPLACES a hand-rolled
> thing or discharges a named mandate. NO new code touched in this doc.

This doc is the fourier consumer of the grand-audit. It threads its UI rows into
the **already-declared WC wave (W5)** — the same surfaces (`§5` of the remix
spec: the configurator stage, the gallery grid, the diff-viewer, the publish UI)
— and the named defects into **W7 (CSP/tail)**. It does NOT open a new wave; it
sharpens the two waves J already has, plus folds three forward-carried items
(P5, e2e/axe, the cross-page VT gap) into **terminal dispositions**.

---

## §A — The keystone: the empty-state void (configurator side stays RIGHT, reversibly)

> **⚠ SUPERSEDED BY CONSTELLATION DEC-1 (2026-06-03, user-ratified).** The original
> "controls → LEFT" mandate was reconsidered. **Resolution: keep the configurator
> aside on the RIGHT** (the inspector / result-as-protagonist idiom, consistent with
> value.js · muster · sudoku · speedtest). The user's instinct was reacting to the
> **empty-state void**, not the side: ~75% dead dot-grid stage + the upload card
> marooned top-right reads as "wrong" — but flipping the side just maroons the same
> card top-*left* over the same void. **fourier's PRIMARY ship is the void-fix**
> (the "compose the void" row below): a generous centered `glass-resting` dropzone
> that claims the stage, controls staying RIGHT as the inspector. The glass-ui
> `asideSide` variant is still built — as a **reversible capability defaulted to
> `'right'`** — so a LEFT flip is a **one-prop, user-taste option** (not a mandate),
> available anytime if the authoring-rail reading is later preferred. The grounded
> analysis below stands; only its disposition changes: **void-fix = SHIP (W5);
> asideSide = capability (default RIGHT); LEFT-flip = OPTIONAL/user-taste.**

**The defect (capture-confirmed).** `grand-audit/fourier-visualize-prod.png`:
the controls aside is pinned **RIGHT** (the `Image — source input` panel at
≈x=1031, w=400) over a vast empty dot-grid stage with only a tiny dashed
dropzone center-left — ~75% dead negative space, all interactive content exiled
top-right. The mandate is **controls-LEFT**: the configurator-side approach as it
stands is abrogated.

**Where it lives (file:line, confirmed).**

| Site | Evidence | What it is |
|---|---|---|
| `web/src/components/visualization/VisualizationView.vue:194` | `<Configurator scroll-mode="auto" class="viz-configurator">` | the chassis |
| `…VisualizationView.vue:196` | `<template #stage>` = canvas (DOM-first → renders LEFT) | stage-first source order |
| `…VisualizationView.vue:252-277` | controls aside (default slot, DOM-last → renders RIGHT) | the aside the mandate moves |
| `…VisualizationView.vue:322,326,329` | `grid-template-columns: minmax(0,1fr) minmax(320px,360px)` ×3 breakpoints | **the workaround** — tunes the aside WIDTH band but cannot move the SIDE |

The host already overrides `grid-template-columns` at 3 breakpoints (1024/1280/1536px) — a band-aid that proves the seam is wrong: the side is owned by the **primitive's** stage-before-aside source order + its grid-column placement (`glass-ui Configurator.vue:103,130-131`, per §A). A host `:deep` cannot flip the side without a DOM reorder, and a DOM reorder regresses tab order (a11y). So the fix MUST be in the primitive.

**Disposition — `J.WC-A` · SHIP (W5), gated on the glass-ui ADOPTION ASK.**

| Step | Owner | Action |
|---|---|---|
| **ASK-AS-asideSide** | **glass-ui** (§B owner matrix, the KEYSTONE P0) | Add `Configurator` prop `asideSide: 'left' \| 'right'` (default `'right'`), flipping via **grid-column placement + the seam-border side**, NOT DOM reorder (preserve tab order — visual flip, zero a11y regression). Add an `asideWidth` / `--configurator-aside-min` token band so consumers stop overriding tracks. **Must-land-before** this fourier flip. |
| fourier consume | fourier-J (W5) | After glass-ui ships it: set `<Configurator aside-side="left">` (`VisualizationView.vue:194`) and **DELETE** the 3 breakpoint `grid-template-columns` overrides (`:322,:326,:329`) + replace with the `asideWidth` token. NO local `:deep` grid hack survives. |
| morph the swap | fourier-J (W5) | Wrap the side-set in the already-shipped glass-ui `startViewTransition` so the column **morphs**, not cuts (the canvas already carries `view-transition-name: viz-canvas-stage`, `:313` — the stage geometry-morphs as the aside crosses). Gated on the existing `supportsViewTransitions()` + PRM carve (`router/index.ts:14-17`). |
| **compose the void (PRIMARY ship, DEC-1)** | fourier-J (W5) | The empty stage becomes intentional protagonist space: a generous bounded `glass-resting` dropzone claiming a real share of the stage (replacing the tiny dashed box, `VisualizationView.vue:196-278`) — **controls stay RIGHT as the inspector**. This is §A's "empty stage = unbalanced void" row, the PRIMARY fix, **independent of any side flip** (per DEC-1 this ships regardless; the asideSide flip is the optional user-taste add-on). |

> This is constellation theme §E-1: the configurator-side pattern is contested in
> 3-4 repos (fourier RIGHT→LEFT, muster, speedtest, value.js) and resolves to
> ONE glass-ui prop. fourier is the **mandate-bearing consumer**; it does not
> hand-roll the flip. **OPEN QUESTION**: the asideSide prop is glass-ui-owned and
> must-land-before W5 — fourier's W5 is gated on glass-ui's AS wave.

---

## §B — CSP + font-delivery (W7 — the named deploy mandates)

The grand-audit named four delivery defects. Re-grounded against HEAD, two are
**live** in fourier's tree, two are **STALE/refuted** (the index.html the audit
cited differs from HEAD — HEAD already vendors CM same-origin and uses no CDN).
Terminal dispositions for all four:

| # | Mandate | HEAD evidence | Disposition |
|---|---|---|---|
| **B1** | **CSP `font-src 'self'` blocks the inlined KaTeX `data:font/woff2`** (math typography degraded). | `web/public/_headers:64` (+`web/dist/_headers:64`) `… font-src 'self'; …`; `web/dist/assets/index-*.css` carries **1** `data:font/woff2` (Vite-inlined KaTeX face). | **SHIP (W7).** Do **NOT** loosen CSP to `data:` — set `build.assetsInlineLimit: 0` in `web/vite.config.ts` so EVERY KaTeX face emits as a same-origin `url(/assets/…woff2)` that `'self'` already permits. The CSP stays tight; the violation disappears at the source. (MASTER-FINDINGS §A "Do NOT loosen CSP to `data:`".) |
| **B2** | **script-src blocks the Cloudflare Insights beacon** (allow or drop). | HEAD source carries **NO** beacon: `grep cloudflareinsights\|beacon` web/ → 0 live (only a doc-comment at `AppHeader.vue:75`). The beacon is a deploy-platform injection, not in the tree. | **KILL-as-moot (recorded).** There is no beacon in fourier's source to allow-or-drop; `script-src 'self' 'unsafe-inline'` (`_headers:64`) is correct as-is. If CF Pages later auto-injects `static.cloudflareinsights.com/beacon.min.js`, the **deploy tranche** (§B owner matrix: CSP/security standard, deploy-owned) decides allow-vs-disable at the platform — fourier does not pre-loosen its CSP for a beacon it does not emit. Recorded so it is not re-raised. |
| **B3** | **CM font preloads missing `crossorigin` → double-fetch, slow first paint.** | `web/index.html:11-13` — 3 preloads (`cmunrm.woff`, `cmunbx.woff`, `cmunti.woff`) `as="font" type="font/woff"`, **no `crossorigin`**. (The audit cited `:11-14`/`.woff2`; HEAD is `:11-13`/`.woff` — same defect, refreshed lines.) | **SHIP (W7).** Add bare `crossorigin` (= anonymous) to all 3 preload links. `@font-face` fetches are always anonymous-CORS; without the attribute the preload mode mismatches the face fetch → preload discarded + re-fetched. One-attribute fix per line. Same-origin so no `Access-Control-Allow-Origin` server change needed. |
| **B4** | (audit residual) CM-Serif `data:`-font + crossorigin-mismatch in the live CSS. | STALE: HEAD `fonts.css` serves CM via same-origin `url(/fonts/Serif/…)` (`index.html:11-13,19`), not `data:`. The ONLY live `data:`-font residual is the KaTeX face (B1). | **KILL-as-moot (recorded).** Subsumed by B1; no separate CM `data:` font exists at HEAD. |

> §B all lands in **W7** (the existing CSP/tail wave) — it is already scoped to
> "per-consumer CSP propagation of H.γ's recipe, confirm intact post-remix/
> publish-endpoints" (`J.md §4`, W7). B1+B3 are additive build/HTML edits behind
> the inv-29 floor; B2/B4 are recorded KILLs. **OPEN QUESTION**: the canonical
> CSP/security-header standard is deploy-owned (§B owner matrix); fourier's
> `_headers` *derives*. The KaTeX-same-origin + beacon decision should be ratified
> against the deploy standard at W7, not invented locally.

---

## §C — Reduced-motion: the epicycle viz loop (P1)

**The defect (file:line, confirmed).** The epicycle rAF marquee has **off-screen
gating (I.γ) but ZERO `prefers-reduced-motion` gate** — while 12 other surfaces
across the app are PRM-disciplined (e.g. the VT morph `router/index.ts:14-17`,
the scroll-progress `PaperView.vue`).

| Site | Evidence |
|---|---|
| `web/src/stores/animation.ts:51-75` | `startLoop()` → `tick(now)` reschedules `requestAnimationFrame(tick)` forever; gated only on `playing && anyCanvasVisible` (`:53,:59`). No PRM check. |
| `web/src/stores/animation.ts:21` | `const playing = ref(false)` — default paused, BUT once the user presses play the marquee oscillates perpetually with **no PRM escape**. A vestibular user who opts into one cycle gets unbounded oscillation. |
| `grep -n "prefers-reduced\|matchMedia" web/src/stores/animation.ts` → **0** | the gap, confirmed. |

**Disposition — `J.WC-C` · SHIP (W5, motion lens).**

| Action | Detail |
|---|---|
| Gate the loop on PRM | In `startLoop()` (`animation.ts:51`): when `matchMedia('(prefers-reduced-motion: reduce)').matches`, render a **single static frame** at the current `t` (or `t=1` for the converged partial sum) and do NOT reschedule — require an explicit, deliberate `play()` to advance, and re-check PRM live (the user can toggle the OS setting mid-session). The `easedT`/`t` reactivity already redraws the canvas on a single `t` write, so a static frame is a one-line `t.value = …` with no rAF. |
| Compose the primitive | Prefer the glass-ui motion family over a bespoke `matchMedia` call: the loop is the textbook case for a **reduced-motion-aware RAF primitive** (`useRAFLoop` + `useIntersectionPause`, §B owner matrix "Animation engine"/glass-ui /motion) that pauses off-screen/tab-hidden AND under PRM. fourier already hand-rolls the off-screen half (the I.γ ref-counted visibility, `animation.ts:43-44,99-106`) — adopting `useRAFLoop` folds the I.γ visibility gating AND the missing PRM gate into ONE shipped primitive, retiring the manual `visibleCanvases` ref-count. |

> This is §E-5 (reduced-motion holey on the heaviest motion surfaces) — fourier's
> row is the epicycle marquee. It is fourier-LOCAL (the loop lives in fourier's
> store); the only glass-ui dependency is the OPTIONAL adoption of `useRAFLoop`
> (already shipped on /motion). If the adoption slips, the inline PRM gate ships
> regardless — the P1 defect does not wait on a refactor. **Reverses the §4.1
> claim** that fourier has "no motion wave that earns work": the WC motion lens
> (W5) is precisely where this lands, and it is a genuine P1, not micro-polish.

---

## §D — CRUD / REMIX functional test (J's core — the remix WRITE side)

J's CORE is the remix WRITE side (`POST /:slug/remix`, the fork+atom-diff write
sequence `design/J.W1-crud-remix.md §11`). The grand-audit is a frontend lens; J
must not let the **functional** remix gate be eclipsed by chrome. This row keeps
the WRITE-side test first-class and binds it to the WC surfaces.

**Disposition — `J.WC-D` · SHIP (W6 evidence wave — already declared; this row
sharpens it).**

| Gate | Surface | Test (the WRITE side, not just READ) |
|---|---|---|
| remix flow | the gallery card → remix action (the `most-forked` consumer, `J.W1 §5 consumer-1`) | e2e: create viz → remix → assert a NEW `VisualizationVersion` with `{parent_hash, set_hash, atom_diff}` (the genuinely-new persisted shape) → `GET /diff?from=` returns the canonical `ops` envelope (`design/J-diff-shape.md`) → `/provenance` walks single-parent back to root. Asserts the WRITE happened, not just that a READ endpoint answers. |
| fork_count write-back | the gallery `most-forked` sort | assert `fork_count` **incremented** on the source after remix (the phantom-sort repair, `api/lib/crud/cursors.py:21` was the never-written field) — the sort is no longer phantom. |
| no-op guard | the remix action | assert a no-change remix → `422 urn:contract:remix-noop` (`J.md §7`), surfaced as a visible `:user-invalid`-style state in the UI, NOT a swallowed `catch {}`. |
| publish flow | the publish/unpublish verb pair (`J.W1c`, consumer-3) | e2e: publish → public-listed → unpublish → delisted → **re-publish-private does NOT duplicate** (flips the flag in place, `J.W1c §4`). |
| diff-viewer render | `GET /diff` → CSS Custom Highlight (see §F) | axe-clean over the changed/added/removed range layout; the highlight ranges are programmatically reachable (the diff is screen-reader legible, not a pure-visual color diff). |

> This row is already J.W6's content (`J.md §4` W6) — it is restated here so the
> grand-audit fold does not let the design lenses crowd out the **CORE WRITE
> evidence**. No new wave; it pins the e2e remix/publish gate to the WC surfaces
> the design lenses dress. inv-27: all of §D rides ONE green fourier CI run.

---

## §E — Modern-web web-platform leaf wins (W5/W4 — grounded, terminal)

Each REPLACES a hand-rolled mechanism with a shipped web-platform / glass-ui
primitive. Grounded at HEAD; terminal dispositions.

### E1 — Cross-PAGE View Transition: `/paper ↔ /visualize ↔ /equation` (P1)

**Defect.** The viz↔viz morph ships (`isVizMorph`, `router/index.ts:20-26`,
gates only `{visualization, workspace}`), but the PRIMARY nav (the AppHeader tab
dropdown jumping `/paper`↔`/visualize`↔`/equation`) is a **bare instant
`RouterView` swap** (`App.vue:26-27` `<main><RouterView/>`), dressed only by the
0.18s `tab-slide-in` keyframe (`style.css:83-90`). J's I.ε VT arm covers the viz
morph, NOT this cross-page pair.

**Disposition — `J.WC-E1` · SHIP (W5, motion lens).** Widen `isVizMorph`
(`router/index.ts:20-26`) to bracket the paper↔visualize↔equation page pairs —
this **reuses the existing parked-promise + rAF-release dance** (`router/index.ts`
`afterEach`) + the glass-ui `::view-transition-*` cross-fade (already shipped).
A whole-root cross-fade needs NO per-element name; scope the shell name OFF the
viz routes so a viz→viz morph does not also cross-fade the shell (it must stay
mutually exclusive with `viz-canvas-stage`, `VisualizationView.vue:313`). glass-ui
`startViewTransition` already never-rejects on `.finished` (shipped). **Reverses
the §4.1 "no route-morph surface that earns a VT wave" claim** — the cross-page
nav is exactly that surface, and the grand-audit grounds it (`App.vue:27` is a
bare swap).

### E2 — Equation-variable hover → CSS Custom Highlight (P2)

**Defect.** `web/src/components/equation/composables/useCoeffHover.ts` (106 LoC)
is a per-mousemove JS machine: `closest('.eq-coeff')` (`:29`) + `getBoundingClientRect`
(`:37-38`) + a `CLASS_MAP` scan (`:12-17,33`) + a manually-positioned popover
(`:39-42`) to surface which coefficient family (`a_n`/`b_n`/`c_n`/`A_n`) the
cursor is over. Geometry math on every mousemove. (Distinct surface from J.W1's
diff-viewer Custom Highlight — this is the EquationView hover.)

**Disposition — `J.WC-E2` · SHIP (W5), gated on the glass-ui ADOPTION ASK.**

| Step | Owner | Action |
|---|---|---|
| **ASK-AS-useTextHighlight** | **glass-ui** (§B owner matrix) | Author `useTextHighlight` on `/motion-core` — `CSS.highlights` + `Highlight` ranges, styled via `::highlight()`. Net-new; glass-ui authors FIRST. ≥2 real consumers + glass-ui's own = 3 sites (fourier equation vars, words search marks, glass-ui's own `FuzzySearch` `<mark>` splitter retired). |
| fourier consume | fourier-J (W5) | Replace `useCoeffHover`'s mousemove machine with `CSS.highlights` over the `.eq-an`/`.eq-bn`/`.eq-cn`/`.eq-An` spans: hovering one `a_n` lights the **whole family declaratively** via `::highlight(eq-an)`, no `getBoundingClientRect`, no CLASS_MAP scan, no manually-positioned popover. The numeric readout (`popoverHtml`, `useCoeffHover.ts:52+`) stays as a separate concern. Feature-detect `CSS.highlights` with the existing hover as the floor (inv-29). |

> §B owner matrix: glass-ui authors `useTextHighlight`; fourier is consumer-1.
> **OPEN QUESTION**: net-new glass-ui primitive, must-land-before this W5 leaf.
> This is also the natural lever for the **diff-viewer** (the G6 CSS-Custom-
> Highlight diff render, `J.md §8 named-forward`) — ONE primitive serves both
> the equation hover AND the diff ranges.

### E3 — View Transitions /paper↔/visualize + content-visibility on paper (P2)

**content-visibility is already SHIPPED** on the paper sections
(`web/src/components/paper/PaperArticleWindow.vue:146-165` — `content-visibility:
auto` + measurement-safe `contain-intrinsic-size: auto …` from glass-ui's
canonical `.deferred-section`). The grand-audit "content-visibility on paper
sections" mandate is **already discharged** at HEAD. **Disposition —
`J.WC-E3` · KILL-as-already-shipped (recorded).** No work; recorded so it is not
re-raised. The /paper↔/visualize VT half is folded into E1.

### E4 — `transition: all` residual sites (P2)

**Defect.** ≥3 `transition-all` sites survive in an otherwise named-property
codebase (the C1 sibling), animating layout/color/filter off the compositor.

**Disposition — `J.WC-E4` · SHIP (W5, motion lens), or BOOK if HEAD-clean.**
Re-ground at W5 (the audit cited `ImageUpload.vue:53,67,71`,
`CoefficientsSpectrum.vue:91`; some may have moved since the capture). Replace
each with the explicit compositor property: `transform: scaleX()` for the
width-driven spectrum bar (not `width`), `opacity` for the image overlay; bind to
`--duration-*` tokens (app-local convention). If `grep -rn "transition.*\ball\b"
web/src` returns 0 at W5, record as KILL-already-clean. Terminal either way.

### E5 — Epicycle trail flat-alpha wake (P2)

**Defect (file:line, confirmed).** `web/src/components/visualization/lib/canvas-drawing/trail.ts:76-95`
strokes the entire tail at ONE `ctx.globalAlpha = 0.9` (`:84`) in a single
`ctx.stroke()` (`:93`) — reads as a static curve, no decaying motion wake.

**Disposition — `J.WC-E5` · SHIP (W5, motion lens).** Taper alpha tail→tip
(oldest ≈0.1, tip ≈0.9) so the wake fades behind the moving pen — a per-segment
`globalAlpha` ramp (app-local canvas idiom, no primitive). Keep the
golden-shimmer for the hovered state. ~6 LoC; the `x`/`y` arrays already carry
the sample order (`trail.ts:88-92`).

### E6 — Direction-blind tab-slide-in (P2)

**Defect (file:line, confirmed).** `web/src/style.css:83-90` — `[data-state=active]
[role=tabpanel]` always enters from `translateX(8px)` (`:88`) regardless of nav
direction; Paper→Viz and Viz→Paper enter identically.

**Disposition — `J.WC-E6` · SHIP (W5, motion lens) — FREE on E1's VT engine.**
Once E1 widens the cross-page VT, the directional cross-fade rides the VT
`::view-transition-old/new` (the page geometry morphs in the nav direction). If
E1 slips, the fallback is a directional `translateX`: `+X` rightward / `−X`
leftward (sign of from→to tab index), honoring the existing PRM carve
(`style.css:92-95`). Terminal: ships with E1 or as the standalone directional
keyframe.

---

## §F — Chronic items — TERMINAL dispositions (no perpetual punts)

J's chronic-resolution gate (`J.md §7`) demands every carried item exit with a
terminal verdict. The grand-audit forward-carries two fourier chronics; both get
terminal dispositions here.

| Chronic | Age / source | Terminal disposition |
|---|---|---|
| **P5 — `ConfiguratorLayer` INNER-section rounding** (the literal user defect: squared inner sections) | I→J chronic (`MASTER-FINDINGS §A` "P5"; `glass-ui-P5-inner-rounding` ADOPTION-ASK, `J.md §8`, `ADOPTION-ASKS §7`) | **BOOK → glass-ui (owner), SHIP-on-adopt at W5.** This is glass-ui-owned (`ConfiguratorLayer` inner-rounding is a primitive token/recipe, §B owner matrix). glass-ui ships the inner-rounding fix; fourier ADOPTS it (consumes `^3.1.x`+ with the fix). NOT marked satisfied until fourier's `ConfiguratorLayer` inner sections actually round (visual-evidence before/after at W5, per the constellation π-lane). **Trigger**: glass-ui's rounding fix lands. **Owner**: glass-ui. NOT a 3rd book — it is BOOKED with a named external gate, which the chronic-resolution gate permits. |
| **e2e/axe CI evidence** (inv-27 proof — the I-deferred green-run claim) | I→J chronic (`MASTER-FINDINGS §A`; `J.md §4` W6) | **SHIP → W6 (already declared, terminal).** The remix/publish e2e (§D) + axe on the gallery/diff-viewer/WC-refined UI, all as ONE GREEN fourier CI run (inv-27 — the green claim I could not make in-session). This is the wave W6 EXISTS to discharge; the disposition is SHIP-at-W6, no further deferral permitted (J's close gate `J.md §7` blocks on it). |

> Both forward-carried chronics now have terminal verdicts: P5 BOOKED with a
> named glass-ui gate + a visual-evidence satisfaction test; e2e/axe SHIP at W6.
> Zero perpetual punts (the `J.md §7` chronic-resolution gate).

---

## §G — Owner matrix (the glass-ui ADOPTION ASKS this fold raises)

Per the §B owner matrix — fourier consumes, it does not hand-roll shared
primitives. The asks this fold raises (or confirms):

| Ask | Owner | fourier role | Serial constraint | net-new vs adoption |
|---|---|---|---|---|
| **Configurator `asideSide:'left'\|'right'` + `asideWidth` token** | glass-ui | mandate-bearing consumer (§A) | **must-land-before** fourier's W5 flip; flip via grid-column + border-side, NOT DOM reorder (a11y) | net-new prop (story exists) |
| **`useTextHighlight`** (CSS Custom Highlight composable, /motion-core) | glass-ui | consumer-1 (equation vars §E2; + the diff-viewer G6) | glass-ui authors FIRST; ≥2 consumers + glass-ui's own | net-new |
| **`useRAFLoop` + `useIntersectionPause`** (PRM+off-screen-aware RAF) | glass-ui /motion (shipped) | adopt for the epicycle loop (§C) — folds I.γ visibility + the missing PRM gate | shipped; pure adoption (inline PRM gate ships regardless) | adoption |
| **`startViewTransition`** (never-rejects `.finished`) | glass-ui (shipped) | widen the cross-page bracket (§E1); morph the aside flip (§A) | shipped | adoption |
| **`ConfiguratorLayer` inner-rounding fix** (P5) | glass-ui | adopt + visual-evidence satisfaction (§F) | glass-ui ships the rounding fix first | glass-ui token/recipe |
| **CSP/security-header standard** (KaTeX same-origin, beacon decision) | deploy | derive fourier's `_headers` (§B) | deploy owns the canonical standard | standard-defines, app-derives |

---

## §H — Wave fold summary (no new wave; sharpens W5/W6/W7)

| Item | Disposition | Wave |
|---|---|---|
| §A controls aside RIGHT→LEFT (`J.WC-A`) | SHIP, gated on glass-ui asideSide | W5 |
| §A empty-stage void → first-class composition | SHIP | W5 |
| §B1 KaTeX `data:`font → `assetsInlineLimit:0` | SHIP | W7 |
| §B2 CF Insights beacon | KILL-as-moot (no beacon in tree) | recorded |
| §B3 CM preload `crossorigin` | SHIP | W7 |
| §B4 CM `data:`font residual | KILL-as-moot (HEAD same-origin) | recorded |
| §C epicycle loop PRM gate (`J.WC-C`) | SHIP (P1) | W5 (motion) |
| §D remix/publish WRITE-side e2e | SHIP (CORE evidence) | W6 |
| §E1 cross-page VT widen | SHIP (P1) | W5 (motion) |
| §E2 equation hover → Custom Highlight | SHIP, gated on glass-ui useTextHighlight | W5 |
| §E3 content-visibility on paper | KILL-as-already-shipped (`PaperArticleWindow.vue:146`) | recorded |
| §E4 `transition:all` residuals | SHIP-or-KILL-if-clean | W5 (motion) |
| §E5 trail flat-alpha wake taper | SHIP | W5 (motion) |
| §E6 direction-blind tab-slide | SHIP (free on E1) | W5 (motion) |
| §F P5 inner-rounding | BOOK → glass-ui, SHIP-on-adopt | W5 |
| §F e2e/axe inv-27 proof | SHIP (terminal) | W6 |

**Net.** This fold adds NO wave. It sharpens **W5** (the WC design wave — §A
aside-flip + §C/§E motion lens + §E2 highlight + §F P5), **W6** (the evidence
wave — §D remix/publish WRITE-side e2e + axe), and **W7** (the CSP/tail wave —
§B1/B3). Two glass-ui ADOPTION ASKS gate W5 (asideSide, useTextHighlight); both
are §B-owner-matrix net-new primitives that must-land-before fourier consumes.
Every fourier-local item is grounded at a HEAD file:line and discharges a named
mandate; nothing is hand-rolled that belongs in glass-ui.
