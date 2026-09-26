"""Tests for the stroke-graph vectoriser (``contours.strokes``) and the
corner-keeping resampler."""

import numpy as np
import pytest
from skimage.draw import disk as draw_disk, line as draw_line

from fourier_analysis.contours import resample_arc_length
from fourier_analysis.contours.strokes import (
    StrokeGraph,
    edge_length,
    prune_to_budget,
    vectorise,
)
from fourier_analysis.shortest_tour import build_contour_tour


def _thick_line(ink, r0, c0, r1, c1, width=3):
    rr, cc = draw_line(r0, c0, r1, c1)
    for dr in range(-(width // 2), width // 2 + 1):
        for dc in range(-(width // 2), width // 2 + 1):
            ink[np.clip(rr + dr, 0, ink.shape[0] - 1), np.clip(cc + dc, 0, ink.shape[1] - 1)] = 1.0


def _ring(ink, r, c, radius, width=3):
    outer = np.zeros_like(ink, dtype=bool)
    inner = np.zeros_like(ink, dtype=bool)
    outer[draw_disk((r, c), radius + width / 2, shape=ink.shape)] = True
    inner[draw_disk((r, c), radius - width / 2, shape=ink.shape)] = True
    ink[outer & ~inner] = 1.0


def _t_and_ring() -> np.ndarray:
    ink = np.zeros((200, 200))
    _thick_line(ink, 40, 20, 40, 180)  # the bar of a T
    _thick_line(ink, 40, 100, 150, 100)  # its stem
    _ring(ink, 150, 160, 25)
    return ink


class TestVectorise:
    def test_t_junction_and_ring(self):
        g = vectorise(_t_and_ring(), 3.0, bridge=6.0, smooth_sigma=1.5)
        deg = g.degree()
        assert sorted(deg.tolist()).count(3) == 1  # the T's junction
        loops = [e for e in g.edges if e[0] == e[1]]
        assert len(loops) == 1  # the ring, one closed stroke
        assert len(g.components()) == 2
        # The bar's two halves and the stem meet at one shared node.
        j = int(np.flatnonzero(deg == 3)[0])
        assert abs(g.nodes[j][0] - 40) <= 3 and abs(g.nodes[j][1] - 100) <= 3

    def test_strokes_share_junction_points_exactly(self):
        g = vectorise(_t_and_ring(), 3.0, bridge=6.0, smooth_sigma=1.5)
        for a, b, p in g.edges:
            np.testing.assert_array_equal(p[0], g.nodes[a])
            np.testing.assert_array_equal(p[-1], g.nodes[b])

    def test_gap_is_bridged_when_the_stroke_points_at_it(self):
        ink = np.zeros((120, 200))
        _thick_line(ink, 60, 10, 60, 90)
        _thick_line(ink, 60, 97, 60, 190)  # a 6 px break in one line
        g = vectorise(ink, 3.0, bridge=12.0, smooth_sigma=1.5)
        assert len(g.components()) == 1

    def test_small_solid_fill_is_drawn_by_its_outline(self):
        """A pupil or a nose: a compact fill well under ``FILL_MAX_FRACTION``."""
        ink = np.zeros((400, 400))
        ink[draw_disk((200, 200), 15, shape=ink.shape)] = 1.0
        g = vectorise(ink, 3.0, bridge=6.0, smooth_sigma=1.5)
        total = sum(edge_length(p) for _, _, p in g.edges)
        assert total == pytest.approx(2 * np.pi * 13, rel=0.2)

    def test_large_fill_is_tone_and_left_out(self):
        """A mass of shadow (a fifth of the image) is not an object outline."""
        ink = np.zeros((120, 120))
        ink[draw_disk((60, 60), 30, shape=ink.shape)] = 1.0
        g = vectorise(ink, 3.0, bridge=6.0, smooth_sigma=1.5)
        assert sum(edge_length(p) for _, _, p in g.edges) < 10.0

    def test_polylines_are_centred_y_up(self):
        g = StrokeGraph(
            nodes=[np.array([0.0, 0.0]), np.array([0.0, 10.0])],
            edges=[(0, 1, np.array([[0.0, 0.0], [0.0, 10.0]]))],
        )
        (z,) = g.polylines((20, 20))
        assert z[0] == pytest.approx(-10 + 10j)
        assert z[-1] == pytest.approx(0 + 10j)

    def test_tour_walks_the_graph(self):
        g = vectorise(_t_and_ring(), 3.0, bridge=6.0, smooth_sigma=1.5)
        tour = build_contour_tour(g.polylines((200, 200)))
        assert tour.path[0] == tour.path[-1]
        assert len(tour.gap_lengths) == 2  # the one connector, out and back


class TestPruneToBudget:
    def test_short_twigs_go_first_and_parts_stay_whole(self):
        g = vectorise(_t_and_ring(), 3.0, bridge=6.0, smooth_sigma=1.5)
        total = sum(edge_length(p) for _, _, p in g.edges)
        pruned = prune_to_budget(g, total - 1.0, lambda p, length: length)
        assert sum(edge_length(p) for _, _, p in pruned.edges) <= total - 1.0
        # The shortest removable stroke is the ring or a T arm, never a split.
        assert len(pruned.components()) <= len(g.components())


class TestResampleKeepsCorners:
    def test_stroke_tip_is_kept(self):
        z = np.concatenate([np.linspace(0, 100, 1001), np.linspace(100, 0, 1001)[1:]])
        r = resample_arc_length(z.astype(np.complex128), 37)
        assert len(r) == 37
        assert r.real.max() == pytest.approx(100.0)

    def test_square_corners_are_kept(self):
        side = np.linspace(0, 1, 401)[:-1]
        sq = np.concatenate([side, 1 + 1j * side, 1j + (1 - side), 1j * (1 - side), [0]])
        r = resample_arc_length(sq.astype(np.complex128) * 100, 50)
        for corner in (100, 100 + 100j, 100j):
            assert np.min(np.abs(r - corner)) < 1e-9
