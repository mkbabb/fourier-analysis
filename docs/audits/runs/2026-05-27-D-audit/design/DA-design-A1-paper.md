# DA-design-A1 — The Paper Surface (`/paper`)

**Lane:** A1 — design refinement audit (frontend-design lens)
**Scope:** the rendered academic-paper companion at `/paper`
**Framing (per DA6):** this is an AUDIT of the SHIPPED surface — per-screen findings + surgical refinements, NOT a redesign or rebrand. READ-ONLY: no source touched.
**Date:** 2026-05-27
**Screenshot:** `docs/audits/runs/2026-05-27-D-audit/screens/d-paper.png`

---

## 1. What the surface IS

The `/paper` route renders the full ~97-page "An Introduction to Fourier Analysis" as a single virtualized scroll companion inside the dark app shell. Grounded in the screenshot + source:

- **Global chrome** (`web/src/App.vue:23`, `web/src/components/layout/AppHeader.vue`): a sticky translucent header (`bg-background/90 backdrop-blur-md`, `AppHeader.vue:51`) carrying the monospace-flavoured "ℱourier analysis" wordmark (the ornamental `ℱ` via the `.fourier-f` display face, `AppHeader.vue:65`), a thin vertical divider, a single icon+label nav dropdown tinted amber (`--viz-amber`, `AppHeader.vue:183,189`), and a right cluster (admin badge, user-slug bar, dark-mode toggle). The whole shell wears a subtle `paper-texture` (`App.vue:23`, def in glass-ui `cards.css:10`).

- **Two-column reading layout** (`PaperView.vue:277,463-475`): on `lg` (≥1024px) a `220px minmax(0, 48rem)` grid — a sticky bordered TOC card (`PaperSidebar.vue:48`) beside the main article card. Below `lg` the sidebar collapses; an inline TOC renders once (`PaperView.vue:306`) and a sticky floating TOC bar appears on scroll (`MobileFloatingToc.vue`).

- **The article** (`PaperView.vue:296-331`): a card with `2px` solid border + a `3px 3px 0` hard offset shadow (`PaperView.vue:432-435`) — a deliberate "cartoon/cut-paper" surface that matches the sidebar card. Centered display title set in Computer Modern Serif (`cm-serif`, `PaperView.vue:298-302`), with the ornamental `ℱ` as a drop-letter. Body is CM Serif at `1.125rem`/`1.8` desktop (theme.css `section-body`), KaTeX math at `1.02em` inline / `1.1em` display (`style.css:69-82`).

- **Content blocks** (latex-paper `theme.css`): theorem blocks with left-accent + corner bracket (`theme.css:66-108`), proof blocks (`theme.css:206`), GitHub-style syntax-highlighted code (`theme.css:235-418`), cross-reference links as dashed underlines (`theme.css:13`), figures auto-inverted in dark mode (`theme.css:604-608`), and an interactive "Open Visualizer" callout pill (`PaperArticleWindow.vue:70-82,124`).

- **Navigation furniture**: a `Cmd/Ctrl-K` search (`PaperView.vue:113-118`) with sidebar/floating/modal variants (`PaperSearch.vue`); a bottom overlay showing `pg N / 97` (left) + a circular back button with a history badge (right) (`PaperView.vue:337-355`); top/bottom edge-fade gradients on the scroll region (`PaperView.vue:370-401`).

- **Performance** (`PaperView.vue:67-85`): the article is genuinely virtualized via `useVirtualSectionWindow` with overscan tuning — `e2e/paper-performance.spec.ts:3` asserts ≤18 sections mounted at any scroll position across the whole 97-page corpus. A teleport overlay (`PaperView.vue:412-424`) masks far TOC jumps. This is a real engineering strength, not a polish gap.

**Net read:** a confident, coherent, genuinely distinctive surface. The cut-paper card border + offset shadow, the CM Serif body, the ornamental `ℱ`, and the per-chapter color spine give it a strong identity well clear of generic AI aesthetics. The findings below are refinements, not repairs.

---

## 2. Prioritized findings

Severity: **High** = contrast/a11y or breaks reading; **Med** = visible polish gap; **Low** = nicety.

| # | Sev | Finding | Location (file:line) | Surgical recommendation |
|---|-----|---------|----------------------|--------------------------|
| 1 | **High** | **No keyboard focus indicator on TOC links.** Sidebar links and floating-TOC items are glass-ui `variant="ghost"` `Button`s that override `background:none;border:none` (`PaperSidebar.vue:215-221`) and add NO focus style; the glass-ui Button base variant carries no `focus-visible:` ring (verified in `dist/glass-ui.js:270`), and only `.paper-search-input-wrap:focus-within` exists in the whole tree. A keyboard user tabbing the TOC sees nothing. | `PaperSidebar.vue:215`, `MobileFloatingToc.vue:336`, `PaperArticleWindow.vue:124` (callout) | Add `&:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: inherit; }` to `.sidebar-link`, `.floating-toc-item`, and `.callout-btn`. The header already does exactly this at `AppHeader.vue:174-177` — mirror it. |
| 2 | **High** | **Light-mode amber nav label fails WCAG AA.** The active nav-trigger label + icon use `--viz-amber`, which in light mode resolves to `hsl(35 70% 42%)` = **3.54:1** vs the light page — below the 4.5:1 floor for normal text. The drop-shadow glow does not help legibility. | `AppHeader.vue:187-190,326-329`; token `tokens.css:475`→`section-color-5` light `:455` | Darken the light-mode `--viz-amber`/`--section-color-5` toward `hsl(35 75% 36%)` (≈4.6:1), OR bump the nav label to `font-weight:600`+ and treat as large text. Dark mode is fine (10.55:1). |
| 3 | **High** | **Light-mode section colors used as small text dip below AA.** Section headings/numbers and active TOC links are tinted with `--section-color-N` (`theme.css:476,481`, `PaperSidebar.vue:76`). In light mode `sc5` amber = 3.54:1 and `sc4` forest = 4.45:1 vs the card — both under 4.5:1 for the small `section-number` (`theme.css:484`, `0.95rem`) and sub-link text. Headings are large-text-exempt; the small numbers are not. | `theme.css:476,481,491-499`; light section colors `tokens.css:450-459` | These are shared tokens — file the amber/forest light-mode lift (≈ -6% L) as a glass-ui carry; locally, the `section-number` already drops to 50% mix (`theme.css:493`) which worsens it — raise that floor to 70% for the lightest 2–3 hues. Dark mode passes (all ≥5.98:1). |
| 4 | **Med** | **Code-block background ignores the theme card token and is hardcoded.** Dark code panes are `#0d1117` (`theme.css:253`) on a `--card` of `hsl(24 8% 10%)` ≈ `#1a1815` — only **1.08:1** separation, so the code block reads as a near-flat hole with no surface step from the card. Light is `#ffffff` (`theme.css:240`) on a warm-white card — a cold pure-white rectangle in an otherwise warm-neutral page. | `theme.css:240,248-254` | Tie the code surface to the palette: dark → `color-mix(in srgb, var(--background) 80%, #000)` or a token rung; light → `var(--neutral-1)` warm field instead of pure `#fff`. Keep the hljs token hues. This is a latex-paper theme carry. |
| 5 | **Med** | **Two competing card-shadow vocabularies on one screen.** The article + sidebar use a hard cartoon offset shadow `3px 3px 0` (`PaperView.vue:435`, `PaperSidebar.vue:164`), but the theorem blocks (`theme.css:74`), proof blocks, search modal (`PaperSearch.vue:260`), and overlay back-button (`PaperView.vue:507`) use soft blurred `rgba(0,0,0,.x)` shadows. The two idioms read as two design languages stacked. | `PaperView.vue:435` vs `theme.css:74`; `PaperSearch.vue:260` | Pick one elevation language for the paper surface. Cheapest: keep the cartoon offset for the two outer cards (identity), and ensure inner blocks use a single soft-shadow token rung consistently — currently they each hand-roll their own rgba. |
| 6 | **Med** | **Sub-link type scale is sub-pixel-snapped and inconsistent.** TOC link sizes step `text-base → 0.78rem → 0.72rem` (`PaperSidebar.vue:222,268,279`) with paddings in `0.28/0.2/0.15rem` and number font `0.72rem` (`:245`) — values that don't sit on a shared spacing/type scale and produce uneven optical rhythm in the dense sidebar (visible in the screenshot's TOC). | `PaperSidebar.vue:222-281` | Snap the three TOC tiers to the glass-ui type ramp (`text-base / text-sm / text-xs`) and a single padding token set. Removes the `0.78`/`0.72` magic numbers. |
| 7 | **Med** | **Reading measure runs slightly long on wide desktop.** The article inner column is `48rem` minus `2.5rem` padding ≈ **~76 characters/line** at the `1.125rem` desktop body (`PaperView.vue:473`, `theme.css:524-528`). 76 cpl is at the top edge of the comfortable 45–75 range; long proofs feel dense. | `PaperView.vue:473` | Tighten the content column to `minmax(0, 44rem)` (≈68 cpl) or nudge `section-body` line-height from `1.8`; the sidebar gap can absorb the difference. Minor — body text is otherwise well set. |
| 8 | **Low** | **Em-dash edge fades can clip a sticky chapter heading.** The `2rem` top edge-fade (`PaperView.vue:381-390`) overlays the scroll region at `--z-content`, while sticky chapter headers sit at `z-index:10` (`theme.css:444-446`). On scroll the fade can wash the top of a freshly-stuck heading. | `PaperView.vue:370-401`, `theme.css:443-453` | Reduce the top fade height to `1.25rem` or raise the sticky header above the fade's z-band; verify against the sticky `section-header--chapter`. |
| 9 | **Low** | **Overlay page indicator + back button have asymmetric affordance weight.** The `pg N/97` chip is near-invisible (`muted-foreground` at 70% mix, `PaperView.vue:549`) while the back button is a full glass circle with hover scale (`PaperView.vue:492-522`). For a 97-page doc the page locator is the more useful wayfinding signal yet reads weakest. | `PaperView.vue:546-559` | Lift the page chip to a faint glass pill matching the back button's `glass-subtle` treatment (it already has the `.glass-subtle` class at `:338` but no padding/border to make it legible), giving the two overlay elements equal visual weight. |
| 10 | **Low** | **Callout pill is the only saturated `--primary` fill on the surface.** The "Open Visualizer" pill (`PaperArticleWindow.vue:124-137`) is a solid `--primary` rounded button with a colored glow — visually louder than anything else in the reading column, and `--primary` in this fork is near-black/near-white (it's the foreground token, `tokens.css:408/1316`), so the pill is a high-contrast slab rather than an accent. | `PaperArticleWindow.vue:124-137` | Intentional CTA, but consider an outline/tonal treatment (border + tinted fill in a section accent) so it reads as "an invitation within the paper" rather than a generic app button. Lowest priority. |

---

## 3. Top refinements for tranche-D's design thread

Ranked by value to the design thread (effort-to-impact):

1. **Restore a focus ring across all paper navigation (Finding 1, High).** This is the single highest-value fix: it is a genuine WCAG 2.4.7 failure affecting every keyboard user on the TOC, the surface's primary navigation. The fix is one `:focus-visible` block per link class, copied from the pattern already in `AppHeader.vue:174`. Surgical, no visual cost in the default (mouse) path.

2. **Lift the light-mode amber + section colors to AA (Findings 2 & 3, High).** The amber nav label (3.54:1) and the lightest section-color text are the only contrast failures on the surface, and they sit on shared glass-ui tokens — so this is best discharged as a token carry (≈ -6% lightness on `section-color-4/5` in `:root`) that fixes the paper AND every other surface at once. Dark mode is already clean.

3. **Unify the code-block surface with the palette (Finding 4, Med).** The hardcoded `#0d1117`/`#ffffff` code panes are the most "generic" element on an otherwise bespoke surface — a near-invisible step from the dark card and a cold white slab in light. Tying the code background to a warm-neutral token rung makes the listings feel native to the paper. latex-paper theme carry.

4. **Collapse the dual shadow vocabulary (Finding 5, Med).** Deciding that the cartoon offset shadow is the paper's outer-card identity and that all inner blocks share one soft-shadow token would remove the "two design languages" read and is the highest-leverage *coherence* (not contrast) move.

5. **Snap the TOC type/spacing to the scale (Finding 6, Med).** The `0.78`/`0.72rem` magic numbers in the sidebar are the clearest "unfinished" tell in the chrome; snapping the three tiers to `text-base/sm/xs` + one padding token tightens the densest, most-looked-at piece of furniture.

**Out of scope / explicitly preserved:** the archaic diction (house style), the CM Serif body, the ornamental `ℱ`, the cartoon card border, the gold/purple/per-chapter accent spine, and the virtualization architecture (`paper-performance.spec.ts` proves it works — do not touch). No rebrand proposed.
