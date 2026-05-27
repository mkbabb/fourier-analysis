# Challenge P2 — does the webhook CI/CD design actually replace `deploy.sh`, including failure modes? (adversarial probe)

**Wave**: Wχ challenge wave, probe P2.
**Target**: the R2 deploy verdict — `docs/tranches/C/research/R2-cicd.md` + `docs/tranches/C/research/R-deploy-spec.md` (adnanh/webhook, HMAC-SHA256, health-gated self-reverting rollback, `deploy.sh` deleted).
**Mode**: RESEARCH/CHALLENGE-ONLY. No source files touched, no host mutations. Host probes were strictly read-only (`whoami`, `stat`, `git status`, `cat` with secrets redacted). No commit.
**Date**: 2026-05-27.
**Mandate**: TRY TO BREAK the R2 verdict — host-artefact gap, rollback proof, flock/concurrency, secret handling, the `git push` trigger gap.

---

## §0 — Headline

**DISPOSITION: PASS-WITH-CONDITIONS — but the conditions are heavier than the
spec admits, and one of them inverts a stated invariant.**

The probe began as a paper review and became a *ground-truth* one: this agent
environment carries the dev's SSH key and the host `mbabb.fridayinstitute.net`
is reachable read-only (`§1`). That reachability turned the "host-artefact gap"
from a hypothesis into a **measured contradiction** — and the measurement is
damning to R2's *completeness and honesty*, far more than to its *direction*.

**The single sharpest flaw**: R2 + R-deploy-spec were written as **greenfield**,
but a *live, already-operational, multi-repo* webhook deploy dispatcher
**already exists on the host** and contradicts the spec on nearly every concrete
clause — path, ownership, bind interface, single-vs-shared topology, flock, and
re-gate. The spec is not the design that is deployed; it is a design that was
never reconciled against the one that runs. R2 §8's "open questions handed to
W1" (the outer-nginx block, the receiver location) are presented as *undecided*
when in fact they are **already decided on the host, differently** — and the
research never looked.

The chosen *auth model* (HMAC-SHA256 over the GitHub payload, `ref` gated to
`refs/heads/master`) is sound and **matches the live host**. The *topology* is
correct (dev pushes, server reacts; no new container). But the spec's failure-
mode contract (`R-deploy-spec §6`), its secret-placement claims (`§2.2`), its
concurrency claim (`§3.2` flock), and its `:8091`-grep gate (`§8.2`) are each
**falsified or unachievable as written** against the live tree and the live host.

---

## §1 — The host-artefact gap is NOT a gap of access — it is a gap of HONESTY

R2 §8 + R-deploy-spec §3.1/§8 frame the receiver, `hooks.json`, `webhook.service`
and the outer reverse proxy as host-only artefacts "outside this repo," with the
public path and the receiver location listed as **open questions for W1**
(`R2-cicd.md:289-292`). The sharpest probe in the brief asks: can W1 actually
*prove* the chain, or is the recorded-transcript gate unachievable from this repo
because the agent has no SSH access?

**Measured answer: the agent DOES have SSH access** (the dev's key is present in
this environment; `ssh -p 1022 mbabb@mbabb.fridayinstitute.net` authenticates
non-interactively and returns `mbabb`). So W1 *can* reach the host. But that
access immediately surfaces a worse problem than "cannot prove":

### §1.1 — A live, working webhook deploy already exists — the spec never found it

Read-only host probe (`/opt/deploy/`):

| Live host fact | Spec claim it contradicts |
|---|---|
| `webhook` binary at `/usr/local/bin/webhook`, **service active** | `R-deploy-spec §3.1`: "W1 installs" — already installed |
| Unit `ExecStart=/usr/local/bin/webhook -hooks /opt/deploy/hooks.json -port 9000 -verbose -hotreload` | spec hooks path is `/etc/webhook/hooks.json` (`R-deploy-spec §2.2`, `§8`); live is **`/opt/deploy/hooks.json`** |
| Webhook listens `LISTEN 0 4096 *:9000` (**all interfaces**) | spec: "listening on a **loopback** port (`127.0.0.1:9000`)" (`R-deploy-spec §3.1`) — live is **`*:9000`, not loopback** |
| `hooks.json` is `-rw-rw-r-- mbabb:mbabb` (mode 0664, user-owned) | spec: "root-owned, `0600`" (`R-deploy-spec §2.2` table; `R2-cicd.md:179`) — live is **world-readable, user-owned** |
| `execute-command: /opt/deploy/scripts/dispatch.sh`, `command-working-directory: /opt/deploy` | spec: a **tracked in-repo** `scripts/deploy-hook.sh` invoked by the host hooks file (`R-deploy-spec §3.2`) — live deploy logic is an **un-tracked host script**, NOT in fourier's tree |
| `dispatch.sh` is a **multi-repo `case "$REPO" in …`** dispatcher keyed on the GitHub `repository.full_name` argument, branching across `mkbabb/fourier-analysis`, `mkbabb/words`, `mkbabb/speedtest`, `mkbabb/value.js`, `mkbabb/csp-solver` | spec/charter: "the receiver is a deploy artefact, **not a shared CI service**" (`R-deploy-spec §9`, citing `CA6 … inv-16`); `R2-cicd.md:126`: "C is fourier-only." The live receiver is exactly the **shared, multi-repo CI service** the invariant forbids. |

The auth rule itself is the one clause that matches: a `payload-hmac-sha256`
match on `X-Hub-Signature-256` **and** a `value` match on `ref == refs/heads/master`
(read live, secret redacted). That is the invariant-19 model R2 §2 chose — and it
is already live. So R2's *auth verdict* is vindicated by reality. Everything
structural around it is **wrong on the page**.

### §1.2 — What this does to the C.W1 gate: "configured but unproven" is the floor; "contradicts the spec" is the truth

The `C.md §6` invalid-gate list rejects *"'webhook configured' without a recorded
deploy chain."* The live host is, in fact, **worse than "configured but unproven"
for fourier specifically**:

- There has **never been a fourier deploy through this chain**: `/opt/deploy/logs/`
  contains only `mkbabb-speedtest-*.log` (newest `2026-04-03`); **zero**
  `mkbabb-fourier-analysis-*.log`. The dispatcher *can* deploy fourier (the
  `case` arm exists) but never has.
- The host fourier checkout is on `8818ae5` ("refactor(contours)…") — far behind
  local master (`8b111a8`). The host has not pulled fourier in a long time.

So the recorded-commit-to-deploy-chain gate (`C.md §6`; `R-deploy-spec §8.3`)
**is achievable** (the agent has access; a push *would* trigger `dispatch.sh`'s
fourier arm) — but W1 must (a) wire `hooks.json` for fourier (already done — the
arm exists), (b) push, and (c) capture the journald/log transcript. **The honest
W1 verdict is: the chain CAN be proven, but proving it forces W1 to confront
that the deployed receiver is the shared multi-repo dispatcher the spec
explicitly outlawed.** W1 cannot land R-deploy-spec as written without either
(i) rewriting `/opt/deploy/dispatch.sh` into a fourier-only `scripts/deploy-hook.sh`
(the spec's design) — which would *break the four other repos that share the
dispatcher*, or (ii) amending the spec to bless the shared dispatcher and drop
the inv-16 "not a shared CI service" clause. **Neither path is free.** This is
the host-artefact gap's real shape: not "unprovable," but "provable only by
exposing that the spec and the host disagree."

---

## §2 — The rollback proof — the `$PREV`-still-builds assumption, plus three live defects

R-deploy-spec §4 / R2-cicd §4: capture `PREV=$(git rev-parse HEAD)` before
`reset --hard origin/master`; on health-gate failure `git reset --hard "$PREV"`,
rebuild, `up -d`, **re-poll** to confirm the prior SHA is healthy.

### §2.1 — The `$PREV`-builds premise is unguarded (spec-level, real)

The probe brief's hazard is correct and **unaddressed by the spec**: `git reset
--hard $PREV` + rebuild assumes the previous commit *still builds and runs*. It
can fail to:

- **A dependency/base-image drifted underneath `$PREV`.** The build is
  `docker compose build --parallel` from source; if a `FROM` base tag, an apt/uv
  index, or an npm registry moved since `$PREV` was last built, the rebuild of
  `$PREV` can fail even though `$PREV` was healthy when it was live. The deploy
  rebuilds rather than re-using the prior image, so rollback is a *fresh build of
  old source*, not a restore of the *running image*. **This is the rollback's
  weakest joint and the spec asserts the opposite** ("the site returns to the
  last-known-good SHA," `R2-cicd.md:265`) without proving the old SHA rebuilds.
- **`$PREV` was already broken.** If a push lands on top of an already-unhealthy
  `$PREV` (the prior deploy failed but the containers limped along, or were
  never health-verified — which is the live case, since fourier has *never* been
  deployed through this chain), `reset --hard $PREV` reverts to a SHA that also
  fails the gate. Cascade: both new and prior fail → the site is down with no
  green target. The spec's only answer is "exit non-zero + alert"
  (`R-deploy-spec §3.2` `health_gate … || alert`), which is a notification, not a
  recovery.

A truly honest rollback would pin the **last-known-GREEN** SHA (recorded by the
*previous successful* deploy), not "whatever HEAD was before this push." `$PREV`
= `rev-parse HEAD` is "the previously-checked-out SHA," which is only
last-known-good if the prior deploy was itself gated-green — unproven here.

### §2.2 — The LIVE `dispatch.sh` rollback is materially weaker than the spec (measured)

The live `/opt/deploy/scripts/dispatch.sh` `deploy()` function, read read-only:

```
PREV=$(git rev-parse HEAD)
git fetch origin && git reset --hard origin/master
docker compose -f …yml -f …prod.yml build --parallel 2>&1 || docker compose build --parallel 2>&1   # line 14
docker compose -f …yml -f …prod.yml up -d 2>&1 || docker compose up -d 2>&1                          # line 15
for i in $(seq 1 12); do curl -sf "http://localhost:8100/api/health" && { prune; return 0; }; sleep 5; done
echo "FAILED — rolling back to $PREV"
git reset --hard "$PREV"
docker compose -f …yml -f …prod.yml up -d 2>&1 || docker compose up -d 2>&1                          # line 28
return 1
```

Three live defects the spec's §6 contract claims are handled but are NOT:

1. **The rollback does NOT re-build and does NOT re-gate.** Spec §4 step 2:
   "`git reset --hard "$PREV"`, **rebuild**, `up -d`, and **re-gate** to confirm
   the prior SHA is healthy again." The live script does `git reset --hard
   "$PREV"` then **`up -d` only — no `build`, no re-poll** (line 28). It restarts
   containers built from the *failed* source unless the images happen to be
   cached, and it returns `1` **without ever confirming the prior SHA came back
   green.** The site can be down and the script still "rolled back." This is the
   spec's load-bearing rollback clause, falsified on the live host.

2. **The `|| docker compose …` fallback DEFEATS `set -e` on the build.** Spec §6
   "Partial build" row: "`set -euo pipefail` aborts before `up -d`; the running
   stack is untouched." But live line 14 is `build … || build …` — the `||`
   makes the compound succeed even if the primary build fails, so control
   **falls through to `up -d`** (line 15) with a half-built or stale image set.
   `set -e` does **not** fire on a failed command that is the left operand of
   `||`. The spec's "partial build leaves the live stack untouched" guarantee is
   **void** on the live script. (Worse: line 15's `up -d || up -d` can tear down
   healthy containers and bring up broken ones, then enter the 60 s gate.)

3. **The gate is `12 × sleep 5` = a 60 s blind-interval poll**, not the spec's
   "bounded retry loop … ~60 s, 2 s interval" (`R-deploy-spec §5`). Close enough
   on duration, but it is still a fixed `sleep 5` between probes (the very
   pattern §5 says to replace), and it only polls `/api/health` — it does **not**
   poll `http://localhost:8100/` for the SPA as both `R2-cicd.md:219` and
   `R-deploy-spec §5` require.

### §2.3 — The bad-commit test IS runnable without manual host config — but proves the LIVE script, not the SPEC

The probe asks: is the intentional-bad-commit test (`C.md §3` W1) runnable
without a live host? **It is runnable WITH the live host** (the agent has access;
the fourier `case` arm exists; a push to master triggers it). But what it would
*prove* is the behaviour of `/opt/deploy/dispatch.sh` — which, per §2.2, is **not
the spec's design**. So a W1 transcript captured today would document a
rollback that does not rebuild and does not re-gate — i.e. it would *pass the
gate's letter* ("rollback verified by an intentional bad commit," `C.md §3`)
while *demonstrating the spec's contract is unmet*. The gate is satisfiable; its
evidence would expose the spec-vs-host divergence.

---

## §3 — The flock / concurrency claim — FALSIFIED on the live host, and worse for the shared dispatcher

R-deploy-spec §3.2 + R2-cicd §6 make `flock /run/lock/fourier-deploy.lock` the
serialisation guarantee: overlapping triggers serialise; two rapid pushes deploy
the latest `HEAD` once; replays are idempotent under the lock.

**Live `dispatch.sh` contains NO `flock`** (`grep -c flock` = 0). The
serialisation guarantee the spec leans on for the replay/duplicate and
two-rapid-pushes failure modes (`R-deploy-spec §6` rows 3–4) **does not exist on
the host.** Concretely:

- Two near-simultaneous fourier pushes spawn two `dispatch.sh` processes that
  both `git reset --hard origin/master` + `docker compose build/up` in
  `/var/www/fourier-analysis` concurrently — interleaving builds and `up -d` on
  the **same** checkout and the **same** compose project. Non-deterministic.
- Because the dispatcher is **multi-repo and shares one binary/working model**,
  a fourier push and a `value.js` push arriving together run two `dispatch.sh`
  invocations doing `docker compose build --parallel` for two different stacks at
  once on a **15 GiB host** (`project_infra_plan.md:7`) — a resource-contention
  failure mode the single-repo spec never modelled. The `-hotreload` flag on the
  webhook unit re-reads `hooks.json` on change but does nothing for command
  concurrency.

On the narrower sub-question — *does the receiver read its hook config from the
repo it resets?* — **the spec is SAFE and verified**: `hooks.json` lives at
`/opt/deploy/hooks.json` and `dispatch.sh` at `/opt/deploy/scripts/`, both
**outside** `/var/www/fourier-analysis`, so `git reset --hard origin/master` in
the repo cannot clobber the receiver's config or the deploy script. R2 §1's
"receiver outside the stack it restarts" boundary holds at the *config* level on
the host. (It does NOT hold at the *concurrency* level — see above.) So the
specific worry "receiver depends on a repo file it's about to reset" is
**cleared**; the flock claim itself is **un-implemented**.

### §3.1 — A NEW concurrency hazard the spec missed: the dirty host working tree

Host `git -C /var/www/fourier-analysis status --porcelain` (read-only):

```
 M docker-compose.prod.yml
 M docker-compose.yml
?? ssl/
```

The host fourier checkout is **DIRTY** — two tracked compose files are locally
modified and `ssl/` (the mongo cert mount, per `docker-compose.prod.yml:57-58`)
is untracked. `git reset --hard origin/master` (live line 13) will **silently
discard the modified compose files** on the next deploy. If those local edits
carry host-specific overrides (the W2 TLS work, or a port/secret tweak applied
out-of-band), the first webhook deploy after W1 will revert them with no warning
and no record — a data-loss-of-config hazard the spec's clean-checkout assumption
(`R-deploy-spec §3.2`) does not contemplate. (`ssl/` survives — `reset --hard`
spares untracked files — but the modified *tracked* files do not.) **W1 must
reconcile the host working tree before the first gated deploy, or the rollback's
`$PREV` baseline is itself built from a tree that won't reproduce.**

---

## §4 — Secret handling — the spec's placement claims are WRONG on the host (but the secret is still out of fourier's tree)

R-deploy-spec §2.2 + R2-cicd §2: the HMAC secret lives only in (a) GitHub's
webhook config and (b) the host hooks file `/etc/webhook/hooks.json`, **root-
owned `0600`**; never in the repo, compose, or `.env.example`.

**In-tree verdict — CLEAN (verified):**
- `.env.example` carries no webhook secret (read in full — only `MONGO_*`,
  `ADMIN_TOKEN=dev`, ports, VITE args).
- `git grep -lE 'hooks\.json|webhook\.service|adnanh|payload-hmac'` over the
  non-doc tree returns **nothing** — no webhook artefact is tracked. The
  secret-bearing config is genuinely host-only. **Invariant-19 "secret out of
  compose/tree" holds.** No W1 artefact in fourier's tree risks committing it,
  *provided* W1 keeps `deploy-hook.sh` (if it adopts the spec's tracked-script
  design) secret-free — which it can.

**Host placement verdict — the spec is FACTUALLY WRONG:**
- The hooks file is `/opt/deploy/hooks.json`, mode **`0664` (`-rw-rw-r--`),
  owned by `mbabb:mbabb`** — **world-readable and not root-owned.** The spec's
  "root-owned `0600`" (`R-deploy-spec §2.2`; `R2-cicd.md:179`) is contradicted.
  The HMAC secret sits in a world-readable file. Any local user on the host can
  read it and forge `X-Hub-Signature-256` for *any* repo the dispatcher serves.
- Alongside it, `/opt/deploy/.env` is also `0664 mbabb:mbabb` (80 bytes). The
  spec's secret-placement model assumed a hardened `0600` root file; the live
  reality is a loose-permission user file. **This is a real secret-hygiene
  finding W1 must fix** (chmod 0600 + chown root, or accept the documented
  weaker posture), and it is invisible from the repo — only the host probe found
  it.

So: secrets are out of *fourier's tree* (the invariant-19 letter), but the host
*storage* of the secret violates the spec's own hardening claim. The spec
asserted a posture it never verified against the host.

---

## §5 — `git push origin master` as sole trigger — the gap is real but bounded

R-deploy-spec §3/§7 + R2-cicd §3 make `git push origin master` the sole trigger;
the `ref == refs/heads/master` match (verified live in `hooks.json`) gates it.

- **Non-master refs**: correctly ignored — the live `value` match on
  `refs/heads/master` means a push to any other branch does not deploy. **Sound.**
- **Force-push to master**: GitHub still emits a `push` event with
  `ref=refs/heads/master`; the dispatcher will `git fetch && git reset --hard
  origin/master` to the force-pushed (possibly rewritten/regressed) SHA and
  deploy it. There is **no branch-protection / non-fast-forward guard** in the
  trigger rule. A force-push that rewrites master to an older or malicious tree
  deploys silently. The spec does not name this. **Real, low-likelihood gap.**
- **Deploy-from-non-master / tag**: not possible (the ref match blocks it),
  which R2 §3 notes as a future hook-filter tweak — fine.
- **Branch protection**: the design has no dependency on it and offers no
  defence-in-depth via it. Acceptable for a single-operator repo, but the spec
  should *say* "force-push to master deploys whatever master now points at" as a
  known property, not omit it.

**Verdict on the trigger**: sound for the normal case; one un-named edge
(force-push bypasses any review and deploys the rewritten tree). Bounded, not
fatal.

---

## §6 — The `:8091` retirement gate — UNACHIEVABLE AS WRITTEN (a clean spec defect)

R-deploy-spec §5 + §8.2: *"Wχ-P2 greps the replacement for `8091` (must be
zero)"*; §8 ledger: *"`git grep -n 8091` returns zero across the tree."*
`C.md §6` does not itself name `8091`, so this is a *spec-authored* gate, not a
tranche gate — but it is stated as a binding W1 proof.

**Measured: `git grep -n 8091` does NOT return zero across the tree, and CANNOT,
even after `deploy.sh` is deleted.** Breakdown:

| Location | Hits | Nature |
|---|---|---|
| `scripts/deploy.sh:38,39` | 2 | the real bug — **deleted by W1**, so moot |
| `uv.lock:842,1624` | 2 | `8091` as an incidental substring inside `sha256:` hashes / PyPI URLs |
| `web/src/assets/fourier-paths/{equation,gallery,moon,morph,paper,sun,visualize}.json` | 7 files | `8091` as an incidental digit substring inside floating-point **curve-path coordinates** (e.g. `…138.0175089116692…`) |
| `docs/**` | many | audit/spec prose discussing the bug |

After `git rm scripts/deploy.sh`, the **non-doc** tree still contains `8091` in
`uv.lock` and seven committed curve-path JSON assets — none of them a port, all
incidental substrings. `git grep -nw 8091` (word boundary) and `git grep -nE
'[:/]8091'` (port-anchored) both isolate **only** `scripts/deploy.sh:38,39`, so a
**correctly scoped** gate is achievable; the spec's **unqualified** `git grep -n
8091 → zero` is **provably impossible** and would fail at challenge if taken
literally. **Required correction**: the gate must be `git grep -nE '[:/]8091'
-- ':!docs/*'` (or scope to `scripts/ api/ web/src/**/*.ts web/src/**/*.vue
nginx/ '*.yml'`) → zero. As written, the gate is a self-inflicted false-negative.

(The replacement's *health gate* correctly references `8100` — verified live in
`dispatch.sh` line `curl -sf "http://localhost:8100/api/health"` and against
`docker-compose.prod.yml:72` + `nginx/fourier.conf:30` + `api/main.py:125`. The
*port* is right; only the *grep gate's phrasing* is broken.)

---

## §7 — Does it TRULY replace `deploy.sh`? — yes in topology, no in the deliverable ledger

The end-to-end coverage claim (`R-deploy-spec §7`, `R2-cicd.md:185-204`) is
**directionally true**: every `deploy.sh` step (push → SSH → fetch/reset →
build/up → health) is covered by push → webhook → on-host dispatch → gate, with
the dev's `git push` correctly preserved as the trigger. No SSH-by-human
survives. **The topology genuinely replaces `deploy.sh`.**

But the *deletion-and-deliverable* ledger (`R-deploy-spec §8`) has a structural
seam the spec did not catch:

- **`docs/precepts/infra/` is a git SUBMODULE** (`git submodule status` →
  `f27627e… docs/precepts (remotes/origin/HEAD)`). R-deploy-spec §8's ledger row
  says the host `webhook.service` + `hooks.json` are *"documented in
  `docs/precepts/infra/`."* But that path is a **separate repo**; a W1 commit
  "documenting the host artefacts in `docs/precepts/infra/`" lands in the
  **precepts submodule's** history, not fourier's — fourier records only a
  gitlink bump. The deploy-design documentation therefore does **not** live in
  fourier's commit chain where `FINAL.md` cites it. W1 must either document the
  host artefacts in a fourier-tracked path (e.g. `docs/tranches/C/`) or commit to
  the submodule *and* bump the pointer *and* cite both. The ledger as written
  implies a single-repo commit that the submodule boundary defeats.
- **`deploy.sh` deletion proof**: `scripts/deploy.sh` exists today (42 L,
  verified); `git rm` + `test ! -f` + `git log --diff-filter=D` is a clean,
  achievable deletion proof. **No problem here** — this is the one §8 clause that
  is fully provable from the repo alone.

---

## §8 — What W1 CAN prove from this repo vs. what is host-dependent residual

Per the mandate, the explicit split:

**W1 CAN prove from the repo alone (no host needed):**
- `scripts/deploy.sh` does not exist (`git rm`; `test ! -f`; deletion commit).
- A tracked `scripts/deploy-hook.sh` (if adopted) carries the spec's logic and
  no secret — reviewable, versioned, greppable.
- `git grep -nE '[:/]8091' -- ':!docs/*'` → zero (the **scoped** gate; the
  unqualified one is impossible, §6).
- The health gate references `8100` / `${HTTP_PORT:-8100}`, matching the live
  bind.
- No webhook secret in the tree (`.env.example`, compose, `git grep` all clean).

**Host-dependent (provable only WITH host access, which the agent HAS):**
- The recorded commit-to-deploy chain (`C.md §6`) — provable by pushing and
  capturing `/opt/deploy/logs/mkbabb-fourier-analysis-*.log`, **but the captured
  behaviour is the live `dispatch.sh`, not the spec's `deploy-hook.sh`** (§2.2).
- The intentional-bad-commit rollback (`C.md §3`) — runnable, **but proves a
  rollback that does not rebuild and does not re-gate** unless the host script is
  first brought to spec.

**Documented-but-host-config residual W1 must own (the spec omits all of these):**
- The receiver is a **shared multi-repo dispatcher** (`/opt/deploy/dispatch.sh`),
  contradicting the "not a shared CI service" invariant (§1.1). Either re-scope
  the spec to bless it, or carve fourier out — the latter risks the other 4
  repos.
- `hooks.json`/`.env` are `0664 mbabb:mbabb`, **not** root-`0600` (§4).
- **No flock** on the host (§3); concurrency is unserialised across all 5 repos.
- The host fourier tree is **dirty** (`M` on both compose files) and on a stale
  SHA `8818ae5`; `reset --hard` will discard the local compose edits (§3.1).
- Receiver binds `*:9000`, not loopback (§1.1) — exposure depends on the
  unverified outer-nginx/firewall posture (the spec's "open question" that is
  actually already-decided-on-the-host, unread).

---

## §9 — DISPOSITION

**PASS-WITH-CONDITIONS.** The R2 *direction* survives the attack: HMAC-SHA256
payload auth gated to `refs/heads/master` is the right invariant-19 model and is
**already live and working** on the host; the topology (dev pushes, server
reacts, no new container) is correct; the `deploy.sh` deletion proof and the
in-tree secret-cleanliness are fully achievable. The bad-commit and recorded-
chain gates are **runnable** (the agent has host access — the "unprovable from
this repo" fear is refuted).

But R2 + R-deploy-spec **fail the completeness-and-honesty bar** they set for
themselves. They are written greenfield against a host that **already runs a
contradicting design**, and the spec's concrete clauses — hooks path, file
ownership/mode, loopback bind, single-vs-shared topology, the flock concurrency
guarantee, the rebuild-and-re-gate rollback, and the unqualified `:8091` grep —
are each **falsified or unachievable** when measured against the live tree and
the live host. None of these is fatal to the *idea*; all of them are conditions
W1 must absorb, and several invert what the spec asserts.

**Required conditions before C.W1 close:**

1. **[REQUIRED] Reconcile spec ⇆ host topology (the sharpest flaw).** Decide and
   record: does fourier adopt the live **shared multi-repo `/opt/deploy/dispatch.sh`**
   (amending `R-deploy-spec §9`'s "not a shared CI service" / inv-16 clause to
   bless it), or carve out a fourier-only `scripts/deploy-hook.sh` (and accept
   that re-pointing `hooks.json`'s fourier arm must not break the other 4 repos)?
   The spec cannot land as written; one of these must be chosen on the record.
2. **[REQUIRED] Fix the rollback to rebuild + re-gate (§2.2).** The live
   `dispatch.sh` rollback does `up -d` only, with no `build` and **no re-poll**;
   the `build … || build …` fallback defeats `set -e` and lets a failed build
   fall through to `up -d`. Both contradict `R-deploy-spec §6`. Pin the
   last-known-**green** SHA, not bare `rev-parse HEAD` (§2.1).
3. **[REQUIRED] Add flock (§3).** `dispatch.sh` has none; the spec's
   replay/two-rapid-push contract is unmet, and the shared dispatcher makes
   cross-repo concurrent builds a 15 GiB-host resource hazard.
4. **[REQUIRED] Harden secret storage (§4).** `hooks.json` + `.env` are `0664
   mbabb:mbabb` (world-readable); chmod `0600` / chown root, or document the
   accepted weaker posture. The spec's "root-owned `0600`" claim is false on the
   host.
5. **[REQUIRED] Reconcile the dirty host tree before first gated deploy (§3.1).**
   `M docker-compose.{yml,prod.yml}` will be silently discarded by `reset
   --hard`; resolve or the `$PREV` baseline is unreproducible.
6. **[REQUIRED] Fix the `:8091` gate phrasing (§6).** Replace the impossible
   unqualified `git grep -n 8091 → zero` with `git grep -nE '[:/]8091' --
   ':!docs/*'` → zero (incidental substrings in `uv.lock` + curve-path JSON make
   the literal gate unachievable).
7. **[REQUIRED-NOTE] The `docs/precepts/infra` documentation target is a
   submodule (§7)** — host-artefact docs committed there do not enter fourier's
   chain; pick a fourier-tracked path or cite both repos.
8. **[NOTE] Force-push to master deploys the rewritten tree (§5)** — name it as a
   known property; bounded, single-operator.

No data is destroyed by the design; the receiver does not read a repo file it
resets (§3, cleared). The defects are: a spec that never met its host, a rollback
that does not actually rebuild-and-verify, an un-implemented concurrency guard, a
world-readable secret, and a grep gate that can never go green as phrased.
**Disposition: PASS-WITH-CONDITIONS — the eight conditions above are binding on
C.W1.**
