"""A learned line drawing: Informative Drawings (Chan, Durand, Isola; CVPR 2022).

The contour-style generator of *Learning to generate line drawings that convey
geometry and semantics* turns a photograph into the lines an artist would
draw: an outline, a spiral on a sun, the lattice of a pineapple, a window
frame, the folds of a garment.  It is the line source wherever the face parser
does not speak (``contours.parts``): a faceless subject, and the hair, clothes
and body around a face.

The weights are the authors' ``contour_style`` generator exported to ONNX at a
fixed 768-pixel square input (MIT, ``x-Liola-x/informative-drawings-onnx``),
sha-pinned and cached under ``~/.cache/fourier-analysis/models/`` like the
subject models (``ml._download``); they are never committed.

Preprocessing, as the subject is to be drawn:

1. The subject's own luma range is stretched to the full range
   (``STRETCH_PERCENTILES``): a black cat or a backlit face lives in the
   bottom tenth, and the model, trained on well-exposed photographs, would ink
   it solid.
2. Total-variation smoothing (Chambolle, ``ABSTRACTION_WEIGHT``) flattens
   texture (fur, engraving hatch, skin pores) into regions and keeps the edges
   between them, the classic abstraction step before line extraction.
3. The background is faded to white paper by the subject's soft alpha
   (``soft_alpha``), so no line is spent on it.

**Two scales** (``persistent_lines``): the generator is run with the image
filling the input, and again at half that size.  A line that carries the
shape (an outline, a spiral, a lattice) is drawn at both; texture (fleece,
coat patches, fractal cracks) is finer than the coarse drawing resolves and
is drawn at the fine scale only.  The kept line strength is the lesser of
the fine map and the coarse map (max-filtered over one coarse input pixel,
the precision its line is placed to), so a line must persist across scales
to survive, placed where the fine drawing puts it: texture is dropped
structurally, with no threshold tuned to it.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from scipy import ndimage as ndi

from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.ml import SubjectModelSpec, _get_session, _source_rgb

_REVISION = "f6030b3ad1e84c5ebcf1e508a67b8d4ae697ccda"

LINE_MODEL = SubjectModelSpec(
    name="informative-drawings-contour-768",
    url=(
        "https://huggingface.co/x-Liola-x/informative-drawings-onnx/resolve/"
        f"{_REVISION}/informative-drawings_contour_768x768.onnx"
    ),
    sha256="d33368228ab747b4661eab7a2dbcbf274265237d349cdab2d864af2256ae57b1",
    input_size=768,
)
"""Input RGB in [0, 1] (NCHW, 768 square); output one channel in [0, 1],
white paper 1 and ink 0.  At 768 a portrait keeps its eyes, nostrils and teeth
while hair and fur texture fall away."""

ABSTRACTION_WEIGHT = 0.06
"""Total-variation weight (RGB in [0, 1]).  At 0.1 a nose bridge fades; at 0 a
cat's fur and an engraved coat are drawn hair by hair."""

STRETCH_PERCENTILES = (1.0, 99.0)

COARSE_SCALE = 0.5
"""The coarse drawing's size, as a fraction of the fine one's."""


def load_line_session() -> None:
    """Open the line model's session now (a long-lived process pays it once)."""
    _get_session(LINE_MODEL)


def soft_alpha(saliency: NDArray[np.float64], mask: NDArray[np.bool_]) -> NDArray[np.float64]:
    """How much of each pixel is subject: 1 on the mask, the saliency (which
    falls off smoothly) around it, so soft edges fade to paper, not cut."""
    return np.clip(np.maximum(saliency, mask.astype(np.float64)), 0.0, 1.0)


def stretch_subject(x: NDArray[np.float32], subject: NDArray[np.bool_]) -> NDArray[np.float32]:
    """Map the subject's ``STRETCH_PERCENTILES`` of luma to 0 and 1 (one
    linear map for all channels, so hues are kept)."""
    if subject.sum() < 16:
        return x
    luma = x @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    lo, hi = np.percentile(luma[subject], STRETCH_PERCENTILES)
    if hi - lo < 1e-3:
        return x
    return np.clip((x - lo) / (hi - lo), 0.0, 1.0).astype(np.float32)


def _prepared(image: LoadedImage, alpha: NDArray[np.float64] | None, side: int) -> NDArray[np.float32]:
    """The model's view of the image at longest side ``side`` (steps 1-3)."""
    from skimage.restoration import denoise_tv_chambolle

    h, w = image.grayscale.shape
    scale = side / max(h, w)
    sw, sh = max(1, round(w * scale)), max(1, round(h * scale))
    rgb = _source_rgb(image).resize((sw, sh), Image.Resampling.LANCZOS)
    x = np.asarray(rgb, dtype=np.float32) / 255.0
    a = None
    if alpha is not None:
        a_img = Image.fromarray(alpha.astype(np.float32), mode="F").resize((sw, sh), Image.Resampling.BILINEAR)
        a = np.clip(np.asarray(a_img, dtype=np.float32), 0.0, 1.0)[..., None]
        x = stretch_subject(x, a[..., 0] >= 0.5)
    if ABSTRACTION_WEIGHT > 0:
        x = denoise_tv_chambolle(x, weight=ABSTRACTION_WEIGHT, channel_axis=-1).astype(np.float32)
    if a is not None:
        x = x * a + (1.0 - a)
    return x


def line_drawing(
    image: LoadedImage,
    alpha: NDArray[np.float64] | None = None,
    scale: float = 1.0,
) -> NDArray[np.float64]:
    """Ink darkness in [0, 1] (1 = a drawn line) at the pipeline resolution,
    with the image drawn at ``scale`` times the model's input size."""
    size = LINE_MODEL.input_size
    side = max(8, round(size * scale))
    x = _prepared(image, alpha, side)
    sh, sw = x.shape[:2]
    canvas = np.ones((size, size, 3), dtype=np.float32)
    canvas[:sh, :sw] = x
    session = _get_session(LINE_MODEL)
    out = session.run(None, {session.get_inputs()[0].name: canvas.transpose(2, 0, 1)[None]})[0]
    paper = np.clip(np.asarray(out, dtype=np.float32)[0, 0, :sh, :sw], 0.0, 1.0)
    h, w = image.grayscale.shape
    ink = Image.fromarray(1.0 - paper, mode="F").resize((w, h), Image.Resampling.BILINEAR)
    return np.clip(np.asarray(ink, dtype=np.float64), 0.0, 1.0)


def persistent_lines(
    image: LoadedImage,
    alpha: NDArray[np.float64] | None = None,
) -> NDArray[np.float64]:
    """Line strength where the line persists across scales (module docstring):
    ``min(fine, maxfilter(coarse))``, the filter one coarse input pixel wide."""
    return line_maps(image, alpha)[1]


def line_maps(
    image: LoadedImage,
    alpha: NDArray[np.float64] | None = None,
) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
    """``(fine, persistent)``: the fine drawing and its persistent part."""
    fine = line_drawing(image, alpha, 1.0)
    coarse = line_drawing(image, alpha, COARSE_SCALE)
    h, w = image.grayscale.shape
    reach = max(h, w) / (LINE_MODEL.input_size * COARSE_SCALE)
    size = max(1, 2 * round(reach) + 1)
    return fine, np.minimum(fine, ndi.maximum_filter(coarse, size=size))
