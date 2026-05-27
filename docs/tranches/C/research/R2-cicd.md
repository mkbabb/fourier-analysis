# R2 — Webhook CI/CD survey (tranche C, wave Wα · thread α)

**Lane**: R2 · **Date**: 2026-05-27 · **Mode**: RESEARCH ONLY — no source files touched.
**Charter** (`W0-baseline.md §5`): survey the webhook-deploy shape that replaces
`scripts/deploy.sh` end-to-end. Auth model, the receiver, the rollback path,
the failure modes, whether it truly retires `deploy.sh`, and the correct
health-check port (8100, per `W0-baseline.md §1.4` — the `:8091` bug must not
recur).

**Binding measures**: `W0-baseline.md §1.1` (the deploy path + the `:8091`
health-check bug), `§1.3` (secrets — already satisfied via `${MONGO_PASSWORD:?}`),
`§1.4` (port map; prod is 8100), `C.md §2` invariant 19 (cryptographic deploy
auth — NOT SSH-key reuse, NOT a shared bearer; secrets stay out of compose),
`C.md` invariant 12 (KISS, single-replica), and
`project_infra_plan.md:12` ("CI/CD: webhook-based (adnanh/webhook), not
SSH-based GitHub Actions").

All `file:line` citations are verified against the live tree at survey time.

---

## §0 — What is being replaced (the surface W1 retires)

`scripts/deploy.sh` (42 L, `set -euo pipefail`) is a **developer-operated SSH
push** — it runs on the *dev's* machine and reaches into the server:

| Step | Line | What it does |
|---|---|---|
| push | `deploy.sh:14` | `git push origin master` (the dev's local git) |
| reach | `deploy.sh:11,17` | `ssh -p 1022 mbabb@mbabb.fridayinstitute.net bash -s <<'REMOTE'` |
| pull | `deploy.sh:22-23` | remote `git fetch origin` + `git reset --hard origin/master` |
| build | `deploy.sh:26` | `docker compose -f …yml -f …prod.yml build --parallel` |
| up | `deploy.sh:29` | `docker compose … up -d` |
| settle | `deploy.sh:32` | `sleep 5` |
| "health" | `deploy.sh:38-39` | `curl -sf http://localhost:8091/api/health` and `:8091/` — **wrong port** (prod binds `8100` at `docker-compose.prod.yml:72`); the `\|\| echo "not responding"` swallow (`:38`) means it never fails the deploy |

**Three structural defects** this lane must close, not paper over:

1. **Auth is SSH-key reuse** (`deploy.sh:11`) — the dev's personal SSH key is
   the deploy credential. Invariant 19 forbids this: deploy artefacts must
   authenticate *cryptographically per-deploy*, not via a reused interactive
   credential.
2. **No rollback path** — `git reset --hard origin/master` (`deploy.sh:23`)
   moves the checkout to whatever `master` points at. A bad commit deploys
   itself; recovery is a *manual* re-push of an earlier SHA. There is no
   health gate that reverts.
3. **The health check is decorative** — wrong port (`:8091` vs live `8100`),
   and even a real failure cannot fail the script (the `|| echo` swallow).
   `sleep 5` (`deploy.sh:32`) is a fixed guess, not a readiness wait. This is
   the canonical "unobservable deploy hides drift" the baseline cites
   (`W0-baseline.md §1.1`).

The replacement must invert the topology: the **dev only pushes to GitHub**;
the **server reacts** to a GitHub event and deploys itself. No human SSHes.

---

## §1 — Candidate receivers, KISS-ranked (invariant 12)

The "receiver" is whatever runs on `mbabb.fridayinstitute.net` to (a) accept a
GitHub `push` notification, (b) authenticate it, and (c) trigger
`pull → build → up → health-gate → (revert on fail)`. Ranked by smallest honest
mechanism first.

### Rank 1 — `adnanh/webhook` (a single static-Go binary, systemd-managed)

**This is the infra-plan's pre-decided receiver** (`project_infra_plan.md:12`:
"webhook-based (adnanh/webhook), not SSH-based GitHub Actions"). It is a single
statically-linked Go binary; it reads one YAML/JSON `hooks` file declaring (i)
the URL path, (ii) an HMAC-SHA256 trigger-rule keyed to a secret, and (iii) the
command to execute on a verified hit. It is supervised by **systemd** (a unit
file the host already supports — the server runs Docker under systemd).

- **New container?** **No.** The binary runs on the host, not in compose — this
  is the correct boundary: the thing that runs `docker compose up` must live
  *outside* the compose stack it restarts (a receiver inside a container it
  tears down cannot survive its own deploy). Wχ-P1's "reject any framework
  needing its own container" is satisfied: zero new container.
- **New dependency?** One host binary + one systemd unit + one hooks file. No
  Python/Node runtime, no package tree, no database. The deploy command itself
  is a shell script the hook invokes.
- **Operational cost**: one long-lived process listening on a loopback port
  (e.g. `127.0.0.1:9000`), fronted by the host's *outer* nginx for the public
  `/hooks/…` path with TLS (the same outer reverse proxy that already fronts
  `8100`, per `W0-baseline.md §1.4`). Logs to journald.
- **HMAC native**: `adnanh/webhook` has a built-in `payload-hmac-sha256`
  match-rule that validates GitHub's `X-Hub-Signature-256` header against a
  shared secret — invariant-19 cryptographic auth with no code to write.
- **KISS fit**: highest. It is purpose-built for exactly this, the infra plan
  already chose it, and it adds neither a container nor a language runtime.

**Verdict: chosen.** (See `R-deploy-spec.md`.)

### Rank 2 — A bespoke systemd unit + a tiny shell/Python listener

A hand-rolled receiver: a `socat`/`nc` one-liner or a ~40-line Python
`http.server` that verifies the HMAC and shells out. Same topology as Rank 1
(host process, systemd-supervised, no container).

- **New container?** No.
- **New dependency?** None beyond the host's existing Python (or none, for the
  shell variant).
- **Why not chosen**: it re-implements — badly, and as *legacy-prone bespoke
  code* — exactly what `adnanh/webhook` already does correctly (HMAC constant-
  time comparison, replay headers, request-method/content-type gating, command
  templating). Writing our own HMAC verification is the kind of hand-rolled
  security primitive invariant 19's spirit and the NO-workarounds precept argue
  against. KISS counts *total* complexity, not just dependency count: a vetted
  single-purpose binary is simpler than maintaining our own HTTP server.

### Rank 3 — GitHub Actions with a self-hosted runner

A GitHub Actions workflow (`on: push`) executing on a **self-hosted runner**
installed on `mbabb.fridayinstitute.net`, running `docker compose … up -d`
locally (no SSH).

- **New container?** No, but the runner is a **long-lived agent process** that
  polls GitHub, auto-updates itself, and carries a registration token — a
  materially larger operational surface than a webhook binary.
- **New dependency?** The full Actions runner (a .NET-based agent ~hundreds of
  MB), plus the runner-registration secret lifecycle.
- **Why not chosen**: heavier than the task warrants for a single-replica host
  (invariant 12). The runner is itself a standing attack surface with its own
  update cadence. The infra plan explicitly rejected the GitHub-Actions family
  (`project_infra_plan.md:12`). Acceptable only if multi-repo CI consolidation
  were a goal — it is not (C is fourier-only, `C.md §0`).

### Rank 4 — GitHub Actions over SSH (the "cloud runner SSHes in")

A hosted (GitHub-cloud) runner that SSHes to the server using a deploy key
stored as a GitHub secret.

- **Why rejected outright**: this is `deploy.sh`'s SSH-key-reuse model dressed
  as CI — it merely *moves* the SSH key from the dev's laptop to GitHub's secret
  store. Invariant 19 forbids SSH-key reuse as the deploy credential
  regardless of where the key is parked. It also requires opening port 1022 to
  GitHub's egress ranges. **Default-reject.**

### Rank 5 — A push-based agent inside compose (e.g. Watchtower, a sidecar)

A container that watches a registry and pulls new images.

- **Why rejected**: introduces a new container (Wχ-P1 cost) **and** a registry
  (we build on-host, not from a registry — `deploy.sh:26` builds locally).
  Inverts the build model and adds standing infra. Default-reject under
  invariant 12.

---

## §2 — Auth-model comparison (invariant 19)

Invariant 19: "deploy artefacts authenticate cryptographically rather than via
shared bearer / SSH-key reuse" (`C.md §2`). Two candidates clear that bar; one
does not.

| Model | Mechanism | Secret lives where | Invariant-19 verdict |
|---|---|---|---|
| **HMAC-signed GitHub webhook** (chosen) | GitHub signs each `push` payload with HMAC-SHA256 over a shared secret, sent as `X-Hub-Signature-256`. The receiver recomputes the MAC and constant-time-compares. | The webhook secret lives in the **receiver's hooks file on the host** (root-owned, `0600`) and in the **GitHub repo's webhook config** (GitHub-side secret store). It is **not in any compose file**, not in the repo, not an env var compose reads. | **PASS.** Per-payload cryptographic proof that the request came from GitHub *and* the body is unmodified. The secret authenticates the *channel*, the signature authenticates each *payload*. |
| **Scoped deploy token** (bearer in a custom header) | The dev/CI sends a long random token; the receiver compares it. | A static token on the host + sender. | **WEAK PASS / rejected here.** A static bearer is "a shared bearer" invariant 19 names as the thing to avoid — it does not bind to the payload, so a captured token replays trivially and authenticates *any* body. Only acceptable if no payload signing is available; GitHub *does* sign, so the HMAC model strictly dominates. |
| **SSH key (status quo)** | `deploy.sh:11` reuses the dev's interactive SSH credential. | The dev's `~/.ssh`. | **FAIL.** Explicitly forbidden by invariant 19 ("SSH-key reuse"). This is the surface being retired. |

**Chosen: HMAC-signed GitHub webhook.** It is the only model that is both
cryptographic *and* binds the proof to the specific payload, and GitHub emits
the signature for free. The deploy-token model is strictly weaker (no payload
binding) and adds a secret we'd have to invent; SSH-key reuse is the defect.

### Secret placement (the invariant-19 / `§1.3` sub-gate)

`W0-baseline.md §1.3` records that the "secrets out of compose" gate is
**already met for passwords** (`${MONGO_PASSWORD:?}` at `docker-compose.prod.yml:8,44,51`).
R2's auth model must not regress this:

- The **webhook HMAC secret** lives only in (a) the GitHub repo webhook config
  and (b) the host's root-owned hooks file (`/etc/webhook/hooks.json`,
  `0600`). **It never enters `docker-compose*.yml`, `.env.example`, or any
  tracked file.** The deploy command the hook runs may *source* the host's
  existing `.env` (which carries `MONGO_PASSWORD` out-of-band, per
  `.env.example:13-14`), but the webhook secret itself is receiver-local.
- This keeps the secret out of the compose plane entirely — the receiver is a
  *host* artefact, structurally outside the container config invariant 19
  guards.

---

## §3 — The commit-to-deploy chain (does it TRULY replace `deploy.sh`?)

The replacement must cover *every* `deploy.sh` step with no manual remnant.

| `deploy.sh` step | Replacement | Manual? |
|---|---|---|
| `git push origin master` (`:14`) | The dev still runs `git push origin master` — but this is **ordinary git**, not a deploy script. The push *is* the trigger. | This is the *only* dev action, and it is not a deploy remnant — it is the normal act of publishing code. The server reacts to it. **No deploy-specific manual step survives.** |
| SSH in (`:11,17`) | GitHub POSTs the `push` event to `https://<host>/hooks/deploy-fourier`; the receiver authenticates the HMAC and runs the deploy script *on the host*. | None — no human SSHes. |
| `git fetch` + `reset --hard` (`:22-23`) | The on-host deploy script does the fetch + reset — but **gated** (see rollback, §4): it records the current SHA *before* resetting, so a revert target exists. | None. |
| build + up (`:26,29`) | The deploy script runs `docker compose … build && up -d`. | None. |
| `sleep 5` + decorative curl (`:32,38-39`) | Replaced by a **real readiness loop** against the correct port (§5). | None. |

**Verdict: yes, it truly replaces `deploy.sh` end-to-end.** The dev's
`git push origin master` is preserved as the trigger — and that is correct, not
a remnant: the design's whole point is *"dev pushes, server reacts."* The only
thing that could be called manual — the push — is the act of publishing code,
which is intrinsic to any GitHub-event-driven deploy. **No named residual.**

(If the team later wants deploy-on-tag rather than deploy-on-every-master-push,
that is a hook-filter tweak, not a topology change — noted, not required.)

---

## §4 — The rollback path (W1's gate: caught by an intentional bad commit)

`deploy.sh` has **no** rollback (`§0` defect 2). The replacement makes the
deploy **health-check-gated and self-reverting**:

1. Before mutating the checkout, the deploy script captures the
   **currently-deployed SHA**: `PREV=$(git rev-parse HEAD)`.
2. `git fetch && git reset --hard origin/master`, then
   `docker compose build && up -d`.
3. **Readiness gate**: poll `http://127.0.0.1:8100/api/health` for `{"status":
   "ok"}` (the live route, `api/main.py:125-127`) with a bounded retry/timeout
   (not a blind `sleep 5`). Also poll `http://127.0.0.1:8100/` for the frontend.
4. **On success**: log the new SHA + the deploy outcome; done.
5. **On failure** (health never goes green within the timeout): `git reset
   --hard $PREV`, rebuild + `up -d` the previous SHA, re-poll. Exit non-zero so
   the receiver logs a failed deploy (and, optionally, notifies).

This satisfies the W1 gate verbatim: *"rollback verified by an intentional bad
commit"* (`C.md §3` W1 row). The verification is operational, not theatrical:
commit a deliberately-broken change (e.g. a syntax error that fails the health
check), push, and observe the receiver deploy it, fail the gate, and revert to
`$PREV` with the site staying up on the prior SHA.

**Why SHA-revert, not image-tag-revert**: we build on-host from source
(`deploy.sh:26`), so there is no image registry to roll back to. The git SHA
*is* the deployable artefact; reverting the checkout + rebuilding is the honest
rollback for a build-on-host topology. (A registry-tag rollback would require
adopting a registry — rejected in `§1` Rank 5 as standing infra inflation.)

---

## §5 — The health check (port 8100 — the `:8091` bug must not recur)

The replacement's readiness gate hits **`http://127.0.0.1:8100/api/health`** and
**`http://127.0.0.1:8100/`** — port **8100**, the live prod nginx bind
(`docker-compose.prod.yml:72`: `127.0.0.1:${HTTP_PORT:-8100}:80`), proxied to
the backend `/api/health` (`nginx/fourier.conf:30` → `proxy_pass
http://backend:8000`; the route is `api/main.py:125`). The `:8091` of
`deploy.sh:38-39` was never a live port — the `W0-baseline.md §1.1` bug.

Three correctness upgrades over `deploy.sh`'s curl:

- **Right port**: `8100`, sourced from `${HTTP_PORT:-8100}` (the same default
  the compose file uses) so the script and the bind cannot drift again.
- **No swallow**: the gate's failure is *load-bearing* — it triggers the
  rollback (`§4`). `deploy.sh:38`'s `|| echo "not responding"` swallow is gone.
- **Poll, don't sleep**: replace `sleep 5` (`deploy.sh:32`) with a bounded
  retry loop (e.g. up to ~60 s, 2 s interval) so the gate waits for *actual*
  readiness rather than guessing.

---

## §6 — Failure modes

| Failure | Behaviour under the chosen design |
|---|---|
| **Partial build** (`docker compose build` fails) | `set -euo pipefail` in the deploy script aborts before `up -d`; the *running* stack is untouched (old containers keep serving). The receiver logs non-zero. No revert needed — the checkout was reset but the live containers never changed; next push re-attempts. (Optional hardening: build first, only `up -d` on build success — which `set -e` already enforces.) |
| **Health-check fail mid-deploy** (new containers start but `/api/health` never goes green) | The `§4` rollback fires: `git reset --hard $PREV` + rebuild + `up -d` + re-poll. The site returns to the last-known-good SHA. The receiver exits non-zero; the failed SHA is logged. |
| **Webhook replay / duplicate POST** (GitHub retries, or a captured payload is replayed) | (a) HMAC validation rejects any *modified* payload (invariant 19). (b) A captured *unmodified* replay would re-run the deploy of the *same* SHA — which is **idempotent**: `git reset --hard` to an already-checked-out SHA is a no-op, the rebuild produces the same images, `up -d` is a no-op if nothing changed. (c) A **flock** (`flock /run/lock/fourier-deploy.lock`) around the deploy command serialises concurrent/overlapping triggers so two pushes in quick succession do not interleave a build. |
| **Two pushes in quick succession** | The flock serialises them; the second waits, then deploys the newer `HEAD` (which already includes the first). Net effect: the latest SHA deploys once. |
| **Receiver process dies** | systemd `Restart=on-failure` respawns it. A deploy in flight when the receiver dies is interrupted; the next push re-deploys. (The deploy command is a child the hook spawns; systemd restart of the receiver does not kill an in-flight `docker compose`, but the safe assumption is "re-push to recover.") |
| **GitHub cannot reach the receiver** (host down / TLS error) | GitHub marks the webhook delivery failed and offers manual redelivery from the repo's webhook UI — a recovery path, not a silent loss. |

---

## §7 — Per-candidate operational-cost summary (Wχ-P1 ledger)

| Candidate | New container | New dependency | Standing surface | KISS rank |
|---|---|---|---|---|
| `adnanh/webhook` + systemd | **none** | 1 host binary + 1 unit + 1 hooks file | one loopback listener | **1 (chosen)** |
| bespoke listener + systemd | none | host Python/shell only | one loopback listener + *our* HMAC code | 2 |
| GH Actions self-hosted runner | none | full Actions runner agent | standing polling agent, self-updating | 3 |
| GH Actions over SSH | none | runner + SSH deploy key | re-opens 1022; SSH-key reuse | rejected (inv 19) |
| Watchtower / registry sidecar | **+1** | container + registry | standing watcher + registry | rejected (inv 12) |

The chosen receiver adds **zero containers** and **one small host binary** — the
smallest honest mechanism that satisfies invariant 19's cryptographic-auth bar.

---

## §8 — Open questions handed to W1 (not decided here)

- The exact public path + outer-nginx `location /hooks/` block (the outer
  reverse proxy is host-level, not in this repo's `nginx/fourier.conf` — W1
  records where it lives).
- Whether the deploy command lives as a tracked `scripts/deploy-hook.sh`
  (versioned, the replacement artefact) invoked by the host hooks file, or
  inline in the hooks file. **R2's recommendation**: a tracked
  `scripts/deploy-hook.sh` (versioned, reviewable, the thing that *replaces*
  `deploy.sh`) referenced by the un-tracked host hooks file — so the deploy
  logic is in-repo and the only un-tracked artefact is the secret-bearing hook
  registration. See `R-deploy-spec.md §3`.
- Notification on failed deploy (journald is the floor; a push notification is
  optional polish, not a gate).
