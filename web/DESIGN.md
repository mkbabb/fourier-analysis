# Fourier Analysis Design Language

> Extends [glass-ui DESIGN.md](../../glass-ui/DESIGN.md)

## Token Overrides

Computer Modern Serif font stack for academic tone. Warm cream background palette (`--background`, `--card`) replacing glass-ui's cool grays.

13 per-section semantic colors (`--section-fourier-series`, `--section-complex-fourier`, etc.) for navigation and section identity. Visualization basis colors (`--basis-real`, `--basis-imag`, `--basis-combined`) for consistent chart theming.

Shadow tokens diverge significantly: cartoon (`2px 3px 0`), soft (`0 2px 8px`), elevated (`0 4px 16px`), modal (`0 8px 32px`)—all using `--shadow-color` HSL channel pattern.

Custom z-index layers: `--z-canvas-layer: 1`, `--z-canvas-overlay: 10`, `--z-toast: 100`.

## Local Utilities

The override-stylesheet abrogation wave (A.W2) discharged
`fourier-overrides.css`, `ios-fixes.css`, and `buttons.css` in full;
`web/src/styles/` no longer exists. The former local utilities have
been migrated to their idiomatic glass-ui primitives:

- `.btn-icon-admin` → `<Button variant="glass" size="icon">` + scoped `.admin-overlay-btn` retint hook (geometry: 1.75 rem circle, scale-hover idiom).
- `.btn-solid` → `<Button variant="default">` (canonical primary CTA via `--primary` token).
- `.btn-ghost` → `<Button variant="outline">` (bordered transparent secondary).
- `.basis-pill` (interactive toggle) → `<Button variant="outline" size="sm">` + scoped `.basis-toggle` retint hook + `aria-pressed` for the active state.
- `.basis-pill` (decorative read-only) → `<Badge variant="outline" size="sm">` + scoped `.basis-tint` retint hook.
- `.styled-slider` (and the `:not(.styled-slider)` defensive native-range recipe) → `<Slider variant="glass-scrubber">` at all 7 consumer sites (A.W2.c).

## Migration Tasks

- [ ] Replace custom Teleport modals (ExportModal, GalleryCardModal) with glass-ui Dialog/DialogContent (A.W3 territory).
- [ ] Replace `.gallery-card`/`.modal-card` divs with glass-ui Card (filed as constellation carry — Card tier="cartoon" variant proposal).
- [ ] Remove unused CVA dependency or adopt it for button variants (filed as W2.a row D4; deferred to W4 or W6 close ceremony).
