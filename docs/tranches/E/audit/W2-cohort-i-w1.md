# E.W2 — α.2 (cohort) value.js-I open + I.W1 visibility split

**Wave**: E.W2 — α.2 cohort peer execution: value.js-I.W0 + I.W1.
**Closed**: 2026-05-28.
**Status**: GREEN.
**Authority**: `E.md §3` row W2; cohort coordination per `coordination/COHORT-VALUE-JS-I.md §4`.

## §1 — Cohort peer status

The user's 2026-05-28 directive ("fix our cross repos") opens value.js-I as the cohort peer to fourier-E. The cross-repo source boundary (inv-16 + Wχ-P3.C4) is preserved: fourier-E.W2 records the cohort peer's progress but writes NO `value.js/**` paths in this fourier-side commit.

**value.js-I.W0 + I.W1 landed at value.js commit `f3a67a9`** (post-H baseline `f895048` + tranche-I).

## §2 — I.W0 (cohort peer's open ceremony)

Per `value.js/docs/tranches/I/audit/W0-open.md`:

- value.js-I tranche docs landed (`I.md`, `PROGRESS.md`, audit/)
- Operational baseline:
  - `api/deploy.sh` SERVER: `mbabb@mbabb.fridayinstitute.net` (NXDOMAIN) → `mbabb@34.197.214.67` (AWS EC2 host; matches all `*.babb.dev` CNAMEs)
  - `api/deploy.sh` smoke probe URL: `https://mbabb.fi.ncsu.edu/colors/` (pre-D.W10 VPN) → `https://api.color.babb.dev/palettes` (live constellation)
  - `api/.env.example` ALLOWED_ORIGINS: now multi-origin (`color.babb.dev,fourier.babb.dev`) — the source-tracked spec mirror of the W1 host-side T4 edit

The cohort handshake substrate: fourier-E.W1 landed the live CORS env (host-side); value.js-I.W0 lands the source-tracked mirror. Honest cohort coordination; no half-state.

## §3 — I.W1 (cohort peer's visibility split — the binding W2 deliverable)

Per `value.js/docs/tranches/I/audit/W1-visibility-split.md`:

**State-machine: 4-state `status` → 9-tuple (visibility × tier).**

| Legacy `status` | `visibility` | `tier` |
|---|---|---|
| `published` | `public` | `standard` |
| `featured` | `public` | `featured` |
| `hidden` | `unlisted` | `standard` |
| `draft` | `private` | `standard` |

**Migration** (one-off via inline node driver call into host's api container):
- Inspected: 10; Updated: 10; Skipped: 0; Unmapped: 0.

**Post-migration data shape**: byVisibility: all 10 `public`; byTier: 9 `standard` + 1 `featured`.

**Source edits** (value.js side): 12 files across `api/src/`, `api/test/`, `demo/@/components/`, `demo/@/composables/`, `demo/@/lib/palette/types.ts`.

**Operational hardening sub-deliverable** (surfaced at deploy-time): 8 pre-D.W2-vintage seed palettes (Sunset Blaze, Ocean Depths, Neon Cyberpunk, Forest Canopy, Lavender Dreams + 3 user palettes) had missing chronic-deferred invariant fields (tags/forkCount/currentHash/userSlug/voteCount/oklabColors/...). The smoke-probe extension surfaced this immediately + the in-place `$ifNull` backfill discharged it. This is itself one of EA2's named chronic-deferred items now closed (the "data hygiene at the edge" lesson).

**Live verification**:
- `GET /palettes/neon-cyberpunk` → `status=featured`, `visibility=public`, `tier=featured` ✓
- `GET /palettes/sunset-blaze` → `status=published`, `visibility=public`, `tier=standard` ✓
- Cross-repo CORS preflight from `Origin: https://fourier.babb.dev` → `acao: https://fourier.babb.dev` (W1 regression-free post-W2 deploy)
- Container health: `(healthy)` post-restart; smoke probe `[migrations] schema invariants OK (10 palettes)`
- `pnpm test`: 115/115 PASS; `tsc --noEmit`: clean

## §4 — Cross-repo source boundary verified

```sh
# At value.js commit f3a67a9:
git log --name-only f895048..f3a67a9 | grep -E "^fourier-analysis/" | wc -l
# 0 — value.js-I commits write zero fourier paths
```

Symmetrically: fourier-E.W2 commit (this one) writes ONLY `docs/tranches/E/audit/W2-cohort-i-w1.md` + `docs/tranches/E/PROGRESS.md` (no value.js paths).

## §5 — Cohort sequencing

Per `E.md §3` W3 + W4: subsequent waves are E.W3 (I.W2 soft-delete) → E.W4 (I.W3 + I.W4 SOTA envelopes). The cohort peer state at this commit:
- I.W0: GREEN (open + ops)
- I.W1: GREEN (visibility split + tier + migration; smoke probe extended)
- I.W2: PENDING (E.W3 dispatch)
- I.W3: PENDING (E.W4 dispatch)
- I.W4: PENDING (E.W4 dispatch)
- I.W5: PENDING (cohort closure at E.W12)

The cohort peer + the parent tranche advance in lockstep at the wave boundary.

## §6 — W2 close gate

W2 closes when (a) value.js-I.W0 + I.W1 are GREEN per their close records; (b) the cohort handshake is verified (CORS + FK live + multi-origin in .env.example); (c) live envelope carries visibility + tier; (d) cross-repo source boundary upheld; (e) fourier-side close record authored. All five conditions met. **W2 is GREEN.** W3 (cohort peer's I.W2 soft-delete) opens.

## §7 — Cohort artefacts

| Artefact | Path | Status |
|---|---|---|
| value.js-I.W0 close record | `value.js/docs/tranches/I/audit/W0-open.md` (at value.js `f3a67a9`) | LIVE |
| value.js-I.W1 close record | `value.js/docs/tranches/I/audit/W1-visibility-split.md` (at value.js `f3a67a9`) | LIVE |
| Live visibility+tier in `/palettes/{slug}` | `https://api.color.babb.dev/palettes/neon-cyberpunk` | VERIFIED |
| Smoke probe at startup | `value.js/api/src/migrations/check.ts` extended | LIVE GREEN |
| fourier-side close record | `docs/tranches/E/audit/W2-cohort-i-w1.md` (this file) | AUTHORED |
