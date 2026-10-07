"""Semantic parts: the regions whose shared boundaries are a drawing's lines.

An artist does not draw where brightness crosses a level; they draw where one
part of the subject meets another: the jaw against the neck, the lips against
the skin, the hair against the forehead, the subject against the world.  This
module labels every pixel of the pipeline grid with the part it belongs to, and
``contours.strokes`` draws the boundaries between parts.

Two sources of parts:

**Faces.**  YuNet (OpenCV zoo, 2023mar) finds the faces; each is parsed by a
BiSeNet (ResNet-34) trained on CelebAMask-HQ's 19 classes (skin, brows, eyes,
glasses, ears, earring, nose, mouth, lips, neck, necklace, cloth, hair, hat).
The parser sees a square crop ``FACE_CROP_SCALE`` times the detection's
larger side, centred on it, which is the framing its training faces have.  Its
per-class probabilities are resampled onto the pipeline grid and the argmax
taken, so part boundaries come out smooth and sub-pixel placed.

**Everything else** has no parts here.  A subject with no face (an animal, a
cartoon, a robot) is one part, so only its silhouette is drawn from labels;
its interior lines, and those of the hair, clothes and body around a face,
come from the learned line drawing (``contours.lines``, composed by
``contours.drawing``).  Each parsed eye is split into its iris and white
(``irises``: an anatomical disc clipped by the lids).

The subject mask has the last word on the silhouette: off the mask is
``BACKGROUND``; on the mask where no parser speaks (outside every face crop, or
where the parser sees background) is ``UNPARSED``, whose boundaries with parsed
parts are not drawn (they are where the parser's view ends, not a line on the
subject).  Model files are sha-pinned and cached like ``contours.ml``'s, never
committed.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from scipy import ndimage as ndi

from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.ml import SubjectModelSpec, _get_session, _source_rgb
from fourier_analysis.contours.person import person_cut

# ---------------------------------------------------------------------------
# Label space
# ---------------------------------------------------------------------------

BACKGROUND = 0
# CelebAMask-HQ classes 1..18, as the parser emits them.
FACE_CLASSES = (
    "background", "skin", "l_brow", "r_brow", "l_eye", "r_eye", "eye_g", "l_ear",
    "r_ear", "ear_r", "nose", "mouth", "u_lip", "l_lip", "neck", "neck_l", "cloth",
    "hair", "hat",
)
N_FACE_CLASSES = len(FACE_CLASSES)
SKIN, NOSE, NECK, CLOTH, HAIR, HAT = 1, 10, 14, 16, 17, 18
FEATURES = (2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15)  # the small parts
EYES = (4, 5)
UNPARSED = N_FACE_CLASSES  # on the subject, no parser label
IRIS = UNPARSED + 1  # the dark of an eye (not a parser class; see ``irises``)
FACE_CORE = (SKIN, *FEATURES, IRIS)
"""The labels the face parser draws in full: no other line source inks them."""

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

FACE_DETECTOR = SubjectModelSpec(
    name="face-detection-yunet-2023mar",
    url=(
        "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/"
        "face_detection_yunet_2023mar.onnx"
    ),
    sha256="8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
    input_size=640,
)

FACE_PARSER = SubjectModelSpec(
    name="face-parsing-bisenet-resnet34",
    url="https://github.com/yakhyo/face-parsing/releases/download/weights/resnet34.onnx",
    sha256="5b805bba7b5660ab7070b5a381dcf75e5b3e04199f1e9387232a77a00095102e",
    input_size=512,
)

FACE_MIN_SCORE = 0.9
"""YuNet confidence for a face to be parsed: the detector's own published
operating point.  Below it the detector also fires on animal faces (a dog at
0.88), which the face parser and the person segmenter then both accept."""
FACE_NMS_IOU = 0.3
FACE_MIN_SIDE_PX = 24
"""Faces smaller than this (pipeline pixels) are too small to parse."""
FACE_CROP_SCALE = 2.2
"""Parser crop side, in detection sides (the CelebAMask-HQ framing)."""
MAX_FACES = 4

FEATURE_MIN_SIDE = 0.03
"""A face part smaller than (this x face side)^2 is noise, absorbed."""
REGION_MIN_FRACTION = 0.002
"""Any other part below this fraction of the subject's area is absorbed."""



@dataclass(frozen=True)
class Face:
    score: float
    box: tuple[float, float, float, float]  # x, y, w, h in pipeline pixels


@dataclass(frozen=True)
class PartLabels:
    """A part label per pipeline pixel, and which label pairs are drawn."""

    labels: NDArray[np.int32]
    drawn: NDArray[np.bool_]  # (n_labels, n_labels): is the boundary a line
    faces: tuple[Face, ...]
    source: str  # "face-parsing" or "silhouette"

    @property
    def subject(self) -> NDArray[np.bool_]:
        """The subject the labels were drawn on (cut to the person on a face)."""
        return self.labels != BACKGROUND

    @property
    def face_core(self) -> NDArray[np.bool_]:
        """Where the face parser owns the drawing (``FACE_CORE``)."""
        return np.isin(self.labels, FACE_CORE)


def load_part_sessions() -> None:
    """Open the face models' sessions now (a long-lived process pays once)."""
    _get_session(FACE_DETECTOR)
    _get_session(FACE_PARSER)


# ---------------------------------------------------------------------------
# Face detection (YuNet)
# ---------------------------------------------------------------------------


def detect_faces(rgb: Image.Image, shape: tuple[int, int]) -> list[Face]:
    """YuNet faces on the source image, boxes scaled to the pipeline ``shape``."""
    session = _get_session(FACE_DETECTOR)
    size = FACE_DETECTOR.input_size
    w, h = rgb.size
    s = size / max(w, h)
    small = rgb.resize((max(1, round(w * s)), max(1, round(h * s))), Image.Resampling.BILINEAR)
    canvas = np.zeros((size, size, 3), np.float32)
    a = np.asarray(small, np.float32)[:, :, ::-1]  # the model reads BGR, 0..255
    canvas[: a.shape[0], : a.shape[1]] = a
    names = [o.name for o in session.get_outputs()]
    out = dict(zip(names, session.run(None, {session.get_inputs()[0].name: canvas.transpose(2, 0, 1)[None]})))

    to_pipe = shape[1] / w  # source px -> pipeline px
    cands: list[tuple[float, float, float, float, float]] = []
    for stride in (8, 16, 32):
        n = size // stride
        cls = out[f"cls_{stride}"][0, :, 0]
        obj = out[f"obj_{stride}"][0, :, 0]
        score = np.sqrt(np.clip(cls, 0, 1) * np.clip(obj, 0, 1))
        for i in np.flatnonzero(score >= FACE_MIN_SCORE):
            r, c = divmod(int(i), n)
            b = out[f"bbox_{stride}"][0, i]
            cx, cy = (c + b[0]) * stride, (r + b[1]) * stride
            bw, bh = np.exp(b[2]) * stride, np.exp(b[3]) * stride
            k = to_pipe / s
            cands.append((float(score[i]), (cx - bw / 2) * k, (cy - bh / 2) * k, bw * k, bh * k))
    cands.sort(reverse=True)
    kept: list[Face] = []
    for sc, x, y, bw, bh in cands:
        if max(bw, bh) < FACE_MIN_SIDE_PX:
            continue
        if all(_iou((x, y, bw, bh), f.box) < FACE_NMS_IOU for f in kept):
            kept.append(Face(sc, (x, y, bw, bh)))
        if len(kept) == MAX_FACES:
            break
    return kept


def _iou(a: tuple[float, ...], b: tuple[float, ...]) -> float:
    x0, y0 = max(a[0], b[0]), max(a[1], b[1])
    x1, y1 = min(a[0] + a[2], b[0] + b[2]), min(a[1] + a[3], b[1] + b[3])
    inter = max(0.0, x1 - x0) * max(0.0, y1 - y0)
    return inter / max(1e-9, a[2] * a[3] + b[2] * b[3] - inter)


# ---------------------------------------------------------------------------
# Face parsing (BiSeNet, CelebAMask-HQ)
# ---------------------------------------------------------------------------


def parse_face(
    rgb: Image.Image, face: Face, shape: tuple[int, int]
) -> tuple[NDArray[np.float32], tuple[int, int, int]]:
    """The parser's class probabilities over the face's crop, on the pipeline
    grid: ``(probs[S, S, 19], (row0, col0, S))`` with the crop's top-left
    corner in pipeline pixels (it may lie off the image)."""
    session = _get_session(FACE_PARSER)
    size = FACE_PARSER.input_size
    x, y, w, h = face.box
    side = FACE_CROP_SCALE * max(w, h)
    cx, cy = x + w / 2, y + h / 2
    col0, row0 = cx - side / 2, cy - side / 2

    to_src = rgb.size[0] / shape[1]
    box_src = tuple(round(v * to_src) for v in (col0, row0, col0 + side, row0 + side))
    crop = rgb.crop(box_src).resize((size, size), Image.Resampling.BILINEAR)
    xin = np.asarray(crop, np.float32) / 255.0
    xin = (xin - np.asarray(FACE_PARSER.mean, np.float32)) / np.asarray(FACE_PARSER.std, np.float32)
    logits = session.run(None, {session.get_inputs()[0].name: xin.transpose(2, 0, 1)[None].astype(np.float32)})[0][0]
    logits = logits - logits.max(axis=0, keepdims=True)
    prob = np.exp(logits)
    prob /= prob.sum(axis=0, keepdims=True)

    s_px = max(2, round(side))
    probs = np.stack(
        [
            np.asarray(
                Image.fromarray(p.astype(np.float32), mode="F").resize((s_px, s_px), Image.Resampling.BILINEAR)
            )
            for p in prob
        ],
        axis=-1,
    )
    return probs, (round(row0), round(col0), s_px)


def face_part_labels(
    parses: list[tuple[NDArray[np.float32], tuple[int, int, int]]],
    shape: tuple[int, int],
    on_subject: bool = False,
) -> NDArray[np.int32]:
    """The argmax parse over every face crop (the most confident crop wins where
    they overlap), ``BACKGROUND`` outside every crop.

    ``on_subject``: the pixel is known to be on the subject (the subject mask
    decides the silhouette), so background is not a choice and the argmax runs
    over the 18 part classes: a braid or a shoulder the parser half-dismissed
    as background takes its most likely part."""
    labels = np.zeros(shape, np.int32)
    conf = np.zeros(shape, np.float32)
    for probs, (r0, c0, s) in parses:
        rs, cs = max(0, r0), max(0, c0)
        re, ce = min(shape[0], r0 + s), min(shape[1], c0 + s)
        if re <= rs or ce <= cs:
            continue
        sub = probs[rs - r0 : re - r0, cs - c0 : ce - c0]
        if on_subject:
            sub = sub[..., 1:] / np.maximum(1e-6, 1.0 - sub[..., :1])
            lab = sub.argmax(axis=-1).astype(np.int32) + 1
        else:
            lab = sub.argmax(axis=-1).astype(np.int32)
        p = sub.max(axis=-1)
        win = p > conf[rs:re, cs:ce]
        labels[rs:re, cs:ce][win] = lab[win]
        conf[rs:re, cs:ce][win] = p[win]
    return labels


def confirms_face(labels: NDArray[np.int32], face: Face) -> bool:
    """The parse sees a face in the detection box: skin covers a third of it,
    with a nose and at least one eye or brow on the skin."""
    x, y, w, h = (round(v) for v in face.box)
    box = labels[max(0, y) : max(0, y + h), max(0, x) : max(0, x + w)]
    if box.size == 0:
        return False
    skin = float(np.mean(box == SKIN))
    has_nose = bool(np.any(box == NOSE))
    has_eye = bool(np.any(np.isin(box, (2, 3, 4, 5, 6))))
    return skin >= 1 / 3 and has_nose and has_eye


def absorb_small(labels: NDArray[np.int32], min_area: dict[int, float], default: float) -> NDArray[np.int32]:
    """Components of a label below its minimum area take the nearest other label."""
    out = labels.copy()
    small = np.zeros(labels.shape, bool)
    for lab in np.unique(labels):
        if lab == BACKGROUND:
            continue
        comp, n = ndi.label(labels == lab)
        if n == 0:
            continue
        sizes = ndi.sum(np.ones(labels.shape), comp, index=np.arange(1, n + 1))
        floor = min_area.get(int(lab), default)
        bad = np.flatnonzero(sizes < floor) + 1
        if bad.size:
            small |= np.isin(comp, bad)
    if not small.any():
        return out
    _, (ri, ci) = ndi.distance_transform_edt(small, return_indices=True)
    out[small] = labels[ri[small], ci[small]]
    return out


# ---------------------------------------------------------------------------
# The part map
# ---------------------------------------------------------------------------


def part_labels(image: LoadedImage, subject: NDArray[np.bool_]) -> PartLabels:
    """Label every pixel of the pipeline grid with its part (module docstring)."""
    shape = image.grayscale.shape
    rgb = _source_rgb(image)
    subject_area = float(subject.sum())

    faces = [
        f for f in detect_faces(rgb, shape)
        if subject[
            min(shape[0] - 1, max(0, round(f.box[1] + f.box[3] / 2))),
            min(shape[1] - 1, max(0, round(f.box[0] + f.box[2] / 2))),
        ]
    ]
    parses = [(f, parse_face(rgb, f, shape)) for f in faces]
    parses = [(f, p) for f, p in parses if confirms_face(face_part_labels([p], shape), f)]
    faces = [f for f, _ in parses]
    parsed = face_part_labels([p for _, p in parses], shape, on_subject=True) if parses else None

    if parsed is not None:
        # A confirmed face makes the subject a person: what the saliency kept
        # beside them (a plant, a chair) is cut away (``contours.person``).
        subject = person_cut(rgb, subject)
        subject_area = float(subject.sum())
        labels = np.where(subject, np.where(parsed > BACKGROUND, parsed, UNPARSED), BACKGROUND)
        side = max(max(f.box[2], f.box[3]) for f in faces)
        feature_floor = (FEATURE_MIN_SIDE * side) ** 2
        labels = absorb_small(
            labels.astype(np.int32),
            {k: feature_floor for k in FEATURES},
            REGION_MIN_FRACTION * subject_area,
        )
        labels = irises(labels, image.lab)
        n = IRIS + 1
        drawn = ~np.eye(n, dtype=bool)
        drawn[UNPARSED, :] = False
        drawn[:, UNPARSED] = False
        drawn[BACKGROUND, UNPARSED] = drawn[UNPARSED, BACKGROUND] = True
        return PartLabels(_frame_band(labels), drawn, tuple(faces), "face-parsing")

    labels = np.where(subject, UNPARSED, BACKGROUND).astype(np.int32)
    drawn = np.zeros((UNPARSED + 1, UNPARSED + 1), dtype=bool)
    drawn[BACKGROUND, UNPARSED] = drawn[UNPARSED, BACKGROUND] = True
    return PartLabels(_frame_band(labels), drawn, (), "silhouette")


FRAME_BAND_PX = 3
IRIS_EYE_RATIO = 0.4
"""The visible iris's diameter over the eye opening's width (about 12 mm over
30 mm in an adult eye)."""
IRIS_MIN_DELTA_L = 10.0
"""The iris must be this much darker (CIELAB L) than the rest of the eye."""


def irises(labels: NDArray[np.int32], lab_norm: NDArray[np.float64] | None) -> NDArray[np.int32]:
    """Split each parsed eye into its iris and the white.

    The parser's eye class is the whole opening between the lids; a drawing
    also shows the iris.  The iris is a disc ``IRIS_EYE_RATIO`` of the eye's
    width across (its width read off the eye's principal axis), clipped by the
    lids (the eye region), placed where it covers the most eye darker than
    the eye's mean.  It is drawn only when it is clearly darker than the rest of the eye
    (``IRIS_MIN_DELTA_L``): a closed eye or a lit one has no visible iris."""
    if lab_norm is None:
        return labels
    lum = lab_norm[..., 0] * 100.0
    out = labels.copy()
    comp, n = ndi.label(np.isin(labels, EYES))
    for i, sl in enumerate(ndi.find_objects(comp), start=1):
        if sl is None:
            continue
        rows, cols = sl
        eye = comp[sl] == i
        if eye.sum() < 16:
            continue
        rr, cc = np.nonzero(eye)
        cov = np.cov(np.vstack([rr, cc]).astype(np.float64))
        width = 4.0 * float(np.sqrt(max(np.linalg.eigvalsh(cov)[-1], 0.0)))
        radius = 0.5 * IRIS_EYE_RATIO * width
        if radius < 1.5:
            continue
        k = int(np.ceil(radius))
        yy, xx = np.mgrid[-k : k + 1, -k : k + 1]
        disc = (yy**2 + xx**2 <= radius**2).astype(np.float64)
        # A matched filter: the disc goes where it covers the most eye darker
        # than the eye's mean (a shadowed lid rim covers too little of it).
        excess = np.where(eye, lum[sl][eye].mean() - lum[sl], 0.0)
        score = ndi.convolve(excess, disc, mode="constant")
        score[~eye] = -np.inf
        cy, cx = np.unravel_index(int(np.argmax(score)), eye.shape)
        gy, gx = np.mgrid[: eye.shape[0], : eye.shape[1]]
        iris = eye & ((gy - cy) ** 2 + (gx - cx) ** 2 <= radius**2)
        white = eye & ~iris
        if not white.any():
            continue
        if float(lum[sl][white].mean() - lum[sl][iris].mean()) < IRIS_MIN_DELTA_L:
            continue
        out[sl][iris] = IRIS
    return out


def _frame_band(labels: NDArray[np.int32]) -> NDArray[np.int32]:
    """Carry the labels ``FRAME_BAND_PX`` in from the frame out to it, so a
    boundary meets the frame square-on and never runs along it (the frame is
    not a line of the subject)."""
    b = FRAME_BAND_PX
    h, w = labels.shape
    if h <= 2 * b + 1 or w <= 2 * b + 1:
        return labels
    out = labels.copy()
    out[:b, :] = out[b, :]
    out[-b:, :] = out[-b - 1, :]
    out[:, :b] = out[:, b : b + 1]
    out[:, -b:] = out[:, -b - 1 : -b]
    return out
