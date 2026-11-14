"""Equation computation and simplification endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Response

from api.lib.crud import errors
from api.models.equations import (
    ComputeEquationRequest,
    ComputeEquationResponse,
    FourierTermDTO,
    SimplifyRequest,
    SimplifyResponse,
)
from api.routers.jobs import JobCreated, created, job_error
from api.services import jobs
from api.services.computation import submit_compute_job, submit_process_job
from api.services.equation_series import (
    STAGES,
    ExpressionInvalid,
    compute_series,
    displayed_n,
    parse_function_of_x,
    render_sigma,
    term_dto,
)

router = APIRouter(prefix="/api/equations", tags=["equations"])


def _response(result: dict) -> ComputeEquationResponse:
    return ComputeEquationResponse(
        status=result["status"],
        tier=result["tier"],
        latex=result["latex"],
        latex_sigma=result["latex_sigma"],
        coefficients=[FourierTermDTO(**term_dto(t)) for t in result["terms"]],
        original_points=result["original_points"],
        reconstructed_points=result["reconstructed_points"],
        energy_captured=result["energy_captured"],
        effective_n=result["effective_n"],
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
    return _response(result)


@router.post("/jobs", status_code=202, response_model=JobCreated)
async def start_equation_job(req: ComputeEquationRequest) -> Any:
    """``/compute`` as a job (TRIAGE-16 rows F-a and 50): answers at once with
    the job's id; ``GET /api/jobs/{id}/events`` streams the stages, a
    ``samples`` partial, one ``coefficient`` partial per harmonic and the
    ``result``, which is ``/compute``'s response. An f(x) that does not parse
    answers 422 here, before any job exists."""
    try:
        parse_function_of_x(req.expression)
    except ExpressionInvalid as e:
        return errors.validation_failed(detail=str(e))

    async def work(progress: jobs.Progress) -> dict:
        result = await submit_process_job("equation", compute_series, req.model_dump())
        return _response(result).model_dump(mode="json")

    try:
        job = jobs.registry.start("equation", STAGES, work, job_error)
    except jobs.TooManyJobs:
        return errors.rate_limited(5, detail="too many computations in progress")
    return created(job)


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
