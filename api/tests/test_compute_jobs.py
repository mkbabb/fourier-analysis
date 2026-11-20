"""Compute jobs with streamed progress (TRIAGE-16 rows F-a and 50).

The registry's lifecycle, the order and monotonicity of its events, the two ways
a job is cancelled (asked, or unwatched past the grace) and the finished-job
TTL; then the equation job end to end through the real ASGI stack and a spawned
pool worker (COMPUTE_CONCURRENCY=1: the one worker, as in production), its
Server-Sent Events stream, a resumed stream, and a cancel that frees the slot.
"""

from __future__ import annotations

import asyncio
import json
import threading
from typing import Any

import pytest

from api.services import computation, jobs
from conftest import asgi, requires_mongo, run_db

JSON = [("content-type", "application/json")]
STAGES = {"a": (0.0, 0.5), "b": (0.5, 1.0)}


def _error(exc: BaseException) -> dict[str, Any]:
    return {"status": 500, "detail": str(exc)}


@pytest.fixture(autouse=True)
def _fresh_compute_state(monkeypatch):
    # The compute slot binds to the loop that first waits on it; each test runs
    # its own loop.
    monkeypatch.setattr(computation, "_semaphore", None)
    monkeypatch.setattr(jobs, "registry", jobs.JobRegistry())
    yield


@pytest.fixture(scope="module", autouse=True)
def _pool_down():
    yield
    computation.shutdown_process_pool()


# ---------------------------------------------------------------------------
# The registry
# ---------------------------------------------------------------------------


def test_lifecycle_events_in_order_and_result():
    async def body():
        async def work(p: jobs.Progress) -> dict:
            p.stage("a", 0.5)
            p.partial("a", {"piece": 1})
            await asyncio.sleep(0)
            p.stage("b", 1.0)
            return {"answer": 42}

        job = jobs.registry.start("t", STAGES, work, _error)
        assert job.state == "queued"
        await job.task
        return job

    job = asyncio.run(body())
    assert [(e.seq, e.event) for e in job.events] == [
        (1, "stage"), (2, "stage"), (3, "partial"), (4, "stage"), (5, "result"),
    ]
    assert job.state == "done" and job.result == {"answer": 42}
    assert [e.data["fraction"] for e in job.events if e.event == "stage"] == [0.0, 0.25, 1.0]
    snap = job.snapshot()
    assert snap["state"] == "done" and snap["fraction"] == 1.0 and snap["partial"] == {"stage": "a", "piece": 1}


def test_fraction_never_moves_back():
    async def body():
        async def work(p: jobs.Progress) -> dict:
            p.stage("b", 0.5)  # 0.75
            p.stage("a", 1.0)  # 0.5, reported late: held at 0.75
            p.stage("b", 0.6)  # 0.8
            return {}

        job = jobs.registry.start("t", STAGES, work, _error)
        await job.task
        return job

    job = asyncio.run(body())
    fractions = [e.data["fraction"] for e in job.events if e.event == "stage"]
    assert fractions == sorted(fractions) == [0.0, 0.75, 0.75, 0.8]
    assert [e.seq for e in job.events] == list(range(1, len(job.events) + 1))


def test_failure_is_the_error_event():
    async def body():
        async def work(p: jobs.Progress) -> dict:
            raise RuntimeError("boom")

        job = jobs.registry.start("t", STAGES, work, _error)
        await job.task
        return job

    job = asyncio.run(body())
    assert job.state == "failed"
    assert job.events[-1].event == "error" and job.events[-1].data == {"status": 500, "detail": "boom"}


def test_cancel_stops_thread_work_at_its_next_report():
    """A thread cannot be interrupted; it stops at its next report, and the
    compute slot is free again as soon as it does."""
    reports: list[int] = []
    release = threading.Event()

    def thread_work() -> dict:
        for i in range(1000):
            release.wait(5)
            reports.append(i)
            jobs.report("a", i / 1000)
        return {}

    async def body():
        async def work(p: jobs.Progress) -> dict:
            return await computation.submit_compute_job("t", thread_work)

        job = jobs.registry.start("t", STAGES, work, _error)
        await asyncio.sleep(0.05)
        assert job.cancel("client") is True
        release.set()
        sem = computation._get_semaphore()
        await asyncio.wait_for(sem.acquire(), 5)  # the slot comes back
        sem.release()
        return job

    job = asyncio.run(body())
    assert job.state == "cancelled" and job.events[-1].data == {"reason": "client"}
    assert len(reports) <= 1, reports
    assert job.cancel("client") is False  # already finished


def test_unwatched_job_is_cancelled_after_the_grace(monkeypatch):
    monkeypatch.setattr(jobs, "UNWATCHED_GRACE_S", 0.05)

    async def body():
        async def work(p: jobs.Progress) -> dict:
            await asyncio.sleep(10)
            return {}

        never_watched = jobs.registry.start("t", STAGES, work, _error)
        dropped = jobs.registry.start("t", STAGES, work, _error)
        dropped.watch()
        dropped.unwatch()  # the stream closed
        reconnected = jobs.registry.start("t", STAGES, work, _error)
        reconnected.watch()
        reconnected.unwatch()
        reconnected.watch()  # back within the grace
        await asyncio.sleep(0.2)
        states = (never_watched.state, dropped.state, reconnected.state)
        reconnected.cancel()
        return states, dropped

    (a, b, c), dropped = asyncio.run(body())
    assert (a, b, c) == ("cancelled", "cancelled", "queued")
    assert dropped.events[-1].data == {"reason": "unwatched"}


def test_finished_jobs_expire_after_the_ttl():
    now = [1000.0]
    registry = jobs.JobRegistry(clock=lambda: now[0])

    async def body():
        async def work(p: jobs.Progress) -> dict:
            return {}

        job = registry.start("t", STAGES, work, _error)
        await job.task
        return job

    job = asyncio.run(body())
    # Finished-at is stamped from the monotonic clock; drive the TTL off it.
    job.finished_at = now[0]
    now[0] += jobs.FINISHED_TTL_S - 1
    assert registry.get(job.id) is job
    now[0] += 2
    assert registry.get(job.id) is None and len(registry) == 0


def test_live_jobs_are_bounded(monkeypatch):
    monkeypatch.setattr(jobs, "MAX_LIVE_JOBS", 2)

    async def body():
        async def work(p: jobs.Progress) -> dict:
            await asyncio.sleep(10)
            return {}

        held = [jobs.registry.start("t", STAGES, work, _error) for _ in range(2)]
        with pytest.raises(jobs.TooManyJobs):
            jobs.registry.start("t", STAGES, work, _error)
        for j in held:
            j.cancel()

    asyncio.run(body())


def test_worker_progress_reads_the_cancel_ring(monkeypatch):
    sent: list[tuple] = []

    class Q:
        def put(self, item):
            sent.append(item)

    ring = [0] * jobs.CANCEL_RING
    jobs.init_worker(Q(), ring)
    try:
        p = jobs.WorkerProgress(300)
        p.stage("integrate", 0.5, done=1, total=2)
        ring[300 % jobs.CANCEL_RING] = 300
        with pytest.raises(jobs.JobCancelled):
            p.partial("coefficient", {"n": 0})
        assert sent == [(300, "stage", "integrate", 0.5, {"done": 1, "total": 2})]
    finally:
        jobs.init_worker(None, None)


# ---------------------------------------------------------------------------
# The equation job through the ASGI stack and a real pool worker
# ---------------------------------------------------------------------------

DEFAULT = {
    "expression": "x*(pi - x)",
    "domain_start": 0,
    "domain_end": 3.141592653589793,
    "n_harmonics": 6,
    "n_eval_points": 100,
    "notation": "trig",
    "budget": 7,
    "auto_harmonics": True,
}


class Stream:
    """A streaming ASGI request: events as they arrive, and a disconnect."""

    def __init__(self, path: str, headers: list[tuple[str, str]] | None = None, query: str = ""):
        from api.main import app

        self.chunks: asyncio.Queue[bytes | None] = asyncio.Queue()
        self.status: int | None = None
        self.headers: dict[str, str] = {}
        self._gone = asyncio.Event()
        self._buf = ""
        scope = {
            "type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1",
            "method": "GET", "scheme": "http", "path": path, "raw_path": path.encode(),
            "query_string": query.encode(), "root_path": "",
            "headers": [(k.lower().encode(), v.encode()) for k, v in (headers or [])],
            "client": ("127.0.0.1", 50000), "server": ("testserver", 80),
        }
        sent_body = False

        async def receive():
            nonlocal sent_body
            if not sent_body:
                sent_body = True
                return {"type": "http.request", "body": b"", "more_body": False}
            await self._gone.wait()
            return {"type": "http.disconnect"}

        async def send(message):
            if message["type"] == "http.response.start":
                self.status = message["status"]
                self.headers = {k.decode(): v.decode() for k, v in message["headers"]}
            elif message["type"] == "http.response.body":
                if message.get("body"):
                    await self.chunks.put(message["body"])
                if not message.get("more_body"):
                    await self.chunks.put(None)

        self.task = asyncio.ensure_future(app(scope, receive, send))

    async def events(self, timeout: float = 30.0):
        """Parsed SSE events ``(id, event, data)`` until the stream ends."""
        while True:
            while "\n\n" in self._buf:
                block, self._buf = self._buf.split("\n\n", 1)
                fields = dict(
                    line.split(": ", 1) for line in block.splitlines() if ": " in line and not line.startswith(":")
                )
                if "event" in fields:
                    yield int(fields["id"]), fields["event"], json.loads(fields["data"])
            chunk = await asyncio.wait_for(self.chunks.get(), timeout)
            if chunk is None:
                return
            self._buf += chunk.decode()

    async def close(self):
        self._gone.set()
        await asyncio.wait_for(self.task, 5)


async def _create(body: dict) -> dict:
    status, raw = await asgi("POST", "/api/equations/jobs", json.dumps(body).encode(), JSON)
    assert status == 202, raw
    return json.loads(raw)


def test_equation_job_streams_stages_partials_and_the_compute_result():
    async def body():
        created = await _create(DEFAULT)
        s = Stream(created["events_url"])
        got = [e async for e in s.events()]
        await s.close()
        status, raw = await asgi("POST", "/api/equations/compute", json.dumps(DEFAULT).encode(), JSON)
        return created, s, got, status, json.loads(raw)

    created, s, got, status, sync = asyncio.run(body())
    assert created["state"] == "queued" and created["status_url"] == f"/api/jobs/{created['id']}"
    assert s.status == 200 and s.headers["content-type"].startswith("text/event-stream")
    assert s.headers["x-accel-buffering"] == "no"

    ids = [i for i, _, _ in got]
    assert ids == list(range(1, len(got) + 1))
    names = [(ev, d.get("stage")) for _, ev, d in got]
    assert names[0] == ("stage", "queued")
    assert names.index(("partial", "samples")) < names.index(("partial", "coefficient"))
    coeffs = [d for _, ev, d in got if ev == "partial" and d["stage"] == "coefficient"]
    assert [c["n"] for c in coeffs] == [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]
    assert coeffs[-1]["done"] == coeffs[-1]["total"] == 13
    fractions = [d["fraction"] for _, ev, d in got if ev == "stage"]
    assert fractions == sorted(fractions)
    stages = [d["stage"] for _, ev, d in got if ev == "stage"]
    assert stages[1] == "parse" and stages[-1] == "render"

    last_id, last_ev, result = got[-1]
    assert last_ev == "result"
    assert status == 200 and result == sync  # the result IS /compute's answer


def test_the_result_waits_for_the_workers_last_reports(monkeypatch):
    """The answer returns on the pool's pipe, the reports on the queue: a slow
    replay of the reports must not let the result overtake them (the full
    suite caught it: 2 of 13 coefficients before the result)."""
    import time

    replay = jobs.Progress.partial

    def slow(self, name, payload):
        time.sleep(0.02)  # on the drain thread
        replay(self, name, payload)

    monkeypatch.setattr(jobs.Progress, "partial", slow)

    async def body():
        created = await _create(DEFAULT)
        s = Stream(created["events_url"])
        got = [e async for e in s.events()]
        await s.close()
        return got

    got = asyncio.run(body())
    assert got[-1][1] == "result"
    assert sum(1 for _, ev, d in got if ev == "partial" and d["stage"] == "coefficient") == 13


def test_a_dropped_stream_resumes_from_last_event_id():
    async def body():
        created = await _create(DEFAULT)
        first = Stream(created["events_url"])
        head = []
        async for e in first.events():
            head.append(e)
            if len(head) == 4:
                break
        await first.close()  # dropped mid-job
        rest_stream = Stream(created["events_url"], headers=[("last-event-id", str(head[-1][0]))])
        rest = [e async for e in rest_stream.events()]
        await rest_stream.close()
        status, raw = await asgi("GET", created["status_url"], query="after=0")
        return head, rest, status, json.loads(raw)

    head, rest, status, polled = asyncio.run(body())
    whole = head + rest
    assert [i for i, _, _ in whole] == list(range(1, len(whole) + 1))
    assert whole[-1][1] == "result"
    # The poll is the same record, for a client that cannot stream.
    assert status == 200 and polled["state"] == "done"
    assert [e["seq"] for e in polled["events"]] == [i for i, _, _ in whole]
    assert polled["result"] == whole[-1][2]


def test_cancel_through_the_api_frees_the_slot():
    # The DC term lands at once; the general c_n integral then takes ~1.4 s,
    # which is when the cancel arrives.
    heavy = {**DEFAULT, "expression": "x**2*sin(x)", "domain_end": 6.283185307179586, "n_harmonics": 50, "budget": 50}

    async def body():
        created = await _create(heavy)
        s = Stream(created["events_url"])
        seen = []
        async for e in s.events():
            seen.append(e)
            if e[1] == "partial" and e[2]["stage"] == "coefficient":
                status, _ = await asgi("DELETE", created["status_url"])
                assert status == 204
        await s.close()
        sem = computation._get_semaphore()
        await asyncio.wait_for(sem.acquire(), 20)  # the worker stopped: the slot is back
        sem.release()
        status, raw = await asgi("GET", created["status_url"])
        return seen, json.loads(raw)

    seen, polled = asyncio.run(body())
    assert seen[-1][1] == "cancelled" and seen[-1][2] == {"reason": "client"}
    assert polled["state"] == "cancelled"
    assert sum(1 for _, ev, d in seen if ev == "partial" and d["stage"] == "coefficient") < 101


# ---------------------------------------------------------------------------
# The image job: extraction moves its bar in real steps
# ---------------------------------------------------------------------------


def _disc_png(size: int = 64) -> bytes:
    import io

    from PIL import Image, ImageDraw

    img = Image.new("RGB", (size, size), (250, 250, 250))
    ImageDraw.Draw(img).ellipse((12, 12, size - 12, size - 12), fill=(20, 20, 20))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@requires_mongo
def test_the_image_jobs_extraction_reports_the_drawings_checkpoints(monkeypatch, tmp_path):
    """Extraction reports the drawing's four checkpoints (after the subject
    mask, the line maps, the vectorised lines and the routing), so before the
    ``contour`` partial the stream carries ``extract`` fractions rising strictly
    inside the stage, not only its start and end. The drawing itself is stood in
    for (its models are not part of this suite); the router, the compute thread,
    the job's context and the stream are the real ones."""
    import numpy as np

    from api.config import settings
    from api.routers.images import IMAGE_JOB_STAGES
    from api.services import database
    from fourier_analysis.contours import drawing

    monkeypatch.setattr(settings, "blob_dir", str(tmp_path))
    checkpoints = [drawing.STAGE_MASK, drawing.STAGE_LINES, drawing.STAGE_VECTORS, drawing.STAGE_ROUTED]

    def drawn(image_path, config, on_stage=None):
        assert on_stage is not None
        for fraction in checkpoints:
            on_stage(fraction)
        t = np.linspace(0.0, 2.0 * np.pi, 96, endpoint=False)
        return [20.0 * np.exp(1j * t)]

    monkeypatch.setattr(computation, "extract_contours", drawn)
    boundary = "image-job-boundary"
    upload = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="disc.png"\r\n'
        "Content-Type: image/png\r\n\r\n"
    ).encode() + _disc_png() + f"\r\n--{boundary}--\r\n".encode()

    async def body(db):
        database._db = db
        await db.images.create_index("image_slug", unique=True)
        await db.images.create_index("sha256", unique=True)
        await db.contours.create_index("contour_hash", unique=True)
        status, raw = await asgi(
            "POST", "/api/images", upload, [("content-type", f"multipart/form-data; boundary={boundary}")]
        )
        assert status == 200, raw
        slug = json.loads(raw)["image_slug"]
        status, raw = await asgi("POST", f"/api/images/{slug}/jobs", b"{}", JSON)
        assert status == 202, raw
        s = Stream(json.loads(raw)["events_url"])
        got = [e async for e in s.events(timeout=60.0)]
        await s.close()
        return got

    got = run_db(body)
    names = [(ev, d.get("stage")) for _, ev, d in got]
    assert got[-1][1] == "result", names
    cut = names.index(("partial", "contour"))
    lo, hi = IMAGE_JOB_STAGES["extract"]
    inner = [d["fraction"] for _, ev, d in got[:cut] if ev == "stage" and d["stage"] == "extract" and lo < d["fraction"] < hi]
    assert len(inner) >= 4, names
    assert inner == sorted(set(inner))
    assert inner == pytest.approx([lo + (hi - lo) * f for f in checkpoints])


def test_bad_expression_is_422_before_any_job():
    async def body():
        return await asgi("POST", "/api/equations/jobs", json.dumps({**DEFAULT, "expression": "y + 1"}).encode(), JSON)

    status, raw = asyncio.run(body())
    assert status == 422 and len(jobs.registry) == 0


def test_unknown_job_is_404():
    async def body():
        return (
            await asgi("GET", "/api/jobs/nope"),
            await asgi("GET", "/api/jobs/nope/events"),
            await asgi("DELETE", "/api/jobs/nope"),
        )

    assert [s for s, _ in asyncio.run(body())] == [404, 404, 404]
