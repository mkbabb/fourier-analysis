# Compute jobs: the client contract

The long computations answer at once with a job, and the job streams its progress
as Server-Sent Events: what stage it is in, how far along it is (a fraction that
never moves backwards), pieces of the answer the page can draw as they land, and
finally the answer itself in the shape the synchronous route returns today.

Server: `api/services/jobs.py` (the registry), `api/routers/jobs.py` (the job resource).
Asked for in TRIAGE-16 rows F-a ("the fourier API seems to be very slow") and 50
("this should be async and provide realtime updates as progress completes").

## Starting a job

| POST | body | replaces | `result` |
|---|---|---|---|
| `/api/equations/jobs` | `ComputeEquationRequest` (as `/api/equations/compute`) | `POST /api/equations/compute` | the `/compute` response, field for field |
| `/api/images/{slug}/jobs` | `{contour_settings, epicycles, bases}` | `extract-contour` + `compute/epicycles` + `compute/bases` | `{contour, epicycles, bases}` |
| `/api/contours/{hash}/jobs` | `{epicycles, bases}` | `compute/epicycles` + `compute/bases` | `{epicycles, bases}` |

`epicycles` is `compute/epicycles`' body (`{n_harmonics, n_points}`), `bases` is
`compute/bases`' body (`{max_degree, n_points, levels, n_eval}`), `contour_settings`
is `extract-contour`'s. In a result, `contour` is what `extract-contour` returns
and `epicycles` / `bases` are each compute's `data`.

Each POST answers **202**:

```json
{"id": "q8bH3…", "kind": "equation", "state": "queued",
 "status_url": "/api/jobs/q8bH3…", "events_url": "/api/jobs/q8bH3…/events"}
```

Errors that are known before any work answer on the POST itself, as today: 422 for an
f(x) that does not parse, 404 / 403 for an image or contour the caller cannot read,
429 (the compute budget, 5 a minute, shared with the synchronous routes; or too many
jobs in progress).

## The stream: `GET {events_url}`

`text/event-stream`. Every event has an `id` (1, 2, 3, ... in order), an `event` name
and JSON `data`:

| event | data | when |
|---|---|---|
| `stage` | `{stage, fraction, ...detail}` | progress; `fraction` in [0, 1], non-decreasing over the job |
| `partial` | `{stage, ...payload}` | a drawable piece of the answer (below) |
| `result` | the final answer | last event of a job that succeeded |
| `error` | `{status, detail}` | last event of a job that failed (`status` as HTTP would give it) |
| `cancelled` | `{reason}` | last event of a cancelled job (`client` or `unwatched`) |

The stream ends after the last event. A `: keepalive` comment comes every 15 s while
the job is quiet; ignore it.

### Stages and partials

**Equation** (`/api/equations/jobs`):

| stage | fraction | detail |
|---|---|---|
| `queued` | 0 | waiting for the compute slot |
| `parse` | 0 – 0.05 | |
| `integrate` | 0.05 – 0.80 | `{done, total}`, total = 2N + 1 coefficients |
| `identify` | 0.80 – 0.88 | only if the exact tier failed |
| `spline` | 0.88 – 0.92 | only if identification failed too |
| `render` | 0.92 – 1 | the TeX |

Partials:

- `samples` `{stage: "samples", x: [...], y: [...]}`: f(x) on the grid (the result's
  `original_points`). Draw the function at once.
- `coefficient` `{stage: "coefficient", n, coefficient_re, coefficient_im, amplitude,
  phase, done, total}`: one per coefficient, in the order 0, +1, −1, +2, −2, …
  (the `FourierTermDTO` shape plus `done`/`total`). Summing those received so far
  draws the reconstruction sharpening as harmonics arrive. They come only from the
  exact tier; if it fails the bar moves on to `identify` and the coefficients
  arrive with the `result`.

**Image** (`/api/images/{slug}/jobs`): `queued` 0, `extract` 0 – 0.85, `epicycles`
0.85 – 0.88, `bases` 0.88 – 1 with `{done, total}` per level. **Contour**
(`/api/contours/{hash}/jobs`): `epicycles` 0 – 0.05, `bases` 0.05 – 1. The weights are
measured costs (extraction ~5 s of a ~6 s first compute on this Mac, about twice that
in production). Extraction is one library call and reports only its start and end, so
while `stage` is `extract` the bar has nothing to move on: show the stage's name and
let the bar breathe there rather than inventing motion; the `contour` partial ends it.

Partials:

- `contour` `{stage: "contour", ...extract-contour's response}`: the outline, before
  any series. Draw it at once.
- `epicycles` `{stage: "epicycles", ...compute/epicycles' data}`: the whole spectrum;
  draw the epicycle sum at a growing term count while the bases compute.

A cache hit (the same image and settings, or contour and parameters, computed in the
last 7 days) skips straight through its stage.

### Example stream (equation, `x*(pi - x)` on [0, π], N = 2)

Recorded from the server on 2026-11-14 (`n_eval_points` 50; long arrays elided `…`):

```
retry: 2000

id: 1
event: stage
data: {"stage":"queued","fraction":0.0}

id: 2
event: stage
data: {"stage":"parse","fraction":0.0}

id: 3
event: partial
data: {"stage":"samples","x":[0.0,0.06283185307179587,…,3.0787608005179976],"y":[0.0,0.19344424626135143,…,0.19344424626135034]}

id: 4
event: stage
data: {"stage":"integrate","fraction":0.05,"done":0,"total":5}

id: 5
event: partial
data: {"stage":"coefficient","n":0,"coefficient_re":1.6449340668482264,"coefficient_im":0.0,"amplitude":1.6449340668482264,"phase":0.0,"done":1,"total":5}

id: 6
event: stage
data: {"stage":"integrate","fraction":0.2,"done":1,"total":5}

id: 7
event: partial
data: {"stage":"coefficient","n":1,"coefficient_re":-0.5,"coefficient_im":0.0,"amplitude":0.5,"phase":3.141592653589793,"done":2,"total":5}

…  (n = −1, 2, −2 the same way, each followed by its integrate stage)

id: 14
event: stage
data: {"stage":"integrate","fraction":0.8,"done":5,"total":5}

id: 15
event: stage
data: {"stage":"render","fraction":0.92}

id: 16
event: result
data: {"status":"ok","tier":"symbolic","latex":"f(t) \\approx 1.6 -…","latex_sigma":"f(t) \\approx 1.6 + \\sum_{n=1}^{2} …","coefficients":[{"n":0,…},…],"original_points":{…},"reconstructed_points":{…},"energy_captured":1.0,"effective_n":3}
```

### A dropped stream

`EventSource` reconnects by itself (after `retry`, 2 s) and sends `Last-Event-ID`;
the server replays every event after it. A client that reconnects by hand passes
`?after=<last id>` instead. Nothing is lost while the job lives.

### Polling (a client that cannot stream)

`GET {status_url}?after=<last seq>` answers the job's state and the events since:

```json
{"id": "…", "kind": "equation", "state": "running", "stage": "integrate",
 "fraction": 0.41, "seq": 23, "partial": {…the latest partial…},
 "result": null, "error": null, "events": [{"seq": 22, "event": "partial", "data": {…}}, …]}
```

`state` is `queued`, `running`, `done`, `failed` or `cancelled`. Poll at most every
second; each poll also counts as watching (below).

## Cancelling

- `DELETE {status_url}` cancels now (204). Do it when the inputs change before the
  answer lands (the page used to abort the fetch).
- A job nobody watches is cancelled: when its last stream closes, or if it is never
  streamed or polled, a 15 s grace starts; a reconnect or a poll within it keeps the
  job alive. Closing the tab therefore stops the work.

A cancelled job's compute slot is free as soon as its work reaches its next progress
report (one coefficient, one bases level).

A finished job is kept 10 minutes, then its URLs answer 404.

## A client in 20 lines

```ts
type Handlers = {
    stage?: (d: { stage: string; fraction: number; done?: number; total?: number }) => void;
    partial?: (d: { stage: string } & Record<string, unknown>) => void;
};

export async function runJob<T>(base: string, path: string, body: unknown, on: Handlers, signal?: AbortSignal): Promise<T> {
    const res = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
    if (res.status !== 202) throw new Error(`${res.status}: ${await res.text()}`);
    const job = await res.json();
    const es = new EventSource(base + job.events_url);
    const cancel = () => { es.close(); void fetch(base + job.status_url, { method: "DELETE" }); };
    signal?.addEventListener("abort", cancel, { once: true });
    return new Promise<T>((resolve, reject) => {
        const end = (fn: () => void) => { es.close(); signal?.removeEventListener("abort", cancel); fn(); };
        es.addEventListener("stage", (e) => on.stage?.(JSON.parse((e as MessageEvent).data)));
        es.addEventListener("partial", (e) => on.partial?.(JSON.parse((e as MessageEvent).data)));
        es.addEventListener("result", (e) => end(() => resolve(JSON.parse((e as MessageEvent).data))));
        es.addEventListener("error", (e) => { const d = (e as MessageEvent).data; if (d) end(() => reject(JSON.parse(d))); }); // no data: a drop; EventSource reconnects
        es.addEventListener("cancelled", () => end(() => reject(new DOMException("cancelled", "AbortError"))));
    });
}
```

Use: `runJob(BASE, "/api/equations/jobs", req, { stage: (s) => bar.set(s.fraction, s.stage), partial: draw }, controller.signal)`.

Note that the named `error` event and `EventSource`'s own connection `error` share a
name: the job's carries `data`, a dropped connection does not (and reconnects itself).

## Migration

The synchronous routes (`/api/equations/compute`, `extract-contour`,
`compute/epicycles`, `compute/bases`) stay until the web moves to the jobs, then are
removed in the same PR series: no long-lived compatibility shim. `/api/equations/simplify`
stays synchronous (a re-render of known coefficients, milliseconds).

## Deployment notes

- One API process (`WORKERS=1`): jobs live in its memory; the API refuses to boot with
  `WORKERS > 1`. Scaling out needs the registry in Mongo first.
- nginx: the stream sends `X-Accel-Buffering: no`, so the gateway does not buffer it;
  the 15 s keepalive stays inside `proxy_read_timeout` (120 s). The job-creating POSTs
  ride the gateway's compute rate zone like the synchronous computes.
- A deploy restarts the process and drops live jobs; a client's reconnect then gets
  404 and should start the job again.
