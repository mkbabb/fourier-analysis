"""Subject saliency (a U2-Net + BiRefNet-lite ensemble) and edge detection (PiDiNet) via ONNX."""

from __future__ import annotations

import hashlib
import logging
import threading
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

import numpy as np
from numpy.typing import NDArray
from PIL import Image, ImageOps

from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.models import ContourConfig

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Subject saliency models
# ---------------------------------------------------------------------------

_IMAGENET_MEAN = (0.485, 0.456, 0.406)
_IMAGENET_STD = (0.229, 0.224, 0.225)

_CACHE_DIR = Path.home() / ".cache" / "fourier-analysis" / "models"


@dataclass(frozen=True)
class SubjectModelSpec:
    """A sha-pinned ONNX subject model and the preprocessing it was trained with.

    ``_predict_probability_map`` applies exactly this spec: RGB scaled by its
    maximum, ImageNet mean/std normalisation, resampled with ``resample`` to a
    square ``input_size``; the primary output passed through ``activation``
    and min-max rescaled to [0, 1].
    """

    name: str
    url: str
    sha256: str
    input_size: int
    mean: tuple[float, float, float] = _IMAGENET_MEAN
    std: tuple[float, float, float] = _IMAGENET_STD
    resample: Image.Resampling = Image.Resampling.LANCZOS
    activation: Literal["none", "sigmoid"] = "none"

    @property
    def path(self) -> Path:
        return _CACHE_DIR / f"{self.name}.onnx"


U2NET = SubjectModelSpec(
    name="u2net",
    url="https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx",
    sha256="8d10d2f3bb75ae3b6d527c77944fc5e7dcd94b29809d47a739a7a728a912b491",
    input_size=320,
)

BIREFNET_LITE = SubjectModelSpec(
    name="birefnet-general-lite",
    url=(
        "https://github.com/danielgatis/rembg/releases/download/v0.0.0/"
        "BiRefNet-general-bb_swin_v1_tiny-epoch_232.onnx"
    ),
    sha256="5600024376f572a557870a5eb0afb1e5961636bef4e1e22132025467d0f03333",
    input_size=1024,
    activation="sigmoid",
)

SUBJECT_MODELS: tuple[SubjectModelSpec, ...] = (U2NET, BIREFNET_LITE)
"""The subject ensemble: the saliency map is the mean of these models' maps."""

_session_lock = threading.Lock()
_sessions: dict[str, Any] = {}


def _download(spec: SubjectModelSpec) -> Path:
    path = spec.path
    if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest() == spec.sha256:
        return path
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    urllib.request.urlretrieve(spec.url, tmp)  # noqa: S310
    digest = hashlib.sha256(tmp.read_bytes()).hexdigest()
    if digest != spec.sha256:
        tmp.unlink(missing_ok=True)
        raise RuntimeError(
            f"SHA-256 mismatch for {spec.name}.onnx: expected {spec.sha256}, got {digest}"
        )
    tmp.rename(path)
    return path


def ensure_model_downloaded() -> list[Path]:
    """Download every subject model's ONNX weights if not already cached.

    Returns the paths to the cached model files.
    """
    return [_download(spec) for spec in SUBJECT_MODELS]


def _get_session(spec: SubjectModelSpec):
    """Lazy per-model ONNX inference session."""
    session = _sessions.get(spec.name)
    if session is not None:
        return session
    with _session_lock:
        session = _sessions.get(spec.name)
        if session is not None:
            return session
        try:
            import onnxruntime as ort
        except ImportError as exc:
            raise ImportError(
                "onnxruntime is required for ML contour extraction. "
                "Install with: pip install onnxruntime"
            ) from exc

        session = ort.InferenceSession(
            str(_download(spec)), providers=["CPUExecutionProvider"]
        )
        _sessions[spec.name] = session
        return session


def load_subject_sessions() -> None:
    """Open every subject model's inference session now rather than on the
    first extraction (a long-lived process, such as the API server or the
    bench, pays the load once)."""
    for spec in SUBJECT_MODELS:
        _get_session(spec)


def _source_rgb(image: LoadedImage) -> Image.Image:
    """The colour image the models were trained on (alpha composited on white)."""
    if image.source_path is None:
        return Image.fromarray((image.grayscale * 255).astype(np.uint8)).convert("RGB")
    pil = ImageOps.exif_transpose(Image.open(image.source_path))
    if pil.mode in ("RGBA", "LA", "PA", "P"):
        rgba = pil.convert("RGBA")
        white = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        pil = Image.alpha_composite(white, rgba)
    return pil.convert("RGB")


def model_input(spec: SubjectModelSpec, rgb: Image.Image) -> NDArray[np.float32]:
    """The NCHW input tensor ``spec`` prescribes for an RGB image."""
    size = spec.input_size
    x = np.asarray(rgb.resize((size, size), spec.resample), dtype=np.float32) / 255.0
    x = x / max(float(x.max()), 1e-6)
    x = (x - np.asarray(spec.mean, np.float32)) / np.asarray(spec.std, np.float32)
    return x.transpose(2, 0, 1)[np.newaxis].astype(np.float32)


def model_output(spec: SubjectModelSpec, raw: NDArray[np.floating]) -> NDArray[np.float64]:
    """The primary output map, activated and min-max rescaled to [0, 1]."""
    out = np.asarray(raw, dtype=np.float64).squeeze()
    if spec.activation == "sigmoid":
        out = 1.0 / (1.0 + np.exp(-out))
    lo, hi = float(out.min()), float(out.max())
    return (out - lo) / (hi - lo) if hi - lo > 1e-9 else np.zeros_like(out)


def _predict_one(spec: SubjectModelSpec, rgb: Image.Image, shape: tuple[int, int]) -> NDArray[np.float64]:
    session = _get_session(spec)
    x = model_input(spec, rgb)
    raw = session.run(None, {session.get_inputs()[0].name: x})[0]
    prob = model_output(spec, raw)
    h, w = shape
    resized = Image.fromarray(prob.astype(np.float32), mode="F").resize(
        (w, h), Image.Resampling.BILINEAR
    )
    return np.clip(np.asarray(resized, dtype=np.float64), 0.0, 1.0)


def _predict_probability_map(image: LoadedImage) -> NDArray[np.float64]:
    """The subject ensemble's [0, 1] probability map at the input resolution."""
    rgb = _source_rgb(image)
    shape = image.grayscale.shape
    maps = [_predict_one(spec, rgb, shape) for spec in SUBJECT_MODELS]
    return np.mean(maps, axis=0)


def ml_masks(
    image: LoadedImage,
    config: ContourConfig,
) -> tuple[NDArray[np.bool_], ...]:
    """Salient object masks via the subject ensemble.

    Generates nested iso-probability contours at multiple thresholds
    to capture both the overall silhouette and interior detail.
    """
    prob = _predict_probability_map(image)

    # Multiple thresholds on the saliency map — analogous to multi-Otsu
    # but on the probability map instead of grayscale intensity.
    thresholds = [
        config.ml.detail_threshold,   # broad: peripheral detail
        config.ml.threshold,          # primary silhouette
        min(0.85, config.ml.threshold + 0.2),  # tighter core
    ]
    # Optionally add a very tight threshold for prominent features
    if config.ml.threshold < 0.7:
        thresholds.append(min(0.92, config.ml.threshold + 0.35))

    thresholds = sorted(set(thresholds))

    masks: list[NDArray[np.bool_]] = []
    prev_count = -1
    for t in thresholds:
        mask = prob >= t
        count = int(np.count_nonzero(mask))
        # Skip if too small or nearly identical to the previous level
        if count < 0.005 * image.image_area:
            continue
        if prev_count > 0 and abs(count - prev_count) < 0.01 * image.image_area:
            continue
        masks.append(mask)
        prev_count = count

    return tuple(masks) if masks else (prob >= config.ml.threshold,)


# ---------------------------------------------------------------------------
# PiDiNet-tiny (learned edge detection)
# ---------------------------------------------------------------------------

_PIDINET_MODEL_URL = (
    "https://github.com/mkbabb/fourier-analysis/releases/download/v0.1.0/pidinet-tiny.onnx"
)
# No PiDiNet export has been published and pinned (the release URL above does
# not resolve, and the export needs PyTorch, which is not a dependency).  Until
# a digest is set here, unverified weights are never downloaded or loaded, and
# the feature stage runs on Canny ridges (``FeatureConfig.edge_model``
# defaults to 'canny'; 'auto'/'pidinet' fall back with a diagnostic note).
_PIDINET_SHA256: str | None = None
_PIDINET_INPUT_SIZE = 512

_pidinet_session_lock = threading.Lock()
_pidinet_session = None


def _pidinet_model_path() -> Path:
    return _CACHE_DIR / "pidinet-tiny.onnx"


def _pidinet_verified(path: Path) -> bool:
    return (
        _PIDINET_SHA256 is not None
        and path.exists()
        and hashlib.sha256(path.read_bytes()).hexdigest() == _PIDINET_SHA256
    )


def ensure_pidinet_downloaded() -> Path:
    """Download and verify the pinned PiDiNet-tiny ONNX weights.

    Raises ``RuntimeError`` while no digest is pinned: unverified weights are
    never fetched.
    """
    if _PIDINET_SHA256 is None:
        raise RuntimeError(
            "no pinned PiDiNet-tiny weights (ml._PIDINET_SHA256 is unset); "
            "feature ridges use Canny"
        )
    path = _pidinet_model_path()
    if _pidinet_verified(path):
        return path
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    urllib.request.urlretrieve(_PIDINET_MODEL_URL, tmp)  # noqa: S310
    digest = hashlib.sha256(tmp.read_bytes()).hexdigest()
    if digest != _PIDINET_SHA256:
        tmp.unlink(missing_ok=True)
        raise RuntimeError(
            f"SHA-256 mismatch for pidinet-tiny.onnx: expected {_PIDINET_SHA256}, got {digest}"
        )
    tmp.rename(path)
    return path


def pidinet_available() -> bool:
    """Whether pinned, verified PiDiNet weights are cached (never downloads)."""
    return _pidinet_verified(_pidinet_model_path())


def _get_pidinet_session():
    """Lazy singleton ONNX inference session for PiDiNet."""
    global _pidinet_session
    if _pidinet_session is not None:
        return _pidinet_session
    with _pidinet_session_lock:
        if _pidinet_session is not None:
            return _pidinet_session
        try:
            import onnxruntime as ort
        except ImportError:
            return None

        if not pidinet_available():
            return None
        model_path = _pidinet_model_path()

        _pidinet_session = ort.InferenceSession(
            str(model_path), providers=["CPUExecutionProvider"]
        )
        return _pidinet_session


def predict_edge_map(image: LoadedImage) -> NDArray[np.float64] | None:
    """Run PiDiNet-tiny and return a [0,1] edge probability map at input resolution.

    Returns None if the model is not available or inference fails.
    """
    session = _get_pidinet_session()
    if session is None:
        return None

    try:
        h, w = image.grayscale.shape

        if image.source_path is not None:
            pil = ImageOps.exif_transpose(Image.open(image.source_path)).convert("RGB")
        else:
            pil = Image.fromarray(
                (image.grayscale * 255).astype(np.uint8)
            ).convert("RGB")

        pil = pil.resize((_PIDINET_INPUT_SIZE, _PIDINET_INPUT_SIZE), Image.Resampling.BILINEAR)
        blob = np.array(pil, dtype=np.float32) / 255.0
        blob = blob.transpose(2, 0, 1)[np.newaxis, ...]

        input_name = session.get_inputs()[0].name
        outputs = session.run(None, {input_name: blob})
        edge_map = outputs[0].squeeze().astype(np.float64)
        edge_map = np.clip(edge_map, 0.0, 1.0)

        # Resize back to input resolution.
        edge_pil = Image.fromarray((edge_map * 255).astype(np.uint8))
        edge_pil = edge_pil.resize((w, h), Image.Resampling.BILINEAR)
        return np.array(edge_pil, dtype=np.float64) / 255.0
    except Exception:
        logger.debug("PiDiNet inference failed, falling back to Canny", exc_info=True)
        return None
