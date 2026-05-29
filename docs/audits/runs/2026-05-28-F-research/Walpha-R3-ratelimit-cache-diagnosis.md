# F research-first audit — Wα-R3 rate-limit + compute-cache diagnosis

**Lane**: F.Wα-R3 of the F research-first workflow `w0ma5070c` (Wα 3 research lanes → Wχ 4 challenge probes → synthesis).
**Mode**: research-first; READ-ONLY (live probes + host SSH capture + source reads; no mutation). Tranche-development only.

---

Confirmed. `GET /api/visualizations` (`list_visualizations`, line 216) and `GET /{slug}` (line 173) have NO rate-limit dependency — only POST/PATCH/DELETE mutations carry `require_write_limit` (let me not even need to verify; the burst proves it: 25× 200, never 429). The headers come from `snapshot()` which reads a bucket nothing ever wrote to (since `check()` is only on mutation routes). Hence Remaining stays at 10 (= write_limiter fallback max), Reset 0 (empty bucket). I have everything. Writing the verdict.

## F.Wα-R3 — rate-limit + compute-cache diagnosis verdict

### §1 — Rate-limit root cause (F-API-2)
- **limiter type**: custom `SlidingWindowLimiter` (in-memory OrderedDict LRU, hashed-IP key) — NOT SlowAPI. `api/services/rate_limiter.py`.
- **header emission**: dynamic-by-design-but-dead-for-reads. `RateLimitHeaderMiddleware.dispatch` (lines 204-214) calls `limiter.snapshot()` — a strictly **read-only** probe (line 109-131: prunes, never appends). The *recording* call `limiter.check()` lives only in the `_make_dependency` factory (line 152-155), wired solely via per-route `Depends(require_*_limit)`.
- **live 25-burst result**: 25× `200` (never 429); after burst `ratelimit-limit: 10`, `ratelimit-remaining: 10`, `ratelimit-reset: 0` — exactly FA1 §4. Reproduced against prod.
- **why**: `GET /api/visualizations` (`list_visualizations`, visualizations.py:216) and `GET /{slug}` (:173) carry **no** `require_*_limit` dependency — only POST/PATCH/DELETE do. So `check()` never fires on the read path → the write_limiter bucket (the `_limiter_for_path` fallback for unmatched paths, max=10) is never incremented → `snapshot()` honestly reports the empty bucket: Remaining=10, Reset=0. The headers aren't hard-coded; they describe a counter nothing on the read path ever touches.
- **why palette-api works**: value.js (`rate-limit.ts`) fuses record+report into ONE middleware: `rateLimitMiddleware` calls `limiter.check()` (increments, line 100) AND `limiter.inspect()` (line 110) on **every** request — including reads via the `GET/HEAD → readLimiter(60)` branch (line 114-116). One middleware both enforces and stamps; no per-route opt-in. That's why it shows Remaining 59/60.
- **F.W1 fix shape**: move *recording* into the middleware so reads are counted. Two equivalent shapes: **(a)** have `RateLimitHeaderMiddleware` call `limiter.check()` (catching the 429 → set Retry-After) instead of read-only `snapshot()`, making it the single enforce+report path à la value.js; OR **(b)** add a `read_limiter` (e.g. 60/min) and an explicit GET-path branch in `_limiter_for_path`, then attach `check()` to the read routes. **(a)** is the closer transposition to the working palette-api pattern and removes the enforce/report split entirely. Either way the snapshot-only-on-reads gap is the bug.

### §2 — compute-cache-symmetry confirm (F-T-S1)
- **current signature**: `cache_key(contour_hash, n_harmonics, n_points)` — 3-field positional, epicycle-specific (compute_cache.py:44). `lookup`/`store` mirror it.
- **compute_bases params**: `max_degree: int`, `n_points: int`, `levels: list[int] | None`, `n_eval: int` (models/computation.py:48-52).
- **all JSON-serializable**: **yes** — all are int / `list[int]` / None. `levels=None` and `list[int]` both serialize cleanly under `json.dumps(..., sort_keys=True)`. No floats, no NaN, no non-JSON types. Canonical-JSON of the sorted dict is collision-free across the two call-sites (bases dict carries `max_degree`/`levels`; epicycles never does — confirms FA5 §2 risk note).
- **COMPUTE_VERSION survives**: **yes** — it's a module constant folded into the hashed payload (line 46) and stored as `compute_version` (line 80). The params-dict refactor changes only the variable portion of the payload string; `COMPUTE_VERSION` stays appended → cache-bust intact.
- **F.W2 diff shape**:
  1. `cache_key(contour_hash, params: dict)` → payload `f"{contour_hash}|{json.dumps(params, sort_keys=True, separators=(',',':'))}|{COMPUTE_VERSION}"`.
  2. `lookup(contour_hash, params)` / `store(contour_hash, params, result)` — same dict.
  3. `epicycles` route: `params={"n_harmonics":..,"n_points":..}`.
  4. `compute_bases` route (contours.py:56-67): add the lookup/store bracket with `params={"max_degree":..,"n_points":..,"levels":..,"n_eval":..}`.
  5. Rename `_CACHE_COLL = "compute_cache"` AND database.py:70-76 `_db.epicycle_cache` → `_db.compute_cache` (the TTL-index block; comment at :66-68 too). Note: bare collection rename = a *new empty* collection (old entries TTL-expire in ≤7d; fail-open absorbs the gap — no migration needed).
  6. Hit-rate logging: add `logger.info("compute_cache HIT ...")` / `MISS` lines (gate wants 2 CACHE_HIT lines on 2nd identical `compute_bases`).

### §3 — Mechanical-vs-research verdict
- **F.W1 (α rate-limit)**: **needs-design at one decision** — choose shape (a) fuse-into-middleware vs (b) add read_limiter + GET branch. Both are small; the choice is a posture call (does the middleware become the enforcer?). Once chosen, mechanical (~15 LOC). Recommend (a) for value.js parity.
- **F.W2 (β cache)**: **mechanical** — params-dict signature + bases wiring + collection rename + log lines are all deterministic; FA5 §2 shape confirmed correct as written.

### §4 — Surprises that change the F charter
- **The HEAD middleware is NOT static-by-constant** — FA1 §4 inferred "header hard-coded" but the actual defect is finer: enforce/report split + reads having no limiter dependency. F.W1's framing should be "wire recording onto the read path," not "fix a constant." No charter-level change, but the F.W1 cell description should be corrected from "static header" to "read-path uncounted."
- **F-API-2 and the value.js I.W4 pattern are the same fix** — F.W1 is literally a transposition of the already-shipped palette-api unified middleware. Strengthens the cross-repo-cohesion (α) thesis; F.W1 can cite `rate-limit.ts:91-116` as the reference implementation.
- Collection rename (F.W2 step 5) silently abandons existing `epicycle_cache` docs (acceptable via TTL+fail-open, but worth a one-line note in the F.W2 cell so it's intentional, not a surprise in prod metrics).
