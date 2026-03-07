"""Human-readable slug generation using coolname library."""

from __future__ import annotations

import coolname


def generate_slug() -> str:
    """Generate a 4-word slug like 'big-red-angry-python'."""
    return coolname.generate_slug(4)
