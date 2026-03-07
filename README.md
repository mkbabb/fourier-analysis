# `fourier-analysis`

Companion code for [*An Introduction to Fourier Analysis*](paper/fourier_paper.pdf). Fourier series computation, epicycle decomposition, contour tracing, and all paper figures.

## About

This package implements the computational backbone for the paper *An Introduction to Fourier Analysis* by me, Michael Babb — a mathematical exposition that develops Fourier series from the dual vantage of linear algebra and complex analysis, proceeding through the DFT and its applications. The code here generates every figure in the paper and exposes the core operations (coefficient extraction, reconstruction, partial sums, epicycle chains) as a usable library.

The project descends from `fourier-animate` (February 2019), an earlier Fourier series epicycle visualization tool built concurrently with [`mdarray`](https://github.com/mkbabb/mdarray). Where that project was narrowly scoped — epicycles tracing closed curves in the complex plane — this one broadens the aperture: the full pipeline from contour extraction through tour ordering, Fourier decomposition, and animation rendering, plus the figure generation apparatus for the paper itself.

The core computational path is deliberately simple. Fourier coefficients are extracted via FFT, reconstruction inverts them, and partial sums truncate the spectrum to *N* harmonics. Epicycle chains reify those coefficients as rotating phasors sorted by amplitude. The contour module handles the messier business of extracting and ordering edge paths from raster images so they can be fed to the Fourier machinery.

## Installation

```bash
uv sync
```

With development dependencies ([pytest](https://docs.pytest.org/), [ruff](https://docs.astral.sh/ruff/), mypy, pre-commit):

```bash
uv sync --extra dev
```

Requires Python 3.12+.

## CLI

The package installs a `fourier` command:

```bash
# Generate all 21 paper figures
fourier figures

# Generate specific figures
fourier figures --only F19 F20 F21

# Epicycle reconstruction from an image
fourier epicycles photo.jpg -n 200 -o reconstruction.png

# Fourier coefficients from a signal file
fourier series signal.txt -n 50 -o spectrum.png

# Render an epicycle animation
fourier animate photo.jpg -n 200 --duration 30 -o output.mp4
```

Run `fourier --help` or `fourier <subcommand> --help` for full option listings.

## Usage (Library)

### Fourier coefficients and reconstruction

```python
import numpy as np
from fourier_analysis import fourier_coefficients, fourier_reconstruct, partial_sum

# Compute coefficients of a signal
signal = np.sin(2 * np.pi * 3 * np.arange(128) / 128)
coeffs = fourier_coefficients(signal)

# Reconstruct at higher resolution
recon = fourier_reconstruct(coeffs, n_points=512)

# Partial sum with N harmonics
S_10 = partial_sum(signal, n_harmonics=10)
```

### Epicycle decomposition

```python
from fourier_analysis import EpicycleChain

chain = EpicycleChain.from_signal(signal, n_harmonics=50)

# Evaluate the chain at time t in [0, 1)
point = chain.evaluate(0.25)

# Get cumulative arm positions for drawing
positions = chain.positions_at(0.25)
```

### Contour extraction and ordering

Four [strategies](src/fourier_analysis/contours.py) are available:

| Strategy | Best for | Method |
|---|---|---|
| `auto` (default) | General use | Delegates to `multi_threshold` |
| `threshold` | Portraits, silhouettes | [Otsu binarization](https://en.wikipedia.org/wiki/Otsu%27s_method) → marching squares |
| `multi_threshold` | Interior detail | [Multi-Otsu](https://scikit-image.org/docs/stable/api/skimage.filters.html#skimage.filters.threshold_multiotsu) → contours at each level boundary |
| `canny` | Line drawings, gradients | Canny edges → morphological closing → marching squares |

```python
from fourier_analysis.contours import extract_contours, resample_arc_length
from fourier_analysis.shortest_tour import order_contours

# Extract edge contours from an image as complex paths
contours = extract_contours("image.png", strategy="auto", resize=512, blur_sigma=1.0)

# Order via KDTree nearest-neighbor + 2-opt refinement, concatenate into a single path
path = order_contours(contours, method="nearest_2opt")

# Uniform arc-length resampling for accurate FFT
path = resample_arc_length(path, n_points=1024)

# Then feed to EpicycleChain
chain = EpicycleChain.from_signal(path, n_harmonics=200)
```

### Animation

```python
from fourier_analysis.animation import FourierAnimation

anim = FourierAnimation(chain, duration=30.0, fps=30, max_circles=80)
anim.render("output.mp4")       # save to file
anim.render()                    # or display interactively
```

## Structure

```
fourier_analysis/
    assets/                      # Generated figures (PDF + PNG)
        portraits/               # Input images for epicycle reconstruction
    paper/
        fourier_paper.tex        # Paper source
        fourier_paper.bib        # Bibliography
        fourier_paper.pdf        # Compiled paper
    src/fourier_analysis/
        __init__.py              # Public API
        cli.py                   # CLI entry point (fourier command)
        series.py                # Fourier coefficients, reconstruction, partial sums
        epicycles.py             # EpicycleComponent, EpicycleChain
        fft_backend.py           # FFT backend abstraction (NumPy / mdarray)
        contours.py              # Contour extraction (Otsu, multi-Otsu, Canny)
        shortest_tour.py         # KDTree nearest-neighbor + 2-opt tour ordering
        animation.py             # Matplotlib epicycle animation renderer
        figures/
            generate_all.py      # Driver for all 21 paper figures
            f02_partial_sums.py  # ...through f21_epicycle_portraits.py
            style.py             # Shared matplotlib styling
    tests/
        test_series.py           # Coefficient, reconstruction, Parseval, shift theorem tests
        test_epicycles.py        # Epicycle chain tests
        test_contours.py         # Contour extraction and resampling tests
        test_shortest_tour.py    # Tour ordering tests
        test_fft_backend.py      # Backend switching tests
```

## Figures

Regenerate all 21 paper figures:

```bash
fourier figures
```

The figures span the paper's arc — partial sums, orthogonal projection, inner products, Fourier projection, the heat equation, Gibbs phenomenon, Fejér summation, Parseval's identity, Laurent series, DFT matrices, butterfly diagrams, Bluestein's algorithm, the convolution theorem, epicycle annotation and convergence, the contour-tracing pipeline, and epicycle portrait reconstructions.

## The mdarray connection

Both this project and [`mdarray`](https://github.com/mkbabb/mdarray) descend from `fftplusplus` (May 2018), a C++ FFTPACK port with CPython bindings and several pure-Python FFT iterations. `mdarray` carried that lineage into a full N-dimensional array library with a [Temperton](https://doi.org/10.1016/0021-9991(83)90013-X) staged mixed-radix FFT engine; this project applies the Fourier analysis to series, epicycles, and visualization.

The FFT backend is abstracted behind a [protocol](src/fourier_analysis/fft_backend.py) in `fft_backend.py`. By default, NumPy's FFT is used. If you have `mdarray` installed locally, you can switch:

```python
from fourier_analysis.fft_backend import set_backend

set_backend("mdarray")
```

Since `mdarray` isn't on PyPI, it's not listed as a dependency. To use it, install from a local checkout:

```bash
uv pip install -e /path/to/mdarray
```

Then `set_backend("mdarray")` will route all FFT calls through mdarray's pure-Python mixed-radix engine — useful for testing, pedagogical comparison, or environments where NumPy isn't available. Expect ~15–70x slower than NumPy's compiled pocketfft at typical signal lengths (1024–4096 samples), though still sub-millisecond at N=256.

## Testing

```bash
uv run pytest
```

43 tests covering coefficient extraction (DC signals, pure sinusoids, harmonic truncation), FFT roundtrip reconstruction, upsampling, partial sum convergence, Parseval's identity, shift theorem, linearity, conjugate symmetry, epicycle chain evaluation, contour extraction strategies, arc-length resampling, tour ordering, and backend switching.

## Paper

The paper source lives in `paper/` and can be compiled with:

```bash
latexmk -pdf paper/fourier_paper.tex
```

A pre-compiled PDF is included at [`paper/fourier_paper.pdf`](paper/fourier_paper.pdf).

## References

- Fourier, J.B.J. *Théorie analytique de la chaleur.* Cambridge University Press, 1878.
- Stein, E.M. and Shakarchi, R. [*Fourier Analysis: An Introduction.*](https://press.princeton.edu/books/hardcover/9780691113845/fourier-analysis) Princeton Lectures in Analysis, Princeton University Press, 2003.
- Axler, S. [*Linear Algebra Done Right.*](https://linear.axler.net/) 3rd ed., Springer, 2015.
- Ahlfors, L.V. *Complex Analysis.* 3rd ed., McGraw-Hill, 1979.
- Kreyszig, E. *Introductory Functional Analysis with Applications.* Wiley, 1978.
- Cooley, J.W. and Tukey, J.W. ["An Algorithm for the Machine Calculation of Complex Fourier Series."](https://doi.org/10.1090/S0025-5718-1965-0178586-1) *Math. Comp.* **19**(90), 297–301 (1965).
- Bluestein, L.I. ["A Linear Filtering Approach to the Computation of the Discrete Fourier Transform."](https://doi.org/10.1109/TAU.1970.1162132) *IEEE Trans. Audio Electroacoust.* **18**(4), 451–455 (1970).
- Temperton, C. ["Self-Sorting Mixed-Radix Fast Fourier Transforms."](https://doi.org/10.1016/0021-9991(83)90013-X) *J. Comput. Phys.* **52**, 1–23 (1983).
- Van Loan, C.F. *Computational Frameworks for the Fast Fourier Transform.* SIAM, 1992.

## License

MIT
