"""The person: a portrait's subject is the sitter, not what stands beside them.

The saliency ensemble (``isolation.subject_mask``) keeps whatever is salient,
and in a photograph that can be a plant or a chair touching the sitter.  Where
the face parser has confirmed a face (``parts.part_labels``), the subject is
the person, so the mask is cut to MediaPipe's multiclass selfie segmenter
(background, hair, body skin, face skin, clothes, accessories): every pixel it
does not call background is the person.

The segmenter sees the image at 256 pixels, so its edge is placed only to
about a pixel of that grid: the person is grown by ``BAND_PARSER_PX`` parser
pixels, and the mask, drawn at full resolution, still places the silhouette.
The person decides only *which* parts of the mask are the subject.  Each
component of the mask left outside the grown person is judged by what it
leans on (``isolation.leaning_on``): when more of its border meets the
background than the rest of the subject, it is an object beside the sitter (a
leaf against a cheek) and is cut; otherwise it is part of the sitter the
segmenter missed (an engraving's shaded shoulder, a vignette) and stays.
What survives is reduced to its significant components
(``isolation.significant_components``).

The weights are Google's ``selfie_multiclass_256x256`` (Apache-2.0), sha-pinned
and cached under ``~/.cache/fourier-analysis/models/`` like the other models
(``ml._download``), never committed.  They run on LiteRT (``ai-edge-litert``).
"""

from __future__ import annotations

import threading
from typing import Any

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from scipy import ndimage as ndi

from fourier_analysis.contours.ml import SubjectModelSpec, _download

PERSON_PARSER = SubjectModelSpec(
    name="selfie_multiclass_256x256",
    url=(
        "https://storage.googleapis.com/mediapipe-models/image_segmenter/"
        "selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite"
    ),
    sha256="c6748b1253a99067ef71f7e26ca71096cd449baefa8f101900ea23016507e0e0",
    input_size=256,
    suffix=".tflite",
)
"""Input RGB scaled to [-1, 1] (NHWC, 256 square); output six class logits."""

BAND_PARSER_PX = 2.0
"""The person's edge is uncertain by this many parser pixels."""

_lock = threading.Lock()
_interpreter: Any = None


def _get_interpreter() -> Any:
    global _interpreter
    if _interpreter is not None:
        return _interpreter
    with _lock:
        if _interpreter is None:
            from ai_edge_litert.interpreter import Interpreter

            it = Interpreter(model_path=str(_download(PERSON_PARSER)))
            it.allocate_tensors()
            _interpreter = it
    return _interpreter


def load_person_session() -> None:
    """Open the segmenter now (a long-lived process pays it once)."""
    _get_interpreter()


def person_probability(rgb: Image.Image, shape: tuple[int, int]) -> NDArray[np.float64]:
    """The probability that each pipeline pixel is the person (not background)."""
    it = _get_interpreter()
    size = PERSON_PARSER.input_size
    x = np.asarray(rgb.resize((size, size), Image.Resampling.LANCZOS), np.float32) / 127.5 - 1.0
    it.set_tensor(it.get_input_details()[0]["index"], x[None])
    it.invoke()
    logits = it.get_tensor(it.get_output_details()[0]["index"])[0]
    logits = logits - logits.max(axis=-1, keepdims=True)
    p = np.exp(logits)
    person = 1.0 - p[..., 0] / p.sum(axis=-1)
    out = Image.fromarray(person.astype(np.float32), mode="F").resize(
        (shape[1], shape[0]), Image.Resampling.BILINEAR
    )
    return np.clip(np.asarray(out, dtype=np.float64), 0.0, 1.0)


def person_cut(rgb: Image.Image, mask: NDArray[np.bool_]) -> NDArray[np.bool_]:
    """``mask`` cut to the person (module docstring); ``mask`` itself when the
    segmenter finds no person on it."""
    from fourier_analysis.contours.isolation import leaning_on, significant_components

    person = person_probability(rgb, mask.shape) >= 0.5
    if not (person & mask).any():
        return mask
    band = BAND_PARSER_PX * max(mask.shape) / PERSON_PARSER.input_size
    near = ndi.distance_transform_edt(~person) <= band
    return significant_components(leaning_on(mask & near, mask))
