"""Tests for fourier_analysis.shortest_tour (the minimum-retrace postman tour)."""

import numpy as np
import pytest

from fourier_analysis.shortest_tour import ContourTour, build_contour_tour


def _circle(center: complex, radius: float, n: int = 64, phase: float = 0.0) -> np.ndarray:
    t = np.linspace(0, 2 * np.pi, n, endpoint=False) + phase
    z = center + radius * np.exp(1j * t)
    return np.append(z, z[0]).astype(np.complex128)


def _connectors(tour: ContourTour) -> list[tuple[complex, complex]]:
    pieces = tour.ordered_contours
    return [(pieces[i][-1], pieces[i + 1][0]) for i in range(len(pieces) - 1)]


def _undirected(segments):
    return {tuple(sorted(((a.real, a.imag), (b.real, b.imag)))) for a, b in segments}


def _mst_max_edge(contours) -> float:
    """Kruskal over the brute-force minimum inter-contour distances."""
    n = len(contours)
    edges = sorted(
        (float(np.min(np.abs(contours[i][:, None] - contours[j][None, :]))), i, j)
        for i in range(n)
        for j in range(i + 1, n)
    )
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    longest = 0.0
    for w, i, j in edges:
        ri, rj = find(i), find(j)
        if ri != rj:
            parent[ri] = rj
            longest = max(longest, w)
    return longest


def _face() -> list[np.ndarray]:
    """A silhouette with nested features (eyes, mouth) plus an open stroke."""
    return [
        _circle(0, 100, 256),
        _circle(-35 + 30j, 12, 48, phase=2.0),
        _circle(35 + 30j, 12, 48, phase=4.0),
        _circle(-35 + 30j, 4, 24, phase=1.0),  # a pupil inside an eye
        np.linspace(-40 - 40j, 40 - 40j, 30).astype(np.complex128),  # an open mouth line
        _circle(0 - 5j, 6, 24, phase=3.0),
    ]


def _ink(tour: ContourTour) -> float:
    return sum(float(np.abs(np.diff(p)).sum()) for p in tour.ordered_contours)


class TestBuildContourTour:
    def test_empty_contours_returns_empty(self):
        tour = build_contour_tour([])
        assert len(tour.path) == 0
        assert tour.path.dtype == np.complex128
        assert tour.ordered_contours == ()
        assert tour.gap_lengths == ()

    def test_single_closed_loop_traced_once(self):
        loop = _circle(0, 10, 32)
        tour = build_contour_tour([loop])
        assert tour.gap_lengths == ()
        assert tour.path[0] == tour.path[-1]
        assert _ink(tour) == pytest.approx(float(np.abs(np.diff(loop)).sum()))

    def test_single_open_stroke_is_out_and_back(self):
        contour = np.array([0, 1, 2, 3], dtype=np.complex128)
        tour = build_contour_tour([contour])
        assert tour.gap_lengths == ()
        assert tour.path[0] == tour.path[-1]
        assert _ink(tour) == pytest.approx(6.0)

    def test_unknown_method_raises(self):
        with pytest.raises(ValueError, match="Unknown method"):
            build_contour_tour([np.array([0, 1], dtype=np.complex128)], method="mst")

    def test_contour_tour_is_frozen(self):
        tour = build_contour_tour([np.array([0, 1], dtype=np.complex128)])
        with pytest.raises(AttributeError):
            tour.path = np.array([])  # type: ignore[misc]

    def test_tour_is_exactly_closed(self):
        tour = build_contour_tour(_face())
        assert tour.path[0] == tour.path[-1]

    def test_path_is_pieces_concatenated(self):
        tour = build_contour_tour(_face())
        np.testing.assert_array_equal(tour.path, np.concatenate(tour.ordered_contours))
        assert len(tour.gap_lengths) == len(tour.ordered_contours) - 1
        for (a, b), g in zip(_connectors(tour), tour.gap_lengths):
            assert g == pytest.approx(abs(a - b))

    def test_every_contour_drawn(self):
        contours = _face()
        tour = build_contour_tour(contours)
        path_pts = set(tour.path.tolist())
        for c in contours:
            assert set(c.tolist()) <= path_pts

    def test_connectors_no_longer_than_the_mst(self):
        contours = _face()
        tour = build_contour_tour(contours)
        assert max(tour.gap_lengths) <= _mst_max_edge(contours) + 1e-9

    def test_children_enter_at_nearest_point(self):
        """A loop is joined where it is nearest its neighbour, not at its seam."""
        outer = _circle(0, 100, 360)
        inner = _circle(0, 90, 360, phase=np.pi)  # seam on the far side
        tour = build_contour_tour([outer, inner])
        assert max(tour.gap_lengths) == pytest.approx(10.0, abs=0.5)

    def test_touching_contours_join_with_zero_connector(self):
        a = _circle(0, 10, 32)
        b = _circle(20, 10, 32, phase=np.pi)  # touches a at z=10
        tour = build_contour_tour([a, b])
        assert tour.gap_lengths == ()  # touching components are joined, not jumped
        assert tour.path[0] == tour.path[-1]


class TestPostman:
    def test_shared_junctions_need_no_jump(self):
        """Strokes that share a vertex are one graph: walked without a jump."""
        a = np.linspace(0, 100, 101).astype(np.complex128)
        b = np.array([50 + 0j, 50 + 30j, 50 + 60j])
        tour = build_contour_tour([a, b])
        assert tour.gap_lengths == ()
        assert tour.path[0] == tour.path[-1]

    def test_minimum_retrace_on_a_t(self):
        """A T (3 dead ends + a junction) is drawn with the least retrace: the
        two shortest arms, once more each."""
        a = np.linspace(0, 100, 101).astype(np.complex128)
        b = np.array([50 + 0j, 50 + 30j, 50 + 60j])
        tour = build_contour_tour([a, b])
        # Ink 160; odd nodes 0, 100, 50, 50+60j; best pairing retraces 160.
        assert _ink(tour) == pytest.approx(320.0)

    def test_eulerian_graph_has_no_retrace(self):
        """Two loops crossing at a shared vertex (a figure eight) are drawn
        exactly once each."""
        left = _circle(-10, 10, 64)  # passes through 0 at its phase-0 point
        right = _circle(10, 10, 64, phase=np.pi)
        right[0] = right[-1] = left[0] = left[-1] = 0j  # the shared vertex, exactly
        tour = build_contour_tour([left, right])
        loops = float(np.abs(np.diff(left)).sum() + np.abs(np.diff(right)).sum())
        assert tour.gap_lengths == ()
        assert _ink(tour) == pytest.approx(loops)

    def test_retrace_coincides_with_its_stroke(self):
        """Every retraced segment lies exactly on ink the input drew."""
        a = np.linspace(0, 100, 101).astype(np.complex128)
        b = np.array([50 + 0j, 50 + 30j, 50 + 60j])
        tour = build_contour_tour([a, b])
        assert set(tour.path.tolist()) <= set(a.tolist()) | set(b.tolist())
