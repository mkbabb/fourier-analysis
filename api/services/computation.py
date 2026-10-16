"""Wraps fourier_analysis library for async compute endpoints."""

from __future__ import annotations

import asyncio
import multiprocessing
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from typing import Any, Callable

import numpy as np
from fastapi import HTTPException

from fourier_analysis.bases import build_animation_data
from fourier_analysis.contours import ContourConfig, extract_contours, resample_arc_length
from fourier_analysis.epicycles import EpicycleChain
from fourier_analysis.shortest_tour import build_contour_tour

from api.config import get_settings

_semaphore: asyncio.Semaphore | None = None
_process_pool: ProcessPoolExecutor | None = None


def _get_semaphore() -> asyncio.Semaphore:
    global _semaphore
    if _semaphore is None:
        _semaphore = asyncio.Semaphore(get_settings().compute_concurrency)
    return _semaphore


async def submit_compute_job(name: str, fn: Callable[[], Any]) -> Any:
    """Run *fn* in a thread with bounded concurrency and timeout."""
    sem = _get_semaphore()
    settings = get_settings()

    try:
        await asyncio.wait_for(sem.acquire(), timeout=30.0)
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=429,
            detail="Compute queue saturated, try again shortly",
        )

    try:
        return await asyncio.wait_for(
            asyncio.to_thread(fn),
            timeout=settings.compute_timeout_s,
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail=f"Compute job '{name}' timed out after {settings.compute_timeout_s}s",
        )
    finally:
        sem.release()


def _get_process_pool() -> ProcessPoolExecutor:
    """The worker processes for jobs that need a process's main thread.

    ``spawn``, never ``fork``: the server process runs threads (the event loop's
    executor, the database driver), and a forked child inherits their locks.
    """
    global _process_pool
    if _process_pool is None:
        _process_pool = ProcessPoolExecutor(
            max_workers=get_settings().compute_concurrency,
            mp_context=multiprocessing.get_context("spawn"),
        )
    return _process_pool


def shutdown_process_pool() -> None:
    """Stop the worker processes (the app lifespan's exit)."""
    global _process_pool
    if _process_pool is not None:
        _process_pool.shutdown(wait=False, cancel_futures=True)
        _process_pool = None


async def submit_process_job(name: str, fn: Callable[..., Any], *args: Any) -> Any:
    """Run the module-level *fn* with *args* in a worker process, bounded like
    ``submit_compute_job`` (the same semaphore, the same timeout).

    X.F.W14V `.u2` — a job whose library code arms a ``SIGALRM`` timer (the
    symbolic tier) needs a MAIN thread, which a ``to_thread`` worker never is; a
    pool worker runs each task on its process's main thread.
    """
    sem = _get_semaphore()
    settings = get_settings()

    try:
        await asyncio.wait_for(sem.acquire(), timeout=30.0)
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=429,
            detail="Compute queue saturated, try again shortly",
        )

    try:
        loop = asyncio.get_running_loop()
        return await asyncio.wait_for(
            loop.run_in_executor(_get_process_pool(), fn, *args),
            timeout=settings.compute_timeout_s,
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail=f"Compute job '{name}' timed out after {settings.compute_timeout_s}s",
        )
    finally:
        sem.release()


async def compute_contours(
    image_path: Path,
    config: ContourConfig,
) -> dict[str, Any]:
    """Extract contours using the given config, returning serializable results."""
    def _run():
        from PIL import Image, ImageOps

        # Get resized dimensions without running the full extraction pipeline.
        img = Image.open(image_path)
        img = ImageOps.exif_transpose(img)
        orig_w, orig_h = img.size
        img.close()
        resize = config.resize
        if resize is not None:
            ratio = resize / max(orig_w, orig_h)
            rw = int(orig_w * ratio)
            rh = int(orig_h * ratio)
        else:
            rw, rh = orig_w, orig_h

        contours = extract_contours(image_path, config)
        contour_data = [
            {"x": c.real.tolist(), "y": c.imag.tolist(), "n_points": len(c)}
            for c in contours
        ]

        image_bounds = {
            "minX": -rw / 2,
            "maxX": rw / 2,
            "minY": -rh / 2,
            "maxY": rh / 2,
        }

        return {
            "n_contours": len(contour_data),
            "contours": contour_data,
            "image_bounds": image_bounds,
        }

    return await submit_compute_job("contours", _run)


async def compute_epicycles(
    xs: list[float],
    ys: list[float],
    n_harmonics: int = 200,
    n_points: int = 1024,
) -> dict[str, Any]:
    def _run():
        path = np.array(xs) + 1j * np.array(ys)
        path = build_contour_tour([path]).path
        path = resample_arc_length(path, n_points)
        chain = EpicycleChain.from_signal(path, n_harmonics=n_harmonics)

        components = [
            {
                "index": c.frequency,
                "coefficient": [c.coefficient.real, c.coefficient.imag],
                "amplitude": c.amplitude,
                "phase": c.phase,
            }
            for c in chain.components
        ]

        ts = np.linspace(0, 1, 3000, endpoint=False)
        trace = chain.evaluate(ts)

        return {
            "n_components": len(components),
            "components": components,
            "trace": {"x": trace.real.tolist(), "y": trace.imag.tolist()},
            "path": {"x": path.real.tolist(), "y": path.imag.tolist()},
        }

    return await submit_compute_job("epicycles", _run)


async def compute_bases(
    xs: list[float],
    ys: list[float],
    max_degree: int = 200,
    n_points: int = 1024,
    levels: list[int] | None = None,
    n_eval: int = 1000,
) -> dict[str, Any]:
    def _run():
        path = np.array(xs) + 1j * np.array(ys)
        path = build_contour_tour([path]).path
        path = resample_arc_length(path, n_points)
        return build_animation_data(path, max_degree, levels=levels, n_eval=n_eval)

    return await submit_compute_job("bases", _run)
