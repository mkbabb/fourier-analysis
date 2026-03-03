"""Contour extraction from images.

Extracts edge contours from images and represents them as complex-valued
paths suitable for Fourier analysis. The pipeline replaces the old Canny +
greedy nearest-neighbor pixel walk with marching squares via
``skimage.measure.find_contours``, which produces properly ordered, closed
contour paths natively---no post-hoc stitching required.

Four strategies are available:

- **THRESHOLD** (Otsu binarization): best for portraits and high-contrast
  silhouettes where a clean foreground/background split exists.
- **MULTI_THRESHOLD** (multi-Otsu): partitions the histogram into *n*
  classes and extracts contours at each level boundary. Captures interior
  detail that a single threshold obliterates---essential for images with
  mid-tone structure (mechanical parts, shaded illustrations).
- **CANNY** (Canny edges + morphological closing): best for line drawings
  and images with subtle gradients.
- **AUTO** (default): uses MULTI_THRESHOLD, which subsumes plain
  THRESHOLD while also capturing interior detail when it exists.

Used in the epicycle image-tracing pipeline (§6.2).
"""

from __future__ import annotations

from enum import Enum
from pathlib import Path

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from scipy.interpolate import interp1d  # type: ignore[import-untyped]
from skimage import feature, filters, measure, morphology  # type: ignore[import-untyped]


class ContourStrategy(Enum):
    """Strategy for contour extraction.

    THRESHOLD uses Otsu's method to binarize, then marching squares.
    MULTI_THRESHOLD uses multi-Otsu to partition the histogram into
    *n* classes and extracts contours at every level boundary.
    CANNY uses Canny edge detection + morphological closing, then marching squares.
    AUTO picks whichever suits the image's histogram.
    """

    THRESHOLD = "threshold"
    MULTI_THRESHOLD = "multi_threshold"
    CANNY = "canny"
    AUTO = "auto"


def _bimodality_coefficient(data: NDArray[np.floating]) -> float:
    """Compute the bimodality coefficient of a 1-D distribution.

    BC = (skewness^2 + 1) / kurtosis, where kurtosis here is the
    *excess* kurtosis + 3 (i.e., the regular kurtosis). A value > 0.555
    suggests bimodality---meaning Otsu thresholding is likely to produce
    a clean split.
    """
    n = len(data)
    if n < 4:
        return 0.0
    mean = np.mean(data)
    centered = data - mean
    m2 = np.mean(centered**2)
    if m2 < 1e-12:
        return 0.0
    m3 = np.mean(centered**3)
    m4 = np.mean(centered**4)
    skew = m3 / (m2**1.5)
    kurt = m4 / (m2**2)  # regular (not excess) kurtosis
    return float((skew**2 + 1) / kurt)


def extract_contours(
    image_path: str | Path,
    *,
    strategy: ContourStrategy | str = ContourStrategy.AUTO,
    resize: int | None = 512,
    min_contour_length: int = 40,
    blur_sigma: float = 1.0,
    canny_sigma: float = 2.0,
    closing_radius: int = 3,
    n_classes: int = 3,
) -> list[NDArray[np.complex128]]:
    """Extract edge contours from an image as complex paths.

    The heavy lifting is done by ``skimage.measure.find_contours``
    (marching squares), which returns contours that are *already ordered*
    as closed polylines---a massive improvement over the old scatter-then-
    stitch approach.

    Parameters
    ----------
    image_path : str or Path
        Path to the input image.
    strategy : ContourStrategy or str
        Extraction strategy. ``"auto"`` (default) inspects the histogram
        to pick THRESHOLD or MULTI_THRESHOLD automatically.
    resize : int, optional
        Resize the longest dimension to this value. ``None`` to skip.
    min_contour_length : int
        Discard contours with fewer points than this.
    blur_sigma : float
        Gaussian smoothing sigma applied before thresholding/edge
        detection. Merges fine texture into broad tonal regions,
        suppressing the tiny spurious contours that plague painted
        portraits under multi-Otsu. Set to 0 to disable.
    canny_sigma : float
        Gaussian sigma for Canny edge detection (CANNY strategy only).
    closing_radius : int
        Disk radius for morphological closing (CANNY strategy only).
    n_classes : int
        Number of intensity classes for MULTI_THRESHOLD (default 3).

    Returns
    -------
    list of NDArray[complex128]
        Each array is a contour represented as complex numbers
        ``(col - cx) + 1j * (cy - row)``, centered and y-flipped.
    """
    if isinstance(strategy, str):
        strategy = ContourStrategy(strategy.lower())

    img = Image.open(image_path).convert("L")

    if resize is not None:
        ratio = resize / max(img.size)
        new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)

    arr = np.array(img, dtype=np.float64)

    # Normalize to [0, 1] for skimage
    arr_max = arr.max()
    if arr_max > 0:
        arr = arr / arr_max

    # Gaussian pre-blur: merges fine texture into broad tonal regions,
    # dramatically reducing the small spurious contours that multi-Otsu
    # picks up on painted portraits (Fourier, Cauchy, etc.).
    if blur_sigma > 0:
        arr = filters.gaussian(arr, sigma=blur_sigma)

    # Strategy dispatch
    if strategy == ContourStrategy.AUTO:
        strategy = ContourStrategy.MULTI_THRESHOLD

    if strategy == ContourStrategy.THRESHOLD:
        thresh = filters.threshold_otsu(arr)
        binary = arr < thresh  # foreground = dark pixels (portraits)
        raw_contours = measure.find_contours(binary.astype(float), level=0.5)
    elif strategy == ContourStrategy.MULTI_THRESHOLD:
        try:
            thresholds = filters.threshold_multiotsu(arr, classes=n_classes)
        except ValueError:
            # Too few distinct intensity values for the requested class count;
            # fall back to single Otsu.
            thresholds = np.array([filters.threshold_otsu(arr)])
        regions = np.digitize(arr, bins=thresholds)
        raw_contours = []
        for level in range(len(thresholds)):
            binary_level = (regions > level).astype(float)
            raw_contours.extend(measure.find_contours(binary_level, level=0.5))
    else:  # CANNY
        edges = feature.canny(arr, sigma=canny_sigma)
        closed = morphology.closing(edges, morphology.disk(closing_radius))
        raw_contours = measure.find_contours(closed.astype(float), level=0.5)

    # Center coordinates and convert to complex
    cy, cx = arr.shape[0] / 2, arr.shape[1] / 2
    contours: list[NDArray[np.complex128]] = []

    for rc in raw_contours:
        if len(rc) < min_contour_length:
            continue
        # rc is (N, 2) with columns (row, col)
        rows, cols = rc[:, 0], rc[:, 1]
        z = (cols - cx) + 1j * (cy - rows)
        contours.append(z)

    return contours


def resample_arc_length(
    contour: NDArray[np.complex128],
    n_points: int,
) -> NDArray[np.complex128]:
    """Resample a contour to uniform arc-length spacing.

    The FFT assumes uniform sampling in the parameter domain. If the
    original contour has variable point density (common after marching
    squares), this resampling step ensures the Fourier coefficients
    aren't aliased by non-uniform spacing.

    Parameters
    ----------
    contour : NDArray[complex128]
        The input contour as complex numbers.
    n_points : int
        Number of uniformly spaced output points.

    Returns
    -------
    NDArray[complex128]
        Resampled contour with ``n_points`` points.
    """
    if len(contour) < 2:
        return contour

    # Cumulative arc length
    diffs = np.abs(np.diff(contour))
    arc = np.concatenate([[0.0], np.cumsum(diffs)])
    total_length = arc[-1]

    if total_length < 1e-12:
        return contour[:n_points] if len(contour) >= n_points else contour

    # Normalize to [0, 1]
    arc_norm = arc / total_length

    # Interpolate real and imaginary parts independently
    interp_re = interp1d(arc_norm, contour.real, kind="linear")
    interp_im = interp1d(arc_norm, contour.imag, kind="linear")

    t_uniform = np.linspace(0, 1, n_points, endpoint=False)
    return interp_re(t_uniform) + 1j * interp_im(t_uniform)
