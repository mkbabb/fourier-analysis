"""Equation computation and simplification endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Response

from api.lib.crud import errors
from api.models.equations import (
    ComputeEquationRequest,
    ComputeEquationResponse,
    FourierTermDTO,
    SimplifyRequest,
    SimplifyResponse,
)
from api.services.computation import submit_compute_job, submit_process_job
from api.services.equation_series import (
    ExpressionInvalid,
    compute_series,
    displayed_n,
    render_sigma,
)

router = APIRouter(prefix="/api/equations", tags=["equations"])


def _term_to_dto(term) -> FourierTermDTO:
    return FourierTermDTO(
        n=term.n,
        coefficient_re=term.coefficient.real,
        coefficient_im=term.coefficient.imag,
        amplitude=term.amplitude,
        phase=term.phase,
    )


@router.post("/compute", response_model=ComputeEquationResponse)
async def compute_equation(req: ComputeEquationRequest) -> ComputeEquationResponse | Response:
    """Compute closed-form Fourier series for a user-supplied f(x).

    Tries three tiers:
      1. Symbolic integration (exact)
      2. Sequence identification (conjectured)
      3. Spline approximation (approximate)

    The job runs in a worker process (``equation_series`` says why).
    """
    try:
        result = await submit_process_job("equation", compute_series, req.model_dump())
    except ExpressionInvalid as e:
        return errors.validation_failed(detail=str(e))

    return ComputeEquationResponse(
        status=result["status"],
        tier=result["tier"],
        latex=result["latex"],
        latex_sigma=result["latex_sigma"],
        coefficients=[_term_to_dto(t) for t in result["terms"]],
        original_points=result["original_points"],
        reconstructed_points=result["reconstructed_points"],
        energy_captured=result["energy_captured"],
        effective_n=result["effective_n"],
    )


@router.post("/simplify", response_model=SimplifyResponse)
async def simplify_coefficients(req: SimplifyRequest) -> SimplifyResponse:
    """Simplify existing DFT coefficients for display overlay.

    X.F.W14V `.u2` — UIA-F-201: the answer carries the Σ form too, bounded at
    the displayed N (``auto_harmonics``), so a notation, budget or Auto change
    re-renders both forms without a recompute.
    """

    def _run():
        from fourier_analysis.symbolic.models import FourierTerm
        from fourier_analysis.symbolic.simplification import simplify_numerical_coefficients

        coeffs = [
            {
                "n": c.n,
                "coefficient_re": c.coefficient_re,
                "coefficient_im": c.coefficient_im,
                "amplitude": c.amplitude,
                "phase": c.phase,
            }
            for c in req.coefficients
        ]

        latex, energy, term_count = simplify_numerical_coefficients(
            coeffs, req.budget, req.notation,
        )
        terms = [
            FourierTerm(
                n=c["n"],
                coefficient=complex(c["coefficient_re"], c["coefficient_im"]),
                symbolic_expr=None,
                amplitude=c["amplitude"],
                phase=c["phase"],
            )
            for c in coeffs
        ]
        latex_sigma = render_sigma(terms, req.notation, displayed_n(terms, req.auto_harmonics))
        return {
            "latex": latex,
            "latex_sigma": latex_sigma,
            "energy_captured": energy,
            "term_count": term_count,
        }

    result = await submit_compute_job("simplify", _run)

    return SimplifyResponse(
        latex=result["latex"],
        latex_sigma=result["latex_sigma"],
        energy_captured=result["energy_captured"],
        term_count=result["term_count"],
    )
