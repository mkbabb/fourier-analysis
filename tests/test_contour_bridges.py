"""Routed connectors, ridge joins, contrast ridges and the jag measure (F.CT refine r5)."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from skimage.morphology import skeletonize

from fourier_analysis.contours.assembly import stroke_wiggle
from fourier_analysis.contours.bridges import route_connectors
from fourier_analysis.contours.features import join_ridges, link_ridges, ridge_contrast
from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.isolation import SubjectIsolation
from fourier_analysis.contours.support import band_px, complex_to_rc, is_closed_trace, subject_band
from fourier_analysis.shortest_tour import build_contour_tour


def _rc_to_z(rc: np.ndarray, shape: tuple[int, int]) -> np.ndarray:
    cy, cx = shape[0] / 2, shape[1] / 2
    return (rc[:, 1] - cx) + 1j * (cy - rc[:, 0])


class TestJoinRidges:
    def test_collinear_pieces_across_small_gaps_join_into_one(self):
        ridges = np.zeros((40, 120), dtype=bool)
        ridges[20, 5:40] = True
        ridges[20, 44:80] = True
        ridges[21, 84:110] = True

        (line,) = join_ridges(link_ridges(ridges), gap_px=6)

        assert {line[0, 1], line[-1, 1]} == {5.0, 109.0}

    def test_a_perpendicular_piece_does_not_join(self):
        ridges = np.zeros((60, 80), dtype=bool)
        ridges[30, 5:40] = True
        ridges[34:55, 43] = True  # starts 4 px off the first piece's end, at 90 degrees

        lines = join_ridges(link_ridges(ridges), gap_px=6)

        assert len(lines) == 2

    def test_a_ring_broken_twice_closes(self):
        yy, xx = np.mgrid[:140, :140]
        theta = np.arctan2(yy - 70, xx - 70)
        ring = np.abs(np.hypot(yy - 70, xx - 70) - 60) < 0.5
        ring &= ~((np.abs(theta) < 0.05) | (np.abs(theta - np.pi / 2) < 0.05))
        pieces = link_ridges(skeletonize(ring))
        assert len(pieces) == 2

        (line,) = join_ridges(pieces, gap_px=8)

        assert is_closed_trace(line)


class TestStrokeWiggle:
    def test_a_short_straight_stroke_is_clean(self):
        assert stroke_wiggle(np.linspace(0, 30, 31) + 0j) < 1e-6

    def test_a_small_round_feature_is_not_jagged_for_being_round(self):
        t = np.linspace(0, np.pi, 80)
        assert stroke_wiggle(15 * np.exp(1j * t)) < 0.01

    def test_a_staircase_is_jagged(self):
        x = np.arange(100.0)
        stair = x + 1j * 2 * ((x // 4) % 2)
        assert stroke_wiggle(stair) > 0.1


def test_ridge_contrast_lifts_a_quiet_edge_above_busy_texture():
    """A faint edge in a smooth patch out-scores a strong edge in a field of equal edges."""
    rng = np.random.default_rng(0)
    magnitude = np.zeros((200, 400))
    magnitude[:, 200:] = 1.0 + 0.2 * rng.standard_normal((200, 200))  # busy texture
    magnitude[100, 40:160] = 0.5  # one quiet edge in smooth skin
    region = np.ones_like(magnitude, dtype=bool)

    contrast = ridge_contrast(magnitude, region, radius=5.0)

    assert contrast[100, 100] > 2 * np.median(contrast[:, 220:380])


def _synthetic(shape=(200, 200)):
    """A disc subject whose interior carries one bright L-shaped edge."""
    h, w = shape
    yy, xx = np.mgrid[:h, :w]
    mask = np.hypot(yy - h / 2, xx - w / 2) < 90
    edge = np.zeros(shape)
    edge[60, 60:140] = 1.0  # the L: across ...
    edge[60:140, 140] = 1.0  # ... and down
    grey = np.zeros(shape)
    image = LoadedImage(
        grayscale=grey,
        detail_grayscale=grey,
        edge_grayscale=grey,
        color_gradient=edge,
        alpha=None,
        alpha_subject_std=None,
        image_area=float(h * w),
        diagonal=float(np.hypot(h, w)),
        source_path=Path("synthetic.png"),
    )
    isolation = SubjectIsolation(
        subject_mask=mask,
        saliency_map=mask.astype(np.float64),
        silhouettes=(),
        silhouette_area=float(mask.sum()),
        subject_band=subject_band(mask),
    )
    return image, isolation


def test_a_long_join_follows_the_edge_instead_of_jumping():
    image, isolation = _synthetic()
    shape = image.grayscale.shape
    # Two strokes at the two ends of the L: the straight join cuts the corner.
    a = _rc_to_z(np.column_stack([np.full(21, 60.0), np.linspace(40, 60, 21)]), shape)
    b = _rc_to_z(np.column_stack([np.linspace(140, 160, 21), np.full(21, 140.0)]), shape)
    straight_gap = abs(a[-1] - b[0])
    assert straight_gap > band_px(shape)

    routed = route_connectors([a, b], isolation, image)

    tour = build_contour_tour(routed, method="mst")  # the iso-contour pipeline's tour
    assert max(tour.gap_lengths) <= 1.0 + 1e-6  # no jump: the join is ink
    ink = np.concatenate([complex_to_rc(c, shape) for c in routed])
    corner = np.hypot(ink[:, 0] - 60, ink[:, 1] - 140).min()
    assert corner < 5.0  # the route turns at the L's corner


def test_a_join_across_featureless_subject_stays_a_connector():
    """With no edge to follow, the minimum-cost path is the straight line: it is
    still accepted (within the detour bound) but never leaves the subject."""
    image, isolation = _synthetic()
    shape = image.grayscale.shape
    a = _rc_to_z(np.column_stack([np.full(11, 170.0), np.linspace(70, 80, 11)]), shape)
    b = _rc_to_z(np.column_stack([np.full(11, 170.0), np.linspace(120, 130, 11)]), shape)

    routed = route_connectors([a, b], isolation, image)

    for c in routed:
        rc = complex_to_rc(c, shape)
        r = np.clip(np.rint(rc[:, 0]).astype(int), 0, shape[0] - 1)
        k = np.clip(np.rint(rc[:, 1]).astype(int), 0, shape[1] - 1)
        assert isolation.subject_band[r, k].all()


class TestChainStrokes:
    def test_two_lids_meeting_at_the_corners_close_into_one_eye(self):
        from fourier_analysis.contours.bridges import chain_strokes

        t = np.linspace(0, np.pi, 60)
        silhouette = 200 * np.exp(1j * np.linspace(0, 2 * np.pi, 400))
        silhouette[-1] = silhouette[0]
        upper = 30 * np.cos(t) + 1j * 12 * np.sin(t)
        lower = (-30 * np.cos(t) - 1j * 10 * np.sin(t)) + 2  # ends 2 px off the corners

        out = chain_strokes([silhouette, upper, lower], gap_px=5)

        assert len(out) == 2
        assert out[0] is silhouette or np.array_equal(out[0], silhouette)
        assert abs(out[1][0] - out[1][-1]) < 1e-9  # one closed lid shape

    def test_strokes_farther_apart_than_the_gap_stay_apart(self):
        from fourier_analysis.contours.bridges import chain_strokes

        a = np.linspace(0, 40, 41) + 0j
        b = np.linspace(60, 100, 41) + 0j

        assert len(chain_strokes([a, b], gap_px=5)) == 2
