# fourier note — value.js 2.0.0: your consumed surface is unaffected; bump the caret to receive it

**From**: value.js tranche R (R.W1, the 2.0.0 cut) · **To**: fourier-analysis web (the live value.js consumer, mid-bump to `^0.13.0` on `m/w1-bump-migration`)
**Dispatch trigger**: the R.W1 **2.0.0 publish** — this note travels with the cut (do not act on it before `@mkbabb/value.js@2.0.0` is on the registry).
**Spec of record (value.js-side)**: `docs/tranches/R/audit/coordination/COORDINATION-ANALYSIS.md` §1.2 E10 + §2.3 (the consumed-surface verification) · `letters/KF-VALUEJS-2.0.0.md` §1 (the KF-1 rename that carries the major).
**This note is self-contained** — everything fourier needs is below; the citations are provenance, not required reading.

> AUTHORED-2026-07-03 — the third R.W1.7 dispatch letter (fourier peer-floor note), per
> `COORDINATION-ANALYSIS.md` §3.2 item 3 (closes the E10 MISSING edge: fourier's `^0.13.0` caret
> silently freezes at 0.13.x and never resolves 2.0.0).

---

## §1 — What changed in 2.0.0, and why it does not touch you

value.js cut **2.0.0** at R.W1. The major is carried by three behavior-visible changes, **none**
of which is on the surface fourier consumes:

1. **The KF-1 `extractFunctions` param-descriptor rename** (`type→syntax`, `defaultValue→default`)
   plus its grammar bug-fix — this touches **only** the `@property`/CSS-Functions descriptor
   grammar (`parseFunctionParameters` / `extractFunctions`). fourier imports none of it.
2. **The gamut-policy output change** (`GAMUT_ALPHA = 1.0`) — an internal OOG-mapping constant;
   no signature change on any export.
3. **`bezierPresets` preset-row tightening** (one new row + 15 sub-JND-tightened rows) — a
   numeric refinement of the preset table, additive and name-stable.

## §2 — Your consumed surface: 2.0.0-safe, verbatim

fourier's live import sites (easing/timing, plus the M.W7-planned color surface) are **all** in
the surviving, unchanged 2.0.0 set:

| Symbol | Status under 2.0.0 |
|---|---|
| `easeInOutSine` (and the named easings / `timingFunctions`) | **unaffected** — the preset tightening touches numeric handles only; the names are stable |
| `timingFunctions` | **unaffected** — reads the unchanged `ease`×4 + `back`×3 rows |
| `mixColorsN` | **unaffected** — no signature change |
| `safeAccentColor` | **unaffected** — no signature change |
| `sampleColorRamp` | **unaffected — and already shipped** (see §3) |

**The ask**: bump `@mkbabb/value.js` `^0.13.0` → `^2.0.0` to receive 2.0.0. The current `^0.13.0`
caret will **not** resolve 2.0.0 — without the bump, fourier silently freezes at 0.13.x. There is
no code change: verify at adopt-time with `npm view @mkbabb/value.js@2.0.0` and re-run your suite.

## §3 — `sampleColorRamp` already ships — strike the M.W7 booking

M.W7 books `sampleColorRamp` "for 0.13.0" as a future consume. That premise is **stale**: the
symbol already ships in value.js (root barrel `src/index.ts`, since ≤1.2.0) and is present in
2.0.0. The M.W7 "book for 0.13.0" is therefore **dischargeable on adopt** — the moment you bump to
`^2.0.0`, `sampleColorRamp` is a live import, no wait, no producer work.

## §4 — Verification fourier can run at consume time

- `npm view @mkbabb/value.js@2.0.0 version` → `2.0.0` on the registry.
- Bump the caret, reinstall, re-run the fourier web suite — the 5 consumed symbols resolve and
  behave identically (the 2.0.0 renames never crossed the easing/timing/color surface).
- `sampleColorRamp` imports cleanly — no 0.13.0 wait remained.
