# F-T-N1 — coordination ASK: drop the legacy `status` field from `FormattedPalette`

**Status**: authored 2026-05-29 (fourier-F thread ε, wave W7 — the transposition wave, F-T-N1 ONLY per Wχ-P4). **Kind**: cross-repo coordination note — an **ASK**, not a fourier-F commit. **Owner of the source change**: the value.js maintainer. **Source**: FA5 §1 row F-T-N1 + §2 (`docs/audits/runs/2026-05-28-F-audit/FA5-architectural-transpositions.md`). **Boundary**: inv-16 (cross-repo source boundary) is load-bearing — **no fourier-F commit touches `value.js/**`.**

## §0 — The ASK in one sentence

Drop the legacy `status` field from value.js's `FormattedPalette` type and its formatter as a paired demo PR, committed by the value.js maintainer; fourier-F authors this note and commits nothing in value.js.

## §1 — The finding

`value.js/api/src/format/palette.ts` (the `FormattedPalette` type at `:26-29` and the `formatPalette()` formatter at `:81`) still carries a `status` field whose own source comment declares it "Retained for backward-compat during I.W1 transition; drop at I.W4." That deadline has passed — value.js-I closed its W1–W4 cohort (the 53-cell CRUD-cohesion matrix complete per project memory; value.js-I FINAL at HEAD `2fefe5e`). The field is therefore **vestigial**: a documented-as-temporary compatibility shim outliving the transition it was minted for, which is precisely the NO-legacy posture (A-Inv 3 / inv-20) forbids.

The replacement, `tier`, is already produced by the formatter. Every demo consumer already reads through a `palette.tier ?? palette.status` fallback whose **left operand wins** — `useAdminUsers.ts:87,91`, `PaletteCardMenu.vue:131,133`, `PaletteCard.vue:37`. The right-hand `status` branch is dead: it cannot be reached while `tier` is non-null, and `tier` is canonical and always emitted. The field costs one serialised field on every palette response, plus the standing lie that a "temporary" shim is still in force.

## §2 — Why this is a value.js-maintainer-owned commit (inv-16)

`FormattedPalette` and `formatPalette()` live entirely inside `value.js/api/src/format/palette.ts`; the demo call-sites live inside `value.js/demo/**`. Both surfaces are value.js source. Under inv-16 — the cross-repo source boundary — fourier-F commits do not touch `value.js/**`, and value.js commits do not touch fourier. The contract seam (documentary) is the only coupling. fourier-F therefore raises the ASK and records it; the value.js maintainer (the same operator) commits the source drop in the value.js repo, on the value.js side, under value.js's own tranche discipline. fourier-F's role begins and ends with this note.

## §3 — The exact surface

| Surface | Location | Change |
|---|---|---|
| Type declaration | `value.js/api/src/format/palette.ts:26-29` | Remove the `status` field from `FormattedPalette`. |
| Formatter | `value.js/api/src/format/palette.ts:81` | Remove the `status` assignment from `formatPalette()`'s returned object. |
| Demo consumer | `value.js/demo/@/lib/.../useAdminUsers.ts:87,91` | Collapse `palette.tier ?? palette.status` → `palette.tier`. |
| Demo consumer | `value.js/demo/.../PaletteCardMenu.vue:131,133` | Collapse the same fallback → `palette.tier`. |
| Demo consumer | `value.js/demo/.../PaletteCard.vue:37` | Collapse the same fallback → `palette.tier`. |

(Line numbers per the FA5 §2 snapshot; the value.js maintainer confirms against the live value.js tree at commit time.)

## §4 — Acceptance shape

The ASK is discharged on the value.js side when:

1. `formatPalette()` returns an object carrying **no `status` key** (verified by a unit assertion on the formatted shape).
2. The three `(palette.tier ?? palette.status)` expressions in the demo collapse to `palette.tier` — the dead right-hand branch is gone, not merely unreached.
3. `grep -n "status" value.js/api/src/format/palette.ts` returns zero on the `FormattedPalette` / `formatPalette` surface.
4. Demo TypeScript compile is green and the demo e2e suite is green (the field's removal is consumer-observable only through the fallback, which now has nothing to fall back to).
5. The drop ships as a **single paired demo PR** (type + formatter + the three call-sites together), so no intermediate commit serves `tier` while a consumer still reads `status`.

## §5 — fourier-F's commitment

fourier-F commits **no value.js source**. This note is the entire fourier-F deliverable for F-T-N1. At F close it is recorded as a **named cross-repo residual, maintainer-owned** (per `F.md §9` cross-repo ASK-only discipline), alongside the other ASK-only touchpoints (csp-solver route registration; floridify Mongo-bind; glass-ui substrate carries). The residual is satisfied by the value.js-side PR, on value.js's own ledger — not by any fourier commit.
