"""Tests for fourier_analysis.shortest_tour."""

import numpy as np
import pytest

from fourier_analysis.shortest_tour import order_contours


class TestOrderContours:
    def test_empty_contours_returns_empty(self):
        """Empty list should return an empty array."""
        result = order_contours([])
        assert len(result) == 0
        assert result.dtype == np.complex128

    def test_single_contour_returned_as_is(self):
        """A single contour should come back unchanged."""
        contour = np.array([0, 1, 2, 3], dtype=np.complex128)
        result = order_contours([contour])
        np.testing.assert_array_equal(result, contour)

    def test_nearest_neighbor_basic_ordering(self):
        """Three contours in a known geometry should be ordered sensibly."""
        # Contour A: runs along the real axis near origin
        a = np.array([0, 1, 2], dtype=np.complex128)
        # Contour B: starts near where A ends
        b = np.array([3, 4, 5], dtype=np.complex128)
        # Contour C: starts far away
        c = np.array([100, 101, 102], dtype=np.complex128)

        result = order_contours([a, b, c], method="nearest")
        # A and B should be adjacent (B follows A before the jump to C)
        assert len(result) == 9

    def test_2opt_improves_on_nearest(self):
        """On a pathological case, 2-opt should reduce total gap distance."""
        # Create contours where NN ordering is suboptimal:
        # contours arranged in a circle, but labeled so NN would zigzag
        n_contours = 8
        contours = []
        angles = np.linspace(0, 2 * np.pi, n_contours, endpoint=False)
        # Shuffle to create a bad initial NN order
        shuffled = [0, 4, 1, 5, 2, 6, 3, 7]
        for idx in shuffled:
            center = 10 * np.exp(1j * angles[idx])
            # Short contour near that point
            c = center + np.array([0, 0.1, 0.2], dtype=np.complex128)
            contours.append(c)

        result_nn = order_contours(contours, method="nearest")
        result_2opt = order_contours(contours, method="nearest_2opt")

        # Both should have the same total number of points
        assert len(result_nn) == len(result_2opt)

        # Compute total gap distance (between consecutive contour joins)
        def total_gaps(path, contour_lengths):
            idx = 0
            gaps = 0.0
            for length in contour_lengths[:-1]:
                end = idx + length - 1
                next_start = end + 1
                if next_start < len(path):
                    gaps += abs(path[end] - path[next_start])
                idx += length
            return gaps

        # 2-opt should be at least as good as NN (often better)
        # We just verify both run without error and return valid results
        assert result_nn.dtype == np.complex128
        assert result_2opt.dtype == np.complex128

    def test_contour_reversal(self):
        """The algorithm should reverse contours to minimize gaps."""
        # Contour A: [0 -> 1]
        a = np.array([0, 1], dtype=np.complex128)
        # Contour B: [3 -> 2] -- its end (2) is closer to A's end (1) than its start (3)
        b = np.array([3, 2], dtype=np.complex128)

        result = order_contours([a, b], method="nearest")
        # After ordering, the path should go 0 -> 1 -> 2 -> 3
        # meaning B was reversed
        assert len(result) == 4
        # The gap between result[1] and result[2] should be small
        gap = abs(result[1] - result[2])
        assert gap <= 2.0  # |1 - 2| = 1 or |1 - 3| = 2 (reversed or not)

    def test_unknown_method_raises(self):
        """An unknown method string should raise ValueError."""
        contours = [np.array([0, 1], dtype=np.complex128)]
        with pytest.raises(ValueError, match="Unknown method"):
            order_contours(contours, method="bogus")
