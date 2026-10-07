from __future__ import annotations

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage  # type: ignore[import-untyped]
from scipy.ndimage import binary_fill_holes  # type: ignore[import-untyped]
from skimage import feature, filters, morphology  # type: ignore[import-untyped]

from fourier_analysis.contours.models import ContourConfig
from fourier_analysis.contours.image import LoadedImage


def threshold_masks(
    image: LoadedImage,
    config: ContourConfig,
    *,
    light_foreground: bool,
    use_detail: bool = False,
) -> tuple[NDArray[np.bool_], ...]:
    """Build a global Otsu foreground mask."""
    source = image.detail_grayscale if use_detail else image.grayscale
    threshold = filters.threshold_otsu(source)
    binary = source > threshold if light_foreground else source < threshold
    return (_cleanup_binary_mask(binary, image, config, preserve_detail=True),)


def adaptive_threshold_masks(
    image: LoadedImage,
    config: ContourConfig,
    *,
    light_foreground: bool,
    use_detail: bool = False,
) -> tuple[NDArray[np.bool_], ...]:
    """Build a local Sauvola foreground mask."""
    source = image.detail_grayscale if use_detail else image.grayscale
    min_dim = min(source.shape)
    window = max(15, min(81, int(min_dim // 8) | 1))
    if window % 2 == 0:
        window += 1
    threshold = filters.threshold_sauvola(source, window_size=window, k=0.2)
    binary = source > threshold if light_foreground else source < threshold
    return (_cleanup_binary_mask(binary, image, config, preserve_detail=True),)


def multi_threshold_masks(
    image: LoadedImage,
    config: ContourConfig,
    *,
    use_detail: bool = False,
    n_classes: int | None = None,
) -> tuple[NDArray[np.bool_], ...]:
    """Build nested Multi-Otsu masks across intensity levels."""
    source = image.detail_grayscale if use_detail else image.grayscale
    classes = n_classes if n_classes is not None else config.threshold.n_classes
    try:
        thresholds = filters.threshold_multiotsu(source, classes=classes)
    except ValueError:
        thresholds = np.array([filters.threshold_otsu(source)])

    regions = np.digitize(source, bins=thresholds)
    masks: list[NDArray[np.bool_]] = []
    for level in range(len(thresholds)):
        mask = regions > level
        cleaned = _cleanup_binary_mask(mask, image, config, preserve_detail=True)
        if np.any(cleaned):
            masks.append(cleaned)
    return tuple(masks)


def canny_masks(
    image: LoadedImage,
    config: ContourConfig,
) -> tuple[NDArray[np.bool_], ...]:
    """Build an edge mask from Canny plus morphological closing."""
    edges = feature.canny(image.detail_grayscale, sigma=config.canny.sigma)
    closed = morphology.closing(edges, morphology.disk(config.canny.closing_radius))
    cleaned = _remove_small_components(closed, max(4, int(image.image_area * 0.0001)))
    return (cleaned,)


def edge_aware_masks(
    image: LoadedImage,
    config: ContourConfig,
) -> tuple[NDArray[np.bool_], ...]:
    """Build a hull mask with interior edge channels carved in.

    Marching squares traces contours that follow both the outer silhouette
    AND weave through interior features (eyes, nose, folds).

    Only the *strongest* edges (top 40% by gradient magnitude) are carved,
    preventing dense-edge images from being shattered into fragments.
    """
    canny_kwargs: dict = {"sigma": config.canny.sigma}
    if config.canny.low is not None:
        canny_kwargs["low_threshold"] = config.canny.low
    if config.canny.high is not None:
        canny_kwargs["high_threshold"] = config.canny.high

    edges = feature.canny(image.edge_grayscale, **canny_kwargs)

    if config.canny.closing_radius > 0:
        closed = morphology.closing(edges, morphology.disk(config.canny.closing_radius))
    else:
        closed = edges

    hull = binary_fill_holes(closed)
    hull = _remove_small_components(hull, max(4, int(image.image_area * 0.0001)))

    # --- Carve strong interior edge channels ---
    detail_edges = feature.canny(image.detail_grayscale, sigma=1.0)

    if not np.any(detail_edges):
        return (hull,)

    # Select only the strongest edges by gradient magnitude.
    gradient = filters.sobel(image.detail_grayscale)
    edge_gradients = gradient[detail_edges]
    if edge_gradients.size > 0:
        threshold = float(np.percentile(edge_gradients, 60))
        detail_edges = detail_edges & (gradient >= threshold)

    # Restrict to inside the hull, away from the boundary.
    eroded_hull = morphology.erosion(hull, morphology.disk(3))
    interior_edges = detail_edges & eroded_hull

    if not np.any(interior_edges):
        return (hull,)

    # Narrow channels — disk(1) cuts without shattering.
    channels = morphology.dilation(interior_edges, morphology.disk(1))
    carved = hull & ~channels

    # Keep the largest connected component to ensure the contour spans
    # the full subject.  Interior edge channels create detail within
    # that single component.
    hull_area = float(np.count_nonzero(hull))
    labels, n_labels = ndimage.label(carved)
    if n_labels > 0:
        counts = np.bincount(labels.ravel())
        counts[0] = 0
        carved = labels == int(np.argmax(counts))

    carved_area = float(np.count_nonzero(carved))
    if carved_area < hull_area * 0.25:
        return (hull,)

    return (carved,)


def alpha_masks(image: LoadedImage) -> tuple[NDArray[np.bool_], ...]:
    """Build an alpha silhouette mask when the image has useful transparency."""
    if image.alpha is None:
        return ()
    return (image.alpha > 0.5,)


def mask_area_metrics(
    masks: tuple[NDArray[np.bool_], ...],
    image_area: float,
) -> tuple[float | None, float | None]:
    """Estimate effective area/detail fractions from source masks."""
    nonempty = [mask for mask in masks if np.any(mask)]
    if not nonempty or image_area <= 0:
        return None, None

    union = np.logical_or.reduce(nonempty)
    retained_area_fraction = float(np.count_nonzero(union)) / image_area

    mask_areas = sorted(
        (float(np.count_nonzero(mask)) / image_area for mask in nonempty),
        reverse=True,
    )
    if len(mask_areas) == 1:
        return retained_area_fraction, 0.0

    secondary = float(sum(mask_areas[1:])) / max(mask_areas[0], 1e-9)
    return retained_area_fraction, min(1.0, secondary)


def _cleanup_binary_mask(
    binary: NDArray[np.bool_],
    image: LoadedImage,
    config: ContourConfig,
    *,
    preserve_detail: bool,
) -> NDArray[np.bool_]:
    min_region_scale = config.min_contour_area * (0.1 if preserve_detail else 0.2)
    min_region = max(8 if preserve_detail else 16, int(image.image_area * max(min_region_scale, 0.0003)))
    hole_fraction = 0.0008 if preserve_detail else 0.0015
    hole_area = max(8 if preserve_detail else 16, int(image.image_area * hole_fraction))
    radius_cap = 2 if preserve_detail else 4
    radius = max(1, min(radius_cap, config.canny.closing_radius))

    cleaned = _remove_small_components(binary, min_region)
    cleaned = _fill_small_holes(cleaned, hole_area)
    if preserve_detail:
        cleaned = morphology.closing(cleaned, morphology.disk(radius))
    else:
        cleaned = morphology.opening(cleaned, morphology.disk(max(1, radius - 1)))
        cleaned = morphology.closing(cleaned, morphology.disk(radius))
    return cleaned


def _remove_small_components(
    binary: NDArray[np.bool_],
    min_size: int,
) -> NDArray[np.bool_]:
    if min_size <= 1:
        return binary
    labels, n_labels = ndimage.label(binary)
    if n_labels == 0:
        return binary
    counts = np.bincount(labels.ravel())
    keep = counts >= min_size
    keep[0] = False
    return keep[labels]


def _fill_small_holes(
    binary: NDArray[np.bool_],
    max_hole_size: int,
) -> NDArray[np.bool_]:
    if max_hole_size <= 0:
        return binary
    inverse = ~binary
    labels, n_labels = ndimage.label(inverse)
    if n_labels == 0:
        return binary
    counts = np.bincount(labels.ravel())
    border_labels = np.unique(
        np.concatenate(
            [
                labels[0, :],
                labels[-1, :],
                labels[:, 0],
                labels[:, -1],
            ]
        )
    )
    fill = counts <= max_hole_size
    fill[0] = False
    fill[border_labels] = False
    result = binary.copy()
    result[fill[labels]] = True
    return result
