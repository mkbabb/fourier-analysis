# R-deploy-spec — the chosen deploy design's binding contract

**Lane**: R2 (Wα · thread α) · **Date**: 2026-05-27 · **Status**: research
deliverable — the binding contract W1 implements and Wχ-P2 challenges.
**Survey**: `R2-cicd.md` (candidate ranking + rejected alternatives).
**Measures against**: `W0-baseline.md §1.1` (deploy path + `:8091` bug), `§1.3`
(secrets), `§1.4` (port 8100); `C.md §2` invariant 19 + invariant 12;
`project_infra_plan.md:12`.

This document is the *contract*: the auth mechanism + secret placement, the
receiver, the commit-to-deploy chain, the rollback path, the health check (port
8100), and the `deploy.sh` retirement-proof shape. W1 must land each clause or
name an honest successor; Wχ-P2 tests each against an intentional bad commit.

---

## §1 — The chosen shape (one sentence)

The dev runs `git push origin master`; GitHub POSTs an HMAC-SHA256-signed
`push` event to a host-resident `adnanh/webhook` receiver (systemd-supervised,
**no container**); the receiver verifies the signature against a host-only
secret and runs a tracked on-host deploy script that records the current SHA,
resets to `origin/master`, rebuilds + restarts the compose stack, and **gates on
`http://127.0.0.1:8100/api/health`** — reverting to the recorded SHA on health
failure. `scripts/deploy.sh` is deleted.

---

## §2 — Auth mechanism + secret placement (invariant 19 + `§1.3`)

### 2.1 Mechanism: HMAC-SHA256 over the GitHub payload

- GitHub's repo webhook (`git@github.com:mkbabb/fourier-analysis.git` — confirmed
  GitHub-hosted via `git remote -v`) is configured with a **secret** and content
  type `application/json`. GitHub signs each delivery body with HMAC-SHA256 and
  sends `X-Hub-Signature-256: sha256=<hex>`.
- The receiver's hook rule uses `adnanh/webhook`'s built-in
  `payload-hmac-sha256` match against `X-Hub-Signature-256`, the shared secret,
  and a constant-time compare. A request whose signature does not verify is
  **rejected** (no command runs).
- This satisfies invariant 19's "authenticate cryptographically rather than via
  shared bearer / SSH-key reuse": the proof is per-payload (binds to the exact
  body), not a static bearer, and not the dev's SSH key (`deploy.sh:11`, retired).

**Rejected alternatives** (per `R2-cicd.md §2`): a static deploy *token* (a
shared bearer — no payload binding, replays trivially) and SSH-key reuse (the
defect being retired). HMAC strictly dominates because GitHub emits the
signature for free and it binds to the payload.

### 2.2 Secret placement — three artefacts, none in compose

| Secret | Lives in | Tracked? |
|---|---|---|
| Webhook HMAC secret | (a) GitHub repo → Settings → Webhooks (GitHub secret store); (b) the host hooks file `/etc/webhook/hooks.json`, root-owned `0600` | **NO** — never in the repo, never in `docker-compose*.yml`, never in `.env.example` |
| `MONGO_PASSWORD` (unchanged) | the host's out-of-band `.env`, consumed by compose via `${MONGO_PASSWORD:?…}` (`docker-compose.prod.yml:8,44,51`) | NO — already clean per `W0-baseline.md §1.3` |

**Invariant-19 / `§1.3` gate**: the webhook secret is a *host* artefact,
structurally outside the compose plane. W1's secret sub-gate (`§1.3`: "confirm
no secret enters via the new webhook receiver's config") is met by construction:
the receiver's secret-bearing config (`hooks.json`) is un-tracked and host-only;
the tracked deploy script (`§3.2`) carries no secret.

---

## §3 — The receiver

### 3.1 `adnanh/webhook`, systemd-supervised, no container

- A single static Go binary installed on `mbabb.fridayinstitute.net`,
  listening on a **loopback** port (proposed `127.0.0.1:9000`), supervised by a
  systemd unit (`webhook.service`, `Restart=on-failure`).
- The host's **outer** reverse proxy (the same one fronting `8100` per
  `W0-baseline.md §1.4` — host-level, *not* this repo's `nginx/fourier.conf`)
  exposes a TLS `location /hooks/` → `proxy_pass http://127.0.0.1:9000/hooks/`.
- **No new container** (`R2-cicd.md §1` Rank 1): the receiver must live *outside*
  the compose stack it restarts — a receiver inside a container it tears down
  cannot survive its own deploy. Wχ-P1's "no new container without per-line
  justification" is satisfied with zero containers added.
- **No new language runtime, no database**: one binary, one unit, one hooks
  file. The deploy logic is a shell script (`§3.2`), not a service.

### 3.2 The deploy command — a tracked `scripts/deploy-hook.sh`

The hook rule invokes a **tracked, in-repo** `scripts/deploy-hook.sh` (the
artefact that *replaces* `deploy.sh`), not inline shell in the host hooks file.
Rationale: the deploy logic stays versioned + reviewable; the only un-tracked
artefact is the secret-bearing `hooks.json` registration.

`scripts/deploy-hook.sh` runs **on the host, in `/var/www/fourier-analysis`**,
wrapped in a `flock` so overlapping triggers serialise (`R2-cicd.md §6`). Its
contract (W1 authors the exact bash):

```text
flock /run/lock/fourier-deploy.lock:
  PREV=$(git rev-parse HEAD)                       # record rollback target
  git fetch origin
  git reset --hard origin/master                   # advance to pushed SHA
  docker compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
  if ! health_gate 8100:                           # §5 — REAL gate, no swallow
       git reset --hard "$PREV"                     # §4 — revert
       docker compose … build --parallel && up -d
       health_gate 8100 || alert                    # prior SHA must come back
       exit 1                                        # receiver logs failed deploy
  log "$PREV -> $(git rev-parse HEAD) OK"           # the recorded deploy chain
```

No SSH anywhere — the script runs *on* the target. The `set -euo pipefail`
discipline of `deploy.sh:4` is preserved; the difference is the health gate is
load-bearing and a revert path exists.

---

## §4 — The rollback path (W1 gate: verified by an intentional bad commit)

1. `PREV=$(git rev-parse HEAD)` captured **before** `git reset --hard`.
2. On health-gate failure (`§5`), `git reset --hard "$PREV"`, rebuild, `up -d`,
   and re-gate to confirm the prior SHA is healthy again.
3. Exit non-zero; the receiver logs a failed deploy (journald).

**Why git-SHA revert, not image-tag revert** (`R2-cicd.md §4`): the topology
builds on-host from source (`deploy.sh:26`), so there is no registry to roll
back to — the git SHA *is* the deployable artefact. A registry-tag rollback
would require adopting a registry (rejected, `R2-cicd.md §1` Rank 5).

**W1 verification (the gate, verbatim from `C.md §3` W1 row — "rollback verified
by an intentional bad commit")**:

1. Push a commit that deliberately breaks startup (e.g. a syntax error in
   `api/main.py`, or a bad nginx directive) so `/api/health` never returns
   `{"status":"ok"}` on `8100`.
2. Observe: the receiver deploys it, the health gate fails, `git reset --hard
   $PREV` fires, the prior SHA rebuilds, the site stays up on the last-known-good.
3. Record the journald transcript (the deploy chain + the revert) as the W1
   artefact. Then push the fix; observe a clean green deploy.

---

## §5 — The health check (port 8100)

- **Endpoint**: `http://127.0.0.1:8100/api/health` expecting body `{"status":
  "ok"}` (live route `api/main.py:125-127`), plus `http://127.0.0.1:8100/` for
  the SPA. Port **8100** is the live prod nginx bind
  (`docker-compose.prod.yml:72`, `127.0.0.1:${HTTP_PORT:-8100}:80`), proxied to
  the backend by `nginx/fourier.conf:30`.
- **Source the port from `${HTTP_PORT:-8100}`** — the same default the compose
  file uses — so the gate and the bind cannot drift (the structural fix for the
  `:8091` class of bug, `W0-baseline.md §1.1`).
- **Poll, bounded** (replace `deploy.sh:32`'s blind `sleep 5`): retry up to
  ~60 s at ~2 s intervals; green ⇒ proceed, timeout ⇒ rollback (`§4`).
- **No `|| echo` swallow** (`deploy.sh:38` defect): the gate's non-zero exit is
  load-bearing — it *is* the rollback trigger.

The `:8091` of `deploy.sh:38-39` must not reappear anywhere in the replacement.
Wχ-P2 greps the replacement for `8091` (must be zero) and confirms the gate
references `8100` / `${HTTP_PORT}`.

---

## §6 — Failure-mode contract (Wχ-P2 must each be demonstrable)

| Mode | Required behaviour |
|---|---|
| Partial build | `set -e` aborts before `up -d`; live stack unchanged; no revert needed; receiver logs non-zero. |
| Health fail mid-deploy | Rollback to `$PREV` (`§4`); site returns to last-known-good; exit non-zero. |
| Replay / duplicate webhook | HMAC rejects any *modified* payload (`§2.1`); an unmodified replay is idempotent (`reset --hard` to the same SHA + identical rebuild + no-op `up -d`); a `flock` serialises concurrency (`§3.2`). |
| Two rapid pushes | `flock` serialises; the latest `HEAD` deploys once. |
| Receiver crash | systemd `Restart=on-failure` respawns; an in-flight deploy is recovered by re-push. |
| GitHub → host unreachable | GitHub marks delivery failed; manual redelivery from the repo webhook UI is the recovery path (a path, not a silent loss). |

---

## §7 — Does it TRULY replace `deploy.sh`? (the no-remnant clause)

**Yes, end-to-end.** Every `deploy.sh` step is covered (`R2-cicd.md §3`):

- `git push origin master` (`deploy.sh:14`) — **preserved as the trigger**, and
  this is *correct, not a remnant*: the design is "dev pushes, server reacts."
  The push is the ordinary act of publishing code, intrinsic to any
  GitHub-event-driven deploy. It is **not** a deploy-specific manual step.
- SSH-in (`deploy.sh:11,17`) — gone; replaced by the GitHub→receiver webhook.
- fetch/reset/build/up (`deploy.sh:22-29`) — done on-host by
  `scripts/deploy-hook.sh`, now health-gated + revertible.
- the decorative `:8091` curl + `sleep 5` (`deploy.sh:32,38-39`) — replaced by
  the real `8100` gate (`§5`).

**Named residual: none.** The only surviving manual action is `git push`, which
the design *requires* as the trigger and is not a deploy remnant. (A future
deploy-on-tag policy would be a hook-filter change, not a topology change —
noted, not a residual.)

---

## §8 — The `deploy.sh` retirement-proof shape (what W1 deletes + how it proves)

The retirement proof is a **deletion proof, not a comment-out** (`C.md` NO-legacy
precept; `C.md §3` W1 row: "`deploy.sh` retired (deletion proof, not commented
out)"):

1. **`scripts/deploy.sh` does not exist.** `git rm scripts/deploy.sh`; the file
   is gone from the tree (tranche-level gate `C.md §6`: "`scripts/deploy.sh`
   does not exist"). Proof: `test ! -f scripts/deploy.sh` and
   `git log --diff-filter=D -- scripts/deploy.sh` shows the deletion commit.
2. **The `:8091` bug is moot + absent.** `git grep -n 8091` returns zero across
   the tree (the bug cannot be inherited by the replacement). `8100` /
   `${HTTP_PORT}` is the only port the new health gate references.
3. **The replacement is proven by a recorded commit-to-deploy chain**
   (`C.md §6`: "webhook deploy proven by a recorded commit-to-deploy chain"):
   a journald (or captured) transcript of a real push → receiver-verified-HMAC →
   on-host deploy → green `8100` health gate, with the `PREV → NEW` SHA pair
   logged. This is the artefact, not "webhook configured" (an invalid gate per
   `C.md §6`: "'webhook configured' without a recorded deploy chain" is rejected
   at challenge).
4. **Rollback is proven by the intentional bad commit** (`§4` W1 verification):
   the transcript shows the bad SHA deployed, the gate failing, the revert to
   `$PREV`, and the site healthy on the prior SHA.

W1 deliverables ledger:

| Artefact | What proves the gate |
|---|---|
| `scripts/deploy.sh` deleted | `test ! -f`; deletion commit in `git log` |
| `scripts/deploy-hook.sh` (tracked, new) | the on-host deploy logic (`§3.2`); reviewed, versioned |
| host `webhook.service` unit + `hooks.json` (un-tracked, documented in `docs/precepts/infra/`) | the receiver; secret placement recorded (not the secret itself) |
| recorded deploy-chain transcript | `C.md §6` "recorded commit-to-deploy chain" |
| recorded bad-commit-revert transcript | `C.md §3` W1 "rollback verified by an intentional bad commit" |
| `git grep 8091` → zero | the `:8091` bug retired, not inherited |

---

## §9 — Boundaries W1 must honour (KISS / invariant 12)

- **No container added** (`§3.1`). The receiver is a host binary.
- **No registry adopted** (build-on-host preserved; `§4`).
- **No multi-replica** (invariant 19's single-replica constraint preserved —
  the deploy targets the one stack).
- **No webhook *framework*** (`CA6` guard, `2026-05-27-C-audit/CA6 §… inv-16`):
  the receiver is a deploy artefact, not a shared CI service; the deploy logic
  is one shell script, not a pipeline DSL.
- The webhook secret stays out of compose and out of the tree (`§2.2`).
