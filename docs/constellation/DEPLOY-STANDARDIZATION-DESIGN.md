# Constellation deploy standardization — design substrate

**Status**: DESIGN (scoping substrate; NOT an implementation phase). **Authored**: 2026-05-28 from the user directive "normalize the CI and webhook process, ensure security thereof; create a repo for these deploy processes if need be, or at the very least standardize them — with docker, CF Pages, mbabb hosting, across the constellation (value.js, words, fourier, sudoku, etc.)". **Evidence**: `docs/audits/runs/2026-05-28-constellation-survey/SURVEY-FINDINGS.md` (4-lane read-only survey). **Inherits**: D-era `docs/tranches/D/coordination/CONSTELLATION-DEPLOY.md` (topology + naming + Mongo-exposure close + TLS path) + `docs/precepts/infra/deploy.md` (the webhook chain precept).

## §0 — Thesis

The constellation's **topology** is normalized (D-era): `<app>.babb.dev` + `api.<app>.babb.dev`; per-app docker isolation; single Apache TLS terminator; Mongos internal-only. What is NOT normalized is the **process**: 3 frontend-hosting patterns, 3 deploy-trigger patterns, 3 CI maturity levels, a docker-hardening gradient, divergent secret handling (with 2 live exposures), and — the root cause — **the deploy spine (`/opt/deploy/dispatch.sh` + `hooks.json` + the webhook systemd unit) is version-controlled in NO repo**. It exists only as host state, mutated by hand.

This design proposes (a) a **dedicated versioned home** for the deploy spine; (b) **standard patterns** each repo conforms to; (c) a **security hardening** pass (front-loaded on the 2 HIGH exposures + the shared HMAC secret).

## §1 — The repo decision (the user's explicit fork)

> "create a repo for these deploy processes if need be, or at the very least standardize them in some way."

**Recommendation: create a dedicated `babb-deploy` (or `constellation-infra`) repo.** Rationale:

- The deploy spine is currently **un-versioned host state** — `dispatch.sh`, `hooks.json` (the HMAC secret aside), the `adnanh/webhook` systemd unit, the per-port allocation map, the deploy-dir layout. There is no rollback, no review, no history, no single source of truth. That is the actual root problem; a docs-only "standardize in place" leaves the spine un-versioned.
- A dedicated repo is the **idiomatic gestalt** answer: it holds the spine as code + the templates each app consumes + the CF DNS-as-code (promoted from fourier-only `dns-cf-sync.sh`) + the security runbooks. It deploys *itself* via the same webhook chain (eats its own dog food).
- It does NOT violate inv-16 (cross-repo source boundary): the deploy repo holds *templates + the host spine*, not edits to the app repos. Each app repo copies the standard `deploy-hook.sh` + `docker-compose` hardening baseline + `.github/workflows/ci.yml` template into its own tree (a one-time adoption, maintainer-owned).

**What `babb-deploy` holds:**
```
babb-deploy/
├── host/
│   ├── webhook.service                 # the adnanh/webhook systemd unit (versioned)
│   ├── hooks.json.template             # per-repo entries; secret via ${HMAC_<REPO>} env interpolation
│   ├── dispatch.sh                      # OR retired entirely — see §3 (per-repo webhook URLs)
│   └── deploy-dir-layout.md            # the canonical /srv/constellation/<app> map
├── templates/
│   ├── deploy-hook.sh                   # the standard hardened hook (flock + health-gate + rollback + auto-migrate)
│   ├── docker-compose.hardening.yml     # the read_only + cap_drop + no-new-privileges + limits baseline
│   ├── ci.yml                           # the standard GitHub Actions CI (lint→typecheck→build→test)
│   └── env.example                      # the .env discipline template (:? mandatory-prod)
├── cf/
│   ├── dns-cf-sync.sh                   # promoted from fourier; constellation-wide DNS-as-code
│   └── pages-deploy.sh                  # the standard CF Pages wrangler recipe (from speedtest)
├── security/
│   ├── hmac-rotation.md                 # the per-repo-secret + rotation runbook
│   └── secret-remediation.md            # the S1/S2 committed-secret purge runbook
└── README.md                            # the constellation deploy contract
```

(Fallback if the user prefers no new repo: standardize in-place — the templates live under `fourier-analysis/docs/constellation/templates/`, each app copies them, and the host spine is captured in `CONSTELLATION-DEPLOY.md`. This is strictly weaker — the spine stays un-versioned-as-code — but avoids a new repo.)

## §2 — The standard patterns (what every app conforms to)

### §2.1 — Frontend hosting: TWO sanctioned patterns

1. **CF Pages** (static SPA / lib demo): the speedtest `wrangler pages deploy` recipe. Apps: value.js, keyframes.js, speedtest, and the *frontend halves* of fourier + csp-solver (the D-era declared target — the split frontends were never fully cut over to CF Pages; they remain self-hosted docker-nginx behind CF proxy).
2. **Self-hosted docker-nginx behind CF proxy** (when the frontend is tightly coupled to a same-origin backend — e.g. words/floridify's SSE streaming): the fourier/floridify pattern.

**Normalization target**: resolve the drift — value.js + keyframes currently use *GitHub Pages → CF CNAME* (peaceiris), NOT CF Pages. Pick one of {CF Pages, GH Pages} per the D-era intent (CF Pages) and converge. (This is the single biggest "is the documented topology the live topology?" gap the survey surfaced.)

### §2.2 — Backend deploy: ONE pattern (the fourier hardened hook)

Every backend deploys via **webhook → per-repo `scripts/deploy-hook.sh`** with the fourier reference shape:
- `flock` serialization
- record rollback SHA → `git reset --hard origin/master` → `docker compose build && up -d`
- **real health-gate** (`curl /api/health` expecting `{"status":"ok"}` + SPA root; retry; non-zero on timeout)
- **rollback-on-rollback** (rebuild + re-gate the prior SHA on failure)
- **auto-migration** post-gate (the fourier W9 Variant-C runner, generalized)

Retire the manual `deploy.sh` operator step for words + csp-solver + value.js-api. (palette-api also migrates off rsync → git-pull — survey-4 §4.)

### §2.3 — CI: ONE template

Every repo gets `.github/workflows/ci.yml`: lint → typecheck → build → test, on push/PR to master. Backends add a live-service test job (the fourier api-tests pattern). Libraries add a release job (the keyframes/value.js npm-publish pattern). words + speedtest (currently NO CI) adopt it; csp-solver's `deploy.yml.disabled` is replaced by the standard CI + the webhook deploy.

### §2.4 — Docker hardening: ONE baseline

The value.js/api strictest posture becomes the floor: `read_only: true` + `tmpfs /tmp` + `cap_drop: ALL` + `security_opt: no-new-privileges` + resource limits + json-file log rotation + a backup service for stateful apps. fourier + words + speedtest + csp-solver level up to it.

### §2.5 — Secrets: ONE discipline

- NO secret in any tracked file. `.env.example` template only (the `:?` mandatory-prod pattern). `.env` gitignored everywhere.
- Build/publish secrets in GitHub Actions secrets (the `NPM_TOKEN` / `GITHUB_TOKEN` pattern).
- Host runtime secrets in host-only `.env` (mode 0600).
- The CF API token: one place (host + GH Actions secret for CF Pages deploys), never committed.

### §2.6 — Deploy-dir layout: ONE map

Canonicalize to `/srv/constellation/<app>/` (or keep `/var/www/<app>` — pick one). Retire the `~/Programming/palette-api` rsync outlier → git-pull under the canonical root.

## §3 — Security hardening (front-loaded)

**Immediate (operator + per-repo-maintainer; do NOT wait for the tranche):**
- **S1** — rotate the floridify Clerk `pk_live_*` keys; purge `.env.production` from the words repo + history; move to GH secrets.
- **S2** — rotate the speedtest `cfat_*` CF token; purge `.env` from the speedtest repo + history; move to GH secrets / host-only.

**Tranche W-early:**
- **S4 + S5** — replace the shared HMAC webhook secret with **per-repo secrets** (the F.γ T-S3 per-repo-URL retire is the natural carrier: each `deploy.babb.dev/hooks/<repo>` URL gets its own HMAC); add a rotation runbook (dual-key blue-green swap).
- **S6** — add dependabot + signed tags + (optional) SBOM to the standard CI template.

The F.γ host-flip (per-repo webhook URLs, retiring the multiplex dispatcher) is the FIRST concrete step of this standardization — it is already scoped + gh-validated in fourier-F. The per-repo-secret split rides it.

## §4 — Tranche scoping

This is **constellation-scope** — larger than fourier-F (single-repo). Two honest framings:

1. **A new constellation-level tranche** (e.g. `babb-deploy` tranche-A, or a cross-repo "G-constellation" effort) — research-first (this design is its W0 substrate), with waves: W1 create repo + capture spine as code; W2 per-repo-secret + HMAC rotation (rides F.γ); W3 CI template adoption (words + speedtest + csp-solver); W4 docker-hardening level-up; W5 frontend-hosting drift resolution (CF Pages convergence); W6 deploy-dir + rsync→git normalization; Wclose.
2. **Fold into fourier-F + named cross-repo asks** — F.γ already does the webhook per-repo retire; the rest become per-repo-maintainer asks coordinated from this design doc. Weaker (leaves the spine un-versioned) but no new tranche.

**Recommendation**: framing 1 (new tranche + dedicated repo) — it is the only path that versions the spine and gives the standardization a close-gate. The F.γ work is its first wave (already in flight).

## §5 — What this design is NOT

- NOT an implementation (no host mutation, no repo creation, no secret rotation executed here — all require sign-off).
- NOT a violation of inv-16: the `babb-deploy` repo holds templates + the host spine, not edits to app repos; each app's adoption is maintainer-owned.
- NOT a re-litigation of the D-era topology (naming, TLS, Mongo-exposure) — that holds; this is the *process* layer above it.

## §6 — The decisions the user must weigh (→ AskUserQuestion)

1. **Deploy-process home**: dedicated `babb-deploy` repo [recommended] vs standardize-in-place under fourier-docs vs fold-into-CONSTELLATION-DEPLOY-precept.
2. **The 2 HIGH committed-secret exposures (S1, S2)**: rotate-now (I draft the remediation runbook; operator + maintainers execute) vs fold-into-tranche-W0.
3. **Tranche identity** (implied): new constellation-level tranche vs fold-into-fourier-F + cross-repo asks.
