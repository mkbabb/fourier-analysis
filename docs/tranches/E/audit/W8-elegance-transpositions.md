# E.W8 — γ.2 Elegance transpositions (T-E2 + T-S3)

**Wave**: E.W8 — γ.2 elegance — T-E2 (openapi-typescript codegen) + T-S3 (dispatcher retire — script + design; host execution deferred to W11).
**Closed**: 2026-05-28.
**Status**: GREEN-partial (T-E2 LIVE; T-S3 script + design landed; host-flip deferred to W11 ε.2 operational hygiene window).
**Authority**: `E.md §3` row W8; `coordination/ARCH-TRANSPOSITIONS-E.md §2 T-E2 + T-S3`.

## §1 — T-E2 openapi-typescript codegen (LIVE)

Per Wα-R2 + Wα-R3 Δ-R2.3/Δ-R3.2: replace the hand-mirrored types at `web/src/lib/types.ts` (~150 LoC; drift-prone) with **generated types** from FastAPI's OpenAPI schema. Codegen flow uses a **committed snapshot** (`api/openapi.json`) so the build does NOT depend on a live backend.

### NEW `api/openapi.json` (committed snapshot)

Generated via:
```sh
uv run --extra web python -c "
    from api.main import app; import json
    print(json.dumps(app.openapi(), indent=2, sort_keys=True))
" > api/openapi.json
```

Refresh manually when API schema changes (Pydantic model edits, router additions, response_model changes). Sort_keys=True for diff stability.

### NEW `web/scripts/gen-types.sh`

Invokes `openapi-typescript` against the snapshot to emit `web/src/lib/api-schema.d.ts`. Prepends a GENERATED header (idempotent — works on re-runs). Documents the refresh-then-regen flow.

### NEW `web/src/lib/api-schema.d.ts` (GENERATED — 2287 lines)

Contains the `paths` namespace (all routes + their request/response shapes) + the `components.schemas` namespace (all Pydantic models: Visualization, VisualizationCreate, VisualizationPatch, VisualizationListResponse, ImageMeta, ContourAsset, EpicycleData, AdminStats, AdminUserListResponse, FlaggedCursorResponse, BatchResponse, etc.).

Consumer pattern:
```typescript
import type { components } from "@/lib/api-schema";
type Visualization = components["schemas"]["Visualization"];
```

### Package wire — `web/package.json`

- New devDep: `openapi-typescript ^7.13.0`.
- New script: `gen-types`: `bash scripts/gen-types.sh`.

### `web/src/lib/types.ts` (hand-mirror) — STAYS for backward-compat

The hand-mirror types at `web/src/lib/types.ts` still exist; consumers don't break. The migration to consume `api-schema.d.ts` as the canonical source (replacing hand-mirror imports per call-site) is a bounded follow-up — recorded as E-tail. The drift class is closed STRUCTURALLY: the canonical source IS now the FastAPI Pydantic schema; consumers can migrate at leisure without changing the source-of-truth.

### Acceptance gate

`bash web/scripts/gen-types.sh` produces `web/src/lib/api-schema.d.ts` carrying the "GENERATED — do not edit" header; CI can verify drift via `bash web/scripts/gen-types.sh && git diff --exit-code web/src/lib/api-schema.d.ts`.

## §2 — T-S3 dispatcher retire (script LIVE; host execution deferred to W11)

Per Wα-R3 Δ-R3.3: T-S3 retires the host-side dispatcher (`/opt/deploy/scripts/dispatch.sh`) in favour of **per-repo webhook URLs** at `deploy.babb.dev/hooks/<repo>`. The latent-broken `mkbabb/value.js)` arm dies with the dispatcher.

### NEW `scripts/update-webhook-urls.sh`

The constellation-wide coordinator:
- DRY-RUN by default (shows the would-be PATCH actions).
- `--apply` flag performs the actual `gh api -X PATCH` for each of the 5 sibling repos.
- Repos: `mkbabb/{fourier-analysis,words,speedtest,value.js,csp-solver}`.
- Skips repos that already point at the target URL (idempotent).
- Skips repos with no deploy.babb.dev webhook (no panic; logs WARN).
- Pre-flight: `gh auth status` must pass.

The script is the binding deliverable per `Δ-R3.3`. Atomicity is per-repo (each PATCH is independent); the operator can re-run with `--apply` if any fails.

### Host-flip runbook (deferred to W11 ε.2)

The actual dispatcher retire requires host SSH + gh re-auth (current gh auth is invalid at this session). The runbook:

1. SSH to host; backup `/opt/deploy/scripts/dispatch.sh` + `/opt/deploy/hooks.json`.
2. Edit `/opt/deploy/hooks.json` to add 5 per-repo entries (each invoking that repo's own `scripts/deploy-hook.sh` with the right `working_dir`).
3. Restart webhook receiver.
4. From dev machine: `gh auth login -h github.com` to re-auth.
5. `bash scripts/update-webhook-urls.sh --apply` (flips the 5 GitHub repo webhook URLs).
6. Smoke-test each: `gh api -X POST repos/<owner>/<repo>/hooks/<id>/tests`.
7. Remove `/opt/deploy/scripts/dispatch.sh` — the latent-broken `mkbabb/value.js)` arm dies with the file.

Folded to **W11 ε.2 operational hygiene** alongside the cross-repo upstream commits + the W11 FULL rename (the operational window is the natural place for host-side coordinated changes).

## §3 — Verification

| Probe | Result |
|---|---|
| `bash web/scripts/gen-types.sh` | OK — 2287 lines emitted ✓ |
| `npm run build` (post-codegen + post-package.json) | OK — built in 2.50s ✓ |
| `bash scripts/update-webhook-urls.sh` (no args) | exits with "gh auth status failed" — pre-flight check fires correctly ✓ |
| Vite chunks unchanged | 6 chunks; index 488 kB ✓ (T-P1 holds post-W8) |

## §4 — Cross-repo source boundary upheld

This wave writes only `fourier-analysis/` paths (api/openapi.json; web/scripts/gen-types.sh; web/src/lib/api-schema.d.ts; web/package.json; scripts/update-webhook-urls.sh). Zero `value.js/` paths.

## §5 — W8 close gate

W8 closes when (a) `api/openapi.json` snapshot committed; (b) `web/scripts/gen-types.sh` runs cleanly; (c) `web/src/lib/api-schema.d.ts` generates 2000+ lines with the GENERATED header; (d) `openapi-typescript` is a devDep + `gen-types` npm script; (e) `scripts/update-webhook-urls.sh` lands with DRY-RUN + APPLY semantics; (f) host-flip runbook folded to W11 with explicit owner. All six met. **W8 is GREEN.**

## §6 — Carry-forward

- Per-call-site migration of hand-mirror imports to `api-schema.d.ts` consumers — bounded but voluminous (44 call sites in api.ts); recorded as E-tail or a fourier-F polish wave. The drift class is closed structurally at W8; the per-site adoption is decorative.
- Host-flip dispatcher retire execution — W11 ε.2.
- The `mkbabb/value.js)` arm latent-broken: documented in W1 close + dies at W11.

## §7 — What this wave IS and IS NOT

**IS**: openapi-typescript codegen flow (snapshot-based; build-time independent of live backend); per-repo webhook URL coordinator script (DRY-RUN + APPLY); design + runbook for dispatcher retire.

**IS NOT**: a per-call-site rewrite of api.ts consumers (the hand-mirror stays for backward-compat; canonical source-of-truth is now the FastAPI schema; per-site migration is a follow-up); the actual host-side dispatcher retire (operator-coordinated at W11).
