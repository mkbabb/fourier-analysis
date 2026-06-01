# Modern-Web Modernization — Forward Tranche Plan

**Run:** 2026-06-01-modern-web · **Author:** modernization PLAN author · **Mode:** TRANCHE-DEVELOPMENT (waves, not implementation)
**Lens:** Chrome `modern-web-guidance` v0.0.170 (12 categories) — the north star
**Inputs:** the 6 per-repo modern-web reports (`fourier.md`, `value.js-color.md`, `glass-ui.md`, `keyframes.md`, `words.md`, `speedtest.md`) + the constellation style-audit (`../2026-06-01-constellation-ui/style-audit.md`)
**Predecessor state:** fourier tranches A–H all CLOSED GREEN (ordering κ′, `docs/tranches/CANONICAL-ORDERING.md §17`); no fourier tranche open. This plan proposes the **next constellation arc**.

---

## (1) Thesis — the modernization opportunity, and the leverage principle

### The opportunity

Across all six frontends the modern-web audits converge on the same verdict: **these are already-strong, heavily-audited surfaces** (physics `linear()` springs as CSS tokens, `prefers-reduced-motion` everywhere, self-hosted fonts on most, `color-mix`/`dvh`/container-queries/`:has()`, native `<dialog>` for modals on the leaders). The drift is therefore **not pervasive** — it is **concentrated, repeated, and high-value**, and it clusters into a small number of cross-repo themes that the platform has only recently made native:

1. **Overlay positioning is still 100% JS** (`@floating-ui` via reka-ui) in glass-ui — the substrate under *every* consumer's tooltips, popovers, dropdowns, hover-cards, selects. CSS **anchor positioning** + the **popover API** + the **top layer** now do this declaratively (glass-ui D1/D2; value.js D1/D2/D3; words tooltip; speedtest #3; keyframes O5). Each consumer additionally hand-rolls its *own* tethered popover on top of the shared one (value.js `useHoverPopover`, words `useInlineWordLookup`, speedtest `MapTooltip` phantom-anchor) — a bug-class (`useDialogOverlayGuards` teleport-detection) that exists *solely* because of the JS-portal model.
2. **No `content-visibility`** on the heaviest surfaces — fourier's 97-page windowed paper + off-screen 60fps canvas, speedtest's admin tables + chart cards, words' definition sections, glass-ui's long demo stories. The single biggest unrealized perf/INP lever, near-zero risk (fourier A; glass-ui D8; speedtest #5; words E).
3. **JS scroll-listeners driving visuals** where CSS scroll-driven animation (`animation-timeline: scroll()/view()`) now runs on the compositor — glass-ui `useScrollProgress`, words header-shrink, keyframes `ScrollTimeline`/`useScrollFade`, fourier's IO-toggled floating TOC.
4. **No View Transitions** on any SPA route swap or shared-element morph, despite every app being an SPA with a persistent chassis — and three apps hand-rolling FLIP morph engines (speedtest `useCompletionChoreography`, keyframes `ElementMorph`, plus fourier's `/w/`↔`/v/` remount-flash).
5. **Combined `transform` strings on hover/state** without the mandated base identity + individual `translate`/`scale` props (glass-ui D3 — `dock.css`, the 9-site cartoon-lift; keyframes `ElementMorph`/`morph.ts`). This is *also a hard prerequisite for anchor positioning*: a hover-only combined `transform` creates a containing-block shift that breaks `anchor()`.
6. **Image hygiene** — missing intrinsic dimensions (CLS) + PNG-only + JS lazy-load state machines that native `loading=lazy`/`<picture>` delete (fourier paper figures + gallery thumbs; words `CarouselSlide`; keyframes/value.js previews; speedtest LCP `<img>`).
7. **Forms/autofill/native-`<select>`** gaps — value.js's 5 JS comboboxes vs `appearance: base-select`; glass-ui's `0` `:user-valid`/`field-sizing`; words' search field missing `<search>`/`enterkeyhint` (forms category, largely untouched constellation-wide).
8. **Security/CSP/analytics-batching** tail — fourier already shipped a CSP `_headers` in H.γ; speedtest's per-event beacons want `fetchLater()`; no passkeys surface exists yet (auth is Clerk-delegated in words, none elsewhere) — so the "passkeys" lane is **thin/booked**, not a wave.

### The leverage principle (the spine of the sequencing)

> **glass-ui is the shared design system. An adoption that lands in `glass-ui/src` propagates to every consumer (fourier, value.js, words, speedtest, keyframes-demo, bbnf-buddy) at once. Therefore glass-ui-rooted waves rank highest, and within them the *substrate* fixes (overlay positioning, transform discipline) rank above leaf fixes.**

This is the exact convergence the two audits independently found:

- The **style-audit's top-5 glass-ui gaps** (summed cross-app call-site demand) are *all* glass-ui-rooted: dead glass-tier classes (4 apps, ~16 sites), partial-glass a11y bracket (4 apps, ~18), **hover/press scale utility (5 apps, ~69 — largest demand)**, `.focus-ring` collapse (44), inline-pill primitive (~30). Plus the **Configurator root-rounding DEFECT** (the squared `ConfiguratorLayer`, `glass-ui-root-rounding.patch` already drafted).
- The **modern-web opportunities that land in glass-ui** are the highest-rated in *four of six* reports: value.js O1 (native overlay primitive — "single highest-leverage move"), glass-ui's own #3 (anchor-positioned overlay variant — "highest eventual leverage"), keyframes O5 ("highest cross-repo leverage"), speedtest A ("≥9 sites in speedtest alone, plus fourier"), words B ("highest cross-repo leverage").

**The two audits reinforce each other at one seam in particular:** the style-audit's gap-#3 *hover/press-scale* and the modern-web glass-ui-D3 *individual-transform-properties* are the **same motion-layer rewrite** — minting `.hover-scale`/`.active-scale` with a base `scale: 1`/`translate: 0` identity using individual transform props simultaneously (a) closes the largest style-audit demand (~69 sites) and (b) satisfies the modern-web `individual-transform-properties` guide and (c) unblocks anchor positioning. That is the highest-ROI first move (see §5).

**Invariant frame.** Cross-repo work is governed by **inv-16′** (authorized-cross-repo-sweep, `INVARIANTS §2`): each cross-repo write is its own commit, booked to an `ADOPTION-ASKS` entry, gated on that repo's own green CI (inv-27). The constellation is **mid-flight** (H.ε recon: keyframes +19, glass-ui +111, words +11, speedtest +563 unpushed) — so most glass-ui-rooted waves are **authored-now / executed-on-clean-checkout** (the H.ε BOOK-ALL posture), not executed against a dirty tree. Adoptions honor: **token-bridged** (consume `--radius-*`/`--scale-*`/`--spring-*`, no literals — style-audit Axis 1), **no-legacy** (no `@supports`-fallback cruft beyond the progressive-enhancement gate the guide itself prescribes; `feedback_no_fallbacks`), **no-codegen** (inv-26 hand-typed-canonical), **progressive-enhancement** (anchor positioning / `base-select` ship *behind* `@supports` with the reka path as the floor — Safari/Firefox parity, not a rip-out).

---

## (2) The WAVE PLAN

Nine themed waves, sequenced by **leverage × dependency** (glass-ui foundations first). Greek-letter thread tags continue the fourier convention (α…ι). Each wave is a *theme* spanning ≥1 repo; the per-repo allocation is §3.

> **Effort key:** S ≤ ½ day · M ≤ 2 days · L > 2 days (cross-cutting). **Impact:** perf / ux / a11y / dx / privacy / security.

### Wave α — glass-ui motion-layer discipline (transform identity + scale utility) — **FOUNDATION**
- **Thesis:** Mint `.hover-scale`/`.active-scale` with a **base `scale: 1`/`translate: 0` identity** + migrate `dock.css`/`cards.css`/`utilities.css` hover/state rules to **individual** `scale:`/`translate:` props; standardize `--scale-press-btn` (0.97 buttons) vs `--scale-press` (0.96 surfaces). Mint the `.hover-cartoon` diagonal-lift the oracle reinvents 9×.
- **Target:** **glass-ui** (lands once, propagates to all).
- **Guide ids:** `individual-transform-properties` (css §9). Style-audit: gap-#3 (scale, ~69 sites), gap-#8 (`.hover-cartoon`, 9), union U-press-scale.
- **Leverage/why:** the **largest summed style-audit demand (~69 sites across 5 apps)** AND the modern-web glass-ui-D3 AND a **hard prerequisite for Wave β** (combined-`transform` hover shifts the containing block, breaking `anchor()`). Two audits, one rewrite.
- **Impact:** ux + dx (kills hover-only stacking-context/anchor jank) · **Effort:** S · **Invariant:** token-bridged (`--scale-*`), no-legacy.
- **Dependency order:** FIRST. Blocks β.

### Wave β — glass-ui native overlay substrate (popover API + anchor positioning + top layer) — **KEYSTONE**
- **Thesis:** Behind `@supports (anchor-name: --x)`, drive flip/shift/arrow for tooltip/popover/dropdown/hover-card/context-menu via `position-area` + `position-try-fallbacks` + `container-type: anchored`; expose a glass-ui `<Popover anchor>` / `interestfor`+`popover="hint"` tooltip primitive. Reka/`@floating-ui` remains the `@supports`-false floor (progressive enhancement, not a reka rewrite).
- **Target:** **glass-ui** substrate; deletes per-consumer hand-rolled popovers downstream (value.js `useHoverPopover`+`useDialogOverlayGuards`, words `useInlineWordLookup`, speedtest `MapTooltip`).
- **Guide ids:** `position-aware-tooltips`, `interest-triggered-tooltips`, `declarative-dialog-popover-control`, `resilient-context-menus-and-nested-dropdowns`, `light-dismiss-a-dialog`, `animate-to-from-top-layer`.
- **Leverage/why:** **the single highest-leverage move named independently by 4 of 6 reports** (value.js O1, glass-ui #3, keyframes O5, speedtest A; words B). Removes a JS positioning runtime from every overlay of every consumer; the native top layer *deletes the entire `useDialogOverlayGuards` bug-class* (a popover inside a dialog is no longer "outside" it).
- **Impact:** perf + a11y + dx · **Effort:** L (largest blast radius) · **Invariant:** progressive-enhancement (`@supports` gate, reka floor), no-legacy.
- **Dependency order:** after α (transform identity). Unblocks the leaf overlay-deletions in θ.

### Wave γ — content-visibility / defer-rendering sweep — **HIGHEST-ROI PERF**
- **Thesis:** Add `content-visibility: auto` + `contain-intrinsic-size` to every heavy off-screen surface; a glass-ui `.deferred-section` utility lands once and is *applied* per-repo. Pause off-screen canvas/WebGL on `contentvisibilityautostatechange` (the render-lifecycle event the guide prescribes for canvas, refining the IO arm). Cache inactive SPA views with `content-visibility: hidden`.
- **Target:** **glass-ui** (the utility + the Aurora `useAurora.ts` pause) → applied in **fourier** (paper window sections + off-screen epicycle canvas + inactive views), **speedtest** (admin tables + chart cards), **words** (definition sections), **value.js** (ghost-pane → `content-visibility: hidden`), **glass-ui demo** (story pages).
- **Guide ids:** `defer-rendering-heavy-content`, `efficient-background-processing`, `faster-spa-view-transitions`, `interactions-in-complex-layouts`.
- **Leverage/why:** **#1 ranked in 3 of 6 reports** (fourier #1, speedtest #1, glass-ui #6); near-zero risk, one utility class. The biggest unrealized lever for fourier's windowed paper + a 60fps canvas burning CPU while scrolled away.
- **Impact:** perf (LCP/INP, battery) · **Effort:** S (utility) + S/M per application site · **Invariant:** no-legacy, token-bridged (`lh`/`ch`-derived `contain-intrinsic-size`).
- **Dependency order:** independent of α/β — **can run in parallel from W0** (the cheapest constellation-wide win).

### Wave δ — CSS scroll-driven animation (retire JS scroll listeners) — **glass-ui-proven pattern**
- **Thesis:** Ship a glass-ui `view()`/`scroll()` CSS recipe (mirror the *already-proven* `CardHeader` `scroll-timeline`) and migrate the JS scroll-listeners onto it, keeping the JS path only as the `@supports`-false (Firefox) floor: glass-ui `useScrollProgress`, words header-shrink, keyframes `useScrollFade`, fourier's IO-toggled floating TOC + the `setTimeout(250)` scroll-nudge.
- **Target:** **glass-ui** (`useScrollProgress` recipe) → applied in **words**, **keyframes-demo**, **fourier**.
- **Guide ids:** `scroll-entry-exit-effects`, `shrinking-header-on-scroll`, `scroll-progress-indicator`, `parallax-scroll-effects`, `scroll-position-aware-elements`.
- **Leverage/why:** moves per-frame main-thread style writes (the worst INP offenders, on the most-scrolled surfaces) onto the compositor; the repo *already proved the native form once* (`CardHeader`) — this generalizes it.
- **Impact:** perf/INP · **Effort:** M · **Invariant:** progressive-enhancement (`@supports`), `prefers-reduced-motion`-bracketed.
- **Dependency order:** independent; pairs naturally with γ.

### Wave ε — View Transitions + scroll-driven UX — **the morph layer**
- **Thesis:** Wrap SPA route swaps + shared-element morphs in `document.startViewTransition`; expose `view-transition-name` token conventions from glass-ui so the carousel/pager/route morphs are consistent. **Retires three hand-rolled FLIP engines** (speedtest `useCompletionChoreography` + `useRouteTransition`, keyframes `ElementMorph` for the DOM case, fourier's `/w/`↔`/v/` remount-flash) and the bespoke `<Transition mode="out-in">` direction machines.
- **Target:** **glass-ui** (`view-transition-name` tokens + a `useViewTransition`/`<RouterTransition>` helper) → applied in **fourier**, **speedtest**, **keyframes-demo**, **words**, **value.js**.
- **Guide ids:** `same-document-transitions`, `directional-navigation-transitions`, `group-element-transitions`.
- **Leverage/why:** every report names it; speedtest B is a **large net code deletion** (retires *two* state machines at once). A glass-ui helper makes the route-morph consistent across ≥4 consumers.
- **Impact:** ux + dx · **Effort:** M (helper) + M per consumer · **Invariant:** progressive-enhancement (`@supports` / Vue-Router `viewTransition`), `prefers-reduced-motion`.
- **Dependency order:** after α (individual transforms compose with VT); benefits from β (top-layer overlays survive VT).

### Wave ζ — native top-layer enter/exit (`@starting-style` + `allow-discrete`) — **decouples motion from Vue**
- **Thesis:** Animate top-layer dialogs/popovers in/out via `@starting-style { … }` + `transition-behavior: allow-discrete` on `display`/`overlay`, sourced from the existing `--spring-*` `linear()` tokens — **zero** Vue `<Transition>` class toggling, survives reka's portal. Repo has 0 `@starting-style`, 0 `allow-discrete` today.
- **Target:** **glass-ui** (`transitions.css` dialog/dropdown/pop recipes).
- **Guide ids:** `animate-to-from-top-layer`. (keyframes O6: spring tokens make the enter/exit half "nearly free.")
- **Leverage/why:** extends a pattern the repo *almost* has (it already emits `linear()` springs); composes with β's top-layer overlays; removes JS enter/leave hooks for every consumer.
- **Impact:** ux + dx · **Effort:** M · **Invariant:** token-bridged (`--spring-*`), no-legacy.
- **Dependency order:** after β (needs native top-layer overlays to animate); pairs with ε.

### Wave η — forms / native-`<select>` / autofill modernization
- **Thesis:** A progressive-enhancement glass-ui `<Select>` (real `<select>` + `::picker(select)` + `<selectedcontent>` behind `@supports (appearance: base-select)`, reka floor); `:user-valid`/`:user-invalid` + `field-sizing: content` on `input/textarea/number-field`; per-consumer native input semantics (words `<search>` + `enterkeyhint`/`inputmode`).
- **Target:** **glass-ui** (`<Select>`, form primitives) → applied in **value.js** (5 combobox sites), **words** (search field).
- **Guide ids:** `branded-select-styling`, `custom-select-picker-layouts`, `select-menu-interaction`, `forms` §1–3, `html` §1 (`<search>`).
- **Leverage/why:** value.js D3 (5 JS comboboxes) + glass-ui D7 (`0` validity/`field-sizing`) + words forms gap — the **forms category is the least-adopted constellation-wide**; native is more robust than the re-implemented listbox.
- **Impact:** perf + a11y + dx + ux · **Effort:** M (Safari lacks `base-select` → PE layer, not removal) · **Invariant:** progressive-enhancement, no-legacy.
- **Dependency order:** independent; can trail.

### Wave θ — image / asset / privacy hygiene (per-repo leaf) — **cheapest wins**
- **Thesis:** `<picture>` AVIF→WebP→PNG + intrinsic `width`/`height` (or `aspect-ratio`) + `loading=lazy`/`decoding=async`/`fetchpriority` across all `<img>`; **delete** the JS lazy-load state machines (words `CarouselSlide` hidden-proxy, fourier's un-dimensioned figures). Self-host/proxy the **fourier GitHub avatar** (restores the genuine zero-third-party-origins posture) + **value.js Google-Fonts → self-host** + `font-size-adjust: from-font`. Also: the per-consumer overlay deletions β enables (value.js `useHoverPopover`/`useDialogOverlayGuards`, words `useInlineWordLookup`, speedtest `MapTooltip`).
- **Target:** **per-repo leaf** — fourier, words, value.js, speedtest, keyframes-demo.
- **Guide ids:** `optimize-image-priority`, `deliver-optimized-decorative-images`, `performance` (Image/Third-Party/CRP), `visually-stable-font-fallbacks`, `privacy`.
- **Leverage/why:** the **lowest-effort/highest-CLS** wins (words #1, value.js #1, keyframes #3, speedtest #3); each is S-effort and self-contained. Self-hosting fonts mirrors fourier's *already-shipped* G-tranche recipe (95/100/100, 0 third-party origins).
- **Impact:** perf (CLS + bytes) + privacy · **Effort:** S each (the figure-transcode arm is M, +API) · **Invariant:** no-legacy (delete the JS machinery, don't wrap it).
- **Dependency order:** independent of α–δ; the *overlay-deletion* sub-arm depends on β.

### Wave ι — security / CSP / analytics-batching / measurement-INP tail — **thin + booked**
- **Thesis:** Propagate fourier's H.γ CSP `_headers` recipe to the other SPAs (per-consumer); `fetchLater({ activateAfter })` analytics batching (speedtest funnel + Cloudflare beacon); `scheduler.yield()`/`scheduler.postTask()` for measurement-time UI work in glass-ui's `useRAFLoop` (speedtest's defining INP-under-load constraint). **Passkeys: BOOKED-only** — no app currently owns a credential surface (words delegates to Clerk; none elsewhere), so passkeys is a named residual, not a wave.
- **Target:** **per-repo** (CSP, fetchLater) + **glass-ui** (scheduler in `useRAFLoop`).
- **Guide ids:** `batch-analytics-events`, `break-up-long-tasks`, `schedule-tasks-by-priority`, `performance` (CSP via the security/privacy lens).
- **Leverage/why:** speedtest's measurement-under-load is the one app where INP-task-breakup is load-bearing; CSP propagation reuses H.γ's verified recipe. Passkeys has no home yet → book, don't build.
- **Impact:** perf + privacy + security · **Effort:** M (fetchLater/scheduler) + S (CSP per repo) · **Invariant:** no-legacy; security claims cite a verified header (H.γ precedent).
- **Dependency order:** trailing; independent.

### The keyframes-vs-platform question (cross-cutting, answered in δ/ε)
> **Does keyframes.js still earn its keep vs native `scroll-timeline` + View Transitions?** — **YES, with a narrowed remit.** Its `ScrollTimeline` (timeline.ts) and `ElementMorph` (morph.ts) *reimplement* `animation-timeline: scroll()/view()` and View-Transitions for the **DOM-element case** — where native is strictly better (δ/ε retire those paths in the demo + recommend native in docs). But keyframes.js's **true differentiators survive and are unique**: (a) it *emits* the native `linear()` spring stops that glass-ui's `--spring-*` tokens are *regenerated from* (the ecosystem already bridges JS-springs → compositor-CSS via this lib); (b) it animates **off-DOM / non-element data** on scroll, which `animation-timeline` cannot; (c) WAAPI delegation with a real eligibility gate. **Verdict: keep the engine, narrow the DOM-element public API to native, keep the off-DOM/spring-emission core.** This is keyframes-O1/O2/O3 — booked as the keyframes lane in δ/ε/θ, not a deprecation.

---

## (3) Per-repo wave allocation

User-directed focus order: **fourier, value.js, glass-ui first.** Below, ✓ = a wave touches the repo; **glass-ui** rows are the propagation roots.

| Wave | glass-ui (root) | fourier | value.js | words | speedtest | keyframes |
|---|---|---|---|---|---|---|
| **α** transform-identity + scale | ✓ **root** | (inherits) | (inherits) | (inherits) | (inherits) | (inherits) |
| **β** native overlay substrate | ✓ **root** | ✓ (FullscreenViewer→Dialog) | ✓ (del `useHoverPopover`/guards) | ✓ (del `useInlineWordLookup`) | ✓ (del `MapTooltip`) | ✓ (demo overlays) |
| **γ** content-visibility | ✓ util + Aurora | ✓ paper + canvas + views | ✓ ghost-pane | ✓ defn sections | ✓ tables + charts | ✓ demo stories |
| **δ** scroll-driven CSS | ✓ `useScrollProgress` | ✓ floating-TOC + nudge | — | ✓ header-shrink | (CardHeader done) | ✓ `useScrollFade`/`ScrollTimeline` |
| **ε** View Transitions | ✓ VT tokens + helper | ✓ RouterView + `/w/`↔`/v/` | ✓ pane swaps | ✓ route/defn nav | ✓ completion + route morph | ✓ scene swaps |
| **ζ** `@starting-style` top-layer | ✓ **root** | (inherits) | (inherits) | (inherits) | (inherits) | (inherits) |
| **η** forms / native-select | ✓ `<Select>` + validity | — | ✓ 5 comboboxes | ✓ search semantics | — | — |
| **θ** image/asset/privacy | — | ✓ figures + avatar | ✓ fonts + dropzone | ✓ CarouselSlide | ✓ LCP `<img>` | ✓ previews |
| **ι** CSP/analytics/INP | ✓ scheduler in RAF | ✓ (CSP done H.γ) | ✓ CSP | ✓ CSP | ✓ fetchLater + scheduler | — |

**Focus-order reading:**
- **fourier** (the FOCUS repo): inherits α/ζ for free; owns γ (its #1 — paper+canvas), ε (`/w/`↔`/v/` shared-element morph), δ (floating-TOC), θ (avatar + figures). Its CSP is already shipped (H.γ). **fourier's first move = γ content-visibility on paper window sections (its #1, S-effort).**
- **value.js**: the densest overlay consumer (41+ glass-ui subpath imports) — biggest β/η beneficiary; owns θ font-self-host (its #1).
- **glass-ui**: the root of α/β/γ-util/δ-recipe/ε-tokens/ζ/η/ι-scheduler — **every foundation wave roots here.**
- **words / speedtest / keyframes**: trailing consumers; each picks up the leaf θ/ε/γ adoptions once the glass-ui roots land. (speedtest = `speedtest.friday.institute`, the separate suite — HA2/HA6 scope correction; its babb.dev arm is the deploy-webhook only.)

---

## (4) Sizing + proposed tranche shape

### Recommendation: **ONE constellation-modernization tranche, fourier-rooted, with an authorized cross-repo sweep — fourier-I, 9 waves (W0–W9 + close).**

**Rationale (why one tranche, not per-repo successors):**

1. **The leverage principle demands a single root.** Six of the nine waves *root in glass-ui*; sequencing them as six independent per-repo tranches would re-derive the same glass-ui foundation six times and risk divergent primitives. One tranche lets α/β/γ-util/δ-recipe/ε-tokens/ζ land **once**, then fans the leaf adoptions out under one ledger.
2. **It matches the established constellation pattern.** H already ran exactly this shape — single-repo-rooted (fourier) with an **authorized cross-repo sweep under inv-16′**, each cross-repo write its own commit booked to `ADOPTION-ASKS` + per-repo-green-CI-gated. fourier-I is the modern-web successor to H's hygiene sweep; ordering continues at **λ′** (CANONICAL-ORDERING §18, to be authored at I.W0).
3. **The constellation is mid-flight.** Per H.ε, all 5 siblings carry unpushed backlogs. So fourier-I is **authored-now / executed-on-clean-checkout** for the cross-repo arms (the H.ε BOOK-ALL discipline): the glass-ui-rooted foundations (α/β/ζ) are authored as exact, file-verified `ADOPTION-ASKS` entries; only the **fourier-local** waves (γ-on-paper, ε `/w/`↔`/v/`, δ floating-TOC, θ avatar+figures) execute immediately against fourier's clean tree. This keeps inv-16 (no silent cross-repo mutation) intact while still landing fourier's own perf wins now.

**Wave→W mapping (sequenced by leverage × dependency):**

| W | Wave(s) | Gate | Cross-repo? |
|---|---|---|---|
| **W0** | charter + ordering λ′ + inv authoring + ADOPTION-ASKS seed | docs | — |
| **W1** | **γ** content-visibility (fourier-local: paper + canvas + views) | inv-27 green CI; LCP/INP measured | fourier-local |
| **W2** | **α** glass-ui transform-identity + scale utility | glass-ui green CI | sweep (authored) |
| **W3** | **β** glass-ui native overlay substrate (PE keystone) | glass-ui green CI; `@supports` floor verified | sweep (authored) |
| **W4** | **δ** scroll-driven CSS (glass-ui recipe + fourier floating-TOC) | green CI; compositor-verified | mixed |
| **W5** | **ε** View Transitions (glass-ui tokens + fourier `/w/`↔`/v/`) | green CI; PRM-bracketed | mixed |
| **W6** | **ζ** `@starting-style` top-layer + **η** forms/select | glass-ui green CI | sweep (authored) |
| **W7** | **θ** image/asset/privacy (fourier avatar+figures execute; siblings authored) | green CI; 0 third-party origins re-verified | mixed |
| **W8** | **ι** CSP/analytics/INP tail + passkeys-booked | green CI | mixed |
| **W9** | close: FINAL.md + ordering λ′ + ADOPTION-ASKS reconcile + 30-day stale-watch | inv-27 green run id (every job) | — |

**Sizing:** ~9 implementation waves; the glass-ui foundations (α/β/γ-util/δ-recipe/ε-tokens/ζ) are the load-bearing ~60% of effort (β alone is L); the leaf adoptions are S–M each. fourier-local execution this session is **γ (S) + δ-TOC (M) + ε `/w/`↔`/v/` (M) + θ avatar+figures (S/M)**; everything glass-ui-rooted is authored-and-booked.

**inv-16′ governance (restated):** the cross-repo arms (α/β/ζ/η in glass-ui; the value.js/words/speedtest/keyframes leaf adoptions) are **named, ledgered, per-repo-green-CI-gated**, each its own commit. Because the repos are mid-flight, they are authored-now/executed-on-clean-checkout — exactly the H.ε BOOK-ALL posture, not a silent sweep.

---

## (5) Ranked TOP-15 modernization backlog (executive shortlist)

Ranked by **impact × 1/effort × leverage** (glass-ui-rooted items carry the propagation multiplier). Citations: guide id + the per-repo report finding.

| Rank | Item | Guide id | Repo / root | Impact | Effort |
|---|---|---|---|---|---|
| **1** | **`.hover-scale`/`.active-scale` + base transform identity + individual `scale:`/`translate:` props** (style-audit gap-#3 ~69 sites = glass-ui D3) | `individual-transform-properties` | **glass-ui** (Wα) | ux+dx | S |
| **2** | **`content-visibility: auto` + `contain-intrinsic-size`** on fourier paper window sections (fourier #1) | `defer-rendering-heavy-content` | fourier (Wγ) | perf | S |
| **3** | **Native overlay substrate** — popover API + anchor positioning + top layer (value.js O1 / glass-ui #3 / keyframes O5 / speedtest A — keystone, deletes `useDialogOverlayGuards` bug-class) | `position-aware-tooltips`, `declarative-dialog-popover-control` | **glass-ui** (Wβ) | perf+a11y+dx | L |
| **4** | **Self-host value.js fonts + `font-size-adjust: from-font`** (kill Google-Fonts origin; mirror fourier G) (value.js #1) | `visually-stable-font-fallbacks` | value.js (Wθ) | perf+privacy | S |
| **5** | **Native image hygiene** — `width`/`height`+`loading=lazy`+`decoding`; delete `CarouselSlide` JS lazy-loader (words #1) | `optimize-image-priority` | words (Wθ) | perf/CLS | S |
| **6** | **`content-visibility` on admin tables + chart cards** (speedtest #1, INP-under-load) | `defer-rendering-heavy-content` | speedtest (Wγ) | perf | S |
| **7** | **Pause off-screen canvas/WebGL on `contentvisibilityautostatechange`** (fourier #4 epicycle loop + glass-ui #7 Aurora) | `efficient-background-processing` | **glass-ui** + fourier (Wγ) | perf | M |
| **8** | **`<picture>` AVIF/WebP + intrinsic dims for fourier paper figures** (kill windowed-scroll CLS) (fourier #5) | `performance` image opt | fourier (Wθ) +API | perf | M |
| **9** | **View Transitions** — glass-ui `view-transition-name` tokens + helper, retire FLIP engines (speedtest B / keyframes O4 / fourier #6 `/w/`↔`/v/`) | `same-document-transitions` | **glass-ui** + all (Wε) | ux+dx | M |
| **10** | **CSS scroll-driven path for `useScrollProgress`** (retire JS scroll listeners; glass-ui #2 / words #4) | `scroll-entry-exit-effects` | **glass-ui** + words (Wδ) | perf/INP | M |
| **11** | **Retire fourier `FullscreenViewer` hand-trap → native `<dialog>`/glass-ui `<Dialog>`** (fourier #3, gains background `inert`) | `declarative-dialog-popover-control` | fourier (Wβ leaf) | a11y+dx | M |
| **12** | **`@starting-style` + `allow-discrete` overlay enter/exit from `--spring-*` tokens** (glass-ui #5 / keyframes O6) | `animate-to-from-top-layer` | **glass-ui** (Wζ) | ux+dx | M |
| **13** | **Customizable native `<select>` wrapper** (`appearance: base-select`, PE) — value.js's 5 comboboxes (value.js #6 / glass-ui D7) | `branded-select-styling` | **glass-ui** + value.js (Wη) | perf+a11y+dx | M |
| **14** | **Self-host fourier GitHub avatar** (restore genuine zero-third-party-origins) (fourier #2) | `performance` / `privacy` | fourier (Wθ) | privacy+perf | S |
| **15** | **`fetchLater()` analytics batching + `scheduler.yield()` measurement-INP** (speedtest #5/#6) | `batch-analytics-events`, `break-up-long-tasks` | speedtest (Wι) | perf+privacy | M |

*Just-off-the-list (booked, not ranked):* `:user-valid`/`field-sizing` form primitives (glass-ui #8, Wη); words `<search>`+`enterkeyhint` (words #2, Wη); value.js `content-visibility:hidden` ghost-pane (value.js #2, Wγ); custom scrollbar `scrollbar-color`/`-width` (value.js #5, glass-ui); CSP propagation to non-fourier SPAs (Wι); passkeys (no credential surface — residual).

---

## Executive summary (≤15 lines)

1. **Verdict:** all six frontends are already strong/heavily-audited; the modern-web drift is **concentrated and repeated**, clustering into ~9 cross-repo themes the platform only recently made native.
2. **Leverage principle (the spine):** glass-ui is the shared design system — an adoption in `glass-ui/src` propagates to every consumer, so **glass-ui-rooted waves rank highest**, and the two audits *converge*: the style-audit's top-5 gaps and four-of-six modern-web reports both name glass-ui-rooted overlay/motion work as the highest leverage.
3. **Proposed tranche shape:** **ONE constellation-modernization tranche — fourier-I, 9 waves (W0–W9), fourier-rooted with an inv-16′ authorized cross-repo sweep** (ordering λ′, CANONICAL-ORDERING §18). The glass-ui-rooted foundations are **authored-now / executed-on-clean-checkout** (H.ε BOOK-ALL, since all 5 siblings are mid-flight); only fourier-local waves execute now. One root, not six per-repo tranches.
4. **Top-5 highest-leverage waves:** **α** glass-ui transform-identity + scale-utility (foundation; ~69-site demand + unblocks anchor positioning) → **β** glass-ui native overlay substrate (keystone; popover+anchor+top-layer, named by 4 of 6 reports, deletes the `useDialogOverlayGuards` bug-class) → **γ** content-visibility sweep (#1 in 3 reports, near-zero risk) → **ε** View Transitions (retires 3 FLIP engines) → **δ** scroll-driven CSS (retires JS scroll listeners). ζ/η/θ/ι trail.
5. **Single highest-ROI first move:** **Wave α — mint `.hover-scale`/`.active-scale` in glass-ui with a base `scale:1`/`translate:0` identity using individual transform props.** It closes the **largest style-audit demand (~69 sites, 5 apps)**, satisfies modern-web `individual-transform-properties`, and is the **hard prerequisite for the β anchor-positioning keystone** — one S-effort glass-ui change that pays out three ways across the whole constellation.

**Plan artifact:** `/Users/mkbabb/Programming/fourier-analysis/docs/audits/runs/2026-06-01-modern-web/modern-web-tranche-plan.md`
