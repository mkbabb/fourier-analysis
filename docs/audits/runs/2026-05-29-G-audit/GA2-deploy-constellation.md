# GA2 — Constellation deploy standardization audit (tranche G informing)

**Lane**: GA2 of the 6-lane 2026-05-29 G-audit. **Scope**: thread ζ + γ — the
`mkbabb/deploy` repo, the retained `dispatch.sh`, webhook security posture, host
hygiene, the 7 adoption asks, and deploy-dir divergence.
**Mode**: READ-ONLY (incl. read-only SSH `mbabb@34.197.214.67 -p 1022`; cat/ls/grep only).
**Evidence basis**: `deploy` HEAD `7c4e96b`; fourier HEAD `7c4e96b` (clean); live host
state captured 2026-05-29; GitHub webhook config via `gh api`.

**Attestation**: ZERO mutations performed (both repos `git status` clean; host
read-only). ZERO real secrets surfaced into this doc — the live host carries real
64-hex HMAC values + an env-referenced Mongo URI; all are referred to by name/shape
only, never reproduced.

---

## Findings

### 1. [SECURITY][GAP] The live `hooks.json` inlines literal secrets — the documented `${HMAC_<REPO>}` env-interpolation model is FICTION

The single most material finding. Every spine artifact — `host/hooks.json.template`
(header lines 14-19), `host/webhook.service` (lines 14-16), `host/deploy-dir-layout.md`
(line 15), `security/hmac-rotation.md` (§"Where secrets live"), and the design doc —
asserts that the live `/opt/deploy/hooks.json` carries `${HMAC_<REPO>}` placeholders
interpolated from `/opt/deploy/.env` via the systemd unit's `EnvironmentFile=`.

**The live host contradicts this:**
- `grep -c "HMAC_" /opt/deploy/hooks.json` → **0**. The live file inlines five
  distinct **literal** 64-hex secrets directly (one per repo entry). There is no
  interpolation; `adnanh/webhook` does not expand env vars inside `hooks.json`, so
  this could never have worked as documented.
- `/opt/deploy/.env` is **80 bytes** and contains exactly **one** var: `WEBHOOK_SECRET`
  (a single value — the pre-migration shared secret). It does NOT contain the five
  `HMAC_FOURIER_ANALYSIS` / `HMAC_WORDS` / … vars the runbook and template name. Five
  64-hex values alone would exceed 320 bytes, so they demonstrably are not in `.env`.
- The systemd `EnvironmentFile=/opt/deploy/.env` directive is real and loads, but it
  loads only the now-vestigial `WEBHOOK_SECRET`; it feeds nothing in the live ruleset.

**Why this matters for G:** the per-repo-secret SECURITY OUTCOME is genuinely achieved
(see Finding 3 — five distinct secrets, correct per-repo routing, GitHub side matched).
The defect is that the **versioned representation lies about the host mechanism**. The
hmac-rotation.md runbook (§2-§5) instructs the operator to "put both values in
`/opt/deploy/.env` … and reference them from hooks.json" — a procedure that, run as
written, would NOT work, because the live hooks.json references literals, not env
placeholders. A rotation performed by following the runbook would silently fail to
take effect (the receiver keeps reading the inlined literal), or the operator would
have to deviate from the runbook to edit the literal in place.
**Gestalt recommendation (G-scope):** pick ONE model and make doc == host.
Either (a) genuinely move the five secrets into `/opt/deploy/.env` as `HMAC_<REPO>`
and confirm `adnanh/webhook` env-expansion actually works (it does NOT natively — would
need an envsubst render step in the unit's `ExecStartPre`), or (b) accept inline
literals as the real model and rewrite the template header + runbook + layout doc +
service comments to describe in-place literal edits with the `-hotreload` semantics.
(b) is the lower-friction idiomatic answer given `adnanh/webhook`'s actual capabilities;
the template would then ship redacted literals (which it correctly already does) and
the runbook would edit the literal under the OR-collapse procedure. **TRANSPOSITION-CANDIDATE**:
this doc-vs-host reconciliation is the headline ζ-residual for G.

### 2. [SOUND] `deploy-hook.sh` template is a faithful, well-parameterized generalization of fourier's

Diffing `deploy/templates/deploy-hook.sh` against `fourier-analysis/scripts/deploy-hook.sh`:
the five hardening properties (flock serialisation, dirty-tree-fail-loud, real
health-gate with no `|| echo` swallow, rollback-on-rollback, optional auto-migration)
are preserved verbatim in structure. The generalization is genuine, not fourier-shaped:
- Hardcoded fourier values become parameterized: `REPO_DIR` defaults to
  `/srv/constellation/${APP}` (the canonical-root target, not `/var/www/fourier-analysis`);
  `HEALTH_PATH` is a var (default `/api/health`); `ROOT_EXPECT` is a var (fourier's
  hardcoded `404` inv-22 contract becomes a per-app setting with the rationale documented).
- The migration block is correctly made optional via `MIGRATE_SERVICE` empty-guard —
  fourier's W8 `backend`-service fix is captured as the default `MIGRATE_CMD` but
  apps with no migrations no-op cleanly.
- The `HEALTH_PORT="${HTTP_PORT:-...}"` no-drift discipline (gate reads the same var
  the compose bind uses) is preserved and documented as "the structural fix for
  wrong-port bugs."
- The adoption header (4-step, maintainer-owned) and inv-22 note are clear and correct.

This is the maturest artifact in the repo. No gaps.

### 3. [SOUND] Webhook security posture — per-repo secrets, routing, and GitHub config all verified correct

Live host `/opt/deploy/hooks.json` (mode `0600 mbabb:mbabb`, confirmed):
- **5 distinct** 64-hex secrets, one per repo entry (verified distinct by inspection;
  values NOT reproduced here).
- **Routing correct**: `fourier-analysis` → `/var/www/fourier-analysis/scripts/deploy-hook.sh`
  (DIRECT, hardened hook); `words` / `speedtest` / `value.js` / `csp-solver` →
  `/opt/deploy/scripts/dispatch.sh` (multiplex), exactly as the template + layout doc claim.
- Each trigger-rule is the `and` of HMAC-SHA256 over body + `ref == refs/heads/master`.

GitHub side (`gh api repos/mkbabb/<repo>/hooks`), all five repos:
- per-repo URL `https://deploy.babb.dev/hooks/<repo>` ✓
- `content_type: json` ✓ (matches HMAC-over-body verification — form-encoding would break the signature)
- `secret_set: true` ✓ · `active: true` ✓ · `events: [push]` ✓

**No IP-allowlist** — accepted because the surface is HMAC-gated AND ref-gated, and
`deploy.babb.dev` must be CF-proxy-bypassed (DNS-only A record) so GitHub can reach the
origin. This is **sound**: GitHub does not publish stable webhook source IPs suitable
for a tight allowlist, and HMAC-SHA256 over the body is the canonical authentication.
The `-verbose` journal logging gives per-delivery HMAC verdicts for audit. Posture is
secure; the only defect is the documentation drift in Finding 1, not the live control.

### 4. [WORKAROUND→documented-correct] The retained `dispatch.sh` is a correct transitional state, but the end-state is under-specified

`dispatch.sh` is retained because the 4 non-fourier repos have not adopted the hardened
per-repo hook (Asks 2/3). This is correctly documented as transitional in three places
(the script header, layout doc line 16, ADOPTION-ASKS §1). The deletion is correctly
GATED on all four migrating. This is a documented-deviation-that's-actually-correct, NOT
a workaround masking incomplete standardization — **for now**.

Two sub-findings temper the "SOUND":
- **4a [WORKAROUND]** The fourier arm (lines 57-66) is dead code: it is bypassed under
  the per-repo-URL model (fourier routes direct), retained "only as a manual fallback."
  A retained-but-dead fallback arm is exactly the kind of legacy the mandate (NO
  fallbacks — see `feedback_no_fallbacks.md`) disfavors. Once fourier is proven on the
  direct arm (it is, live), the fourier `case` should be DELETED from `dispatch.sh`, not
  kept "for parity." G-scope: drop the dead fourier arm.
- **4b [GAP]** The gestalt end-state ("all repos on `deploy-hook.sh`, dispatcher deleted")
  is named but the deletion is not itself a tracked, owned ask — it is folded into Ask 2's
  prose ("once all four migrate"). G should book "delete `dispatch.sh` + remove
  `host/dispatch.sh` from the deploy repo" as its own terminal ask with the four
  migrations as explicit dependencies.

### 5. [SOUND→confirmed-broken] The value.js dispatcher arm IS latent-broken — confirmed read-only

`dispatch.sh` line 91 routes `value.js` to `deploy "$HOME/Programming/palette-api" …`,
whose first real act is `git fetch origin && git reset --hard origin/master`. Live host:
- `~/Programming/palette-api/.git` → **No such file or directory**
- `git -C ~/Programming/palette-api rev-parse HEAD` → **fatal: not a git repository**

So the instant a `value.js` push fires the dispatcher, the `git fetch` aborts under
`set -euo pipefail` and the deploy fails. This confirms Ask 3's "latent-broken" claim
and the N1 diagnosis. It is genuinely broken, not theoretical. The two-step fix
(rsync-dir → git checkout under canonical root, THEN adopt the hook) in Ask 3 is the
correct real repair. Correctly prioritized P1.

### 6. [GAP] The deploy repo does NOT eat its own dog food — no self-CI, no self-deploy

The design doc (§1) explicitly promises the deploy repo "deploys *itself* via the same
webhook chain (eats its own dog food)." The repo as built does NOT:
- No `.github/workflows/ci.yml` of its own (it ships the CI *template* but does not run
  it — there is nothing to lint/shellcheck the spine scripts it vends).
- No `scripts/deploy-hook.sh` for itself, no `hooks.json` entry, and it is NOT in the
  five-repo GitHub webhook set. (It arguably should not auto-deploy to a *running
  service* — it has none — but it has no CI gate at all.)
- No `.gitignore` (minor; the repo holds no buildable artifacts, but a `.env`-guard
  `.gitignore` is the discipline the repo itself preaches in `env.example`).

For a repo whose entire reason-to-exist is "the spine must be reviewed + versioned, not
hand-edited," shipping with zero CI to shellcheck its own templates is a real gap. The
templates it vends are bash that other repos copy verbatim; a `shellcheck` job over
`templates/*.sh` + `cf/*.sh` + `host/dispatch.sh` is the obvious self-application.
**G-scope ask: add a shellcheck/lint CI to `mkbabb/deploy` itself.**

### 7. [SECURITY-downgrade][GAP] Host hygiene — the F-flagged "W1-pre Mongo plaintext password" is INACCURATE; it carries no literal secret

F flagged `/var/www/fourier-analysis/docker-compose.prod.yml.W1-pre` as a root-owned
backup "containing an OLD plaintext Mongo password." Read-only inspection corrects this:
- The file is `root:root` mode **0644 (world-readable)**, 2184 bytes, dated 2026-05-27.
- Its `MONGO_URI` line uses an **env-reference (`${…}`), NOT a literal credential**
  (classified on-host without printing the value). There is no
  `MONGO_INITDB_ROOT_PASSWORD` literal line either.
- So the artifact is a **stale-backup hygiene** item (a root-owned, world-readable,
  out-of-tree compose backup that should be removed), but it is **NOT a secret-exposure**.
  The premise's "plaintext Mongo password" is not borne out.

Other host artifacts:
- `/opt/deploy/hooks.json.f-w3b.bak.20260529-192303` — mode **0600**, the OLD
  **single-secret** ruleset (1 id, 1 hmac match confirmed) from before the per-repo
  migration. It DOES contain a now-superseded real secret, but is correctly locked to
  0600. Recommend deletion as part of closing the migration (a retained pre-migration
  secret backup is a small residual blast-radius).
- `/opt/deploy/scripts/dispatch.sh.bak-d-w1` — mode **0775 (world-readable)** but
  contains **zero** secrets (verified `grep -cE '[0-9a-f]{32,}'` → 0). Pure stale-backup
  hygiene; harmless but should go.

**Gestalt:** G should book a one-shot host-hygiene sweep: remove `*.W1-pre`,
`hooks.json.*.bak.*` (after confirming the live ruleset is golden), `dispatch.sh.bak-*`.
None require credential rotation (consistent with the maintainer's standing "nothing
needs rotating" determination — and now demonstrably so, since W1-pre holds no literal).
The one genuinely-secret-bearing backup (`hooks.json.f-w3b.bak`) is already 0600.

### 8. [SOUND] The 7 adoption asks are complete, correctly prioritized, and the dependency chain is right — with one addition

ADOPTION-ASKS.md is thorough. Priorities are defensible: Ask 3 (value.js, the one
confirmed-broken arm + gating 4th migration) = P1; Asks 6/7 (real prod regressions /
data-adjacent hardening) = P2; Asks 4/5 (defense-in-depth, drift) = P3. The
dispatcher-deletion gate (Ask 2: "all four migrate") is correctly modeled. inv-16
boundary attestation is explicit and correct (fourier-F wrote only `fourier-analysis/**`
+ `deploy/**`). Missing items:
- **The dispatcher-deletion terminal step** is not its own ask (Finding 4b).
- **The deploy repo's own CI** (Finding 6) is not an ask — it should be, since it is the
  one item fully inside fourier-F's own write surface (`deploy/**`), i.e. actionable
  without any cross-repo maintainer.

### 9. [TRANSPOSITION-CANDIDATE] Deploy-dir divergence — canonicalization to one root is warranted for G

`host/deploy-dir-layout.md` honestly documents the divergence: `/var/www/*` (fourier,
csp-solver) vs `~/floridify` + `~/speedtest` vs `~/Programming/palette-api` (rsync).
The design doc §2.6 names the target (`/srv/constellation/<app>` OR keep `/var/www/<app>`
— "pick one"). The deploy-hook template ALREADY defaults `REPO_DIR` to
`/srv/constellation/${APP}`, so the template has effectively voted for `/srv/constellation`
— but no live repo uses that root yet, so the template default matches NOTHING on the
host today. This is a latent drift: the canonical default is aspirational. G should
either (a) commit to `/srv/constellation/<app>` and fold the dir migration into the
per-repo Ask-2/Ask-3 work (value.js's git-checkout conversion is the natural first
mover), or (b) change the template default to the de-facto `/var/www/<app>` and retire
the `~/*` outliers there. Picking one root is warranted; the half-state (template says
`/srv`, host says three things) is the drift to close.

### 10. [SOUND] Template redaction is correct — no real secrets in the deploy repo

`grep -rnE '[0-9a-f]{64}'` and broader secret patterns across the entire `deploy` tree
(excl. `.git`) → **NONE**. `host/hooks.json.template` correctly carries `${HMAC_<REPO>}`
placeholders only. `env.example` carries only `<APP>-dev-only` sentinels. The `cf/`
recipes read `CLOUDFLARE_API_TOKEN` from env with `:?` guards and route it via stdin
(out of argv/`ps`/`set -x`). The redaction discipline the repo preaches, it practices —
the one irony being Finding 1 (the redacted placeholder model doesn't match the live
host's literal-inline reality, but the redaction itself is correct).

---

## Gestalt summary

The deploy standardization is **substantively sound at the control layer** — per-repo
HMAC secrets are real and distinct, routing is correct, GitHub config is right, the
`deploy-hook.sh` template is a faithful generalization, and the redaction discipline is
clean. The headline defect is **representational, not operational**: the versioned
spine documents a `${HMAC_<REPO>}`-via-`EnvironmentFile` interpolation model that the
live host does not implement (it inlines literals; `.env` holds only a vestigial single
`WEBHOOK_SECRET`). This makes the rotation runbook non-executable as written. The other
gaps are completion items, not regressions: the dead fourier arm in `dispatch.sh`, the
un-booked dispatcher-deletion terminal step, the deploy repo not eating its own dog food
(no self-CI/shellcheck), and the aspirational-vs-actual deploy-root divergence. The
value.js arm is confirmed genuinely latent-broken (non-git dir). The F-flagged W1-pre
"plaintext Mongo password" is corrected: it holds an env-ref, not a literal — a
stale-backup hygiene item, not a secret exposure.
