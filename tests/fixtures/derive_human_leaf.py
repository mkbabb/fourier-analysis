"""F-REL.mem3: derive the 1024-era leaf region beside the sitter in
assets/portraits/human.png, with the 1024 BiRefNet-lite at 512f5a9's ml.py.
Run with PYTHONPATH=<git archive 512f5a9 src>/src; see human-leaf.md."""
import hashlib, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from fourier_analysis.contours import ml
from fourier_analysis.contours.image import load_image_inputs
from fourier_analysis.contours.isolation import subject_mask
from fourier_analysis.contours.models import ContourConfig
from fourier_analysis.contours.parts import part_labels

repo, out = Path(sys.argv[1]), Path(sys.argv[2])
print("ml.py:", ml.__file__)
spec = ml.BIREFNET_LITE
print("model:", spec.name, spec.input_size, spec.sha256)
print("model file sha256:", hashlib.sha256(spec.path.read_bytes()).hexdigest())
src = repo / "assets" / "portraits" / "human.png"
print("image sha256:", hashlib.sha256(src.read_bytes()).hexdigest())
config = ContourConfig().normalized()
image = load_image_inputs(src, config)
mask, _ = subject_mask(image, config)
parts = part_labels(image, mask)
print("source:", parts.source, "shape:", mask.shape)
removed = mask & ~parts.subject
b = 4
removed[:b] = removed[-b:] = False
removed[:, :b] = removed[:, -b:] = False
labels, n = ndi.label(removed)
sizes = ndi.sum(removed, labels, index=np.arange(1, n + 1))
leaf = labels == (int(np.argmax(sizes)) + 1)
print(f"mask {int(mask.sum())} removed {int(removed.sum())} ({removed.sum()/mask.sum():.4f}) "
      f"components {n} leaf {int(leaf.sum())} ({leaf.sum()/removed.sum():.4f} of removed)")
Image.fromarray(leaf).save(out)
back = np.asarray(Image.open(out)).astype(bool)
assert back.shape == leaf.shape and (back == leaf).all()
print("wrote", out, "sha256", hashlib.sha256(out.read_bytes()).hexdigest())
