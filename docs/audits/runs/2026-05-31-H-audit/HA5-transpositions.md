# HA5 — Architectural Transpositions (Tranche H, ELEGANCE/SIMPLICITY/PERFORMANCE lane)

STRICTLY READ-ONLY survey. Zero mutations. The H analog of the G-audit's GA5/T1–T7.

**Mandate.** "Architectural transpositions in the sake of elegance, simplicity, and performance
above all are both necessary and desirable. NO legacy code." Each candidate must **REMOVE** a
source of truth, REMOVE legacy, REMOVE a hop, or REMOVE a gap between *claim* and *reality*.
Scored by elegance·simplicity·perf + blast radius → **FOLD** / **DEFER**.

**Lineage.** G executed T1 (one contract source — codegen deleted), T2 (one IP identity — nginx
`real_ip` + `get_client_ip` converged, budget 1200→180), T4/T6 (dead-export + `GalleryEntry`
excision), T5 (fonts self-hosted, 3→0 CDN origins), T7 (`utcnow`→`now(UTC)`). G's FINAL booked
four residuals: **WORKERS=4 per-process bucket**, **frontend/mongo/nginx hardening**, **the 4th
hand-type island**, **CSP `font-src 'self'`**. H's candidates are the *next* lifts past those.

The headline finding this run is not on G's residual list: **CI is RED, and the RED is the H
analog of F's chronic deploy-blocker** — see H4 and the "single highest-leverage move" section.

---

## H1 — WORKERS=4 vs. inv-12 "single replica": the app rate-limiter AND `_suspended_cache` are per-process [E·P] — TOP

**Current shape.** `api/Dockerfile:32` sets `ENV WORKERS=4` and `:37` launches uvicorn
`--workers 4`. Yet `docker-compose.prod.yml:33` pins `replicas: 1` and the tranche invariant
`A-Inv 12` / `inv-12` is literally *"Scale without contrivance (incl. the single-replica
posture)"* (`docs/tranches/INVARIANTS.md:41,55`). **WORKERS=4 IS four in-process replicas.**
This contradicts the single-replica posture the whole codebase claims to honor — and two
in-memory subsystems silently diverge across the four workers:

1. **The rate limiter** (`api/services/rate_limiter.py:152`). Buckets are per-process
   `OrderedDict`s; "per-client 180/min" is really up to ~720/min across 4 workers, and a restart
   wipes all buckets. This is the *booked* residual (code comment `:147–151`; G/FINAL §4).
2. **`_suspended_cache`** (`api/dependencies.py:27`). This is the **un-booked** sibling, and it is
   a real correctness gap. When an admin suspends a user, `mark_suspended_in_cache`
   (`dependencies.py:249`, called from `admin.py:328`) marks the cache on **only the one worker
   that handled the admin request**. The other three workers keep serving that user from their
   stale 60-second caches (`resolve_session`, `:223–234`) — a suspended account stays live on ¾
   of workers for up to 60 s. `invalidate_suspension_cache` (`admin.py:330,362`) has the
   inverse defect (an un-suspend is also only seen by one worker). With WORKERS=1 this is exact;
   with WORKERS=4 it is a silent eventual-consistency window nobody chose.

**Cluster-safe by contrast (confirmed):** `compute_cache` is Mongo-backed
(`compute_cache.py:49,71,94` — `compute_cache` collection, 7-day TTL) and the idempotency store
is Mongo-backed (`api/lib/crud/idempotency.py:37`). So the ONLY per-process state is the rate
limiter + `_suspended_cache`. The fix is bounded.

**Why it's the elegance question.** WORKERS=4 was added (no receipt found tying it to a measured
throughput need) and it quietly breaks the two subsystems that *assume* one process, while
contradicting the named invariant. The gestalt move is to make the deployment **coherent with
what the code already assumes**: ONE process.

**Gestalt end-state — `WORKERS=1` (the honest single-replica).**
Set `WORKERS=1`. Then: the rate limiter is a true single per-client bucket (the booked residual
**dissolves** — no Redis, no shared store, no new container); `_suspended_cache` is correct by
construction (the un-booked gap **dissolves**); inv-12 is *true* rather than aspirational. The
backend is I/O-bound (Mongo + onnx/rembg already gated by an async semaphore in
`computation.py`), and the `compute_concurrency` semaphore + the nginx `api_compute` 2 r/s edge
are the real throughput governors — not worker count. This REMOVES a claim↔reality gap (inv-12),
REMOVES a booked residual, and REMOVES a latent correctness bug, all by deleting one `ENV` line's
value `4`→`1`. **It is the rare transposition that removes three things and adds nothing.**

*Counter-fork (assess honestly):* if a measured CPU-bound need for 4 workers ever materializes,
the correct shape is NOT Redis — it is to keep the two in-memory subsystems but make the
deployment honest by either (a) moving `_suspended_cache` invalidation to a Mongo
`changeStream`/short-TTL re-read (eventual consistency made explicit), or (b) accepting the
limiter as a coarse per-worker pre-filter behind the nginx hard edge (see H2). But absent that
measured need, WORKERS=1 is strictly more elegant. **There is no receipt that the need exists.**

**Blast radius.** Trivial-in-repo (one env value). Must confirm on host that single-worker
throughput clears real load (the nginx edge already caps at 30 r/s/client, so a single uvicorn
worker is not the bottleneck). Pairs with H2.

**Recommend: FOLD (TOP).** Highest leverage-to-risk in the survey.

---

## H2 — Is the whole app rate-limiter LEGACY now that nginx keys per-client? [E] — TOP (the deletion question)

**Current shape.** Two rate-limiting layers now key on the **same** real client:
- **nginx edge** (`nginx/fourier.conf:16–18`): `limit_req_zone $binary_remote_addr` — and after
  `real_ip` (`:11–14`) `$binary_remote_addr` IS the real client. Three zones: `api_general`
  30 r/s (burst 50), `api_compute` 2 r/s (burst 5), `api_upload` 5 r/m. This is a true
  cluster-wide per-client cap (nginx is single-process-shared-memory; no WORKERS divergence).
- **app middleware** (`rate_limiter.py:203` `RateLimitHeaderMiddleware`): `read_limiter` 180/min,
  `write_limiter` 10/min, `login_limiter` 5/min, `admin_limiter` 30/min, `compute_limiter`.
  Per-process (H1), so functionally the *weaker* of the two enforcement layers.

**The honest assessment the charter asks for.** Can the app limiter be DELETED in favor of
nginx's? **Partially — and the answer is precise.** The app limiter is load-bearing for exactly
ONE thing nginx cannot do: it is the **sole emitter of the RFC-9239 `RateLimit-Limit/-Remaining/
-Reset` headers** and the `application/problem+json` 429 envelope (`rate_limiter.py:197–240`;
inv-24). nginx `limit_req` emits a bare `503` with no RateLimit-* headers and no problem+json
body. So:
- **Enforcement** by the app limiter is *redundant* — nginx already caps every zone per-client at
  the edge, more strictly and without WORKERS divergence. The `login_limiter` (5/min) and
  `write_limiter` (10/min) are the only budgets *tighter* than nginx's `api_general` 30 r/s, so
  those two carry genuine additional enforcement value; `read_limiter` (180/min = 3 r/s) and
  `admin_limiter` are looser than nginx and enforce nothing nginx hasn't already.
- **Reporting** by the app limiter is *not* redundant — it is the contract surface (inv-24).

**Gestalt end-state (two viable, pick one):**
- **(A) Keep app limiter as the reporting+fine-grain-enforcement layer, fix nginx to speak the
  contract on breach.** Make nginx's `limit_req` return the problem+json envelope
  (`error_page 503 = @ratelimited` → `return 429` with the JSON body + `Retry-After`), so the
  two layers agree on the wire shape. The app limiter keeps `login`/`write` (the budgets tighter
  than the edge) + emits the headers on the happy path. This is *convergence*, not deletion.
- **(B) Demote the app limiter to reporting-only + the two tight budgets.** Delete `read_limiter`
  and `admin_limiter` (nginx is already stricter); keep `login`/`write` (tighter than edge) and
  the header-stamp. Removes ~2 budgets of dead enforcement.

**Do NOT** delete the whole app layer: you would lose inv-24's RateLimit-* headers and the
problem+json 429, which are a tested contract surface. And do NOT add Redis to "fix" the app
limiter's WORKERS divergence — H1 (WORKERS=1) dissolves that for free, after which the app
limiter is a correct single per-client bucket and (A)/(B) become pure contract-tidying.

**Blast radius.** (A) touches nginx (deploy repo, host-verify) + small app. (B) is app-only,
delete-2-budgets. Both are MEDIUM and best done *after* H1.

**Recommend: FOLD (A) — but sequence after H1.** The elegant end-state is "nginx enforces,
app reports + holds the two tight budgets," one honest per-client identity end to end.

---

## H3 — `response_model=` on the visualization routes: a real fork, assessed [E] — DEFER (do NOT do A)

**Current shape.** The visualization router builds **raw `Response` objects** with no
`response_model=` on any of the 5 routes (`api/routers/visualizations.py:154,200,264,302,338`;
decorators at `:100,171,214,277,316`). Reason it's raw, not a model return: each response (a)
carries a manual **ETag** (`etag.set_etag_header`, `:159,205`), (b) is projected through
`_public_doc` to strip `_id`/`liked_ips` (`:67–69`), (c) for create sets a `Location` header and
201, (d) the list route emits a cursor envelope. Other routers that DO declare `response_model=`
(`contours.py:35`, `equations.py:29`, `images.py:93`, `admin.py:110`) return plain Pydantic and
let FastAPI serialize. So the visualization boundary — the central `Visualization` entity — is
the one OpenAPI **cannot** describe. inv-26 ("single contract source") is therefore *not*
machine-verifiable for the headline noun, and a 4th hand-type island
(`web/src/lib/types.ts` `Visualization`) exists with no generated origin.

**The honest fork (the charter's exact question).** Could we add `response_model=Visualization`
→ complete the OpenAPI → re-enable a *viable* codegen → ONE truly-generated contract source (the
inverse of what G chose)?

**Assessment — this is a trap, recommend AGAINST.**
1. `response_model=` invokes FastAPI's serialization on the handler's **return value** and
   re-encodes the body. The router returns a hand-built `Response` (already JSON, already
   ETagged). To use `response_model` you would have to return the Pydantic model and **surrender
   the manual ETag + `_public_doc` projection + `Location`/201 control to FastAPI** — i.e. break
   the very envelope (ETag/inv-X conditional-request contract) that the raw Response exists to
   guarantee. `response_model` + a custom `Response` is contradictory: FastAPI ignores the model
   when you return a `Response` directly, so you'd get the OpenAPI schema but it would be a
   **lie** unless you also rewrite serialization — re-introducing exactly the dual-path the raw
   Response avoids.
2. G *already* weighed and rejected codegen (T1 Option A vs B → chose B, deleted the 65 KB
   codegen). Re-enabling it now reverses a closed, justified decision to chase a schema that
   would not match the runtime bytes. That is motion, not elegance.
3. The "4th hand-type island" is small (`Visualization` in `types.ts` — the wire shape, ~6 fields
   the SPA reads). A hand type that mirrors a 6-field public projection is cheaper and more
   honest than an OpenAPI schema that can't see the ETag/projection.

**The elegant move here is the opposite of codegen:** add `response_model=...` ONLY as
`responses={200: {"model": Visualization}}` documentation metadata (description-only, does not
touch serialization) IF OpenAPI completeness is genuinely wanted — but even that is cosmetic.
**Recommend DEFER / decline.** inv-26 is best read as "one *hand-authored* source per boundary,"
which the repo already satisfies; do not manufacture a generated source that fights the envelope.

---

## H4 — CI is RED and decoupled from deploy: the H analog of F's chronic [E] — TOP (the gap)

**Current shape — measured live this run.** The last **5+ consecutive CI runs FAILED**
(`gh run list --workflow=ci.yml`), including the **G-close commit** `docs(G.W9): close tranche G
GREEN` (run `26695317377` — *failure*). The most recent run `26719598467` (after a `--extra dev`
fix) breaks down: **api-tests ✓, web-build ✓, e2e ✗**. So CI is red **solely** because of the
Playwright e2e arm (see H5). And — exactly as F found the auto-deploy chain silently broken for
~2 months — **deploy is not gated on CI** (`deploy/templates/ci.yml` header: *"Deploy is NOT a CI
step — it rides the webhook chain… CI gates the merge; the webhook ships"*). The webhook shipped
G to prod while CI was RED. **inv-25's spirit ("deploy of record, automated, verified") coexists
with a permanently-red merge gate that nobody is watching** — the precise claim↔reality gap the
mandate targets.

**Constellation CI divergence (candidate 3).** Across the constellation the CI shape has NOT
converged: `value.js` and `keyframes.js` each carry **3** workflow files
(`ci.yml` + `node.js.yml` + `release.yml`) where `node.js.yml` is a near-duplicate second CI
(value.js `node.js.yml` is the *real* full-matrix CI named "Node.js CI"; its `ci.yml` is a
separate shape) — two CI identities per repo. `deploy` has 1, `fourier` has 2 (`ci.yml` +
`deploy-pages.yml`). The canonical `deploy/templates/ci.yml` exists but is **not adopted
verbatim** anywhere. So "ONE canonical CI shape, adopted + green across the constellation" is
unmet on both axes: *green* (fourier's is red) and *one shape* (value/keyframes carry two).

**Gestalt end-state.**
1. **Make fourier CI green** (→ H5 fixes the only red arm) — non-negotiable; a red main-branch
   gate is decay.
2. **Gate deploy on green CI.** The webhook `deploy-hook.sh` should refuse to ship a commit whose
   CI run is not `success` (a `gh run view --json conclusion` check, or require the CI `ci.yml`
   to dispatch the deploy on success rather than the raw push webhook). This closes the
   F-pattern structurally: a red commit cannot reach prod.
3. **Converge to one CI shape:** delete the duplicate `node.js.yml` in value/keyframes (or merge
   into `ci.yml`); adopt `deploy/templates/ci.yml` parameterized per repo. ONE CI identity/repo.

**Blast radius.** (1) small (H5). (2) deploy-repo + host (coordinate, inv-22 health-gate). (3)
cross-repo, maintainer-owned (the existing 7-ask adoption ledger). The fourier-local half —
green CI + deploy-gated-on-CI — is FOLD-able now; the constellation convergence is a coordination
ask.

**Recommend: FOLD (fourier-local: green + gate). DEFER (constellation convergence → adoption
asks).** This is the single highest-leverage *honesty* move — see below.

---

## H5 — e2e determinism: the one red arm is a real selector bug, not flake [E] — FOLD (with H4)

**Current shape.** The Playwright failure is deterministic and meaningful (NOT flake):
`contour-extraction.spec.ts:131` → `locator('input[type="file"]')` **strict-mode violation:
resolved to 2 elements** (the page now has two `<input type=file>` — a main one and an
`getByRole('complementary')` sidebar one; evidence in
`web/test-results/contour-extraction-…/error-context.md`). The spec was authored against a
single-input DOM and the UI grew a second uploader. 7 spec files, ~50 tests
(`contour-extraction` 10, `paper-performance` 9, `gallery` 7, `workspace-flow` 7,
`visualization-ux` 6, `visualization-crud` 6, `settings-persistence` 5). `test-results/` is
**not git-tracked** (0 files tracked) — stale local artifacts, fine to ignore.

**Why it's not a "patch."** The elegant fix is to make the selectors **role/test-id scoped** so a
spec targets *one* affordance unambiguously (`getByTestId('contour-upload')` /
`.getByRole('main').locator('input[type=file]')`), which is also more resilient to future DOM
growth — i.e. fix the *class* (strict-mode-ambiguous selectors), not the one line. Audit the
other specs for the same fragility class while there. If any spec asserts against retired UI,
prune it (dead spec = legacy).

**Gestalt end-state.** Every e2e selector is intent-scoped (role or test-id), the suite is green
and deterministic, and it is the *gate* H4 makes deploy depend on. A meaningful, green e2e suite
is what lets H4's "gate deploy on CI" be safe.

**Blast radius.** Small, web-only, test-only. **Recommend: FOLD** — it is the unlock for H4.

---

## H6 — read_only hardening floor completion + CSP `font-src 'self'` [P/security] — FOLD (mechanical)

**Current shape.** The backend is at the FULL hardening floor (`docker-compose.prod.yml:25–31`:
`read_only: true` + `tmpfs: /tmp` + `cap_drop: ALL` + `no-new-privileges`, live-verified per
G/FINAL §2). frontend/mongo/nginx carry **only** `no-new-privileges` (`:55,98,131`); `read_only`
+ `cap_drop` are booked residuals with the rationale "needs a staging test" (the nginx/frontend
images write `/var/cache/nginx` + `/var/run` and bind `:80` → need `NET_BIND_SERVICE`; mongod
writes `/data/db`). Separately, **no CSP header exists at all** — `grep` of `nginx/fourier.conf`
+ `web/index.html` + `web/src` finds zero `Content-Security-Policy`. G's δ removed all 3
third-party font/CSS origins (`index.html` now loads only `/fonts/…` + `/fonts.css`,
self-hosted), so `font-src 'self'` (indeed a tight `default-src 'self'`) is now achievable with
**zero** third-party allowances — a free win G explicitly booked for "a later wave."

**Gestalt end-state.** The known tmpfs+cap pattern per image:
- **nginx/frontend (alpine):** `read_only: true` + `tmpfs: [/var/cache/nginx, /var/run, /tmp]` +
  `cap_drop: ALL` + `cap_add: [NET_BIND_SERVICE]` (or run nginx on an unprivileged port + drop
  even that). A bounded, well-trodden alpine-nginx hardening recipe.
- **mongo:** `read_only` is genuinely impossible (writes `/data/db`); `cap_drop: ALL` +
  `cap_add` only what mongod 8.0 needs (verify against its runtime caps) is the achievable half.
- **CSP:** add `add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:;
  style-src 'self' 'unsafe-inline'; font-src 'self'; …" always;` in `nginx/fourier.conf`
  (alongside the existing `X-Frame-Options`/`nosniff` block at `:26–30`). Tune `script-src` to
  the Vite bundle's needs (nonce or hash; KaTeX/value.js are bundled, not CDN, so `'self'`
  suffices for scripts).

**Blast radius.** Each image needs a one-time staging bring-up to confirm the writable-path set
(that's the "staging test" the residual names). CSP needs a careful `style-src`/`script-src`
pass against the live SPA (a too-tight CSP breaks Vite-injected styles). MEDIUM, bounded,
delete-the-residual-list value.

**Recommend: FOLD** the CSP (free, high security value, 0 third-party origins to allow) and the
**nginx/frontend** hardening (known recipe). **DEFER** the mongo `cap_drop` to a verified staging
pass.

---

## H7 — `_suspended_cache` invalidation is per-worker (broken out of H1, standalone-bookable) [E] — FOLD-with-H1

Already detailed under H1. Booking it separately because it lands *even if* the team rejects
WORKERS=1: the correct shape under any worker count >1 is to stop relying on an in-process dict
for a security-relevant decision (suspension). End-state options: (a) WORKERS=1 (H1, makes it
correct for free), or (b) re-read `users.status` without the 60 s cache on a cheap projected
query (it's already a `{status:1}` lookup, `dependencies.py:229`) — the cache saves one indexed
Mongo read per request, a micro-optimization that trades a **security-correctness** property for
sub-millisecond latency. **Recommend: FOLD via H1** (WORKERS=1 dissolves it); if WORKERS>1 is
kept for any reason, drop the suspension cache (option b) — security beats a sub-ms read.

---

## Ranked transposition table

| # | Transposition | What it REMOVES | E·S·P | Blast radius | Recommend |
|---|---|---|---|---|---|
| **H1** | `WORKERS=4`→`1` (true single-replica) | claim↔reality gap (inv-12) + a booked residual + a latent bug — **3 removals, 0 additions** | E·E·E | Trivial (1 env value; host-confirm throughput) | **FOLD — TOP** |
| **H4** | Green CI + gate deploy on CI | claim↔reality gap (red gate ships to prod; the F-pattern) | E·E·– | Small in-repo; deploy+host for gate | **FOLD (local) / DEFER (constellation)** |
| **H5** | Role/test-id-scoped e2e selectors | legacy/brittle specs (the only red CI arm) | E·E·– | Small, test-only | **FOLD (unlocks H4)** |
| **H2(A)** | nginx speaks problem+json on breach; demote app limiter to report+tight-budgets | a redundant enforcement layer (hop) | E·E·P | Medium (nginx+host) — after H1 | **FOLD — sequence after H1** |
| **H6** | nginx/frontend `read_only`+`cap_drop`; CSP `default-src 'self'` | a booked residual list; the no-CSP gap | E·–·P | Medium (staging test per image) | **FOLD (CSP+nginx) / DEFER (mongo caps)** |
| **H7** | per-worker `_suspended_cache` divergence | a latent security correctness gap | E·E·– | Trivial (folds into H1) | **FOLD via H1** |
| **H3** | `response_model=` → codegen revival | — (would ADD a lying schema; fights the ETag envelope) | – | — | **DEFER / decline** |

---

## The single highest-leverage architectural move for H, argued

**H1 — `WORKERS=4` → `WORKERS=1`.** It is the only candidate in the survey that removes *three*
things and adds *nothing*:

1. It makes **inv-12 true.** Today the codebase asserts "single-replica posture / scale without
   contrivance" while running four in-process replicas — the exact "gap between claim and
   reality" the mandate names. WORKERS=1 closes it not by editing the doc but by editing the
   deployment to match what the code already assumes.
2. It **dissolves the booked rate-limiter residual** (G/FINAL §4) with zero new dependency — no
   Redis, no container, no shared store. The "per-client 180" becomes *literally* per-client.
   The whole "the limiter is per-process and therefore ~4× / wipes on restart" caveat
   (`rate_limiter.py:147–151`) evaporates.
3. It **fixes the un-booked `_suspended_cache` correctness bug** (H7): a suspended account stops
   being served by 3-of-4 workers for up to 60 s.

The only thing it "costs" is CPU-bound parallelism — for which **no receipt of a measured need
exists**, and which the backend doesn't want anyway: it is I/O-bound (Mongo + the onnx/rembg path
already serialized by the `compute_concurrency` async semaphore), and the nginx per-client edge
(30 r/s general, 2 r/s compute) is the real throughput governor, not worker count. After H1, H2
and H7 collapse into trivial tidying, and the rate-limiter subsystem becomes coherent for the
first time. **One env value, three removals, the invariant made honest.** That is the
transposition the mandate describes.

(The runner-up by leverage is **H4+H5** — a permanently-red CI that still ships to prod is the H
analog of F's two-month-broken deploy chain, and is a pure honesty defect. It is co-TOP, but H1
is the cleaner single *architectural* lift; H4/H5 is the cleaner *process* lift. Fold both.)

---

## "Must-NOT" list (manufactured perf / over-engineering to refuse)

- **Do NOT add Redis** (or any shared store / new container) to "fix" the rate limiter. nginx
  already enforces a true cluster-wide per-client cap (`fourier.conf:16–18` post-`real_ip`), and
  H1 (WORKERS=1) makes the in-process limiter correct for free. Redis would be a new dependency,
  a new failure mode, and a new "single-replica" contradiction — pure contrivance (inv-12).
- **Do NOT add `response_model=`** to the visualization routes to revive codegen (H3). It does
  not change/own the manual ETag + `_public_doc` projection (FastAPI ignores `response_model`
  when a `Response` is returned), so it would document a schema that does not match the bytes — a
  *lie* dressed as a contract source. G already (correctly) deleted the codegen; do not reverse a
  closed, justified decision.
- **Do NOT delete the whole app rate-limiter.** It is the sole emitter of the RFC-9239
  `RateLimit-*` headers + the problem+json 429 envelope (inv-24, tested). Converge it with nginx
  (H2-A), don't amputate it.
- **Do NOT keep WORKERS=4 "for throughput" without a measured receipt.** No benchmark ties the
  app to a CPU-bound 4-worker need; the work is I/O-bound + semaphore-gated. Multi-worker here is
  speculative perf that breaks two subsystems — the definition of contrivance.
- **Do NOT over-tighten the CSP blindly.** `style-src` must allow Vite's injected styles
  (`'unsafe-inline'` or nonce) or the SPA breaks; tune against the live bundle, don't ship a
  too-tight `default-src 'self'` that white-screens the app. (Fonts are now `'self'` — that half
  is genuinely free.)
- **Do NOT re-run the deploy-hook convergence (GA5 T3) here** — it is owned by the deploy-repo /
  thread ζ adoption ledger; H should *confirm convergence*, not fork a third copy.
- **Do NOT chase a "cheap-LCP hero before the paper chunk" (GA5 T5.2).** G already landed the
  real perf win (fonts/CDN 3→0, Lighthouse prod 95). The hero-split touches the paper render path
  for a speculative margin — the manufactured-perf trap GA5 itself flagged.

---

## Observations (confirming prior wins held — NOT transpositions)

- **G's T2 (one IP identity) is genuinely converged.** `rate_limiter.py:226` calls
  `get_client_ip` (`dependencies.py:182`, X-Real-IP) and `hash_ip` is imported, not duplicated
  (`rate_limiter.py:14`). The second `hash_ip` GA5 flagged is gone. nginx `real_ip`
  (`fourier.conf:11–14`) + no uvicorn `--proxy-headers` (`Dockerfile:33–36`) = one trust
  boundary. Clean.
- **G's T1 (one contract source) held.** No `api-schema.d.ts`, no `gen-types`, no
  `openapi-typescript` (grep empty). The `Visualization` decls live once in `types.ts`.
- **compute_cache + idempotency are Mongo-backed** (cluster-safe) — they correctly do NOT
  participate in the WORKERS divergence; only the limiter + suspension cache do.
- **G's T5 (fonts self-hosted) held** — `index.html:12–19` loads only `/fonts/…` + `/fonts.css`;
  0 jsdelivr/googleapis/gstatic origins. This is what makes H6's `font-src 'self'` free.
