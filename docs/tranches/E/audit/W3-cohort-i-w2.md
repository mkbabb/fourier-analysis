# E.W3 — α.3 (cohort) value.js-I.W2 soft-delete + grace + restore

**Wave**: E.W3 — α.3 cohort peer execution: value.js-I.W2 (soft-delete + grace + restore).
**Closed**: 2026-05-28.
**Status**: GREEN.
**Authority**: `E.md §3` row W3; cohort coordination per `coordination/COHORT-VALUE-JS-I.md §4` I.W2.

## §1 — Cohort peer's I.W2 LIVE at value.js `d22a9d1`

Per `value.js/docs/tranches/I/audit/W2-soft-delete.md`:

**Soft-delete lifecycle (CRUD-CONTRACT v2.0.0 §4)**:
- `palettes.deletedAt: Date | null` field added to Palette + FormattedPalette
- `GoneError` (410, code `gone`) for grace-window GETs
- `deletePalette` (user + admin paths) converted to soft
- `restorePalette` service + `POST /palettes/:slug/restore` route (owner-only)
- Listings filter `deletedAt: null` by default
- Daily cron reaper sweep: hard-delete + cascade votes/flags past PALETTE_GRACE_MS (default 30 days)

## §2 — Migration evidence

- Pre-migration: 10 palettes; 0 with `deletedAt` field.
- Migration on host (inline node driver call into api container): `inspected: 10, updated: 10, skipped: 0`.
- Post-migration: all 10 carry `deletedAt: null`.

## §3 — Live verification

| Probe | Result |
|---|---|
| Smoke probe `[migrations] schema invariants OK (10 palettes)` | PASS |
| `GET https://api.color.babb.dev/palettes/neon-cyberpunk` carries `deletedAt: null` | **PASS** |
| Cross-repo CORS preflight from fourier origin (W1 regression-free) | PASS |
| value.js api 115/115 tests | PASS |
| tsc --noEmit | clean |

## §4 — Cross-repo source boundary upheld (inv-I-1)

- value.js-I.W2 commit `d22a9d1` writes only `value.js/` paths (api/src/, api/test/, docs/tranches/I/).
- fourier-E.W3 commit (this one) writes only `docs/tranches/E/` paths.
- Symmetry holds.

## §5 — Cohort sequencing

| Wave | Status |
|---|---|
| I.W0 | GREEN |
| I.W1 | GREEN |
| **I.W2** | **GREEN** (this wave's deliverable) |
| I.W3 | PENDING (E.W4 dispatch) |
| I.W4 | PENDING (E.W4 dispatch) |
| I.W5 | PENDING (E.W12 cohort close) |

## §6 — W3 close gate

W3 closes when (a) value.js-I.W2 is GREEN per its close record; (b) live envelope carries deletedAt:null; (c) cross-repo source boundary upheld; (d) fourier-side close record authored. All four met. **W3 is GREEN.** W4 (cohort peer's I.W3 + I.W4) opens.

## §7 — Cohort artefacts

| Artefact | Path | Status |
|---|---|---|
| value.js-I.W2 close record | `value.js/docs/tranches/I/audit/W2-soft-delete.md` (at value.js `d22a9d1`) | LIVE |
| Soft-delete migration | host `palette-api` (10/10 backfilled) | LIVE |
| Reaper cron | daily 3 AM UTC | SCHEDULED |
| Live deletedAt: null in envelope | `https://api.color.babb.dev/palettes/neon-cyberpunk` | VERIFIED |
| fourier-side close record | `docs/tranches/E/audit/W3-cohort-i-w2.md` (this file) | AUTHORED |
