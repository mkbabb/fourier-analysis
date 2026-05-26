# Fourier Analysis Design Language

> Extends [glass-ui DESIGN.md](../../glass-ui/DESIGN.md)

## Token Overrides

Computer Modern Serif font stack for academic tone. Warm cream background palette (`--background`, `--card`) replacing glass-ui's cool grays.

13 per-section semantic colors (`--section-fourier-series`, `--section-complex-fourier`, etc.) for navigation and section identity. Visualization basis colors (`--basis-real`, `--basis-imag`, `--basis-combined`) for consistent chart theming.

Shadow tokens diverge significantly: cartoon (`2px 3px 0`), soft (`0 2px 8px`), elevated (`0 4px 16px`), modal (`0 8px 32px`)—all using `--shadow-color` HSL channel pattern.

Custom z-index layers: `--z-canvas-layer: 1`, `--z-canvas-overlay: 10`, `--z-toast: 100`.

## Local Utilities

Defined in `fourier-overrides.css`:

- `.btn-icon-admin` — icon-only admin button with hover ring
- `.btn-solid` — filled primary button (maps to glass-ui `default` variant)
- `.btn-ghost` — transparent hover-reveal button
- `.basis-pill` — colored chip indicating Fourier basis type

## Migration Tasks

- [ ] Replace custom Teleport modals (ExportModal, GalleryCardModal) with glass-ui Dialog/DialogContent
- [ ] Replace `.btn-solid`/`.btn-ghost`/`.btn-icon-admin` with glass-ui Button variants (`default`/`ghost` + `.btn-interactive`)
- [ ] Replace `.gallery-card`/`.modal-card` divs with glass-ui Card
- [ ] Delete duplicate keyframes (`fade-in`, `scale-in`, `slide-up`) already in glass-ui `animations.css`
- [ ] Remove unused CVA dependency or adopt it for button variants
