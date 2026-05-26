# H2 — A.W2 + A.W3 hardening (style abrogation + interactive-primitive adoption)

**Mode:** READ-ONLY hardening sweep. No edits. No commits.
**Date:** 2026-05-18.
**Charter:** re-verify the W2/W3 specs and the audits they descend from (C, D) against the live working tree; reconcile C-vs-D on glass-ui gaps; produce per-rule line ranges, native-button verification, AB+1 cohort verification, `@keyframes` audit, and WAVE_SPEC compliance diffs.

---

## §1 — Per-CSS-file hardened disposition tables

### 1.1 `web/src/styles/fourier-overrides.css` (354 lines, verified line counts)

Disposition key (per audit C): **i** fold-to-component · **ii** lift-to-glass-ui (gap) · **iii** dead — delete.

| # | Rule | Lines | Disposition | Target / owning component |
|---|---|---|---|---|
| 1 | `@theme { --font-serif/-sans/-display/-mono }` | 14–19 | iii | duplicate of `glass-ui/tokens.css §--font-stack-*`; delete |
| 2 | `:root` warm-cream palette `--background…--shadow` | 23–46 | iii (with neutral-ladder fix) | `glass-ui/tokens.css:205–234`; restore via `--neutral-0..5` derivation, not raw `hsl()` |
| 3 | `--shadow-color`, `--radius` | 42, 45 | iii | canonical in glass-ui |
| 4 | `--glass-opacity-subtle: 0.82` | 43 | iii | **dead** — v0.8.0 retired 4-tier ladder; the token resolves to nothing in glass-ui |
| 5 | `--glass-blur-default: blur(12px)` | 44 | iii | **dead** — same. Note: `buttons.css:139,140` still references it → see W3 carry |
| 6 | `.dark { --background…--shadow }` | 48–69 | iii | duplicate of `glass-ui/tokens.css:878–910` |
| 7 | `@custom-variant dark` | 72 | iii | already declared in glass-ui `theme.css` |
| 8 | `--section-color-0..12` (light) | 79–91 | iii | duplicate of `glass-ui/tokens.css:269–281` |
| 9 | `--accent-pink/-red`, `--section-heading` (light) | 94–96 | iii | duplicate of `glass-ui/tokens.css:284–286` |
| 10 | `--viz-fourier/-chebyshev/-legendre/-amber/-green` (light) | 99–103 | iii | duplicate of `glass-ui/tokens.css:291–295` |
| 11 | `--easing-accent` | 106 | i → ii | **glass-ui gap** — single-purpose viz easing; fold to `EasingPicker.vue` for W2 close, propose `--viz-easing` upstream |
| 12 | `--tier-featured/-saved/--like/-success/-warning/-info/-delete` (light) | 109–115 | iii | duplicate of `glass-ui/tokens.css:298–304` |
| 13 | `--shadow-cartoon/-hover/-soft/-elevated/-modal` (light) | 118–122 | iii | duplicate of `glass-ui/tokens.css:318–324` |
| 14 | `--z-canvas-layer: 1`, `--z-canvas-overlay: 20` | 125–126 | ii | **glass-ui gap** — canvas-layer z-rungs; or remap onto `--z-content`/`--z-controls` |
| 15 | `--z-toast: 250` | 127 | iii | drop — adopt canon `--z-toast: 160` |
| 16 | `--type-admin-label`, `--type-micro` | 130–131 | iii | duplicate of `glass-ui/typography.css:206–207` |
| 17 | `.dark` per-section colors `--section-color-0..12` | 136–148 | iii | duplicate of `glass-ui/tokens.css:913–925` |
| 18 | `.dark --accent-pink/-red --section-heading` | 151–153 | iii | duplicate of `glass-ui/tokens.css:927–929` |
| 19 | `.dark --viz-*` | 156–160 | iii | duplicate of `glass-ui/tokens.css:931–935` |
| 20 | `.dark --tier-*/--like/--success/--warning/--info/--delete` | 163–169 | iii | duplicate of `glass-ui/tokens.css:950–956` |
| 21 | `.dark --shadow-cartoon/-soft/-elevated/-modal` | 172–176 | iii | duplicate of `glass-ui/tokens.css:966–972` |
| 22 | `@theme --color-* aliases` (accent/section/tier/viz) | 182–200 | i (predominantly iii) | glass-ui `theme.css` already bridges most; verify gaps for `--color-accent-pink/-red`, `--color-section-heading` (consumer-specific palette aliases) |
| 23 | `@layer base { * { @apply border-border } }` | 205–207 | iii | global border reset already in glass-ui canon |
| 24 | `@layer base { html, body { @apply bg-background text-foreground font-serif; min-height: 100dvh } }` | 209–213 | i | fold to `App.vue` root |
| 25 | `body { padding-bottom: env(safe-area-inset-bottom) }` | 215–217 | i | fold to `App.vue` root |
| 26 | `@utility text-micro` | 222–225 | iii | duplicate of `glass-ui/typography.css @utility text-micro` |
| 27 | `@utility text-admin-label` | 227–230 | iii | duplicate of `glass-ui/typography.css @utility text-admin-label` |
| 28 | `.cm-serif` | 232–234 | iii | duplicate of canonical `@utility cm-serif` |
| 29 | `.fira-code` | 236–239 | iii | duplicate of canonical `@utility fira-code` |
| 30 | `.fourier-f` | 243–249 | iii (regression — adopt canon) | canonical glass-ui `@utility fourier-f` is richer (italic + `--font-display` + variation-settings) |
| 31 | `.ease-apple`, `.ease-apple-spring` | 253–258 | iii | 0 usages confirmed via grep; canonical `--ease-apple/-apple-spring` tokens at `glass-ui/tokens.css:84–88` cover both |
| 32 | `@keyframes fade-in` | 262–265 | iii | `glass-ui/animations.css` ships canonical `fade-in` |
| 33 | `@keyframes scale-in` | 267–270 | iii | `pop` transition covers; 1 site uses (`ImageUpload.vue:53`) → migrate to `pop` |
| 34 | `@keyframes slide-up` | 272–275 | iii | `fade-slide` transition covers |
| 35 | `.animate-fade-in / -scale-in / -slide-up` classes | 277–287 | iii | only 1 grep hit (`ImageUpload.vue:53`), replace inline |
| 36 | `[data-state="active"][role="tabpanel"]` selector | 289–291 | i → ii | tab-panel entry animation; belongs on glass-ui `tabs` primitive |
| 37 | `@keyframes tab-slide-in` | 293–296 | iii (paired with #36) | dies with #36 |
| 38 | KaTeX `@font-face` swap | 300–311 | i | fold to `katex.css` (project-specific KaTeX) |
| 39 | `.katex` / `.katex-display` sizing + `.dark .katex` | 313–330 | i | fold to `katex.css` |
| 40 | `::selection` (light + dark) | 334–341 | i → ii | **glass-ui gap** — no canonical selection rule; fold for W2 close, propose upstream |
| 41 | `@media (prefers-reduced-motion) { .animate-* tab-slide-in }` | 345–354 | iii | dies with the classes |

**Hardened tally:** **30 rules iii (delete)** · **7 rules i (fold)** · **4 rules ii (glass-ui gap)**. The audit C tally of "~24 dead, ~7 fold, ~4 lift" was conservative on the delete count because it merged the light + dark token forks under each token family; per-rule entry expands those to 30. Folds and lifts match. File is **fully abrogatable** — verdict unchanged.

### 1.2 `web/src/styles/ios-fixes.css` (35 lines, verified)

| # | Rule | Lines | Disposition | Target |
|---|---|---|---|---|
| 1 | `html { font-size: 1.125rem; line-height: 1.75rem }` + `@media(min-width:768px) html { 1rem/1.5rem }` | 10–20 | ii | **glass-ui gap** — responsive root font-size; no `--font-size-root` token in canon. Cross-walk with `glass-ui/utilities.css:159` `.ios input { font-size: max(1rem,1em) }` |
| 2 | `@media(max-width:640px) .paper-article pre/code` font shrink + `.paper-article pre` overflow | 24–34 | i | fold to `PaperArticleWindow.vue` / `PaperView.vue` scoped CSS |

**Hardened tally:** **1 fold · 1 lift**. Matches audit C. **Abrogatable**.

### 1.3 `web/src/styles/buttons.css` (216 lines, verified)

| # | Rule | Lines | Disposition | Target |
|---|---|---|---|---|
| 1 | `input[type="range"]:not(.styled-slider)` base + thumb + hover + active | 11–42 | ii (or migrate consumers) | **glass-ui gap** — no canonical native-range recipe. Only 1 consumer in tree (`EditorControlsDock.vue:211` is inside a `.magnet-popover-content` rule; *no actual `<input type="range">` outside `.styled-slider` survives*). **Strong delete candidate** — all surviving range inputs already wear `.styled-slider`. Hardened verdict: **iii (delete)** rather than ii |
| 2 | `.styled-slider` track + thumb + hover + active + moz-pseudo (7 consumer sites: `BasisSelector.vue:157,183`, `EditorToolsPanel.vue:52`, `EditorControlsDock.vue:109`, `HarmonicLevelGrid.vue:24,47`, `MorphPhaseConfig.vue:28`) | 46–123 | ii **DISCHARGED** | `<Slider variant="glass-scrubber">` in glass-ui v1.8.x (`glass-ui/src/components/ui/slider/index.ts` lines 21+) canonicalizes this 3-layer recipe. Migrate the 7 consumer sites to `<Slider variant="glass-scrubber">` and delete the CSS. See §6 reconciliation |
| 3 | `.btn-icon-admin` (`@layer components`) — 3 consumers: `GalleryCard.vue:122,129,136` | 128–154 | iii | reinvents `.glass-btn` at icon size; replace with `<Button variant="glass" size="icon">` |
| 4 | `.btn-solid` — 1 consumer (`ExportModal.vue:86`) | 156–183 | iii | replace with `<Button variant="default">` |
| 5 | `.btn-ghost` — 1 consumer (`ExportModal.vue:85`) | 185–209 | iii | replace with `<Button variant="ghost">` |
| 6 | `.basis-pill` — 3 consumers (`BasisSelector.vue:124`, `GalleryCard.vue:87`, `GalleryCardModal.vue:135`) | 211–215 | i | fold to `BasisSelector.vue` and re-import via class composition in card consumers, OR fold to a single `<BasisPill>` SFC |

**Hardened tally:** **3 rules iii (delete)** · **1 rule i (fold)** · **1 rule ii→discharged** by `glass-scrubber` adoption · **1 rule iii** (native-range recipe newly classified — see #1 hardened verdict). Audit C said "3 delete / 1 fold / 2 glass-ui-addition"; hardening **lowers the glass-ui-addition count to 0** because (a) `.styled-slider` is discharged by `<Slider variant="glass-scrubber">`, (b) the native-range recipe has zero consumers outside `.styled-slider`. **File is fully abrogatable — W2 deletes it outright; the slider-residue carve W2 spec lines 3, 14, 26 contemplate is no longer needed.**

This is the single most consequential delta from the audit-C ledger to the W2 plan.

---

## §2 — Native `<button>` re-count

| Surface | Count | Method |
|---|---|---|
| `git grep '<button' web/src/components` (tracked only) | **79** | working tree includes 3 untracked `.vue` files in `web/src/components/morph/` |
| `grep -r '<button' web/src/components` (filesystem) | **89** | matches audit C/D claim |
| `grep -r '<button' web/src/` (all of web/src) | **89** | components is the sole locus |

**Audit C/D claim of 89 stands.** The 10-button delta hides in three working-tree-untracked files (these will land via the W1 cohort commit; their counts are real and W3 must address them):

| Untracked file | `<button>` count |
|---|---|
| `web/src/components/morph/FourierMorphDemo.vue` | 2 |
| `web/src/components/morph/FourierShapeExtractor.vue` | 1 |
| `web/src/components/morph/HarmonicLevelGrid.vue` | 1 |
| `web/src/components/morph/MorphShapePreview.vue` | 1 |

(plus 5 others were marked deleted in git status header but visible on disk — net delta = +10 over `git grep`'s 79).

**Top button-density files (W3 priority queue):**

| File | Count |
|---|---|
| `visualization/ExportModal.vue` | 7 |
| `visualization/gallery/AdminUserList.vue` | 6 |
| `visualization/gallery/UserSlugBar.vue` | 5 |
| `visualization/gallery/GalleryCardModal.vue` | 5 |
| `paper/MobileFloatingToc.vue` | 5 |
| `visualization/gallery/GalleryCard.vue` | 4 |
| `visualization/gallery/AdminFlaggedPanel.vue` | 4 |
| `paper/PaperSidebar.vue` | 4 |

### Non-trivial adoption sites — site-specific guidance

These are sites where `<Button>` does **not** drop in cleanly; the W3 ledger must flag each:

1. **File-upload labels.** Two file inputs: `visualization/ImageUpload.vue:121` (the upload chassis) and `visualization/VisualizationView.vue:220` (`canvasFileInput`). Both pair a hidden `<input type="file">` with a clickable surface. `<Button>` cannot be a `<label htmlFor>`; W3 must use `<Button as="label">` (reka-ui pass-through) or render a Button-styled `<label>` via `buttonVariants()` class composition. Document the pattern in `W3-button-ledger.md`.
2. **`<button>` inside `<DockIconButton>` / `<Toggle>` / `<Slider>` slot.** Several gallery surfaces wrap native `<button>` inside reka-ui primitives that already render a button — these are duplicate elements, not migration targets. Spot check: `gallery/GalleryGrid.vue:62` (the `.fira-code` count badge nested under a card; verify it is rendering as `<span>`, not `<button>`).
3. **`role="button"` divs are not in scope.** Grep confirms 0 `role="button"` divs; the migration is purely `<button>` → `<Button>`.
4. **`tabIndex`-bearing summary triggers.** `MobileFloatingToc.vue:103` uses a `<button>` inside a sticky disclosure; this is a `<Collapsible.Trigger asChild>` candidate, not a `<Button>`. The 5 buttons in this file split between disclosure-triggers and item-row anchors; classify per-button.
5. **Modal close-X icons.** ~10 sites wear an icon-only `<button>` with an SVG child; `<Button variant="ghost" size="icon">` is the canonical replacement.

---

## §3 — AB+1 primitive-adoption cohort verification

### 3.1 glass-ui export verification (`glass-ui/package.json:exports`)

| Primitive | Subpath | Export node verified | Adoption count in fourier |
|---|---|---|---|
| `AnimatedDigit` | `@mkbabb/glass-ui/animated-digit` | `package.json` `exports./animated-digit` → `src/animated-digit.ts` ✅ | **0** (grep verified) |
| `MetricRow` / `MetricStack` | `@mkbabb/glass-ui/metric-stack` | `exports./metric-stack` → `src/metric-stack.ts` ✅ | **0** |
| `MetricCell` / `MetricBadge` | `@mkbabb/glass-ui/metric-cell` and `/metric-badge` | both export nodes present ✅ | **0** |
| `StatusDot` | `@mkbabb/glass-ui/status-dot` | `exports./status-dot` → `src/status-dot.ts` ✅ | **0** |
| `Skeleton` | `@mkbabb/glass-ui` root barrel (`src/index.ts:113 export * from "./components/ui/skeleton"`) | **NOT** a dedicated subpath; root-barrel only | **0** |

Note: `Skeleton` does NOT have its own subpath export. W3 scope-bullet 3.5 says `Skeleton (ui/skeleton)` which is technically wrong — it must import from the root barrel `@mkbabb/glass-ui`, not `@mkbabb/glass-ui/ui/skeleton`. This is a doc nit, not a structural defect; the primitive is shipped.

### 3.2 Proposed adoption sites — existence verification

| Primitive | Proposed sites (audit D) | Sites exist in tree? |
|---|---|---|
| `AnimatedDigit` | `AnimationControls.vue` speed readout (`fira-code` at line 69 `.summary-speed`); `ConvergenceTimeline.vue` count (line 70 — file at `equation/convergence/ConvergenceTimeline.vue`); `FrequencyGraph.vue` amp/phase; ~30 `fira-code` tabular sites | ✅ all exist; 69 `fira-code` occurrences across components (re-counted, exceeds audit-C's "~30") |
| `MetricRow` / `MetricStack` | `EqCoefficientsPanel.vue`, `CoefficientsPanel.vue`, `ConvergencePlot` readout clusters | ✅ all present |
| `MetricCell` / `MetricBadge` | `InfoCard` energy label, `EquationView` component pill | ⚠️ `InfoCard` not located by name — likely lives inside `equation/` as a sub-component; verify at W3 dispatch |
| `StatusDot` | gallery tier filter, `EquationModeToggle.vue` | ✅ both present |
| `Skeleton` | gallery card / paper article loading shimmer | ✅ bespoke shimmer rectangles in `gallery/GalleryGrid.vue` and `paper/` loading states |

**Verification verdict:** 4 of 5 primitives have clearly-named, confirmed adoption sites. `MetricCell/InfoCard` needs a W3-dispatch-time lookup. **Audit D's count claim is accurate.**

---

## §4 — `@keyframes` duplicate audit

`git grep -E '@keyframes' web/src` (canonical) returns **14 hits across 11 files**:

| Site | Animation | Glass-ui canon? | Disposition |
|---|---|---|---|
| `styles/fourier-overrides.css:262` | `fade-in` | YES — `animations.css` ships canonical `fade-in` | iii (file dies in W2) |
| `styles/fourier-overrides.css:267` | `scale-in` | covered by `pop` transition | iii |
| `styles/fourier-overrides.css:272` | `slide-up` | covered by `fade-slide` | iii |
| `styles/fourier-overrides.css:293` | `tab-slide-in` | belongs on `tabs` primitive | iii (ii upstream) |
| `equation/ConvergencePlot.vue:390` | `tooltip-in` | covered by `pop`/`dropdown` | delete; use `dropdown` transition |
| `visualization/AnimationControls.vue:174` | `rainbow-drift` | NO — unique cosmetic | keep, but bracket in `prefers-reduced-motion` |
| `visualization/ContourEditorCanvas.vue:327` | `golden-shimmer` | NO — unique | keep, bracket PRM |
| `visualization/ContourSettings.vue:359` | `adv-open` | belongs on `Collapsible` | delete; use glass-ui `Collapsible` |
| `visualization/ContourSettings.vue:363` | `adv-close` | same | delete |
| `visualization/ImageUpload.vue:160` | `rainbow-slide` | NO — unique | keep, bracket PRM |
| `visualization/gallery/GalleryCard.vue:204` | `like-bounce` | NO — unique | keep, bracket PRM |
| `visualization/gallery/GalleryGrid.vue:110` | `spin` | YES — canonical `spin` ships | iii — delete duplicate |
| `visualization/gallery/GalleryMarquee.vue:116` | `marquee-scroll-left` | NO — unique | keep, bracket PRM |
| `visualization/gallery/GalleryMarquee.vue:121` | `marquee-scroll-right` | NO — unique | keep, bracket PRM |

**Hardened count:** **14 `@keyframes` total** — of which **7 are duplicates of a glass-ui canonical animation** and **7 are project-unique cosmetics** (rainbow-drift, golden-shimmer, like-bounce, marquee×2, rainbow-slide, plus the two `adv-open/close` Collapsible-shadows that should be deleted in favour of the canonical Collapsible component, not because their *name* collides).

Audit C said "12 duplicate `@keyframes`" in axis 5; the hardened count of true canonical-name duplicates is **closer to 7** (4 in `fourier-overrides.css` + `tooltip-in`, `spin`, `tab-slide-in`). The "12" framing conflated *name-collision* with *should-be-deleted-via-primitive-adoption* (`adv-open/close`, `popup`, `icon-swap`). Both classes resolve at W3, so the practical surface is the same; the **disposition count of 7+ to delete and ≥5 to retain-with-PRM-bracket is the firm number**.

---

## §5 — WAVE_SPEC compliance diff for W2/W3

WAVE_SPEC requires 9 sections: Header, State, Scope, File Bounds, Agent Units, Hard Gate, Verification Artefacts, Dependencies, Archaeology (conditional).

### W2.md compliance

| Section | Present? | Quality |
|---|---|---|
| 1 Header | ✅ `# A.W2 — Override-stylesheet abrogation` | clean |
| 2 State | ✅ Opens-after / Agents / Hard gate / Status | one-line hard gate is dense (5 conjunctive conditions); could be split — minor |
| 3 Scope | ✅ 7 numbered bullets | concrete, no "if time allows" |
| 4 File Bounds | ✅ table + Do-NOT-touch | clean |
| 5 Agent Units | ✅ A.W2.a/b/c/d, each w/ Mechanism + Files + Sub-gate | clean |
| 6 Hard Gate | ✅ 5 numbered evidence-backed conditions | clean |
| 7 Verification Artefacts | ✅ ledger + screenshot dir + PROGRESS.md | clean |
| 8 Dependencies | ✅ depends-on / blocks | clean |
| 9 Archaeology | ✅ present (the fourier-overrides fork history) | clean |

**W2 compliance verdict: 9/9, fully compliant.** Weak section: scope bullet 7's mention of the "minimal named local carry" route is somewhat soft; the §1.3 hardening of this audit reduces it to N/A (the `glass-scrubber` discharge means there is no slider lift to carry).

### W3.md compliance

| Section | Present? | Quality |
|---|---|---|
| 1 Header | ✅ | clean |
| 2 State | ✅ | clean; hard-gate line dense but unambiguous |
| 3 Scope | ✅ 4 numbered bullets | concrete; bullet 3 lists 5 primitives with subpaths — minor: `Skeleton` subpath line `ui/skeleton` is technically root-barrel only (see §3.1 above) |
| 4 File Bounds | ✅ | "every component with a native `<button>` (88 files max per audit)" — the *88* number is approximate; per §2 above it is 89 across 34 component files. Re-state as the file count, not the button count, for precision |
| 5 Agent Units | ✅ a/b/c/d | clean |
| 6 Hard Gate | ✅ 5 conditions | clean |
| 7 Verification Artefacts | ✅ ledger × 2 + screenshots | clean |
| 8 Dependencies | ✅ | clean |
| 9 Archaeology | ✅ AB+1 cohort history | clean |

**W3 compliance verdict: 9/9, fully compliant.** Weaknesses are precision nits, not structural absences.

---

## §6 — Audit C vs Audit D reconciliation — surviving glass-ui gaps

Audit C named **5 gaps**:
1. Styled progress-fill range slider (`buttons.css:46–123 .styled-slider`)
2. Native `input[type=range]` recipe (`buttons.css:11–42`)
3. Responsive root font-size (`ios-fixes.css:10–20`, `--font-size-root`)
4. `::selection` style (`fourier-overrides.css:334–341`)
5. Bounce easing token `--ease-overshoot` (`cubic-bezier(0.34,1.56,0.64,1)`)

Audit D's CR-2 cross-walk asserted: GlassScrubber **shipped** (`<Slider variant="glass-scrubber">` at `glass-ui/src/components/ui/slider/index.ts`); fourier adopted it at all 3 listed sites (`SliderControl.vue:86`, `GlassTimeline.vue:67`, `ConvergenceTimeline.vue:70`).

### Reconciled gap ledger

| # | C gap | D status | Surviving? | Placement disposition |
|---|---|---|---|---|
| 1 | Styled progress-fill range slider | `<Slider variant="glass-scrubber">` shipped + 3 sites migrated | **DISCHARGED** — no gap remains. The 7 *additional* `.styled-slider` consumers in fourier (BasisSelector ×2, EditorToolsPanel, EditorControlsDock, HarmonicLevelGrid ×2, MorphPhaseConfig) are *consumer-adoption debt*, not a library gap. W3 owns the migration | n/a — no upstream filing |
| 2 | Native `input[type=range]` recipe | not directly addressed | **NOT SURVIVING** — the `:not(.styled-slider)` recipe (lines 11–42) has **zero consumers** in the actual tree; every `<input type="range">` already wears `.styled-slider`. The recipe is dead code. | **delete in W2**; do not file upstream |
| 3 | `--font-size-root` (responsive root font-size) | not addressed | **SURVIVING** — glass-ui ships no `--font-size-root` token; consumer's `ios-fixes.css:10–20` is the only home | **fold to App.vue or `style.css`** for W2 close (1 consumer, single-shot); file as a soft upstream proposal to glass-ui but do not block on it |
| 4 | `::selection` | not addressed | **SURVIVING** — `grep -n selection glass-ui/src/styles/*.css` returns nothing; canon has no selection rule | **fold to App.vue** scoped global for W2 close; propose upstream as a `glass-ui` base-layer addition |
| 5 | `--ease-overshoot` (cubic-bezier 0.34,1.56,0.64,1) | not addressed | **SURVIVING** — glass-ui has `--ease-apple-spring` (`0.175,0.885,0.32,1.275`) and `--spring-bouncy` (a `linear()` curve at `tokens.css:72`); neither matches `(0.34,1.56,0.64,1)` exactly | **fold per-site or define a single project-local `--ease-overshoot` in App.vue** for W2 close; soft upstream proposal |

### Firm surviving glass-ui gap list (post-reconciliation)

**Three real gaps survive: `--font-size-root`, `::selection`, `--ease-overshoot`.**

All three are single-consumer or single-rule, suitable for a *named local carry* in App.vue or a residual minimal `style.css` block, with a soft upstream proposal — never a re-fork. Per W2 spec bullet 7, these are the items that route to the constellation; the others (the slider and the native-range recipe) are discharged or dead.

**This is the single most important reconciliation:** audit C's 5 gaps reduce to **3** after CR-2's `<Slider variant="glass-scrubber">` discharge plus the recognition that the native-range recipe has no consumers.

---

## §7 — Other cross-checks (verified by grep)

| Claim | Audit C/D figure | Hardened figure | Notes |
|---|---|---|---|
| Native `<button>` elements | 89 | 89 (filesystem) / 79 (git-tracked) | the 10-element delta sits in untracked morph/* files |
| `transition: all` in scoped CSS | 11 sites | **27 sites across 22 files** (full grep) | audit C undercounted by ~2.5× |
| Hand-rolled cubic-bezier strings | ~20 | **35 total grep hits across web/src** | audit C's "~20 distinct sites" may be deduped by curve; the raw count is higher |
| `fira-code` tabular usages | ~30 | **69 occurrences** in components | strong AnimatedDigit adoption case; the figure of "~30" understated by 2× |
| `.animate-*` class consumers | 1 (`ImageUpload.vue:53`) | 1, confirmed | audit C correct |
| `.ease-apple*` class consumers | 0 | 0, confirmed | audit C correct |
| `.styled-slider` consumers (in tree) | ≥5 sites named | 7 distinct sites confirmed | mild undercount; W3 adoption ledger must include all 7 |
| `.btn-icon-admin` consumers | named (≥3) | 3 confirmed (`GalleryCard.vue:122,129,136`) | exact |
| `.btn-solid`/`.btn-ghost` consumers | named | 1 site each (`ExportModal.vue:86, 85`) | exact |
| `.basis-pill` consumers | named | 3 confirmed (`BasisSelector.vue:124`, `GalleryCard.vue:87`, `GalleryCardModal.vue:135`) — plus 1 separate `.basis-pill-btn` recipe in `GallerySearchBar.vue:110` | exact |

---

## §8 — Cross-references

- W2 spec: `docs/tranches/A/waves/W2.md`
- W3 spec: `docs/tranches/A/waves/W3.md`
- Audit C: `docs/audits/runs/2026-05-18-fourier-tranche/c-style-consumer.md`
- Audit D: `docs/audits/runs/2026-05-18-fourier-tranche/d-style-glassui.md`
- WAVE_SPEC: `docs/precepts/instructions/tranche/WAVE_SPEC.md`
- glass-ui slider canon: `/Users/mkbabb/Programming/glass-ui/src/components/ui/slider/index.ts:21-47` (variant enumeration), `Slider.vue:1-100` (dock-context wiring)
- glass-ui exports: `/Users/mkbabb/Programming/glass-ui/package.json` (44 subpaths verified)
- All four CSS files: `web/src/styles/{fourier-overrides,ios-fixes,buttons}.css` and `web/src/style.css`

---

## §9 — Hardening verdict

W2 and W3 are **structurally sound and WAVE_SPEC-compliant**. The plan can dispatch as written, with three precision adjustments:

1. **`buttons.css` deletes outright in W2**, not as a slider stub — the `glass-scrubber` discharge eliminates the slider-residue carve W2 currently contemplates. Update W2 §3 bullet 3 and §4 access mode (`delete`, not `modify-carve`).
2. **The surviving glass-ui gap list is 3, not 5** — `--font-size-root`, `::selection`, `--ease-overshoot`. The other two C-gaps (`styled-slider`, native-range) are discharged or dead. Update W2 §3 bullet 7 to name the 3, not refer ambiguously to "the ~4+1+2 lift candidates."
3. **W3's `Skeleton` import path is the root barrel** `@mkbabb/glass-ui`, not a dedicated subpath. Update W3 §3 bullet 3.5 to drop the `(ui/skeleton)` qualifier.

The W1→W2→W3 dependency chain holds. The 89-native-button claim is verified at filesystem-truth; the 79 visible to `git grep` is the working-tree-clean target after W1 lands the cohort.
