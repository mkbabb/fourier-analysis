"""Stage 1: Subject isolation via ML saliency + optional alpha intersection."""

from __future__ import annotations

from dataclasses import dataclass, replace

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage as ndi

from fourier_analysis.contours.faces import face_region
from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.models import ContourConfig
from fourier_analysis.contours.ml import _predict_probability_map
from fourier_analysis.contours.processing import (
    _find_contours_padded,
    _postprocess_raw_contours,
)
from fourier_analysis.contours.support import on_frame, subject_band


@dataclass(frozen=True)
class SubjectIsolation:
    """Result of subject isolation.

    ``silhouettes`` trace the subject mask's true boundary: a closed loop per
    component (or significant hole) that stays inside the frame, and open
    strokes where the frame crops the subject (the frame itself is never ink).
    ``silhouette_area`` is the mask's area in pixels; ``subject_band`` is the
    mask dilated by the bar's boundary tolerance (see ``support``).
    ``face_region`` is where the subject's faces are (``faces.face_region``),
    ``None`` when it has none.
    """

    subject_mask: NDArray[np.bool_] | None
    saliency_map: NDArray[np.float64]
    silhouettes: tuple[NDArray[np.complex128], ...]
    silhouette_area: float
    subject_band: NDArray[np.bool_] | None = None
    face_region: NDArray[np.bool_] | None = None


# A mask component (or hole) is significant at this fraction of the largest
# component's area: the rule the bench reference derivation uses.
MIN_COMPONENT_FRACTION = 0.05

# Hysteresis seed level: the most salient component above it seeds the subject.
SEED_THRESHOLD = 0.8


def hysteresis_subject_mask(
    saliency: NDArray[np.float64],
    grow_threshold: float,
    seed_threshold: float = SEED_THRESHOLD,
) -> NDArray[np.bool_]:
    """The subject as one hysteresis region of the saliency map.

    The connected components above ``seed_threshold`` are ranked by saliency
    mass and the most salient seeds the subject; the component of
    ``saliency >= grow_threshold`` containing that seed is the mask.  When no
    pixel reaches the seed level, the saliency peak seeds it, so a small or
    faint subject is still isolated rather than disabled into full-image
    extraction.
    """
    seed_threshold = max(seed_threshold, grow_threshold)
    labels, n = ndi.label(saliency >= seed_threshold)
    if n > 0:
        mass = ndi.sum(saliency, labels, index=np.arange(1, n + 1))
        seed = labels == int(np.argmax(mass)) + 1
    else:
        seed = np.zeros(saliency.shape, dtype=bool)
        seed[np.unravel_index(int(np.argmax(saliency)), saliency.shape)] = True
    grown, _ = ndi.label(saliency >= min(grow_threshold, float(saliency[seed].min())))
    keep = np.unique(grown[seed])
    return np.isin(grown, keep[keep > 0])


def significant_components(mask: NDArray[np.bool_]) -> NDArray[np.bool_]:
    """Every component of at least ``MIN_COMPONENT_FRACTION`` of the largest
    one's area, with the holes below that size filled."""
    labels, n = ndi.label(mask)
    if n == 0:
        return mask
    sizes = ndi.sum(mask, labels, index=np.arange(1, n + 1))
    floor = MIN_COMPONENT_FRACTION * float(sizes.max())
    kept = np.isin(labels, np.flatnonzero(sizes >= floor) + 1)
    holes, m = ndi.label(ndi.binary_fill_holes(kept) & ~kept)
    if m:
        hole_sizes = ndi.sum(holes > 0, holes, index=np.arange(1, m + 1))
        kept |= np.isin(holes, np.flatnonzero(hole_sizes < floor) + 1)
    return kept


def cut_frame_runs(
    rc: NDArray[np.floating],
    shape: tuple[int, int],
) -> list[NDArray[np.floating]]:
    """Cut a padded trace where it runs along the image frame.

    ``_find_contours_padded`` closes a frame-cropped region through the pad,
    one half-pixel outside the image, and a mask edge a pixel or two inside
    the border runs along it too.  Those points (``support.on_frame``) are the
    frame, not the subject: the trace is cut there, leaving open strokes along
    the subject's real boundary.  A trace clear of the frame comes back whole.
    """
    off = on_frame(rc, shape)
    if not off.any():
        return [rc]
    pts, flags = rc[:-1], off[:-1]  # padded traces are closed
    start = int(np.flatnonzero(flags)[0])
    pts = np.roll(pts, -start, axis=0)
    flags = np.roll(flags, -start)
    edges = np.diff(np.concatenate([[1], flags.astype(np.int8), [1]]))
    starts = np.flatnonzero(edges == -1)
    ends = np.flatnonzero(edges == 1)
    return [pts[s:e] for s, e in zip(starts, ends) if e - s >= 2]


def subject_silhouettes(
    mask: NDArray[np.bool_],
    image: LoadedImage,
    config: ContourConfig,
) -> tuple[NDArray[np.complex128], ...]:
    """The mask's boundary: closed loops inside the frame, open strokes where
    the frame crops it; every significant component, none force-closed."""
    raw: list[NDArray[np.floating]] = []
    for rc in _find_contours_padded(mask):
        raw.extend(cut_frame_runs(rc, mask.shape))
    if not raw:
        return ()
    processed, _ = _postprocess_raw_contours(raw, image, replace(config, max_contours=None))
    return tuple(processed)


def isolate_subject(
    image: LoadedImage,
    config: ContourConfig,
) -> SubjectIsolation:
    """Isolate the primary subject using ML saliency and optional alpha.

    1. Run the subject ensemble to get a probability map.
    2. Hysteresis: the most salient component above ``SEED_THRESHOLD`` seeds
       the mask, grown through ``saliency >= config.ml.threshold``.
    3. If alpha exists with 5-98% coverage, intersect with the mask.
    4. Keep every significant component; trace its boundary, cut at the frame.
    5. Find the faces on it (``faces.face_region``).
    """
    saliency = _predict_probability_map(image)
    subject_mask = hysteresis_subject_mask(saliency, config.ml.threshold)

    # Intersect with alpha if available and meaningful.
    if image.alpha is not None:
        alpha_mask = image.alpha > 0.5
        alpha_coverage = float(np.mean(alpha_mask))
        if 0.05 < alpha_coverage < 0.98:
            combined = alpha_mask & subject_mask
            if float(np.mean(combined)) > 0.05:
                subject_mask = combined

    subject_mask = significant_components(subject_mask)

    return SubjectIsolation(
        subject_mask=subject_mask,
        saliency_map=saliency,
        silhouettes=subject_silhouettes(subject_mask, image, config),
        silhouette_area=float(subject_mask.sum()),
        subject_band=subject_band(subject_mask),
        face_region=face_region(image.grayscale, subject_mask),
    )
