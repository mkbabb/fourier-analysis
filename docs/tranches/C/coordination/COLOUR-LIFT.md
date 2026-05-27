# C — colour-lift coordination (the inverted cross-repo edge)

**Status**: latent, conditional, user-re-mandate-gated on the value.js side. **Authored**: 2026-05-27 (the C-development audit, `docs/audits/runs/2026-05-27-C-audit/{CA3,CA4}.md`). **Authority**: this doc records the cross-repo ask; the disposition is `C.md §7` (cross-repo debt) + thread δ / W4.

## §1 — What this is

B's §1 thesis bullet 2 — "the colour/palette domain model moves to where it belongs, value.js, the library" — was deferred under the orphan verdict (value.js-C RETIRED) with destination `fourier-tranche-C-or-successor`. The C-development audit resolved it: the lift is **much narrower than the original framing**, and the cross-repo **edge inverts**.

## §2 — The KISS verdict (CA4)

| Surface | Audit finding | Disposition |
|---|---|---|
| `web/src/lib/colors.ts` (117 L) | **0 domain symbols** — brand tokens (`VIZ_COLORS`, `STATIC`), DOM-bound resolvers (`cssVarToHex`, `resolveVizColors`), hot-path hex helpers, + 2 dups of value.js's `parseCSSColor`/`color2` | **stays in fourier** (it is application colour-choice, not domain); the 2 dups may delete onto value.js's existing primitives — a fourier-internal cleanup, no cross-repo dependency |
| `web/src/lib/easings.ts` `generateCurveSVGPath(fn, n)` | the **1 genuine domain symbol** — a generic curve→SVG-path sampler | **lift to value.js** as `sampleToSVGPath(fn, n)` in `src/math.ts`, generalising the existing `cubicBezierToSVG` (`math.ts:69`) |
| `Palette` domain type + `colorScale(stops, t)` | real domain modelling, but **fourier has no gradient/scale consumer** (`VIZ_COLORS.rainbow` is never sampled) | **held latent** — building it is the rejected "library nobody calls" anti-pattern; `CRUD-CONTRACT §9` already records "0 library". Build when a real fourier consumer (a gradient/scale UI) lands |

## §3 — The inverted edge

- **Original B edge** (severed): `fourier-B.W4 → value.js-C.W1 published` — fourier *consumed* a value.js publish that never came (value.js-C RETIRED).
- **New C edge** (latent, conditional): `value.js-<tranche>.W_x (publishes sampleToSVGPath) → fourier-C.W4-δ (consumes)`. value.js *authors*; fourier *consumes*. The narrow function is the only cross-repo deliverable.

## §4 — The value.js side (not authored here)

fourier-C does **not** author value.js's tranche. Per `CA3`: value.js-H is closed (v0.10.0, `16129e0`); its `I-SEED.md` declares an OPEN thesis with no colour reference, so this lift cannot side-fold into I as authored — it needs a **forward-themed I** or a **dedicated value.js tranche**, gated on a value.js user re-mandate. The minimal-honest value.js deliverable is **a single function** (`sampleToSVGPath` in `src/math.ts`) + its vitest spec + a patch publish. The richer `Palette`/`colorScale`/`src/palette/` domain module is a separate, later thesis (CA3's sketched I.W1–W5 wave-set applies only if the user mandates the *full* lift).

**The ask, recorded for value.js**: when a value.js tranche opens that touches `src/math.ts`, generalise `cubicBezierToSVG` into a public `sampleToSVGPath(fn: (t: number) => [number, number], n: number): string` and publish it. fourier-C.W4-δ consumes it on the next `@mkbabb/value.js` bump.

## §5 — fourier-C's disposition (thread δ)

- **W4-δ is conditional**: iff `sampleToSVGPath` is published in the consumed `@mkbabb/value.js` by W4 dispatch, `easings.ts`'s internal sampler swaps onto it (the internal dup collapses; `easings.ts` keeps its fourier-specific easing presets per invariant 15 — domain machinery in the library, application choices in the app).
- **Otherwise**: W4 lands thread γ (the slug-identity discharge) only; the `sampleToSVGPath` consume holds as a named residual carried to a fourier successor — never silent.
- **The `Palette`/`colorScale` latent affordance** is not built in C under any branch (CA4 KISS guard; invariant 15 + the library-nobody-calls anti-pattern).

## §6 — Invariant compliance

- **Invariant 15** (domain model in the library, persistence/application in the app): the narrow lift moves *domain machinery* (`sampleToSVGPath`) to value.js while fourier keeps *application choices* (`VIZ_COLORS`, easing presets). Compliant. Building `Palette` *in fourier* would violate it — hence held latent, not annexed.
- **Invariant 16** (no framework-in-disguise): `sampleToSVGPath` is a pure called-from function, no control inversion. Compliant.
