"""Fourier Analysis API package.

F.W0 (chronic C4): silence the onnxruntime warning flood at import time.
``ORT_LOGGING_LEVEL=3`` (ERROR) must be set *before* onnxruntime is first
imported anywhere in the process; the package ``__init__`` is the earliest
deterministic hook for that. This kills the 4-gate chronic C4 — the rembg /
onnxruntime provider-fallback warnings that otherwise flood the API logs.
"""

import os

os.environ.setdefault("ORT_LOGGING_LEVEL", "3")
