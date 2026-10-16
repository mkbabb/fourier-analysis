# /// script
# requires-python = ">=3.11,<3.13"
# dependencies = [
#   "torch==2.5.1",
#   "torchvision==0.20.1",
#   "onnx==1.17.0",
#   "onnxruntime==1.20.1",
#   "transformers==4.46.3",
#   "huggingface-hub==0.26.5",
#   "safetensors==0.4.5",
#   "timm==1.0.12",
#   "kornia==0.7.4",
#   "einops==0.8.0",
#   "numpy<2",
# ]
# ///
"""Export BiRefNet-lite to ONNX at a bounded, static input size.

Every published BiRefNet-lite ONNX is static at 1024x1024, where one inference
peaks at about 5.5 GB: past the API's ``memory: 2G`` (F.REL ``.mem2``, COHESION
§0ey).  This script produces the bounded export the subject ensemble pins
(``fourier_analysis.contours.ml.BIREFNET_LITE``) from the official weights:

    source    https://huggingface.co/ZhengPeng7/BiRefNet_lite  (licence: MIT)
    revision  ``REVISION`` below
    weights   ``model.safetensors``, sha256 ``WEIGHTS_SHA256`` below

torch is an EXPORT-TIME tool only.  It is declared in this file's inline
script metadata (the pinned form of ``uv run --with torch --with onnx ...``)
and never in ``pyproject.toml``, so it is not a runtime or image dependency:

    uv run scripts/export-birefnet-lite.py --size 512 --out ~/models

The output is ``birefnet-lite-<size>.onnx`` and, beside it, a provenance JSON
(``birefnet-lite-<size>.json``): source, revision, licence, both sha256s, the
tool versions and the export's agreement with the torch model.  The ONNX's
single output is the final decoder stage's LOGITS; the consumer applies the
sigmoid (``SubjectModelSpec.activation``), as the 1024 export it replaces did.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

REPO = "ZhengPeng7/BiRefNet_lite"
REVISION = "aa62cd87eafb9cc43056d08ef3615a14628b831d"
LICENCE = "MIT"
WEIGHTS = "model.safetensors"
WEIGHTS_SHA256 = "4417d89795250e698c3cb0ae8df15743810065f646f48a694fdfa7ca052d0815"
FILES = (WEIGHTS, "config.json", "birefnet.py", "BiRefNet_config.py")
OPSET = 17
AGREEMENT_ATOL = 5e-3  # max |onnx - torch| over the logits of one random input


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def fetch(cache: Path) -> Path:
    """The pinned revision's weights and model code, the weights sha-verified."""
    from huggingface_hub import hf_hub_download

    snapshot = cache / REVISION
    for name in FILES:
        hf_hub_download(REPO, name, revision=REVISION, local_dir=snapshot)
    got = sha256(snapshot / WEIGHTS)
    if got != WEIGHTS_SHA256:
        sys.exit(f"SHA-256 mismatch for {WEIGHTS}: expected {WEIGHTS_SHA256}, got {got}")
    return snapshot


def load(snapshot: Path):
    """The official model in eval mode, wrapped to return its final logits."""
    import torch
    from transformers import AutoModelForImageSegmentation

    model = AutoModelForImageSegmentation.from_pretrained(
        str(snapshot), trust_remote_code=True, local_files_only=True
    )
    model.eval().float()

    class FinalLogits(torch.nn.Module):
        def __init__(self, birefnet: torch.nn.Module) -> None:
            super().__init__()
            self.birefnet = birefnet

        def forward(self, image: torch.Tensor) -> torch.Tensor:
            return self.birefnet(image)[-1]

    return FinalLogits(model).eval()


def lower_deformable_convs(model) -> int:
    """Replace every ``DeformableConv2d`` (the decoder's ASPPDeformable) by
    ``SampledDeformableConv2d`` in place; returns how many were replaced.

    ONNX has no DeformConv below opset 19 and onnxruntime's CPU provider has no
    kernel for it at any opset, so it must be lowered.  The usual lowering
    (``deform_conv2d_onnx_exporter``: one GatherND of every kernel tap's four
    bilinear corners at once) materialises ``C x kh*kw x H x W x 4`` floats:
    822 MB for the 7x7 kernel on the quarter-resolution decoder stage at a 512
    input, the bulk of that export's 1.69 GB peak.  Here each tap is sampled
    on its own (``C x H x W``) and the taps are weighted a kernel row at a
    time.  Not a tap at a time: onnxruntime's default node order runs every
    term before the first sum, so the terms alive at once are what bounds
    the peak.  One inference at a 512 input, Linux x86-64: 1.31 GB with a
    term per tap (49 x 16 MB alive), 0.65 GB with a term per row."""
    import torch
    import torch.nn.functional as F

    class SampledDeformableConv2d(torch.nn.Module):
        """``torchvision.ops.deform_conv2d`` (stride 1, dilation 1, one group)
        as a sum over the kernel's taps: each tap bilinearly samples the input
        at its own offset positions (``grid_sample``, zeros outside, exactly
        deform_conv2d's sampling) and is modulated by its mask; each kernel
        row's taps are then weighted by that row's slice of the kernel."""

        def __init__(self, conv: torch.nn.Module) -> None:
            super().__init__()
            assert tuple(conv.stride) == (1, 1), conv.stride
            self.offset_conv = conv.offset_conv
            self.modulator_conv = conv.modulator_conv
            self.regular_conv = conv.regular_conv
            self.padding = int(conv.padding)

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            offset = self.offset_conv(x)
            mask = 2.0 * torch.sigmoid(self.modulator_conv(x))
            weight, bias = self.regular_conv.weight, self.regular_conv.bias
            h, w = int(x.shape[2]), int(x.shape[3])
            kh, kw = int(weight.shape[2]), int(weight.shape[3])
            oh, ow = int(offset.shape[2]), int(offset.shape[3])
            ys = torch.arange(oh, dtype=x.dtype).view(1, oh, 1) - self.padding
            xs = torch.arange(ow, dtype=x.dtype).view(1, 1, ow) - self.padding
            out = None
            for i in range(kh):
                samples = []
                for j in range(kw):
                    tap = i * kw + j
                    # Offsets are (dy, dx) per tap; grid_sample wants (x, y) in [-1, 1].
                    py = ys + i + offset[:, 2 * tap]
                    px = xs + j + offset[:, 2 * tap + 1]
                    grid = torch.stack((2.0 * px / (w - 1) - 1.0, 2.0 * py / (h - 1) - 1.0), dim=-1)
                    sample = F.grid_sample(x, grid, mode="bilinear", padding_mode="zeros", align_corners=True)
                    samples.append(sample * mask[:, tap : tap + 1])
                # One 1x1 convolution per kernel ROW over that row's taps (tap-major
                # channels), not one per tap: see ``lower_deformable_convs``.
                row = weight[:, :, i, :].permute(0, 2, 1).reshape(weight.shape[0], -1, 1, 1)
                term = F.conv2d(torch.cat(samples, dim=1), row)
                out = term if out is None else out + term
            return out if bias is None else out + bias.view(1, -1, 1, 1)

    replaced = 0
    for parent in list(model.modules()):
        for name, child in list(parent.named_children()):
            if type(child).__name__ == "DeformableConv2d":
                setattr(parent, name, SampledDeformableConv2d(child))
                replaced += 1
    return replaced


def export(model, size: int, path: Path) -> float:
    """Write the static ``[1, 3, size, size]`` export; return its largest
    absolute difference from the official torch model on one random input
    (which therefore also proves the deformable convolutions' lowering)."""
    import numpy as np
    import onnx
    import onnxruntime as ort
    import torch

    torch.manual_seed(0)
    x = torch.rand(1, 3, size, size)
    with torch.no_grad():
        want = model(x).numpy()  # the official model, torchvision's deform_conv2d
        if lower_deformable_convs(model) == 0:
            sys.exit("no DeformableConv2d found: the model code is not the pinned revision's")
        traced = path.with_suffix(".traced.onnx")
        torch.onnx.export(
            model, (x,), str(traced),
            input_names=["input_image"], output_names=["output_image"],
            opset_version=OPSET, do_constant_folding=True,
        )
    onnx.checker.check_model(str(traced))
    # The trace carries the model's own shape arithmetic (about 25,000 nodes,
    # three in four of them constants and shape plumbing).  onnxruntime's
    # BASIC level folds it away and is hardware-independent, so the folded
    # graph is the one published: a session on it opens in a fraction of the
    # time, which matters because the consumer opens one per extraction.
    options = ort.SessionOptions()
    options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_BASIC
    options.optimized_model_filepath = str(path)
    ort.InferenceSession(str(traced), options, providers=["CPUExecutionProvider"])
    traced.unlink()
    onnx.checker.check_model(str(path))
    session = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    assert session.get_inputs()[0].shape == [1, 3, size, size], session.get_inputs()[0].shape
    got = session.run(None, {"input_image": x.numpy()})[0]
    assert got.shape == want.shape == (1, 1, size, size), (got.shape, want.shape)
    return float(np.abs(got - want).max())


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--size", type=int, required=True, help="square input size, a multiple of 32")
    ap.add_argument("--out", type=Path, required=True, help="output directory")
    ap.add_argument("--cache", type=Path, default=Path.home() / ".cache" / "fourier-analysis" / "export")
    args = ap.parse_args()
    if args.size % 32:
        ap.error("--size must be a multiple of 32 (Swin's four stages and the decoder's strides)")

    import onnx
    import onnxruntime as ort
    import torch

    out = args.out.expanduser()
    out.mkdir(parents=True, exist_ok=True)
    path = out / f"birefnet-lite-{args.size}.onnx"
    snapshot = fetch(args.cache.expanduser())
    diff = export(load(snapshot), args.size, path)
    if diff > AGREEMENT_ATOL:
        path.unlink()
        sys.exit(f"the export disagrees with the torch model: max |diff| {diff:.2e} > {AGREEMENT_ATOL}")
    provenance = {
        "file": path.name,
        "sha256": sha256(path),
        "bytes": path.stat().st_size,
        "input": [1, 3, args.size, args.size],
        "output": "final decoder stage logits (apply sigmoid)",
        "source": f"https://huggingface.co/{REPO}",
        "revision": REVISION,
        "licence": LICENCE,
        "weights": WEIGHTS,
        "weights_sha256": WEIGHTS_SHA256,
        "opset": OPSET,
        "max_abs_diff_vs_torch": diff,
        "tools": {"torch": torch.__version__, "onnx": onnx.__version__, "onnxruntime": ort.__version__},
        "script": "scripts/export-birefnet-lite.py",
    }
    path.with_suffix(".json").write_text(json.dumps(provenance, indent=2) + "\n")
    print(json.dumps(provenance, indent=2))


if __name__ == "__main__":
    main()
