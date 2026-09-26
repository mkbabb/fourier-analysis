"""A learned line drawing: Informative Drawings (Chan, Durand, Isola; CVPR 2022).

The contour-style generator of *Learning to generate line drawings that convey
geometry and semantics* turns a photograph into the lines an artist would draw:
the outline, the eyes and lids, the nostrils, the lips and teeth line, the
folds of a garment.  Those are the strokes a Fourier drawing is recognised by;
iso-intensity contours of the photograph trace luminance level-sets instead.

The weights are the authors' ``contour_style`` generator exported to ONNX at a
fixed square input (MIT, ``x-Liola-x/informative-drawings-onnx``), sha-pinned
and cached under ``~/.cache/fourier-analysis/models/`` as the subject models
are (``ml._download``); they are never committed.

The photograph is first abstracted by total-variation smoothing
(``ABSTRACTION_WEIGHT``, Chambolle's algorithm at the model's input scale): it
flattens texture (fur, engraving hatching, skin pores) into regions while
keeping the edges between them, the classic image-abstraction step before
line extraction, so the model draws forms rather than the grain of their
surface.  It is then shown to the model the way the subject is to be drawn: its
background faded to white by the subject's soft saliency (``soft_alpha``), so
the model draws the subject's outline against paper and spends no lines on a
busy background.  The image is scaled so its longer side fills the square
input and padded with white, and the drawing is cropped and scaled back to
the pipeline's resolution.
"""

from __future__ import annotations

import threading
from typing import Any

import numpy as np
from numpy.typing import NDArray
from PIL import Image

from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.ml import SubjectModelSpec, _download, _source_rgb

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
"""The contour-style generator: input RGB in [0, 1] (NCHW, 768 square), output
one channel in [0, 1], white paper 1 and ink 0.  The input size sets the
drawing's level of abstraction: at 768 a portrait keeps its eyes, nostrils and
teeth while hair and fur texture fall away (at 1024 the model draws strands;
at 512 it deforms the eyes)."""

# Total-variation weight (RGB in [0, 1]) of the abstraction step.  Higher
# flattens more: at 0.1 a portrait's nose bridge fades; at 0 a cat's fur and an
# engraved coat are drawn hair by hair and hatch by hatch.
ABSTRACTION_WEIGHT = 0.06

# The subject's luma percentiles mapped to black and white (``stretch_subject``).
STRETCH_PERCENTILES = (1.0, 99.0)

_lock = threading.Lock()
_session: Any = None


def _get_session() -> Any:
    global _session
    if _session is not None:
        return _session
    with _lock:
        if _session is None:
            import onnxruntime as ort

            path = _download(LINE_MODEL)
            _session = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    return _session


def load_line_session() -> None:
    """Open the line model's session now (a long-lived process pays it once)."""
    _get_session()


def line_model_available() -> bool:
    """True when the weights can be had: cached, or downloadable now."""
    try:
        _download(LINE_MODEL)
    except Exception:  # noqa: BLE001 — offline, or a bad download
        return False
    return True


def soft_alpha(saliency: NDArray[np.float64], mask: NDArray[np.bool_]) -> NDArray[np.float64]:
    """How much of each pixel is subject: 1 on the subject mask, the saliency
    (which falls off smoothly) around it, so hair wisps and soft edges fade to
    paper instead of being cut."""
    return np.clip(np.maximum(saliency, mask.astype(np.float64)), 0.0, 1.0)


def stretch_subject(x: NDArray[np.float32], subject: NDArray[np.bool_]) -> NDArray[np.float32]:
    """Stretch the subject's own tonal range to the full range.

    A black cat or a backlit face lives in the bottom tenth of the range, and
    the model, trained on well-exposed photographs, inks it solid.  The
    subject's ``STRETCH_PERCENTILES`` of luma are mapped to 0 and 1 (one
    linear map for all three channels, so hues are kept); a well-exposed
    subject barely moves.
    """
    if subject.sum() < 16:
        return x
    luma = x @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    lo, hi = np.percentile(luma[subject], STRETCH_PERCENTILES)
    if hi - lo < 1e-3:
        return x
    return np.clip((x - lo) / (hi - lo), 0.0, 1.0).astype(np.float32)


def predict_line_drawing(
    image: LoadedImage,
    alpha: NDArray[np.float64] | None = None,
) -> NDArray[np.float64]:
    """Ink darkness in [0, 1] (1 = a drawn line) at the pipeline's resolution.

    ``alpha`` (pipeline resolution, [0, 1]) fades everything that is not the
    subject to white before the model sees it.
    """
    h, w = image.grayscale.shape
    size = LINE_MODEL.input_size
    scale = size / max(h, w)
    sw, sh = max(1, round(w * scale)), max(1, round(h * scale))

    rgb = _source_rgb(image).resize((sw, sh), Image.Resampling.LANCZOS)
    x = np.asarray(rgb, dtype=np.float32) / 255.0
    a_arr = None
    if alpha is not None:
        a = Image.fromarray(alpha.astype(np.float32), mode="F").resize(
            (sw, sh), Image.Resampling.BILINEAR
        )
        a_arr = np.clip(np.asarray(a, dtype=np.float32), 0.0, 1.0)[..., None]
        x = stretch_subject(x, a_arr[..., 0] >= 0.5)
    if ABSTRACTION_WEIGHT > 0:
        from skimage.restoration import denoise_tv_chambolle

        x = denoise_tv_chambolle(x, weight=ABSTRACTION_WEIGHT, channel_axis=-1).astype(np.float32)
    if a_arr is not None:
        x = x * a_arr + (1.0 - a_arr)
    canvas = np.ones((size, size, 3), dtype=np.float32)
    canvas[:sh, :sw] = x

    session = _get_session()
    out = session.run(None, {session.get_inputs()[0].name: canvas.transpose(2, 0, 1)[None]})[0]
    paper = np.clip(np.asarray(out, dtype=np.float32)[0, 0, :sh, :sw], 0.0, 1.0)
    ink = Image.fromarray(1.0 - paper, mode="F").resize((w, h), Image.Resampling.BILINEAR)
    return np.clip(np.asarray(ink, dtype=np.float64), 0.0, 1.0)
