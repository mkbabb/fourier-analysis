"""Memory probe (F.REL ``.mem``/``.mem2``, COHESION §0ew, §0ey): peak RSS of the production
contour pipeline, per model and per default extraction, on every harness image.

```sh
unset VIRTUAL_ENV
uv run python -m bench.contours.memory --tag mem-after            # probe + masks
uv run python -m bench.contours.memory --iou mem-before mem-after  # mask agreement
```

Each stage runs in a fresh child process, so its ``ru_maxrss`` is that stage's
own peak and nothing an earlier image left behind is charged to it:

- ``extraction``: one default extraction exactly as the API's extract route
  runs it (``harness.run_pipeline``: ``ContourSettings()`` defaults).
- ``model:<name>``: one model alone, its session opened as production opens it
  (``ml._open_session``) and one inference on the image at that model's input.
- ``server``: every image's extraction in ONE process, as the long-lived API
  serves them; its peak catches what the extractions accumulate.

Every row records the child's peak RSS (MB), its RSS once the model(s) were
loaded where that is separable, its wall time and the 1-minute load average at
start and end.  The bar is ``PEAK_MB``.

``--masks`` (on by default) saves each image's subject masks: ``ensemble``
(``isolation.subject_mask``, the saliency models' mask) and ``subject`` (the
mask the drawing is drawn on: the ensemble mask through the face and person
parsers, ``parts.part_labels``).  ``--iou A B`` compares two tags' masks: the
quality gate is the ``subject`` IoU, mean >= ``IOU_MEAN`` and min >= ``IOU_MIN``.

PRIVACY: as ``harness``: the private sample's rows and masks stay under
``~/.fourier-samples/``.
"""

from __future__ import annotations

import argparse
import json
import os
import resource
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image

from bench.contours.harness import PRIVATE_ROOT, guard_private_path, image_set

PEAK_MB = 1.6 * 1024  # COHESION §0ew: <= 1.6 GB per default extraction
IOU_MEAN = 0.97
IOU_MIN = 0.93
CHILD_TIMEOUT_S = 3600


def _peak_mb() -> float:
    """This process's peak RSS in MB (``ru_maxrss`` is bytes on macOS, KiB on Linux)."""
    peak = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    return peak / 2**20 if sys.platform == "darwin" else peak / 2**10


def _load() -> float:
    return round(os.getloadavg()[0], 2)


# ---------------------------------------------------------------------------
# Stages (each run in a fresh child process)
# ---------------------------------------------------------------------------


def onnx_models() -> tuple:
    """Every ONNX model a default extraction runs, in the order it runs them."""
    from fourier_analysis.contours.lines import LINE_MODEL
    from fourier_analysis.contours.ml import SUBJECT_MODELS
    from fourier_analysis.contours.parts import FACE_DETECTOR, FACE_PARSER

    return (*SUBJECT_MODELS, FACE_DETECTOR, FACE_PARSER, LINE_MODEL)


def stage_names() -> list[str]:
    from fourier_analysis.contours.person import PERSON_PARSER

    return ["extraction", *(f"model:{s.name}" for s in (*onnx_models(), PERSON_PARSER))]


def _loaded_image(path: Path):
    from bench.contours.harness import api_settings
    from fourier_analysis.contours.extraction import load_image_inputs

    config = api_settings().to_contour_config().normalized()
    return load_image_inputs(path, config), config


def _run_model(name: str, path: Path) -> dict:
    """One model alone: its session opened as production opens it, one inference."""
    from fourier_analysis.contours.ml import _open_session, _source_rgb, model_input
    from fourier_analysis.contours.person import PERSON_PARSER, load_person_session, person_probability

    image, _ = _loaded_image(path)
    rgb = _source_rgb(image)
    base = _peak_mb()
    if name == PERSON_PARSER.name:
        load_person_session()
        loaded = _peak_mb()
        person_probability(rgb, image.grayscale.shape)
    else:
        spec = next(s for s in onnx_models() if s.name == name)
        session = _open_session(spec)
        loaded = _peak_mb()
        session.run(None, {session.get_inputs()[0].name: model_input(spec, rgb)})
    return {"base_mb": round(base, 1), "loaded_mb": round(loaded, 1)}


def _run_extraction(path: Path) -> dict:
    from bench.contours.harness import run_pipeline

    base = _peak_mb()
    run = run_pipeline(path)
    return {"base_mb": round(base, 1), "contours": len(run.contours)}


def _save_masks(path: Path, out: Path) -> dict:
    """The image's ``ensemble`` and ``subject`` masks (module docstring)."""
    from fourier_analysis.contours.isolation import subject_mask
    from fourier_analysis.contours.parts import part_labels

    image, config = _loaded_image(path)
    mask, _ = subject_mask(image, config)
    subject = part_labels(image, mask).subject if mask.any() else mask
    out.mkdir(parents=True, exist_ok=True)
    for kind, m in (("ensemble", mask), ("subject", subject)):
        Image.fromarray(np.asarray(m, np.uint8) * 255).save(out / f"{kind}.png")
    return {"ensemble_px": int(mask.sum()), "subject_px": int(subject.sum())}


def child(stage: str, path: Path, mask_out: Path | None) -> None:
    """The child process: run one stage, print its row as one JSON line."""
    row: dict = {"stage": stage, "load_start": _load()}
    t0 = time.perf_counter()
    if stage == "extraction":
        row |= _run_extraction(path)
    elif stage == "masks":
        assert mask_out is not None
        row |= _save_masks(path, mask_out)
    else:
        row |= _run_model(stage.removeprefix("model:"), path)
    row |= {
        "peak_mb": round(_peak_mb(), 1),
        "seconds": round(time.perf_counter() - t0, 2),
        "load_end": _load(),
    }
    print("ROW " + json.dumps(row), flush=True)


def _server(paths: list[Path]) -> None:
    """``server``: every image's extraction in one process (module docstring)."""
    from bench.contours.harness import run_pipeline

    t0, load_start = time.perf_counter(), _load()
    peaks = []
    for p in paths:
        run_pipeline(p)
        peaks.append(round(_peak_mb(), 1))
    row = {
        "stage": "server", "peaks_mb": peaks, "peak_mb": max(peaks),
        "seconds": round(time.perf_counter() - t0, 2), "load_start": load_start, "load_end": _load(),
    }
    print("ROW " + json.dumps(row), flush=True)


# ---------------------------------------------------------------------------
# Parent: the sweep, the bar, the mask agreement
# ---------------------------------------------------------------------------


def _spawn(args: list[str]) -> dict:
    cmd = [sys.executable, "-m", "bench.contours.memory", *args]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=CHILD_TIMEOUT_S)
    rows = [ln[4:] for ln in proc.stdout.splitlines() if ln.startswith("ROW ")]
    if proc.returncode != 0 or not rows:
        tail = (proc.stderr or proc.stdout).strip().splitlines()[-3:]
        return {"error": f"exit {proc.returncode}", "tail": tail}
    return json.loads(rows[-1])


def sweep(
    out_dir: Path, only: list[str] | None, include_private: bool,
    masks: bool, server: bool, stages: list[str] | None = None,
) -> dict:
    images = image_set(include_private)
    if only:
        images = [i for i in images if any(o in i.name for o in only)]
    if any(i.private for i in images):
        guard_private_path(out_dir, True)
    out_dir.mkdir(parents=True, exist_ok=True)
    names = stage_names()
    stages = names if stages is None else [n for n in names if any(f in n for f in stages)]
    rows: list[dict] = []
    mask_rows: list[dict] = []
    for img in images:
        for stage in stages:
            row = {"image": img.name} | _spawn(["--child", stage, str(img.path)])
            rows.append(row)
            print(json.dumps(row), flush=True)
        if masks:
            row = {"image": img.name} | _spawn(
                ["--child", "masks", str(img.path), "--mask-out", str(out_dir / "masks" / img.name)]
            )
            mask_rows.append(row)
            print(json.dumps(row), flush=True)
    if server:
        row = {"image": "*"} | _spawn(["--server", *(str(i.path) for i in images)])
        rows.append(row)
        print(json.dumps(row), flush=True)
    failures = [
        f"{r['image']} {r.get('stage', '?')} " + (r["error"] if "error" in r else f"{r['peak_mb']} MB")
        for r in rows
        if "error" in r or r["peak_mb"] > PEAK_MB
    ] + [f"{r['image']} masks {r['error']}" for r in mask_rows if "error" in r]
    peak = max((r["peak_mb"] for r in rows if "peak_mb" in r), default=0.0)
    report = {
        "bar_mb": PEAK_MB, "peak_mb": peak, "failures": failures,
        "pass": not failures, "images": len(images), "stages": stages, "rows": rows,
        "masks": mask_rows,
    }
    (out_dir / "memory.json").write_text(json.dumps(report, indent=2))
    return report


def _iou(a: np.ndarray, b: np.ndarray) -> float:
    union = np.count_nonzero(a | b)
    return 1.0 if union == 0 else np.count_nonzero(a & b) / union


def mask_agreement(root: Path, before: str, after: str) -> dict:
    """Each image's ``ensemble`` and ``subject`` IoU, ``after`` against ``before``."""
    rows = []
    for d in sorted((root / before / "masks").iterdir()):
        other = root / after / "masks" / d.name
        if not other.is_dir():
            continue
        row: dict = {"image": d.name}
        for kind in ("ensemble", "subject"):
            a = np.asarray(Image.open(d / f"{kind}.png")) > 0
            b = np.asarray(Image.open(other / f"{kind}.png")) > 0
            row[kind] = round(float(_iou(a, b)), 4)
        rows.append(row)
    out: dict = {"before": before, "after": after, "rows": rows}
    for kind in ("ensemble", "subject"):
        vals = [r[kind] for r in rows]
        out[kind] = {"mean": round(float(np.mean(vals)), 4), "min": round(float(min(vals)), 4)} if vals else None
    s = out["subject"]
    out["pass"] = bool(s and s["mean"] >= IOU_MEAN and s["min"] >= IOU_MIN)
    (root / after / f"iou-vs-{before}.json").write_text(json.dumps(out, indent=2))
    return out


def main() -> None:
    ap = argparse.ArgumentParser(prog="bench.contours.memory")
    ap.add_argument("--out", type=Path, default=PRIVATE_ROOT / "evidence")
    ap.add_argument("--tag")
    ap.add_argument("--only", nargs="*", help="substring filter on image names")
    ap.add_argument("--no-private", action="store_true", help="public set only")
    ap.add_argument("--no-masks", action="store_true")
    ap.add_argument("--no-server", action="store_true")
    ap.add_argument("--stages", nargs="*", help="substring filter on stage names (none given: masks only)")
    ap.add_argument("--iou", nargs=2, metavar=("BEFORE", "AFTER"))
    ap.add_argument("--child", nargs=2, metavar=("STAGE", "IMAGE"), help=argparse.SUPPRESS)
    ap.add_argument("--mask-out", type=Path, help=argparse.SUPPRESS)
    ap.add_argument("--server", nargs="+", type=Path, help=argparse.SUPPRESS)
    args = ap.parse_args()
    root = args.out.expanduser()

    if args.child:
        return child(args.child[0], Path(args.child[1]), args.mask_out)
    if args.server:
        return _server(args.server)
    if args.iou:
        out = mask_agreement(root, *args.iou)
        for r in out["rows"]:
            print(f"{r['image']:<34} ensemble {r['ensemble']:.4f}  subject {r['subject']:.4f}")
        print(f"ensemble {out['ensemble']}  subject {out['subject']}  pass {out['pass']}")
        return
    if not args.tag:
        ap.error("--tag is required for a sweep")
    report = sweep(
        root / args.tag, args.only, not args.no_private,
        masks=not args.no_masks, server=not args.no_server, stages=args.stages,
    )
    print(f"peak {report['peak_mb']} MB (bar {PEAK_MB:.0f})  failures {len(report['failures'])}  pass {report['pass']}")
    for f in report["failures"]:
        print("  FAIL", f)


if __name__ == "__main__":
    main()
