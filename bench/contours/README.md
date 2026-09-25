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
reference outline green; the N=100 epicycle trace on the right) and
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

**The bar** is `BAR` in `harness.py`; each row of `metrics.json` carries its
`bar_failures`. Metrics are necessary, not sufficient: the three-judge panel and
the portrait landmark checklist (F.CT) sit on top.
