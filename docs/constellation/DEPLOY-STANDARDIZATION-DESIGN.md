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
│   └── hmac-rotation.md                 # the per-repo webhook-secret split + rotation runbook (S4/S5)
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

**S1 + S2 — WITHDRAWN (maintainer determination 2026-05-28): nothing needs rotating.** The survey flagged committed `pk_*` (floridify) + `cfat_*` (speedtest); the maintainer confirms neither is a live exposure — Clerk `pk_*` is a publishable key (public by design); the speedtest `cfat_*` is not a sensitive/active credential. No rotation, no history-purge, no F scope. Recorded as resolved.

**Tranche W-early:**
- **S4 + S5** — replace the shared HMAC webhook secret with **per-repo secrets** (the F.γ T-S3 per-repo-URL retire is the natural carrier: each `deploy.babb.dev/hooks/<repo>` URL gets its own HMAC); add a rotation runbook (dual-key blue-green swap).
- **S6** — add dependabot + signed tags + (optional) SBOM to the standard CI template.

The F.γ host-flip (per-repo webhook URLs, retiring the multiplex dispatcher) is the FIRST concrete step of this standardization — it is already scoped + gh-validated in fourier-F. The per-repo-secret split rides it.

## §4 — Tranche scoping — RESOLVED: fold into fourier-F as thread ζ

Per the user decision (2026-05-28): **fold into fourier-F**, with granular waves added as needed. F adds a sixth thread:

**F-ζ — constellation deploy standardization.** It authors `mkbabb/deploy` (the spine + templates) and coordinates maintainer-owned adoption for the other app repos. inv-16 preserved: fourier-F commits touch only `fourier-analysis/**` + `deploy/**` (the new repo fourier-F owns) — never `value.js/**`, `words/**`, `speedtest/**`, `csp-solver/**`, `keyframes.js/**` (those adopt the templates via maintainer-owned PRs, coordinated from this doc as cross-repo asks).

ζ's granular waves (folded into F's schedule after γ — which carries the per-repo-webhook retire that ζ.2 builds on):
- **ζ.1 — `deploy` repo spine-capture**: version the host `/opt/deploy/{dispatch.sh→retired, hooks.json.template, webhook.service}` + the deploy-dir-layout map into `mkbabb/deploy`.
- **ζ.2 — per-repo HMAC secret split** (rides F.γ's per-repo-URL retire): each `deploy.babb.dev/hooks/<repo>` gets its own HMAC; closes S4; adds the rotation runbook.
- **ζ.3 — standard templates**: author `deploy/templates/{deploy-hook.sh, docker-compose.hardening.yml, ci.yml, env.example}` from the fourier + value.js + speedtest reference shapes.
- **ζ.4 — CF DNS-as-code promotion**: `dns-cf-sync.sh` (fourier-only) → `deploy/cf/` (constellation-wide); + the standard CF Pages wrangler recipe.
- **ζ.5 — cross-repo adoption asks**: the per-repo-maintainer asks (CI template for words + speedtest + csp-solver; docker-hardening level-up; frontend-hosting drift resolution; palette-api rsync→git). Coordinated from this doc; NOT fourier-F commits.

Granularity expands as needed (the user's "more waves with better granularity"). The F.γ work (per-repo-webhook retire) is ζ's prerequisite, already scoped + gh-validated.

## §5 — What this design is NOT

- NOT a host mutation / secret rotation (S1/S2 are WITHDRAWN — nothing needs rotating; the host spine-capture is F-ζ execution, gated on F authorization).
- NOT a violation of inv-16: `mkbabb/deploy` holds templates + the host spine (fourier-F owns it); each *app* repo's adoption is maintainer-owned.
- NOT a re-litigation of the D-era topology (naming, TLS, Mongo-exposure) — that holds; this is the *process* layer above it.

## §6 — Decisions (RESOLVED 2026-05-28)

1. **Deploy-process home** → **dedicated PRIVATE repo `mkbabb/deploy`** (created 2026-05-28, charter seeded at `e3b16d8`; the §1 target structure is its README contract). Spine-capture + template authoring at F-ζ execution.
2. **S1 + S2** → **WITHDRAWN; nothing needs rotating** (maintainer determination 2026-05-28). Not live exposures (Clerk `pk_*` publishable by design; speedtest `cfat_*` non-sensitive). Recorded resolved in `SURVEY-FINDINGS.md §3` + §3 here; no action.
3. **Tranche identity** → **folded into fourier-F as thread ζ** with granular waves (§4).
