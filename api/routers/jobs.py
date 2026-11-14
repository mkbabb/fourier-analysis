"""The job resource: poll it, stream it, cancel it (``api/services/jobs.py``).

    GET    /api/jobs/{id}?after=<seq>  the job's state, and its events after seq
    GET    /api/jobs/{id}/events       Server-Sent Events from Last-Event-ID
                                       (or ?after=<seq>) to the terminal event
    DELETE /api/jobs/{id}              cancel

The job id is an unguessable token (128 bits) handed only to the client that
created the job; holding it is the read right, as for an upload's URL. The
create route did the access check. The client contract is
``docs/api/compute-jobs.md``.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.lib.crud import errors
from api.services import jobs
from api.services.equation_series import ExpressionInvalid

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

HEARTBEAT_S = 15.0
RETRY_MS = 2000


class JobCreated(BaseModel):
    """The 202 body of every job-creating POST."""

    id: str
    kind: str
    state: str
    status_url: str
    events_url: str


def created(job: jobs.Job) -> JobCreated:
    return JobCreated(
        id=job.id,
        kind=job.kind,
        state=job.state,
        status_url=f"/api/jobs/{job.id}",
        events_url=f"/api/jobs/{job.id}/events",
    )


def job_error(exc: BaseException) -> dict:
    """A failure as the ``error`` event's data (``status`` as HTTP would say it)."""
    if isinstance(exc, HTTPException):
        return {"status": exc.status_code, "detail": exc.detail}
    if isinstance(exc, ExpressionInvalid):
        return {"status": 422, "detail": str(exc)}
    return {"status": 500, "detail": "The computation failed"}


def _event(e: jobs.JobEvent) -> dict:
    return {"seq": e.seq, "event": e.event, "data": e.data}


def _after(request: Request, after: int | None) -> int:
    raw = request.headers.get("last-event-id")
    if raw is not None and raw.isdigit():
        return int(raw)
    return max(0, after or 0)


@router.get("/{job_id}")
async def get_job(job_id: str, after: int | None = None):
    job = jobs.registry.get(job_id)
    if job is None:
        return errors.not_found(detail="no such job (finished jobs are kept 10 minutes)")
    job.touch()
    return {**job.snapshot(), "events": [_event(e) for e in job.events[max(0, after or 0):]]}


@router.delete("/{job_id}", status_code=204)
async def cancel_job(job_id: str):
    job = jobs.registry.get(job_id)
    if job is None:
        return errors.not_found(detail="no such job")
    job.cancel("client")
    return Response(status_code=204)


@router.get("/{job_id}/events")
async def stream_job(job_id: str, request: Request, after: int | None = None):
    job = jobs.registry.get(job_id)
    if job is None:
        return errors.not_found(detail="no such job (finished jobs are kept 10 minutes)")
    seq = _after(request, after)

    async def stream() -> AsyncIterator[str]:
        nonlocal seq
        job.watch()
        try:
            yield f"retry: {RETRY_MS}\n\n"
            while True:
                batch = await job.events_after(seq, HEARTBEAT_S)
                if not batch:
                    if job.state in jobs.TERMINAL:
                        return
                    # Keeps the proxies (nginx's proxy_read_timeout) from closing an idle stream.
                    yield ": keepalive\n\n"
                    continue
                for e in batch:
                    seq = e.seq
                    yield f"id: {e.seq}\nevent: {e.event}\ndata: {json.dumps(e.data, separators=(',', ':'))}\n\n"
                if job.state in jobs.TERMINAL and seq >= len(job.events):
                    return
        finally:
            # A closed stream (the client went away) leaves the job unwatched:
            # it is cancelled unless a reconnect or a poll comes within the grace.
            job.unwatch()

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
