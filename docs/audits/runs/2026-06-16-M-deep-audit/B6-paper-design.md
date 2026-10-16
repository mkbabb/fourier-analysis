# B6 — Per-Pane Design Audit: PAPER (`/paper`)

**Auditor:** B6 · **Run:** 2026-06-16-M-deep-audit · **Scope:** the long-form LaTeX-derived reader — the single most important HERO + scroll-animation surface in the app.
**Mode:** tranche development only — findings + idiomatic proposals, NO code edits. Read-only.
**READING PRIMACY governs everything below:** the paper is for reading; every pop/motion must respect the reader, never fight them. Audacious ≠ gaudy; PRM-honoured; INP-safe.

## Re-grounding (load-bearing)

- Resolved pins (verified): `@mkbabb/glass-ui@3.1.0`, `@mkbabb/keyframes.js@2.2.0`, `@mkbabb/value.js@0.10.0`, `@mkbabb/latex-paper@0.2.1` (`web/package.json`).
- Siblings shipped past these: **glass-ui 4.0.0, keyframes 4.2.0, value.js 0.12.0**. Tranche M front-loads the multi-major bump, then suffuses the design language + builds a unified mathematical-motion architecture. **Every finding below assumes M's bump has landed** — the glass-ui motion composables (`useScrollProgress` / `useViewTransition` / `useStaggerReveal`) and `[data-scroll-reveal]` / `.scroll-progress` recipes already exist in 3.1's `scroll-driven.css`, so most proposals are *adoption*, not invention.

## Verdict

The paper reader is **structurally excellent and visually under-amplified.** The hard problems are already solved: a virtual section window with `content-visibility` deferral, a composited `.scroll-progress` bar with a JS floor, glass TOC chrome, a 13-hue per-section colour system, and KaTeX self-hosted same-origin. What is **missing is the design language the user explicitly wants**: the title is a raw `text-4xl` heading, not the φ-tuned **display/hero tier** (which is loaded — Fraunces is vendored, preloaded, and bound to `--font-display` — but consumed only for the single ℱ glyph); there is **no hero entrance animation**, **no scroll-driven section reveal** (the recipe ships, zero consumers), **no abstract demarcation**, and **no math-motif chrome** (no F/epicycle signature beyond the ℱ in the title, no lattice/grid, no section-marker glyphs). The 13-colour section palette is wired into TOC + heading states but never reaches the title, dividers, or refs as *pops*. Net: a beautifully-engineered reader wearing a plain coat. M's job is to dress it — within proportion, reading first.

Severity tally: **2 HIGH, 6 MEDIUM, 4 LOW**, plus **3 glass-ui asks**.

---

## Findings

### B6-01 — The title is a raw Tailwind heading, not the φ-tuned display/hero tier (Fraunces voice unused)
- **Severity:** HIGH
- **Lens:** (d) TYPOGRAPHY audacity, (a) HIERARCHY
- **Evidence:** `web/src/components/paper/PaperView.vue:352-357` —
  ```
  <h1 class="cm-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-[3.25rem] leading-[1.15]">
      An Introduction to<br /><span class="fourier-f">ℱ</span>ourier Analysis
  ```
  Screenshots `paper-1440x900.png` / `paper-1280x800.png`: the title reads as a modest centered heading, dwarfed by the surrounding whitespace, not as a poster-grade hero. `paper-375x667.png`: it grows to a respectable mobile size but is still raw `text-5xl`.
- **Current state:** Title is `cm-serif` (Computer Modern) at hand-rolled `text-4xl…md:text-[3.25rem]`. glass-ui ships a complete φ-ladder display tier — `text-display`, `text-display-2..5`, `text-display-mega/hero/audacious` (typography.css:111-264), all bound to `--font-display` = Fraunces (theme.css:49, `--font-stack-display: "Fraunces", Georgia, serif`, tokens.css:43). **Grep confirms zero consumers of `text-display*`/`text-hero`/`text-title` anywhere in `src/`.** Fraunces is vendored (`public/fonts/fraunces/*.woff2`), declared (`public/fonts.css`), and reaches the page only through `.fourier-f` (the ℱ glyph). The "Fraunces vendored but unused" memory is *half* right: it's used for one glyph, never for display text.
- **Proposed (idiomatic gestalt):** Promote the title into the display register. Wrap the title in glass-ui's `text-display-3` or `text-display-mega` (φ³–φ^(9/2), `clamp()`-fluid, `text-wrap: balance`, `font-optical-sizing: auto`, WONK=1) so the Fraunces display voice carries the whole title, not just the ℱ. Keep `cm-serif` body for the *math-consistent* register if the dual-voice (Fraunces display + CM body) reads as deliberate hierarchy — but the title is the one place to let Fraunces win audaciously. Retire the magic `md:text-[3.25rem]` for a φ-rung. This is pure adoption of shipped tokens; no new CSS.
- **Wave hint:** M — design-language suffusion wave (typography tier adoption), early.
- **is_chronic:** false · **is_deferred:** false

### B6-02 — No hero entrance animation on the paper's title (the prime hero surface is static)
- **Severity:** HIGH
- **Lens:** (f) ANIMATION targets, (d) TYPOGRAPHY
- **Evidence:** `PaperView.vue:352-358` — the `<header>` has no entrance transition; the article mounts fully formed. The only paper-level motion is the `.scroll-progress` bar (`PaperView.vue:313-315`) and Vue `Transition`s on the mobile TOC + back button. The user directive: *"more mathematical animation, hero items, scrolling animations… to our paper, UI."*
- **Current state:** Zero hero entrance. The most important surface in the app reveals with no character. glass-ui's `useStaggerReveal` / a SplitChars primitive would give a PRM-gated char/word stagger on the title.
- **Proposed:** A **PRM-gated, ONCE-disciplined hero entrance** on the title only (not the body — reading primacy). Two idiomatic options:
  1. **CSS-first (preferred, INP-safe):** `@starting-style` + a `view()`/one-shot keyframe on the title for a fade+lift+optical-weight settle, composited, zero JS.
  2. **Composable:** glass-ui `useStaggerReveal` over title words/chars with a tasteful 30–50ms stagger; gate `OFF` under PRM (the composable already does this). For the ℱ specifically, a subtle "draw-in" or rotational settle nods at the epicycle motif (see B6-09).
  Strictly `once` — fires on mount, never on the virtual window's remount churn. Cap total duration ≤ 600ms so it never delays first read.
- **Wave hint:** M — mathematical-motion architecture wave (hero entrance).
- **is_chronic:** false · **is_deferred:** false

### B6-03 — No scroll-driven section reveal (the recipe ships; the paper — the prime scroll surface — has zero consumers)
- **Severity:** MEDIUM (HIGH against user intent)
- **Lens:** (f) ANIMATION targets
- **Evidence:** `grep -rn "data-scroll-reveal\|useStaggerReveal" src/` → **zero hits.** glass-ui ships `[data-scroll-reveal]` (scroll-driven.css:11-14, 50+: "fade + lift on entry, one `view()` timeline PER child… the `useStaggerReveal` composable replacement") and explicitly names it as the consumer-facing recipe. `PaperArticleWindow.vue:70-124` renders `visibleItems` with **no reveal hook**.
- **Current state:** Sections pop in without any entry choreography. The user wants "scrolling animations (within proportion) to our paper."
- **Proposed:** Apply a **reveal on the section *header* only** (`.section-header--chapter`), not body paragraphs — reading primacy means body text must be readable the instant it scrolls in; only the chapter title gets a gentle fade+lift via the `view()`-timeline recipe (composited, off-main-thread, PRM-auto-disabled). **The virtual-window hazard is real and load-bearing:** `useVirtualSectionWindow` (`PaperView.vue:67-85`) mounts/unmounts sections (overscan 240/720px), so a naive IO/`[data-scroll-reveal]` re-fires every time a section re-enters the warm window → flicker. This needs **ONCE-discipline for virtualized scrollers** — see glass-ui ask **GA-1**. Until that ships, scope the reveal to header-only with a `once` data-flag keyed by section id in a `WeakSet`/`Set<string>` so a remounted section reads as already-revealed.
- **Wave hint:** M — mathematical-motion architecture wave (scroll reveals), **gated on GA-1**.
- **is_chronic:** false · **is_deferred:** partial (full body-block choreography deferred; header-only reveal in-wave)

### B6-04 — No abstract / lede demarcation; the title floats over a TOC with no hierarchy bridge
- **Severity:** MEDIUM
- **Lens:** (a) HIERARCHY, (b) INCONGRUENCES
- **Evidence:** Screenshots `paper-375x667.png` (mobile) shows title → bare TOC list (`0.1 Introduction`, `1. Origin…`) with no abstract, no rule, no spacing demarcation between hero and contents. Desktop `paper-1440x900.png`: title → immediately `0.1 Introduction` body. `PaperView.vue:352-377`: `<header>` then `<nav>` (mobile inline TOC) then the article window — no abstract block, no horizontal rule between the hero and the first content.
- **Current state:** The hero has a single element (title). There is no demarcation device (rule, abstract lede, decorative divider) separating "this is the paper's masthead" from "this is the table of contents / first section." The `mb-10 lg:mb-20` margin (`PaperView.vue:352`) is the only separator — pure whitespace.
- **Proposed:** Add a **hero band**: title → a one-line italic *abstract/lede* (Fraunces or CM-italic, `text-prose`) drawn from the paper's existing intro sentence → a **section-coloured horizontal rule** echoing `.section-divider`'s gradient (theme.css:506-515) but at full hero width. This gives the masthead three tiers (display title · lede · rule) and a clean break to the TOC. The lede also seeds the per-section colour pops (B6-07).
- **Wave hint:** M — design-language / hierarchy wave.
- **is_chronic:** false · **is_deferred:** false

### B6-05 — No math-motif chrome: no F/epicycle signature, no lattice, sections lack a visual marker beyond a number
- **Severity:** MEDIUM
- **Lens:** (c) GLASS / GRID / MATH chrome
- **Evidence:** The only math signature in the entire reader is the `<span class="fourier-f">ℱ</span>` in the title (`PaperView.vue:356`) and the callout button (`PaperArticleWindow.vue:116`). Section headers are number + heading text (theme.css:467-499); the `.section-divider` is a plain horizontal gradient (theme.css:506). No epicycle glyph, no harmonic lattice, no grid backdrop. The app is *about* Fourier analysis and the reader shows none of its own subject as ornament.
- **Current state:** Mathematically mute chrome. The user directive explicitly calls for "GLASS, GRID, MATH" suffusion and "hero items."
- **Proposed (within proportion — these are *quiet* marks, not decoration that fights reading):**
  - A **faint math lattice** behind the hero band only (a CSS `repeating-linear-gradient` grid or a sparse harmonic sine-wave SVG at ~3–5% opacity), parallaxed gently on scroll via a `view()`/`scroll()` timeline (composited). Hero-region only so it never sits under body text.
  - A **section-marker glyph** in the sticky chapter header — a small epicycle/harmonic motif tinted with `--section-color-{i}` (the palette already exists, tokens.css:439-451), replacing or accompanying the bare section number. This makes each chapter's identity legible at a glance and ties the TOC colour to the in-text header.
  - Upgrade `.section-divider` from a flat gradient to a **harmonic-tick rule** (faint evenly-spaced ticks, like a number line) — a math-literate divider, still ≤1px visual weight.
- **Wave hint:** M — design-language suffusion (math chrome).
- **is_chronic:** false · **is_deferred:** the lattice SVG generator may defer; the section-marker glyph + tick-rule are in-wave.

### B6-06 — Reading-progress bar exists but is invisible-by-design (2px, primary-only) — not a reading *indicator*
- **Severity:** LOW
- **Lens:** (f) ANIMATION, (c) MATH chrome
- **Evidence:** `PaperView.vue:313-315, 474-500` — a 2px `.scroll-progress` bar sticky at the top of `.paper-scroll`, `scaleX` 0→1, `--primary` gradient. Composited via `scroll()` timeline with a feature-detected JS floor — **the engineering is exemplary** (dual-path single-writer, PRM-gated, `--scroll-progress-scroller: nearest`). But at 2px it's nearly imperceptible, and it carries no *positional* information (which chapter, what % of *this* section).
- **Current state:** A correct but minimal progress bar. The user wants "a reading-progress indicator" with more presence.
- **Proposed:** Keep the composited bar (don't regress the engineering) but (a) tint it with the **active section's colour** (`--section-color-{activeRootIndex}`) so the bar *is* the chapter's hue as you read — a colourful pop that doubles as orientation; (b) optionally pair it with a small `fira-code` `pg N / total` already in the bottom overlay (`PaperView.vue:392-394`) reframed as a richer reading indicator. The active-colour binding is a 1-line `--scroll-progress` colour var driven by `activeRootId`. Within proportion: 2px stays, colour does the work.
- **Wave hint:** M — design-language (pops) wave.
- **is_chronic:** false · **is_deferred:** false

### B6-07 — The 13-hue section palette never reaches the hero, dividers, or refs as *pops*
- **Severity:** MEDIUM
- **Lens:** (e) colourful POPS, (a) HIERARCHY
- **Evidence:** `--section-color-0..12` (tokens.css:439-451) + fourier's amber AA-fix (`style.css:121,126`) are consumed in TOC active states (`PaperSidebar.vue:77,96,112`) and in-text section headings (theme.css:476,481 via `--_section-color`). But: the **title is monochrome** (B6-01), the **`.paper-ref` cross-refs are all `--primary`** (theme.css:13-23, a single dashed pink), and the **`.section-divider` uses `--section-heading`** not the per-section colour in all contexts. The palette is a latent pop-system used at ~40% of its reach.
- **Current state:** A rich, accessible, mathematically-indexed colour system that the reader under-uses. Refs are uniform; the hero is grey; dividers are one colour.
- **Proposed (within proportion, reading-respecting):**
  - **Active-TOC + active-section already correct** — keep.
  - **Cross-refs (`.paper-ref`):** tint a ref by the *target section's* colour, not a global `--primary`, so a forward-reference to "Lens II" carries Lens II's hue — a semantic pop. Cap saturation so body text stays calm.
  - **Hero rule + section-marker glyph (B6-04/05):** draw from `--section-color-{i}`.
  - **Reading-progress bar (B6-06):** active-section hue.
  This turns the existing palette into a coherent wayfinding language. All accent-on-chrome, never on body prose — reading primacy held.
- **Wave hint:** M — design-language (pops) wave.
- **is_chronic:** false · **is_deferred:** ref-tinting may defer if `labelMap` target-section resolution is non-trivial.

### B6-08 — Glass is present on chrome but the sidebar/article cards are "cartoon" (offset-stamp), not glass — mild incongruence
- **Severity:** LOW
- **Lens:** (c) GLASS, (b) INCONGRUENCES
- **Evidence:** The article (`PaperView.vue:516-529`) and sidebar (`PaperSidebar.vue:163-166`) both use the **offset-stamp cartoon card** (`box-shadow: 3px 3px 0 …`, 2px border) — a flat, hard-shadow look. Meanwhile the mobile floating TOC uses `glass-resting`/`glass-floating` (`MobileFloatingToc.vue:110,117,133`) and the bottom overlay uses `glass-quiet` (`PaperView.vue:393`). So the *floating* chrome is glass and the *structural* cards are cartoon — two surface languages in one pane.
- **Current state:** Deliberate-looking but mixed: glass for ephemeral overlays, cartoon for persistent frames. Screenshots `paper-1440x900.png` show the hard offset shadow on both the TOC card and article. This may be intentional ("structure is solid, overlays float"), but it reads slightly incongruous against the user's GLASS directive.
- **Proposed:** Decide the surface story explicitly in M. Either (a) keep the cartoon frame for structure and *lean into it* as the deliberate "paper sheet on a desk" metaphor (then the offset-stamp is a feature, document it), or (b) migrate the sidebar TOC to a `glass-resting` surface so the whole left rail reads as floating glass and only the article is the solid sheet — a cleaner glass/solid contrast. Recommend (b): the TOC is navigational chrome (glass) and the article is the document (solid sheet). Low-risk, mostly a class swap.
- **Wave hint:** M — glass-suffusion wave.
- **is_chronic:** false · **is_deferred:** false

### B6-09 — The ℱ signature is static and inconsistent in size between the two places it appears
- **Severity:** LOW
- **Lens:** (b) INCONGRUENCES, (c) MATH chrome, (f) ANIMATION
- **Evidence:** Title ℱ: `.fourier-f` utility (typography.css:421-427) → `font-size: 1.35em` of an already-large title. Callout ℱ: overridden to `font-size: 1.1em` (`PaperArticleWindow.vue:208-211`). Same glyph, two sizes, neither animated. Screenshot `paper-375x667.png`: the title ℱ sits *lower* than the baseline of "ourier" (`vertical-align: -0.05em`) and reads slightly as a glitch on mobile.
- **Current state:** The brand glyph is the app's one piece of math-identity and it's static + size-inconsistent.
- **Proposed:** Make the ℱ the **signature motif**: (1) a one-shot PRM-gated entrance on the title ℱ (subtle epicycle-rotation settle or draw-in, part of B6-02); (2) consistent optical sizing/baseline across both sites via a shared `--fourier-f-size` knob; (3) consider tinting it `--section-color-0` (rose) as the app's accent. Tiny, high-identity.
- **Wave hint:** M — math chrome / hero entrance.
- **is_chronic:** false · **is_deferred:** false

### B6-10 — Mobile-vs-desktop TOC drift: two divergent TOC implementations with subtly different type/spacing
- **Severity:** LOW
- **Lens:** (b) INCONGRUENCES, (a) HIERARCHY
- **Evidence:** Three TOC surfaces coexist: desktop sidebar (`PaperSidebar.vue`, `cm-serif` links at `text-base`, `fira-code` numbers at 0.72rem), the **mobile inline TOC** (`PaperView.vue:361-377`, glass-ui `Button variant="link"`, `text-sm`), and the **mobile floating TOC** (`MobileFloatingToc.vue`, `cm-serif` at `text-base`). The mobile *inline* one (375px screenshot) uses a different link primitive (`Button variant="link"`) and size (`text-sm`) than the floating one. Three renderings of the same data, three type treatments.
- **Current state:** Functional but inconsistent — the mobile inline TOC (the first thing a phone user sees, screenshot `paper-375x667.png`) reads lighter/smaller than the floating TOC that replaces it on scroll.
- **Proposed:** Unify the TOC type/spacing tokens across all three surfaces (shared `--toc-link-size`, `--toc-number-size`, `cm-serif` everywhere, `fira-code` numbers everywhere). The mobile inline list should match the floating-TOC register so the transition on scroll is seamless. Pure token consolidation.
- **Wave hint:** M — hierarchy / consistency wave.
- **is_chronic:** false · **is_deferred:** false

### B6-11 — `.cm-serif` silent-degradation hazard is *latent but currently safe* — confirm in M's bump
- **Severity:** LOW (verification, not a live bug)
- **Lens:** (b) INCONGRUENCES, (d) TYPOGRAPHY
- **Evidence:** `.cm-serif` → `font-family: var(--font-serif)` (typography.css:409-411) → `--font-serif: var(--font-stack-serif)` (theme.css:50) → `"Computer Modern Serif", "Latin Modern Roman", "CMU Serif", Georgia, serif` (tokens.css:44). Fourier *also* remaps `--font-sans` to CM (`style.css:14`) and sets body `font-serif` (`style.css:20`). **CM Serif is self-hosted woff (`public/fonts.css`) and preloaded (`index.html:12-14`)** — so today it resolves. The audit brief's hazard ("`.cm-serif` may silently degrade to Times if `--font-serif-math` is unbound") refers to a `--font-serif-math` var that **does not exist in the current chain** — the actual var is `--font-serif`/`--font-stack-serif`, which *is* bound. So the hazard as stated is not live, but the fallback after `CMU Serif` is `Georgia, serif` (→ Times on many systems), and if M's glass-ui 4.0 bump renames/re-layers the font tokens, an un-rebased fourier `@theme` override could shadow it.
- **Current state:** Safe today; fragile across the major bump.
- **Proposed:** During M's glass-ui 4.0 bump, **assert the font-token chain** (a build-time or smoke check that `getComputedStyle` on a `.cm-serif` node resolves to Computer Modern, not Georgia/Times). Verify `--font-display` still resolves to Fraunces after the bump (B6-01 depends on it). No runtime change; a guardrail.
- **Wave hint:** M — bump wave (front-loaded), verification step.
- **is_chronic:** false (one-time bump risk) · **is_deferred:** false

### B6-12 — Spacing rhythm is hand-tuned in magic numbers, not on the φ/type scale
- **Severity:** LOW
- **Lens:** (a) HIERARCHY (spacing rhythm)
- **Evidence:** Magic margins throughout: `mb-10 lg:mb-20` (`PaperView.vue:352`), `mb-14` (`:361`), `padding: 1.25rem 1rem` (`:526`), `0.28rem 0.625rem` (`PaperSidebar.vue:226`), `--deferred-section-size: 1200px` (`PaperArticleWindow.vue:167`), section `margin-bottom: 2rem` (theme.css:201). glass-ui ships a φ-derived type/leading scale (tokens.css `--type-leading-*`, `--type-display-*`) but the paper's vertical rhythm doesn't reference it.
- **Current state:** Works visually but the rhythm isn't *systematic* — it's a collection of tuned values. The user wants proper "spacing rhythm."
- **Proposed:** Where it's cheap, migrate hero/section spacing onto the φ-ladder (e.g. hero gap = `--type-title`-derived, section gap = a leading-multiple). Don't over-rotate — body line-height (1.8, theme.css:520) is already good for reading. Target the *hero band + section demarcation* spacing for systematic rhythm; leave proven body metrics alone.
- **Wave hint:** M — hierarchy wave.
- **is_chronic:** false · **is_deferred:** partial (nice-to-have; body metrics out of scope).

---

## glass-ui asks (fourier BOOKS, never writes glass-ui)

### GA-1 — ONCE-discipline scroll-reveal for *virtualized* scrollers
- **Why:** The paper's `useVirtualSectionWindow` mounts/unmounts sections (overscan 240/720px). glass-ui's `[data-scroll-reveal]` / `useStaggerReveal` (scroll-driven.css:11-14, 50+) fire on *entry*, so a section that leaves and re-enters the warm window re-animates → flicker. The native `view()`-timeline recipe has no concept of "already revealed across remounts."
- **Ask:** A `[data-scroll-reveal="once"]` variant (or a `useStaggerReveal({ once: true, key })` option) that keys reveal-state by a stable id in a `WeakSet`/external `Set`, so a remounted element reads as already-revealed and renders at its end-state with no animation. This is the canonical primitive for *any* virtualized scroller (gallery, equation list, paper) — belongs in glass-ui, not forked per consumer.
- **Blocks:** B6-03 (full scroll-reveal).

### GA-2 — A `SplitChars` / char-stagger primitive for display titles
- **Why:** B6-02/B6-09 want a PRM-gated char/word stagger entrance on the hero title (and the ℱ settle). Hand-rolling DOM splitting per consumer is error-prone (accessibility: the split must preserve the accessible name; the title must stay copy-selectable). glass-ui already owns the motion vocabulary (`useStaggerReveal`, `scrolling-text`).
- **Ask:** A `SplitChars`/`SplitWords` utility (component or composable) that wraps glyphs/words in spans for staggered reveal while preserving the accessible name (`aria-label` on the parent, `aria-hidden` on the shards) and selection. Composes with `useStaggerReveal` for the cascade; PRM-gates to a single fade.
- **Blocks:** B6-02 (hero entrance), B6-09 (ℱ settle).

### GA-3 — Active-section-colour binding for `.scroll-progress`
- **Why:** B6-06 wants the reading-progress bar tinted by the active section's hue. Today `.scroll-progress` (scroll-driven.css:42-46) is colour-agnostic (consumer sets the gradient). Driving it from a reactive `--section-color-{i}` is a consumer concern *today*, but a canonical `--scroll-progress-color` knob (so the consumer just sets one var) would make this a clean one-liner and standardise it for other panes.
- **Ask:** A documented `--scroll-progress-color` custom-property knob on the `.scroll-progress` recipe (defaults to `--primary`), so consumers tint without overriding the whole gradient. Minor; could also be a fourier-local override if glass-ui declines.
- **Blocks:** nothing hard — B6-06 has a fourier-local fallback.

---

## Open questions

1. **Surface story (B6-08):** Is the cartoon offset-stamp card a *deliberate* "paper sheet on a desk" metaphor, or legacy to be migrated to glass? This decides whether the sidebar TOC goes glass. Needs a design call in M.
2. **Hero ambition (B6-01):** How audacious should the title go — `text-display-3` (φ³, ~68px peak) for restraint, or `text-display-mega` (φ^(9/2), ~177px peak) for poster-grade? The latter risks overwhelming a *reading* surface; lean `display-3`/`display-4` unless the hero is a distinct above-the-fold band.
3. **Math-lattice scope (B6-05):** Hero-region-only (safe, recommended) vs. a faint full-page parallax lattice (risks fighting reading). Confirm hero-only.
4. **Ref-tinting feasibility (B6-07):** Does `labelMap` (`PaperView.vue:91-96`) cheaply resolve a ref's *target root section index* so `.paper-ref` can be tinted by destination hue? If resolution is expensive, defer ref-tinting.
5. **glass-ui 4.0 motion API shape:** The re-grounding names `useScrollProgress`/`useViewTransition`/`useStaggerReveal` as 4.0 composables; 3.1 already ships the *CSS recipes* + `useViewTransition`. Confirm 4.0's composable signatures (esp. the `once`/`key` options GA-1 needs) before authoring B6-03's adoption.
