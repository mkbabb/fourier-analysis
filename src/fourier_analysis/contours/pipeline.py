"""The contour pipeline (F.CT approach A): landmarks and silhouette.

    Image -> subject mask -> layers of ink -> stroke graph -> pen strokes

1. **Subject.**  The U2-Net + BiRefNet-lite ensemble isolates the subject
   (``isolation``); its boundary is the silhouette, the first layer.
2. **A human face** (``landmarks.find_faces``: a confident BlazeFace
   detection on the subject) is drawn from what places its lines directly:
   the FaceMesh landmarks give the brows, lids, irises, nose, lips and jaw;
   the person parser's region boundaries (hair, face skin, body skin,
   clothes) give the hairline, the braid and the neckline.
3. **Anything else** (an animal, a robot, a cartoon) is drawn from the
   learned line drawing (``lineart``), kept where it lies on the subject.
4. The layers become one stroke graph (``strokes``): repeats suppressed,
   thinned, spurs pruned, free ends snapped to the ink they stop short of,
   small fragments dropped, edges smoothed with junctions pinned; then
   chained into pen strokes, the contours returned.  Strokes that meet share
   the junction vertex exactly, so the tour (``shortest_tour``) walks the
   same graph.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from scipy import ndimage as ndi

from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.isolation import SubjectIsolation, isolate_subject
from fourier_analysis.contours.landmarks import (
    BACKGROUND,
    find_faces,
    person_labels,
)
from fourier_analysis.contours.lineart import persistent_line_strength
from fourier_analysis.contours.ml import _source_rgb
from fourier_analysis.contours.models import (
    ContourConfig,
    ContourDiagnostics,
    ContourExtractionResult,
)
from fourier_analysis.contours.strokes import (
    Layer,
    compose_layers,
    edge_values,
    select_layer_edges,
    drop_small_components,
    graph_trails,
    keep_components,
    prune_spurs,
    rasterize,
    skeleton_graph,
    smooth_graph,
    snap_ends,
)
from fourier_analysis.contours.support import band_px
from fourier_analysis.shortest_tour import build_contour_tour

# Scales, in subject-band half-widths (``support.band_px``: 1% of the image
# diagonal, the bench bar's own boundary tolerance).
SUPPRESS_BANDS = 0.5  # later ink this close to earlier ink repeats it
SNAP_BANDS = 1.5  # a free end this close to ink ahead of it joins it
SPUR_BANDS = 0.75  # dead ends shorter than this off a junction are thinning spurs
SMOOTH_BANDS = 0.3  # edge smoothing (Gaussian sigma along the arc)
# Fragments: a parser boundary or a line-drawing component shorter than this
# (in bands) is texture, not a line of the drawing.
PARSE_MIN_BANDS = 3.0
# The person parse replaces the subject mask only when it keeps at least
# this fraction of it (a parse that lost the sitter is not trusted).
PERSON_MIN_FRACTION = 0.5
LINE_MIN_BANDS = 1.5
# Solid dark areas (a nose, a pupil, a shadow) wider than this (in bands)
# are drawn by their outline, not their medial axis.
LINE_SOLID_BANDS = 0.75
# Holes in the line ink smaller than this square (side in bands) are texture.
LINE_HOLE_BANDS = 2.0
# The line drawing's ink budget, as a multiple of the silhouette's length.
LINE_BUDGET = 1.25
# Around a face the line drawing only complements the landmark lines.
LINE_FACE_BUDGET = 0.5
# Line hysteresis, as fractions of the outline's darkness.
LINE_SEED = 0.9
LINE_GROW = 0.7
# The line drawing's ink: hysteresis on its darkness relative to its own
# strongest lines on the subject (the ``LINE_REFERENCE_PERCENTILE`` of the
# darkness there): a line is seeded where it is as dark as the drawing's
# lines and followed while it stays visible.
LINE_REFERENCE_PERCENTILE = 99.0
LINE_HIGH = 0.6
LINE_LOW = 0.3


def extract_contours_pipeline(
    image: LoadedImage,
    config: ContourConfig,
) -> ContourExtractionResult:
    """Run the approach-A pipeline (see the module docstring)."""
    isolation = isolate_subject(image, config)
    shape = image.grayscale.shape
    band = band_px(shape)
    rgb = _pipeline_rgb(image)

    faces = find_faces(rgb, isolation.subject_mask)
    labels = person_labels(rgb) if faces else None
    if labels is not None:
        isolation = _person_isolation(isolation, labels, image, config, band)

    layers = [Layer("silhouette", rasterize([_to_rc(c, shape) for c in isolation.silhouettes], shape))]
    notes: list[str] = []
    if faces:
        notes.append(f"faces={len(faces)}: landmark lines + person parse")
        lines = [pts for f in faces for pts in f.lines.values()]
        layers.append(Layer("features", rasterize(lines, shape)))
        if labels is not None:
            layers.append(Layer(
                "parse", _parse_boundaries(labels, isolation.subject_mask), PARSE_MIN_BANDS * band
            ))
    # The learned line drawing: the whole drawing where there is no face;
    # around a face (hair, clothes, hands), what the landmarks and the parse
    # do not draw.
    strength = persistent_line_strength(rgb, band)
    line_layer = -1
    if strength is not None:
        ink = _line_ink(strength, isolation)
        if faces:
            ink &= ~_face_region(faces, shape, band)
        notes.append("learned line drawing" + (" around the face" if faces else ""))
        line_layer = len(layers)
        layers.append(Layer("lines", ink, LINE_MIN_BANDS * band))

    canvas = compose_layers(layers, shape, SUPPRESS_BANDS * band)
    graph = skeleton_graph(canvas)
    graph = prune_spurs(graph, SPUR_BANDS * band)
    if line_layer >= 0:
        # The line drawing draws texture too (fur, foliage, hatching): its
        # lines are kept most salient first within an ink budget set by the
        # silhouette's own length.
        silhouette_px = sum(e.length for e in graph.edges if e.layer == 0)
        # Salience: persistent darkness, measured against the darkness the
        # generator gives the drawing's own outline (the silhouette): the
        # per-image measure of what a real line looks like.  A line seeds at
        # ``LINE_SEED`` of it and is followed down to ``LINE_GROW``.
        near = ndi.maximum_filter(strength, size=2 * round(SUPPRESS_BANDS * band) + 1)
        outline = [d for d, e in zip(edge_values(graph, near), graph.edges) if e.layer == 0]
        ref = float(np.median(outline)) if outline else float(np.percentile(strength, 99))
        budget = (LINE_FACE_BUDGET if faces else LINE_BUDGET) * max(silhouette_px, band * 40)
        # Both are read through the same max filter: a thinned stroke lies
        # within half a band of its line's darkest pixels, not on them.
        graph = select_layer_edges(
            graph, line_layer, edge_values(graph, near), budget,
            LINE_SEED * ref, LINE_GROW * ref,
        )
    graph = snap_ends(graph, SNAP_BANDS * band)
    graph = prune_spurs(graph, SPUR_BANDS * band)
    graph = drop_small_components(graph, [layer.min_component_px for layer in layers])
    if config.max_contours is not None:
        # The ceiling bounds the separately drawn pieces (each costs the pen
        # a lift); a piece is as many pen strokes as its junctions need.
        graph = keep_components(graph, config.max_contours)
    graph = smooth_graph(graph, max(1.0, SMOOTH_BANDS * band))
    trails = graph_trails(graph)
    trails.sort(key=lambda t: (t.layer, t.rank, -t.length))
    contours = [_to_z(t.pts, shape) for t in trails]
    if not contours:
        return _empty_result(config)

    tour = build_contour_tour(contours, method=config.tour_method)

    # The drawing is a graph: its extent is that of its largest connected
    # piece, and the "secondary" share is the ink drawn inside the subject
    # beyond its outline (interior detail).
    span, interior = _drawing_extent(graph, shape)
    subject_area = isolation.silhouette_area
    gap_lengths = np.array(tour.gap_lengths, dtype=np.float64)
    diagnostics = ContourDiagnostics(
        requested_strategy="auto",
        selected_strategy="auto",
        selected_candidate="faces" if faces else "line-drawing",
        alpha_mode="auto",
        used_alpha=False,
        contour_count=len(contours),
        total_points=sum(len(c) for c in contours),
        retained_area_fraction=(
            min(1.0, subject_area / image.image_area) if image.image_area > 0 else 0.0
        ),
        secondary_area_fraction=interior,
        primary_span_fraction=span,
        max_jump=float(gap_lengths.max()) if gap_lengths.size else 0.0,
        mean_jump=float(gap_lengths.mean()) if gap_lengths.size else 0.0,
        score=0.0,
        notes=tuple(notes),
        candidates=(),
    )
    return ContourExtractionResult(
        config=config,
        contours=contours,
        ordered_path=tour.path.copy(),
        diagnostics=diagnostics,
    )


def _pipeline_rgb(image: LoadedImage) -> NDArray[np.uint8]:
    """The colour image at the pipeline's resolution (alpha on white)."""
    h, w = image.grayscale.shape
    pil = _source_rgb(image)
    if pil.size != (w, h):
        pil = pil.resize((w, h), Image.Resampling.LANCZOS)
    return np.ascontiguousarray(np.asarray(pil, dtype=np.uint8))


def _to_rc(z: NDArray[np.complex128], shape: tuple[int, int]) -> NDArray[np.float64]:
    cy, cx = shape[0] / 2, shape[1] / 2
    return np.column_stack([cy - z.imag, z.real + cx])


def _to_z(rc: NDArray[np.float64], shape: tuple[int, int]) -> NDArray[np.complex128]:
    cy, cx = shape[0] / 2, shape[1] / 2
    return (rc[:, 1] - cx) + 1j * (cy - rc[:, 0])


def _person_isolation(
    isolation: SubjectIsolation,
    labels: NDArray[np.int8],
    image: LoadedImage,
    config: ContourConfig,
    band: float,
) -> SubjectIsolation:
    """A portrait's subject is the person: the subject mask is cut to the
    person parse (grown by a band), so a plant or a chair the saliency
    ensemble kept with the sitter is not drawn."""
    from dataclasses import replace

    from fourier_analysis.contours.isolation import significant_components, subject_silhouettes
    from fourier_analysis.contours.support import subject_band

    mask = isolation.subject_mask
    if mask is None or not mask.any():
        return isolation
    grown = ndi.distance_transform_edt(labels == BACKGROUND) <= band
    cut = significant_components(mask & grown)
    if cut.sum() < PERSON_MIN_FRACTION * mask.sum() or cut.sum() == mask.sum():
        return isolation
    return replace(
        isolation,
        subject_mask=cut,
        silhouettes=subject_silhouettes(cut, image, config),
        silhouette_area=float(cut.sum()),
        subject_band=subject_band(cut),
    )


def _face_region(faces: list, shape: tuple[int, int], band: float) -> NDArray[np.bool_]:
    """Inside any face outline, grown by a band."""
    from skimage.draw import polygon

    region = np.zeros(shape, dtype=bool)
    for f in faces:
        rr, cc = polygon(f.oval[:, 0], f.oval[:, 1], shape)
        region[rr, cc] = True
    return ndi.distance_transform_edt(~region) <= band if region.any() else region


def _parse_boundaries(
    labels: NDArray[np.int8], subject: NDArray[np.bool_] | None
) -> NDArray[np.bool_]:
    """Where two person regions (hair, skin, clothes, other) meet on the subject."""
    person = labels != BACKGROUND
    out = np.zeros(labels.shape, dtype=bool)
    for axis in (0, 1):
        a = np.take(labels, range(labels.shape[axis] - 1), axis=axis)
        b = np.take(labels, range(1, labels.shape[axis]), axis=axis)
        pa = np.take(person, range(labels.shape[axis] - 1), axis=axis)
        pb = np.take(person, range(1, labels.shape[axis]), axis=axis)
        edge = (a != b) & pa & pb
        if axis == 0:
            out[:-1] |= edge
        else:
            out[:, :-1] |= edge
    if subject is not None:
        out &= subject
    return out


def _line_ink(strength: NDArray[np.float64], isolation: SubjectIsolation) -> NDArray[np.bool_]:
    """The line drawing's lines on the subject (hysteresis on darkness)."""
    from skimage.filters import apply_hysteresis_threshold
    from skimage.morphology import remove_small_holes

    on = isolation.subject_band
    if on is None and isolation.subject_mask is not None:
        on = ndi.binary_dilation(isolation.subject_mask, iterations=2)
    if on is None or not on.any():
        on = np.ones(strength.shape, dtype=bool)
    ref = float(np.percentile(strength[on], LINE_REFERENCE_PERCENTILE))
    if ref <= 1e-6:
        return np.zeros(strength.shape, dtype=bool)
    ink = apply_hysteresis_threshold(strength / ref, LINE_LOW, LINE_HIGH) & on
    # Texture (fur, hatching) is a lattice of lines around small holes: fill
    # them, so the lattice reads as one dark area and is drawn by its outline.
    band = band_px(strength.shape)
    ink = remove_small_holes(ink, max_size=max(1, int((LINE_HOLE_BANDS * band) ** 2)))
    # A solid area thins to a mesh of medial-axis branches; draw its outline.
    r = max(1, round(LINE_SOLID_BANDS * band))
    yy, xx = np.ogrid[-r: r + 1, -r: r + 1]
    solid = ndi.binary_opening(ink, structure=(yy**2 + xx**2) <= r * r)
    if solid.any():
        ink = (ink & ~solid) | (solid & ~ndi.binary_erosion(solid))
    return ink


def _edge_model_note(config: ContourConfig) -> str | None:
    """Say so when a learned edge model was asked for but Canny ridges ran."""
    requested = config.feature.edge_model
    if requested == "canny":
        return None
    from fourier_analysis.contours.ml import pidinet_available

    if pidinet_available():
        return None
    return f"edge_model={requested}: no pinned PiDiNet weights cached; feature ridges used Canny"


def _drawing_extent(graph, shape: tuple[int, int]) -> tuple[float, float]:
    """(span, interior): the largest connected piece's extent (the smaller of
    its x and y spans, as fractions of the image), and the fraction of ink
    that is not the silhouette (layer 0)."""
    n = len(graph.nodes)
    parent = list(range(n))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for e in graph.edges:
        parent[find(e.u)] = find(e.v)
    boxes: dict[int, list[float]] = {}
    ink = outline = 0.0
    for e in graph.edges:
        r = find(e.u)
        lo, hi = e.pts.min(axis=0), e.pts.max(axis=0)
        b = boxes.setdefault(r, [lo[0], lo[1], hi[0], hi[1]])
        b[0], b[1] = min(b[0], lo[0]), min(b[1], lo[1])
        b[2], b[3] = max(b[2], hi[0]), max(b[3], hi[1])
        ink += e.length
        outline += e.length if e.layer == 0 else 0.0
    h, w = shape
    span = max(
        (min((b[2] - b[0]) / max(1.0, h), (b[3] - b[1]) / max(1.0, w)) for b in boxes.values()),
        default=0.0,
    )
    return float(min(1.0, span)), float((ink - outline) / ink) if ink > 0 else 0.0


def _empty_result(config: ContourConfig) -> ContourExtractionResult:
    """Return an empty extraction result."""
    diagnostics = ContourDiagnostics(
        requested_strategy="auto",
        selected_strategy="none",
        selected_candidate="none",
        alpha_mode="auto",
        used_alpha=False,
        contour_count=0,
        total_points=0,
        retained_area_fraction=0.0,
        secondary_area_fraction=0.0,
        primary_span_fraction=0.0,
        max_jump=0.0,
        mean_jump=0.0,
        score=-1e9,
        notes=("no contours extracted",),
        candidates=(),
    )
    return ContourExtractionResult(
        config=config,
        contours=[],
        ordered_path=np.array([], dtype=np.complex128),
        diagnostics=diagnostics,
    )
