# J — π visual-runtime lane evidence (every-page paired before/after)

Pursuant to the screenshots edict (precept `instructions/tranche/SPEC.md §"The π
visual-runtime lane" → "Before/after capture — every page, paired, scripted"`,
precepts commit `8ccf9f4`, synced into fourier 2026-06-04): a tranche that
modifies any app surface captures a **paired BEFORE/AFTER baseline of EVERY page**
at **≥3 viewports** (mobile 375×667, laptop 1280×800, desktop 1440×900) via a
**single checked-in harness** that re-runs identically at open and close, with a
per-page `DELTA.md` asserting **no unintended regression** (occlusion / overlap /
clipping, contrast, layout-shift). It doubles as the **occlusion gate** (zero
element overflowing the viewport; zero dock-over-content overlap per page×viewport).

## The harness

`web/e2e/visual-baseline.spec.ts` — the re-runnable Playwright capture. It sweeps
every route × the 3 viewports and writes to `before/` or `after/` per the
`VISUAL_MODE` env (`before` = tranche-open HEAD; `after` = integration HEAD), and
runs the occlusion assertions. Run it via:

```
VISUAL_MODE=before npx playwright test visual-baseline.spec.ts   # at W0/W1 (open)
VISUAL_MODE=after  npx playwright test visual-baseline.spec.ts   # at W8 (close)
```

(needs the local stack — `scripts/dev.sh up` — booted; the e2e config boots its own
backend + vite when run under CI, mirroring `web/e2e/`.)

## Pages swept (the J affected-page set + every route, per the edict's "EVERY page")

`/` · `/paper` · `/gallery` · `/equation` · `/morph` · `/v/<seed-slug>`
(visualization) · `/w` (workspace) · `/demo/shape-extractor`.

The CORE-affected surfaces (the WC W5 + the CORE consumers) are the gallery grid
(W4 `content-visibility` + W5 layout), the **configurator (DEC-2: controls move
LEFT at W5)**, the diff-viewer, and the publish/visibility UI — but the edict
requires EVERY page, not a sample, so the unchanged routes (`/paper`, `/equation`)
are captured too as the "must be pixel-stable" regression guard.

## Status (2026-06-04, J open)

- `before/_seed-workspace-configurator.png` — the pre-existing P5-defect capture
  (the squared `ConfiguratorLayer` inner-section rounding), **archived not deleted**
  (gap1 fix — it was a gitignored root scratch PNG; the blanket `*.png` ignore is
  now negated for `docs/**/*.png` so π evidence is committable).
- The full harness-produced `before/` baseline is captured at J-open (this turn);
  `after/` + `DELTA.md` land at J.W8 close (against the integration HEAD, after the
  DEC-2 controls-LEFT flip + the W5 WC refinement). Per the edict the BEFORE is the
  pre-WC state — controls still RIGHT — so the DEC-2 LEFT flip is a *named intended
  change* in the close DELTA, not an unintended regression.

## Tooling-contingency

If browser automation is unavailable at a close, the lane runs at the
**build-verification floor** (builds + typechecks + dev-server-boots-clean) and the
wave-spec records the contingency + inherits a re-probe obligation (precept §π).
