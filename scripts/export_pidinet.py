#!/usr/bin/env python3
"""Export PiDiNet-tiny to ONNX for use as a learned edge detector.

Requires torch and the pidinet source (clone https://github.com/hellozhuo/pidinet).
This is a one-time dev script — the runtime uses only onnxruntime.

Usage:
    pip install torch  # dev dependency only
    git clone https://github.com/hellozhuo/pidinet /tmp/pidinet
    # Download table5_pidinet-tiny.pth from the pidinet releases
    python scripts/export_pidinet.py --weights /tmp/table5_pidinet-tiny.pth --output pidinet-tiny.onnx
"""

from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Export PiDiNet-tiny to ONNX")
    parser.add_argument("--weights", required=True, help="Path to table5_pidinet-tiny.pth")
    parser.add_argument("--output", default="pidinet-tiny.onnx", help="Output ONNX path")
    parser.add_argument("--pidinet-repo", default="/tmp/pidinet", help="Path to cloned pidinet repo")
    args = parser.parse_args()

    weights_path = Path(args.weights)
    if not weights_path.exists():
        print(f"Weights not found: {weights_path}")
        return 1

    # Add pidinet repo to path so we can import the model.
    sys.path.insert(0, args.pidinet_repo)

    try:
        import torch
    except ImportError:
        print("torch is required for export. Install with: pip install torch")
        return 1

    try:
        from models import pidinet  # type: ignore[import]
    except ImportError:
        print(f"Could not import pidinet models from {args.pidinet_repo}")
        print("Clone the repo: git clone https://github.com/hellozhuo/pidinet /tmp/pidinet")
        return 1

    model = pidinet(config="tiny")
    state = torch.load(weights_path, map_location="cpu")
    if "state_dict" in state:
        state = state["state_dict"]
    model.load_state_dict(state)
    model.eval()

    dummy_input = torch.randn(1, 3, 512, 512)
    output_path = Path(args.output)

    torch.onnx.export(
        model,
        dummy_input,
        str(output_path),
        opset_version=11,
        input_names=["input"],
        output_names=["edge_map"],
        dynamic_axes={"input": {2: "height", 3: "width"}, "edge_map": {2: "height", 3: "width"}},
    )

    sha = hashlib.sha256(output_path.read_bytes()).hexdigest()
    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"Exported: {output_path} ({size_mb:.1f} MB)")
    print(f"SHA-256:  {sha}")
    print(f"\nUpdate _PIDINET_SHA256 in ml.py with: {sha}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
