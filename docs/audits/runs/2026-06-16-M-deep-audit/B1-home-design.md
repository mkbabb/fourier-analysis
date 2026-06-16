# B1 — HOME (route "/") per-pane design audit

**Auditor:** B1 · **Tranche:** M (ordering ξ′) · **Date:** 2026-06-16 · **Mode:** tranche development only — findings + idiomatic proposals, NO code edits.

---

## 0. Re-grounding & the load-bearing structural fact

**The "/" route has no home/landing view.** `web/src/router/index.ts:39-42` redirects `/` to the saved tab, defaulting to **`/paper`** (`getSavedTab()` → `"/paper"`). The screenshots labelled `home-*` are therefore the **PaperView title page** (`web/src/components/paper/PaperView.vue`), not a dedicated hero. This is the single most important home finding: **the product's front door is a typeset-document title page, not a mathematical hero.** Every lens below is judged against that reality and against the standing directive that *math is the brand (epicycles/Fourier)*.

**Version reality (pins lag siblings):** installed `@mkbabb/glass-ui@3.1.0` (pin `^3.1.0`), `keyframes.js@2.2.0` (`^2.2.0`), `value.js@0.10.0` (`^0.10.0`) — verified in `node_modules/*/package.json`. Siblings have shipped glass-ui 4.0.0 / keyframes 4.2.0 / value.js 0.12.0. M front-loads the multi-major bump; the proposals below assume the post-bump primitive surface.

**Screenshots read:** `home-375x667.png`, `home-1280x800.png`, `home-1440x900.png` (all under `docs/tranches/J/audit/screenshots/before/`).

---

## Findings

### B1-01 — The front door is a document title page, not a mathematical hero
- **Severity:** HIGH (chronic)
- **Lens:** (c) GLASS/GRID/MATH suffusion · (f) ANIMATION
- **Evidence:** `web/src/router/index.ts:39-42` (`/` → `/paper`); `home-1280x800.png` / `home-1440x900.png` (centered article: title → "Introduction" heading → running prose; bordered TOC card at left); `home-375x667.png` (title → flat TOC list).
- **Current state:** Landing on the app drops the visitor into chapter 0.1 "Introduction" of a 110-page treatise. There is **zero motion, zero epicycle, zero glass, zero grid** above the fold. The brand is *Fourier / epicycles* and the front door shows none of it. It reads as a PDF that learned to scroll.
- **Proposed (idiomatic gestalt transposition):** Introduce a genuine **hero band** at the top of PaperView's `<header>` (PaperView.vue:352-358) — a **live epicycle/convergence canvas** drawing the script-ℱ or a signature contour (reuse `BasisCanvas`/the epicycle drawing in `components/visualization/lib/canvas-drawing/epicycles.ts`), wrapped in a glass-ui surface (`glass-quiet`/glass panel), behind the display title. The canvas runs the existing rAF epicycle loop at low harmonic count, PRM-gated to a static final frame. This makes the front door *be the brand* rather than describe it. The hero is a contained band (not full-bleed), preserving the document-reading affordance below it.
- **wave_hint:** M-hero (the "mathematical-motion hero" wave) — depends on the glass-ui 4.0 bump landing first.
- **is_chronic:** true (the no-hero posture has survived A–J). **is_deferred:** false.

### B1-02 — No title-demarcation hierarchy: title → TOC has no rule, no rhythm
- **Severity:** MEDIUM
- **Lens:** (a) HIERARCHY
- **Evidence:** `home-375x667.png` (title abuts the flat TOC list with no separator); PaperView.vue:352-377 — `<header class="mb-10 lg:mb-20 text-center">` then immediately `<nav class="mb-14 ...">` (mobile TOC) with **no `<hr>`, no rule, no kicker/eyebrow**.
- **Current state:** Between the display title and the first content there is only vertical margin. The standing directive calls for *title demarcation + horizontal rules + spacing rhythm*. On mobile the title and the TOC read as two ungoverned stacks; there is no "you are here / table of contents" demarcation.
- **Proposed:** Add a **horizontal rule + eyebrow kicker** under the title (glass-ui ships an ornamental divider; if absent → `glassui_asks` GA-1). Pattern: display title → thin rule (the offset-stamp aesthetic the app already uses for `.cartoon-card` borders) → a small-caps `fira-code` kicker ("A treatise in two lenses" / chapter count) → TOC. Establishes the title→meta→contents rhythm. Reuse the existing `--font-mono` kicker idiom already present in the hover card (`AppHeader.vue:91`).
- **wave_hint:** M-suffuse (design-language suffusion wave).
- **is_chronic:** false. **is_deferred:** false.

### B1-03 — Bottom page-indicator overlay collides with the title-page TOC on mobile
- **Severity:** MEDIUM (incongruence / legibility)
- **Lens:** (b) INCONGRUENCES · (a) HIERARCHY
- **Evidence:** `home-375x667.png` — the bottom-left "pg 4 / 110" overlay (`.paper-bottom-overlay` / `.overlay-page`, PaperView.vue:392-395, 636-644) **overlaps the TOC line "6. The Discrete Fourier Transform"**; the glyphs interleave.
- **Current state:** On the title page the content does not yet scroll past the overlay's footprint, so the absolutely-positioned page chip sits on top of live TOC text. It also reads "pg 4" on the *first* page, which is itself incongruous (the title page is not page 4).
- **Proposed:** Give `.paper-scroll` a bottom safe-gutter (`scroll-padding-bottom` / a spacer) equal to the overlay height so content never renders under the chip; and suppress/zero the page chip while `activeId === flatSections[0]?.id` (the title page) — it already special-cases this id for scroll persistence at PaperView.vue:137, so the branch exists. Keeps the chip honest and uncollided.
- **wave_hint:** M-suffuse (hierarchy/spacing pass).
- **is_chronic:** false. **is_deferred:** false.

### B1-04 — The script-ℱ renders in glass-ui's sans display face, clashing with the CM-Serif title
- **Severity:** MEDIUM (incongruence + brand)
- **Lens:** (b) INCONGRUENCES · (d) TYPOGRAPHY
- **Evidence:** PaperView.vue:356 — `<span class="fourier-f">ℱ</span>ourier Analysis` inside an `h1.cm-serif`. `.cm-serif` = `var(--font-serif)` (Computer Modern Serif); `.fourier-f` = `var(--font-display)` (glass-ui typography.css:421-422), which in 3.1.0 resolves to `--font-brand-sans` (Plus Jakarta Sans, typography.css:134). So the single ornamental ℱ is set in a **sans** face dropped into a serif headline.
- **Current state:** Visible in all three screenshots — the ℱ has a different texture/axis from "ourier Analysis". It's a deliberate ornament but the family mismatch reads as a glitch, not a flourish. The vendored **Fraunces** display face (`public/fonts.css:43-63`) was presumably intended for exactly this slot but is **never wired** (see B1-05).
- **Proposed:** Either (a) re-point the ornamental ℱ at a *serif* display axis so it harmonizes with the CM-Serif headline (italic swash CM, or Fraunces' high-contrast italic — which is the brand-appropriate choice), or (b) embrace it as an intentional bicameral mark but enlarge + tint it (see B1-08) so it reads as a chosen flourish. Recommend wiring Fraunces (B1-05) and using `.fourier-f` over Fraunces-italic for the headline mark only.
- **wave_hint:** M-suffuse (typography pass).
- **is_chronic:** false. **is_deferred:** false.

### B1-05 — Fraunces is vendored, fetched, and dead — the display tier is unused
- **Severity:** MEDIUM (waste + missing audacity)
- **Lens:** (d) TYPOGRAPHY
- **Evidence:** `public/fonts.css:43-63` declares two Fraunces `@font-face` rules (latin + italic, woff2, `font-display:swap`); `index.html:16` + `public/_headers:15` document self-hosting it. **`grep -rin "Fraunces" src/` returns zero `font-family` consumers.** No selector references `"Fraunces"`. The only display glyph (`.fourier-f`) resolves to glass-ui's `--font-display` = Plus Jakarta Sans, not Fraunces.
- **Current state:** A high-contrast display serif is shipped (and its woff2 is fetched whenever a latin glyph in its `unicode-range` is drawn) but **nothing in the app sets text in it** — there is no audacious display headline tier at all. The directive explicitly wants *large & audacious TYPOGRAPHY*; the asset to deliver it is sitting orphaned.
- **Proposed:** Make Fraunces the **display tier** of the brand. Define a `--font-display`/display utility (or override glass-ui's `--font-display` locally) → Fraunces, and apply it to: the home title's ornamental ℱ (B1-04), and a new audacious oversized headline treatment (B1-06). If M decides Fraunces is *not* wanted, delete the dead `@font-face` + woff2 to stop the orphan fetch — but the directive argues for *using* it. This is the single highest-leverage typography move on the home page.
- **wave_hint:** M-bump (decide display tier) → M-suffuse (apply).
- **is_chronic:** false. **is_deferred:** false.

### B1-06 — Title is large but not *audacious*; no oversized display moment
- **Severity:** MEDIUM
- **Lens:** (d) TYPOGRAPHY · (a) HIERARCHY
- **Evidence:** PaperView.vue:353-354 — `text-4xl ... sm:text-5xl md:text-[3.25rem] leading-[1.15]`. Tops out at **3.25rem (≈52px)** on desktop. `home-1440x900.png`: the title is comfortably sized but conventional; vast horizontal whitespace flanks the `max-w-5xl` article (paper-layout, PaperView.vue:332) leaving the headline visually *small* relative to the canvas.
- **Current state:** "Large" by document standards, not "audacious & large" by the directive's standard. At 1440px the centered article floats in a sea of empty margin, undercutting any sense of a commanding hero.
- **Proposed:** A display-scale headline in the Fraunces tier — e.g. `clamp(3rem, 8vw, 6rem)` with tightened tracking, the script-ℱ as a true drop-flourish. Pair with B1-01's hero band so the oversized type sits *over/beside* the live epicycle rather than alone. Use `text-wrap: balance` for the two-line break (PaperView.vue:356 hardcodes `<br/>` — brittle; replace with balanced wrap). Proportion guard: one audacious moment (the home title), not every heading.
- **wave_hint:** M-hero + M-suffuse.
- **is_chronic:** false. **is_deferred:** false.

### B1-07 — Generic-document gestalt: no GLASS, no GRID expression on the landing
- **Severity:** MEDIUM
- **Lens:** (c) GLASS/GRID/MATH
- **Evidence:** PaperView.vue template — the only surface treatments are `.paper-article` (a 2px-border + offset-shadow `.cartoon-card`-style block, PaperView.vue:516-529) and the bordered sidebar TOC. `home-1440x900.png`: a flat document column + a flat list. No glass blur surfaces, no grid/lattice motif, no mathematical texture beyond the prose. `App.vue` adds a `paper-texture` class to the shell but the landing reads as paper, not glass.
- **Current state:** The landing does not express two of the three pillars (GLASS, GRID). It is a card-stack-of-one (the article) plus a list.
- **Proposed:** (1) GLASS — float the hero band (B1-01) and/or the TOC card as glass-ui glass surfaces (translucent, blurred) over a subtle mathematical backdrop. (2) GRID — introduce a faint **grid/lattice or harmonic-axis backdrop** behind the hero (a CSS grid-lines pattern or an SVG axis), echoing the convergence plots elsewhere in the app — this is the "math as texture" move. Keep the document column itself calm; the grid lives in the hero zone only (proportion).
- **wave_hint:** M-hero.
- **is_chronic:** true (no-glass-landing has held across tranches). **is_deferred:** false.

### B1-08 — No colourful pops on the landing; the 13-hue section palette is unused above the fold
- **Severity:** MEDIUM
- **Lens:** (e) colourful POPS
- **Evidence:** glass-ui ships a rich 13-hue section palette (`--section-color-0..12`: rose, purple, indigo, teal-cyan, forest, amber, tomato, violet, ruby, slate, olive, ocean, periwinkle — `node_modules/@mkbabb/glass-ui/dist/styles/tokens.css:439-451`). The **desktop sidebar** tints only the *active* TOC node in its section colour (`PaperSidebar.vue:77,96,112`). On the **title page itself** there is no colour: the headline is monochrome serif and the **mobile inline TOC** (PaperView.vue:361 `text-muted-foreground`) is flat gray for *every* entry (`home-375x667.png`). The header nav already lands a tasteful amber pop with drop-shadow (`AppHeader.vue:197-199`) — proving the idiom exists but isn't carried to the landing.
- **Current state:** The front door is essentially greyscale. The directive wants *colourful audacious POPS (like the icon palette), within proportion* — the palette exists and the landing ignores it.
- **Proposed:** (1) Colour the **mobile title-page TOC** the way the desktop sidebar already colours active nodes: each chapter row carries its `--section-color-${i}` as a left accent rule or number chip — turning the flat list into the app's colour-coded chapter spine (this is the in-product "icon palette" the directive names). (2) A restrained colour pop on the hero: tint the script-ℱ or the grid backdrop with a section hue (or `value.js` 0.12 colour interpolation across the harmonic). Proportion: chapter accents are small chips/rules, not full-bleed fills.
- **wave_hint:** M-suffuse (colour pass) — value.js 0.12 unlocks richer interpolation.
- **is_chronic:** false. **is_deferred:** false.

### B1-09 — No entrance/scroll-reveal animation on the landing; first paint is inert
- **Severity:** LOW-MEDIUM
- **Lens:** (f) ANIMATION
- **Evidence:** PaperView.vue has motion only for the *reading-progress bar* (lines 156-187, 467-500), the mobile-TOC slide, and the back-button fade. The **title/header has no entrance**. The global tab-panel slide (`style.css:83-90`) animates route panels, but the landing's title and TOC do not stagger or reveal. `home-*` (static first paint).
- **Current state:** The prime hero candidate paints flat. No staggered reveal of title → kicker → TOC; no scroll-driven reveal of chapters.
- **Proposed:** A PRM-gated **entrance choreography** on the title page: title scales/fades in, kicker + rule wipe, TOC rows stagger — authored with keyframes.js 4.2 `linear()` springs (the engine glass-ui regenerates `--spring-*` from) so timing matches the app's motion vocabulary. Optionally a `@starting-style` first-paint reveal (already in the platform-first idiom the app adopted in I). Strict proportion + INP-safe (compositor transforms only) + PRM floor → static. Pairs with B1-01's hero.
- **wave_hint:** M-hero (motion) — keyframes 4.2 bump first.
- **is_chronic:** false. **is_deferred:** false.

### B1-10 — Wide dead margins at ≥1440px undercut the hero; layout doesn't scale up
- **Severity:** LOW
- **Lens:** (a) HIERARCHY · (b) INCONGRUENCES
- **Evidence:** `home-1440x900.png` — the `max-w-5xl` paper-layout (PaperView.vue:332) + `220px / 48rem` grid (PaperView.vue:560-565) leaves broad empty bands left and right of the article on wide screens; the headline sits in a narrow central column with no use of the reclaimed width.
- **Current state:** The landing's commanding-presence opportunity (a wide hero) is spent on whitespace. Reading width is correctly capped for prose, but the *title page* inherits the same cap, so the hero never gets to be wide.
- **Proposed:** Let the **title-page header band break the max-width** (full-bleed or wider container) while the prose below keeps its measure — a common editorial split (wide hero, narrow body). The hero band (B1-01) is the natural vehicle: it spans wider, the document column stays at reading measure.
- **wave_hint:** M-hero / M-suffuse.
- **is_chronic:** false. **is_deferred:** false.

---

## glass-ui asks (fourier books, never writes glass-ui)

- **GA-1 — ornamental divider / section-rule recipe.** B1-02 wants a brand-consistent horizontal rule (the offset-stamp aesthetic). If glass-ui 4.0 lacks a `divider`/`rule` primitive carrying the app's 2px-border + offset-shadow look, book it; else fourier consumes it.
- **GA-2 — display-tier token clarity (`--font-display`).** B1-04/B1-05: `.fourier-f` binds to `--font-display` = brand-sans. fourier wants a *serif* display tier (Fraunces). Ask glass-ui whether `--font-display` is meant to be app-overridable for a serif brand, or whether a distinct `--font-display-serif` slot should exist — so fourier isn't fighting the cascade. (Likely a fourier-local override, but book the design intent.)
- **GA-3 — hero/epicycle surface convention.** B1-01/B1-07: confirm the canonical glass-ui glass-surface recipe for a contained hero band (blur + translucency tokens) so the math hero is built on the platform substrate, not a one-off.

## Open questions

1. **Is a dedicated `/` landing route in scope for M, or does the home stay as the PaperView title page?** This forks every finding: a real landing view is the cleanest home for the hero (B1-01/06/07/09); absent that, the hero must graft onto PaperView's `<header>`. Recommend: a true landing is the idiomatic answer, but the title-page graft is the lower-risk M increment.
2. **Keep or kill Fraunces?** (B1-05) The directive's "large & audacious typography" argues *keep + wire*; if M declines, the dead woff2 + `@font-face` should be deleted to stop the orphan fetch. Needs an owner decision before the typography wave.
3. **`/` redirect-to-saved-tab vs. always-home.** `router/index.ts:31-34` sends returning visitors straight to their last tab — good for power users, but it means a hero landing would only be seen on first visit / cleared storage. Does M want the hero to win on every `/` visit, or honour the saved-tab UX?
