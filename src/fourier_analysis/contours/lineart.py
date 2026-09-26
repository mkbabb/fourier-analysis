"""A learned line drawing: where an artist would put a line.

Informative Drawings (Chan, Durand & Isola, CVPR 2022) is a photo-to-line-art
generator trained to keep the lines that carry a picture's geometry and
semantics (outlines, creases, features) and drop shading and texture.  Its
ONNX export is sha-pinned in ``ml.LINE_ART`` and cached like the subject
models.  :func:`line_strength` returns the ink darkness in [0, 1] (1 = a line)
at the pipeline resolution.
"""

from __future__ import annotations

import logging
import threading
from typing import Any

import numpy as np
from numpy.typing import NDArray
from PIL import Image

from fourier_analysis.contours.ml import LINE_ART, ensure_asset

logger = logging.getLogger(__name__)

# The generator runs at two scales (longest side, a multiple of 8).  At the
# fine scale an eye or a lip is several of its pixels wide and lines are
# placed precisely; at the coarse scale texture (fur, foliage, hatching) is
# finer than a pixel and is not drawn, while the lines that carry the shape
# persist.  A line of the drawing is one the generator draws at both.
LINE_ART_SIDE = 384
COARSE_SIDE = 160

_lock = threading.Lock()
_session: Any = None


def _get_session():
    global _session
    if _session is not None:
        return _session
    with _lock:
        if _session is None:
            import onnxruntime as ort

            _session = ort.InferenceSession(
                str(ensure_asset(LINE_ART)), providers=["CPUExecutionProvider"]
            )
    return _session


def load_line_art_session() -> None:
    _get_session()


def persistent_line_strength(rgb: NDArray[np.uint8], reach_px: float) -> NDArray[np.float64] | None:
    """Line darkness where the line persists across scales: the geometric
    mean of the fine map and the coarse map (max-filtered over ``reach_px``,
    since the coarse line is placed only to within its own pixel)."""
    from scipy import ndimage as ndi

    fine = line_strength(rgb, LINE_ART_SIDE)
    coarse = line_strength(rgb, COARSE_SIDE)
    if fine is None or coarse is None:
        return None
    size = max(1, 2 * round(reach_px) + 1)
    return np.sqrt(fine * ndi.maximum_filter(coarse, size=size))


def line_strength(rgb: NDArray[np.uint8], side: int = LINE_ART_SIDE) -> NDArray[np.float64] | None:
    """Line darkness in [0, 1] at ``rgb``'s size, with the generator run at
    longest side ``side``; ``None`` if the model is unavailable."""
    try:
        session = _get_session()
    except Exception:  # noqa: BLE001
        logger.warning("line-art model unavailable", exc_info=True)
        return None
    h, w = rgb.shape[:2]
    scale = side / max(h, w)
    sh, sw = max(8, round(h * scale / 8) * 8), max(8, round(w * scale / 8) * 8)
    x = np.asarray(
        Image.fromarray(rgb).resize((sw, sh), Image.Resampling.LANCZOS), dtype=np.float32
    ) / 255.0
    out = session.run(None, {session.get_inputs()[0].name: x.transpose(2, 0, 1)[None]})[0]
    ink = 1.0 - np.clip(np.asarray(out, dtype=np.float32).squeeze(), 0.0, 1.0)
    big = Image.fromarray(ink, mode="F").resize((w, h), Image.Resampling.BILINEAR)
    return np.clip(np.asarray(big, dtype=np.float64), 0.0, 1.0)
