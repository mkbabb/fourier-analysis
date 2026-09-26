"""Where the subject's faces are: the region a portrait is recognised by.

A viewer recognises a portrait by its face: the eyes, brows, nose, mouth and
the jaw that closes it.  Those strokes are short and often soft (a jaw's
shading, a lip line in an engraving), and a long high-contrast coat lapel or
stripe outranks them on length and contrast alone, so under a stroke ceiling
the face comes out blank.  The selection (``assembly``) therefore weighs a
stroke by how much of it lies in a face.

Faces are found by the frontal-face LBP cascade that ships with scikit-image
(``skimage.data.lbp_frontal_face_cascade_filename``), run on the grey image
scaled so its longest side is ``DETECT_SIDE_PX``.  A detection whose centre is
off the subject mask is ignored (a face in the background painting is not the
subject's).  The cascade's box spans brow to mouth; the region is the ellipse
that grows it to the whole face, forehead to chin (``FACE_*`` below, in box
widths).  An image with no face (an animal, a robot) has no region, and its
selection is unchanged.
"""

from __future__ import annotations

from functools import lru_cache

import numpy as np
from numpy.typing import NDArray

# The cascade runs on the grey image scaled to this longest side.
DETECT_SIDE_PX = 384
# The smallest face searched for, in detection pixels (the cascade's window).
MIN_FACE_PX = 24
# The face ellipse around a cascade box of width w at (r0, c0): centred
# FACE_CENTRE_DOWN * w below the box top, semi-axes FACE_HALF_HEIGHT * w and
# FACE_HALF_WIDTH * w (the box covers brow to mouth; the chin lies below it).
FACE_CENTRE_DOWN = 0.6
FACE_HALF_HEIGHT = 0.7
FACE_HALF_WIDTH = 0.6


@lru_cache(maxsize=1)
def _cascade():
    from skimage import data
    from skimage.feature import Cascade

    return Cascade(data.lbp_frontal_face_cascade_filename())


def face_boxes(grayscale: NDArray[np.floating]) -> list[tuple[float, float, float]]:
    """Frontal-face detections as ``(row, col, width)`` boxes in the pixels of
    ``grayscale`` (top-left corner and side)."""
    from skimage.transform import rescale

    g = np.asarray(grayscale, dtype=np.float64)
    if g.size == 0 or min(g.shape) < MIN_FACE_PX:
        return []
    scale = min(1.0, DETECT_SIDE_PX / max(g.shape))
    small = rescale(g, scale, anti_aliasing=scale < 1.0) if scale < 1.0 else g
    top = float(small.max())
    if top <= 0:
        return []
    small = small / top
    dets = _cascade().detect_multi_scale(
        img=small,
        scale_factor=1.2,
        step_ratio=1,
        min_size=(MIN_FACE_PX, MIN_FACE_PX),
        max_size=small.shape,
    )
    return [(d["r"] / scale, d["c"] / scale, d["width"] / scale) for d in dets]


def face_region(
    grayscale: NDArray[np.floating],
    subject_mask: NDArray[np.bool_] | None,
) -> NDArray[np.bool_] | None:
    """The union of the face ellipses of every detection centred on the
    subject (see the module docstring), or ``None`` when there is none."""
    shape = grayscale.shape
    rr, cc = np.ogrid[: shape[0], : shape[1]]
    region = np.zeros(shape, dtype=bool)
    for r0, c0, w in face_boxes(grayscale):
        centre = (int(min(shape[0] - 1, r0 + w / 2)), int(min(shape[1] - 1, c0 + w / 2)))
        if subject_mask is not None and subject_mask.any() and not subject_mask[centre]:
            continue
        cy, cx = r0 + FACE_CENTRE_DOWN * w, c0 + w / 2
        region |= ((rr - cy) / (FACE_HALF_HEIGHT * w)) ** 2 + (
            (cc - cx) / (FACE_HALF_WIDTH * w)
        ) ** 2 <= 1.0
    return region if region.any() else None
