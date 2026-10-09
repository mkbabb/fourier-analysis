# Contour-quality bench (F.CT)

Runs the production contour pipeline the way the API's extract route does
(`ContourSettings()` → `extract_contours` → `build_contour_tour` →
`resample_arc_length(path, 1024)`), scores it against a reference subject mask,
and draws an overlay per image.

```sh
unset VIRTUAL_ENV
uv run python -m bench.contours --out ~/.fourier-samples/evidence --tag baseline
```

Output: `<out>/<tag>/<name>.png` (the tour over the dimmed image, jumps red,
reference outline green; the N=50, N=100 and N=200 epicycle traces to the right) and
`<out>/<tag>/metrics.json`. Flags: `--only NAME…`, `--no-private`,
`--no-overlays`, `--write-references`.

Image set: the private sample `~/.fourier-samples/daraksha.jpeg` (skipped when
absent) plus `assets/portraits/*` and `assets/animals/*`.

**Privacy.** The private sample and every derivative (overlay, reference mask,
metrics) stay under `~/.fourier-samples/`; the harness refuses to write them
anywhere else. Records cite it as `PRIVATE-SAMPLE`, numbers only. Evidence is
never committed.

**References.** `reference/*.png` are the ISNet (general-use) subject masks,
refined (alpha-intersected, opened, main components, holes filled) at pipeline
resolution, each checked by eye. ISNet is deliberately stronger than the
pipeline's own U2-Net-lite, so the pipeline is not graded against itself.

When the eye-check finds a part ISNet missed, the reference is corrected, never
the pipeline fitted to it. One reference is corrected so far:
`animals-sun.png` (F.CT3, COHESION §0eu point 4). The derivation reproduces the
old mask byte-for-byte, and ISNet scores the upper-right ray about 0.2, so
re-deriving it cannot restore the ray. The image is flat colour on a flat
background, so the eye-check is made measurable. The background is the
border-connected region within CIELAB ΔE 15 of the border's median colour. The
regions outside it that the ISNet mask misses are opened by the derivation's
own structuring element, and only those that hold a disc of the harness's
boundary tolerance (1% of the diagonal) are added. Thinner rim slivers fall
inside the band the harness already forgives. The result is +14,455 px (the
ray), with 0 px removed.

**The bar** is `BAR` in `harness.py`; each row of `metrics.json` carries its
`bar_failures`. Metrics are necessary, not sufficient: the three-judge panel and
the portrait landmark checklist (F.CT) sit on top.
