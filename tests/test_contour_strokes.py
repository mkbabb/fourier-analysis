"""The stroke graph (``contours.strokes``), the layers composed into it
(``contours.drawing``) and the part map (``contours.parts``).

``portraits/daraksha.jpg`` is the primary sample (F.CT addendum (b))."""

from pathlib import Path

import numpy as np

import pytest

from fourier_analysis.contours.strokes import (
    CONNECT,
    LINES,
    PARTS,
    SILHOUETTE,
    Edge,
    StrokeGraph,
    boundary_graph,
    merge_twins,
    prune_to_budget,
    smooth_edges,
)
from fourier_analysis.shortest_tour import build_contour_tour

ASSETS = Path(__file__).resolve().parents[1] / "assets"


def boundary_strokes(labels: np.ndarray, drawn: np.ndarray) -> list[np.ndarray]:
    return boundary_graph(labels, drawn).polylines(labels.shape)


def _all_drawn(n: int) -> np.ndarray:
    return ~np.eye(n, dtype=bool)


def test_shared_boundary_is_one_stroke():
    """Two parts side by side on a background: their shared border is drawn
    once, not as two parallel traces."""
    lab = np.zeros((200, 300), np.int32)
    lab[50:150, 50:150] = 1
    lab[50:150, 150:250] = 2
    strokes = boundary_strokes(lab, _all_drawn(3))
    # The middle border x = 150 (pipeline x = 0) is covered by exactly one stroke.
    near_mid = [s for s in strokes if np.mean(np.abs(s.real - (150 - 0.5 - 150))) < 2]
    assert len(near_mid) == 1
    ends = np.array([[s[0], s[-1]] for s in strokes]).ravel()
    # Three-part junctions are shared stroke ends.
    uniq = np.unique(np.round(ends, 6))
    assert len(uniq) < len(ends)


def test_junction_graph_walks_without_jumps():
    lab = np.zeros((200, 300), np.int32)
    lab[50:150, 50:150] = 1
    lab[50:150, 150:250] = 2
    tour = build_contour_tour(boundary_strokes(lab, _all_drawn(3)))
    assert tour.gap_lengths == ()
    assert tour.path[0] == tour.path[-1]


def test_undrawn_pairs_are_not_strokes():
    lab = np.zeros((100, 100), np.int32)
    lab[20:80, 20:80] = 1
    drawn = np.zeros((2, 2), bool)
    assert boundary_strokes(lab, drawn) == []


def test_boundaries_never_run_along_the_frame():
    """A part cropped by the frame gives open strokes that meet it square-on."""
    lab = np.zeros((100, 100), np.int32)
    lab[40:, 30:70] = 1  # runs off the bottom edge
    strokes = boundary_strokes(lab, _all_drawn(2))
    pts = np.concatenate(strokes)
    assert np.max(-pts.imag) < 50  # no ink beyond the bottom frame
    on_bottom = np.abs(pts.imag + 50) < 1.0
    assert on_bottom.sum() <= 4  # only the two stroke ends touch it


# ---------------------------------------------------------------------------
# Smoothing, pruning, dedupe
# ---------------------------------------------------------------------------


def _three_parts() -> np.ndarray:
    """Two parts on a background, split by a diagonal: a crack staircase."""
    lab = np.zeros((200, 200), np.int32)
    yy, xx = np.mgrid[:200, :200]
    box = (yy >= 40) & (yy < 160) & (xx >= 40) & (xx < 160)
    lab[box & (yy > xx)] = 1
    lab[box & (yy <= xx)] = 2
    return lab


def test_crack_boundaries_are_smoothed_with_junctions_pinned():
    """The diagonal between two parts is traced on pixel cracks (a staircase
    half a pixel deep) and comes out as a straight stroke; every stroke still
    starts and ends exactly on its junction node, so the graph stays exact."""
    graph = boundary_graph(_three_parts(), _all_drawn(3))
    for e in graph.edges:
        assert np.array_equal(e.pts[0], graph.nodes[e.u])
        assert np.array_equal(e.pts[-1], graph.nodes[e.v])
    diagonal = [e for e in graph.edges if e.layer == PARTS]
    assert len(diagonal) == 1
    pts = diagonal[0].pts[5:-5]  # clear of the junction corners
    off_line = np.abs(pts[:, 0] - pts[:, 1]) / np.sqrt(2.0)
    assert off_line.max() < 0.75  # the raw staircase swings a full pixel
    heading = np.unwrap(np.arctan2(*np.diff(pts, axis=0).T))
    assert np.abs(np.diff(heading)).max() < np.deg2rad(20)  # no 90-degree steps
    # Junctions are shared: three strokes meet at each end of the diagonal.
    assert sorted(graph.degree().tolist()) == [3, 3]
    assert {e.layer for e in graph.edges} == {SILHOUETTE, PARTS}


def test_smooth_edges_keeps_stroke_ends_on_their_nodes():
    t = np.linspace(0, 1, 120)
    zig = np.column_stack([100 * t, 3.0 * np.sign(np.sin(40 * np.pi * t))])
    graph = StrokeGraph([zig[0].copy(), zig[-1].copy()], [Edge(0, 1, zig, LINES)])
    out = smooth_edges(graph, 4.0)
    (e,) = out.edges
    assert np.array_equal(e.pts[0], graph.nodes[0]) and np.array_equal(e.pts[-1], graph.nodes[1])
    assert np.abs(e.pts[10:-10, 1]).max() < 1.0  # the zigzag is gone


def _line(a, b, n=50) -> np.ndarray:
    return np.linspace(np.asarray(a, float), np.asarray(b, float), n)


def test_budget_pruning_drops_twigs_first_and_never_the_protected():
    """A protected loop with a long line and a short twig on it: over budget,
    the twig goes first; the loop is never dropped, whatever the budget."""
    ring_t = np.linspace(0, 2 * np.pi, 200)
    ring = np.column_stack([100 + 50 * np.sin(ring_t), 100 + 50 * np.cos(ring_t)])
    ring[-1] = ring[0]
    nodes = [ring[0].copy(), np.array([100.0, 300.0]), np.array([130.0, 150.0])]
    twig_base = ring[0]
    graph = StrokeGraph(
        nodes,
        [
            Edge(0, 0, ring, SILHOUETTE),
            Edge(0, 1, _line(twig_base, nodes[1]), LINES),  # 150 px
            Edge(0, 2, _line(twig_base, nodes[2]), LINES),  # 30 px
        ],
    )

    def salience(e: Edge) -> float:
        return np.inf if e.layer != LINES else e.length

    total = sum(e.length for e in graph.edges)
    one_gone = prune_to_budget(graph, total - 10.0, salience)
    assert sorted(round(e.length) for e in one_gone.edges if e.layer == LINES) == [150]
    all_gone = prune_to_budget(graph, 1.0, salience)
    assert [e.layer for e in all_gone.edges] == [SILHOUETTE]
    assert all_gone.edges[0].length == pytest.approx(graph.edges[0].length)


def test_pruning_floor_drops_weak_strokes_even_under_budget():
    nodes = [np.array([0.0, 0.0]), np.array([0.0, 200.0]), np.array([20.0, 100.0])]
    graph = StrokeGraph(
        nodes,
        [
            Edge(0, 1, _line(nodes[0], nodes[1]), LINES),
            Edge(2, 2, np.array([[20.0, 100.0], [25.0, 105.0], [20.0, 110.0], [20.0, 100.0]]), LINES),
        ],
    )
    kept = prune_to_budget(graph, 1e9, lambda e: e.length, floor=50.0)
    assert [round(e.length) for e in kept.edges] == [200]
    assert len(prune_to_budget(graph, 1e9, lambda e: e.length).edges) == 2


def test_pruning_never_disconnects_a_component():
    """A stroke whose removal would split its component (a cut edge that is
    not a twig) stays, however weak: two loops joined by a short link."""
    t = np.linspace(0, 2 * np.pi, 100)

    def ring(cx: float) -> np.ndarray:
        r = np.column_stack([50 + 30 * np.sin(t), cx + 30 * np.cos(t)])
        r[-1] = r[0]
        return r

    a, b = ring(50.0), ring(150.0)
    link = _line(a[0], b[50], 10)
    link[0], link[-1] = a[0], b[50]
    graph = StrokeGraph(
        [a[0].copy(), b[50].copy()],
        [Edge(0, 0, a, SILHOUETTE), Edge(1, 1, b, SILHOUETTE), Edge(0, 1, link, LINES)],
    )
    out = prune_to_budget(graph, 1.0, lambda e: np.inf if e.layer != LINES else e.length, floor=1e9)
    assert len(out.edges) == 3


def test_a_line_that_doubles_earlier_ink_gives_way():
    """Layer dedupe: a learned line running beside the silhouette along its
    length is the same edge drawn twice and is dropped; one crossing it is not."""
    from fourier_analysis.contours.drawing import drop_doubles
    from fourier_analysis.contours.strokes import rasterize

    outline = StrokeGraph(
        [np.array([100.0, 20.0]), np.array([100.0, 280.0])],
        [Edge(0, 1, _line([100, 20], [100, 280], 300), SILHOUETTE)],
    )
    earlier = rasterize(outline, (200, 300))
    lines = StrokeGraph(
        [np.array([104.0, 40.0]), np.array([104.0, 260.0]), np.array([20.0, 150.0]), np.array([180.0, 150.0])],
        [
            Edge(0, 1, _line([104, 40], [104, 260], 250), LINES),  # 4 px beside the outline
            Edge(2, 3, _line([20, 150], [180, 150], 200), LINES),  # crosses it
        ],
    )
    kept = drop_doubles(lines, earlier, reach=6.0)
    assert len(kept.edges) == 1
    assert abs(kept.edges[0].pts[0, 1] - 150.0) < 1e-9


def _arc(bow: float, n: int = 101) -> np.ndarray:
    """A stroke from (0, 0) to (100, 0), bowed sideways by ``bow`` at its middle."""
    t = np.linspace(0.0, 1.0, n)
    return np.column_stack([100.0 * t, bow * np.sin(np.pi * t)])


def test_a_doubled_strand_merges_to_one_line():
    """Two strokes joining the same two nodes within a line width or so of
    each other are one line drawn twice: one goes.  Two strokes as far apart
    as an eye's lids are two lines and both stay."""
    ends = [np.array([0.0, 0.0]), np.array([100.0, 0.0])]
    twin = StrokeGraph([e.copy() for e in ends], [Edge(0, 1, _arc(0.0), LINES), Edge(0, 1, _arc(2.5), LINES)])
    assert len(merge_twins(twin, width=2.0).edges) == 1
    lids = StrokeGraph([e.copy() for e in ends], [Edge(0, 1, _arc(-15.0), LINES), Edge(0, 1, _arc(15.0), LINES)])
    assert len(merge_twins(lids, width=2.0).edges) == 2


def test_a_compact_closed_stroke_is_a_shape_and_a_sliver_is_not():
    from fourier_analysis.contours.drawing import is_shape

    t = np.linspace(0.0, 2.0 * np.pi, 121)
    ring = np.column_stack([10.0 * np.cos(t), 10.0 * np.sin(t)])
    sliver = np.column_stack([60.0 * np.cos(t), 2.0 * np.sin(t)])
    assert is_shape(Edge(0, 0, ring, LINES))
    assert not is_shape(Edge(0, 0, sliver, LINES))
    assert not is_shape(Edge(0, 1, ring[:60], LINES))  # an open stroke is never a shape


def test_a_stroke_is_not_counted_as_its_own_neighbour():
    """``self_density`` is a stroke's own share of the stroke density along
    it: 1 for a straight stroke, about 2 where it runs back beside itself (a
    hairpin, the two sides of a narrow loop), so that share can be taken off
    and only *other* strokes make a mesh."""
    from fourier_analysis.contours.drawing import self_density

    straight = _line([0, 0], [0, 400], 400)
    assert self_density(straight, 10.0) == pytest.approx(1.0, abs=0.1)
    hairpin = np.vstack([_line([0, 0], [0, 400], 400), _line([4, 400], [4, 0], 400)])
    assert self_density(hairpin, 10.0) == pytest.approx(2.0, abs=0.25)


# ---------------------------------------------------------------------------
# Parts
# ---------------------------------------------------------------------------


def test_iris_is_a_disc_clipped_by_the_lids():
    """A synthetic eye: an almond opening with a dark disc in it.  The iris is
    labelled on the disc, inside the eye; a uniformly lit eye has none."""
    from fourier_analysis.contours.parts import EYES, IRIS, SKIN, irises

    h, w = 80, 160
    yy, xx = np.mgrid[:h, :w]
    eye = ((xx - 80) / 50.0) ** 2 + ((yy - 40) / 14.0) ** 2 <= 1.0
    labels = np.where(eye, EYES[0], SKIN).astype(np.int32)
    lab = np.full((h, w, 3), 0.5)
    lab[..., 0] = np.where(eye, 0.9, 0.6)
    disc = (xx - 95) ** 2 + (yy - 40) ** 2 <= 18**2
    lab[..., 0][eye & disc] = 0.15

    out = irises(labels, lab)
    iris = out == IRIS
    assert iris.any() and not (iris & ~eye).any()  # clipped by the lids
    cy, cx = np.argwhere(iris).mean(axis=0)
    assert abs(cx - 95) < 5 and abs(cy - 40) < 4
    assert (iris & disc).sum() >= 0.8 * iris.sum()
    assert (out[eye & ~iris] == EYES[0]).all()

    flat = lab.copy()
    flat[..., 0] = np.where(eye, 0.9, 0.6)
    assert not (irises(labels, flat) == IRIS).any()


@pytest.fixture(scope="module")
def daraksha():
    from fourier_analysis.contours.drawing import draw_subject
    from fourier_analysis.contours.image import load_image_inputs
    from fourier_analysis.contours.isolation import subject_mask
    from fourier_analysis.contours.models import ContourConfig
    from fourier_analysis.contours.parts import part_labels

    config = ContourConfig().normalized()
    image = load_image_inputs(ASSETS / "portraits" / "daraksha.jpg", config)
    mask, _ = subject_mask(image, config)
    return part_labels(image, mask), draw_subject(image, config)


def test_daraksha_has_her_named_face_parts(daraksha):
    """The primary sample: one confirmed face with skin, both brows, both
    eyes, the nose, the lower lip and the hair, and an iris in each eye (her
    upper lip, a sliver in her smile, is drawn as one line: see
    ``test_daraksha_brows_are_strokes_and_the_thin_upper_lip_one_line``)."""
    from scipy import ndimage as ndi

    from fourier_analysis.contours.parts import EYES, FACE_CLASSES, HAIR, IRIS, NOSE, SKIN

    parts, _ = daraksha
    assert parts.source == "face-parsing"
    assert len(parts.faces) == 1
    present = set(np.unique(parts.labels).tolist())
    name = {n: i for i, n in enumerate(FACE_CLASSES)}
    wanted = {SKIN, NOSE, HAIR, IRIS, name["l_brow"], name["r_brow"], name["l_lip"], *EYES}
    assert wanted <= present, {FACE_CLASSES[i] if i < len(FACE_CLASSES) else i for i in wanted - present}
    irises, n_irises = ndi.label(parts.labels == IRIS)
    assert n_irises == 2
    beside_eye = ndi.binary_dilation(np.isin(parts.labels, EYES), iterations=2)
    for k in (1, 2):  # each iris sits in an eye, with white left beside it
        assert (beside_eye & (irises == k)).any()


def test_daraksha_drawing_has_the_centre_part(daraksha):
    """The learned line layer draws the hair's centre part: a line in the
    hair, above the face, within the middle third of the face box, running
    more down than across.  The face's material parts (brows, lids, lips) are
    drawn by the parser alone."""
    from fourier_analysis.contours.parts import HAIR

    parts, drawing = daraksha
    assert drawing is not None and drawing.source == "face-parsing"
    x, y, w, h = parts.faces[0].box
    lines = [e.pts for e in drawing.graph.edges if e.layer == LINES]
    assert lines
    hair = parts.labels == HAIR
    found = False
    for pts in lines:
        r = np.clip(np.rint(pts[:, 0]).astype(int), 0, hair.shape[0] - 1)
        c = np.clip(np.rint(pts[:, 1]).astype(int), 0, hair.shape[1] - 1)
        assert parts.face_core[r, c].mean() < 0.2  # no learned line on a face part
        rows, cols = np.ptp(pts[:, 0]), np.ptp(pts[:, 1])
        in_middle = abs(pts[:, 1].mean() - (x + w / 2)) < w / 6
        if hair[r, c].mean() > 0.7 and pts[:, 0].mean() < y + h / 4 and in_middle and rows > cols and rows > 0.05 * h:
            found = True
    assert found
    assert {e.layer for e in drawing.graph.edges} <= {SILHOUETTE, PARTS, LINES, CONNECT}
    assert {SILHOUETTE, PARTS, LINES} <= {e.layer for e in drawing.graph.edges}


def test_daraksha_drawing_is_one_figure_with_teeth_and_a_drawn_nose(daraksha):
    """The drawing is one connected figure (its pieces joined by routed
    connectors on the subject, so the tour needs no jump); the open mouth is
    split into teeth; the nose is drawn by part of its outline (its lower
    bridge down the shadowed side, and its base), not as a closed balloon."""
    from fourier_analysis.contours.parts import NOSE, TEETH

    parts, drawing = daraksha
    assert len(drawing.graph.components()) == 1
    assert (parts.labels == TEETH).any()
    for e in drawing.graph.edges:
        if e.layer == CONNECT:
            r = np.clip(np.rint(e.pts[:, 0]).astype(int), 0, parts.labels.shape[0] - 1)
            c = np.clip(np.rint(e.pts[:, 1]).astype(int), 0, parts.labels.shape[1] - 1)
            assert parts.subject[r, c].mean() > 0.9
    tour = build_contour_tour(drawing.strokes)
    assert tour.gap_lengths == ()
    nose = parts.labels == NOSE
    from scipy import ndimage as ndi

    rim = ndi.binary_dilation(nose, iterations=2) & ~ndi.binary_erosion(nose, iterations=2)
    on_rim = np.zeros(nose.shape, bool)
    for e in drawing.graph.edges:
        r = np.clip(np.rint(e.pts[:, 0]).astype(int), 0, nose.shape[0] - 1)
        c = np.clip(np.rint(e.pts[:, 1]).astype(int), 0, nose.shape[1] - 1)
        on_rim[r, c] = True
    # The bridge's root (its top fifth, between the brows) is not drawn on
    # either side (drawn, it runs on into the brow as a scowl); the bridge is
    # drawn down one side into the wing (no balloon over the bridge).
    rows, cols = np.nonzero(nose)
    row = np.arange(nose.shape[0])[:, None]
    root = rows.min() + 0.2 * np.ptp(rows)
    mid = rows.min() + 0.5 * np.ptp(rows)
    drawn = ndi.binary_dilation(on_rim, iterations=2)

    def shares(band):
        left = band & (np.arange(nose.shape[1])[None, :] < cols.mean())
        right = band & ~left
        return sorted([(drawn & left).sum() / max(1, left.sum()), (drawn & right).sum() / max(1, right.sum())])

    top = shares(rim & (row < root - 2))
    assert top[1] < 0.2, top
    bridge = shares(rim & (row >= root + 2) & (row < mid))
    assert bridge[1] > 0.4 and bridge[0] < 0.2, bridge
    lower = shares(rim & (row >= mid) & (row < mid + 0.2 * np.ptp(rows)))
    assert lower[1] > 0.4, lower


def test_teeth_are_the_bright_band_of_an_open_mouth():
    """A synthetic open mouth: a bright band of teeth (with dark gaps between
    the teeth) over a dark interior.  The teeth come out as one band, inside
    the mouth; a uniformly dark mouth has none."""
    from fourier_analysis.contours.parts import MOUTH, SKIN, TEETH, teeth

    h, w = 80, 200
    yy, xx = np.mgrid[:h, :w]
    mouth = ((xx - 100) / 80.0) ** 2 + ((yy - 40) / 25.0) ** 2 <= 1.0
    labels = np.where(mouth, MOUTH, SKIN).astype(np.int32)
    lab = np.full((h, w, 3), 0.5)
    band = mouth & (yy < 40)
    lab[..., 0] = np.where(band, 0.9, 0.15)
    lab[..., 0][band & (xx % 16 == 0)] = 0.2  # the gaps between teeth
    out = teeth(labels, lab, min_area=36.0)
    t = out == TEETH
    assert t.any() and not (t & ~mouth).any()
    from scipy import ndimage as ndi

    assert ndi.label(t)[1] == 1  # one band, not tooth by tooth
    assert (t & band).sum() >= 0.8 * t.sum() and t.sum() >= 0.7 * band.sum()
    # The dark around the teeth goes to the parts around it: no pocket of
    # it is left to be drawn as a blot at the mouth's corners.
    assert not (out == MOUTH).any()

    dark = lab.copy()
    dark[..., 0] = np.where(mouth, 0.15, 0.6)
    closed = teeth(labels, dark, min_area=36.0)
    assert not (closed == TEETH).any() and (closed[mouth] == MOUTH).all()


def test_marked_runs_keep_only_where_the_image_draws_a_line():
    """A stroke half along a strong colour step and half across flat colour:
    only the half the image marks is kept, with its end on the old node."""
    from fourier_analysis.contours.drawing import CONTRAST_DELTA_E, marked_runs

    h, w = 60, 200
    lab = np.zeros((h, w, 3))
    lab[..., 0] = 50.0
    lab[:30, :100, 0] = 50.0 + 2 * CONTRAST_DELTA_E  # an edge along row 30, left half only
    g = StrokeGraph()
    a, b = g.add_node(np.array([30.0, 10.0])), g.add_node(np.array([30.0, 190.0]))
    g.edges.append(Edge(a, b, np.column_stack([np.full(181, 30.0), np.arange(10.0, 191.0)]), PARTS))
    out = marked_runs(g, lab, 2.0, 20.0)
    assert len(out.edges) == 1
    pts = out.edges[0].pts
    assert pts[:, 1].min() <= 11 and 85 <= pts[:, 1].max() <= 110


def test_form_lines_on_the_skin_must_reach_the_nose():
    """On the face's skin, learned ink is kept only where it reaches the nose
    (a nostril wing, a crease from it); an eye bag elsewhere goes; ink off
    the skin is untouched."""
    from fourier_analysis.contours.drawing import form_lines

    h, w = 100, 100
    form = np.zeros((h, w), bool)
    form[10:90, 10:90] = True
    nose = np.zeros((h, w), bool)
    nose[40:60, 45:55] = True
    ink = np.zeros((h, w), bool)
    ink[60, 30:52] = True  # a crease reaching the nose
    ink[25, 20:40] = True  # an eye bag
    ink[95, 10:90] = True  # off the face
    out = form_lines(ink, form, nose, 2.0)
    assert out[60, 30:52].all() and not out[25, 20:40].any() and out[95, 10:90].all()


def test_connectors_follow_the_lines_of_the_image():
    """Two separate strokes, and a faint image line that runs from one to the
    other by a detour: the routed connector follows the line, not the straight
    gap, and the drawing becomes one figure."""
    from fourier_analysis.contours.drawing import route_connectors

    h, w = 120, 120
    g = StrokeGraph()
    for r in (20.0, 100.0):
        a, b = g.add_node(np.array([r, 20.0])), g.add_node(np.array([r, 60.0]))
        g.edges.append(Edge(a, b, np.column_stack([np.full(41, r), np.arange(20.0, 61.0)]), LINES))
    strength = np.zeros((h, w))
    strength[20:101, 90] = 0.45  # a faint line on the right ...
    strength[20, 60:91] = 0.45
    strength[100, 60:91] = 0.45  # ... joined to both strokes' right ends
    out = route_connectors(g, strength, np.ones((h, w), bool))
    assert len(out.components()) == 1
    conn = [e for e in out.edges if e.layer == CONNECT]
    assert len(conn) == 1
    assert np.abs(conn[0].pts[:, 1] - 90).min() < 3 and conn[0].pts[:, 1].max() > 85


@pytest.mark.parametrize("rel", ["animals/golden-retriever.webp", "animals/sponge-happy.JPG"])
def test_no_face_is_found_on_an_animal_or_a_cartoon(rel: str):
    """A subject with no human face has no parts: its silhouette comes from
    the mask and its interior from the line layer."""
    from fourier_analysis.contours.image import load_image_inputs
    from fourier_analysis.contours.isolation import subject_mask
    from fourier_analysis.contours.models import ContourConfig
    from fourier_analysis.contours.parts import BACKGROUND, UNPARSED, part_labels

    config = ContourConfig().normalized()
    image = load_image_inputs(ASSETS / rel, config)
    mask, _ = subject_mask(image, config)
    parts = part_labels(image, mask)
    assert parts.source == "silhouette" and parts.faces == ()
    assert set(np.unique(parts.labels).tolist()) <= {BACKGROUND, UNPARSED}
    assert not parts.face_core.any()


def test_person_cut_removes_what_stands_beside_the_sitter():
    """``human.png``: the saliency keeps a plant leaf against the sitter's
    cheek; with a confirmed face the subject is cut to the person, so the
    leaf goes and the sitter stays whole."""
    from scipy import ndimage as ndi

    from fourier_analysis.contours.image import load_image_inputs
    from fourier_analysis.contours.isolation import subject_mask
    from fourier_analysis.contours.ml import _source_rgb
    from fourier_analysis.contours.models import ContourConfig
    from fourier_analysis.contours.parts import part_labels
    from fourier_analysis.contours.person import person_probability

    config = ContourConfig().normalized()
    image = load_image_inputs(ASSETS / "portraits" / "human.png", config)
    mask, _ = subject_mask(image, config)
    parts = part_labels(image, mask)
    subject = parts.subject
    assert parts.source == "face-parsing"
    removed = mask & ~subject
    b = 4  # the labels' frame band
    removed[:b] = removed[-b:] = False
    removed[:, :b] = removed[:, -b:] = False
    assert removed.sum() > 0.03 * mask.sum()  # the leaf is a real share of the mask
    labels, n = ndi.label(removed)
    sizes = ndi.sum(removed, labels, index=np.arange(1, n + 1))
    assert sizes.max() > 0.9 * removed.sum()  # one object, not slivers all round
    person = person_probability(_source_rgb(image), mask.shape) >= 0.5
    assert (person & removed).sum() < 0.05 * removed.sum()  # none of it was the person
    assert (person & subject).sum() > 0.95 * (person & mask).sum()  # the sitter is whole


def test_portrait_parts_come_from_the_face_parser():
    from fourier_analysis.contours.image import load_image_inputs
    from fourier_analysis.contours.isolation import subject_mask
    from fourier_analysis.contours.models import ContourConfig
    from fourier_analysis.contours.parts import EYES, NOSE, part_labels

    path = ASSETS / "portraits" / "daraksha.jpg"
    config = ContourConfig().normalized()
    image = load_image_inputs(path, config)
    mask, _ = subject_mask(image, config)
    parts = part_labels(image, mask)
    assert parts.source == "face-parsing"
    assert len(parts.faces) == 1
    present = set(np.unique(parts.labels).tolist())
    assert NOSE in present and present & set(EYES)


def test_daraksha_brows_are_strokes_and_the_thin_upper_lip_one_line(daraksha):
    """Each brow is drawn by one open stroke along it (its spine), not by its
    outline; the upper lip, a sliver in her smile, is one line (its parts on
    either side meet along its middle), while the full lower lip stays."""
    from scipy import ndimage as ndi

    from fourier_analysis.contours.parts import BROWS, FACE_CLASSES

    parts, drawing = daraksha
    name = {n: i for i, n in enumerate(FACE_CLASSES)}
    present = set(np.unique(parts.labels).tolist())
    assert name["u_lip"] not in present and name["l_lip"] in present
    assert parts.spined == BROWS
    for k in BROWS:
        brow = parts.labels == k
        on = [
            e for e in drawing.graph.edges
            if e.layer == PARTS and brow[
                np.clip(np.rint(e.pts[:, 0]).astype(int), 0, brow.shape[0] - 1),
                np.clip(np.rint(e.pts[:, 1]).astype(int), 0, brow.shape[1] - 1),
            ].mean() > 0.8
        ]
        # One open stroke (split only where other strokes join it), along
        # the brow's length; its outline is not drawn.
        assert on and all(e.u != e.v for e in on)
        cols = np.nonzero(brow)[1]
        assert np.ptp(np.vstack([e.pts for e in on])[:, 1]) > 0.7 * np.ptp(cols)
        rim = brow & ~ndi.binary_erosion(brow, iterations=2)
        inked = np.zeros(brow.shape, bool)
        for e in drawing.graph.edges:
            inked[
                np.clip(np.rint(e.pts[:, 0]).astype(int), 0, brow.shape[0] - 1),
                np.clip(np.rint(e.pts[:, 1]).astype(int), 0, brow.shape[1] - 1),
            ] = True
        assert (rim & ndi.binary_dilation(inked)).sum() < 0.3 * rim.sum()


def test_spine_graph_draws_a_band_by_its_middle():
    """A curved band: one open stroke along its middle, end to end."""
    from fourier_analysis.contours.strokes import spine_graph

    yy, xx = np.mgrid[:120, :200]
    r = np.hypot(yy - 200.0, xx - 100.0)
    band = (np.abs(r - 150.0) < 6) & (np.abs(xx - 100) < 70)
    labels = band.astype(np.int32) * 2
    g = spine_graph(labels, (2,))
    assert len(g.edges) == 1
    p = g.edges[0].pts
    rp = np.hypot(p[:, 0] - 200.0, p[:, 1] - 100.0)
    assert np.abs(rp - 150.0).max() < 6.0  # inside the band
    assert np.abs(rp - 150.0)[len(p) // 4 : -len(p) // 4].max() < 1.5  # on its middle
    assert p[:, 1].min() < 35 and p[:, 1].max() > 165


def test_a_thin_part_between_two_parts_becomes_their_boundary():
    """A sliver of upper lip between the skin and the mouth goes to them both,
    so they meet along its middle; a thin closed mouth on the skin (lips on
    the skin all round) keeps its lips."""
    from fourier_analysis.contours.parts import LIPS, MOUTH, SKIN, thin_to_line

    labels = np.full((80, 120), SKIN, np.int32)
    labels[40:46, 20:100] = LIPS[0]  # 6 px of upper lip ...
    labels[46:70, 20:100] = MOUTH  # ... over an open mouth
    out = thin_to_line(labels, LIPS, 10.0)
    assert not (out == LIPS[0]).any()
    assert (out[40:43, 30:90] == SKIN).all() and (out[43:46, 30:90] == MOUTH).all()

    closed = np.full((80, 120), SKIN, np.int32)
    closed[40:44, 20:100] = LIPS[0]
    closed[44:48, 20:100] = LIPS[1]
    assert np.array_equal(thin_to_line(closed, LIPS, 10.0), closed)


def _pear_nose() -> tuple[np.ndarray, np.ndarray]:
    """A nose mask narrow at the top (the bridge) and flaring at the bottom
    (the wings), and its outline as (row, col) points."""
    from skimage.measure import find_contours

    yy, xx = np.mgrid[:200, :200]
    # Half-width 10 at the top (row 40), 35 at the base (row 160).
    nose = (np.abs(xx - 100) <= 10 + 25 * (yy - 40) / 120) & (np.abs(yy - 100) <= 60)
    q = max(find_contours(nose.astype(float), 0.5), key=len)
    return nose, q


def test_the_bridge_is_drawn_down_its_shadowed_side():
    """A nose's outline, its right side in shadow: above the wings the points
    returned are the right side's, running down the lower bridge into the
    wing; the bridge's root is not drawn, though the image marks it there (it
    would run on into the brow)."""
    from fourier_analysis.contours.drawing import BRIDGE_DRAWN_FRACTION, WING_FRACTION, bridge_side

    nose, q = _pear_nose()
    prof = np.where(q[:, 1] > 100, 30.0, 5.0)  # the right side marked more
    side = bridge_side(q, prof, nose, prof >= 20.0)
    upper = side & (q[:, 0] < 160 - WING_FRACTION * 120 - 2)
    assert upper.any() and (q[upper, 1] > 100).all()
    assert np.ptp(q[upper, 0]) > 15  # it runs down the nose
    top = 160 - BRIDGE_DRAWN_FRACTION * 120
    assert not side[q[:, 0] < top - 2].any()  # not up the bridge's root, nor across the top


def test_the_wings_and_base_of_a_nose_are_drawn_whole():
    """The wide end of the nose (its wings and base) is drawn on both sides
    however the light falls; which end is the wide one is read from the
    nose's own shape, so a nose upside down is drawn alike."""
    from fourier_analysis.contours.drawing import bridge_side

    nose, q = _pear_nose()
    prof = np.where(q[:, 1] > 100, 30.0, 5.0)
    side = bridge_side(q, prof, nose, np.zeros(len(q), bool))
    base = q[:, 0] > 150
    assert side[base].all()
    assert side[base & (q[:, 1] < 85)].any() and side[base & (q[:, 1] > 115)].any()
    flipped = bridge_side(np.column_stack([199 - q[:, 0], q[:, 1]]), prof, nose[::-1], np.zeros(len(q), bool))
    assert flipped[base].all()  # row 199 - r: the wide end is now at the top


def test_a_separate_piece_is_joined_at_its_end_not_its_middle():
    """A brow-like stroke above a figure whose nearest point lies under the
    stroke's middle: the connector leaves the stroke at an end (the stroke
    carries on into it), never as a spur from its middle."""
    from fourier_analysis.contours.drawing import ENTRY_FRACTION, route_connectors

    h, w = 120, 200
    g = StrokeGraph()
    # The figure: a long V whose apex sits 6 px under the brow's middle.
    v = np.vstack([np.column_stack([np.linspace(100, 36, 91), np.linspace(10, 100, 91)]),
                   np.column_stack([np.linspace(36, 100, 91), np.linspace(100, 190, 91)])[1:]])
    a, b = g.add_node(v[0]), g.add_node(v[-1])
    g.edges.append(Edge(a, b, v, PARTS))
    brow = np.column_stack([np.full(81, 30.0), np.arange(60.0, 141.0)])
    a, b = g.add_node(brow[0]), g.add_node(brow[-1])
    g.edges.append(Edge(a, b, brow, PARTS))
    out = route_connectors(g, np.zeros((h, w)), np.ones((h, w), bool))
    assert len(out.components()) == 1
    conn = [e for e in out.edges if e.layer == CONNECT]
    assert len(conn) == 1
    ends = conn[0].pts[[0, -1]]
    on_brow = ends[np.argmin(np.abs(ends[:, 0] - 30.0))]
    reach = max(2.0, ENTRY_FRACTION * 80) + 1.0
    assert min(abs(on_brow[1] - 60.0), abs(on_brow[1] - 140.0)) <= reach


def test_a_mouth_the_parser_missed_is_drawn_along_its_dark_valley():
    """A face whose parse has no mouth: the mouth line runs from one landmark
    corner to the other along the darkest valley between the lips."""
    from fourier_analysis.contours.parts import SKIN, Face, missed_features

    h, w = 200, 200
    labels = np.full((h, w), SKIN, np.int32)
    lab = np.full((h, w, 3), 0.7)
    yy, xx = np.mgrid[:h, :w]
    valley = 140 + 6 * np.sin((xx - 70) / 60 * np.pi)  # a curved dark line
    lab[..., 0] = np.where(np.abs(yy - valley) < 1.5, 0.2, 0.7)
    face = Face(0.95, (40.0, 40.0, 120.0, 140.0), ((70.0, 80.0), (130.0, 80.0), (100.0, 110.0), (70.0, 140.0), (130.0, 140.0)))
    eyes, lines = missed_features(labels, [face], lab)
    assert eyes.any()  # neither eye was parsed either
    assert len(lines) == 3  # each eye's lid line, then the mouth's
    m = lines[-1]
    inner = (m[:, 1] > 75) & (m[:, 1] < 125)
    assert np.abs(m[inner, 0] - valley[m[inner, 0].astype(int), m[inner, 1].astype(int)]).max() < 2.0


def test_a_jump_the_tour_would_make_is_drawn_as_a_routed_stroke():
    """A long open U whose two ends lie close: the tour would jump the gap
    rather than retrace the whole U.  ``route_jumps`` joins the two ends with
    a ``CONNECT`` stroke along the image, so the tour walks it with no jump."""
    from fourier_analysis.contours.drawing import route_jumps

    h, w = 200, 200
    t = np.linspace(0.0, np.pi * 1.9, 600)
    pts = np.column_stack([100 + 80 * np.sin(t), 100 + 80 * np.cos(t)])
    g = StrokeGraph()
    a, b = g.add_node(pts[0]), g.add_node(pts[-1])
    g.edges.append(Edge(a, b, pts, LINES))
    assert build_contour_tour(g.polylines((h, w))).gap_lengths != ()
    out = route_jumps(g, np.zeros((h, w)), np.ones((h, w), bool))
    conn = [e for e in out.edges if e.layer == CONNECT]
    assert len(conn) == 1 and {conn[0].u, conn[0].v} == {a, b}
    assert build_contour_tour(out.polylines((h, w))).gap_lengths == ()


def test_an_eye_the_parser_missed_is_drawn_by_its_lid_line():
    """A face whose parse has no eye: each eye is drawn as one line, the dark
    valley of its lid across the eye from corner to corner, not as the box of
    its shadowed socket."""
    from fourier_analysis.contours.parts import SKIN, Face, missed_features

    h, w = 200, 200
    labels = np.full((h, w), SKIN, np.int32)
    lab = np.full((h, w, 3), 0.7)
    yy, xx = np.mgrid[:h, :w]
    lid = 78 - 4 * np.sin((xx - 50) / 40 * np.pi)  # an arched dark lid over the left eye
    lab[..., 0] = np.where((np.abs(yy - lid) < 1.5) & (xx < 100), 0.2, 0.7)
    face = Face(0.95, (30.0, 40.0, 140.0, 140.0), ((70.0, 80.0), (130.0, 80.0), (100.0, 110.0), (75.0, 140.0), (125.0, 140.0)))
    eyes, lines = missed_features(labels, [face], lab)
    left = lines[0]
    assert abs(left[0, 1] - 55.0) <= 1 and abs(left[-1, 1] - 85.0) <= 1  # corner to corner
    inner = (left[:, 1] > 60) & (left[:, 1] < 80)
    assert np.abs(left[inner, 0] - lid[left[inner, 0].astype(int), left[inner, 1].astype(int)]).max() < 2.0


def test_a_braid_the_parser_calls_cloth_is_revoted_hair_by_its_colour():
    """The parser places a black braid over a beige sweater where cloth
    usually lies; the image's colours (each material's model learned on the
    parser's own core of it) move it to the hair.  Materials whose colours
    do not tell them apart (a white cravat on a white neck) are left as the
    parser has them."""
    from fourier_analysis.contours.parts import CLOTH, HAIR, NECK, N_FACE_CLASSES, material_revote

    h, w = 160, 160
    labels = np.full((h, w), CLOTH, np.int32)
    labels[:60] = HAIR
    lab = np.zeros((h, w, 3))
    lab[..., 1:] = 0.5
    lab[..., 0] = 0.75  # beige
    lab[:60, :, 0] = 0.08  # black hair
    lab[60:, 100:130, 0] = 0.08  # the braid falls over the sweater
    probs = np.zeros((h, w, N_FACE_CLASSES), np.float32)
    probs[..., CLOTH] = np.where(labels == CLOTH, 0.7, 0.2)
    probs[..., HAIR] = 1.0 - probs[..., CLOTH]
    out = material_revote(labels, probs, lab, min_area=100.0)
    assert (out[70:150, 104:126] == HAIR).mean() > 0.95
    assert (out[70:150, 10:90] == CLOTH).all()

    flat = lab.copy()
    flat[..., 0] = 0.75  # one colour: the parser's word stands
    labels2 = labels.copy()
    labels2[:60] = NECK
    assert np.array_equal(material_revote(labels2, probs, flat, min_area=100.0), labels2)


def test_form_lines_leave_the_upper_bridge():
    """Learned ink on the bridge's root (the top fifth of the nose, whose
    shade runs up into the brows) is cut away; the wing's crease on the
    lower half is kept."""
    from fourier_analysis.contours.drawing import form_lines

    nose, _ = _pear_nose()
    form = np.ones(nose.shape, bool)
    ink = np.zeros(nose.shape, bool)
    ink[42:62, 108] = True  # down the bridge's root
    ink[150, 60:80] = True  # a crease from the wing
    out = form_lines(ink, form, nose, 2.0)
    assert not out[42:58, 108].any() and out[150, 60:72].all()


def test_connectors_do_not_cross_the_glabella():
    """Two brows either side of a nose: the connector between them does not
    run straight across the glabella (a unibrow) while a path round through
    the nose's lower half exists."""
    from fourier_analysis.contours.drawing import glabella

    nose, _ = _pear_nose()
    g = glabella(nose)
    # The midline runs from the top of the nose's wide half up past its top.
    rows = np.flatnonzero(g.any(axis=1))
    assert rows.min() < 40 - 30 and rows.max() <= 100 + 2
    assert g[20, 98:103].any() and not g[150].any()


def test_a_connector_over_even_cost_is_a_straight_stroke():
    """An 8-connected geodesic over even cost is a staircase of straight and
    diagonal runs; pulled taut it is the straight segment, and over a costly
    block it still bends round it."""
    from skimage.graph import route_through_array

    from fourier_analysis.contours.drawing import pull_string

    cost = np.ones((60, 100))
    path, _ = route_through_array(cost, (10, 5), (40, 95), fully_connected=True, geometric=True)
    taut = pull_string(np.asarray(path, float), cost)
    t = (taut[:, 1] - 5) / 90
    assert np.abs(taut[:, 0] - (10 + 30 * t)).max() < 1.0
    cost[:, 50] = 100.0
    cost[55:, 50] = 1.0  # a gate at the bottom
    path, _ = route_through_array(cost, (10, 5), (10, 95), fully_connected=True, geometric=True)
    taut = pull_string(np.asarray(path, float), cost)
    at = taut[np.argmin(np.abs(taut[:, 1] - 50))]
    assert at[0] >= 54


def test_the_dark_sliver_of_a_smile_is_one_line():
    """An open mouth whose dark shows only as a thin sliver between the upper
    lip and the teeth: the lip meets the teeth along one line."""
    from fourier_analysis.contours.parts import LIPS, MOUTH, SKIN, TEETH, thin_to_line

    labels = np.full((80, 120), SKIN, np.int32)
    labels[30:40, 20:100] = LIPS[0]
    labels[40:44, 20:100] = MOUTH  # the gum line
    labels[44:60, 20:100] = TEETH
    out = thin_to_line(labels, (MOUTH,), 10.0)
    assert not (out[:, 25:95] == MOUTH).any()
    assert (out[38:42, 30:90] == LIPS[0]).all() or (out[42:44, 30:90] == TEETH).all()


def test_faint_twigs_are_dropped_and_marked_ones_kept():
    """Two learned lines hang off a loop: one over flat colour (a fold's
    shading, ending nowhere) is dropped; one along a strong colour step (a
    seam) is kept, and so is the loop."""
    from fourier_analysis.contours.drawing import drop_faint_twigs

    h, w = 120, 160
    lab = np.zeros((h, w, 3))
    lab[..., 0] = 50.0
    lab[:, 120:, 0] = 90.0  # a strong step at column 120
    g = StrokeGraph()
    t = np.linspace(0, 2 * np.pi, 120)
    loop = np.column_stack([60 + 20 * np.sin(t), 40 + 20 * np.cos(t)])
    loop[-1] = loop[0]
    a = g.add_node(loop[0])
    g.edges.append(Edge(a, a, loop, SILHOUETTE))
    start = loop[0]
    b = g.add_node(np.array([100.0, 60.0]))
    faint = np.column_stack([np.linspace(start[0], 100.0, 40), np.linspace(start[1], 60.0, 40)])
    g.edges.append(Edge(a, b, faint, LINES))
    c, d = g.add_node(np.array([10.0, 120.0])), g.add_node(np.array([110.0, 120.0]))
    g.edges.append(Edge(c, d, np.column_stack([np.linspace(10.0, 110.0, 101), np.full(101, 120.0)]), LINES))
    out = drop_faint_twigs(g, lab, 2.0)
    kinds = sorted((e.layer, round(e.length)) for e in out.edges)
    assert len(out.edges) == 2
    assert any(e.layer == SILHOUETTE for e in out.edges)
    assert any(e.layer == LINES and abs(e.pts[:, 1] - 120).max() < 1 for e in out.edges), kinds


def test_a_brow_is_entered_at_its_tail_not_its_root():
    """Two brows over two eyes: each brow's root (its half nearer the face's
    midline) is barred, so a connector leaves a brow at its tail, carrying the
    arch on to the temple, never at its root (a scowl, or a box round the
    eye)."""
    from fourier_analysis.contours.drawing import brow_roots, entry_points
    from fourier_analysis.contours.parts import BROWS, SKIN, Face

    h, w = 120, 200
    labels = np.full((h, w), SKIN, np.int32)
    labels[30:36, 30:90] = BROWS[0]  # the image-left brow
    labels[30:36, 110:170] = BROWS[1]  # the image-right brow
    face = Face(0.99, (20.0, 10.0, 160.0, 100.0), ((60.0, 50.0), (140.0, 50.0), (100.0, 70.0), (80.0, 90.0), (120.0, 90.0)))
    roots = brow_roots(labels, (face,))
    assert roots[33, 70:90].all() and not roots[33, 30:55].any()  # the left brow's inner half
    assert roots[33, 110:130].all() and not roots[33, 145:170].any()  # the right brow's inner half

    # A brow stroke (a feature piece) and the figure it hangs off: entered
    # at its outer end only.
    g = StrokeGraph()
    big = np.column_stack([np.full(150, 100.0), np.linspace(20.0, 180.0, 150)])
    u, v = g.add_node(big[0]), g.add_node(big[-1])
    g.edges.append(Edge(u, v, big, SILHOUETTE))
    brow = np.column_stack([np.full(61, 33.0), np.linspace(30.0, 90.0, 61)])
    p, q = g.add_node(brow[0]), g.add_node(brow[-1])
    g.edges.append(Edge(p, q, brow, PARTS))
    entry = entry_points(g, g.components(), roots)
    ok = brow[entry[1]]
    assert ok.size and ok[:, 1].max() < 60  # only at the tail (column 30)


def test_a_faint_lone_line_is_kept_where_a_faint_twig_is_dropped():
    """A faint learned line with both ends free is a line of its own (a fine
    necklace on the skin), not a spur hanging off the drawing: it is kept,
    while the same faint line hanging off the figure is dropped."""
    from fourier_analysis.contours.drawing import drop_faint_twigs

    h, w = 120, 160
    lab = np.zeros((h, w, 3))
    lab[..., 0] = 50.0
    g = StrokeGraph()
    t = np.linspace(0, 2 * np.pi, 120)
    loop = np.column_stack([60 + 20 * np.sin(t), 40 + 20 * np.cos(t)])
    loop[-1] = loop[0]
    a = g.add_node(loop[0])
    g.edges.append(Edge(a, a, loop, SILHOUETTE))
    b = g.add_node(np.array([100.0, 60.0]))
    twig = np.column_stack([np.linspace(loop[0, 0], 100.0, 40), np.linspace(loop[0, 1], 60.0, 40)])
    g.edges.append(Edge(a, b, twig, LINES))
    c, d = g.add_node(np.array([10.0, 120.0])), g.add_node(np.array([110.0, 120.0]))
    g.edges.append(Edge(c, d, np.column_stack([np.linspace(10.0, 110.0, 101), np.full(101, 120.0)]), LINES))
    out = drop_faint_twigs(g, lab, 2.0)
    lines = [e for e in out.edges if e.layer == LINES]
    assert len(lines) == 1 and abs(lines[0].pts[:, 1] - 120).max() < 1


def test_a_brow_spine_follows_its_dark_core_not_the_label_axis():
    """A brow label is a straight blob; the hair in it arches.  With the
    luminance given, the spine runs along the arch, from tip to tip."""
    from fourier_analysis.contours.strokes import spine_graph

    h, w = 80, 200
    yy, xx = np.mgrid[:h, :w]
    blob = ((yy - 40) / 14.0) ** 2 + ((xx - 100) / 80.0) ** 2 <= 1.0
    labels = blob.astype(np.int32) * 2
    arch = 46.0 - 10.0 * (1.0 - ((xx - 100) / 80.0) ** 2)  # row of the hair: 36 mid, 46 at the tips
    lum = np.where(np.abs(yy - arch) <= 1.5, 20.0, 70.0)
    straight = spine_graph(labels, (2,)).edges[0].pts
    arched = spine_graph(labels, (2,), lum=lum).edges[0].pts
    mid = np.abs(arched[:, 1] - 100) < 10
    assert np.abs(arched[mid, 0] - 36.0).max() < 2.0
    assert np.abs(straight[np.abs(straight[:, 1] - 100) < 10, 0] - 40.0).max() < 2.0
    assert arched[:, 1].min() < 35 and arched[:, 1].max() > 165


def test_a_feature_hangs_on_a_neighbouring_feature_before_the_outline():
    """An eye a little nearer the face's outline than its brow is joined to
    the brow (a socket line), not to the outline (a tail across the cheek),
    while the cost of that link is within ``OUTLINE_LINK_FACTOR``."""
    from fourier_analysis.contours.drawing import OUTLINE_LINK_FACTOR, route_connectors

    h, w = 160, 200
    g = StrokeGraph()
    # The outline: a long vertical stroke at column 20.
    a, b = g.add_node(np.array([5.0, 20.0])), g.add_node(np.array([155.0, 20.0]))
    g.edges.append(Edge(a, b, np.column_stack([np.arange(5.0, 156.0), np.full(151, 20.0)]), PARTS))
    # The brow, its tail 30 px from the outline, at row 50.
    c, d = g.add_node(np.array([50.0, 50.0])), g.add_node(np.array([50.0, 110.0]))
    g.edges.append(Edge(c, d, np.column_stack([np.full(61, 50.0), np.arange(50.0, 111.0)]), PARTS))
    # The eye: from column 60 to 110 at row 50 + gap.  Its outer corner lies
    # 40 px from the outline and about 45 px from the brow's tail.
    gap = 44.0
    e, f = g.add_node(np.array([50.0 + gap, 60.0])), g.add_node(np.array([50.0 + gap, 110.0]))
    g.edges.append(Edge(e, f, np.column_stack([np.full(51, 50.0 + gap), np.arange(60.0, 111.0)]), PARTS))
    assert gap < 40.0 * OUTLINE_LINK_FACTOR
    out = route_connectors(g, np.zeros((h, w)), np.ones((h, w), bool))
    assert len(out.components()) == 1
    conn = [e for e in out.edges if e.layer == CONNECT]
    eye_links = [c for c in conn if np.abs(c.pts[:, 0] - (50.0 + gap)).min() < 2]
    assert eye_links and all(c.pts[:, 1].min() > 30 for c in eye_links), [c.pts[:, 1].min() for c in eye_links]


def test_the_upper_teeth_are_parted_from_the_lower_toward_the_lower_lip():
    """A smile's teeth band: a bright upper row over a darker lower row, the
    lower lip under it and skin above.  The parting runs between the rows,
    from the band's outline to its outline; a band of one row has none."""
    from fourier_analysis.contours.parts import L_LIP, SKIN, TEETH, teeth_parting

    h, w = 80, 200
    yy, xx = np.mgrid[:h, :w]
    band = (np.abs(yy - 40) <= 12) & (np.abs(xx - 100) <= 70)
    labels = np.where(band, TEETH, np.where(yy > 40, L_LIP, SKIN)).astype(np.int32)
    lab = np.full((h, w, 3), 0.5)
    lab[..., 0] = np.where(band & (yy < 44), 0.85, np.where(band, 0.45, 0.3))
    lines = teeth_parting(labels, lab)
    assert len(lines) == 1
    line = lines[0]
    assert np.all(np.abs(line[:, 0] - 43.5) <= 1.5), line[:, 0]
    assert line[:, 1].min() <= 31 and line[:, 1].max() >= 169

    one_row = lab.copy()
    one_row[..., 0] = np.where(band, 0.85, 0.3)
    assert teeth_parting(labels, one_row) == ()


def test_a_seam_that_stops_in_the_hair_runs_on_to_the_hairs_edge():
    """A parting the line model loses under the crown: a line from the
    hairline up into the hair, stopping short of the hair's outline, is
    carried on to it and joined there; a strand longer to finish than it is
    drawn stays as it is."""
    from fourier_analysis.contours.drawing import run_seams_on

    h, w = 200, 200
    hair = np.zeros((h, w), bool)
    hair[20:120, 20:180] = True
    g = StrokeGraph()
    top = g.add_node(np.array([20.0, 20.0]))
    right = g.add_node(np.array([20.0, 180.0]))
    g.edges.append(Edge(top, right, np.column_stack([np.full(161, 20.0), np.linspace(20, 180, 161)]), SILHOUETTE))
    a, b = g.add_node(np.array([119.0, 100.0])), g.add_node(np.array([60.0, 100.0]))
    g.edges.append(Edge(a, b, np.column_stack([np.linspace(119, 60, 60), np.full(60, 100.0)]), LINES))
    out = run_seams_on(g, hair, 2.0)
    assert out.degree().max() >= 3  # the seam meets the outline at a junction
    seam = [e for e in out.edges if e.layer == LINES]
    rows = np.concatenate([e.pts[:, 0] for e in seam])
    assert rows.min() <= 22.0

    short = StrokeGraph(g.nodes, [g.edges[0], Edge(a, b, np.column_stack([np.linspace(119, 100, 20), np.full(20, 100.0)]), LINES)])
    short.nodes[b] = np.array([100.0, 100.0])
    kept = run_seams_on(short, hair, 2.0)
    assert min(e.pts[:, 0].min() for e in kept.edges if e.layer == LINES) >= 99.0
