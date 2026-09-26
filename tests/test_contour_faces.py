"""Face regions for the selection's face weight (F.CT). Public set only."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from fourier_analysis.contours.faces import face_region
from fourier_analysis.contours.image import load_image_inputs
from fourier_analysis.contours.models import ContourConfig

ASSETS = Path(__file__).resolve().parents[1] / "assets"


def _grey(rel: str) -> np.ndarray:
    return load_image_inputs(ASSETS / rel, ContourConfig().normalized()).grayscale


@pytest.mark.parametrize(
    "rel", ["portraits/daraksha.jpg", "portraits/cauchy.png", "portraits/euler.jpg"]
)
def test_a_portrait_has_one_face_region_in_its_upper_half(rel):
    g = _grey(rel)
    region = face_region(g, None)
    assert region is not None, rel
    rows = np.flatnonzero(region.any(axis=1))
    # A head-and-shoulders portrait: the face is a modest share of the frame,
    # and its centre lies in the upper two-thirds.
    assert 0.02 < region.mean() < 0.4, (rel, region.mean())
    assert rows.mean() < 2 / 3 * g.shape[0], rel


@pytest.mark.parametrize("rel", ["animals/sun.png", "animals/giraffe.webp"])
def test_a_subject_without_a_face_has_no_region(rel):
    assert face_region(_grey(rel), None) is None


def test_a_face_off_the_subject_is_not_the_subjects():
    g = _grey("portraits/daraksha.jpg")
    assert face_region(g, None) is not None
    elsewhere = np.zeros(g.shape, dtype=bool)
    elsewhere[: g.shape[0] // 10, : g.shape[1] // 10] = True  # a corner
    assert face_region(g, elsewhere) is None
