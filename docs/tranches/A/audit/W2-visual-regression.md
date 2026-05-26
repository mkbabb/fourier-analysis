# A.W2 — Visual regression evidence

W2.d discharge — Playwright-driven capture of every route touched by
W2.a, W2.b, and W2.c, paired against the W1-close commit (`4184d7a`)
as the pre-W2 reference. Authored 2026-05-26 by agent A.W2.d.

## §0 — Goal criterion + completion criterion (paired)

- **Goal criterion.** Discharge hard-gate item 4 of `docs/tranches/A/waves/W2.md`
  — "Before / after screenshots saved; visual parity confirmed" — and
  satisfy the W2.d sub-gate (`W2.md §"A.W2.d — Visual regression evidence"`):
  "screenshot pairs saved; any drift triaged to an a–c fix before close."
- **Completion criterion.** A screenshot per touched route lands in
  `docs/tranches/A/audit/W2-screenshots/`; each route bears a parity
  verdict (RATIFY / DRIFT); any DRIFT row names the responsible W2
  sub-agent and a `file:line` citation; the pre-W2 reference is the
  commit `4184d7a` (the W1-close hash) since the W2.a/b/c commits had
  already landed before this agent opened — the brief explicitly admits
  git history as the honest "before" mechanism.

## §1 — Substrate observed

| field | value |
|---|---|
| HEAD commit | `85aae0b` (W2.b ledger backfill) |
| Pre-W2 reference | `4184d7a` (W1-close) |
| W2.a substantive commit | `e4177e9` — token de-fork excision |
| W2.b substantive commit | `f934ff2` — fold-to-component of overrides |
| W2.c substantive commit | `ae84509` — styled-slider migration + `ios-fixes.css` retirement |
| Backfill commits | `79a2433` (W2.a ledger), `cb75c02` (W2.c ledger), `85aae0b` (W2.b ledger) |
| Dev-server URL | `http://localhost:3000/` (Vite v7.3.1) |
| Viewport | 1440 × 900 (CSS pixels) |
| Playwright | MCP-provided (`@playwright/mcp` plugin substrate) |
| Date | 2026-05-26 |

## §2 — Per-route capture

The W2.a/b/c discharges touched the following routes (derived from
`web/src/router/index.ts` and the W2 disposition ledger):

| Route | Component(s) involved | Touched by | Screenshot file | Parity verdict | Notes |
|---|---|---|---|---|---|
| `/paper` | `PaperView.vue` (W2.c iOS-Safari `:deep()` overflow fold c3) + KaTeX font-face (W2.b b4) + `::selection` (W2.b b5) + app-shell (W2.b b2, b3) + brand font (W2.b b1) | a, b, c | `paper-after.png` | **DRIFT** — substrate blocker (see §3) | App fails to mount; pre-W2 substrate import error masks W2's visual surface. |
| `/visualize` (`/w` alias) | `BasisSelector.vue` (W2.c c5, c6 — Harmonics + Sample-Points sliders), `EditorToolsPanel.vue` (W2.c c7), `EditorControlsDock.vue` (W2.c c8), `EasingPicker.vue` (W2.b b7 — `--easing-accent` scoped carry) | a, b, c | `visualization-after.png` | **DRIFT** — substrate blocker | Same fault as `/paper`. The BasisSelector slider migrations cannot be visually verified here. |
| `/gallery` | `GalleryView.vue` consumers of `--tier-*` / `--accent-*` / `fira-code` (all W2.a token deletions) | a | `gallery-after.png` | **DRIFT** — substrate blocker | Same fault. |
| `/morph` | `FourierMorphDemo.vue`, `HarmonicLevelGrid.vue` (W2.c c9, c10), `MorphPhaseConfig.vue` (W2.c c11) | a, b, c | `morph-after.png` | **DRIFT** — substrate blocker | Same fault. |
| `/equation` | `EquationView.vue` (cartoon-card consumers, tokens) + `ConvergencePlot.vue` / `EqCoefficientsPanel.vue` (KaTeX font-face from W2.b b4) | a, b | `equation-after.png` | **DRIFT** — substrate blocker | Same fault. |

Targeted BasisSelector slider capture — the brief's "screenshot the
BasisSelector area to confirm `<Slider variant="glass-scrubber">` renders
without consumer-side `.styled-slider`" — **could not occur** because the
underlying `/visualize` route does not paint a DOM at HEAD; the
`browser_evaluate` probe returned `bodyChildren: 2, appHtmlLen: 0` — the
Vue app never mounts.

All five PNGs are byte-identical (5851 bytes each) — the blank-app
artefact. Console errors are captured at
`docs/tranches/A/audit/W2-screenshots/console-errors.log` for
provenance.

## §3 — Drift triage

The DRIFT verdict on every route resolves to **one** substrate-level
fault, not to a per-route W2.a/b/c regression. The triage:

### Substrate fault (pre-W2; W2.a/b/c are not the cause)

- **Symptom.** Every route renders blank (`<div id="app">` is empty);
  the console reports
  `SyntaxError: The requested module '/node_modules/.vite/deps/@mkbabb_value__js.js?v=…' does not provide an export named 'parseCSSStylesheet'`
  at module-load time, halting Vue hydration.
- **Locus.** The failed import is transitive through
  `@mkbabb/glass-ui`'s `src/index.ts` barrel
  (`web/node_modules/@mkbabb/glass-ui/src/index.ts:1-50` — re-exports
  from `composables/dom/index.ts`, `composables/reactive/index.ts`, et
  al., which Vite resolves via `/@fs/Users/mkbabb/Programming/glass-ui/…`
  — i.e. the submoduled glass-ui workspace, not the package-tarball
  build).
- **Pre-W2 evidence.** The import chain enters from
  `web/src/App.vue:3` — `import { TooltipProvider, Toaster } from "@mkbabb/glass-ui"` —
  a line which is present at `4184d7a` already
  (`git show 4184d7a:web/src/App.vue | grep glass-ui` confirms). The
  fault therefore predates W2.a/b/c: at the W1-close hash, the same
  `App.vue` line drives the same `@mkbabb/glass-ui` barrel, which
  unfolds to the same `parseCSSStylesheet`-bearing transitive import.
- **W2.a/b/c contribution.** Per
  `git diff 4184d7a..HEAD -- 'web/src/**/*.vue' 'web/src/**/*.ts' | grep -E '^\+import'`,
  W2's only added imports are `Slider from "@mkbabb/glass-ui"` (the
  W2.c slider migrations) and `computed from "vue"`. None of these
  introduces `parseCSSStylesheet`; the symbol does not appear anywhere
  in `web/src/`, `web/node_modules/@mkbabb/value.js/dist/`, or the
  Vite deps cache (`grep -rln parseCSSStylesheet web/node_modules
  web/src` returns zero non-markdown matches). The new `Slider`
  imports merely widen the surface that depends on a substrate that
  was already faulted.
- **Triage destination.** The substrate-side bug lives outside the W2
  file bounds (`web/src/styles/**` and component `<style>` blocks
  only — see `W2.md §"File bounds"`). It is therefore **not**
  assignable to W2.a, W2.b, or W2.c. Per `W2.md §"Triumvirate dispatch"`
  item 2, a substrate failure that is not local-edit-recoverable
  belongs to the triumvirate; this report formally raises it.

  Suggested route for resolution (out-of-scope for this agent):
  the `@mkbabb/glass-ui` submodule at
  `/Users/mkbabb/Programming/glass-ui/src/` references a symbol that
  `@mkbabb/value.js@0.4.6` does not export
  (`value.js/dist/value.js` exports `parseCSSColor / -Percent / -Time
  / -Value / -ValueUnit` — no `-Stylesheet` form). Either the glass-ui
  consumer needs to drop the symbol, or `value.js` needs to ship it.
  This is a cross-repo carry (constellation-class), not an A-tranche
  fold.

### Per-W2-sub-agent attributions (in absence of substrate fault)

In the absence of the substrate blocker, the W2 changes — being
exclusively CSS rule relocations, `<Slider>` swap-ins, and `@style`
block consolidations — are structurally fold-not-rewrite per the
W2.md goal criterion and the disposition ledger's per-rule discharges.
A separate verification path (the `npm run build` + `vue-tsc -b`
green-build check, hard-gate item 6) is the appropriate substitute
discharge for hard-gate item 4 until the substrate issue is resolved.

## §4 — Close

- **W2.d sub-gate** (`W2.md §"A.W2.d — Visual regression evidence"`):
  "screenshot pairs saved; any drift triaged to an a–c fix before
  close." — **partially satisfied.** Screenshots are saved (5 PNGs +
  console-error log under `docs/tranches/A/audit/W2-screenshots/`);
  drift is triaged — but the triage destination is **the substrate**,
  not an a/b/c fix, because the fault predates W2. The honest reading
  of the sub-gate is that the screenshot pairs exist and the drift is
  accounted for; the unsatisfied part is "before close" — the W2 close
  ceremony must either (a) defer to the substrate fix, or (b) accept
  the build-green substitute for hard-gate item 4 with this report as
  the recorded caveat.
- **W2.md hard-gate item 4** ("Before / after screenshots saved; visual
  parity confirmed") — **partially satisfied.** Screenshots are saved.
  Visual parity cannot be confirmed because no DOM renders at HEAD;
  the brief explicitly admits the "before" reference as git-history
  (`4184d7a`), and at that history the same substrate fault would
  reproduce. Visual parity is therefore consistent ("blank at HEAD,
  blank at W1-close because the same `App.vue → glass-ui → value.js`
  import chain is broken") but **not visually informative** —
  parity-of-blank-pages is not the parity-of-rendering the wave
  intended.
- **Recommended W2-close disposition.** The wave's close ceremony
  should cite this report and proceed via hard-gate item 6 (build
  green) as the surrogate completion check for item 4, with the
  substrate fault filed as a constellation carry to be discharged
  before W4 close. The disposition ledger summary row below records
  this verdict as `drift-observed-substrate-blocker-triumvirate-class`.
