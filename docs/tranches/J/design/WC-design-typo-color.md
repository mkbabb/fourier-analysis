# WC — Typography & Color/Theme Refinement Spec

Lens: typography ladder + font character + color/theme cohesion + dark-mode fidelity.
Scope: REFINEMENT of existing glass-ui usage. Spec only — no app edits.

---

## Findings (grounded)

The app loads three faces (`public/fonts.css`): **Computer Modern Serif** (body, via
`--font-sans` remap in `src/style.css:14`), **Fira Code** (mono), and **Fraunces** — the
characterful display face glass-ui's ladder explicitly reserves with `WONK=1 / SOFT=0`
(`typography.css:5-7,75-127`). Fraunces is fully fetched (woff2, `font-display: swap`) but
**rendered in exactly ONE place**: the inline `fourier-f` ℱ glyph at 1.35em
(`fourier-f` utility; `AppHeader.vue:68`, `PaperView.vue:356`). Every headline in the app —
the paper hero (`PaperView.vue:354`), section titles, gallery/equation headers — hand-rolls
`cm-serif text-4xl font-bold tracking-tight` instead of the golden-ratio `text-display`/
`text-title` utilities glass-ui ships. So the hierarchy is **generic**: one serif at a
spectrum of raw Tailwind sizes, no display/body contrast, the ladder's φ-spaced rungs unused.

Color is **timid**: `--viz-amber` (`section-color-5`) is the de-facto accent (nav icon,
active tab — `AppHeader.vue:197,341`), but it is a low-chroma earth tone, applied in thin
`color-mix(… 8%)` washes. `--primary` is near-black `hsl(24 10% 10%)` (`tokens.css:176`) —
used as ink, never as a dominant brand tone. The 13 `--section-color-*` ramp and the
`--viz-fourier` tomato-red exist but are confined to canvas drawing. The palette reads as
ink-on-paper with a faint amber tint, not "dominant-with-accents."

Dark mode IS first-class structurally — every token has a `.dark` rung (`tokens.css:633-659`),
`::selection` adapts (`style.css:33`), the local `--viz-amber` AA-darkening is light-only
(`style.css:119-127`). Good. But Fraunces display + the section ramp aren't exercised, so
there's little for dark mode to make *sing*. No page-load orchestration exists: zero
`useStaggerReveal` / `useSpringOrchestrator` usage despite glass-ui shipping both.

---

## AESTHETIC DIRECTION

**Editorial-mathematical: a φ-tuned serif journal that wears its display face.** Computer
Modern stays the body/math voice (correct — it IS the math). Promote **Fraunces (WONK=1)**
from a single glyph to the display VOICE for every hero and section title, set against CM
Serif body — a genuine display↔body pairing the ladder already provisions. Make the palette
**dominant-amber with a tomato-red accent**: lean the `--viz-fourier`/`--viz-amber` pair into
real chroma and weight, not 8% washes, so the page has a tonal identity rather than ink-on-white.
One orchestrated φ-staggered page-load over scattered transitions.

---

## TOP REFINEMENTS (surface → glass-ui lever)

1. **Paper hero + all section titles: Fraunces display, not raw serif.**
   `PaperView.vue:354` `cm-serif text-4xl font-bold` → `text-display-2` (φ^(5/2) clamp,
   Fraunces WONK=1, optical sizing) — drop the `<span class="fourier-f">` since the whole
   line is now Fraunces. Cascade `text-title`/`text-heading` onto `CollapsibleSection`,
   gallery/equation headers (`GalleryCardModal.vue:126,146`, `EquationView`), replacing the
   ad-hoc `text-sm font-semibold cm-serif`. Lever: glass-ui `text-display-*`/`text-title`/
   `text-heading` utilities (`typography.css`). Result: φ-spaced hierarchy + a display↔body
   contrast that's currently absent.

2. **Make amber the DOMINANT tone, tomato the accent — kill the 8% washes.**
   `AppHeader.vue` active-tab uses `color-mix(--viz-amber 8%)`; raise active surfaces to a
   confident fill and reserve `--viz-fourier` (tomato) for the single primary action per view.
   Lever: the `--section-color-*` ramp + `--viz-*` aliases already adapt per-mode
   (`tokens.css:209-234,641-659`) — bind nav/active/CTA chrome to them at full strength
   instead of inventing thin mixes. Optionally retune the *app-local* `--viz-amber`
   (already overridden at `style.css:119`) toward higher chroma for brand weight.

3. **Mono micro-labels via the ladder, not hand-rolled.**
   Gallery/admin meta (`AdminAuditLog.vue:134`, `GalleryCard.vue:109`) uses
   `font-mono text-[0.65rem] uppercase tracking-wide` — replace with `text-admin-label`
   (Fira Code, `--type-tracking-caps`, φ-rung 10px). Lever: glass-ui `text-admin-label` /
   `text-mono-caption`. Removes magic-number sizes; locks meta to the scale.

4. **One orchestrated φ-staggered page-load.**
   The `[data-state="active"][role="tabpanel"]` slide (`style.css:83`) is the only entrance.
   Add a single `useStaggerReveal` (or `useSpringOrchestrator`) pass on the paper hero +
   first section + first gallery row, φ-spaced delays. Lever: glass-ui motion composables
   (currently zero usage). High-impact moment > scattered micro-interactions; honors PRM.

5. **Let dark mode show off the now-active display + ramp.**
   With Fraunces headlines + a real amber/tomato palette live, verify the `.dark`
   `--viz-fourier hsl(6 77% 66%)` / `--viz-amber hsl(37 73% 67%)` (`tokens.css:659`,
   `style.css:124-127`) carry the same dominant-accent weight as light. Spot-check headline
   contrast and the amber active-fill in dark. No new tokens — exercise the ones that ship.

---

## FILE WRITTEN

`/Users/mkbabb/Programming/fourier-analysis/docs/tranches/J/design/WC-design-typo-color.md`
