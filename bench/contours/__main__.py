"""CLI: ``uv run python -m bench.contours --out ~/.fourier-samples/evidence --tag baseline``.

Writes ``<out>/<tag>/<name>.png`` overlays and ``<out>/<tag>/metrics.json``.
When the private sample is included, ``--out`` must lie under ~/.fourier-samples/.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from bench.contours.harness import (
    PRIVATE_ROOT,
    derive_reference_mask,
    format_table,
    image_set,
    run_bench,
    save_reference,
)


def main() -> None:
    ap = argparse.ArgumentParser(prog="bench.contours")
    ap.add_argument("--out", type=Path, default=PRIVATE_ROOT / "evidence")
    ap.add_argument("--tag", required=True)
    ap.add_argument("--only", nargs="*", help="substring filter on image names")
    ap.add_argument("--no-private", action="store_true", help="public set only")
    ap.add_argument("--no-overlays", action="store_true")
    ap.add_argument(
        "--write-references",
        action="store_true",
        help="derive and save reference masks (check each by eye before committing)",
    )
    args = ap.parse_args()

    if args.write_references:
        for img in image_set(not args.no_private):
            if args.only and not any(o in img.name for o in args.only):
                continue
            print("reference", img.name, save_reference(img, derive_reference_mask(img.path)))
        return

    results = run_bench(
        args.out, args.tag, include_private=not args.no_private,
        only=args.only, overlays=not args.no_overlays,
    )
    print(format_table(results))
    print(f"\nwritten: {(args.out.expanduser() / args.tag).resolve()}")


if __name__ == "__main__":
    main()
