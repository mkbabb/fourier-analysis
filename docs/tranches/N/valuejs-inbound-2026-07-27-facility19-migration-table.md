# value.js → fourier · FACILITY 19 `library-surface`: the one-way correspondence ledger, its law, and the ten-row migration table

**Provenance.** value.js mega-tranche, library band (M-12 tri-fold: four independent Opus sweeps →
a Fable design and an Opus design, blind to each other → a Fable arbiter who re-measured every
decisive number before adopting it; two of the arbiter's own first readings were false and are
recorded as such). Full adjudication:
`value.js/docs/tranches/V/megatranche/registry/adjudicated/library-band.md` — §2 RD-7/RD-8, §4 wave
W.L5. Session 2026-07-27 · node v26.0.0 · darwin arm64 · value.js `tranche-u` @ `c654824e`.

**What this letter is.** A **log**, per the isomorphism law itself — not an ask. The value↔fourier
edits it describes land in our wave **W.L5**, on our side, under the standing **D-15 direct-edit
grant**; you are not being asked to edit anything. The law below obliges the *contract* to record a
change of this kind at the moment it is made, so here it is, recorded. Nothing in it asks you to
change your cadence or your posture.

---

## §1 — The defect this closes

D-15 ratified full isomorphism between value's `/api` and fourier's API. The ratified contract
(`API-FACILITY-ISOMORPHISM.json`, 18 facilities / `counts.total` 146) contains the string
`value.js` **zero times** — substring scan also negative on `easing`, `npm`, `library`, `subpath`,
`parseCss`. Meanwhile the only value↔fourier coupling that actually exists in the trees is a
**library** coupling, and at HEAD every strand of it is broken (§3). A ratified isomorphism that
does not name the one real coupling is a contract with a hole in it.

## §2 — The law of facility 19 (binding text)

The isomorphism is **extended, not reinterpreted**: a nineteenth facility, `library-surface`.

Both designs proposed it; they disagreed on its law, and the disagreement was ruled (RD-8). One
wanted the same bidirectional law the 18 HTTP facilities carry. That was **declined**, for a reason
worth stating plainly: **fourier is an application, not a mirror.** Obliging you to publish a
mirrored library surface would be isomorphism in name only. The adopted law:

> Every symbol fourier imports from `@mkbabb/value.js` appears **exactly once**, with its subpath,
> its status against the shipped version, and the fourier obligation it discharges. **Direction:
> one-way** (value publishes, fourier consumes). **Completeness: bidirectional** — no unlisted
> import, and no listed symbol without a consumer.

One-way in direction, complete in both — which is what makes it a ledger rather than a wish.

**`counts` gets an honesty repair in the same commit.** The existing `counts` block is annotated
**`as-specified`** and gains an **`as-built`** sibling census *with its command*, so no later close
can cite a target as a measurement:

```sh
cd ~/Programming/fourier-analysis && grep -rnE '@router\.(get|post|patch|put|delete)' api/routers/*.py | wc -l
```

→ **30** at HEAD, re-measured by the arbiter. The contract says **41**. The census records 30 and
names 41 as the specification it is measured against. **This is a record-only correction; it is not
a finding against your API** — it is our contract that was stale. A bank fires and the census
re-runs whenever that count leaves 30.

## §3 — The measured state of the coupling (three born-RED probes)

| probe | result |
|---|---|
| `fourier-value-import-drift.mjs` | **RED 3/3 legs** |
| `fourier-vizcolor-oklch.mjs` | **RED 5/6** |
| `consumer-surface-compile.mjs` (LEG2) | **RED** |

**Leg 1 — the root specifier is gone.** value.js 4.0.0 publishes **7 subpaths and no `.` key, no
`main`, no `module`** (confirmed by `require('./package.json')`). All **5** of your bare-specifier
sites therefore hit `ERR_PACKAGE_PATH_NOT_EXPORTED`: `web/src/lib/easings.ts:9` and `:16`,
`ConvergencePlot.vue:5`, `useCurveTransition.ts:8`, `harmonics.ts:5`. Pin: `web/package.json:18`
`^0.13.0`, installed `0.13.0`.

**Leg 2 — `timingFunctions` is deleted** (0 occurrences in 4.x `src/`). Your `easings.ts:9` import
and the `Object.fromEntries` construction at `:55-58` depend on it.

**Leg 3 — 8 of 22 easing names change shape between 0.13.0 and 4.0.0**, re-derived independently
over 1001 samples against your installed 0.13.0 dist and reproduced exactly:
`ease-out-circ` **1.923e-1** · `ease-in-expo` 6.930e-2 · `ease-in-circ` 4.489e-2 · `ease-in-quad`
4.157e-2 · `ease-in-cubic` 3.162e-2 · `ease-out-sine` 3.082e-2 · `ease-in-sine` 3.038e-2 ·
`ease-out-quad` 2.520e-2. Root cause read at our `src/easing.ts:94-132` (`DIRECT_EASINGS` kept only
the in-out arms) + `:166-171` (everything else falls through to the bezier `PRESETS`). *(Correction
to an earlier reading in our own sweep: 0.13.0's `timingFunctions` has **55** keys, not 56.)*

**The colour probe — four series painting the same grey.** Four of five `--viz-*` tokens are
`oklch()` in the glass-ui **4.0.0** you have installed (`--viz-fourier: oklch(0.579 0.201 30.4)` at
`dist/styles/tokens/color-radius.css:263`; the dark arm `oklch(0.693 0.151 28.1)` at
`tokens/dark-arm.css:113`). `cssVarToHex` (`web/src/lib/colors.ts:22-53`) has four arms — hex,
`hsl()`, bare-HSL triplet, `rgb()` — and **no oklch arm**, so it returns `"#888888"` at `:52`.
Result: `VIZ_COLORS.fourier === VIZ_COLORS.chebyshev`, and Fourier, Chebyshev, Legendre and the
green axis all paint the same grey. The local override at `web/src/style.css:113-125` covers
`--viz-amber` only, and its comment still asserts an `hsl(35 70% 42%)` glass no longer ships.

## §4 — The ten-row migration table (facility 19's payload)

Every STATUS cell measured against `dist/` at 4.0.0. Rulings applied.

| # | symbol (subpath) | status at 4.0.0 | disposition / fourier obligation |
|---|---|---|---|
| **I-1** | the entry point | **7 subpaths; no `.`, no `main`, no `module`** | **The bare specifier stays retired (D-1)** — no shim, no reversal. The contract names the subpath per consumer; the 5 sites migrate to `@mkbabb/value.js/easing`. |
| **I-2** | `timingFunctions` (`./easing`) | **DELETED** | **Not restored.** A resolver is the right shape; the consumer needs I-3 instead. `easings.ts:9` + `:55-58` retire onto I-3 + I-4, **with the name mapping recorded** rather than assumed. |
| **I-3** | `easingNames()` (`./easing`) | **ABSENT** | **SHIPS in 4.1.** Lets fourier enumerate instead of hard-coding a 22-key label table that can silently desync. |
| **I-4** | `easing(name)` (`./easing`) | EXISTS (`src/easing.ts:166`) — **and throws on 5 prototype keys** | Resolves all 22 names. **RULED: the analytic in/out arms are RESTORED** (not marked) — an `approximated: boolean` discriminant was proposed and **declined**, because a discriminant canonises the wrong curve under a label instead of curing it. Leg 3 closes; acceptance is that the restored arms match 0.13.0 to `<1e-3`. Our wave W.L1 (parse-derived-key totality) lands **first**. |
| **I-5** | `parseCssColor` (`./css`) | EXISTS — **throws** (MT-F024 / MTS-01, and a second prototype-key class) | Replaces your `hsl()`/`rgb()` regex arms. Gated behind W.L1 + the parser band. |
| **I-6** | `toHex` (`./color`) | **ABSENT** | **SHIPS in 4.1.** This is *the* gap for the colour arm: `serializeCssColor` emits `"oklch(57.9% 0.201 30.4deg)"` (verified) and `VIZ_COLORS` is a hex store with ~50 read sites. Two hand-rolled hex implementations were measured across the constellation, which is what earned it the cut. |
| **I-7** | `convertColor` (`./color`) | EXISTS | Verified live: oklch → `{rgb, [215.046…, 53.132…, 34.985…], 1}`. |
| **I-8** | `toRgba8` (`./color`) | EXISTS — **options bag required** | Replaces `hexToRgb`/`hexToRgba`. Omitting `{gamut:"clip"}` returns `color_invalid_input` — verified. **Documented, not changed**; the requirement is deliberate. |
| **I-9** | `resolveCssColor` (`./css`) | **ABSENT** | **DECLINED for 4.1, with a runnable re-trigger.** Context-free parsing in value.js, context resolution in the consumer that owns the DOM, is the honest boundary — `color_context_required` is the API saying exactly that. **You own the DOM read and the theme observer**, so `var(--…)` and `light-dark(…)` resolve on your side, correctly, at 4.0.0. The re-trigger is a grep for a **second** hand-rolled context-resolution arm anywhere in the constellation; a second one re-opens the question at the next cut. *(This was the arbiter's closest call and it reverses cheaply.)* |
| **I-10** | ONE failure contract | **two shapes ship side by side** — `parseCssColor` failure carries `diagnostics[]` and **no `error` key**; `easing`/`convertColor`/`toRgba8` failures carry `error.code` | **RULED: `ParseResult` for text→AST; `Result` for value→value — declared per boundary, never unified.** Written **into the contract**, not changed in code: TypeScript already catches the confusion, and unifying would be a breaking change for an ergonomics gain. |

## §5 — What W.L5 lands on the fourier side, and the one declared residual

Under the D-15 grant, in our wave, with your tree's probes as the born-RED witness:

1. **The five specifiers migrate** to `@mkbabb/value.js/easing`; `timingFunctions` → `easingNames()`
   + `easing(name)`, the name mapping recorded; the pin at `web/package.json:18` bumps.
2. **`cssVarToHex`, `hslToHex`, `rgbToHex`, `hexToRgb`, `hexToRgba` (`colors.ts:22-117`) are
   DELETED** — not extended with an oklch arm. The replacement is fourier-side context resolution
   (you own the DOM read + theme observer) → `parseCssColor` → `convertColor(c,"rgb")` → **a
   declared 3-line local hex formatter**.
3. **THE DECLARED RESIDUAL.** That 3-line hex formatter is a *declared divergence row*, written down
   as a residual at the moment it is created, **and deleted at fourier's adoption of value.js
   4.1**, when `toHex` (I-6) makes it redundant. It has a deletion date because it is booked as a
   residual, not as a design. This is the one piece of hand-rolled colour code the wave deliberately
   leaves standing, and it is 3 lines with an expiry.
4. **Facility 19 is written** under §2's law, populated from §4's table, with the `as-specified` /
   `as-built` counts annotation.

**Sequencing, ruled (RD-7): the colour arm is order-independent of the 4.1 cut.** It was proposed to
sequence it *after* the cut; that was declined, because booking a fix behind a cut that can decline
to close is the deferral shape — and with I-9 declined, that sequencing would never have unblocked
the `var()`/`light-dark()` half at all. Whichever lands first, the drifted curves of leg 3 are
either a probe-pinned declared divergence row or already restored.

**The receipt.** One headed capture only (probe parsimony), plus a before/after convergence-plot pair
in light and dark, committed: the delta is **four grey curves → four distinct hues**.

---

*Sent by the value.js mega-tranche, 2026-07-27. Reply folds per E13; queued work, never an
interruption.*
