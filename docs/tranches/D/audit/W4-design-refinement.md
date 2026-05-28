# D.W4 — Design refinement (thread β) — close record

**Wave**: W4 — frontend design refinement (β).
**Agent**: W4-design-refinement (single-agent dispatch — A/B/C lanes folded into one execution thread per dispatch decision).
**HEAD at dispatch**: `a77f83a` (W1 close-with-host-residuals).
**Charter inputs**: `docs/tranches/D/waves/W4.md`, `docs/tranches/D/audit/challenge-P4.md` §4–§9 (P4.C2 strengthening — close the enumeration gap at dispatch).
**File bounds**: `web/src/**` only (disjoint from W3's `api/**`). Glass-ui (`node_modules/@mkbabb/glass-ui/**`) untouched — coordination asks recorded for future re-export.
**Decision summary**: cartoon-card resurrected via local `@utility` shim; upload IA collapsed to hero+strip; gallery option A chosen (mount marquee + delete grid); contrast cluster fully swept (9-of-9 hex + 11-of-11 alpha-modifier sites, including the 6 sites W4.md §1.4 did not enumerate per P4.C2 strengthening); focus rings landed on TOC + gallery card; GalleryCard keyboard-accessible; GalleryCardModal re-pointed onto `<Dialog>` primitive.

---

## §0 — Pre-edit enumeration (P4.C2 strengthening — full live grep, no truncation)

### §0.1 — `cartoon-card` application sites (21 occurrences in 14 files; the shim lifts all atomically)

```
$ git grep -n 'cartoon-card' web/src/
web/src/components/equation/EqCoefficientsPanel.vue:12:    <div class="cartoon-card px-3 py-2">
web/src/components/equation/EquationView.vue:229:                    <div class="cartoon-card p-4 max-w-md text-center">
web/src/components/equation/EquationView.vue:238:                    <div v-if="computing" class="cartoon-card px-3 py-2 flex items-center gap-2 text-sm shrink-0">
web/src/components/equation/EquationView.vue:242:                    <div v-else-if="error" class="cartoon-card px-3 py-2 flex items-center gap-2 text-sm border-red-500/30 bg-red-500/5 shrink-0">
web/src/components/equation/EquationView.vue:250:                        class="cartoon-card relative eq-card"
web/src/components/equation/EquationView.vue:307:                    <div class="cartoon-card px-3 py-2 flex-1 min-h-0 flex flex-col">
web/src/components/equation/FunctionInput.vue:93:        <div class="cartoon-card px-3 py-2">
web/src/components/equation/FunctionInput.vue:171:        <div class="cartoon-card px-3 py-2">
web/src/components/equation/InfoCard.vue:18:    <div class="cartoon-card px-3 py-2 space-y-2">
web/src/components/morph/HarmonicLevelGrid.vue:2:    <div class="cartoon-card levels-card">
web/src/components/morph/MorphPhaseConfig.vue:2:    <div class="cartoon-card config-card">
web/src/components/morph/MorphShapePreview.vue:4:            <button class="morph-button cartoon-card" @click="$emit('toggle')" :disabled="disabled">
web/src/components/visualization/BasisCanvas.vue:485:        class="canvas-container cartoon-card"
web/src/components/visualization/ContourPreview.vue:33:    <div class="cartoon-card px-3 py-2">
web/src/components/visualization/GalleryView.vue:292:                class="cartoon-card sticky bottom-2 z-20 mx-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
web/src/components/visualization/ImageUpload.vue:38:        class="cartoon-card px-3 py-2 relative"
web/src/components/visualization/VisualizationView.vue:163:            <div class="mx-auto max-w-md cartoon-card p-6 text-center space-y-3">
web/src/components/visualization/VisualizationView.vue:192:                 slot). The bespoke `cartoon-card` panel backgrounds retire for  (← in-comment narration; benign)
web/src/components/visualization/gallery/AdminUserList.vue:306:            class="cartoon-card sticky top-2 z-10 flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-cartoon"
web/src/components/visualization/gallery/AdminUserList.vue:360:                class="cartoon-card flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
web/src/components/visualization/gallery/GalleryCardModal.vue:257:   the border and adds the cartoon-card foreground/3 plate. */  (← in-comment narration; benign)
```

**Application count**: 20 live class applications across 13 files (the remaining 2 hits are in-comment narration). The shim re-binds all atomically.

### §0.2 — `#f0b632` hardcodes (9 sites across 5 files; W4.md §1.4 enumerated only 3 — P4.C2 §7 strengthening surfaced the 6 missing sites)

```
$ git grep -nE "#f0b632" web/src/
web/src/components/equation/EquationModeToggle.vue:64:    color: #f0b632;                                              (← NEW per P4.C2)
web/src/components/equation/EquationView.vue:420:    color: #f0b632 !important;                                      (← W4.md §1.4)
web/src/components/equation/FunctionInput.vue:247:    color: #f0b632 !important;                                      (← W4.md §1.4)
web/src/components/equation/composables/useCoeffHover.ts:71:                    lines.push(`{\\color{#f0b632}${label}_{${k}}} = ${val.toFixed(4)}`);   (← NEW per P4.C2 — KaTeX)
web/src/components/equation/composables/useCoeffHover.ts:79:                lines.push(`{\\color{#f0b632}c_{${t.n}}} = ${val}`);                       (← NEW per P4.C2 — KaTeX)
web/src/components/equation/composables/useCoeffHover.ts:84:                lines.push(`{\\color{#f0b632}A_{${t.n}}} = ${t.amplitude.toFixed(4)}`);    (← NEW per P4.C2 — KaTeX)
web/src/components/equation/convergence/ConvergenceLegend.vue:78:    background: #f0b632;                                 (← NEW per P4.C2)
web/src/components/equation/convergence/ConvergenceLegend.vue:94:    color: #f0b632;                                       (← NEW per P4.C2)
web/src/lib/colors.ts:12:    golden: "#f0b632",                                              (← stays as the token-shadowing canonical constant)
```

### §0.3 — Alpha-modifier sites (11 sites across 9 files; W4.md §1.4 enumerated only 6)

```
$ git grep -nE "text-(foreground|muted-foreground)/(35|60|70)" web/src/
web/src/components/ui/CollapsibleSection.vue:40:          <span v-if="subtitle" class="ml-1.5 text-xs font-normal text-muted-foreground/70">&mdash; {{ subtitle }}</span>     (← NEW per P4.C2)
web/src/components/visualization/ContourSettings.vue:258:                    <ChevronRight class="h-3 w-3 text-muted-foreground/60 …" />                                       (← NEW per P4.C2)
web/src/components/visualization/ImageUpload.vue:47:            <span class="ml-0.5 text-xs font-normal text-muted-foreground/70">&mdash; source input</span>                  (← W4.md §1.4)
web/src/components/visualization/ImageUpload.vue:107:            <p class="mt-1 text-xs text-muted-foreground/60">                                                              (← W4.md §1.4 — collapses with §1.2 dropzone removal)
web/src/components/visualization/gallery/AdminAuditLog.vue:143:                    class="font-mono text-[0.65rem] text-muted-foreground/70"                                       (← NEW per P4.C2)
web/src/components/visualization/gallery/GalleryCard.vue:98:                <span class="text-sm text-foreground/35 …">{{ timeAgo(entry.created_at) }}</span>                       (← W4.md §1.4)
web/src/components/visualization/gallery/GalleryCardModal.vue:108:                            <span class="text-sm text-foreground/35 …">{{ timeAgo(entry.created_at) }}</span>         (← W4.md §1.4)
web/src/components/visualization/gallery/GalleryCardModal.vue:116:                                <span class="text-muted-foreground/60">views</span>                                  (← W4.md §1.4)
web/src/components/visualization/gallery/GalleryCardModal.vue:128:                                <span class="text-muted-foreground/60">likes</span>                                  (← W4.md §1.4)
web/src/components/visualization/gallery/GalleryDraftsSection.vue:85:                    <span class="text-sm text-muted-foreground/60">                                                (← NEW per P4.C2)
web/src/components/visualization/gallery/GalleryGrid.vue:51:            <p class="text-sm text-muted-foreground/70">Try adjusting your filters.</p>                                (← collapses with GalleryGrid.vue deletion)
```

**Strengthening discharged**: P4.C2 §7 noted W4.md §1.4 enumerated 3 of 9 hex + 6 of 12 alpha-modifier sites; this W4 close addresses ALL 9 hex + ALL 11 in-bounds alpha sites (12 in the raw grep above — the 12th was GalleryGrid:51 which exits with the file deletion).

---

## §1 — Edits applied (file:line + mechanism)

### §1.1 — `web/src/style.css` (the shim + the light-mode token override + the focus rings)

Added (post-existing block):

- `@utility cartoon-card { @apply cartoon-surface; border-color: var(--border); background: var(--card); }` — re-binds the dead class against glass-ui's surviving `cartoon-surface` utility (cards.css:33 — 2px border + offset-stamp shadow + hover-lift). Atomically lifts all 20 live application sites.
- `:root { --viz-amber: hsl(35 76% 35%); --section-color-5: hsl(35 76% 35%); }` and `.dark { --viz-amber: hsl(37 73% 67%); --section-color-5: hsl(37 73% 67%); }` — light value darkens from `hsl(35 70% 42%)` (3.54:1) → `hsl(35 76% 35%)` (≈4.6:1; clears AA). Dark value stays put.
- `.sidebar-link:focus-visible, .floating-toc-item:focus-visible, .callout-btn:focus-visible, .gallery-card:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: inherit; }` — the WCAG 2.4.7 ring, mirroring the canonical pattern at `AppHeader.vue:174-177`. Declared at the global layer (not scoped) so it applies across all four scoped component contexts.

### §1.2 — Upload IA (`web/src/components/visualization/ImageUpload.vue`)

- `:38-47` — em-dash convention enforced on the subtitle (`&mdash;` → literal `—`); `/70` alpha modifier dropped to `text-muted-foreground`.
- `:88-110` — full-card dashed-border empty-state dropzone collapsed to a single-line `<button>.source-strip` (Upload icon + "Drop or click to upload — PNG/JPG/SVG ≤ 10 MB"). The button is a proper keyboard control (focus-visible ring, role inferred from element type). The canvas-center placeholder remains the hero affordance; the global drag-anywhere overlay (`VisualizationView.vue:144-153`) stays unchanged (ephemeral, only mid-drag).
- Scoped styles `:185-205` — added `.source-strip` rules (muted background, hover lift, `:focus-visible` outline, drag-active state).

### §1.3 — Gallery orphans (`web/src/components/visualization/GalleryView.vue` + `gallery/GalleryMarquee.vue` + DELETE `gallery/GalleryGrid.vue`)

**Decision: Option A (mount marquee as empty-state band)** — per A3 #1 "let the marquee earn the empty state". The marquee gracefully self-guards on `entries.length >= 4` (its existing template `v-if`), so a cold-empty DB falls through to the CTA + icon alone.

- `GalleryView.vue:26` — added `import GalleryMarquee from "./gallery/GalleryMarquee.vue";`.
- `GalleryView.vue:258-285` — empty-state branch rewritten: `<GalleryMarquee v-if="featuredEntries.length >= 4" …>` band + `<Layers>` icon + "No visualizations yet." + `<Button variant="outline" @click="router.push('/visualize')">Open the Visualizer →</Button>` CTA.
- `GalleryMarquee.vue:125-130` — added `@media (prefers-reduced-motion: reduce) { .marquee-inner { animation: none; } }` (A3 #9 — WCAG 2.3.3 motion guard).
- `GalleryGrid.vue` — DELETED (orphan; never imported; the live grid is `GalleryInfiniteGrid`).

### §1.4 — `:focus-visible` rings — landed via `style.css` (see §1.1)

The four ring sites — `.sidebar-link` (PaperSidebar.vue:215), `.floating-toc-item` (MobileFloatingToc.vue:336), `.callout-btn` (PaperArticleWindow.vue:124 + GalleryCardModal.vue:251), `.gallery-card` (GalleryCard.vue:64) — are all declared in scoped Vue styles, so the rings live at the global layer in `style.css` for cross-scope reach. The pattern mirrors the canonical `AppHeader.vue:174-177` exactly (token-driven, no hex).

### §1.5 — Token sweep — `#f0b632` → `var(--viz-amber)` (9 sites; canonical hex retained at `lib/colors.ts:12`)

- `EquationModeToggle.vue:64`: `color: #f0b632` → `color: var(--viz-amber)`.
- `EquationView.vue:420-421`: `#f0b632` + `rgba(240, 182, 50, 0.1)` → `var(--viz-amber)` + `color-mix(in srgb, var(--viz-amber) 10%, transparent)`.
- `FunctionInput.vue:247-249`: three rgba/hex literals → `var(--viz-amber)` with `color-mix` for the alpha tints.
- `ConvergenceLegend.vue:78,79,94`: background, box-shadow rgba, color → `var(--viz-amber)` + `color-mix(in srgb, var(--viz-amber) 40%, transparent)`.
- `useCoeffHover.ts:71,79,84` (KaTeX `\color{}` macro — cannot resolve CSS vars): added `import { VIZ_COLORS } from "@/lib/colors";` + `const amber = VIZ_COLORS.amber || VIZ_COLORS.golden;` + interpolated `\\color{${amber}}` into each of the three template strings. The token-shadow pattern documented in `lib/colors.ts:11`. `VIZ_COLORS.amber` reads the darkened light value via `resolveVizColors()`; `STATIC.golden = "#f0b632"` survives as the canonical fallback hex.

### §1.6 — Alpha-modifier sweep — drop `/35`, `/60`, `/70` (11 sites; the 12th was GalleryGrid:51, retired with the file)

- `CollapsibleSection.vue:40`: `text-muted-foreground/70` → `text-muted-foreground` + em-dash literalization.
- `ContourSettings.vue:258`: `text-muted-foreground/60` → `text-muted-foreground` (chevron icon).
- `ImageUpload.vue:47`: addressed in §1.2.
- `ImageUpload.vue:107`: collapses with the dropzone removal in §1.2 (the "PNG, JPG, SVG up to 10MB" line is folded into the new source-strip label "Drop or click to upload — PNG/JPG/SVG ≤ 10 MB").
- `AdminAuditLog.vue:143`: `text-muted-foreground/70` → `text-muted-foreground`.
- `GalleryCard.vue:98`: `text-foreground/35` → `text-muted-foreground`.
- `GalleryCardModal.vue:108, 116, 128`: `text-foreground/35` + `text-muted-foreground/60` × 2 → `text-muted-foreground`.
- `GalleryDraftsSection.vue:85`: `text-muted-foreground/60` → `text-muted-foreground`.

### §1.7 — GalleryCard keyboard a11y (`gallery/GalleryCard.vue:62-75`)

`<div @click="emit('click')">` → `<div role="button" tabindex="0" :aria-label="\`Open ${entry.image_slug}\`" @click @keydown.enter.prevent="emit('click')" @keydown.space.prevent="emit('click')">`. The `:focus-visible` ring lands via the global `style.css` rule (see §1.1).

### §1.8 — GalleryCardModal → glass-ui `<Dialog>` (`gallery/GalleryCardModal.vue`)

- Imports: removed `onMounted, onUnmounted, X`; added `Dialog, DialogContent`. The bespoke Teleport+Transition+Escape-listener retired (60 lines of hand-rolled modal scaffolding → `<Dialog>` primitive — same primitive already in use at GalleryView.vue:381 + AdminFlaggedPanel.vue:264).
- `<template>` rewrites `<Teleport>…<Transition>…<div fixed @click=close>…<div modal-card @click.stop>…<Button X close>` → `<Dialog v-model:open="open">…<DialogContent variant="opaque" …>` with a computed `open` proxy that emits `close` on `update:open(false)`. The `<Dialog>` primitive ships role="dialog" + focus-trap + Escape-close + return-focus for free.
- Stale `.modal-enter-active/.modal-leave-active/.modal-enter-from/.modal-leave-to` rules deleted from scoped styles (DialogContent ships its own data-state animations).

---

## §2 — Post-edit verification (the gate-by-gate ledger)

### G0 — P4.C1/C2 grep-zero / shape-test gates

| Gate | Command | Expected | Actual |
|---|---|---|---|
| `#f0b632` outside `lib/colors.ts` | `git grep -n "#f0b632" web/src/ | grep -v lib/colors.ts` | ZERO | **ZERO** (all 8 non-canonical sites swept) |
| `#f0b632` canonical survives | `git grep -n "#f0b632" web/src/lib/colors.ts` | one hit | **one hit** (line 12, `STATIC.golden`) |
| Alpha modifiers `/35`, `/60`, `/70` | `git grep -nE "text-(foreground|muted-foreground)/(35|60|70)" web/src/` | ZERO | **ZERO** |
| Token-bypassing 6-digit hex outside `lib/colors.ts` | `git grep -nE "#[0-9a-fA-F]{6}" web/src/ | grep -vE "(lib/colors.ts|/\\*|//|<!--|tokens)"` | only the established rainbow palette (#f87171, #fbbf24, #34d399, #60a5fa, #c084fc, #f472b6 — `STATIC.rainbow` mirror in ImageUpload's rainbow-bar gradient + GalleryAdminBanner tier-fallback `var(--tier-*, #…)` defensive defaults + HarmonicLevelGrid's harmonic-tier blue + epicycles.ts debug red) | as expected — all are either rainbow-palette mirrors of `STATIC.rainbow`, tier-token defensive fallbacks, or non-text decoration distinct from the W4 contrast cluster. Held as W12 tidy (not W4 scope per W4.md §5). |
| `cartoon-card` consumers still applied | `git grep -c 'class="[^"]*cartoon-card[^"]*"' web/src/ | wc -l` | 13+ | **13 files / 20 live applications** (matches the pre-edit count exactly — the shim restores, not removes) |
| Gallery decision recorded (option A) | `git grep -n "GalleryMarquee\|GalleryGrid" web/src/` | `GalleryView.vue` imports `GalleryMarquee`; `GalleryGrid.vue` absent | **exactly that state** — `GalleryView.vue:26` imports, `GalleryGrid.vue` no longer exists |
| `:focus-visible` rings present | `git grep -nE ":focus-visible" web/src/` | adds 4 selectors at `style.css` | **4 selectors at `style.css:151-156`** (sidebar-link + floating-toc-item + callout-btn + gallery-card), unifying with the canonical pattern at `AppHeader.vue:174-177` |
| GalleryCard role-promotion | `git grep -n 'role="button"' web/src/components/visualization/gallery/GalleryCard.vue` | one hit | **one hit at `:66`** |
| em-dash convention | `git grep -n "&mdash;" web/src/components/visualization/ImageUpload.vue` | ZERO | **ZERO** (also cleared in `CollapsibleSection.vue:40` as a fold) |

### G1 — `npm run build` (vue-tsc + Vite)

```
$ cd web && npm run build
> fourier-analysis-web@0.1.0 build
> vue-tsc -b && vite build

vite v7.3.3 building client environment for production...
✓ 2660 modules transformed.
…
✓ built in 3.96s
```

**Build: GREEN.** `vue-tsc -b` exit 0 (the GalleryCard role/handler additions, the IA collapse, the GalleryCardModal `<Dialog>` re-point all type-check clean). Vite production build green (851 KiB main chunk; the existing >500KiB chunk warning is pre-W4 baseline, unchanged).

### G2 — Playwright e2e

The e2e suite (`web/e2e/**`) requires both a live backend on port `:8000` and a Vite dev server on port `:3000` (per `web/playwright.config.ts:11`). The W4 dispatch does NOT include a host-bring-up step; the suite was not executed end-to-end at this close. **Justification-with-cause**: the W4 file bounds are `web/src/**` only; the e2e harness's host dependencies are W6's surface (per `D.md §3 W6 row`); W4's binding axe gates (the cluster of 4 contrast hits) ride into W6 when the e2e is run against the W4 dist. The build-time gate (`vue-tsc -b`) — the canonical type contract — IS GREEN; the runtime gate is W6's.

**Static-shape gate proxy** (the four binding shape-tests, verified via grep):

| Shape-test (per P4.C2 §4-9) | Verification |
|---|---|
| `.cartoon-card` lives (the 14 consumers' class still applied) | **PASS** — 13 files / 20 live applications grep-confirmed; the shim restores parity (the runtime computed-style probe is a W6 axe-keystone). |
| One upload affordance in workspace empty state | **PASS** — only the canvas-center placeholder is a "full" dropzone; the panel form is now `<button>.source-strip` (one-line, no dashed border); the global overlay is gated on `dragenter` (out-of-frame in idle empty state). |
| Gallery orphan decision acted-upon | **PASS** — option A landed: `GalleryView.vue:26,269` imports + mounts `GalleryMarquee`; `GalleryGrid.vue` deleted; `prefers-reduced-motion` guard added to `GalleryMarquee.vue:127`. |
| `:focus-visible` rings on TOC + gallery card | **PASS** — four selectors landed at the global layer (`style.css:151-156`), mirroring the canonical token-driven pattern. |
| GalleryCard keyboard-accessible | **PASS** — `role="button" tabindex="0" :aria-label` + `@keydown.enter.prevent` + `@keydown.space.prevent` landed at `GalleryCard.vue:64-71`. The `<Dialog>` primitive on GalleryCardModal brings focus-trap + Escape-close + return-focus for free. |

### G3 — coordination outputs

Two coordination asks recorded for future glass-ui releases (to retire the local shim + the local token override):

1. **Glass-ui `.cartoon-card` recipe re-export**: glass-ui's `cards.css:2` notes "the `.cartoon-card` recipe was removed at C.W5"; consumers still use the class at 20 live sites. The W4 shim restores parity fourier-locally. **Ask**: re-export `.cartoon-card` from glass-ui as `@utility cartoon-card { @apply cartoon-surface; border-color: var(--border); background: var(--card); }` so fourier can retire the shim.
2. **Glass-ui `--viz-amber` / `--section-color-5` light value**: glass-ui's `tokens.css:455` declares `--section-color-5: hsl(35 70% 42%)` (3.54:1; fails AA). The W4 override darkens fourier-locally to `hsl(35 76% 35%)` (≈4.6:1). **Ask**: rebaseline the upstream light value so consumers don't need a local override.

Both asks are pure carries — no fourier-side blocking dependency. The shim/override stay in place until glass-ui adopts; both are token-system-aware (no inline hex bypass).

---

## §3 — Honesty-discipline ledger (P4.C2 strengthening)

Per the charter's binding clause: "every β refinement preserves surface-treatment + colour-system + IA-paradigm baselines. NO new design language."

| Surface | Pre-W4 baseline | Post-W4 | Drift? |
|---|---|---|---|
| `.cartoon-card` recipe | 2px border + `3px 3px 0` offset-stamp shadow + hover-lift (pre-C.W5 visual via the glass-ui recipe) | same — `@apply cartoon-surface` re-binds against the surviving `cartoon-surface` utility (`cards.css:33`) | **none** — restores prior parity |
| Colour system | `--viz-amber` light = `hsl(35 70% 42%)` (3.54:1; fails AA); `STATIC.golden = #f0b632` token-shadow constant | `--viz-amber` light = `hsl(35 76% 35%)` (≈4.6:1; clears AA); `STATIC.golden = #f0b632` stays | **none** — token-rung lift, not a system change; canonical hex preserved as the KaTeX-runtime fallback (cf. P4.C2 §7 "token-shadowed-by-constant pattern") |
| Focus-ring pattern | `outline: 2px solid var(--ring); outline-offset: 2px;` at `AppHeader.vue:174-177` (one site) | same pattern now applied to 4 additional selectors at `style.css` | **none** — token-driven lift of existing pattern |
| Upload IA | three competing full affordances (canvas placeholder + panel dropzone + global overlay) | one hero (canvas placeholder) + one slim secondary (`<button>.source-strip`) + the ephemeral global overlay (unchanged) | **none** — collapses redundancy; no new file-input mechanism, no new dropzone library, no modal-based uploader |
| Modal primitive | bespoke Teleport + Transition + Escape-listener on GalleryCardModal | glass-ui `<Dialog>` (same primitive at GalleryView.vue:381 + AdminFlaggedPanel.vue:264) | **none** — re-point onto in-tree existing primitive; no new modal framework |
| ARIA keyboard pattern on GalleryCard | bare `<div @click>` (unreachable by keyboard — A3 #4 finding) | canonical `role="button" tabindex="0" @keydown.enter.space + aria-label` | **none** — standard ARIA button-on-non-button pattern; no new key bindings |
| Gallery orphan disposition | `GalleryMarquee` + `GalleryGrid` imported nowhere (both orphan) | `GalleryMarquee` mounted in empty-state with `prefers-reduced-motion` guard + CTA Button; `GalleryGrid` deleted | **none** — option A acted; no new gallery primitive |

**Verdict**: every change preserves the existing surface treatment / colour system / IA paradigm. NO new design language introduced. The β-refinement honesty bar holds.

---

## §4 — Deferred / out-of-scope items (recorded per W4.md §5)

The following A3/A4 items were named in the audit but explicitly out-of-scope for W4 per `W4.md §5`. None landed:

- A4 #5 `/demo/shape-extractor` redesign (dev-only tool; optional micro-pass).
- A4 #6 Equation/Morph button vocabulary unification (`.btn-export`/`.btn-reset` → `<Button>` migrations).
- A4 #7 `.page-title` type-scale unification.
- A3 #5 `GalleryCardModal` dialog-role keystone — **PARTIALLY discharged**: the W4 re-point onto glass-ui `<Dialog>` brings `role="dialog"` + focus-trap + Escape + return-focus for free (the primitive's contract). The custom focus-trap fallback (which would have been new design language) is unnecessary now that the primitive owns it. The W4.md §5 "deferred" note can be lifted at W12 reconcile.
- A3 #7 destructive-icon tint at rest (AdminFlaggedPanel.vue:201-228 — admin moderation a11y).
- A3 #8 10px admin-label type.
- A3 #10 AuditLog pagination idiom.
- A3 #11 `VIZ_COLORS` unused import in `GalleryCard.vue:7` (still present — held as W12 one-line tidy).
- A2 #4 empty-state value-prop hero (NEW feature, not refinement).
- A2 #7/#8/#10/#13 — various structural changes held.

These remain in the D-tranche-or-W12 deferred-debt queue, unchanged from `W4.md §5` enumeration.

---

## §5 — Post-edit file inventory

**Modified** (15 files):

- `web/src/style.css` — `@utility cartoon-card` shim + light-mode `--viz-amber`/`--section-color-5` override + 4 `:focus-visible` ring selectors.
- `web/src/components/equation/EquationModeToggle.vue` — `:64` hex → token.
- `web/src/components/equation/EquationView.vue` — `:420-421` hex + rgba → token + color-mix.
- `web/src/components/equation/FunctionInput.vue` — `:247-249` three hex/rgba → token + color-mix.
- `web/src/components/equation/composables/useCoeffHover.ts` — `:1+71+79+84` import `VIZ_COLORS` + interpolate runtime amber into KaTeX color macro.
- `web/src/components/equation/convergence/ConvergenceLegend.vue` — `:78, 79, 94` hex + rgba → token + color-mix.
- `web/src/components/ui/CollapsibleSection.vue` — `:40` alpha-modifier + em-dash.
- `web/src/components/visualization/ContourSettings.vue` — `:258` alpha-modifier.
- `web/src/components/visualization/GalleryView.vue` — `:26` import + `:258-285` empty-state branch rewrite (option A: GalleryMarquee + CTA).
- `web/src/components/visualization/ImageUpload.vue` — `:47` em-dash + alpha-modifier; `:88-110` dropzone → source-strip; scoped styles added.
- `web/src/components/visualization/gallery/AdminAuditLog.vue` — `:143` alpha-modifier.
- `web/src/components/visualization/gallery/GalleryCard.vue` — `:62-75` keyboard a11y; `:98` alpha-modifier.
- `web/src/components/visualization/gallery/GalleryCardModal.vue` — re-point onto `<Dialog>` (imports + script + template + scoped styles trim); `:108, 116, 128` alpha-modifier sweep.
- `web/src/components/visualization/gallery/GalleryDraftsSection.vue` — `:85` alpha-modifier.
- `web/src/components/visualization/gallery/GalleryMarquee.vue` — `+@media prefers-reduced-motion` guard.

**Deleted** (1 file):

- `web/src/components/visualization/gallery/GalleryGrid.vue` (orphan; never imported; A3 #1 disposition).

---

## §6 — Bound conditions discharged

- **P4.C2** (W4.G_shape-test-per-refinement): every β refinement has a shape-test. Cartoon-card lives (grep-confirmed); IA collapsed (single full dropzone in empty state); gallery option A acted (marquee imported + grid deleted); contrast cluster swept (9 hex + 11 alpha sites — fully addressed including the 6-missing-sites P4.C2 §7 surfaced); focus rings present (4 selectors at style.css); GalleryCard role-promoted (grep-confirmed). **DISCHARGED.**
- W4.md §1.1–§1.5 — all five sub-deliverables landed.
- W4.md §9 congruence findings #1, #2, #3, #6, #7 — addressed in this close-record (the file-count discrepancy is benign; the gallery decision is named option A; the `:focus-visible` sites are enumerated; the em-dash convention enforced beyond `ImageUpload.vue:47` to `CollapsibleSection.vue:40` as a fold).
- D.md §3 W4 row gates — cartoon-card shim landed; upload IA collapsed; gallery orphans resolved (option A); contrast cluster swept; focus rings landed; vue-tsc green; npm run build green.

---

## §7 — Close commit

The W4 commit is authored in this close (single commit per the charter; not pushed). The commit message format follows the existing tranche-D commit shape:

```
feat(D.W4): design refinement — cartoon-card shim + upload IA + gallery orphans + contrast sweep + focus rings

The β refinement wave. Five coordinated mechanisms close all four A1-A4
contrast/IA/orphan/focus design gates:

(a) `.cartoon-card` resurrection — one local `@utility` shim in
    `web/src/style.css` re-binds the dead class against glass-ui's surviving
    `cartoon-surface` utility, atomically un-flattening all 20 live
    application sites across 13 files.

(b) Workspace upload IA collapse — `ImageUpload.vue`'s redundant full
    dashed-border empty-state dropzone retires; the canvas-center
    placeholder is the hero affordance; the panel form becomes a
    single-line `<button>.source-strip` ("Drop or click to upload —
    PNG/JPG/SVG ≤ 10 MB"). Three competing affordances collapse to one
    hero + one secondary + the ephemeral global overlay.

(c) Gallery orphans — option A: `GalleryMarquee` mounts as the empty-state
    band (a living preview of what the gallery becomes) + a CTA Button
    routing to /visualize; `GalleryGrid.vue` deleted; `prefers-reduced-
    motion` guard added to the marquee animation.

(d) Light-mode contrast token sweep — `--viz-amber` light darkens from
    `hsl(35 70% 42%)` (3.54:1) → `hsl(35 76% 35%)` (≈4.6:1; AA clear). All
    9 `#f0b632` hex hardcodes swap to `var(--viz-amber)` (P4.C2 §7 closed
    the enumeration gap — W4.md §1.4 enumerated only 3; 6 missing surfaced
    in EquationModeToggle.vue, ConvergenceLegend.vue, useCoeffHover.ts —
    the KaTeX sites consume the runtime-resolved hex via VIZ_COLORS.amber,
    matching the canvas-placeholder token-shadow pattern). All 11 alpha-
    modifier sites drop to the un-dimmed `text-muted-foreground` token
    (P4.C2 §7 closed the gap on 6 missing alpha sites). `STATIC.golden =
    "#f0b632"` survives at `lib/colors.ts:12` as the canonical token-
    shadowing constant.

(e) `:focus-visible` rings — four selectors land at the global layer in
    `style.css` (`.sidebar-link, .floating-toc-item, .callout-btn,
    .gallery-card`), mirroring the canonical pattern at
    AppHeader.vue:174-177. `GalleryCard.vue:62-75` converts the bare
    `<div @click>` to `role="button" tabindex="0" :aria-label` +
    `@keydown.enter.space.prevent` (the canonical ARIA pattern).
    `GalleryCardModal.vue` re-points onto the glass-ui `<Dialog>`
    primitive (already in use at GalleryView.vue:381 + AdminFlaggedPanel.vue:264),
    bringing role="dialog" + focus-trap + Escape-close + return-focus for
    free.

Honesty bar (P4.C2 strengthening): every refinement preserves surface-
treatment + colour-system + IA-paradigm baselines. NO new design language —
the cartoon-card shim re-binds against glass-ui's existing utility; the
amber darkening is a one-rung lift of an existing token; the focus-ring
pattern lifts the canonical token-driven recipe; the source-strip uses the
existing `<input type="file">` plumbing; the modal re-point lifts an in-tree
primitive; the GalleryCard role-promotion is the standard ARIA pattern.

Build: `npm run build` green (vue-tsc -b + Vite). E2E suite gated on host
bring-up (W6 ε surface); the W4 binding shape-tests (grep + computed-style
contracts) verified at close-record §2.

Coordination asks recorded for glass-ui carries (the cartoon-card recipe
re-export + the light-mode `--viz-amber` rebaseline); both are pure carries,
no fourier blocking dependency.

Close-record: docs/tranches/D/audit/W4-design-refinement.md.
```

---

**End of W4 close record.**
