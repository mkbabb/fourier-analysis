"""The subject mask: the saliency ensemble, grown by hysteresis, fused by
agreement, alpha-intersected, reduced to its significant components."""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage as ndi

from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.models import ContourConfig
from fourier_analysis.contours.ml import subject_maps


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


def leaning_on(core: NDArray[np.bool_], wide: NDArray[np.bool_]) -> NDArray[np.bool_]:
    """``core`` plus each component of ``wide`` outside it that leans on it:
    more of the component's border meets ``core`` than meets the world outside
    ``wide``.  A region in dispute that is hemmed in by the subject is part
    of it (a shaded shoulder, a gap one model missed); one that hangs off the
    subject into the background is beside it (a leaf against a cheek, a patch
    of ground)."""
    extra, n = ndi.label(wide & ~core)
    if n == 0:
        return core
    ring = ndi.binary_dilation(extra > 0) & (extra == 0)
    # Each ring pixel is charged to the component next to it (one between two
    # components goes to the higher label: a rare, tiny share).
    owner = ndi.maximum_filter(extra, size=3)
    on_core = np.bincount(owner[ring & core], minlength=n + 1)
    on_world = np.bincount(owner[ring & ~wide], minlength=n + 1)
    keep = np.flatnonzero(on_core > on_world)
    return core | np.isin(extra, keep[keep > 0])


def subject_mask(
    image: LoadedImage,
    config: ContourConfig,
) -> tuple[NDArray[np.bool_], NDArray[np.float64]]:
    """The subject mask and the saliency map (the models' mean) it is read
    from.

    Each fusion of the ensemble is grown by hysteresis (the most salient
    component above ``SEED_THRESHOLD``, through ``config.ml.threshold``) and
    intersected with a meaningful alpha.  The models' geometric mean is the
    subject they agree on; their arithmetic mean also holds what only one of
    them sees.  The mask is the agreed subject plus the disputed regions that
    lean on it (``leaning_on``), reduced to its significant components."""
    maps = subject_maps(image)
    saliency = np.mean(maps, axis=0)
    agreed = np.exp(np.mean(np.log(np.maximum(maps, 1e-6)), axis=0))

    def grown(prob: NDArray[np.float64]) -> NDArray[np.bool_]:
        mask = hysteresis_subject_mask(prob, config.ml.threshold)
        if image.alpha is not None:
            alpha_mask = image.alpha > 0.5
            if 0.05 < float(np.mean(alpha_mask)) < 0.98:
                combined = alpha_mask & mask
                if float(np.mean(combined)) > 0.05:
                    mask = combined
        return mask

    return significant_components(leaning_on(grown(agreed), grown(saliency))), saliency
