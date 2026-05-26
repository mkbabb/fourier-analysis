# A.W2 — Disposition ledger

Per-rule discharge record for the W2 substrate-alignment wave. Each row
names a deleted rule / migrated consumer, the disposition (fold, migrate,
retire), and the commit hash that landed the change.

Scope partition:
- W2.a — token de-fork (`fourier-overrides.css` tokens).
- W2.b — fold-to-component (`fourier-overrides.css` component rules).
- W2.c — `ios-fixes.css` fold + delete; `.styled-slider` consumer migrations + recipe retirement.
- W2.d — visual regression evidence.

The W2.a and W2.b sections are reserved for their sibling agents to append.

## §W2.c — `ios-fixes.css` + `.styled-slider` discharges

| # | source | concern / consumer | disposition | target | citing commit |
| - | - | - | - | - | - |
| c1 | `web/src/styles/ios-fixes.css:10-13` | `html { font-size: 1.125rem; line-height: 1.75rem }` — mobile-first root font sizing | fold-to-entry | `web/src/style.css` (global `html` block, post-import) | `ae84509` |
| c2 | `web/src/styles/ios-fixes.css:15-20` | `@media (min-width: 768px) html { font-size: 1rem; line-height: 1.5rem }` — tablet/desktop root font sizing | fold-to-entry | `web/src/style.css` (paired media query) | `ae84509` |
| c3 | `web/src/styles/ios-fixes.css:24-35` | `@media (max-width: 640px) .paper-article pre,code { … }` — iOS-Safari code-block overflow | fold-to-component | `web/src/components/paper/PaperView.vue` (post-`.paper-article`, via `:deep()` for scoped penetration) | `ae84509` |
| c4 | `web/src/styles/ios-fixes.css` (entire file) | file deletion + import removal | retire | deleted; `style.css` import line elided | `ae84509` |
| c5 | `web/src/components/visualization/BasisSelector.vue:150-159` (pre) → `:150-159` (post) | `class="styled-slider"` on Harmonics native range | migrate-to-substrate | `<Slider variant="glass-scrubber">` w/ `harmonicsModel` array adapter + `.basis-slider-track` retint hook | `ae84509` |
| c6 | `web/src/components/visualization/BasisSelector.vue:176-185` (pre) → `:161-170` (post) | `class="styled-slider"` on Sample-Points native range | migrate-to-substrate | `<Slider variant="glass-scrubber">` w/ `pointsModel` array adapter + `.basis-slider-track` retint hook | `ae84509` |
| c7 | `web/src/components/visualization/EditorToolsPanel.vue:48-55` (pre) → `:55-64` (post) | `class="styled-slider"` on Magnet-radius native range | migrate-to-substrate | `<Slider variant="glass-scrubber">` w/ `magnetModel` array adapter + `.magnet-slider-track` retint hook | `ae84509` |
| c8 | `web/src/components/visualization/EditorControlsDock.vue:106-115` (pre) → `:113-124` (post) | `class="styled-slider"` on Magnet-radius hover-popover native range | migrate-to-substrate | `<Slider variant="glass-scrubber">` w/ shared `magnetModel` + `.magnet-slider-track` (preserves `@mousedown.stop` / `@pointerdown.stop` dock-isolation) | `ae84509` |
| c9 | `web/src/components/morph/HarmonicLevelGrid.vue:17-26` (pre) → `:17-26` (post) | `class="styled-slider"` on low-level native range | migrate-to-substrate | `<Slider variant="glass-scrubber">` w/ `lowModel` array adapter + `.level-slider-track` retint hook | `ae84509` |
| c10 | `web/src/components/morph/HarmonicLevelGrid.vue:40-49` (pre) → `:29-38` (post) | `class="styled-slider"` on high-level native range | migrate-to-substrate | `<Slider variant="glass-scrubber">` w/ `highModel` array adapter + shared `.level-slider-track` | `ae84509` |
| c11 | `web/src/components/morph/MorphPhaseConfig.vue:21-30` (pre) → `:21-30` (post) | `class="styled-slider"` on Duration native range | migrate-to-substrate | `<Slider variant="glass-scrubber">` w/ `durationModel` array adapter + `.duration-slider-track` retint hook | `ae84509` |
| c12 | `web/src/styles/buttons.css:11-42` (pre) | `input[type="range"]:not(.styled-slider)` defensive native-range fallback (≈32 lines) | retire | zero consumers after `.styled-slider` migrations + zero plain `input type="range"` elsewhere in `web/src`; deleted with the slider recipe | `ae84509` |
| c13 | `web/src/styles/buttons.css:44-123` (pre) | `.styled-slider` slider recipe (≈80 lines: track + thumb + Firefox-fallback variants) | retire | discharged by `<Slider variant="glass-scrubber">` at all 7 consumer sites; deleted | `ae84509` |
| c14 | `web/src/composables/useMorphConfig.ts:24-37` (pre) | `sliderStyle(value, min, max, color)` helper (`--progress` + `--slider-color` factory) | retire | zero remaining consumers after the morph-side migrations (c9–c11); deleted with the styled-slider pattern it served | `ae84509` |

## §W2.a — Token de-fork

Commit: `e4177e9` — `refactor(A.W2.a): excise glass-ui-token re-declarations from fourier-overrides.css`.

Verified by `git grep -E '^\s*--(section-color|viz-|shadow-cartoon|accent-pink|accent-red|section-heading|tier-|like|success|warning|info|delete|type-admin-label|type-micro):' -- 'web/src/' ':!web/src/styles/fourier-overrides.css'` returning empty.

Disposition vocabulary used herein:

- `delete` — the rule is excised; canon (glass-ui) supplies the same token / utility under the same name and value. Verified via `grep` in `glass-ui/src/styles/{tokens,typography,theme,animations}.css`.
- `dead-token-delete` — the rule references a glass-ui surface retired upstream (e.g. v0.8.0's 4-tier glass ladder); the token resolves to nothing and the line is dead surface.
- `repair-in-place` — a regressed fork; the repair restores the canonical mechanism (often via deletion so canon takes over).
- `lift-to-glass-ui` — the rule covers a legitimate upstream gap; filed as a constellation carry; until upstream lands, a minimal named local carry survives in the override sheet (never a re-fork).

### W2.a — discharged rows (token deletions + fork repairs + dead-token deletes)

| # | rule | original lines | disposition | destination | citing commit | notes |
|---|---|---|---|---|---|---|
| a1 | `@theme { --font-serif }` | 15 | delete | canon `theme.css:50` (`--font-serif: var(--font-stack-serif)`) | `e4177e9` | exact-value duplicate |
| a2 | `@theme { --font-display }` | 17 | delete | canon `theme.css:49` | `e4177e9` | exact-value duplicate |
| a3 | `@theme { --font-mono }` | 18 | delete | canon `theme.css:52` | `e4177e9` | exact-value duplicate |
| a4 | `@theme { --font-sans }` (fork — sans → serif brand) | 16 | repair-in-place | retained as the sole survivor of the `@theme` block; W2.b folds to `App.vue` brand layer | `e4177e9` | intentional brand-level fork (Computer-Modern-Serif everywhere) — not a re-declaration; W2.b owns the fold |
| a5 | `:root` warm-cream palette (`--background…--ring`, `--shadow`, 14 tokens) | 25–41 | delete (regressed-fork repair) | canon `tokens.css:377–399` (re-rooted onto `--neutral-0..5`) | `e4177e9` | the H2 "neutral-ladder never adopted" regression repairs by deletion; canon's `--background: var(--neutral-0)` etc. takes over (saturation shifts ~3% — within the audit's named drift) |
| a6 | `:root --shadow-color`, `--radius` | 42, 45 | delete | canon `tokens.css:336, 400` | `e4177e9` | exact-value duplicates |
| a7 | `:root --glass-opacity-subtle` | 43 | dead-token-delete | retired with glass-ui v0.8.0 4-tier ladder | `e4177e9` | zero in-tree consumers verified |
| a8 | `:root --glass-blur-default` | 44 | dead-token-delete | retired with glass-ui v0.8.0 4-tier ladder | `e4177e9` | sibling `buttons.css:139,140` still references the token; W2.c removes the consumer side (rows c12/c13 above already discharge `buttons.css`) |
| a9 | `.dark` palette block (`--background…--shadow`, 14 tokens) | 48–69 | delete | canon `tokens.css:1262–1284` | `e4177e9` | exact-value duplicate |
| a10 | `@custom-variant dark (&:where(.dark, .dark *))` | 72 | delete | canon `theme.css` declares the dark variant | `e4177e9` | the directive is global; canon's declaration takes over |
| a11 | `:root --section-color-0..12` (light) | 79–91 | delete | canon `tokens.css:436–448` | `e4177e9` | byte-identical |
| a12 | `:root --accent-pink / --section-heading / --accent-red` (light) | 94–96 | delete | canon `tokens.css:451–453` | `e4177e9` | byte-identical |
| a13 | `:root --viz-fourier / -chebyshev / -legendre / -amber / -green` (light) | 99–103 | delete | canon `tokens.css:458–462` | `e4177e9` | byte-identical |
| a14 | `:root --tier-featured / -saved / --like / --success / --warning / --info / --delete` (light) | 109–115 | delete | canon `tokens.css:465–471` | `e4177e9` | byte-identical |
| a15 | `:root --shadow-cartoon / -hover / -soft / -elevated / -modal` (light) | 118–122 | delete | canon `tokens.css:485–491` | `e4177e9` | byte-identical |
| a16 | `:root --z-toast: 250` | 127 | delete | canon `tokens.css:328` ships `--z-toast: 160` | `e4177e9` | consumer's 250 is unjustified drift; adopts canon's 160 |
| a17 | `:root --type-admin-label`, `--type-micro` | 130–131 | delete | canon `typography.css:214–215` | `e4177e9` | exact-value duplicate |
| a18 | `.dark --section-color-0..12` | 136–148 | delete | canon `tokens.css:1287–1299` | `e4177e9` | byte-identical |
| a19 | `.dark --accent-pink / --section-heading / --accent-red` | 151–153 | delete | canon `tokens.css:1301–1303` | `e4177e9` | byte-identical |
| a20 | `.dark --viz-fourier / -chebyshev / -legendre / -amber / -green` | 156–160 | delete | canon `tokens.css:1305–1309` | `e4177e9` | byte-identical |
| a21 | `.dark --tier-featured / -saved / --like / --success / --warning / --info / --delete` | 163–169 | delete | canon `tokens.css:1324–1330` | `e4177e9` | byte-identical |
| a22 | `.dark --shadow-cartoon / -hover / -soft / -elevated / -modal` | 172–176 | delete | canon `tokens.css:1340–1346` | `e4177e9` | byte-identical |
| a23 | `@theme { --color-* aliases }` (accent / section / tier / viz, 14 lines) | 182–200 | delete | canon `theme.css:143–165` bridges every alias | `e4177e9` | full coverage verified by grep |
| a24 | `@layer base { * { @apply border-border } }` | 205–207 | delete | canon ships the global border reset | `e4177e9` | universal reset belongs upstream |
| a25 | `@utility text-micro` | 222–225 | delete | canon `typography.css:464` | `e4177e9` | byte-identical |
| a26 | `@utility text-admin-label` | 227–230 | delete | canon `typography.css:469` | `e4177e9` | byte-identical |
| a27 | `.cm-serif` class | 232–234 | delete | canon `@utility cm-serif` at `typography.css:527` | `e4177e9` | canon is the `@utility` form |
| a28 | `.fira-code` class | 236–239 | delete | canon `@utility fira-code` at `typography.css:531` | `e4177e9` | canon is the `@utility` form |
| a29 | `.fourier-f` (regressed fork — drops italic + `--font-display` + variation-settings) | 243–249 | repair-in-place via delete | canon `@utility fourier-f` at `typography.css:539` | `e4177e9` | regression repairs by deletion (5 in-tree consumers automatically pick up the canon's richer rule) |
| a30 | `.ease-apple`, `.ease-apple-spring` | 253–258 | delete | canon `--ease-apple` / `--ease-apple-spring` tokens at `tokens.css §1` | `e4177e9` | zero in-tree consumers of the class form |
| a31 | `@keyframes fade-in` | 262–265 | delete | canon `animations.css` ships `fade-in` | `e4177e9` | name-shadow |
| a32 | `@keyframes scale-in` | 267–270 | delete | canon `pop` transition covers; W2.b migrates the 1 consumer (`ImageUpload.vue:53`) | `e4177e9` | name-shadow |
| a33 | `@keyframes slide-up` | 272–275 | delete | canon `fade-slide` transition covers | `e4177e9` | name-shadow |
| a34 | `.animate-fade-in / -scale-in / -slide-up` classes | 277–287 | delete | W2.b migrates the 1 consumer (`ImageUpload.vue:53`) | `e4177e9` | the three keyframes die with the classes |
| a35 | `@media (prefers-reduced-motion)` guard for `.animate-*` (selectors `.animate-fade-in, .animate-scale-in, .animate-slide-up`) | 346–350 (the `.animate-*` arm only) | delete | dies with a34 | `e4177e9` | the paired `[data-state]` PRM guard (lines 351–353) survives — pairs with retained lift candidate l3 below |

**W2.a discharge tally:** 35 rows — 30 `delete` + 2 `dead-token-delete` (a7, a8) + 3 `repair-in-place` (a4 retained for W2.b fold; a5 + a29 repaired via deletion).

### W2.a — retained rows (lift candidates surviving in the file until carries land)

These rules remain in `fourier-overrides.css` pending the constellation carry's upstream landing. W2.b deletes the file after it folds out its rows and after each lift candidate has either been filed upstream or its destination definitively re-named.

| # | rule | original lines | disposition | destination | citing commit | notes |
|---|---|---|---|---|---|---|
| l1 | `--easing-accent: hsl(248 88% 71%)` | 106 | lift-to-glass-ui | `coordination/CONSTELLATION.md` carry — propose `--viz-easing` upstream | `e4177e9` | 4 in-tree consumers verified (`EasingPicker.vue:22,67,68,78`) |
| l2 | `--z-canvas-layer: 1`, `--z-canvas-overlay: 20` | 125–126 | lift-to-glass-ui | `coordination/CONSTELLATION.md` carry — propose `--z-canvas` + `--z-canvas-overlay` rungs in `tokens.css §3`, or remap onto `--z-content` / `--z-controls` | `e4177e9` | zero in-tree consumers of the override; the canvas-layer concept is real but un-named upstream |
| l3 | `[data-state="active"][role="tabpanel"]` selector + `@keyframes tab-slide-in` + paired PRM guard | 289–296 + 351–353 | lift-to-glass-ui | `coordination/CONSTELLATION.md` carry — propose the tab-panel entry animation on the glass-ui `Tabs` primitive | `e4177e9` | the selector targets a glass-ui primitive's data-attribute; the upstream should own the animation |
| l4 | `::selection { color-mix(--primary 12%/20%, transparent) }` (light + dark) | 334–341 | lift-to-glass-ui | `coordination/CONSTELLATION.md` carry — propose a glass-ui base-layer `::selection` rule | `e4177e9` | H2 §6 reconciled gap list names this as 1 of the 3 surviving gaps |

### W2.a — D4-residual dispositions (per W2.md §Scope item 8)

The two H1-flagged silent-deferral risks per `docs/audits/runs/2026-05-18-tranche-harden/h1-A-W0-W1.md §5.2 row D4`.

| item | disposition | destination | citing commit | notes |
|---|---|---|---|---|
| **Card migration** (consumer's `cartoon-card` recipe class, 30+ in-tree consumers — `EqCoefficientsPanel.vue:40`, `EquationView.vue:228,237,241,249,303`, `FunctionInput.vue:92,170`, `InfoCard.vue:17`, `HarmonicLevelGrid.vue:2`, `MorphPhaseConfig.vue:2`, `MorphShapePreview.vue:4`, `BasisCanvas.vue:478`, `BasisSelector.vue:119`, `CoefficientsPanel.vue:40`, `ContourPreview.vue:33`, `ContourSettings.vue:187`, `EditorToolsPanel.vue:26`, `ImageUpload.vue:38`, `VisualizationView.vue:160`, etc.) | **file-to-glass-ui-as-variant** | `coordination/CONSTELLATION.md` carry — propose Card primitive `tier="cartoon"` variant (or expose a `.cartoon-card` recipe class composing `glass-{tier}` + `cartoon-surface`) | `e4177e9` | the class was retired upstream at C.W5 per `glass-ui/src/styles/cards.css:2` ("`.cartoon-card` + `.elevated-card` recipe classes were removed at C.W5 per the W0 overfitting audit (Card's tier system covers both)"). The in-tree consumers currently bind to a class with no upstream declaration. If the carry stalls, W3 / a follow-up owns a named local carry that re-instates the recipe class in a residual fourier-side stylesheet |
| **CVA decision** (`class-variance-authority` listed at `web/package.json:32` as `^0.7` but zero `web/src/` imports — `grep -nE 'class-variance-authority\|cva\(' web/src/` returns empty) | **retire-with-rationale** | remove `class-variance-authority` from `web/package.json` dependencies at W4 (deploy-surface hygiene) or W6 (close ceremony) | `e4177e9` | the dependency was likely inherited from a glass-ui-ish scaffold; the consumer never adopted it. `<Button>` / `buttonVariants` shipped by glass-ui already wraps CVA upstream — the consumer does not need its own. Retire rationale: "consumer never imported; glass-ui's button-variants substrate consumes CVA internally and re-exports the typed shape" |

## §W2.b — Fold-to-component (`fourier-overrides.css`)

Commit: `f934ff2` — `refactor(A.W2.b): fold-to-component the surviving fourier-overrides rules + delete the file`.

Discharge tally: 5 fold-to-entry + 1 fold-to-component + 2 lift-to-glass-ui (each as a documented local carry) + 1 dead-token-delete + 1 file deletion.

The brief allotted "7 fold-to-component + 4 lift candidates". The empirical home for the brand fork, the app-shell pair, the KaTeX block, and the `::selection` rule is the entry stylesheet — these are app-wide concerns and the per-component fold would have fragmented a single global decision across many `<style scoped>` blocks (DRY violation). One lift candidate (`--easing-accent`) folds to its sole consumer; one (canvas-layer z-rungs) is dead surface and retires outright per W2.md scope item 8's no-silent-deferral discipline.

### W2.b — fold rows

| # | rule | original lines (`fourier-overrides.css` post-W2.a) | disposition | destination | citing commit | notes |
|---|---|---|---|---|---|---|
| b1 | `@theme { --font-sans: "Computer Modern Serif", … }` (brand fork) | 22–24 | fold-to-entry | `web/src/style.css:11-13` (`@theme` block at the entry) | `f934ff2` | `@theme` is a Tailwind-theme directive; it acts globally — folding to a per-component `<style scoped>` block would not register with Tailwind. The entry is its only valid home. |
| b2 | `@layer base { html, body { @apply bg-background text-foreground font-serif; min-height: 100dvh } }` | 43–48 | fold-to-entry | `web/src/style.css:17-22` (`@layer base`) | `f934ff2` | app-shell concern — the entry is the canonical home; `App.vue` template already carries `class="bg-background text-foreground"` so the base-layer rule is the substrate guarantee. |
| b3 | `body { padding-bottom: env(safe-area-inset-bottom) }` | 50–52 | fold-to-entry | `web/src/style.css:24-26` (paired with b2 inside `@layer base`) | `f934ff2` | safe-area inset is a viewport-level concern; pairs with b2 in the same `@layer base` block. |
| b4 | KaTeX `@font-face` swap (12 families) + `.katex` / `.katex-display` / `.dark .katex` sizing | 57–87 | fold-to-entry | `web/src/style.css:52-87` | `f934ff2` | KaTeX renders math across ≥6 components (`PaperView`, `EquationPanel`, `EquationResult`, `ConvergencePlot`, `EqCoefficientsPanel`, et al.); per-component folding would duplicate the font-face block 6× (DRY violation). Single entry is canonical. |
| b5 | `::selection` (light + dark, `color-mix(--primary 12%/20%, transparent)`) | 91–98 | lift-to-glass-ui (as documented local carry) | `web/src/style.css:28-34` (local carry inside `@layer base`) + `coordination/CONSTELLATION.md` row "A → glass-ui `::selection` base" | `f934ff2` | the upstream destination is the glass-ui base layer; until that lands, the carry is at the entry because `::selection` is a document-level pseudo-element with no scoped surface. |
| b6 | `[data-state="active"][role="tabpanel"] { animation: tab-slide-in 0.18s }` + `@keyframes tab-slide-in` + paired PRM guard | 102–116 | lift-to-glass-ui (as documented local carry) | `web/src/style.css:89-102` (local carry) + `coordination/CONSTELLATION.md` row "A → glass-ui Tabs entry animation" | `f934ff2` | the selector targets a glass-ui primitive's data-attribute (`UnderlineTabs` ships the `data-state`); the animation belongs on the upstream primitive. 3 in-tree consumers. Until upstream lands, the rule lives at the entry rather than fragmenting across 3 consumer `<style>` blocks. |
| b7 | `--easing-accent: hsl(248 88% 71%)` | 32 | lift-to-glass-ui (as scoped local carry) | `web/src/components/visualization/EasingPicker.vue:37-44` (scoped to `.easing-section`) + `coordination/CONSTELLATION.md` row "A → glass-ui `--viz-easing`" | `f934ff2` | sole-consumer rule — 4 references all inside `EasingPicker.vue`. Scoping the carry to the component is tighter than the entry-level form previously used. |
| b8 | `--z-canvas-layer: 1`, `--z-canvas-overlay: 20` | 36–37 | dead-token-delete | (deleted; not relocated) | `f934ff2` | zero in-tree consumers (`git grep z-canvas-layer\\|z-canvas-overlay` returned empty); the rule was dead surface even pre-W2.a. The constellation row that W2.a previously filed (l2 — propose `--z-canvas` / `--z-canvas-overlay` rungs in `tokens.css §3`) is withdrawn since the consumer never used the names. Per the brief's "discover dead → delete outright with rationale". |
| b9 | `fourier-overrides.css` (entire file) | 117 lines (post-W2.a) | retire | deleted; `style.css` import line elided (the import had already been removed by W2.a's pass; verified absent) | `f934ff2` | with b1–b7 relocated and b8 retired outright, the file is empty of named surface and is deleted in full per W2.md hard gate #1. |

**W2.b discharge tally:** 9 rows — 4 fold-to-entry (b1–b4) + 2 lift-as-documented-local-carry-at-entry (b5–b6) + 1 lift-as-scoped-local-carry (b7) + 1 dead-token-delete (b8) + 1 file deletion (b9). Hard gate #1 satisfied (file does not exist); hard gate #2 satisfied (every rule discharged); invariant 7 satisfied (every lift names its upstream destination).

## §W2.d — Visual regression evidence

Discharge of the W2.d agent unit per `W2.md §"A.W2.d — Visual regression
evidence"` and hard-gate item 4. Full account at
`docs/tranches/A/audit/W2-visual-regression.md`.

| # | route(s) captured | screenshots | parity verdict | disposition | destination | citing commit |
| - | - | - | - | - | - | - |
| d1 | `/paper`, `/visualize`, `/gallery`, `/morph`, `/equation` (5 routes — every surface touched by W2.a/b/c) | `audit/W2-screenshots/{paper,visualization,gallery,morph,equation}-after.png` + `console-errors.log` | DRIFT (all five routes — single root cause) | drift-observed-substrate-blocker-triumvirate-class | `W2-visual-regression.md §3` — the substrate-side `@mkbabb/glass-ui → @mkbabb/value.js: parseCSSStylesheet` import fault predates W2 (reproduces at `4184d7a` via the same `App.vue:3` glass-ui import); not attributable to W2.a/b/c — filed as constellation carry, with hard-gate item 6 (build green) acting as the surrogate completion check for item 4 | `32c23fc` |

**W2.d discharge tally:** 1 row — 5 routes captured under a single
DRIFT verdict whose triage resolves to a pre-W2 substrate blocker
(not a W2.a/b/c regression). The W2.d sub-gate is partially satisfied
— screenshots saved and drift triaged; the "before close" predicate
defers to the substrate fix or accepts the build-green surrogate per
the regression report's recommendation.

## §W2.e — Full `buttons.css` abrogation

Per user directive of 2026-05-26 the W2/W3 split is revoked: the entire
`.btn-*` + `.basis-pill` migration is pulled into W2 and `buttons.css`
deletes here rather than waiting on W3. The W3.md scope retains the
native-`<button>` migration concern only.

Architectural transpositions chosen per recipe (the smallest idiomatic
glass-ui primitive that ships the four-state focus / press / disabled /
hover contract; bespoke geometry filed as a per-component scoped retint
hook over the variant — the A.md invariant 10 escape hatch):

- `.btn-icon-admin` → `<Button variant="glass" size="icon">` + scoped
  `.admin-overlay-btn` (1.75 rem circle + lift-on-hover) — the variant
  ships glass-bg / border / focus-ring; the overlay overrides geometry
  and the scale-hover idiom unique to the admin surface.
- `.btn-solid` → `<Button variant="default">` — the canonical primary
  CTA. The recipe's `--foreground`/`--background` token pair was a
  reinvented primary palette; the variant routes through `--primary` /
  `--primary-foreground` which is the canonical equivalent at the
  glass-ui token surface (the de-fork landed at W2.a).
- `.btn-ghost` → `<Button variant="outline">` — the recipe's 2 px
  bordered + transparent-bg + hover-muted geometry matches outline's
  `border-input bg-background hover:bg-accent` exactly.
- `.basis-pill` (interactive toggle, BasisSelector) → `<Button
  variant="outline" size="sm">` + scoped `.basis-toggle` retint hook +
  `aria-pressed` for the active state (replaces the prior `.active`
  class-binding with a semantic ARIA contract the canon already reads).
- `.basis-pill` (decorative read-only, GalleryCard + GalleryCardModal)
  → `<Badge variant="outline" size="sm">` + scoped `.basis-tint`
  retint. The decorative use was never a button — the migration to
  `<Badge>` aligns the semantic primitive with the visual role.

| # | source | concern / consumer | disposition | target | citing commit |
| - | - | - | - | - | - |
| e1 | `web/src/styles/buttons.css:17-43` (pre) | `.btn-icon-admin` recipe (1.75 rem circle, glass bg, scale-hover + scale-active, focus-visible ring) | retire | discharged by `<Button variant="glass" size="icon">` + scoped `.admin-overlay-btn` at all 3 consumer sites | `10e616c` |
| e2 | `web/src/styles/buttons.css:45-72` (pre) | `.btn-solid` recipe (primary CTA pill, opacity-hover, disabled geometry) | retire | discharged by `<Button variant="default">` at the ExportModal CTA | `10e616c` |
| e3 | `web/src/styles/buttons.css:74-98` (pre) | `.btn-ghost` recipe (bordered transparent secondary, muted-hover, disabled geometry) | retire | discharged by `<Button variant="outline">` at the ExportModal cancel | `10e616c` |
| e4 | `web/src/styles/buttons.css:100-104` (pre) | `.basis-pill` recipe (`--pill-c`-tinted plate, used by both interactive + decorative sites — the recipe over-served two distinct roles) | retire | discharged by two distinct migrations: `<Button variant="outline" size="sm">` for the interactive toggle, `<Badge variant="outline" size="sm">` for the decorative pills | `10e616c` |
| e5 | `web/src/components/visualization/gallery/GalleryCard.vue:121-141` (pre) → `:121-144` (post) | 3 `class="btn-icon-admin"` native `<button>` overlay sites (Crown / Bookmark / Trash2 admin actions) | migrate-to-substrate | `<Button variant="glass" size="icon" class="admin-overlay-btn …">` × 3 + scoped `.admin-overlay-btn` retint hook (h-7 w-7 rounded-full + scale-hover 1.1 / scale-active 0.95) | `10e616c` |
| e6 | `web/src/components/visualization/gallery/GalleryCard.vue:84-92` (pre) → `:84-94` (post) | `class="basis-pill"` decorative read-only pill (`<span v-for>`, no click handler) | migrate-to-substrate | `<Badge variant="outline" size="sm" class="basis-tint …">` + scoped `.basis-tint` retint hook (`--pill-c`-tinted plate / border / text) | `10e616c` |
| e7 | `web/src/components/visualization/gallery/GalleryCardModal.vue:132-140` (pre) → `:132-142` (post) | `class="basis-pill"` decorative read-only pill (identical role to e6) | migrate-to-substrate | `<Badge variant="outline" size="sm" class="basis-tint …">` + scoped `.basis-tint` retint hook (shared recipe with e6) | `10e616c` |
| e8 | `web/src/components/visualization/ExportModal.vue:85` (pre) → `:85` (post) | `class="btn-ghost"` Cancel button | migrate-to-substrate | `<Button variant="outline" size="default">` — outline variant's bordered-transparent geometry is the canonical reproduction | `10e616c` |
| e9 | `web/src/components/visualization/ExportModal.vue:86-89` (pre) → `:86-89` (post) | `class="btn-solid"` Save-PNG CTA | migrate-to-substrate | `<Button variant="default" size="default">` — primary-bg variant; aligns the CTA onto the canonical `--primary` token (the recipe's `--foreground` / `--background` was a reinvented primary palette) | `10e616c` |
| e10 | `web/src/components/visualization/BasisSelector.vue:133-141` (pre) → `:133-144` (post) | `class="basis-pill"` interactive toggle pill × 3 (fourier / chebyshev / legendre selectors, with `.active` state binding) | migrate-to-substrate | `<Button variant="outline" size="sm" :aria-pressed="…" class="basis-toggle …">` + scoped `.basis-toggle` retint hook (2 px border, 5.5 rem min-width, mobile-compact rules, `aria-pressed="true"` drives the `--pill-color` tint — the prior `.active` class-binding is replaced with a semantic ARIA contract glass-ui's canon already reads via `aria-pressed:` modifiers in `buttonVariants`) | `10e616c` |
| e11 | `web/src/lib/equation/notation.ts:3-7` (pre) → `:3-9` (post) | comment-only reference to `.basis-pill` pattern from BasisSelector | repair-in-place | comment updated to cite the post-migration vocabulary (`<Button variant="outline" size="sm">` + `aria-pressed`-driven tint via `.basis-toggle`) | `10e616c` |
| e12 | `web/src/styles/buttons.css` (entire file) | file deletion | retire | deleted; `web/src/style.css:4` import elided. `web/src/styles/` directory is empty and removed (`rmdir`). | `10e616c` |

**W2.e discharge tally:** 12 rows — 4 recipe retires (e1–e4) + 7
consumer migrations across 4 files (e5–e7 Gallery decorative, e8–e9
ExportModal interactive, e10 BasisSelector toggle) + 1 comment
repair-in-place (e11) + 1 file deletion (e12). The `web/src/styles/`
directory is now empty in full and removed from the tree; the
override-stylesheet abrogation wave closes the substrate-alignment
chapter at this row. `buttons.css` ceases to exist; the hard gate of
W3.md item 2 ("`buttons.css` deleted") lands here, ahead of W3's
native-`<button>` migration.

**Verification:**
- `git grep -nE 'buttons\.css|\.btn-(icon-admin|solid|ghost)|\.basis-pill' -- 'web/src/'` returns empty (the `.basis-pill-btn` class in `GallerySearchBar.vue` is a distinct self-contained recipe outside the `.basis-pill` lineage; not in scope).
- `npx vue-tsc -b --force` exits 0 (clean typecheck across the post-W2.e consumer surface).
- `npm run build` carries the W2.d-documented pre-existing substrate blocker (`@mkbabb/glass-ui → @mkbabb/value.js: parseCSSStylesheet` import fault); reproduced on baseline `88c1858` via `git stash` to confirm the blocker is not attributable to W2.e — the build-green surrogate is the typecheck per W2.d row d1's precedent.
- Browser smoke: `/gallery` and `/visualize` render the surrounding chrome cleanly with zero console errors (dev DB empty so the live `.basis-pill` / `.btn-icon-admin` / ExportModal surfaces could not be exercised against entries — the cleanly-rendered router + header + upload pipeline confirms no broken cascade from the CSS migration); screenshots at `audit/W2-screenshots/buttons-abrogated-{gallery,visualize-basis,visualize-chrome}.png`.

## §W2.f — Cross-repo glass-ui font-asset URL discharge

The fourier dev log surfaced a contract-v2-side font fault on every
boot: `request id "/Users/mkbabb/Programming/glass-ui/src/fonts/fira-code/fira-code-latin.woff2" is outside of Vite serving allow list`,
issuing a 403 against the woff2 face on first paint. Per the standing
CONSTELLATION.md carry row (filed at A.W2.d, "A → glass-ui font-asset
URL hygiene"), the fault lives at the publisher (glass-ui) — the
contract-v2 strike of the consumer-side sibling-`src/` `fs.allow`
widening makes the substrate-side font-URL hygiene a contract-level
obligation. The W2.f wave is the cross-repo discharge of that row.

The architectural diagnosis distinguished two candidate fixes:

- **Option A** — copy `src/fonts/` → `dist/fonts/`, preserve relative
  `url("../fonts/...")` form. Structural blocker: Vite resolves CSS
  `url()` against the file's `realpath`, which under the consumer's
  `file:` symlink resolves the relative path back to the sibling's
  filesystem (`/Users/.../glass-ui/dist/fonts/...`) — OUTSIDE the
  consumer's project root; the `/@fs/` channel still gates on
  `server.fs.allow` and 403s. Bare-package-specifier URLs
  (`url("@mkbabb/glass-ui/fonts/...")`) likewise fail — Vite's CSS
  pipeline does not resolve bare specifiers inside `url()` the way it
  does inside `@import`. The relative URL is structurally locked to
  the sibling's realpath; no source-side rewrite escapes it.

- **Option B** — inline the woff2 files as
  `url("data:font/woff2;base64,…")` in the published CSS at build
  time. The font request layer dissolves; the `fs.allow` triangle
  dissolves with it. Total font corpus is 124 KB raw → ~165 KB
  base64-encoded → ~120 KB gzipped. Within the inline-asset register
  for a once-loaded design-system CSS, and self-contained for cdn /
  npm-published consumers alike.

Option B selected — Option A's blocker is structural (Vite's
symlink-realpath resolution axis), not a glass-ui-internal config
defect. Glass-ui's `vite.config.ts` gains a small `closeBundle`
plugin (`publishStyleAssets`) that cpSyncs `src/fonts/` →
`dist/fonts/` + `src/styles/` → `dist/styles/`, then walks every
`*.css` in `dist/styles/` and substitutes
`url("@mkbabb/glass-ui/fonts/<family>/<face>.woff2")` with a base64
data URI built from `src/fonts/<family>/<face>.woff2`. The
`typography.css` source adopts the package-specifier URL form (4
substitutions: Plus Jakarta latin + latin-ext, Fira Code latin +
latin-ext). `package.json` exports updates `"./styles"` from
`./src/styles/index.css` to `./dist/styles/index.css` (§2.1
conformant) and adds `"./fonts/*": "./dist/fonts/*"` for any future
per-asset consumer of the raw woff2.

| # | source | concern | disposition | target | citing commit |
| - | - | - | - | - | - |
| f1 | `glass-ui/src/styles/typography.css:56,72,137,152` (pre) | 4 `@font-face` `url("../fonts/<family>/<face>.woff2")` source paths reaching back into `src/fonts/` from a `dist/`-published CSS | rewrite-and-inline | source CSS adopts package-specifier form `url("@mkbabb/glass-ui/fonts/...")`; `publishStyleAssets` plugin substitutes each at build time with `url("data:font/woff2;base64,…")` baked into `dist/styles/typography.css` | glass-ui `e123dc1` |
| f2 | `glass-ui/vite.config.ts` (pre) | library-mode build emitted neither `dist/fonts/` nor `dist/styles/`, leaving the `./styles` export pointed at `src/` | plugin-add | `publishStyleAssets` plugin (closeBundle hook) cpSyncs both directories into `dist/` and walks the CSS to inline woff2 face assets; reads `__dirname` to scope to the package root, no new dep introduced | glass-ui `e123dc1` |
| f3 | `glass-ui/package.json:217` (pre) | `"./styles": "./src/styles/index.css"` — exports key pointed into `src/`, violating contract-v2 §2.1 (every exports key MUST point into `dist/`) | repair-in-place | rewrite to `"./styles": "./dist/styles/index.css"`; add `"./fonts/*": "./dist/fonts/*"` subpath pattern for per-asset font specifier consumers | glass-ui `e123dc1` |
| f4 | `fourier-analysis/docs/tranches/A/coordination/CONSTELLATION.md:47` (pre) | the `A → glass-ui font-asset URL hygiene` carry row was filed (W2.d) but unresolved | discharge | row annotated **DISCHARGED at glass-ui `e123dc1`** with Option-B rationale + cross-reference to W2.f | this commit |

**W2.f discharge tally:** 4 rows — 3 cross-repo glass-ui edits
(f1 typography.css URL rewrite, f2 vite.config.ts plugin, f3
package.json exports repair) all landed in glass-ui `e123dc1` +
1 fourier-side coordination update (f4 CONSTELLATION row
discharge). The cross-repo write is deliberate per the
scope-reveal protocol (W2.md §Triumvirate, instructions/tranche
SPEC.md §"Scope Reveal"): substrate-side failures escalate to
substrate-side fixes; fourier does NOT add the
sibling-`src/`-widening `fs.allow` back to its own `vite.config`
(contract-v2 strikes that — §2.2 is firm).

**Verification:**
- `ls /Users/mkbabb/Programming/glass-ui/dist/fonts/{fira-code,plus-jakarta-sans}/*.woff2` returns all 4 face files (cpSync emitted them post-build).
- `grep -c 'data:font/woff2' /Users/mkbabb/Programming/glass-ui/dist/styles/typography.css` → 4 (one per face; the source `url(...)` rewrites are inlined verbatim by the plugin's `closeBundle` walk).
- `du -h /Users/mkbabb/Programming/glass-ui/dist/styles/typography.css` → 154K (was ~26K pre-inline; 128K of base64 woff2 payload + the pre-existing utility classes).
- fourier dev server (`pkill vite; rm -rf node_modules/.vite; npm run dev`) boots clean — `tail /tmp/fourier-dev.log` shows no 403 / `outside of Vite serving allow list` errors.
- Playwright probe at `/morph` (the route that previously surfaced the 403 against `fira-code-latin.woff2`): zero console errors, zero font-request 403s; full-page screenshot at `audit/W2-screenshots/font-fix-after.png`.
