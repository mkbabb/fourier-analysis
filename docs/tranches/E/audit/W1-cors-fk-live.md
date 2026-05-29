# E.W1 — α.1 Cross-repo CORS fix + FK live + dispatcher arm

**Wave**: W1 — α.1 Cross-repo CORS fix + FK live + dispatcher arm.
**Closed**: 2026-05-28T04:53:59Z.
**Status**: GREEN.
**Authority**: `E.md §3` row W1.

## §1 — T4 — host palette-api CORS env-var fix

**Before** (host palette-api `.env`):
```
ALLOWED_ORIGINS=https://color.babb.dev
```

**After** (atomic `sed` edit; backup at `.env.bak.W1.<epoch>` on host):
```
ALLOWED_ORIGINS=https://color.babb.dev,https://fourier.babb.dev
```

**Container recreation** (not restart — the `${ALLOWED_ORIGINS:-}` interpolation only fires at create-time):
```
docker compose up -d api
  → palette-api-api-1 Recreated → Started
  → ALLOWED_ORIGINS env at runtime: https://color.babb.dev,https://fourier.babb.dev ✓
```

## §2 — Live CORS preflight verification (post-T4)

| Probe | Origin | Verdict | ACAO echo |
|---|---|---|---|
| Baseline | `https://color.babb.dev` | 204 | `https://color.babb.dev` |
| **The fix** | `https://fourier.babb.dev` | **204** | **`https://fourier.babb.dev` ✓** |
| Negative control | `https://evil.example` | 204 | `https://color.babb.dev` (first-allowed fallback; browser rejects because mismatch with `evil.example`) |

Live timestamp: 2026-05-28T04:53:48Z.

## §3 — Live FK round-trip (E.md §3 W1 binding gate)

```sh
curl -sS https://api.color.babb.dev/palettes/hey-v2-cd3e1e3b-remix-fecce815 \
    -H "Origin: https://fourier.babb.dev" -H "Accept: application/json" -D -
```

Response (2026-05-28T04:53:59Z):
- HTTP/1.1 200 OK
- `access-control-allow-origin: https://fourier.babb.dev` ✓
- `content-type: application/json` (NOT `application/problem+json` for errors — the SOTA envelopes work happens at I.W4)
- Body: `{"id":"69c4...","name":"hey v2 (remix)","slug":"hey-v2-cd3e1e3b-remix-fecce815","colors":[...],"currentHash":"6691aae4..."}`

**The `palette_slug` FK contract clause (research/README.md §R1) is now binding from both sides at the browser layer.**

## §4 — Cross-repo source boundary upheld (inv-16)

- The edit lives on the host palette-api `.env` (operator-coordinated; the host is the value.js maintainer's deploy target per `PALETTE-API-PROVENANCE.md §1.3`).
- **NO fourier-E commit touches `value.js/**`** — verified via `git status` (only fourier-analysis paths in W1's pending commits).
- The cross-app edit is recorded here for cohort coordination; if not committed upstream by the value.js maintainer (the same user) by E.W11, it carries as a cross-repo residual per `CRUD-COHESION-E.md §4`. Recommended upstream commit: update `value.js/api/.env.example` to reflect the multi-origin shape (`ALLOWED_ORIGINS=https://color.babb.dev,https://fourier.babb.dev`) — this is value.js-I scope, not fourier-E.

## §5 — Dispatcher arm decision (T-S3 starts at W1; lands at W8)

Per `E.md §5` Critical files: "Dispatcher arm fix/retire (α.1 + γ.2) | W1 + W8".

The Wχ-P2 KISS-score probe verdict: **T-S3 RETIRE is REDUCE clearly** (one indirection layer gone; the latent-broken `mkbabb/value.js)` arm dies with the file). The Wα-R3 + Wχ delta: constellation-wide coordination cost requires a `scripts/update-webhook-urls.sh` script atomically registering 5 per-repo webhook URLs (Δ-R3.3).

**W1 decision**: **RETIRE at W8.** The dispatcher arm is NOT fixed at W1; the W8 retire makes the arm's brokenness moot.

**Inheritance to W8:**
- The 5 GitHub repo webhook URLs to update: `mkbabb/fourier-analysis`, `mkbabb/words`, `mkbabb/speedtest`, `mkbabb/value.js`, `mkbabb/csp-solver` (all confirmed in D.W11 close record).
- The host's webhook receiver `hooks.json` to add 5 per-repo entries (one per `<repo>` slug at `deploy.babb.dev/hooks/<repo>`).
- The constellation-coord script `scripts/update-webhook-urls.sh` lands at W8.

## §6 — Cohort sequencing — W2 unblocked

E.W1 binding gate (live CORS preflight + FK 200) is GREEN. **value.js-I.W0 + I.W1 may open** (E.W2 dispatch).

The cross-repo source boundary holds: the value.js-I work happens at `/Users/mkbabb/Programming/value.js` (a separate repo); fourier-E.W2 close record will reference the value.js-I.W0 commit by SHA but will NOT write to `value.js/**` (per E.md §2 cross-repo source boundary invariant).

## §7 — Adversarial observations (for future tightening)

1. **The cors.ts fallback policy**: when an unauthorized origin requests, the middleware returns the FIRST allowed origin (`https://color.babb.dev`) as ACAO. Browser-side enforcement (origin-vs-ACAO mismatch) still rejects, but classic-strict CORS would omit ACAO entirely. This is value.js-I scope (a B0 hardening per Wχ-P5), not fourier-E. Recorded for I.W4 SOTA envelope cleanup.
2. **The host `.env` is not version-tracked**. The W1 edit is operator-coordinated; the rollback (revert to `.env.bak.W1.<epoch>`) is manual. The auto-migration invariant (E.W9) does NOT cover `.env` changes. Recorded as ε.2-W11 operator residual.

## §8 — W1 close gate

W1 closes when (a) T4 CORS env var live + verified; (b) live FK round-trip 200 + ACAO echoes fourier; (c) negative control rejects unauthorized origin (browser-level); (d) T-S3 decision recorded (RETIRE at W8); (e) cross-repo source boundary upheld (no `value.js/**` write in W1 fourier-E commit).

All five conditions met. **W1 is GREEN.** W2 opens.

## §9 — Commits + artefacts

| Artefact | Where | Status |
|---|---|---|
| Host `.env` T4 edit | `mbabb@34.197.214.67:/home/mbabb/Programming/palette-api/.env` | LIVE |
| Container recreation | `palette-api-api-1` recreated 2026-05-28T04:53Z | HEALTHY |
| Live preflight evidence | §2 above (4 curls; timestamps recorded) | CAPTURED |
| FK live round-trip evidence | §3 above (200 + envelope) | CAPTURED |
| T-S3 retire decision | §5 above (lands W8) | RECORDED |
| W1 close record | `docs/tranches/E/audit/W1-cors-fk-live.md` (this file) | AUTHORED |
