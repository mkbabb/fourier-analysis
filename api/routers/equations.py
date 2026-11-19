"""Equation computation and simplification endpoints."""

from __future__ import annotations

import asyncio
import logging
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
from api.services import compute_cache, jobs
from api.services.computation import get_process_pool, submit_compute_job, submit_process_job
from api.services.equation_series import (
    STAGES,
    WARM_REQUEST,
    ExpressionInvalid,
    compute_series,
    displayed_n,
    parse_function_of_x,
    render_sigma,
    term_dto,
)

router = APIRouter(prefix="/api/equations", tags=["equations"])
logger = logging.getLogger(__name__)

# The compute cache's subject for a series: its request is the whole key.
CACHE_SUBJECT = "equation"


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


async def _file(params: dict[str, Any], result: dict[str, Any]) -> dict[str, Any]:
    """The answer's wire form, filed in the compute cache when it is exact.

    An answer with a missed harmonic or from a lower tier may be the host's
    load, not the function's (``compute_series``'s ``exact``), so it is sent
    and not kept: the next asker computes again.
    """
    wire = _response(result).model_dump(mode="json")
    if not result["exact"]:
        return wire
    return await compute_cache.store(CACHE_SUBJECT, params, wire, label="equation")


async def series_data(req: ComputeEquationRequest) -> dict[str, Any]:
    """The series' answer in its wire form, from the compute cache or computed
    in a worker process and filed there. A request answered once is the same
    answer for everyone (the page's default f(x) is every first visitor's)."""
    params = req.model_dump()
    cached = await compute_cache.lookup(CACHE_SUBJECT, params, label="equation")
    if cached is not None:
        return cached
    return await _file(params, await submit_process_job("equation", compute_series, params))


async def warm() -> None:
    """Ready the series for the first visitor, at boot.

    A cold API answered the first POST in ~3.5 s (its first ``parse`` imports
    sympy) and its worker then spent ~4 s spawning and importing before it
    integrated. This imports the parser here, starts the worker and computes
    the page's first request in it, and files that answer in the cache. The
    worker's own task is sent to the pool directly, not through a compute slot:
    a visitor's job takes the slot and queues behind it on the one worker.
    """
    try:
        await asyncio.to_thread(parse_function_of_x, WARM_REQUEST["expression"])
        req = ComputeEquationRequest(**WARM_REQUEST)
        params = req.model_dump()
        loop = asyncio.get_running_loop()
        await _file(params, await loop.run_in_executor(get_process_pool(), compute_series, params))
    except Exception:
        # A warm-up is an accelerator: the first request computes as before.
        logger.warning("equation warm-up failed", exc_info=True)


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
        return ComputeEquationResponse(**await series_data(req))
    except ExpressionInvalid as e:
        return errors.validation_failed(detail=str(e))


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
        return await series_data(req)

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
