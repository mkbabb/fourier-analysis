# M-bump-migration — M.W1 multi-major dependency bump migration map

**Wave**: M.W1 (keystone — every downstream suffusion wave gates on this)
**Authored**: 2026-06-16 — tranche-development-only; no source edits
**Source of truth**: M.md §4 (M.W1 row) + §11.1/§11.2 (risks); plan-synth.json M.W1 wave; raw-findings.json A5 + D1 + D4 + A8; verified at source against glass-ui 4.0.0 (`/Users/mkbabb/Programming/glass-ui`), keyframes.js 4.2.0 (`/Users/mkbabb/Programming/keyframes.js`), value.js 0.12.0 (`/Users/mkbabb/Programming/value.js`), fourier HEAD

---

## §1 — The version delta

| Dep | Current pin (`web/package.json`) | Published | Semver gap | Fourier's import surface (grep counts, `web/src/`) |
|---|---|---|---|---|
| `@mkbabb/glass-ui` | `^3.1.0` (installed 3.1.0) | **4.0.0** | 1 MAJOR | 11 subpaths; 35× `/button`, 7× `/slider`, 7× `/metric-badge`, 5× `/dialog`, 4× `/configurator`, 3× `/tabs`, 3× `/dock`, 2× each of `/tooltip`, `/toast`, `/sidebar`, `/hover-popover`, `/hover-card`, `/dropdown-menu`, `/collapsible`, `/badge`; 6+1 root-barrel imports (`useClipboard`×3, `Checkbox`×2, `supportsViewTransitions`×1 + `Collapsible`×1); total import lines: ~89 |
| `@mkbabb/keyframes.js` | `^2.2.0` (installed 2.2.0) | **4.2.0** | 2 MAJORS | 1 subpath: root barrel; `loadAnimationEngine` (1 site, `useFourierMorph.ts:14`) + `type Animation` (same file); `import type` only elsewhere |
| `@mkbabb/value.js` | `^0.10.0` (installed 0.10.0) | **0.12.0** | 2 MINORS | 1 subpath: root barrel; `easeInOutSine` (3 files), `timingFunctions` + 5 named easing fns (`easeInOutCubic`/`Quad`/`Expo`/`Circ`) (`lib/easings.ts`) |

**Bump target** (single `package.json` commit, per A5-09): `@mkbabb/glass-ui@^4.0.0`, `@mkbabb/keyframes.js@^4.2.0`, `@mkbabb/value.js@^0.12.0`. keyframes.js moves from peer-inferred (carried transitively through glass-ui) to a **direct `dependencies` entry** (fourier directly calls `loadAnimationEngine`; M.W9 adds `Sequence`/`NumericAnimation`/`RAFPlayback`).

Verified at source: `glass-ui/package.json → version: 4.0.0`; `keyframes.js/package.json → version: 4.2.0`; `value.js/package.json → version: 0.12.0`.

---

## §2 — The glass-ui 4.0 breaking surface

Ordered by severity (build-error first, then silent visual regressions, then import-hygiene). Every row source-verified against glass-ui 4.0.0 at `/Users/mkbabb/Programming/glass-ui`.

### §2.1 — Hard build breaks (will error on bump without migration)

| Break | 4.0 replacement | Fourier sites (file:line, count) | Verified source |
|---|---|---|---|
| `UnderlineTabs` import from `@mkbabb/glass-ui/tabs` — **GONE** in 4.0 (BA.W-TABS clean break, no alias) | `<SegmentedTabs variant="underline">` from `@mkbabb/glass-ui/tabs`; prop/event contract preserved (`:options`/`v-model`/`@update:model-value` unchanged) | `VisualizationView.vue:27+182`, `GalleryView.vue:13+223`, `EquationView.vue:13+188` — **3 import sites, 3 template usages** | `glass-ui/src/components/custom/tabs/index.ts` exports only `SegmentedTabs`; `MIGRATION.md` §BA.W-TABS confirms `UnderlineTabs` removed, receiver contract preserved |

### §2.2 — Silent visual regressions (will not error; will silently break rendering)

| Break | 4.0 replacement | Fourier sites (file:line, count) | Verified source |
|---|---|---|---|
| `variant="glass-scrubber"` on `<Slider>` — **not a 4.0 variant** (only `standard` and `spectrum` ship) | Remove `variant="glass-scrubber"` or replace with `variant="standard"` (the semantically correct default scrubber); scoped CSS retint hooks use `--slider-range-bg`/`--slider-track-bg` (4.0 knobs) — the `--slider-scrub-*` token set is **absent from 4.0 source** (UNVERIFIED whether those custom props ever had backing paint in 3.1.0; the scoped `.basis-slider-track { --slider-scrub-range-bg ... }` retints may have been no-ops) | `BasisSelector.vue:170+197`, `EditorControlsDock.vue:117`, `GlassTimeline.vue:67`, `SliderControl.vue:83`, `ConvergenceTimeline.vue:71`, `HarmonicLevelGrid.vue:19+42`, `MorphPhaseConfig.vue:23` — **7 files, 14 template occurrences** (per `grep -rc 'variant="glass-scrubber"' web/src/`) | `glass-ui/src/components/ui/slider/Slider.vue:34` — `v ?? 'standard'` default; only `standard` and `spectrum` variants in CVA; `glass-scrubber` absent from entire 4.0 source tree. Scoped `.glass-scrubber` CSS selectors: 0 occurrences in any of the 7 files (the retint hooks already scope to fourier-local class names like `.basis-slider-track`) |
| `<DialogContent variant="opaque">` — `variant` prop **RETIRED** in 4.0 (BA.W-SURFACE-AXIS); unrecognized prop passes as attr silently, dialog falls through to `glass-floating` default | `surface="opaque"` — rendered output byte-identical per MIGRATION.md; same `.glass-opaque` material reached through the shared Surface resolver | `GalleryView.vue:402`, `AdminFlaggedPanel.vue:265`, `AdminUserList.vue:461`, `GalleryCardModal.vue:72` — **4 files** (audit said 3; source grep finds 4; CORRECTION) | `glass-ui/MIGRATION.md` §BA.W-SURFACE-AXIS confirmed; `DialogContent.vue` uses `surface` prop in 4.0 source |
| `MetricBadge :amount` prop — **RENAMED to `:value`** (AZ.W-METRIC-UNIFY, shipped at 3.13.0; re-flagged for 4.0 consumer set); on bump `:amount` is unrecognized → silent undefined → placeholder renders for all values including valid `0` | `:value` — mechanical prop rename, semantics identical | `EquationPanel.vue:78`, `EditorControlsDock.vue:113`, `AnimationControls.vue:75`, `GalleryAdminBanner.vue:46+53+61+69+76+83` (6×), `GalleryDraftsSection.vue:58`, `EquationView.vue:293`, `InfoCard.vue:32` — **7 files, 12 occurrences** | `glass-ui/CHANGELOG.md` §3.13.0 "BREAKING: `MetricBadge` `amount`→`value`" + §4.0.0 re-flag. `MetricBadge.vue` `defineProps` — UNVERIFIED at the prop-name level (MetricBadge.vue did not expose props grep result); the CHANGELOG confirmation is the primary source |
| `glass-subtle` on 4 committed HEAD sites — **class absent from glass-ui since v0.8.0** (pre-3.1.0); these 4 surfaces have had zero glass styling since fourier first adopted glass-ui | `glass-wash` (~0.30α — the correct 4.0 successor per `ladder.css:9`) | `EquationModeToggle.vue:9`, `ConvergenceLegend.vue:17`, `PaperView.vue:393`, `EquationPanel.vue:70` — **4 committed HEAD sites** | `glass-ui/src/styles/glass/ladder.css:9` — `"wash ~0.30α (was 'subtle')"` confirmed. `git show HEAD:...` on all 4 files confirmed `glass-subtle` in HEAD |
| Dirty-tree `glass-subtle→glass-quiet` rename is **SEMANTICALLY WRONG** — `glass-quiet` (~0.50α) is one full rung heavier than the correct successor `glass-wash` (~0.30α); committing it standalone pins fourier to mis-weighted glass before the bump resolves the 4.0 token set | **REVERT to `glass-wash`** (NOT `glass-quiet`) on the 4 `glass-subtle` sites; the `glass-medium→glass-resting`/`glass-floating` renames in the dirty tree are **correct** — commit those as-is | Dirty-tree files: `EquationModeToggle.vue`, `ConvergenceLegend.vue`, `PaperView.vue`, `EquationPanel.vue` (all `glass-subtle→glass-quiet`); `MobileFloatingToc.vue` (`glass-medium→glass-resting`×2 + `glass-medium→glass-floating`×1 — **correct**); `GallerySearchBar.vue` (`glass-medium→glass-resting` — **correct**); `docs/constellation/tri-tranche-run/RUN-BOARD.md` (metadata edit — carry as-is) | `glass-ui/src/styles/glass/ladder.css:9-12` — ladder comment: `wash ~0.30α (was 'subtle')`, `quiet ~0.50α (the missing rung)`, `resting ~0.65α (was 'default')`, `floating ~0.80α (was 'elevated')`. A8-02 (CRITICAL severity) double-confirmed. **This is load-bearing**: the `glass-quiet` rename must NOT be committed before the bump; it is incoherent against a 3.1.0 `node_modules` (inv-29 scope amendment: class-vocab renames are NOT progressive-enhancement candidates — they are hard RETIRED-class swaps under inv-3) |
| `glass-elevated` on 2 sites — **RETIRED at v0.8.0** → `glass-floating` (~0.80α per `ladder.css:12`); same silent no-style failure as `glass-subtle` | `glass-floating` | `PaperSearchDropdown.vue:39`, `EquationView.vue:261` — **2 sites** | `glass-ui/src/styles/glass/ladder.css:12` — `"floating ~0.80α (was 'elevated')"`. `CHANGELOG.md:3759` — migration table `glass-elevated → glass-floating`. NOT in dirty tree — must be fixed at execution |

### §2.3 — Import-path moves (tree-shaking / SCC-trap discipline; resolve correctly at 4.0 but drag vueuse into entry chunk)

| Break | 4.0 replacement | Fourier sites (file:line, count) | Verified source |
|---|---|---|---|
| `useClipboard` imported from root barrel `@mkbabb/glass-ui` — not a break (still resolves at 4.0), but pulls the vueuse SCC into the entry chunk | `@mkbabb/glass-ui/dom` (canonical per glass-ui MIGRATION §1.5 SCC-trap closure) | `useMorphConfig.ts:9`, `UserSlugBar.vue:5`, `EquationResult.vue:4` — **3 sites** | `glass-ui/src/composables/dom/index.ts:47` — `export * from "./useClipboard"`. `glass-ui/package.json exports["./dom"] → dist/dom.js` confirmed |
| `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent` imported from root barrel `@mkbabb/glass-ui` in `CollapsibleSection.vue` — not a break, but sub-optimal | `@mkbabb/glass-ui/collapsible` | `CollapsibleSection.vue:2` — **1 site** (PaperSidebar.vue and ContourSettings.vue already use `/collapsible` subpath) | `glass-ui/package.json exports["./collapsible"] → dist/collapsible.js` confirmed |
| `useTextHighlight` — currently **zero fourier call sites** (not yet adopted); when M.W8 adopts it, the correct subpath is `@mkbabb/glass-ui/motion-core` | `@mkbabb/glass-ui/motion-core` (NOT `/motion` — `/motion` is the keyframes.js-bearing tier; `useTextHighlight` is keyframes-free and lives on `/motion-core`) | 0 current sites — **future adoption target only** | `glass-ui/src/composables/motion/core/index.ts:53` — `export * from "../useTextHighlight"`. `glass-ui/package.json exports["./motion-core"] → dist/motion-core.js` confirmed. Distinguished from `/motion` (keyframes-bearing: `useSpring`, `useNumericTransition` etc.) |

### §2.4 — Dead component (DELETE, no migration)

| Item | Action | Evidence |
|---|---|---|
| `web/src/components/visualization/CanvasOverlayButton.vue` | **DELETE outright** — zero consumers; never imported; functionality subsumed by `DockIconButton` from `@mkbabb/glass-ui/dock` | A8-14: `grep -rni CanvasOverlay web/src/` → 0 import/usage hits outside the file itself |

### §2.5 — Summary site count

| Migration | Files | Template/attr occurrences |
|---|---|---|
| `UnderlineTabs→SegmentedTabs variant="underline"` | 3 | 3 |
| `variant="glass-scrubber"` drop/→`standard` | 7 | 14 |
| `DialogContent variant→surface` | 4 | 4 |
| `MetricBadge :amount→:value` | 7 | 12 |
| `glass-subtle→glass-wash` (HEAD committed) | 4 | 4 |
| `glass-elevated→glass-floating` (not in dirty tree) | 2 | 2 |
| `useClipboard` root→`/dom` | 3 | 3 |
| `Collapsible` root→`/collapsible` | 1 | 1 |
| `CanvasOverlayButton.vue` DELETE | 1 | — |
| **Total mechanical edits** | **≤20 files** | **~43 attribute/import occurrences** |

---

## §3 — The keyframes 2.x→4.x surface

### §3.1 — Fourier's actual import surface

Fourier's sole keyframes.js caller is `web/src/composables/useFourierMorph.ts:14`:

```
import { loadAnimationEngine, type Animation } from "@mkbabb/keyframes.js";
```

The used API: `loadAnimationEngine().then(engine => engine.Animation)` → `new Animation({...})` → `.addFrame()`, `.parse()`, `.play()`, `.stop()`. Verified at `useFourierMorph.ts:14-30`.

### §3.2 — The `loadAnimationEngine` lazy-import boundary (4.x — unchanged)

The `loadAnimationEngine()` dynamic import boundary is **present and unchanged** in keyframes.js 4.2.0. Verified at `keyframes.js/src/animation/index.ts:197`:

```
export const loadAnimationEngine = async (): Promise<AnimationEngine> => {
    // await import("./engine") ...
```

The HEAVY tier (`Animation`, `CSSKeyframesAnimation`, `AnimationGroup`, `getAnimationId`, `resolveKeyframes`, `presets`) is still reached only through `loadAnimationEngine()`. This is NOT a breaking change — the boundary is the documented public front door in 4.x.

### §3.3 — Breaking changes across 2.x→4.x that DO NOT hit fourier

- `tick()` renamed to `advanceTo(t)` (Engine, Group) — fourier never calls `tick()` directly; the rAF driver inside `Animation` uses it internally.
- `AnimationGroup.pause()` toggle-split into explicit `pause()`/`resume()` — fourier uses `Animation`, not `AnimationGroup`.
- `SmoothProgress.tickDt()` rename — fourier does not import `SmoothProgress` currently.
- Deprecated value.js re-exports deleted from keyframes barrel (`lerpColorValue` etc.) — fourier imports value.js directly, not through keyframes.
- `fail-explicit colorSpace` / `setHueMethod` — fourier passes no colorSpace options.

**Assessment** (per A5-07): the 2.2.0→4.2.0 bump is **zero-breaking for fourier's narrow `loadAnimationEngine`/`Animation`/`addFrame`/`parse`/`play`/`stop` surface**. Verified at source.

### §3.4 — New LIGHT surface available post-bump (additive, no breaking action required at M.W1)

`keyframes.js/src/animation/index.ts` static (value.js-free) exports available at M.W9 adoption:
- `NumericAnimation` — statically importable ping-pong/duration clock (replaces `animation.ts` hand-rolled rAF)
- `RAFPlayback` — managed bind-proof rAF driver
- `Sequence` — master-playhead temporal orchestrator (replaces the hand-chained `.then()` morph phases)
- `SmoothProgress`, `SpringProgress` — for `useCurveTransition` and `useCanvasHover` transpositions
- `stagger`, `flip`, `drag`, `decay`

**keyframes.js becomes a direct `dependencies` entry** at M.W1: fourier already statically imports `loadAnimationEngine` + `type Animation`; M.W9 adds `NumericAnimation`/`RAFPlayback`/`Sequence` from the LIGHT surface. The dep must be declared direct.

### §3.5 — Risk (from M.md §11.1)

> The keyframes lazy-import boundary (`loadAnimationEngine`/`Animation`/`addFrame`/`parse`) must be re-verified against 4.x before the morph transposition is treated as low-risk.

**Resolution**: re-verified at source (§3.2 above). The boundary is stable; M.W9 may proceed with the LIGHT tier transposition as low-risk.

---

## §4 — The value.js 0.10→0.12 surface

### §4.1 — Fourier's actual imports

Five import sites from `"@mkbabb/value.js"` root barrel only:

| Symbol | Files |
|---|---|
| `easeInOutSine` | `ConvergencePlot.vue:5`, `harmonics.ts:5`, `useCurveTransition.ts:8` |
| `timingFunctions` | `lib/easings.ts:9` |
| `easeInOutCubic`, `easeInOutQuad`, `easeInOutExpo`, `easeInOutCirc` (+ others) | `lib/easings.ts:16` |

### §4.2 — Breaking changes 0.10→0.12 affecting fourier: NONE

Verified at `value.js/src/index.ts`:
- `easeInOutSine` present at line 229 (unchanged)
- `timingFunctions` present at line 233 (unchanged)
- All named easing exports stable across 0.10→0.12

0.11.x series fixes (consumed transitively):
- The broken `"development"` export condition that silently broke Vite consumers in dev mode (0.11.0) — fourier's dev server easing resolution may have been silently broken since the 0.11.0 window.
- `parseCSSValueUnit("")` returns `ValueUnit(0)` instead of throwing (0.11.2) — fourier does not call this directly.

0.12.0: additive API additions (`mixColorsN` at index.ts:158 for M.W7's OKLCH ramp) — no break.

**The 0.12.0 bump is zero-breaking for fourier's surface**. It is required anyway as a transitive floor: keyframes.js 4.2.0 declares `peerDependency value.js ^0.11.2` (per A5-08 evidence from `keyframes.js/src/animation/index.ts` floor-advance note in changelog).

### §4.3 — New API adopted at M.W7 (additive)

`mixColorsN` (OKLCH ramp construction) — the single post-bump addition fourier needs for the canonical colour ramp. `sampleColorRamp` (the ideal equal-weight OKLCH sampler) is ratified for 0.13.0 but NOT yet published — M.W7 uses `mixColorsN` as the interim and books `sampleColorRamp` with a hard kill-date = 0.13.0 publish.

---

## §5 — The Node-20 Actions cutover

**Deadline**: 2026-06-16 (today — the deadline has arrived).

| File | Action | Sites |
|---|---|---|
| `.github/workflows/ci.yml` | `actions/checkout@v4` → `@v5`; `actions/setup-node@v4` → `@v5` | `ci.yml:54` (checkout only), `ci.yml:84-85` (checkout + setup-node), `ci.yml:117+122` (checkout + setup-node) — **3 checkout, 2 setup-node** |
| `.github/workflows/deploy-pages.yml` | `actions/checkout@v4` → `@v5`; `actions/setup-node@v4` → `@v5` | `deploy-pages.yml:62` (checkout only), `deploy-pages.yml:96+100` (checkout + setup-node) — **2 checkout, 1 setup-node** |

Note: `node-version: "22"` is already set in both workflows — no Node version change needed, only the action version pinning. Total: **5 checkout** and **3 setup-node** substitutions across 2 files.

This cutover is folded into the M.W1 commit as a non-dep hygiene sweep. The two changes are independent but belong in the same wave (both are "the world changed; fourier must catch up" hygiene, not design work).

---

## §6 — The ordering and the gate

### §6.1 — The mandatory ordering (load-bearing)

```
STEP 0  Commit the glass-medium→glass-resting/floating correct renames from dirty tree
        (MobileFloatingToc, GallerySearchBar) — these are CORRECT and commit-ready
        WITHOUT the bump; they fix glass-medium which was absent from 3.1.0.

STEP 1  Bump package.json: glass-ui ^4.0.0 + keyframes.js ^4.2.0 (direct dep) + value.js ^0.12.0
        → npm install (regenerate package-lock.json as single-copy, no dedup collisions)

STEP 2  Discharge breaking surface IN ORDER:
        2a  glass-subtle→glass-wash (4 HEAD sites: EquationModeToggle, ConvergenceLegend,
            PaperView, EquationPanel) — NOT glass-quiet; do NOT commit this before STEP 1
        2b  glass-elevated→glass-floating (2 sites: PaperSearchDropdown, EquationView)
        2c  UnderlineTabs→SegmentedTabs variant="underline" (3 files, 3 template sites)
        2d  DialogContent variant→surface (4 files)
        2e  MetricBadge :amount→:value (7 files, 12 occurrences)
        2f  useClipboard root→@mkbabb/glass-ui/dom (3 files)
        2g  Collapsible root→@mkbabb/glass-ui/collapsible (1 file: CollapsibleSection.vue)
        2h  variant="glass-scrubber"→variant="standard" (7 files, 14 occurrences);
            audit each file's --slider-scrub-* retint hooks → remap to --slider-range-bg/
            --slider-track-bg (the 4.0 knobs); verify scoped CSS selectors still match
        2i  DELETE CanvasOverlayButton.vue

STEP 3  Node-20 Actions: checkout@v5 + setup-node@v5 in ci.yml and deploy-pages.yml

STEP 4  Run vue-tsc -b (must be zero errors)
        Run vite build (must succeed)

STEP 5  GATE: cite a green CI run id (inv-27) over the post-bump tree
```

### §6.2 — Why the ordering is load-bearing

**The `glass-quiet` rename is incoherent before the bump.** `glass-quiet` is a 4.0 tier class; the 3.1.0 `node_modules` has no CSS rule for it — committing the dirty tree before the bump would pin fourier in a worse state (still no glass styling, wrong rung, incoherent vocabulary). The 4 `glass-subtle` HEAD sites are ALREADY broken no-ops (glass-subtle absent from 3.1.0 dist); the priority is to get the bump landed so the correct 4.0 token resolves, then apply `glass-wash`.

The MobileFloatingToc / GallerySearchBar `glass-medium→glass-resting/floating` renames CAN go first (glass-medium is also absent from 3.1.0, so they are also no-ops today; but they name the correct 4.0 tiers and are safe to commit independently as a doc-accurate fix).

### §6.3 — The keystone-failure risk

From M.md §11.1: the bump is the single point of failure — glass-ui is a MAJOR and keyframes TWO majors; latent faults can surface beyond the ~43 enumerated migration sites. The discipline:

1. Run `vue-tsc -b` BEFORE citing green CI — TypeScript will catch all named-export failures (UnderlineTabs, any moved type) that Vue runtime would miss.
2. The `glass-scrubber` → `standard` migration requires a per-file audit of scoped CSS retint hooks: the `--slider-scrub-*` custom props are absent from 4.0 Slider source; each file's retint block must migrate to `--slider-range-bg`/`--slider-track-bg` (the 4.0 knobs). **This is the one step that is not a pure mechanical rename** — it requires reading each file's scoped `<style>` block.
3. The Slider `size` prop now **actually paints** (BA.W-EMISSION): `size="md"` renders a 1.25rem track instead of the broken 6px prior fallback. Audit each `<Slider>` call site for an explicit `size` prop — if absent, the default (small?) may change rendered geometry.

### §6.4 — The full-MIGRATION-sweep-first discipline (from M.md §§2/11)

M.W1 is NOT a blind caret bump. The enumerated breaking surface (§2 above) is the sweep. The gate is a CITED green CI run id (inv-27) — not a local-only vue-tsc pass, not a "bump + trust the lock". Every item in §2 must be discharged before the CI gate is cited.

---

## Appendix — Source citations index

| Claim | Source |
|---|---|
| glass-ui 4.0.0 ladder tiers | `glass-ui/src/styles/glass/ladder.css:9-12` |
| `glass-subtle` successor is `glass-wash` | `ladder.css:9` — `"wash ~0.30α (was 'subtle')"` |
| `glass-elevated` successor is `glass-floating` | `ladder.css:12` — `"floating ~0.80α (was 'elevated')"` |
| `UnderlineTabs` removed, `SegmentedTabs` replacement | `glass-ui/src/components/custom/tabs/index.ts`; `MIGRATION.md §BA.W-TABS` |
| `DialogContent variant→surface` | `MIGRATION.md §BA.W-SURFACE-AXIS`; `CHANGELOG.md §4.0.0` |
| `MetricBadge amount→value` | `CHANGELOG.md §3.13.0` + `§4.0.0 re-flag` |
| `glass-scrubber` variant absent from 4.0 | `Slider.vue:34` — `v ?? 'standard'`; no `glass-scrubber` in 4.0 source |
| `useClipboard` in `/dom` subpath | `glass-ui/src/composables/dom/index.ts:47`; `package.json exports["./dom"]` |
| `Collapsible` in `/collapsible` subpath | `package.json exports["./collapsible"]` |
| `useTextHighlight` in `/motion-core` (NOT `/motion`) | `composables/motion/core/index.ts:53`; `package.json exports["./motion-core"]` |
| `loadAnimationEngine` boundary unchanged in 4.2 | `keyframes.js/src/animation/index.ts:197` |
| `Animation.addFrame`/`parse`/`play`/`stop` stable | `keyframes.js/src/animation/engine.ts:285+849` |
| `NumericAnimation`, `RAFPlayback`, `Sequence` as LIGHT static exports | `keyframes.js/src/animation/index.ts` — static export block |
| value.js `easeInOutSine` stable | `value.js/src/index.ts:229` |
| value.js `timingFunctions` stable | `value.js/src/index.ts:233` |
| `mixColorsN` available at 0.12.0 | `value.js/src/index.ts:158` |
| GitHub Actions `checkout@v4`/`setup-node@v4` | `ci.yml:54,84-85,117,122`; `deploy-pages.yml:62,96,100` |
| DialogContent variant=opaque: 4 sites (not 3 as audited) | `grep -rn 'variant="opaque"' web/src/` — 4 hits; A5-03 said 3 |
| glass-scrubber: 7 files, 14 variant= occurrences | `grep -rc 'variant="glass-scrubber"' web/src/` |
| Dirty tree content | `git diff web/src/` — 7 files, 9 changes |

---

## Flags — synth assumptions this source-check CONTRADICTED

1. **DialogContent variant=opaque: 4 sites, not 3.** `plan-synth.json` M.W1 and A5-03 both cite 3 call sites. Source grep (`grep -rn 'variant="opaque"' web/src/`) finds **4**: `GalleryView.vue:402`, `AdminFlaggedPanel.vue:265`, `AdminUserList.vue:461`, `GalleryCardModal.vue:72`. Execute against 4.

2. **`glass-scrubber` scoped CSS: no `.glass-scrubber` selectors found.** The A8-04 finding describes consumer-side `.glass-scrubber` CSS selectors that need migration. Source grep finds **zero** `.glass-scrubber` CSS selectors in all 7 files — the retint hooks already use fourier-local class names (`.basis-slider-track`, etc.) and `--slider-scrub-*` custom properties. The `--slider-scrub-*` token set is absent from 4.0 glass-ui source — these properties may have been retint-dead even at 3.1.0. The scoped CSS block audit (§6.3) must confirm whether these custom props produced any visual output before migrating to `--slider-range-bg`/`--slider-track-bg`.

3. **`useTextHighlight` subpath is `/motion-core`, NOT `/motion`.** M.md §4 (M.W1 row) cites `useTextHighlight→/motion`. Source verification: `useTextHighlight` lives in `composables/motion/core/` and is exported from `/motion-core` (`motion-core.js`). The keyframes-bearing `/motion` subpath does NOT export `useTextHighlight` — it exports `useSpring`, `useSpringMount`, `useSpringPress`, `useNumericTransition`, `useAnimatedNumber`. **Use `@mkbabb/glass-ui/motion-core` for `useTextHighlight` adoption at M.W8**.

4. **`--slider-scrub-*` tokens absent from glass-ui 4.0 source.** The audit description ("replace all consumer-side `.glass-scrubber` selectors with `.glass-slider` or `[data-variant="standard"]`") implies those selectors exist. They do not — the correct retint knobs for 4.0 `standard` Slider are `--slider-range-bg`, `--slider-track-bg`, `--slider-range-blur`, `--slider-range-shadow` (from `Slider.vue:203,225,232,238`).
