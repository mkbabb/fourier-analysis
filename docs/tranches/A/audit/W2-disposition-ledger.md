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
| c1 | `web/src/styles/ios-fixes.css:10-13` | `html { font-size: 1.125rem; line-height: 1.75rem }` — mobile-first root font sizing | fold-to-entry | `web/src/style.css` (global `html` block, post-import) | _W2.c commit_ |
| c2 | `web/src/styles/ios-fixes.css:15-20` | `@media (min-width: 768px) html { font-size: 1rem; line-height: 1.5rem }` — tablet/desktop root font sizing | fold-to-entry | `web/src/style.css` (paired media query) | _W2.c commit_ |
| c3 | `web/src/styles/ios-fixes.css:24-35` | `@media (max-width: 640px) .paper-article pre,code { … }` — iOS-Safari code-block overflow | fold-to-component | `web/src/components/paper/PaperView.vue` (post-`.paper-article`, via `:deep()` for scoped penetration) | _W2.c commit_ |
| c4 | `web/src/styles/ios-fixes.css` (entire file) | file deletion + import removal | retire | deleted; `style.css` import line elided | _W2.c commit_ |
| c5 | `web/src/components/visualization/BasisSelector.vue:150-159` (pre) → `:150-159` (post) | `class="styled-slider"` on Harmonics native range | migrate-to-substrate | `<Slider variant="glass-scrubber">` w/ `harmonicsModel` array adapter + `.basis-slider-track` retint hook | _W2.c commit_ |
| c6 | `web/src/components/visualization/BasisSelector.vue:176-185` (pre) → `:161-170` (post) | `class="styled-slider"` on Sample-Points native range | migrate-to-substrate | `<Slider variant="glass-scrubber">` w/ `pointsModel` array adapter + `.basis-slider-track` retint hook | _W2.c commit_ |
| c7 | `web/src/components/visualization/EditorToolsPanel.vue:48-55` (pre) → `:55-64` (post) | `class="styled-slider"` on Magnet-radius native range | migrate-to-substrate | `<Slider variant="glass-scrubber">` w/ `magnetModel` array adapter + `.magnet-slider-track` retint hook | _W2.c commit_ |
| c8 | `web/src/components/visualization/EditorControlsDock.vue:106-115` (pre) → `:113-124` (post) | `class="styled-slider"` on Magnet-radius hover-popover native range | migrate-to-substrate | `<Slider variant="glass-scrubber">` w/ shared `magnetModel` + `.magnet-slider-track` (preserves `@mousedown.stop` / `@pointerdown.stop` dock-isolation) | _W2.c commit_ |
| c9 | `web/src/components/morph/HarmonicLevelGrid.vue:17-26` (pre) → `:17-26` (post) | `class="styled-slider"` on low-level native range | migrate-to-substrate | `<Slider variant="glass-scrubber">` w/ `lowModel` array adapter + `.level-slider-track` retint hook | _W2.c commit_ |
| c10 | `web/src/components/morph/HarmonicLevelGrid.vue:40-49` (pre) → `:29-38` (post) | `class="styled-slider"` on high-level native range | migrate-to-substrate | `<Slider variant="glass-scrubber">` w/ `highModel` array adapter + shared `.level-slider-track` | _W2.c commit_ |
| c11 | `web/src/components/morph/MorphPhaseConfig.vue:21-30` (pre) → `:21-30` (post) | `class="styled-slider"` on Duration native range | migrate-to-substrate | `<Slider variant="glass-scrubber">` w/ `durationModel` array adapter + `.duration-slider-track` retint hook | _W2.c commit_ |
| c12 | `web/src/styles/buttons.css:11-42` (pre) | `input[type="range"]:not(.styled-slider)` defensive native-range fallback (≈32 lines) | retire | zero consumers after `.styled-slider` migrations + zero plain `input type="range"` elsewhere in `web/src`; deleted with the slider recipe | _W2.c commit_ |
| c13 | `web/src/styles/buttons.css:44-123` (pre) | `.styled-slider` slider recipe (≈80 lines: track + thumb + Firefox-fallback variants) | retire | discharged by `<Slider variant="glass-scrubber">` at all 7 consumer sites; deleted | _W2.c commit_ |
| c14 | `web/src/composables/useMorphConfig.ts:24-37` (pre) | `sliderStyle(value, min, max, color)` helper (`--progress` + `--slider-color` factory) | retire | zero remaining consumers after the morph-side migrations (c9–c11); deleted with the styled-slider pattern it served | _W2.c commit_ |

## §W2.a — Token de-fork

_Reserved for W2.a._

## §W2.b — Fold-to-component (`fourier-overrides.css`)

_Reserved for W2.b._

## §W2.d — Visual regression evidence

_Reserved for W2.d._
