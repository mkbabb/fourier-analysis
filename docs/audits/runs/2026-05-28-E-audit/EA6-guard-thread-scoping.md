# EA6 — adversarial guard + thread scoping (E-development)

**Lane**: EA6 (fourier-analysis tranche-E DEVELOPMENT phase — planning only; READ-ONLY; ONE deliverable; NO source edits, NO commits).
**Date**: 2026-05-28. **HEAD**: post-D-close CLEAN (per `docs/tranches/D/FINAL.md §9` — all six threads GREEN; α/β/γ/δ/ε + α′ landed; `2757c43` host HEAD; `fourier.babb.dev` LIVE on CF Pages; `api.fourier.babb.dev` LIVE at origin Apache + LE; webhook chain restored). **value.js**: HEAD `16129e0` (Tranche H close, v0.10.0; **value.js-I authored-unscoped**, the 53 DEFERRED-TO-VALUE.JS cells held in `D/coordination/VALUE-JS-ASK.md`).
**Charter (user, verbatim intent at E open, 2026-05-28)**: assemble tranche E — *refine, test, CRUD, our two palette apis and fourier viz apis; fix our cross repos; include ALL consumers; architectural transpositions for elegance/simplicity/performance; NO legacy; fold deferred + chronic.* Precepts: KISS (invariant 12); fix-at-root; no library nobody calls (inv-15); no shared CRUD framework/codegen (inv-16, the B trap recertified); idiomatic/gestalt; archaic diction is intentional; em dashes; parallelize agents at the 4/wave ceiling. EA6 is the **adversarial guard + concrete thread scoping** — the over-engineering + scope-sprawl sentry.
**Convention modelled on**: `docs/audits/runs/2026-05-27-D-audit/DA6-guard-thread-scoping.md` (the predecessor — per-thread smallest-honest-mechanism + named trap-to-reject + KISS justification + the must-NOT list). EA6 mirrors DA6's shape verbatim and inherits its rejection list as the floor.
**Sibling lanes (EA1–EA5)**: EA6 supplies the guard + concrete thread scoping; it does not re-derive the deferred/chronic inventory (an EA-sibling lane's ground-truth) nor the CRUD substrate diff (an EA-sibling lane's ground-truth). Where EA6 cites an item it cites the source-of-truth substrate — `D/FINAL.md §6` for residuals, `D/coordination/VALUE-JS-ASK.md` for the cross-repo ask, `D/D.md §7` for explicit deferrals.

---

## §0 — Proposed E thread set (provisional, refined by sibling lanes)

E fronts **five obligatory + one conditional** threads. The user's directive decomposes verbatim:

- **α — cross-repo CRUD cohesion COMPLETION** — the value.js-side I.W1–W4 alignment (the 53 DEFERRED-TO-VALUE.JS cells from `D.W5`); the cross-repo conformance test harness; the `palette_slug` FK live-resolution verification end-to-end; cross-repo CORS reconcile if needed. **The user explicitly mandated "fix our cross repos" — this IS the value.js re-mandate that D.W5 + VALUE-JS-ASK held conditional.**
- **β — consumer hardening** — `web/src/lib/api.ts` typed client retry/ETag/Idempotency-Key cohesion; the value.js `color.babb.dev` frontend client hardening (cross-repo); the csp-solver runtime API URL fix (the named cross-repo residual from `D/FINAL.md §6.2`); the published-to-npm sibling-repo flow vs. the vendored `web/vendor/*.tgz` tarballs (D.W1's smallest-honest fix carried forward — does an upstream publish retire the vendoring?).
- **γ — architectural transpositions** — the elegance/simplicity/performance items the user mandated. **Bounded by the lens rule**: a transposition is genuine iff it has (a) a named, present consumer, (b) a measured or structural delta, and (c) it removes more than it adds (verbatim from `DA6 §4`). Each candidate gets its per-line KISS justification at Wα.
- **δ — test integrity COMPLETION** — the W6 cross-env Playwright matrix that closed AMBER (local AMBER 3p/4f; host AMBER 3p/3f — pre-existing UI drift; prod CF-Pages LIVE post-W9 — the AMBER is real, not a skip); the conformance suite to run in CI for **both** APIs (the contract proofs for the cohesion); the **pre-existing pytest failure `test_backfill_image_bounds_on_migrated_image`** (`api/tests/test_image_storage.py` — `D/FINAL.md §6.3` W3-followup); the W6 `settings-persistence.spec.ts` recorded-inert disposition (audit, do not silently green).
- **ε — operational hygiene** — the deploy-hook auto-migration sweep (chronic from `C.W1` + `C.W3`); the cross-repo upstream commits (the floridify dirty edit; the palette-api compose edit recorded in `D/FINAL.md §7`); the dangling docker images cleanup (`gaggle`, `server-api`, `speedtest-*` per `D/D.md §7`) + dead `:8140` speedtest vhost; the **W11 FULL palette-api → color rename** (the scheduled-downtime window — `D/FINAL.md §6.2`); the dispatcher `mkbabb/value.js` arm fix (the latent-broken `git fetch` on a non-git host directory — `D/FINAL.md §6.2`); the `scripts/dns-cf-sync.sh` doc-hygiene items (`D/FINAL.md §6.5`).
- **(conditional) ζ — value.js-side palette/colorScale domain execution** — if the user re-mandates beyond α's CRUD cohesion (the `Palette`/`colorScale` domain model that has been *held latent* across B+C+D for lack of a named consumer — `D.md §7`, `COLOUR-LIFT.md`). Held conditional pending an EA-sibling-named consumer.

---

## §1 — Per-thread guard rails

Tranche E fronts **five obligatory** candidate theses (six with conditional ζ). A tranche per `TRANCHE-AND-WAVE-SPEC.md §Tranche` "closes a single binding question" — five strains that, but the user's directive demands the cohesion+test+transposition completion as one arc, so E's spine is: **complete what D made true but left as named successors** (the value.js-side alignment, the AMBER tests, the cross-repo consumer fixes, the chronic operational items). The guard's first job is to keep each thread at its smallest-honest-mechanism. Verdict format mirrors `DA6 §1`: **smallest-honest-mechanism** | **trap to reject** | **KISS justification for anything beyond**.

### (α) Thread CRUD-COMPLETION — value.js-side I.W1–W4 + cross-repo conformance + FK verification

**Smallest-honest-mechanism.** D.W5 already did the *fourier* side. The fourier-side artefacts are landed: `CRUD-CONTRACT v2.0.0` ratified at `c2ce6d7` (the two KISS relaxations + the §10 three-way close-rule + the §13 cross-repo FK clause); the 87-cell conformance matrix flipped (27 ADDRESSED / 53 DEFERRED-TO-VALUE.JS / 7 RETIRED-AS-OVER-SPEC); `VALUE-JS-ASK.md` records the I.W1–W4 sketch verbatim. So α's mechanism is **execute the value.js-side tranche I against the recorded ask**, plus a thin cross-repo **conformance test harness** that runs the contract-v2.0.0 proofs against *both* live APIs (`api.fourier.babb.dev` for visualizations, `api.color.babb.dev` for palettes) and produces a pass/fail matrix. Plus a live-resolution verification: a fourier visualization with a non-null `palette_slug` actually resolves the palette object cross-repo (the §13 FK clause is real, not academic).

The α thread's three named deliverables:
1. **value.js I.W1–W4 execution** (in `value.js/` — a value.js tranche, NOT fourier source) — the visibility split (`unlisted`/`draft`/`public`); soft-delete + grace + restore; the four SOTA envelopes (cursor pagination, ETag, Idempotency-Key, RFC 7807 errors); hide top-level `id` (the `format/palette.ts:59` correction). Per `VALUE-JS-ASK.md` this is value.js's own service+repository+errors+events+DI idiom (the D.W2 architecture, `626b107`) — **NOT** fourier's `api/lib/crud/` layout (the inv-16 boundary).
2. **Cross-repo conformance harness** — a single script that hits both APIs against the 27 ADDRESSED + (now) ≤53 value.js-implemented cells, producing a pass/fail matrix per cell. Lives in fourier (the contract owner) but probes both. Test code, not a framework.
3. **FK live-resolution proof** — one e2e probe that creates a fourier visualization with `palette_slug = <a-live-palette>`, then GETs `/visualizations/<slug>` and asserts the consumer code (frontend or test) resolves the FK against `api.color.babb.dev/palettes/<slug>` cleanly. CORS preflight passes; the round-trip works.

**Trap to reject.** **Building a shared CRUD framework / codegen / DSL across the two repos.** This is **the B trap, named verbatim by invariant 16, re-rejected at every successor close** (B, C, D — `DA6 §1(c)`, `CA6 §4`). The α thread reaches BOTH repos; the temptation to "lift the shared contract clauses into a shared types package" or "codegen from the contract" is at its peak here. **REJECT**: the contract is *documentation* (`CRUD-CONTRACT v2.0.0`), not code; the two repos share a *contract* (the slug-identity model, cursor envelope, soft-delete lifecycle) and explicitly do NOT share *code* — the D.W5 §10 close-rule names "binding behaviour, not module-layout" as the KISS relaxation that keeps cohesion possible. The α thread aligns two independent implementations to one written contract; the moment "shared contract" becomes "shared library both repos import," it is the B trap.

The secondary trap: **forking the value.js architecture to mirror fourier's**. value.js's D.W2 architecture (`626b107` — service+repository+errors+events+DI) is its own idiom, ratified by `VALUE-JS-ASK.md`. **REJECT** any α work that proposes "make value.js look like fourier" — the cohesion is behaviour, not shape.

**KISS justification for anything beyond the minimum.** The conformance harness MAY include a tiny `npx` runner shim that flips the BASE URL for the two probes — that is shell glue, not a framework. Any sub-item beyond {value.js I.W1–W4 execution, conformance matrix script, FK live-resolution probe} requires per-line justification at Wα and an inv-16 adversarial re-certification at Wχ.

**Gate.** `git grep -r "id" value.js/src/format/palette.ts` returns no top-level `id` field (slug-only addressing per the v2.0.0 §1 single-slug rule); the value.js soft-delete lifecycle e2e passes (the `delete → grace → restore` arc fires against `api.color.babb.dev`); the four SOTA envelopes (cursor pagination, ETag, Idempotency-Key, RFC 7807) respond from `api.color.babb.dev`; the cross-repo conformance matrix shows ≥80/87 GREEN; the FK probe round-trips end-to-end.

### (β) Thread CONSUMER-HARDENING — the "include ALL consumers" mandate

**Smallest-honest-mechanism.** The user explicitly said *include ALL consumers*. β's mechanism is **enumerate consumers per API + harden each consumer's client code per the API's contract**, not author a new client library. The known consumer surfaces (post-D-close):

For the **fourier viz API** (`api.fourier.babb.dev`):
- `web/src/lib/api.ts` (the typed client; reads `VITE_API_URL`, line 18). This is the primary consumer.
- `web/e2e/**` (the test specs hit the API directly).
- No external consumer of the fourier API is known.

For the **palette API** (`api.color.babb.dev`):
- `value.js/src/` (value.js's own frontend at `color.babb.dev`).
- `value.js/docs/`-grounded consumers (the value.js Vue 3 / vanilla docs).
- **fourier's frontend cross-repo fetch** — fourier visualizations with non-null `palette_slug` must resolve a palette object (the §13 FK clause); the *consumer is fourier's frontend or a fourier middleware shim*. **EA-sibling-lane EA3 (CRUD substrate) is the authoritative source for the consumer surface.**
- **csp-solver runtime API URL fix** — `useApi.ts` hardcodes `api/v1` relative; needs `VITE_API_URL`. This is a *consumer of csp-solver's own API*, not fourier/palette, but the user's "fix our cross repos" mandate sweeps it in.
- **The published-to-npm sibling-repo flow vs. the vendored tarballs** — `web/vendor/*.tgz` (the D.W1 smallest-honest-fix that unblocked the Docker build, `795d64f`). If value.js / glass-ui / keyframes.js publish a fresh version to npm during E's window, the vendoring retires; if they don't, the vendoring stays as a named residual. **Evidence-based — check live npm tags at Wα.**

β's deliverable is a per-consumer **hardening pass**: each client gets ETag handling (`If-None-Match` → cache hit); each mutating call gets an Idempotency-Key; the retry policy is recorded (idempotent GETs retry on 5xx with backoff; mutating calls do NOT retry without an idempotency key); the API base URL is env-driven, not hardcoded. **A typed client per consumer, NOT a shared client library across consumers.**

**Trap to reject.** **Building a shared `@mkbabb/api-client` package both repos import** — the inv-16 trap restated for clients. **REJECT** — fourier's `web/src/lib/api.ts` and value.js's client are independent implementations against the same contract; the contract is the shared artefact, the clients are not.

The secondary trap: **a generic retry/cache/idempotency middleware layer in fetch**. **EVALUATE** — if the retry/ETag/Idempotency-Key handling fits in `≤80 LOC` of per-repo client code (an `apiFetch(url, opts)` wrapper that handles the three concerns), it is in-scope. If it grows into a `~/.claude/fetch-middleware` framework with plugins and adapters, **REJECT** — the contract demands four behaviours, not a framework.

The third trap: **npm-publish-without-authorization**. The W1 vendoring decision was deliberate ("npm-registry-published sibling versions were too old"). **REJECT** any β work that publishes `value.js` / `glass-ui` / `keyframes.js` without explicit user authorization — npm-publish is a release act, not a refactor.

**KISS justification for anything beyond per-consumer hardening.** The conformance harness from α (§(α) #2) MAY share its consumer-side fetch helper if and only if it stays in fourier's `web/e2e/` directory (test code, not product code). The csp-solver fix is one-line (`useApi.ts` reads `VITE_API_URL`); anything beyond is gold-plating. The vendoring decision flips iff `npm view @mkbabb/{value.js,glass-ui,keyframes} version` returns a version ≥ the vendored tarball's; otherwise the vendoring stays.

**Gate.** `web/src/lib/api.ts` handles ETag round-trip on a known-cacheable GET (e.g., `/visualizations/<slug>`) — `If-None-Match` → 304 → cached response; `Idempotency-Key` set on every POST/PATCH/DELETE; retry policy explicit (no silent retry on mutating calls); `VITE_API_URL` is the only base URL (no `/api` same-origin remnant). The csp-solver one-line fix landed. The vendor decision documented (retire or hold) with evidence (live `npm view` output).

### (γ) Thread TRANSPOSITIONS — elegance/simplicity/performance per the user's mandate

**Smallest-honest-mechanism.** **A research-first thread** (mirrors D's δ). At Wα γ produces a candidate list with per-item evidence; at Wχ each candidate gets an inv-12 adversarial re-certification; at execution only the survivors land. **EA-sibling-lane EA5 (per its charter) enumerates the candidate transpositions**; EA6 names the lens rule and the rejection floor.

**The lens rule (binding, lifted from `DA6 §4`):** a transposition is genuine iff it has (a) a *named, present* consumer, (b) a *measured or structural* simplicity/performance delta, and (c) it removes more than it adds. Absent any of the three, it is gold-plating and held as a named residual with its trigger condition — never built speculatively to fill a large tranche.

**Trap to reject.** **Manufactured transpositions to justify a large tranche.** D's transpositions were earned (dead `gallery` stratum, untyped image-asset → typed `ImageAsset`, `snapshot_hash` → `content_hash` H3 rename). The candidate set post-D-close is *smaller*; the manufactured-transposition danger is *higher*. **REJECT** any γ candidate that lacks a named consumer + a measured delta + a net-LOC-negative outcome.

The headline rejected candidates (the inherited floor + the new ones E faces):
- **A shared TypeScript types package for fourier ↔ value.js** — REJECTED (inv-16, the B trap; per-repo independence is load-bearing).
- **A "unified design system" extraction** — REJECTED (DA6 §4: glass-ui IS the shared design substrate; a second layer is gold-plating).
- **Migrate fourier to Rust** — REJECTED (inv-12; one host, one binary, Python+FastAPI is the proven idiom).
- **Add Prometheus + Grafana for metrics** — REJECTED (no consumer; cargo-cult; `curl /api/health` is the live SLI).
- **Multi-region CDN for the API** — REJECTED (over-built; CF Pages already handles the frontend CDN; the API is single-region by design).
- **k8s / docker swarm migration** — REJECTED (inv-12; D.W1 proved single-host deploy + rollback works).
- **A "unified CRUD DSL + codegen"** — REJECTED (inv-16; restated for emphasis).
- **OAuth / SAML / SSO** — REJECTED (the anonymous session + claim flow is sufficient; the gallery has admin auth via the existing emoji+dice mechanism).
- **`Palette` / `colorScale` domain model in fourier** — REJECTED (inv-15, "library nobody calls"; held latent until a real consumer lands — `D.md §7`).
- **The `--reload` background-queue** — REJECTED (root fix already landed at C/D; held as named residual with trigger condition).

The headline candidates to EVALUATE (per-item at Wα):
- **Polyrepo build orchestrator (Nx / Turborepo / Bun workspaces)** — EVALUATE. The vendored `web/vendor/*.tgz` tarballs (D.W1) are operationally a polyrepo seam. If E retires the vendoring via upstream-publishes, no orchestrator is needed. If the vendoring stays, an orchestrator MIGHT earn weight, but only with a measured developer-time delta against the current `npm pack` flow. **Default: REJECT until measured.**
- **Job queue (Celery / RQ / arq / dramatiq)** — EVALUATE. The compute paths are mostly synchronous per `D.md §7` (the `--reload` background queue was held as a named residual with a trigger condition: "compute outliving a request"). If the conformance harness or the test integrity work surfaces a real workload (compute > rate-limit-window), the queue earns; otherwise it stays held. **Default: REJECT speculatively.**
- **Frontend bundle split** — EVALUATE. The 854.40 kB index bundle from D close is borderline (the recommended threshold is ~500 kB). If EA-sibling perf lanes measure a load-time impact on a real device, the split earns; otherwise it stays held as `D.md §7`'s explicit deferral.

**KISS justification for anything beyond the surviving γ candidates.** None. The lens rule binds; sibling lanes propose, EA6 + Wχ adjudicate.

**Gate.** Each γ candidate that lands ships with (i) the named consumer it removes friction for; (ii) the measured or structural delta (LOC removed, p99 latency change, build-time change); (iii) a net-LOC-negative diff. A "transposition" that adds LOC without removing more is REJECTED at code-review.

### (δ) Thread TEST-INTEGRITY-COMPLETION — close the AMBER, run the contract, fix the pytest

**Smallest-honest-mechanism.** D.W6 closed AMBER — local 3p/4f + host 3p/3f from *pre-existing UI drift*; prod went LIVE via W9 but the AMBER hasn't resolved. δ's mechanism is **investigate-the-AMBER + fix-the-root + re-run the matrix to GREEN** (where "GREEN" means each cell is either pass or named-with-cause; no silent skips). Plus the pre-existing pytest failure: `test_backfill_image_bounds_on_migrated_image` in `api/tests/test_image_storage.py` (`D/FINAL.md §6.3`) — investigate-and-fix or document-as-known-flake.

The δ thread's named deliverables:
1. **The 4 failing local Playwright specs** — investigate, classify (real UI bug vs. spec flake vs. pre-existing-known-acceptable), fix or skip-with-reason.
2. **The 3 failing host specs** — same shape, plus reconcile against the SHA parity (host should equal local on the same SHA — if they diverge, that's a real bug).
3. **The prod RED → GREEN cells** (`D/FINAL.md §6` says W9 closed `fourier.babb.dev` LIVE — re-run the prod non-mutating subset and confirm GREEN).
4. **The cross-repo conformance suite in CI** — α's harness lands in `.github/workflows/ci.yml` for both APIs.
5. **The pytest failure** — `test_backfill_image_bounds_on_migrated_image` investigated and discharged.
6. **The W11 FULL dispatcher arm fix** — `D/FINAL.md §6.2` records "Dispatcher `mkbabb/value.js` arm — calls `git fetch` on a non-git host directory." Cross-repo coordination — the host's `/opt/deploy/dispatch.sh` value.js arm needs to either (i) cut over to the real path or (ii) record the rsync flow as the operational reality.

**Trap to reject.** **Mass-test-add for hygiene.** The user did NOT say "add more tests" — they said *test*. The AMBER cells already exist; δ closes them, does NOT author a new test-pyramid layer. **REJECT** any δ work that adds a unit-test suite, a visual-regression suite, a chaos-engineering layer, etc. without a real bug or contract proof driving it.

The secondary trap: **a synthetic-monitoring daemon** (Datadog / NewRelic / Sentry-monitors). **REJECT** — the matrix is six `playwright test` runs against three base URLs; "monitoring" is an operational concern, not a test-integrity concern.

The third trap: **silently flipping `.skip` specs to active** — `settings-persistence.spec.ts` is currently `.skip` (line 9). δ records it as inert (per DA6 §3.3 honesty), does NOT silently un-skip without authoring the missing infrastructure first.

**KISS justification for anything beyond the matrix completion.** None — δ closes what D left AMBER. New spec authoring is E-execution work explicitly out of the integrity thread (the integrity thread proves the current state).

**Gate.** Cross-env matrix at `local × host × prod` per `D/FINAL.md §6(h)` is fully GREEN or each AMBER/RED cell carries a *named cause*; `test_backfill_image_bounds_on_migrated_image` passes or has a reason recorded; the conformance suite runs in CI on PR and produces a pass/fail badge; the dispatcher value.js arm either fires GREEN or has a recorded rsync-is-the-operational-truth disposition.

### (ε) Thread OPERATIONAL-HYGIENE — the chronic + the deferred + the cross-repo upstream commits

**Smallest-honest-mechanism.** ε is a **named residual sweep** — the `D/FINAL.md §6.2` cross-repo residuals + `§6.3` W3-followup + `§6.4` out-of-D-entirely + `§6.5` documentation hygiene, each item discharged or named-successor-recorded. Each item is small; the thread is wide. The mechanism per item:

| Item | Mechanism | Owner |
|---|---|---|
| csp-solver runtime API URL fix | one-line `VITE_API_URL` read | β (consumer) — fold here vs. ε? **Bind to β** (it's a consumer fix). |
| keyframes.js GH-Pages teardown | retire the `peaceiris/actions-gh-pages` job + delete `gh-pages` branch + remove CNAME | ε; cross-repo (keyframes.js maintainer). |
| value.js GH-Pages teardown | same shape as keyframes | ε; cross-repo. |
| W11 FULL palette-api → color rename | host dir rename, compose project, container, data-bearing volume migration; scheduled-downtime window | ε; cross-repo (value.js / palette-api maintainer). |
| Dispatcher `mkbabb/value.js` arm | fix the `git fetch` on non-git dir OR record rsync reality | δ (test integrity, since it's a deploy-chain proof) — **bind to δ**. |
| pre-existing pytest failure | investigate + fix or document | δ — **bind to δ**. |
| Dangling docker images (gaggle, server-api, speedtest-*) | host-ops sweep; `docker image prune -f` with explicit safelist | ε. |
| Dead `:8140` speedtest vhost | host Apache vhost cleanup | ε. |
| `scripts/dns-cf-sync.sh` doc-hygiene | data-tuple sync + `set -u` guard | ε. |
| The floridify dirty edit + palette-api compose edit | upstream-commit the host-side hand-edits via the proper repo arms | ε; cross-repo. |
| Deploy-hook auto-migration sweep | per `C.W1`+`W3` chronic — does the hook run migrations on every deploy or only first-deploy? | ε; document or fix. |

**Trap to reject.** **Mass-rename for cosmetic reasons** (e.g., renaming all containers from `palette-api-*` to `color-*` because the rename is "cleaner"). The W11 FULL rename is a *scheduled-downtime window* per `D/FINAL.md §6.2` — it's *named* but conditional on user authorization for the downtime. **REJECT** any ε work that triggers the W11 FULL rename without explicit user mandate and a downtime window.

The secondary trap: **`docker volume rm` on the data-bearing volume** (`palette-api_mongo-data`). The volume holds prod palette data; a naive rename orphans it. **REJECT** any ε work that touches volumes without the dump+restore choreography recorded in `coordination/PALETTE-API-PROVENANCE.md §4`.

The third trap: **mass commit-and-push to sibling repos** without per-repo review. Each cross-repo residual is a *separate PR* in its own repo with its own maintainer review (even though `mkbabb` is the maintainer of all). **REJECT** any ε work that pushes to multiple sibling repos in one stroke without per-repo discrete commits.

**KISS justification for anything beyond the named-residual sweep.** None. ε is the cleanup pass; anything beyond is in α/β/γ/δ.

**Gate.** Each `D/FINAL.md §6` item is either CLOSED (with the commit/PR that closes it) or has a named successor (with the trigger condition + owner). The host shows no dangling images outside the explicit safelist; the dead vhost is gone; the dispatcher arm fires or has its disposition recorded; the dns-cf-sync.sh hygiene items are committed.

### (ζ) Thread CONDITIONAL — value.js Palette/colorScale domain model

**Smallest-honest-mechanism.** **HELD LATENT until a named consumer lands.** Per `D.md §7` + `COLOUR-LIFT.md` + the inv-15 binding ("no library nobody calls"), the value.js Palette/colorScale domain model has been deferred across B+C+D. ζ exists IFF (a) an EA-sibling lane names a real consumer in fourier or the constellation that needs the Palette object, OR (b) the user re-mandates beyond α's CRUD cohesion to explicitly include the domain model.

**Trap to reject.** **Building the domain model on speculation.** The `Palette`/`colorScale` candidate is the canonical "library nobody calls" anti-pattern (inv-15). **REJECT** ζ as in-scope without (a) or (b) above.

**Gate.** ζ is in-scope only if Wα ratifies a named consumer + the user re-mandates explicitly. Default: ζ stays held; α delivers the CRUD cohesion; the domain model is a value.js tranche when a real consumer lands.

---

## §2 — KISS rejection list (pre-bound REJECT / EVALUATE / IN-SCOPE)

The inherited DA6 + CA6 rejection floor + the new candidates E faces, each with verdict:

| Candidate | Verdict | Rationale |
|---|---|---|
| Shared TypeScript types package fourier ↔ value.js | **REJECTED** | inv-16, the B trap; per-repo independence is load-bearing (`DA6 §1(c)`). |
| Polyrepo build orchestrator (Nx / Turborepo) | **EVALUATE** | might earn weight iff the vendored tarball flow is measurably brittle; default REJECT until measured (γ Wα). |
| Prometheus + Grafana for metrics | **REJECTED** | no consumer; cargo-cult; `curl /api/health` is the live SLI. |
| Migrate fourier to Rust | **REJECTED** | inv-12; Python+FastAPI is the proven idiom on one host. |
| Multi-region CDN for the API | **REJECTED** | over-built; CF Pages handles the frontend CDN; API is single-region by design. |
| Build a CRUD-CONTRACT DSL + codegen | **REJECTED** | inv-16; the contract is documentation, not code (`DA6 §1(c)` restated). |
| OAuth / SAML / SSO | **REJECTED** | anonymous session + claim flow is sufficient; admin via emoji+dice exists. |
| k8s / docker swarm migration | **REJECTED** | inv-12; D.W1 proved single-host deploy + rollback works. |
| Job queue (Celery / RQ / arq) | **EVALUATE** | held as named residual; earns iff real workload (compute > rate-limit-window) surfaces in δ. Default REJECT. |
| Shared `@mkbabb/api-client` package | **REJECTED** | inv-16 for clients; per-repo client per the contract is the discipline (β). |
| A generic retry/cache/idempotency fetch middleware framework | **EVALUATE** | iff ≤80 LOC per-repo wrapper, IN-SCOPE for β; if it grows to plugins+adapters, REJECT. |
| npm-publish value.js / glass-ui / keyframes.js without authorization | **REJECTED** | release act, not refactor; explicit user mandate required. |
| "Unified design system" extraction | **REJECTED** | glass-ui IS the shared design substrate (`DA6 §4`). |
| `Palette` / `colorScale` domain in fourier | **REJECTED** | inv-15, library nobody calls; held latent (`D.md §7`). |
| The `--reload` background-queue speculatively | **REJECTED** | root fix landed; held as named residual with trigger condition. |
| Forking value.js architecture to mirror fourier's | **REJECTED** | inv-16; cohesion is behaviour not shape (D.W5 §10). |
| Synthetic-monitoring daemon (Datadog/NewRelic) | **REJECTED** | not a test-integrity concern. |
| Mass-test-add for hygiene | **REJECTED** | the user said *test*, not *more tests*; δ closes AMBER, does not add layers. |
| Mass-rename for cosmetic reasons | **REJECTED** | W11 FULL rename only on user-scheduled downtime. |
| `docker volume rm` on data-bearing volumes | **REJECTED** | orphan risk; the dump+restore choreography (`PALETTE-API-PROVENANCE.md §4`) is mandatory. |
| Mass commit-and-push across sibling repos | **REJECTED** | per-repo discrete PRs. |
| Visual-regression test suite (Percy / Chromatic / Loki) | **REJECTED** | no consumer; pixel-flake amplifier; the existing Playwright suites are sufficient. |
| Chaos engineering / load testing layer | **REJECTED** | no consumer at fourier's scale (one host, low qps); over-built. |
| Frontend bundle split | **EVALUATE** | iff measured load-time impact (γ Wα); default DEFERRED per `D.md §7`. |
| Sentry / Bugsnag error tracking | **EVALUATE** | iff δ surfaces a real production-error volume requiring per-error triage; default REJECT. |
| Feature flags service (LaunchDarkly / similar) | **REJECTED** | the visibility split (draft/unlisted/public) IS the feature-flag plane; no second layer. |

---

## §3 — Wave shape + agent ceiling + research-first applicability

**Agent ceiling: 4 agents/wave** (the DA6/NA6 binding inherited verbatim). E peaks at α + γ research dispatch (4 lanes); execution waves at ≤3 to leave headroom.

**Wave count estimate: ~10–12 waves total**, compared to D's 14 (W0/Wα/Wχ/W1–W12). E's shape is smaller because α′ (constellation deploy) is closed; the cohort spine is α-cross-repo + γ-transpositions which are both research-first.

**Proposed wave shape (provisional, to be hardened at Wχ):**

| Wave | Title | Threads | Agents | Closes on |
|---|---|---|---|---|
| W0 | Open · baseline · research dispatch | — | 1 | E baseline against `D/FINAL.md §5` (production state confirmation); research dispatch for α + γ |
| Wα | Research wave (ratification + narrowed dispatch) | α/γ/(ζ-conditional) | 3-4 parallel | R1 cross-repo CRUD cohesion (value.js-I scope + the I.W1–W4 sketch ratification against the live `palette-api` v2.0.0); R2 transposition candidate list (the EA5-sibling-named items with per-item lens-rule verdict); R3 consumer enumeration (the "include ALL consumers" mandate audited per API); R4 ζ-conditional (is there a named consumer for the Palette domain model?). Verdicts: RATIFIED / RATIFIED-WITH-DELTA / REJECTED. |
| Wχ | Challenge wave | — | ≤4 probes | P1 inv-16 re-certification (no shared framework/codegen creeping into α); P2 inv-12 re-certification on γ candidates (each transposition has consumer + delta + net-negative); P3 the AMBER cells in δ actually have root-causes investigable; P4 the cross-repo coordination boundary (value.js source untouched without re-mandate); P5 the consumer hardening doesn't grow into a framework. |
| W1 | Cross-repo CRUD cohesion — value.js I.W1–W4 execution | α | 2-3 | value.js-side tranche I lands per `VALUE-JS-ASK.md`; visibility split + soft-delete + SOTA envelopes; top-level `id` hidden. **value.js-side commits, NOT fourier source.** |
| W2 | Cross-repo conformance harness + FK live-resolution | α | 1-2 | the conformance matrix script lands in fourier; runs against both live APIs; produces pass/fail per cell; FK live-resolution e2e proves end-to-end |
| W3 | Consumer hardening — fourier client + cross-repo consumers | β | 2 parallel | `web/src/lib/api.ts` ETag/Idempotency-Key/retry cohesion; csp-solver one-line fix; vendoring-vs-publish decision recorded; value.js's `color.babb.dev` client hardened (cross-repo) |
| W4 | Architectural transpositions (the Wα survivors) | γ | 2-3 parallel | the surviving γ candidates land per the lens rule; each ships with consumer + delta + net-negative LOC |
| W5 | Test integrity completion — AMBER → GREEN | δ | 2 parallel | the 4+3 failing Playwright specs investigated + fixed/skipped-with-reason; prod cells re-run GREEN; conformance suite wired in CI; pytest failure discharged; dispatcher arm fixed |
| W6 | Operational hygiene sweep | ε | 1-2 | the `D/FINAL.md §6` items each CLOSED or successor-named; cross-repo upstream commits per-repo; dangling images cleared; doc-hygiene committed |
| W7 | Close | — | 1 | reconcile PROGRESS; author `E/FINAL.md` (§0→§9 mirroring D); the cross-repo cohort close (fourier-E + value.js-I cohort closure OR named successor); CANONICAL-ORDERING → ordering ζ (or η if W11 / ζ fired) |

**Research-first gate**: W0 → Wα → Wχ applies to **α (cross-repo cohesion)** and **γ (transpositions)** — both are open-design with multiple candidates. **β (consumer hardening), δ (test integrity), ε (operational hygiene)** are direct (the items are concrete + named) but still pass through Wχ for the inv-16/inv-12 re-certification.

**Bounded-parallel rollout discipline** (per NA6 §3, the binding): the value.js I.W1–W4 execution is a *value.js tranche* with its own waves; fourier-E coordinates the ask but does not parallelize across the boundary without explicit re-mandate. W3 (β, web) ∥ W4 (γ, mixed) iff disjoint file sets — coordinate at dispatch. W5 (δ) ∥ W6 (ε) iff disjoint (test vs. ops — likely disjoint).

---

## §4 — Cohort + cross-repo coordination

**The cohort**: fourier-E + value.js-I run as a **cohort**.

**The re-mandate**: the user's E directive ("fix our cross repos" + "include ALL consumers" + "our two palette apis and fourier viz apis") IS the value.js-I re-mandate that D.W5 + `VALUE-JS-ASK.md` held conditional. Per `D.md §3 W5` + `D/coordination/VALUE-JS-ASK.md §1`: "user re-mandate predicate — the value.js-side execution is a value.js tranche that the user must re-mandate before any value.js source is touched (per `D.md §3 W5` + `D/coordination/CRUD-COHESION.md §6` + Wχ-P3 condition C4 — binding)." **E confirms this re-mandate explicitly at W0.**

**The cohort-close discipline** (mirroring B.W5's cohort closure per the user's recorded preference for cohort discipline): both repos close together OR fourier-E names a successor for the value.js-I shortfall. If value.js-I lands fewer than 53/53 DEFERRED cells, the unlanded cells become named residuals in `E/FINAL.md §6` with their successor (a value.js tranche J or similar).

**The cross-repo boundary** (per Wχ-P3.C4 in D, binding): value.js source is touched ONLY by value.js commits, not fourier commits. fourier-E lives at `docs/tranches/E/` in fourier; value.js-I lives at `docs/tranches/I/` in value.js. The conformance harness lives in fourier (the contract owner) but probes both APIs at their live origins. **No cross-repo source edits without explicit per-repo authorization.**

**The `palette_slug` FK** (the load-bearing cross-repo artefact): the §13 clause from `CRUD-CONTRACT v2.0.0`. fourier-E.W2's FK live-resolution probe is the binding proof that the FK is real, not academic. value.js-I MUST preserve the slug-only addressing (no `id` field; the v2.0.0 §1 single-slug rule is invariant).

**The colour-lift residual**: `sampleToSVGPath` consumed iff value.js publishes it during E's window (named residual from D.W5). Evidence-based at Wα: `npm view @mkbabb/value.js exports` + `grep` value.js's HEAD for the export.

---

## §5 — Binding must-NOT list (final, the inv-12 + inv-15 + inv-16 boundary)

The exclusion list for tranche E (inherited from D + CA6 + DA6, plus the new E-specific items):

1. **NO shared types package / shared framework / shared codegen across fourier and value.js** — the B trap (inv-16) restated at every successor; α reaches both repos but the contract is documentation, the clients are independent.
2. **NO new containers / new services / new databases** — the D-shape (mongo + backend + frontend + nginx, one host) is the binding deployment topology.
3. **NO horizontal scaling, multi-replica, k8s, swarm** — inv-12; single-host deploy + rollback is the proven idiom.
4. **NO library nobody calls** — inv-15; the `Palette`/`colorScale` domain model stays held latent unless ζ proves a named consumer; the `--reload` background queue stays held with its trigger condition.
5. **NO mass-rename for cosmetic reasons** — W11 FULL rename happens only in a user-scheduled downtime window; any other mass-rename is gold-plating.
6. **NO mass-test-add for hygiene** — δ closes AMBER, does not add a new test-pyramid layer; new specs are E-execution explicitly out of δ's scope.
7. **NO npm publish without explicit user authorization** — `value.js` / `glass-ui` / `keyframes.js` publishes are release acts requiring user mandate; the vendored `web/vendor/*.tgz` flow stays the default until authorized.
8. **NO destruction of prod data** — no `down -v`, no `db.drop()`, no `docker volume rm` on data-bearing volumes; the `PALETTE-API-PROVENANCE.md §4` dump+restore is mandatory for any volume migration.
9. **NO modifications to value.js source from fourier commits** — the cross-repo boundary (Wχ-P3.C4); value.js-I executes in `value.js/` with value.js commits; fourier-E coordinates via `VALUE-JS-ASK.md`-derived asks.
10. **NO bespoke test harness / synthetic-monitoring daemon** — the matrix is `playwright test` runs with `BASE_URL` env vars per `DA6 §3`.
11. **NO host re-architecture** — the shared host (`mbabb.fridayinstitute.net:1022`) is the binding deployment substrate; the shared dispatcher stays a constellation-level coordination concern, not a fourier-E act (per `DA6 §1(a)`).
12. **NO mutating Playwright specs against prod** — prod runs the non-mutating subset only (per `DA6 §3.3`, restated).
13. **NO speculative job queue / background processing** — held as named residual with the trigger condition ("compute outliving a request"); not built ahead of need.
14. **NO design rebrand / new design system / new colour identity** — D.W4 closed the design-refinement thread; β/γ are functional/architectural, not design (the design refinement is closed unless a real visual regression surfaces).
15. **NO manufactured transpositions to fill a large tranche** — the lens rule binds: consumer + delta + net-negative LOC, or REJECTED.

---

## §6 — The "include ALL consumers" mandate — cross-cutting binding

The user said this verbatim. Every E wave that touches an API contract MUST audit consumers before landing. The cross-cutting binding:

**For fourier viz API contract changes** (any change to `api.fourier.babb.dev`'s contract shape):
- `web/src/lib/api.ts` — the primary consumer (fourier's own frontend).
- `web/e2e/**` — the spec consumer.
- External consumer probe at Wα: `grep` GitHub for `api.fourier.babb.dev` (named consumers); enumerate; harden each.
- The conformance harness from α §(α)#2 must update first; the test cell must go GREEN before the contract change merges.

**For palette API contract changes** (any change to `api.color.babb.dev`'s contract shape — these are *value.js* commits, but fourier-E coordinates):
- `value.js/src/` — the primary consumer (value.js's own frontend at `color.babb.dev`).
- `value.js/docs/`-grounded consumers (the value.js Vue 3 + vanilla docs).
- fourier's frontend / middleware — if it resolves `palette_slug` cross-repo, it is a consumer.
- The conformance harness must update first; the FK live-resolution probe must pass before any palette-API contract change merges.

**For client behaviour changes** (β — ETag / Idempotency-Key / retry policy):
- Each consumer's client gets its own per-repo hardening pass; the behaviours are the same (per the contract), the implementations are independent (per inv-16).

**The audit-before-merge gate**: every E wave that changes a contract or a consumer behaviour records the consumer audit in the wave's coordination doc (per-wave `Wn.md`). Sibling lane EA3 (CRUD substrate) is authoritative for the consumer surface enumeration; EA6 binds the per-wave audit gate.

---

## §7 — Provenance

- D thread shape: `docs/tranches/D/D.md §1, §3, §7`; close: `docs/tranches/D/FINAL.md §0, §6, §9`.
- D-audit guard predecessor: `docs/audits/runs/2026-05-27-D-audit/DA6-guard-thread-scoping.md §1, §4, §5`.
- D-audit synthesis: `docs/audits/runs/2026-05-27-D-audit/SYNTHESIS.md §0, §2`.
- C-audit guard ancestor: `docs/audits/runs/2026-05-27-C-audit/CA6-prompts-precepts-guard.md §4`.
- Cross-repo ask: `docs/tranches/D/coordination/VALUE-JS-ASK.md §1, §2`.
- CRUD contract: `docs/tranches/B/coordination/CRUD-CONTRACT.md` (v2.0.0 via D.W5 `c2ce6d7`); `docs/tranches/B/coordination/CONFORMANCE-MATRIX.md §V2` (the 87 cells).
- Consumer surfaces: `web/src/lib/api.ts:18` (`VITE_API_URL`); `web/e2e/**` (7 specs); `value.js/src/` (cross-repo).
- Invariants: 12 (KISS), 15 (no library nobody calls), 16 (no shared CRUD framework / B trap), 18-20 (the C-era three, name-bound per `D.md §2`), the D additions (production parity, code+migration together, token-system as truth) all inherited unchanged by E.
- Precepts: `docs/precepts/infra/{tls.md, blob-backend-dr.md, deploy.md, domains.md}` (promoted via D.W2 `64f79f9`); memory `feedback_{no_fallbacks, parallelization, em_dashes, style_archaic}.md`; `project_tranche_d.md` (the D charter), `project_infra_plan.md`.
- Production state at E open: `D/FINAL.md §5` — host HEAD `2757c43`, all 4 containers Up healthy, verified-TLS Mongo, Mongo exposure CLOSED, public URL on CF Pages, `api.fourier.babb.dev` LIVE, webhook chain restored.

---

**Thread count**: **5 obligatory** (α/β/γ/δ/ε) + **1 conditional** (ζ).
**Wave count estimate**: **~10–12 waves** (W0 / Wα / Wχ / W1–W7 / W close — compared to D's 14).
**Agent ceiling**: **4 agents/wave** verified (the DA6/NA6 binding; E peaks at Wα with 3–4 parallel research lanes, execution waves at ≤3).
**File**: `/Users/mkbabb/Programming/fourier-analysis/docs/audits/runs/2026-05-28-E-audit/EA6-guard-thread-scoping.md`.
