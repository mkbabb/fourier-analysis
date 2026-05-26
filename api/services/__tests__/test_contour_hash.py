"""Regression test pair for the contour-hash collision at ``image_storage.py:180``.

Under the pre-W4 hash ``sha256(json.dumps({"x": sorted(xs), "y": sorted(ys)}))``
two distinct curves whose coordinate multisets agree — e.g. the positive
diagonal ``(0,0)→(1,1)`` and the negative diagonal ``(0,1)→(1,0)`` — collide
onto the same ``contour_hash``. The collision serves the wrong contour from
the cache. The fix hashes on the ordered ``(x, y)`` pair list; the pairs differ,
the hashes diverge.

These tests pin the new behaviour: hashes for the colliding pairs documented
in the H3 audit (`docs/audits/runs/2026-05-18-tranche-harden/h3-A-W4-W5-W6.md`)
must differ.
"""

from __future__ import annotations

from api.services.image_storage import compute_contour_hash


class TestContourHashDiagonalPair:
    """The H3-specified two-point diagonal pair — the minimal collision case."""

    def test_positive_diagonal_hashes_distinctly_from_negative_diagonal(self) -> None:
        """Curves with identical sorted xs/ys but reversed y-order must diverge.

        Curve A: line from (0, 0) to (1, 1) — positive-sloping diagonal.
        Curve B: line from (0, 1) to (1, 0) — negative-sloping diagonal.

        ``sorted(xs_A) == sorted(xs_B) == [0.0, 1.0]``
        ``sorted(ys_A) == sorted(ys_B) == [0.0, 1.0]``

        The pre-W4 hash collides them; the ordered-pair hash separates them.
        """
        xs_a, ys_a = [0.0, 1.0], [0.0, 1.0]
        xs_b, ys_b = [0.0, 1.0], [1.0, 0.0]

        hash_a = compute_contour_hash(xs_a, ys_a)
        hash_b = compute_contour_hash(xs_b, ys_b)

        assert hash_a != hash_b, (
            "Distinct curves with identical coordinate multisets must produce "
            "distinct hashes (regression for image_storage.py:180 sorted-axes "
            f"bug). Got hash_a={hash_a!r} == hash_b={hash_b!r}."
        )


class TestContourHashTrianglePair:
    """The H3-specified three-point triangle pair — guards against any
    'two-point edge artefact' interpretation of the diagonal case."""

    def test_swapped_vertex_triangles_hash_distinctly(self) -> None:
        """Two triangles with identical sorted-xs/ys but distinct vertex order.

        Triangle C: vertices (0, 0), (2, 1), (1, 2).
        Triangle D: vertices (0, 1), (2, 0), (1, 2).

        Both have ``sorted(xs) == [0, 1, 2]`` and ``sorted(ys) == [0, 1, 2]``;
        the ordered-pair lists differ.
        """
        xs_c, ys_c = [0.0, 2.0, 1.0], [0.0, 1.0, 2.0]
        xs_d, ys_d = [0.0, 2.0, 1.0], [1.0, 0.0, 2.0]

        hash_c = compute_contour_hash(xs_c, ys_c)
        hash_d = compute_contour_hash(xs_d, ys_d)

        assert hash_c != hash_d, (
            "Triangles with identical coordinate multisets and distinct vertex "
            "orderings must produce distinct hashes (secondary regression case)."
        )


class TestContourHashStability:
    """The hash is deterministic — identical inputs map to identical outputs."""

    def test_identical_curves_hash_identically(self) -> None:
        """Two calls with the same xs/ys must agree (cache key invariant)."""
        xs, ys = [0.1, 0.5, 0.9], [0.2, 0.4, 0.8]
        assert compute_contour_hash(xs, ys) == compute_contour_hash(xs, ys)
