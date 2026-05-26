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

Commit: `<W2.a-hash>` — `refactor(A.W2.a): excise glass-ui-token re-declarations from fourier-overrides.css`.

Verified by `git grep -E '^\s*--(section-color|viz-|shadow-cartoon|accent-pink|accent-red|section-heading|tier-|like|success|warning|info|delete|type-admin-label|type-micro):' -- 'web/src/' ':!web/src/styles/fourier-overrides.css'` returning empty.

Disposition vocabulary used herein:

- `delete` — the rule is excised; canon (glass-ui) supplies the same token / utility under the same name and value. Verified via `grep` in `glass-ui/src/styles/{tokens,typography,theme,animations}.css`.
- `dead-token-delete` — the rule references a glass-ui surface retired upstream (e.g. v0.8.0's 4-tier glass ladder); the token resolves to nothing and the line is dead surface.
- `repair-in-place` — a regressed fork; the repair restores the canonical mechanism (often via deletion so canon takes over).
- `lift-to-glass-ui` — the rule covers a legitimate upstream gap; filed as a constellation carry; until upstream lands, a minimal named local carry survives in the override sheet (never a re-fork).

### W2.a — discharged rows (token deletions + fork repairs + dead-token deletes)

| # | rule | original lines | disposition | destination | citing commit | notes |
|---|---|---|---|---|---|---|
| a1 | `@theme { --font-serif }` | 15 | delete | canon `theme.css:50` (`--font-serif: var(--font-stack-serif)`) | `<W2.a>` | exact-value duplicate |
| a2 | `@theme { --font-display }` | 17 | delete | canon `theme.css:49` | `<W2.a>` | exact-value duplicate |
| a3 | `@theme { --font-mono }` | 18 | delete | canon `theme.css:52` | `<W2.a>` | exact-value duplicate |
| a4 | `@theme { --font-sans }` (fork — sans → serif brand) | 16 | repair-in-place | retained as the sole survivor of the `@theme` block; W2.b folds to `App.vue` brand layer | `<W2.a>` | intentional brand-level fork (Computer-Modern-Serif everywhere) — not a re-declaration; W2.b owns the fold |
| a5 | `:root` warm-cream palette (`--background…--ring`, `--shadow`, 14 tokens) | 25–41 | delete (regressed-fork repair) | canon `tokens.css:377–399` (re-rooted onto `--neutral-0..5`) | `<W2.a>` | the H2 "neutral-ladder never adopted" regression repairs by deletion; canon's `--background: var(--neutral-0)` etc. takes over (saturation shifts ~3% — within the audit's named drift) |
| a6 | `:root --shadow-color`, `--radius` | 42, 45 | delete | canon `tokens.css:336, 400` | `<W2.a>` | exact-value duplicates |
| a7 | `:root --glass-opacity-subtle` | 43 | dead-token-delete | retired with glass-ui v0.8.0 4-tier ladder | `<W2.a>` | zero in-tree consumers verified |
| a8 | `:root --glass-blur-default` | 44 | dead-token-delete | retired with glass-ui v0.8.0 4-tier ladder | `<W2.a>` | sibling `buttons.css:139,140` still references the token; W2.c removes the consumer side (rows c12/c13 above already discharge `buttons.css`) |
| a9 | `.dark` palette block (`--background…--shadow`, 14 tokens) | 48–69 | delete | canon `tokens.css:1262–1284` | `<W2.a>` | exact-value duplicate |
| a10 | `@custom-variant dark (&:where(.dark, .dark *))` | 72 | delete | canon `theme.css` declares the dark variant | `<W2.a>` | the directive is global; canon's declaration takes over |
| a11 | `:root --section-color-0..12` (light) | 79–91 | delete | canon `tokens.css:436–448` | `<W2.a>` | byte-identical |
| a12 | `:root --accent-pink / --section-heading / --accent-red` (light) | 94–96 | delete | canon `tokens.css:451–453` | `<W2.a>` | byte-identical |
| a13 | `:root --viz-fourier / -chebyshev / -legendre / -amber / -green` (light) | 99–103 | delete | canon `tokens.css:458–462` | `<W2.a>` | byte-identical |
| a14 | `:root --tier-featured / -saved / --like / --success / --warning / --info / --delete` (light) | 109–115 | delete | canon `tokens.css:465–471` | `<W2.a>` | byte-identical |
| a15 | `:root --shadow-cartoon / -hover / -soft / -elevated / -modal` (light) | 118–122 | delete | canon `tokens.css:485–491` | `<W2.a>` | byte-identical |
| a16 | `:root --z-toast: 250` | 127 | delete | canon `tokens.css:328` ships `--z-toast: 160` | `<W2.a>` | consumer's 250 is unjustified drift; adopts canon's 160 |
| a17 | `:root --type-admin-label`, `--type-micro` | 130–131 | delete | canon `typography.css:214–215` | `<W2.a>` | exact-value duplicate |
| a18 | `.dark --section-color-0..12` | 136–148 | delete | canon `tokens.css:1287–1299` | `<W2.a>` | byte-identical |
| a19 | `.dark --accent-pink / --section-heading / --accent-red` | 151–153 | delete | canon `tokens.css:1301–1303` | `<W2.a>` | byte-identical |
| a20 | `.dark --viz-fourier / -chebyshev / -legendre / -amber / -green` | 156–160 | delete | canon `tokens.css:1305–1309` | `<W2.a>` | byte-identical |
| a21 | `.dark --tier-featured / -saved / --like / --success / --warning / --info / --delete` | 163–169 | delete | canon `tokens.css:1324–1330` | `<W2.a>` | byte-identical |
| a22 | `.dark --shadow-cartoon / -hover / -soft / -elevated / -modal` | 172–176 | delete | canon `tokens.css:1340–1346` | `<W2.a>` | byte-identical |
| a23 | `@theme { --color-* aliases }` (accent / section / tier / viz, 14 lines) | 182–200 | delete | canon `theme.css:143–165` bridges every alias | `<W2.a>` | full coverage verified by grep |
| a24 | `@layer base { * { @apply border-border } }` | 205–207 | delete | canon ships the global border reset | `<W2.a>` | universal reset belongs upstream |
| a25 | `@utility text-micro` | 222–225 | delete | canon `typography.css:464` | `<W2.a>` | byte-identical |
| a26 | `@utility text-admin-label` | 227–230 | delete | canon `typography.css:469` | `<W2.a>` | byte-identical |
| a27 | `.cm-serif` class | 232–234 | delete | canon `@utility cm-serif` at `typography.css:527` | `<W2.a>` | canon is the `@utility` form |
| a28 | `.fira-code` class | 236–239 | delete | canon `@utility fira-code` at `typography.css:531` | `<W2.a>` | canon is the `@utility` form |
| a29 | `.fourier-f` (regressed fork — drops italic + `--font-display` + variation-settings) | 243–249 | repair-in-place via delete | canon `@utility fourier-f` at `typography.css:539` | `<W2.a>` | regression repairs by deletion (5 in-tree consumers automatically pick up the canon's richer rule) |
| a30 | `.ease-apple`, `.ease-apple-spring` | 253–258 | delete | canon `--ease-apple` / `--ease-apple-spring` tokens at `tokens.css §1` | `<W2.a>` | zero in-tree consumers of the class form |
| a31 | `@keyframes fade-in` | 262–265 | delete | canon `animations.css` ships `fade-in` | `<W2.a>` | name-shadow |
| a32 | `@keyframes scale-in` | 267–270 | delete | canon `pop` transition covers; W2.b migrates the 1 consumer (`ImageUpload.vue:53`) | `<W2.a>` | name-shadow |
| a33 | `@keyframes slide-up` | 272–275 | delete | canon `fade-slide` transition covers | `<W2.a>` | name-shadow |
| a34 | `.animate-fade-in / -scale-in / -slide-up` classes | 277–287 | delete | W2.b migrates the 1 consumer (`ImageUpload.vue:53`) | `<W2.a>` | the three keyframes die with the classes |
| a35 | `@media (prefers-reduced-motion)` guard for `.animate-*` (selectors `.animate-fade-in, .animate-scale-in, .animate-slide-up`) | 346–350 (the `.animate-*` arm only) | delete | dies with a34 | `<W2.a>` | the paired `[data-state]` PRM guard (lines 351–353) survives — pairs with retained lift candidate l3 below |

**W2.a discharge tally:** 35 rows — 30 `delete` + 2 `dead-token-delete` (a7, a8) + 3 `repair-in-place` (a4 retained for W2.b fold; a5 + a29 repaired via deletion).

### W2.a — retained rows (lift candidates surviving in the file until carries land)

These rules remain in `fourier-overrides.css` pending the constellation carry's upstream landing. W2.b deletes the file after it folds out its rows and after each lift candidate has either been filed upstream or its destination definitively re-named.

| # | rule | original lines | disposition | destination | citing commit | notes |
|---|---|---|---|---|---|---|
| l1 | `--easing-accent: hsl(248 88% 71%)` | 106 | lift-to-glass-ui | `coordination/CONSTELLATION.md` carry — propose `--viz-easing` upstream | `<W2.a>` | 4 in-tree consumers verified (`EasingPicker.vue:22,67,68,78`) |
| l2 | `--z-canvas-layer: 1`, `--z-canvas-overlay: 20` | 125–126 | lift-to-glass-ui | `coordination/CONSTELLATION.md` carry — propose `--z-canvas` + `--z-canvas-overlay` rungs in `tokens.css §3`, or remap onto `--z-content` / `--z-controls` | `<W2.a>` | zero in-tree consumers of the override; the canvas-layer concept is real but un-named upstream |
| l3 | `[data-state="active"][role="tabpanel"]` selector + `@keyframes tab-slide-in` + paired PRM guard | 289–296 + 351–353 | lift-to-glass-ui | `coordination/CONSTELLATION.md` carry — propose the tab-panel entry animation on the glass-ui `Tabs` primitive | `<W2.a>` | the selector targets a glass-ui primitive's data-attribute; the upstream should own the animation |
| l4 | `::selection { color-mix(--primary 12%/20%, transparent) }` (light + dark) | 334–341 | lift-to-glass-ui | `coordination/CONSTELLATION.md` carry — propose a glass-ui base-layer `::selection` rule | `<W2.a>` | H2 §6 reconciled gap list names this as 1 of the 3 surviving gaps |

### W2.a — D4-residual dispositions (per W2.md §Scope item 8)

The two H1-flagged silent-deferral risks per `docs/audits/runs/2026-05-18-tranche-harden/h1-A-W0-W1.md §5.2 row D4`.

| item | disposition | destination | citing commit | notes |
|---|---|---|---|---|
| **Card migration** (consumer's `cartoon-card` recipe class, 30+ in-tree consumers — `EqCoefficientsPanel.vue:40`, `EquationView.vue:228,237,241,249,303`, `FunctionInput.vue:92,170`, `InfoCard.vue:17`, `HarmonicLevelGrid.vue:2`, `MorphPhaseConfig.vue:2`, `MorphShapePreview.vue:4`, `BasisCanvas.vue:478`, `BasisSelector.vue:119`, `CoefficientsPanel.vue:40`, `ContourPreview.vue:33`, `ContourSettings.vue:187`, `EditorToolsPanel.vue:26`, `ImageUpload.vue:38`, `VisualizationView.vue:160`, etc.) | **file-to-glass-ui-as-variant** | `coordination/CONSTELLATION.md` carry — propose Card primitive `tier="cartoon"` variant (or expose a `.cartoon-card` recipe class composing `glass-{tier}` + `cartoon-surface`) | `<W2.a>` | the class was retired upstream at C.W5 per `glass-ui/src/styles/cards.css:2` ("`.cartoon-card` + `.elevated-card` recipe classes were removed at C.W5 per the W0 overfitting audit (Card's tier system covers both)"). The in-tree consumers currently bind to a class with no upstream declaration. If the carry stalls, W3 / a follow-up owns a named local carry that re-instates the recipe class in a residual fourier-side stylesheet |
| **CVA decision** (`class-variance-authority` listed at `web/package.json:32` as `^0.7` but zero `web/src/` imports — `grep -nE 'class-variance-authority\|cva\(' web/src/` returns empty) | **retire-with-rationale** | remove `class-variance-authority` from `web/package.json` dependencies at W4 (deploy-surface hygiene) or W6 (close ceremony) | `<W2.a>` | the dependency was likely inherited from a glass-ui-ish scaffold; the consumer never adopted it. `<Button>` / `buttonVariants` shipped by glass-ui already wraps CVA upstream — the consumer does not need its own. Retire rationale: "consumer never imported; glass-ui's button-variants substrate consumes CVA internally and re-exports the typed shape" |

## §W2.b — Fold-to-component (`fourier-overrides.css`)

_Reserved for W2.b._

## §W2.d — Visual regression evidence

_Reserved for W2.d._
