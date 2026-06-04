# A3 — The Deploy Chronic (post-impl audit, 2026-06-04)

**Auditor dimension:** A3 — root-cause WHY the babb.dev API deploy health-gate fails for the
29-commit G/H/I/J jump; devise the idiomatic, non-workaround terminal plan.
**Repo HEAD:** `9d7c387` (origin/master, NOT deployed). **Host stuck at:** `f2fe447` (29 behind).
**Verdict:** **CHRONIC — months-class. Terminal plan below. No punt.**

---

## 0. The chronic in one sentence

The constellation's API deploy-of-record has been **silently broken since before tranche F** (echo
of F's "webhook silently broken ~2 months"): every push since `f2fe447` fired the webhook, ran the
on-host `scripts/deploy-hook.sh`, **failed the 60-second health gate, rolled back to `f2fe447`, and
exited non-zero into a journalctl log nobody watches.** G-close, H, I, and J have therefore NEVER
landed in prod. The failure is structurally invisible: there is no gate on *whether the pushed SHA
is even green-CI* (the API arm of inv-28 is BOOKED-not-built), and the rollback log reaches **nowhere
the constellation watches** (`grep` for any off-host notify in `deploy-hook.sh` → NONE; output is
stdout → journalctl only).

---

## 1. Root-cause: WHY the gate fails for the 29-commit jump

The gate (`scripts/deploy-hook.sh:82-96`) requires BOTH, polled 30×2s ≈ 60s:
- `/api/health` → body contains `"status"` `"ok"` (via nginx `:8100` → `backend:8000`), AND
- `/` → HTTP `404` (inv-22; served **directly by nginx**, `nginx/fourier.conf:63` `return 404`).

Only THREE files changed in `f2fe447..9d7c387` on the deploy-critical surface
(`git diff --name-only f2fe447 9d7c387 -- nginx/ docker-compose*.yml api/Dockerfile web/Dockerfile`):
`api/Dockerfile`, `docker-compose.prod.yml`, `nginx/fourier.conf`. I ranked the hypotheses against
the evidence:

### H1 (RULED OUT as sole cause) — inv-22 `/→404` under the new nginx
The `/→404` half is served **directly by nginx** (`return 404 '{...problem+json...}'`,
`fourier.conf:63`) — it does NOT proxy to the frontend. The nginx diff in the jump removed exactly
one line (the `api_upload` zone) and the prod-overlay nginx hardening (read_only + tmpfs + cap_drop,
`docker-compose.prod.yml:152-162`) was **already present at `f2fe447`** (`git show f2fe447:docker-compose.prod.yml`
shows `read_only: true` + `depends_on: [backend, frontend]`). So the inv-22 half is the *least*
likely failure. **Diagnostic to confirm:** on a throwaway bring-up of `9d7c387`,
`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8100/` → expect `404`. If it's `404`, the
inv-22 half is green and the failure is the `/api/health` half (H2/H3).

### H2 (PRIME SUSPECT) — `/api/health` 502s because the backend lifespan refuses to start
`api/main.py:42` `await connect_db()` runs **inside the FastAPI lifespan** — it is startup-blocking.
`connect_db` (`api/services/database.py:24-48`) retries with backoff and **`raise`s** on
`ServerSelectionTimeoutError` (`serverSelectionTimeoutMS=5000`), then synchronously creates **~30
indexes** (`database.py:49-109`), including the NEW J fork indexes (`:97-109`: `content_hash`,
`visibility`, the compound `[("visibility",1),("created_at",-1),("_id",-1)]`, etc.). If lifespan
raises, uvicorn never serves, and `/api/health` via nginx returns **502** → gate fails.

The session's "connect_db OK in 0.1s" diagnostic is **insufficient evidence** that this half is
green: it was a bare `docker compose run backend` *connect-only* probe, NOT the full
**lifespan-with-index-creation** running under the prod hardening (read_only root FS + TLS Mongo +
the new fork indexes + `WORKERS=1`). The index-creation pass on a multi-tranche schema delta against
TLS Mongo is exactly the kind of work that can exceed the 60s gate window on a cold container, OR
fail outright if any single `create_index` collides with a pre-existing differently-optioned index
(a real risk: `database.py:97-109` adds indexes that did not exist at `f2fe447`).
**Diagnostic to confirm:** on the host, `docker compose ... up -d` the new stack, then
`docker compose logs backend --since 2m | grep -iE 'index|ServerSelection|Traceback|Application startup'`
and `curl -s http://127.0.0.1:8100/api/health`. A 502 or a startup Traceback confirms H2.

### H3 (CONTRIBUTING) — 60s gate is too short for a 29-commit cold-start
`GATE_RETRIES=30 × GATE_INTERVAL=2 = 60s` (`deploy-hook.sh:59-60`). A 29-commit jump rebuilds BOTH
images (`build --parallel`, `deploy-hook.sh:122`), then cold-starts a `WORKERS=1` uvicorn
(`api/Dockerfile:46`, down from `WORKERS=4` at `f2fe447` — H.β) that must connect TLS Mongo + build
~30 indexes before `/api/health` answers. The gate timer starts at `up -d` return, not at
container-healthy. There is no `depends_on: condition: service_healthy` for the backend in the prod
overlay, and no container `HEALTHCHECK` on the backend image (`grep HEALTHCHECK api/Dockerfile` →
none) — so nginx can be "up" and proxying to a backend that is still building indexes. **Diagnostic:**
time `up -d` → first green `/api/health` on the host; if it crosses ~60s, H3 is live and the gate
window is simply too small for a cold multi-tranche jump.

### H4 (RULED OUT) — the J backend / fork-migration
Confirmed structurally non-causal: prod `visualizations` count = 0 (empty DB → the additive fork-
fields migration is a no-op), AND migrations run **AFTER** the gate (`deploy-hook.sh:184-191`) so they
never even execute on a gate failure. The migration writes Mongo-only (no FS writes — verified
`migrate_visualization_forks.py` does `$set` per row, nothing under the read_only root). J is not the
cause; it is the **victim** riding the same broken chain.

### H5 (latent, will bite on the NEXT clean deploy) — `image_blobs` external volume + dirty-tree guard
Two orthogonal traps the audit must surface even though they aren't the current gate failure:
- `docker-compose.prod.yml:181-183` pins `image_blobs` as `external: true`. If the host volume was
  ever pruned, `up -d` errors "external volume not found" BEFORE the gate — a different failure mode
  the chronic plan must cover (`docker volume create image_blobs`).
- `assert_clean_tree` (`deploy-hook.sh:103-112`) **aborts non-zero if the host tree is dirty**. The
  host was "restored to found state (f2fe447, healthy)" this session — if that restore left ANY
  tracked-file drift, the very next push aborts before fetching. Must verify
  `git -C /var/www/fourier-analysis status --porcelain` is clean as step 0 of the landing.

**Most-probable root cause (ranked):** **H2 primary** (lifespan index-creation against the new
schema either 502s or exceeds the window) **compounded by H3** (60s is too tight for a 29-commit
cold WORKERS=1 start). H1/H4 ruled out. The single diagnostic that disambiguates everything:
**a manual, observed bring-up of `9d7c387` on the host with `docker compose logs backend` captured** —
which the chronic's terminal plan makes a first-class, non-throwaway step.

---

## 2. The terminal plan — three folds, idiomatic, no workaround

### FOLD A (SHIP-as-wave J.Wdeploy-1) — LAND the 29-commit backlog *observed*, not blind
The non-workaround landing is **not** "bump the gate timeout." It is to make the cold-start
*observably correct* before trusting the automated gate:

1. **Pre-flight the host tree** (H5): assert `/var/www/fourier-analysis` is clean + `image_blobs`
   volume exists. These are deterministic preconditions, not guesses.
2. **Manual observed bring-up of `9d7c387`** via the documented manual path
   (`deploy_operational_knowledge.md` line 17), capturing `docker compose logs backend` — this is
   the H2/H3 diagnostic promoted to a deploy step. Read the *actual* startup: TLS connect, every
   `create_index`, "Application startup complete", then `curl :8100/api/health` + `curl :8100/`.
3. **If H2 (index/startup):** the idiomatic fix is to make the backend report ready *separately from
   index-building* — move the ~30 `create_index` calls (`database.py:49-109`) to run **non-blocking
   after** the app starts serving, OR add an explicit container `HEALTHCHECK` + backend
   `depends_on: condition: service_healthy` for nginx so the gate only probes a truly-ready backend.
   (Decision deferred to the wave; both are gestalt, neither is a `|| true` swallow.)
4. **If H3 (timing only):** raising `GATE_RETRIES` is acceptable ONLY paired with a real container
   `HEALTHCHECK` (so the gate waits on *health*, not a blind longer sleep) — a longer blind poll is a
   workaround; a health-condition-gated wait is idiomatic.
5. Once green-observed, let the automated chain re-run from a real push and confirm it converges.

**Disposition: SHIP-as-wave.** This is a deploy *operation* the J tranche must carry to its close —
J is not done while its CORE has never reached prod (echoes the H lesson: a tranche that doesn't
deploy isn't closed).

### FOLD B (SHIP-as-wave J.Wdeploy-2) — make the API arm self-evidently green-CI-gated (inv-28 API half)
This is the **terminal kill** for "a broken/red SHA deploys silently." The SPA arm already does this
correctly: `deploy-pages.yml` triggers `on: workflow_run [CI] completed` and deploys ONLY when
`conclusion=='success' && head_branch=='master' && event=='push'` (verified, the file's `changes`
gate job). The API arm (webhook → deploy-hook) has **no equivalent** — it fires on every push. The
booked-not-built piece (per `deploy_operational_knowledge.md` line 38 + H FINAL) is a fail-closed
`commits/<sha>/status` (or `check-runs`) probe needing a **host-only read-only PAT**. The idiomatic
shape: `deploy-hook.sh` gains a `green_ci_gate()` that — BEFORE `git reset --hard` — queries the
GitHub API for the pushed SHA's combined CI conclusion and **fails closed** (no PAT → refuse, never
deploy-anyway). This makes inv-27 (green-means-green) hold for the *deploy*, not just the merge.

**Why this also fixes the chronic's invisibility:** today a red e2e (the current `9d7c387` state:
web ✓, api/tests ✓, e2e ✗ on the `glass-dock-1` VT collision) would STILL trigger the webhook and
attempt a deploy. With Fold B, the chain *refuses* on red and says so — the refusal is the signal.

**Disposition: SHIP-as-wave.** Operator must provision the read-only PAT (named below as the one
human dependency). The code arm is fourier-owned (`scripts/deploy-hook.sh` + the `mkbabb/deploy`
template). **The current e2e-red (`glass-dock-1`) is the FIRST thing this gate would block** — so
Fold B is gated on, and motivates closing, the W6/glass-ui-3.2.0 dock-VT ask.

### FOLD C (SHIP-as-wave J.Wdeploy-3) — kill the silent-rollback chronic with observability
A rollback that exits non-zero into journalctl is the *mechanism* of a months-class silent failure.
`grep` confirms `deploy-hook.sh` has **zero off-host notification** (no curl-POST, no ntfy/slack/mail).
The idiomatic fix: the deploy-hook's terminal states (DEPLOY OK / ROLLBACK / the "ALERT — no green
target" branch at `:211`) **POST to a constellation-watched sink** — minimally a `curl` to a
notification webhook (ntfy.sh topic or a Discord/Slack webhook URL held host-only in the
un-tracked `.env`, mirroring the HMAC-secret discipline). The sink is named in `mkbabb/deploy` so
EVERY repo's hook inherits it (this is precisely the `deploy/templates/deploy-hook.sh` reference
shape). A deploy that rolls back must *page*, not whisper.

**Disposition: SHIP-as-wave.** Pairs with Fold B in the same `deploy-hook.sh` edit + template
backport. Closes the actual root of "broken for months and nobody noticed" — twice now (F's webhook
secret, this session's health-gate). The third time must be impossible-to-miss.

### FOLD D (FOLD-into-next-tranche) — adopt dev.sh-P0 `deploy.sh` + the dev-deploy-standard
`scripts/deploy.sh` (new this session) is a sound, confirmation-gated operator wrapper:
`api|frontend|all`, exit-code table, `require_bins`, interactive-or-`--yes` confirm, advisory (NOT
authoritative) health-gate that correctly defers to the on-host gate (`deploy.sh:31-35,109-127`).
`scripts/dev.sh` is the conformance rewrite onto the `value.js:docs/dev-deploy-standard.md §2`
template. Both are **substrate without a closed consumer** until: (a) the dev-deploy-standard doc is
adopted as fourier's canonical operator entrypoint in the tranche close, and (b) `deploy.sh`'s
advisory gate is reconciled with Fold A's real fix (it should *report* the same health truth the
on-host gate enforces). **Disposition: FOLD-into-this-tranche** as the operator-facing arm of Folds
A–C — ship the wrapper *with* the fixed spine it wraps, not before.

---

## 3. Findings (evidence-cited)

See the structured `findings[]`. Severity rationale: the silent-rollback invisibility (no green-CI
gate on the API arm + no off-host alert) is the **P0** — it is the mechanism by which a months-class
outage stayed invisible; the H2 startup-blocking lifespan is **P1** (the proximate gate failure);
H3 timing and the H5 latent traps are **P2**.

---

## 4. Chronic — terminal verdict

**CH-DEPLOY (the months-class API-deploy chronic): TERMINAL PLAN = Folds A+B+C, shipped as
J.Wdeploy-1/2/3, NOT a punt.** The chronic is declared CLOSED only when: (1) `9d7c387`+ is observed-
green in prod via Fold A; (2) the API arm refuses a red-CI SHA via Fold B (inv-28 API half built,
not booked); (3) a rollback pages a constellation-watched sink via Fold C. The single human
dependency — the host-only read-only GitHub PAT for Fold B — is named and operator-owned; until it
is provisioned, Fold B's gate **fails closed** (refuse-to-deploy), which is itself the correct
safe state. No perpetual punt: every prior "BOOKED" deploy item (the API-arm green-CI gate, the
silent-rollback observability) is converted to a SHIP-as-wave with an acceptance shape.
