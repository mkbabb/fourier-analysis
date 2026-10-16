"""LaTeX output formatting for Fourier series.

Provides two rendering modes:
  - **expanded**: every kept term with its computed numerical coefficient (the budget truncates upstream, ``truncate_by_budget``)
  - **sigma**: compact Σ notation with symbolic a_n, b_n, c_n placeholders
"""

from __future__ import annotations

from fourier_analysis.symbolic.models import FourierTerm
from fourier_analysis.symbolic.latex_format import (
    format_number,
    format_coefficient,
    extract_trig_pairs,
)


# ─────────────────────────── Expanded renderers ───────────────────────────


def _frequency(n: int, variable: str) -> str:
    """The exponent of e for harmonic n: `it`, `-it`, `2it`, `-3it`.

    UIA-F-176: the sign leads the exponent; `i-t` (i times -t, written with
    the sign inside) read as a subtraction.
    """
    sign = "-" if n < 0 else ""
    mag = abs(n)
    return rf"{sign}{mag if mag > 1 else ''}i{variable}"


def _hooked(kind: str, term: str) -> str:
    r"""Wrap one expanded term in its coefficient family's hover hook.

    X.F.W14V `.u2` — UIA-F-253 (server limb): the expanded form carried no
    ``eq-coeff`` hooks, so coefficient hover existed only in Σ mode. The hook is
    the Σ renderers' own ``\htmlClass{eq-coeff eq-<kind>}``; the term's leading
    sign stays outside it, so KaTeX keeps the binary spacing between terms.
    """
    sign = term[0] if term[:1] in ("+", "-") else ""
    return rf"{sign}\htmlClass{{eq-coeff eq-{kind}}}{{{term[len(sign):]}}}"


def render_trig(
    terms: list[FourierTerm],
    variable: str = "t",
    compact: bool = True,
) -> str:
    """Expanded trig: every kept a_n cos(nt) + b_n sin(nt)."""
    if not terms:
        return "0"

    a0_half, pairs = extract_trig_pairs(terms)
    parts: list[str] = []

    if a0_half is not None:
        parts.append(rf"\frac{{{format_number(a0_half)}}}{{2}}")

    max_amp = max((abs(a) + abs(b) for _, a, b in pairs), default=0)
    threshold = max_amp * 0.005

    for k, a_n, b_n in pairs:
        first = len(parts) == 0
        n_str = str(k) if k > 1 else ""
        omega_t = rf"{n_str}{variable}"

        if abs(a_n) > threshold:
            parts.append(_hooked("an", rf"{format_coefficient(a_n, first=first)}\cos({omega_t})"))
            first = False
        if abs(b_n) > threshold:
            parts.append(_hooked("bn", rf"{format_coefficient(b_n, first=first)}\sin({omega_t})"))

    return " ".join(parts) if parts else "0"


def render_exponential(
    terms: list[FourierTerm],
    variable: str = "t",
    compact: bool = True,
) -> str:
    """Expanded exponential: every kept c_n e^{int}."""
    if not terms:
        return "0"

    parts: list[str] = []
    max_amp = max((t.amplitude for t in terms), default=0)
    threshold = max_amp * 0.005

    for i, t in enumerate(terms):
        if t.amplitude < threshold and t.n != 0:
            continue
        first = len(parts) == 0
        re, im = t.coefficient.real, t.coefficient.imag

        if abs(im) < 1e-14:
            coeff_str = format_coefficient(re, first=first)
        elif abs(re) < 1e-14:
            val = im
            if abs(val - 1.0) < 1e-10:
                coeff_str = ("" if first else "+") + "i"
            elif abs(val + 1.0) < 1e-10:
                coeff_str = "-i"
            else:
                coeff_str = format_number(val) + "i"
                if not first and not coeff_str.startswith("-"):
                    coeff_str = "+" + coeff_str
        else:
            coeff_str = f"({format_number(re)}{'+' if im >= 0 else ''}{format_number(im)}i)"
            if not first:
                coeff_str = "+" + coeff_str

        if t.n == 0:
            parts.append(coeff_str if coeff_str else format_number(re))
        else:
            parts.append(_hooked("cn", rf"{coeff_str}e^{{{_frequency(t.n, variable)}}}"))

    return " ".join(parts) if parts else "0"


def render_polar(
    terms: list[FourierTerm],
    variable: str = "t",
    compact: bool = True,
) -> str:
    """Expanded polar: every kept A_n e^{i(nt + phi)}."""
    if not terms:
        return "0"

    parts: list[str] = []
    max_amp = max((t.amplitude for t in terms), default=0)
    threshold = max_amp * 0.005

    for i, t in enumerate(terms):
        if t.amplitude < threshold and t.n != 0:
            continue
        first = len(parts) == 0
        A_str = format_coefficient(t.amplitude, first=first)

        if t.n == 0:
            parts.append(A_str if A_str else format_number(t.amplitude))
        else:
            n_str = str(t.n) if abs(t.n) > 1 else ("-" if t.n == -1 else "")
            if abs(t.phase) < 1e-10:
                parts.append(_hooked("An", rf"{A_str}e^{{{_frequency(t.n, variable)}}}"))
            else:
                phi_str = format_number(t.phase)
                if not phi_str.startswith("-"):
                    phi_str = "+" + phi_str
                parts.append(_hooked("An", rf"{A_str}e^{{i({n_str}{variable}{phi_str})}}"))

    return " ".join(parts) if parts else "0"


# ──────────────────────────── Sigma renderers ─────────────────────────────


def render_trig_sigma(
    terms: list[FourierTerm],
    variable: str = "t",
    compact: bool = True,
) -> str:
    r"""Sigma notation with hoverable a_n / b_n via \htmlClass."""
    if not terms:
        return "0"

    a0_half, pairs = extract_trig_pairs(terms)
    if not pairs:
        if a0_half is not None:
            return rf"\frac{{{format_number(a0_half)}}}{{2}}"
        return "0"

    N = max(k for k, _, _ in pairs)
    parts: list[str] = []
    if a0_half is not None:
        parts.append(rf"\frac{{{format_number(a0_half)}}}{{2}}")

    # Wrap a_n / b_n in \htmlClass for frontend hover interactivity
    an = r"\htmlClass{eq-coeff eq-an}{a_n}"
    bn = r"\htmlClass{eq-coeff eq-bn}{b_n}"

    # Use relative threshold (0.5% of max) to elide negligible terms (spline noise)
    max_amp = max(abs(a) + abs(b) for _, a, b in pairs)
    elide_thresh = max_amp * 0.005
    all_a_zero = all(abs(a) < elide_thresh for _, a, _ in pairs)
    all_b_zero = all(abs(b) < elide_thresh for _, _, b in pairs)

    if all_a_zero:
        sigma = rf"\sum_{{n=1}}^{{{N}}} {bn} \sin(n{variable})"
    elif all_b_zero:
        sigma = rf"\sum_{{n=1}}^{{{N}}} {an} \cos(n{variable})"
    else:
        sigma = (
            rf"\sum_{{n=1}}^{{{N}}} "
            rf"\!\left( {an} \cos(n{variable}) + {bn} \sin(n{variable}) \right)"
        )

    if parts:
        return parts[0] + " + " + sigma
    return sigma


def render_exponential_sigma(
    terms: list[FourierTerm],
    variable: str = "t",
    compact: bool = True,
) -> str:
    """Sigma notation: Σ c_n e^{int}."""
    if not terms:
        return "0"

    harmonics = [t for t in terms if t.n != 0]
    if len(harmonics) < 2:
        return render_exponential(terms, variable, compact)

    ns = sorted(t.n for t in harmonics)
    N_pos = max(ns) if any(n > 0 for n in ns) else 0
    N_neg = abs(min(ns)) if any(n < 0 for n in ns) else 0

    cn = r"\htmlClass{eq-coeff eq-cn}{c_n}"

    if N_neg > 0 and N_pos > 0 and N_neg == N_pos:
        return rf"\sum_{{n=-{N_pos}}}^{{{N_pos}}} {cn} \, e^{{in{variable}}}"
    elif N_pos > 0:
        dc = [t for t in terms if t.n == 0]
        parts: list[str] = []
        if dc and abs(dc[0].coefficient.real) > 1e-14:
            parts.append(format_number(dc[0].coefficient.real))
        parts.append(rf"\sum_{{n=1}}^{{{N_pos}}} {cn} \, e^{{in{variable}}}")
        return " + ".join(parts)

    return render_exponential(terms, variable, compact)


def render_polar_sigma(
    terms: list[FourierTerm],
    variable: str = "t",
    compact: bool = True,
) -> str:
    """Sigma notation: Σ A_n e^{i(nt + φ_n)}."""
    if not terms:
        return "0"

    harmonics = [t for t in terms if t.n != 0]
    if len(harmonics) < 2:
        return render_polar(terms, variable, compact)

    ns = sorted(t.n for t in harmonics)
    N_pos = max(ns) if any(n > 0 for n in ns) else 0
    N_neg = abs(min(ns)) if any(n < 0 for n in ns) else 0

    An = r"\htmlClass{eq-coeff eq-An}{A_n}"

    if N_neg > 0 and N_pos > 0 and N_neg == N_pos:
        return rf"\sum_{{n=-{N_pos}}}^{{{N_pos}}} {An} \, e^{{i(n{variable} + \varphi_n)}}"
    elif N_pos > 0:
        dc = [t for t in terms if t.n == 0]
        parts: list[str] = []
        if dc and dc[0].amplitude > 1e-14:
            parts.append(format_number(dc[0].amplitude))
        parts.append(
            rf"\sum_{{n=1}}^{{{N_pos}}} {An} \, e^{{i(n{variable} + \varphi_n)}}"
        )
        return " + ".join(parts)

    return render_polar(terms, variable, compact)


# ─────────────────────────── Public API ───────────────────────────────────


_EXPANDED = {"trig": render_trig, "exponential": render_exponential, "polar": render_polar}
_SIGMA = {"trig": render_trig_sigma, "exponential": render_exponential_sigma, "polar": render_polar_sigma}


def render_latex(
    terms: list[FourierTerm],
    notation: str = "trig",
    budget: int = 10,
    variable: str = "t",
    compact: bool = True,
) -> str:
    """Render the kept Fourier terms as expanded LaTeX (every term, no cap)."""
    renderer = _EXPANDED.get(notation, render_trig)
    latex = renderer(terms, variable, compact=compact)
    return f"f({variable}) \\approx {latex}"


def render_latex_sigma(
    terms: list[FourierTerm],
    notation: str = "trig",
    variable: str = "t",
) -> str:
    """Render Fourier terms in sigma notation."""
    renderer = _SIGMA.get(notation, render_trig_sigma)
    latex = renderer(terms, variable)
    return f"f({variable}) \\approx {latex}"
