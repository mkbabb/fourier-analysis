# Playwright e2e — cross-env matrix (D.W6)

The same `web/e2e/*.spec.ts` suite runs against three environments via the
`BASE_URL` environment variable. The matrix is intentionally three-celled so
test integrity is observable wherever the code is served (local dev, prod host
loopback via SSH tunnel, or the public URL once W9 lands).

## Environments

| Env       | URL                              | Backend behind it          | Allowed specs            |
|-----------|----------------------------------|----------------------------|--------------------------|
| **local** | `http://localhost:3000`          | Vite dev → `/api` → :8000  | full suite (mutating OK) |
| **host**  | `http://localhost:8100`          | SSH tunnel → prod host :8100 | non-mutating subset only |
| **prod**  | `https://fourier.babb.dev`       | (currently GH Pages 404 — W9 residual) | non-mutating subset only |

## Mutating-spec guard

Specs that POST / PATCH / DELETE against a real backend (`visualization-crud.spec.ts`
in particular) are tagged with `@mutating` in their `test.describe` titles.
`playwright.config.ts` sets `grepInvert: /@mutating/` when `PLAYWRIGHT_PROD=1`,
so the host and prod cells of the matrix collect only non-mutating tests.

## Running the matrix

### Local — full suite

Requires the Vite dev server (`scripts/dev.sh` or `npm --prefix web run dev`)
plus a backend on the proxied port. For the `COMPUTE_RATE_LIMIT` harness, use
`scripts/e2e.sh` which raises the limit to 1000 before launching the stack:

```bash
./scripts/e2e.sh            # boots backend (COMPUTE_RATE_LIMIT=1000) + vite + runs playwright
# or, against an already-running stack:
cd web && BASE_URL=http://localhost:3000 npx playwright test --project=chromium
```

### Host — non-mutating subset (via SSH tunnel)

Open a tunnel to the prod host's loopback :8100 in a separate shell:

```bash
ssh -L 8100:localhost:8100 -p 1022 mbabb@mbabb.fridayinstitute.net -N &
# … run the suite …
cd web && BASE_URL=http://localhost:8100 PLAYWRIGHT_PROD=1 \
    npx playwright test --project=chromium --reporter=list
# tear the tunnel down when done:
kill %1
```

`PLAYWRIGHT_PROD=1` invokes the `grepInvert: /@mutating/` guard so the
destructive specs are skipped at collection. The host backend is the
authoritative prod stack on loopback — the SSH tunnel is read-only by
contract.

### Prod — non-mutating subset (public URL)

```bash
cd web && BASE_URL=https://fourier.babb.dev PLAYWRIGHT_PROD=1 \
    npx playwright test --project=chromium --reporter=list
```

Currently RED-with-cause: `fourier.babb.dev` Cloudflare-fronts GitHub Pages
which returns 404 (the public URL is not connected to the host that serves the
real deploy). Documented as a W9 / W10 residual; see
`docs/tranches/D/coordination/WEBHOOK-URL-RESIDUAL.md`.

## The `COMPUTE_RATE_LIMIT` harness

`api/config.py` declares `compute_rate_limit: int = 5` — a conservative prod
default that, without an override, makes the contour-extraction suite 429-cascade
once it issues more than 5 compute calls inside a 60s window.

The backend reads `COMPUTE_RATE_LIMIT` from the environment (pydantic-settings
maps it to `compute_rate_limit` automatically since `env_prefix=""`). The e2e
launcher (`scripts/e2e.sh`, the CI workflow, and any manual invocation) sets
`COMPUTE_RATE_LIMIT=1000` before starting uvicorn. **The production `api/config.py:23`
default is byte-identical pre/post-W6 — the override is env-only.**

## Cross-env matrix outcomes (post-W6 first run)

See `docs/tranches/D/audit/W6-test-integrity.md` for the current run's cell
states. RED cells are named-with-cause (no silent reds).
