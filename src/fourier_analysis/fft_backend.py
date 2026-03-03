"""FFT backend abstraction.

Provides a protocol-based backend system so that the package can use
either NumPy's FFT or an optional mdarray-based FFT.
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable

import numpy as np
from numpy.typing import NDArray


@runtime_checkable
class FFTBackend(Protocol):
    """Protocol for FFT backends."""

    def fft(self, x: NDArray[np.complex128]) -> NDArray[np.complex128]: ...
    def ifft(self, x: NDArray[np.complex128]) -> NDArray[np.complex128]: ...


class NumpyBackend:
    """FFT backend using numpy.fft."""

    def fft(self, x: NDArray[np.complex128]) -> NDArray[np.complex128]:
        return np.fft.fft(x)

    def ifft(self, x: NDArray[np.complex128]) -> NDArray[np.complex128]:
        return np.fft.ifft(x)


class MdarrayBackend:
    """FFT backend using mdarray's mixed-radix FFT (Temperton + Bluestein).

    Converts between numpy arrays and mdarray objects at the boundary,
    since mdarray's FFT routines operate on their own array type.
    """

    def __init__(self) -> None:
        try:
            from mdarray import mdarray as mdarray_cls
            from mdarray.fft import cfft, ifft

            self._mdarray_cls = mdarray_cls
            self._cfft = cfft
            self._ifft = ifft
        except ImportError as e:
            raise ImportError(
                "mdarray is not installed. Install from source: "
                "uv pip install -e ~/Programming/mdarray"
            ) from e

    def _to_mdarray(self, x: NDArray[np.complex128]):
        """Wrap a numpy array as an mdarray."""
        return self._mdarray_cls(shape=[len(x)], data=list(x))

    def _to_numpy(self, md) -> NDArray[np.complex128]:
        """Extract an mdarray's data back into a numpy array."""
        return np.array(list(md.data), dtype=np.complex128)

    def fft(self, x: NDArray[np.complex128]) -> NDArray[np.complex128]:
        return self._to_numpy(self._cfft(self._to_mdarray(x)))

    def ifft(self, x: NDArray[np.complex128]) -> NDArray[np.complex128]:
        return self._to_numpy(self._ifft(self._to_mdarray(x)))


_current_backend: FFTBackend = NumpyBackend()


def set_backend(name: str) -> None:
    """Set the global FFT backend.

    Parameters
    ----------
    name : str
        One of "numpy" or "mdarray".
    """
    global _current_backend
    if name == "numpy":
        _current_backend = NumpyBackend()
    elif name == "mdarray":
        _current_backend = MdarrayBackend()
    else:
        raise ValueError(f"Unknown backend: {name!r}. Use 'numpy' or 'mdarray'.")


def get_backend() -> FFTBackend:
    """Return the current FFT backend."""
    return _current_backend
