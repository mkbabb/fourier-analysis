# d-style-glassui — Glass-ui self-audit + fourier change-delta slice

**Audit class:** style-audit sub-agent (Glass-ui self + change-delta).
**Mode:** READ-ONLY. No edits, no commits.
**Date:** 2026-05-18.

## Preamble

- **Glass-ui:** `/Users/mkbabb/Programming/glass-ui` — v1.8.5, HEAD `7e2e385`
  (`merge(af-w1-glass-ui): AF W1 — four primitive edits for the speedtest design tranche`).
  Post-P shadow cohort: `9f774b4` (v1.8.4, P close) → `7e2e385` is 8 untagged commits;
  Q tranche opened 2026-05-18 (planning-only) on a fleet build-regression report.
- **Consumer:** `/Users/mkbabb/Programming/fourier-analysis/web`, HEAD `4df1a06`
  (`feat(p.w5-b): glass-ui CR-2 cross-walk`). Working tree DIRTY (in-flight refactor cluster).
- **Pin:** `"@mkbabb/glass-ui": "file:../../glass-ui"` (`web/package.json`) — picks up glass-ui HEAD live.
- **Method:** `rg`-verified per finding; glass-ui git log -40; tranches P/Q/AB/AB+1 cross-read;
  fourier git log -20 + post-CR-2 file-state verification.

---

## Part 1 — Glass-ui self-audit (drift grouped by axis)

Glass-ui's canon at v1.8.5 is **remarkably tidy**. The 7-axis sweep returns near-zero
structural drift — `transition: all` absent everywhere (`src/styles/` + `src/components/`),
zero hardcoded rgba/hex in component `<style>` blocks, 19 files bracket motion with
`prefers-reduced-motion`, `@supports not (backdrop-filter)` + `prefers-reduced-transparency`
+ `prefers-contrast` all present in `glass.css`. The findings below are the only residue.

### Axis 1 — Token alignment

| # | Site | Drift | Fix |
|---|---|---|---|
| S1 | `src/components/custom/configurator/ConfiguratorRow.vue:91` | `active:scale-[var(--scale-press,0.97)]` — hardcoded `0.97` fallback where the canonical token `--scale-press-sm` (`tokens.css:755`, value `0.97`) exists. Other components root the press scale through `--scale-press-btn`/`--scale-press-sm` with no literal fallback. | `active:scale-[var(--scale-press-sm)]` (or `--scale-press-btn`). LOW. |

### Axis 3 — Interactive consistency

| # | Site | Drift | Fix |
|---|---|---|---|
| S2 | `src/components/ui/toggle/index.ts:33` | The toggle `card` variant CVA root uses bare `active:scale-95` — a Tailwind literal — while the sibling `button/index.ts:9` roots press through `active:scale-[var(--scale-press-btn)]`. Two interactive primitives, two press-scale vocabularies. | Route through `--scale-press-*`. LOW — value 0.95 == `--scale-press-lg`; the literal is just un-tokened. |

### Axis 4 — Variant orthogonality & rooting

No `:deep()` against reka-ui internals. The 7 `:deep()` hits
(`GlassCarousel.vue` ×4, `ContinuousTimeline.vue` ×2 in comments, `MetricBadge.vue` ×1 comment)
are **self-component-scoped** (carousel reaches its own `.glass-carousel-item`) or
documentation prose — not a foreign-internal reach. CLEAN.

### Axis 5/6/7 — Overlay/motion, typography, accessibility

CLEAN. 25 `@keyframes` are all unique-purpose (skeleton shimmer, progress sweep,
scrolling-text pan, timeline dot-draw/pop) — no canon duplication. `glass.css` carries
the full degradation ladder. The AF.W1 `ContinuousTimeline` completion-tick
(`7e2e385`) correctly collapses to a drawn end-state under `prefers-reduced-motion`.

### Demo oracle

`demo/stories/` carries **77 raw `#rrggbb` literals** — but every one is an
intentional palette seed (`hero.vue:61-65` section-color anchors, `aurora/presets.ts`
OKLCH-with-hex-comment, `metaballs.vue` brand swatches). These are *data*, not styling
drift; the storybook vocabulary is internally consistent. No demo drift.

**Self-audit verdict:** glass-ui's canon does NOT meaningfully contradict itself.
Worst internal drift = the **press-scale vocabulary split** (S1+S2): three primitives
(`button`, `toggle`, `configurator-row`) express the same press affordance three ways —
`var(--scale-press-btn)`, literal `scale-95`, `var(--scale-press,0.97)`. Cosmetic, but it
is the one place the token ladder is not uniformly rooted.

---

## Part 2 — Change-delta audit

### 2(a) — Glass-ui APIs/tokens/components fourier should now use but isn't

| Surface | Shipped | fourier status | Call sites |
|---|---|---|---|
| `<Slider variant="glass-scrubber">` | glass-ui W3 Lane A (`df0e7e7`, v1.8.x) | **ADOPTED** ✅ | `SliderControl.vue:86`, `GlassTimeline.vue:67`, `ConvergenceTimeline.vue:70` |
| `useOptionalDockContext()` re-export on `/dock` | glass-ui W1 Lane B (`b27792c`) | **ADOPTED** (folded into scrubber substrate; injects retired) ✅ | was `SliderControl.vue:24`, `GlassTimeline.vue:12` |
| `useClipboard` (root barrel) | v1.4.0; bare `copyToClipboard` co-export v1.8.2 (`7c901b9`) | **ADOPTED** ✅ | `useMorphConfig.ts`, `EquationResult.vue`, `UserSlugBar.vue` |
| `AnimatedDigit` (`/animated-digit`, v1.6.0 `bb1f15b`) | shipped | **NOT adopted** ❌ — 0 hits | ~30 `fira-code` tabular sites; hot: `AnimationControls.vue` speed, `ConvergenceTimeline.vue:70` count, `FrequencyGraph.vue` amp/phase |
| `MetricRow` / `MetricStack` (`/metric-stack`, v1.6.0; AF.W1 `7e2e385` conjoined value+unit) | shipped | **NOT adopted** ❌ — 0 hits | `EqCoefficientsPanel.vue`, `CoefficientsPanel.vue`, `ConvergencePlot` readout clusters |
| `MetricCell` / `MetricBadge` / `MetricPill` (v1.7.0 `8dad58d`; AF.W1 `--metric-badge-label-weight` token) | shipped | **NOT adopted** ❌ — 0 hits | `InfoCard` energy-label pill, `EquationView` component pill |
| `ResponsiveTabs` (`/responsive-tabs`, v1.7.0) | shipped | NOT adopted (3× `UnderlineTabs` in spacious shells — LOW priority) | `VisualizationView`, `GalleryView`, `EquationView` |
| `StatusDot` (`/status-dot`) | shipped | NOT adopted | gallery tier filter, `EquationModeToggle` |
| `Skeleton` (`ui/skeleton`) | shipped | NOT adopted — bespoke shimmer rects | gallery card / paper article loading |

### 2(b) — fourier's migration progress against glass-ui's `@mkbabb/glass-ui/*` subpath surface

Glass-ui `package.json` exports **44 subpaths** (`.`, `/tokens`, `/styles`, `/dock`,
`/search`, `/sidebar`, `/tabs`, `/hover-popover`, `/infinite-scroll`, `/dark`, …).
fourier's 29 import sites:

| Subpath | fourier usage | Verdict |
|---|---|---|
| `@mkbabb/glass-ui` (root) | `TooltipProvider`, `Toaster`, `useToast`, `useClipboard`, `Slider`, `Collapsible*`, `HoverCard*`, gallery search | canonical ✅ |
| `@mkbabb/glass-ui/styles` | `src/style.css:3` | canonical ✅ |
| `@mkbabb/glass-ui/dock` | `GlassDock`, `DockIconButton` ×3 | canonical ✅ |
| `@mkbabb/glass-ui/tabs` | `UnderlineTabs` ×3 | canonical ✅ |
| `@mkbabb/glass-ui/hover-popover` | `HoverPopover` ×2 | canonical ✅ |
| `@mkbabb/glass-ui/infinite-scroll` | `InfiniteScroll` ×1 | canonical ✅ |
| `@mkbabb/glass-ui/dark` | `useGlobalDark` ×1 | canonical ✅ |
| `from "reka-ui"` direct | **0 hits** — `EquationView.vue:8` HoverCard drift RESOLVED at W5 Lane B (`HoverCard` now from root barrel) | ✅ |

**Migration verdict: SUBSTANTIALLY COMPLETE.** The v1.0 subpath migration
(`301a95e`) + CR-2 cross-walk (`4df1a06`) closed every structural carry: scrubber
substrate adopted at all 3 sites (562 → 421 LOC, the `glass-scrubber` variant + per-site
`--slider-scrub-*` retint in scoped CSS), `useClipboard` at all 3 sites, dock typed-context
restored (silent keep-open regression FIXED), reka-ui direct import eliminated. The
**only remaining gap is pure adoption** (AB+1/AF.W1 metric primitives — Part 2a) — no
broken contract, no shadow recipe. Grade: **A−** (was B+ pre-CR-2 in P11/b).

Q-tranche cross-repo note: Q's headline is a fleet build-regression from a
`keyframes.js` `dist/`-deletion desync. **fourier is INSULATED** — it pins
`@mkbabb/keyframes.js: ^2.0.0` from the npm registry (not `file:`), and its
`vite.config.ts:24-28` carries only the `@`→`src` self-alias (no hostile sibling-`dist`
alias). fourier should *not* need the Q invariant-30 resolver fix. Verify at Q build.

### 2(c) — GlassScrubber substrate proposal + CR-2 carry status

| Item | Origin | Status @ 2026-05-18 |
|---|---|---|
| **GlassScrubber substrate (P-5)** | `CONSTELLATION.md §1` + `P11-Lane-b §4` — 3 fourier shadow scrubbers, 562 LOC / 82% overlap | **CLOSED — WIRE (Option A).** glass-ui W3 Lane A added `<Slider variant="glass-scrubber">` (3-layer track + thin-bar thumb + halo + dock keep-open); 8 opt-in `--slider-scrub-*` fallback tokens, **no `tokens.css` additions**. fourier W5 Lane B migrated all 3 sites (`SliderControl`/`GlassTimeline`/`ConvergenceTimeline`). Verified: `variant="glass-scrubber"` live at all 3. |
| **CR-2 dock typed-context** | `CONSTELLATION.md §5` O-carry — 2 silent string-key injects (`"dockKeepOpen"`/`"dockRelease"`) no-op'd since O.W2 retired the legacy provides; functional regression (idle-collapse mid-scrub) | **CLOSED.** Folded into the scrubber substrate — `<Slider>` acquires `DockContext` internally via `useOptionalDockContext()`; the 2 injects + 4 callsites deleted. Keep-open contract restored bidirectionally (`data-held` reflection). 0 `inject(`/`dockKeepOpen` callsites remain. |
| **CR-2 useClipboard** | `P11-Lane-b §3` — 3 inline `navigator.clipboard` parallels | **CLOSED.** W5 Lane B migrated all 3 to `useClipboard({ resetMs })`. |
| **CR-2 reka-ui HoverCard** | `P11-Lane-b §6` — `EquationView.vue:8` direct `reka-ui` import | **CLOSED.** Now `HoverCard`/`HoverCardTrigger`/`HoverCardContent` from `@mkbabb/glass-ui`; `HoverCardPortal` dropped (glass-ui `HoverCardContent` portals internally). |

**CR-2 lane: fully discharged.** The entire fourier carry-ledger from
`CONSTELLATION.md §5` (CR-2) is closed at commit `4df1a06`.

---

## Part 3 — Glass-ui gaps (additions warranted by the fourier consumer)

The CR-2 walk consumed every *structural* gap. Remaining gaps are **adoption-shaped**,
not API-shaped — fourier has not yet wired the AB+1/AF.W1 metric primitives, but the
primitives exist and are subpath-published. No new glass-ui API is forced by fourier at
this revision. Two soft observations:

| # | Observation | Placement | Severity |
|---|---|---|---|
| G1 | fourier hand-rolls ~30 `fira-code` tabular-number readouts (`AnimationControls`, `ConvergenceTimeline`, `FrequencyGraph`, `EqCoefficientsPanel`, `CoefficientsPanel`). glass-ui's `AnimatedDigit` is the exact register. This is *consumer adoption debt*, not a library gap — `AnimatedDigit` ships at `/animated-digit`. | consumer-side wire (no glass-ui edit) | MED — clean register win |
| G2 | fourier's local `web/src/components/ui/` retains `CollapsibleSection.vue` (wraps glass-ui `Collapsible*`) + `tooltip/Tooltip.vue` (wraps glass-ui `Tooltip*`) + `SliderControl.vue` (wraps `Slider`). All three are *thin domain wrappers* adding labels/numeric-input chassis — legitimate, not reinvention. `SliderControl` no longer duplicates the scrub recipe. No glass-ui action. | n/a | INFO — wrappers justified |

**No gap clears the bar** (token hardcoded ≥3 sites / reinvented CVA branch /
slot-prop forcing `:deep()` / ≥3× widget / duplicated composable) for a new glass-ui
addition. The fourier consumer is, at this revision, a *clean* consumer of the
v1.8.5 surface.

---

## Part 4 — Union candidates

| Candidate | Repos affected | Rationale |
|---|---|---|
| **Press-scale vocabulary unification** | glass-ui (self) | S1+S2 — `button` uses `--scale-press-btn`, `toggle` uses literal `scale-95`, `configurator-row` uses `var(--scale-press,0.97)`. A 2-line glass-ui self-fix routing all three through the `--scale-press-*` ladder. Cross-repo only in that it tidies the canon every consumer inherits. |
| **AnimatedDigit adoption cohort** | fourier + (per CONSTELLATION) speedtest/value.js | ~30 tabular readouts at fourier alone; speedtest's AC tranche drove the primitive. A constellation-wide "tabular readout → AnimatedDigit" sweep is a natural union wave. |

---

## Tally

Glass-ui self-audit: **2 cosmetic token-rooting findings** (S1, S2 — press-scale split),
zero structural drift, demo oracle clean. Fourier change-delta: **CR-2 lane fully
discharged** (4/4 carries closed at `4df1a06`), GlassScrubber WIRED at all 3 sites,
subpath migration substantially complete (A−); **only residue is AB+1/AF.W1 metric-primitive
adoption debt** (~9–12 sites, AnimatedDigit-first); fourier insulated from the Q build
regression. **0 new glass-ui APIs warranted by the fourier consumer.**
