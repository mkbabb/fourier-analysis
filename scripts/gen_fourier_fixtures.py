"""Golden fixtures for the @mkbabb/fourier package, from the Python engine.

Each fixture is a sampled closed curve and what the canonical engine makes of
it: ``EpicycleChain.from_signal`` (the spectrum, in the package's flat
frequency order), ``evaluate`` (the partial sum at level N on m points and the
curve at a few t), and ``positions_at`` (the chain). The package's
``test/golden.test.ts`` holds ``spectrumOf``, ``partialSum``, ``evaluateAt`` and
``chainAt`` to these within 1e-9.

    uv run python scripts/gen_fourier_fixtures.py [--name-art PATH]

``--name-art`` is daraksha's ``src/art/name-art.json`` (a font outline's
coefficients, public data); without it the letter fixture is not rewritten.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from fourier_analysis.contours import resample_arc_length
from fourier_analysis.epicycles import EpicycleChain

OUT = Path(__file__).resolve().parents[1] / "packages" / "fourier" / "test" / "fixtures"
TS = [0.0, 0.1234, 0.5, 0.987]


def flat(chain: EpicycleChain, top: int) -> list[float]:
    by_k = {c.frequency: c.coefficient for c in chain.components}
    c: list[float] = []
    for j in range(2 * top + 1):
        k = 0 if j == 0 else ((j + 1) // 2 if j % 2 else -(j // 2))
        z = by_k.get(k, 0j)
        c += [z.real, z.imag]
    return c


def pairs(z: np.ndarray) -> list[float]:
    return np.column_stack([z.real, z.imag]).ravel().tolist()


def fixture(name: str, signal: np.ndarray, harmonics: int, level: int, m: int) -> None:
    chain = EpicycleChain.from_signal(signal, n_harmonics=harmonics)
    low = EpicycleChain([c for c in chain.components if abs(c.frequency) <= level])
    theta = np.arange(m) / m
    doc = {
        "name": name,
        "points": pairs(signal),
        "harmonics": harmonics,
        "c": flat(chain, harmonics),
        "level": level,
        "m": m,
        "partialSum": pairs(np.asarray(low.evaluate(theta))),
        "at": [
            {
                "t": t,
                "value": [complex(chain.evaluate(t)).real, complex(chain.evaluate(t)).imag],
                "chain": pairs(np.asarray(chain.positions_at(t))),
            }
            for t in TS
        ],
    }
    (OUT / f"{name}.json").write_text(json.dumps(doc))
    print(f"{name}: N={len(signal)} harmonics={harmonics} level={level} m={m}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--name-art", type=Path)
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)

    th = 2 * np.pi * np.arange(512) / 512
    fixture("circle", 3 + 2j + 5 * np.exp(1j * th), 8, 3, 64)

    th = 2 * np.pi * np.arange(1000) / 1000  # not a power of two: the direct sum
    ell = (40 * np.cos(th) + 15j * np.sin(th)) * np.exp(0.6j) - 7 + 11j
    fixture("ellipse", ell, 12, 5, 64)

    square = np.array([0, 100, 100 + 100j, 100j, 0], dtype=np.complex128)
    fixture("square", resample_arc_length(square, 1024, 0.0), 64, 21, 256)

    star = np.array(
        [(60 if i % 2 == 0 else 24) * np.exp(1j * (np.pi / 2 + i * np.pi / 5)) for i in range(11)]
    )
    fixture("star", resample_arc_length(star, 2048), 96, 40, 512)

    rng = np.random.default_rng(20261110)
    th = 2 * np.pi * np.arange(4096) / 4096
    loop = (30 + 4 * np.sin(5 * th) + rng.normal(0, 0.8, 4096)) * np.exp(1j * th)
    fixture("noisy-loop", loop, 200, 60, 1024)

    if args.name_art:
        art = json.loads(args.name_art.read_text())
        body = next(c for c in art["contours"] if c["role"] == "body")
        cs = body["c"]
        top = (len(cs) // 2 - 1) // 2
        n = 2048
        spec = np.zeros(n, dtype=np.complex128)
        for j in range(2 * top + 1):
            k = 0 if j == 0 else ((j + 1) // 2 if j % 2 else -(j // 2))
            spec[k % n] = cs[2 * j] + 1j * cs[2 * j + 1]
        signal = np.fft.ifft(spec) * n
        fixture("letter", signal, top, body["n"], 512)


if __name__ == "__main__":
    main()
