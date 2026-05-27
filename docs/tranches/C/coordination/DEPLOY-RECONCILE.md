# C — deploy reconciliation (the host-artefact reality + the two strata)

**Status**: Stratum A landed + provable from this repo; Stratum B (host-ops) **proposed, not imposed** — pending a coordinated host-ops step. **Authored**: 2026-05-27 (W1, thread α). **Authority**: this doc is the binding record of the W1 reconciliation; the spec is `docs/tranches/C/waves/W1.md`, grounded in the live-host probe `docs/tranches/C/audit/challenge-P2.md`.

This record exists because `R-deploy-spec.md` was authored **greenfield** against a host that already runs a contradicting design. Wχ-P2 measured the contradiction read-only against the live host. **W1 lands the reconciliation, NOT the greenfield spec** (`C.md §5.4`; challenge synthesis §2 C5). It separates two strata cleanly and never conflates them in the close record.

---

## §1 — The host-artefact reality (measured, `challenge-P2.md §1.1`)

A **live, operational, multi-repo `adnanh/webhook` dispatcher already exists** on `mbabb.fridayinstitute.net` and contradicts the greenfield spec on nearly every concrete clause. The measured host facts:

| Live host fact (read-only probe) | Greenfield spec clause it falsifies |
|---|---|
| `webhook` binary `/usr/local/bin/webhook`, **service active** | `R-deploy-spec §3.1` "W1 installs" — already installed |
| `ExecStart=… -hooks /opt/deploy/hooks.json -port 9000 -verbose -hotreload` | spec hooks path `/etc/webhook/hooks.json` — live is **`/opt/deploy/hooks.json`** |
| Webhook `LISTEN 0 4096 *:9000` (**all interfaces**) | spec "loopback `127.0.0.1:9000`" — live is **`*:9000`** |
| `hooks.json` `-rw-rw-r-- mbabb:mbabb` (mode **0664, user-owned**) | spec "root-owned `0600`" — live is **world-readable, user-owned** |
| `execute-command: /opt/deploy/scripts/dispatch.sh`, `command-working-directory: /opt/deploy` | spec "tracked in-repo `scripts/deploy-hook.sh`" — live logic is an **un-tracked host script** |
| `dispatch.sh` is a **multi-repo `case "$REPO" in …`** dispatcher keyed on `repository.full_name`, branching across `mkbabb/{fourier-analysis,words,speedtest,value.js,csp-solver}` | spec/charter "the receiver is a deploy artefact, **not a shared CI service**" (inv-16) — the live receiver IS the shared multi-repo CI service the invariant forbids |

**The one clause that matches**: the auth rule — a `payload-hmac-sha256` match on `X-Hub-Signature-256` **and** a `value` match on `ref == refs/heads/master` (read live, secret redacted). That is the invariant-19 HMAC model `R-deploy-spec §2` chose, and it is **already live**. The auth verdict is vindicated by reality; everything structural around it is wrong on the page.

**fourier has NEVER deployed through this chain**: `/opt/deploy/logs/` carries only `mkbabb-speedtest-*.log`, zero fourier entries; the host checkout is on a stale SHA (`8818ae5`), far behind local master. The fourier `case` arm exists but has never fired. W1 wires the fourier path for the first time.

### §1.1 — The invocation contract `scripts/deploy-hook.sh` is written to match

The tracked `scripts/deploy-hook.sh` (Stratum A) is written so the live dispatcher can adopt it WITHOUT re-architecting the shared receiver: the fourier `case` arm cd's into `/var/www/fourier-analysis` and runs the script (passing the GitHub `repository.full_name`); the script runs ON the host (no SSH). The build/up commands mirror the retired `deploy.sh:26,29` verbatim (`docker compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel` then `up -d`). The script carries the four improvements the live `dispatch.sh` provably lacks (`challenge-P2.md §2.2`, §3):

1. **`flock` serialisation** — `grep -c flock` on the live `dispatch.sh` = 0. The script wraps its body in `flock /run/lock/fourier-deploy.lock`. The lock is **fourier-scoped** (a fourier-named lockfile), so it does not block sibling-repo deploys; cross-repo concurrent-build resource contention on the 15 GiB host is a shared-dispatcher concern named in Stratum B, not solvable from one repo's lockfile.
2. **A REAL `:8100` health-gate, sourced from `${HTTP_PORT:-8100}`, no swallow** — polls `http://127.0.0.1:${HTTP_PORT:-8100}/api/health` for `{"status":"ok"}` (the live route `api/main.py:125-127`) **and** `…/` for the SPA. The port is the same default the compose nginx bind uses (`docker-compose.prod.yml:72`, `127.0.0.1:${HTTP_PORT:-8100}:80`), so the gate and the bind **cannot drift** (the structural fix for the `:8091` bug class). Bounded poll (~60 s / 2 s interval, not a blind `sleep 5`). The non-zero exit is load-bearing — it IS the rollback trigger. NO `|| echo` swallow (the `deploy.sh:38-39` defect, where a dead port "passed").
3. **Rebuild-on-rollback** — the live `dispatch.sh` rollback does `git reset --hard "$PREV"` then `up -d` ONLY: no `build`, no re-poll, so it restarts containers built from the *failed* source and returns 1 without ever confirming the prior SHA came back green. The script records `PREV` **before** the reset, and on health-fail: `reset --hard "$PREV"` → `build --parallel` → `up -d` → **re-gate**, then exit non-zero. No `build … || build …` fallback (the live defect that defeats `set -e`).
4. **Dirty-tree-fail-loud (C7)** — the host fourier tree is DIRTY (`M docker-compose.prod.yml`, `M docker-compose.yml`, `?? ssl/`). A blind `git reset --hard` would silently discard the modified tracked compose files (possible host-specific overrides — the W2 TLS work, an out-of-band tweak). The script checks `git status --porcelain` before any reset and FAILS LOUD (non-zero exit + named dirty paths) on a dirty tree — never a silent discard. (`ssl/` survives — `reset --hard` spares untracked files — but modified *tracked* files do not.)

**Last-known-GREEN nuance** (bounded): the script records the green SHA on each successful gate to a host-side out-of-tree marker (`/opt/deploy/fourier-last-green`) so the *second* and subsequent rollbacks pin last-known-green rather than bare HEAD. For the **first** deploy, the dirty-tree clause forces the operator to reconcile the host tree first, so the first baseline is reproducible. This is the honest answer to the `$PREV`-builds hazard (`challenge-P2.md §2.1`), not a claim that rollback is infallible.

---

## §2 — Stratum A: repo-local, LANDED + PROVEN this wave

These land in fourier's tree and prove from fourier's commit chain alone. They are the wave's binding deliverables — green this wave, unconditionally.

| Deliverable | State | Proof |
|---|---|---|
| `scripts/deploy-hook.sh` (tracked, new — the four improvements, secret-free, SSH-free, `8100`-only) | **landed** | `test -f`; greppable in fourier's chain; `bash -n` parses |
| `scripts/deploy.sh` deleted (deletion proof, NOT comment-out) | **landed** | `test ! -f`; `git log --diff-filter=D -- scripts/deploy.sh` |
| `.gitignore` negation updated (`!scripts/deploy.sh` → `!scripts/deploy-hook.sh`) | **landed** | the new tracked script is no longer ignored by `scripts/*` |
| The honest scoped `8091` grep returns zero (C8) | **landed** | `git grep -nE '[:/]8091' -- ':!docs/*' ':!*.lock' ':!**/*.json'` → zero after the deletion |

**Note on the scoped grep (C8):** the bare `git grep -n 8091 → zero` is **provably unachievable** even after `deploy.sh` is deleted (`challenge-P2.md §6`): `8091` appears as an incidental substring in `uv.lock` (inside `sha256:` hashes / PyPI URLs) and in seven committed curve-path JSON assets under `web/src/assets/fourier-paths/` (a digit run inside floating-point coordinates), plus extensive `docs/**` prose. The scoped form excludes docs, lockfiles, and JSON, and anchors on a port-reference (`[:/]8091`). Before the deletion it isolated exactly `scripts/deploy.sh:38,39` (the two real bug sites); after it, zero.

---

## §3 — Stratum B: host-ops residual — PROPOSED, not imposed (C6)

These touch the **shared** `/opt/deploy/dispatch.sh`, which serves four sibling repos (`words`, `speedtest`, `value.js`, `csp-solver`). W1 **cannot rewrite shared infra unilaterally** from fourier's tree without risking those four repos (`C.md §3` W1 row "proposed, not landed unilaterally"; synthesis §2 C6). W1 **proposes** the changes and carries them here as a named host-ops residual.

The proposal (what host wiring would entail, if performed):

1. **Register / re-point fourier's hook arm** so `/opt/deploy/hooks.json`'s fourier `case` invokes the tracked `scripts/deploy-hook.sh` (Stratum A) rather than the inline dispatcher logic. The arm already exists (`challenge-P2.md §1.1`); pointing it at the repo-local script is the minimal wiring. **(Proposed — touches the shared `hooks.json`.)**
2. **Shared-dispatcher hardening** (touches all five repos — proposed, NOT imposed): adopt `flock` per-repo lockfiles in the shared dispatcher; replace the `build … || build …` fallback that defeats `set -e`; add rebuild + re-gate to the rollback path; harden `hooks.json` + `/opt/deploy/.env` from `0664 mbabb:mbabb` to `0600`/root or document the accepted weaker posture. These mirror the Stratum-A improvements but at the shared layer — arguably its own constellation-level coordination, not a fourier-W1 unilateral edit.
3. **Reconcile the dirty host tree** (`M` on both compose files, stale SHA `8818ae5` — `challenge-P2.md §3.1`) **before the first gated deploy**, or the `$PREV` baseline is unreproducible (C7). This is a host-ops step, surfaced loud by the Stratum-A deploy-hook's dirty-tree clause.

**No fourier commit from this repo edits `/opt/deploy/dispatch.sh`.** That is the load-bearing scope boundary distinguishing W1's honest landing from the greenfield spec's overreach (G12).

---

## §4 — The precept content destined for `docs/precepts/infra/deploy.md`

`docs/precepts/` is a git **SUBMODULE** (`git submodule status` → `f27627e… docs/precepts`). A commit landing a deploy note there enters the **precepts submodule's** history (an outward-facing, shared-repo act), not fourier's chain — fourier records only a gitlink bump. Per the §2.4 / C-§7 decision, **the precept content is staged HERE** (a fourier-tracked path, reachable from fourier's commit chain) so the note's *content* is provable from fourier's tree this wave; the submodule landing + gitlink bump + dual citation is itself a coordinated outward-facing act, carried as the precepts-submodule residual below.

### Staged content for `docs/precepts/infra/deploy.md`

> **Deploy — the webhook CI/CD chain (fourier-analysis).**
>
> **Topology.** The dev runs `git push origin master`; GitHub POSTs an HMAC-SHA256-signed `push` event to a host-resident `adnanh/webhook` receiver (systemd-supervised, **no container**); the receiver verifies the signature against a host-only secret and runs the tracked, on-host `scripts/deploy-hook.sh`, which records the rollback SHA, resets to `origin/master`, rebuilds + restarts the compose stack, and **gates on `http://127.0.0.1:${HTTP_PORT:-8100}/api/health`** (expecting `{"status":"ok"}`) plus the SPA root — reverting (rebuild + re-gate) to the recorded SHA on health failure. The dev's sole manual act is `git push`.
>
> **Host-artefact locations** (un-tracked, host-only):
> - `/usr/local/bin/webhook` — the receiver binary.
> - `/opt/deploy/hooks.json` — the hook registration (carries the HMAC secret).
> - `/opt/deploy/scripts/dispatch.sh` — the shared multi-repo dispatcher (fourier arm invokes `scripts/deploy-hook.sh`).
> - `/opt/deploy/.env` — dispatcher env.
> - `webhook.service` — the systemd unit (`Restart=on-failure`).
> - `command-working-directory: /opt/deploy`; deploy target `/var/www/fourier-analysis`.
> - `/run/lock/fourier-deploy.lock` — the fourier-scoped `flock`.
> - `/opt/deploy/fourier-last-green` — the last-known-green SHA marker.
>
> **Secret discipline.** The HMAC secret lives ONLY in (a) GitHub repo → Settings → Webhooks (GitHub's secret store), and (b) the host `hooks.json`. It is **never in fourier's tree, never in `docker-compose*.yml`, never in `.env.example`** — verified clean (`challenge-P2.md §4`: `.env.example` carries only `MONGO_*`, `ADMIN_TOKEN=dev`, ports, VITE args; the non-doc tree has no `hooks.json`/`webhook.service`/`adnanh`/`payload-hmac` reference). `scripts/deploy-hook.sh` carries NO secret and NO SSH. The in-tree secret-handling pattern is `${VAR:?}` for `MONGO_PASSWORD` (`docker-compose.prod.yml:8,44,51`, baseline §1.3) — already clean, so W1 needs no compose edit.
>
> **Recorded finding (a host-ops residual, NOT a Stratum-A fix).** The host `hooks.json` + `/opt/deploy/.env` are `0664 mbabb:mbabb` — world-readable, not root-`0600`. Any local host user can read the secret and forge `X-Hub-Signature-256`. The greenfield spec asserted `0600`-root; the live reality is looser. Recorded as the accepted-or-to-be-hardened posture (§3.2), not silently claimed fixed.
>
> **Known property (named, not guarded).** A force-push to `master` deploys the rewritten tree — there is no branch-protection in the trigger rule (`challenge-P2.md §5`). Bounded, single-operator; named here, not defended against (KISS / invariant 12).

**Precepts-submodule residual:** landing the above at `docs/precepts/infra/deploy.md` inside the submodule + bumping the fourier gitlink + citing both repos is an outward-facing shared-repo act, carried as host-ops alongside §3. Until then, the content above is the authoritative source, reachable from fourier's chain.

---

## §5 — The honest gate disposition (C6 — never claimed proven when not)

| Gate | Disposition |
|---|---|
| G1–G9, G12 (Stratum A + the host residual record) | **repo-local landed + proven this wave**, unconditionally |
| G10 — recorded commit-to-deploy chain transcript | **host-activation pending.** Provable iff host wiring is performed (the fourier `hooks.json` arm re-pointed at `scripts/deploy-hook.sh`, a real push captured from `/opt/deploy/logs/mkbabb-fourier-analysis-*.log` or journald). **Not yet performed; not claimed proven.** |
| G11 — rollback verified by an intentional bad commit | **host-activation pending.** The verification DESIGN is recorded (§5.1); the transcript is captured iff host wiring is performed. **Not yet performed; not claimed proven.** |

**The disposition rule (binding, `C.md §3` W1 row + synthesis §2 C6):** the deploy-chain transcript is the gate **IFF** host wiring is performed this wave; **ELSE** the close record reads **"repo-local landed, host-activation pending."** The chain is **never** claimed "webhook configured / proven" when it is not (`C.md §6` invalid-gate list). A transcript captured *before* the shared dispatcher's fourier arm invokes the Stratum-A script would document the live dispatcher's *weaker* rollback (no rebuild, no re-gate), so it is valid evidence of the spec's contract only once the arm points at `scripts/deploy-hook.sh` (`challenge-P2.md §2.3`).

**W1 close disposition: repo-local landed + proven; host-activation pending.**

### §5.1 — The intentional-bad-commit rollback verification DESIGN (runnable iff host-wired)

The exact recipe, the expected revert sequence, and the capture path — landed repo-local now; the transcript is pending host wiring.

1. **The break.** Push a commit that deliberately breaks startup so `/api/health` never returns `{"status":"ok"}` on `:${HTTP_PORT:-8100}` — e.g. a syntax error in `api/main.py` (an unterminated string / bad indent in the `health()` route block) so the FastAPI app fails to import and the container never serves.
2. **The expected sequence** (observed in `scripts/deploy-hook.sh`'s log + journald):
   - the receiver verifies HMAC, invokes the fourier arm → `scripts/deploy-hook.sh`;
   - the dirty-tree guard passes (host tree reconciled per §3.3);
   - `PREV` recorded (the last-known-green SHA from `/opt/deploy/fourier-last-green`), `reset --hard origin/master` advances to the bad SHA, build + up;
   - the bounded health gate **fails** (~60 s of `/api/health` never returning `{"status":"ok"}`) — its non-zero exit fires the rollback;
   - `git reset --hard $PREV` → `build --parallel` → `up -d` → **re-gate** → GREEN; the site stays up on last-known-good;
   - the script exits **non-zero**; the receiver logs a failed deploy.
3. **The fix.** Push the corrected `api/main.py`; observe a clean green deploy — gate GREEN on the new SHA, `/opt/deploy/fourier-last-green` updated, `PREV → NEW` logged.
4. **The capture path.** `/opt/deploy/logs/mkbabb-fourier-analysis-*.log` (the dispatcher per-repo log) and/or `journalctl -u webhook.service`, plus the `scripts/deploy-hook.sh` `[deploy-hook …]` log lines showing the `PREV → NEW` pair and the ROLLBACK / re-gate transcript.

---

## §6 — Cross-wave coordination notes

- **W5 (thread β) owns `api/**` + `docker-compose*.yml`** this wave. W1 does **not** touch compose — baseline §1.3 found secrets already clean via `${MONGO_PASSWORD:?}`, so W1 needs no compose edit. The `${HTTP_PORT:-8100}` the gate sources is read FROM the existing compose bind, not written to it.
- **W2 (thread α) ships through this pipeline.** The TLS rollout is the first non-trivial change W1's chain exercises (`C.md §3` sequencing). W1 lands the pipeline; W2 ships through it.
- **The shared-dispatcher rewrite + the `0664` secret hardening + the dirty-tree reconcile** (§3) are arguably constellation-level coordination across all five sibling repos — surfaced here, owned by a coordinated host-ops step, not by either W1 agent's repo-local commit.
